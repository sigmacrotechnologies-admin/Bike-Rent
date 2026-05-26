import Razorpay from 'razorpay';
import Stripe from 'stripe';
import crypto from 'crypto';
import Payment from '../../models/Payment.js';
import Invoice from '../../models/Invoice.js';
import Booking from '../../models/Booking.js';
import { config } from '../../config/index.js';
import { NotFoundError, ValidationError } from '../../utils/AppError.js';
import { PAYMENT_STATUS, PAYMENT_PROVIDER, BOOKING_STATUS, WALLET_TX_TYPE } from '../../utils/constants.js';
import walletService from '../wallet/wallet.service.js';
import vehicleRepository from '../vehicles/vehicle.repository.js';

const getRazorpay = () => {
  if (!config.razorpay.keyId) return null;
  return new Razorpay({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret });
};

const getStripe = () => {
  if (!config.stripe.secretKey) return null;
  return new Stripe(config.stripe.secretKey);
};

class PaymentService {
  async initiatePayment(userId, { bookingId, provider }) {
    const booking = await Booking.findById(bookingId).populate('vehicle');
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.user.toString() !== userId.toString()) {
      throw new ValidationError('Booking does not belong to user');
    }
    if (booking.status !== BOOKING_STATUS.PENDING) {
      throw new ValidationError('This booking has already been paid or is no longer pending');
    }

    const vehicleId = booking.vehicle._id || booking.vehicle;
    const available = await vehicleRepository.checkAvailability(
      vehicleId,
      booking.startDate,
      booking.endDate,
      bookingId
    );
    if (!available) {
      throw new ValidationError('Vehicle is no longer available for the selected dates');
    }

    const amount = booking.pricing?.totalAmount;
    if (!amount || amount <= 0) {
      throw new ValidationError('Invalid booking amount');
    }

    if (provider === PAYMENT_PROVIDER.WALLET) {
      return this.payWithWallet(userId, booking, amount);
    }

    const payment = await Payment.create({
      booking: bookingId,
      user: userId,
      amount,
      provider,
      status: PAYMENT_STATUS.PENDING,
    });

    if (provider === PAYMENT_PROVIDER.RAZORPAY) {
      const razorpay = getRazorpay();
      if (!razorpay) throw new ValidationError('Razorpay not configured');

      const order = await razorpay.orders.create({
        amount: amount * 100,
        currency: 'INR',
        receipt: payment._id.toString(),
      });

      await Payment.findByIdAndUpdate(payment._id, { providerOrderId: order.id });
      return { paymentId: payment._id, orderId: order.id, amount, currency: 'INR', provider: 'razorpay' };
    }

    if (provider === PAYMENT_PROVIDER.STRIPE) {
      const stripe = getStripe();
      if (!stripe) throw new ValidationError('Stripe not configured');

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'inr',
            product_data: { name: `Booking ${booking.bookingNumber}` },
            unit_amount: amount * 100,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${config.appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
        cancel_url: `${config.appUrl}/payment/cancel`,
        metadata: { paymentId: payment._id.toString(), bookingId },
      });

      await Payment.findByIdAndUpdate(payment._id, { providerSessionId: session.id });
      return { paymentId: payment._id, sessionId: session.id, url: session.url, provider: 'stripe' };
    }

    throw new ValidationError('Invalid payment provider');
  }

  async payWithWallet(userId, booking, amount) {
    const wallet = await walletService.getOrCreateWallet(userId);
    if (wallet.balance < amount) {
      throw new ValidationError(
        `Insufficient wallet balance. Available: ₹${wallet.balance}, Required: ₹${amount}`
      );
    }

    const payment = await Payment.create({
      booking: booking._id,
      user: userId,
      amount,
      provider: PAYMENT_PROVIDER.WALLET,
      status: PAYMENT_STATUS.PENDING,
    });

    try {
      await walletService.debit(userId, amount, {
        type: WALLET_TX_TYPE.PAYMENT,
        description: `Booking payment ${booking.bookingNumber}`,
        referenceType: 'booking',
        referenceId: booking._id,
      });

      await this._completePayment(payment, `wallet_${Date.now()}`);

      const confirmedBooking = await Booking.findById(booking._id);
      return {
        paymentId: payment._id,
        amount,
        currency: 'INR',
        provider: 'wallet',
        bookingId: booking._id,
        bookingNumber: booking.bookingNumber,
        status: BOOKING_STATUS.CONFIRMED,
        booking: confirmedBooking,
      };
    } catch (err) {
      await Payment.findByIdAndDelete(payment._id);
      throw err;
    }
  }

  async verifyRazorpayPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature) {
      throw new ValidationError('Invalid payment signature');
    }

    const payment = await Payment.findOne({ providerOrderId: razorpay_order_id });
    if (!payment) throw new NotFoundError('Payment not found');

    return this._completePayment(payment, razorpay_payment_id);
  }

  async verifyStripePayment(sessionId) {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') throw new ValidationError('Payment not completed');

    const payment = await Payment.findById(session.metadata.paymentId);
    if (!payment) throw new NotFoundError('Payment not found');

    return this._completePayment(payment, session.payment_intent);
  }

  async _completePayment(payment, providerPaymentId) {
    await Payment.findByIdAndUpdate(payment._id, {
      status: PAYMENT_STATUS.COMPLETED,
      providerPaymentId,
    });

    await Booking.findByIdAndUpdate(payment.booking, {
      status: BOOKING_STATUS.CONFIRMED,
      payment: payment._id,
    });

    const booking = await Booking.findById(payment.booking);
    if (booking?.vehicle) {
      await vehicleRepository.syncVehicleStatus(booking.vehicle);
    }

    const invoiceNumber = `INV-${Date.now()}`;
    await Invoice.create({
      invoiceNumber,
      booking: payment.booking,
      payment: payment._id,
      user: payment.user,
      subtotal: payment.amount,
      total: payment.amount,
      items: [{ description: 'Vehicle Rental', quantity: 1, unitPrice: payment.amount, amount: payment.amount }],
    });

    return Payment.findById(payment._id).populate('booking');
  }

  async refundPayment(paymentId, reason, amount = null) {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new NotFoundError('Payment not found');
    if (payment.status !== PAYMENT_STATUS.COMPLETED) {
      throw new ValidationError('Payment cannot be refunded');
    }

    const refundAmount = amount || payment.amount;

    if (payment.provider === PAYMENT_PROVIDER.RAZORPAY && payment.providerPaymentId) {
      const razorpay = getRazorpay();
      await razorpay.payments.refund(payment.providerPaymentId, { amount: refundAmount * 100 });
    }

    if (payment.provider === PAYMENT_PROVIDER.STRIPE && payment.providerPaymentId) {
      const stripe = getStripe();
      await stripe.refunds.create({ payment_intent: payment.providerPaymentId, amount: refundAmount * 100 });
    }

    const isFullRefund = refundAmount >= payment.amount;
    await Payment.findByIdAndUpdate(paymentId, {
      status: isFullRefund ? PAYMENT_STATUS.REFUNDED : PAYMENT_STATUS.PARTIALLY_REFUNDED,
      refundAmount,
      refundReason: reason,
      refundedAt: new Date(),
    });

    return Payment.findById(paymentId);
  }
}

export default new PaymentService();

import Booking from '../../models/Booking.js';
import BookingHistory from '../../models/BookingHistory.js';
import Coupon from '../../models/Coupon.js';
import Vehicle from '../../models/Vehicle.js';
import Invoice from '../../models/Invoice.js';
import Payment from '../../models/Payment.js';
import User from '../../models/User.js';
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from '../../utils/AppError.js';
import { BOOKING_STATUS, VEHICLE_STATUS, RETURN_CHECKLIST, KYC_STATUS, WALLET_TX_TYPE, PAYMENT_STATUS, PAYMENT_PROVIDER } from '../../utils/constants.js';
import vehicleRepository from '../vehicles/vehicle.repository.js';
import { calculatePricing, calculateExtensionPricing, generateBookingNumber, calculateRefund } from './booking.engine.js';
import pdfService from '../../utils/pdf.service.js';
import walletService from '../wallet/wallet.service.js';

class BookingRepository {
  async create(data) {
    return Booking.create(data);
  }

  async findById(id) {
    const booking = await Booking.findById(id)
      .populate('user', 'firstName lastName email phone avatar kyc address')
      .populate('vehicle')
      .populate('payment')
      .populate('coupon');
    if (!booking) throw new NotFoundError('Booking not found');
    return booking;
  }

  async findAll(filter, options) {
    const { skip, limit, sort } = options;
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('vehicle', 'name type thumbnail registrationNumber')
        .populate('user', 'firstName lastName email phone avatar kyc')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(filter),
    ]);
    return { bookings, total };
  }

  async update(id, data) {
    return Booking.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async addHistory(entry) {
    return BookingHistory.create(entry);
  }
}

const bookingRepository = new BookingRepository();

const normalizeLocation = (location) => {
  if (!location) return undefined;

  let coordinates;
  const raw = location.coordinates;
  if (Array.isArray(raw) && typeof raw[0] === 'number') {
    coordinates = raw;
  } else if (raw?.coordinates && Array.isArray(raw.coordinates)) {
    coordinates = raw.coordinates;
  }

  return {
    hub: location.hub,
    address: location.address,
    city: location.city,
    ...(coordinates ? { coordinates } : {}),
  };
};

class BookingService {
  async createBooking(userId, data) {
    const vehicle = await Vehicle.findById(data.vehicleId);
    if (!vehicle || !vehicle.isActive) throw new NotFoundError('Vehicle not found');
    if ([VEHICLE_STATUS.MAINTENANCE, VEHICLE_STATUS.SOLD, VEHICLE_STATUS.INACTIVE].includes(vehicle.status)) {
      throw new ConflictError(`Vehicle is ${vehicle.status} and cannot be booked`);
    }

    const available = await vehicleRepository.checkAvailability(
      data.vehicleId,
      data.startDate,
      data.endDate
    );
    if (!available) {
      const hasActiveRental = await vehicleRepository.hasActiveRental(data.vehicleId);
      throw new ConflictError(
        hasActiveRental
          ? 'Vehicle is currently booked and unavailable until returned'
          : 'Vehicle not available for selected dates'
      );
    }

    let coupon = null;
    if (data.couponCode) {
      coupon = await Coupon.findOne({
        code: data.couponCode.toUpperCase(),
        isActive: true,
        validFrom: { $lte: new Date() },
        validUntil: { $gte: new Date() },
      });
      if (!coupon) throw new NotFoundError('Invalid coupon code');
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        throw new ConflictError('Coupon usage limit reached');
      }
    }

    const pricing = calculatePricing(vehicle, data.startDate, data.endDate, coupon);

    const booking = await bookingRepository.create({
      bookingNumber: generateBookingNumber(),
      user: userId,
      vehicle: data.vehicleId,
      startDate: data.startDate,
      endDate: data.endDate,
      pickupLocation: normalizeLocation(data.pickupLocation || vehicle.location),
      dropoffLocation: normalizeLocation(data.dropoffLocation),
      pricing,
      coupon: coupon?._id,
      notes: data.notes,
      status: BOOKING_STATUS.PENDING,
    });

    await bookingRepository.addHistory({
      booking: booking._id,
      action: 'created',
      newStatus: BOOKING_STATUS.PENDING,
      performedBy: userId,
    });

    if (coupon) {
      await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usageCount: 1 } });
    }

    return bookingRepository.findById(booking._id);
  }

  async getBooking(id, userId, userRole) {
    const booking = await bookingRepository.findById(id);
    const isAdmin = ['super_admin', 'admin', 'staff'].includes(userRole);
    if (!isAdmin && booking.user._id.toString() !== userId.toString()) {
      throw new ForbiddenError('Access denied');
    }
    return booking;
  }

  async listBookings(query, userId, userRole) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    const isAdmin = ['super_admin', 'admin', 'staff'].includes(userRole);
    if (!isAdmin) filter.user = userId;
    if (query.status) filter.status = query.status;
    if (query.vehicleId) filter.vehicle = query.vehicleId;

    return bookingRepository.findAll(filter, { skip, limit, sort: query.sort || '-createdAt' });
  }

  async cancelBooking(id, userId, userRole, reason) {
    const booking = await bookingRepository.findById(id);
    const isAdmin = ['super_admin', 'admin', 'staff'].includes(userRole);

    if (!isAdmin && booking.user._id.toString() !== userId.toString()) {
      throw new ForbiddenError('Access denied');
    }

    if ([BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED].includes(booking.status)) {
      throw new ConflictError('Booking cannot be cancelled');
    }

    const refund = calculateRefund(booking);

    const updated = await bookingRepository.update(id, {
      status: BOOKING_STATUS.CANCELLED,
      cancellationReason: reason,
      cancelledAt: new Date(),
      cancelledBy: userId,
    });

    await bookingRepository.addHistory({
      booking: id,
      action: 'cancelled',
      previousStatus: booking.status,
      newStatus: BOOKING_STATUS.CANCELLED,
      performedBy: userId,
      note: reason,
      changes: { refund },
    });

    const stillBlocked = await vehicleRepository.hasActiveRental(booking.vehicle._id);
    if (!stillBlocked) {
      await vehicleRepository.syncVehicleStatus(booking.vehicle._id);
    }

    return { booking: updated, refund };
  }

  async getExtensionQuote(id, userId, userRole, newEndDate) {
    if (!newEndDate) throw new ValidationError('newEndDate query parameter is required');

    const booking = await this.getBooking(id, userId, userRole);

    if (![BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ACTIVE, BOOKING_STATUS.EXTENDED].includes(booking.status)) {
      throw new ConflictError('Booking cannot be extended in its current status');
    }

    const newEnd = new Date(newEndDate);
    const currentEnd = new Date(booking.endDate);
    if (newEnd <= currentEnd) {
      throw new ValidationError('New end date must be after the current end date');
    }

    const available = await vehicleRepository.checkAvailability(
      booking.vehicle._id,
      booking.endDate,
      newEnd,
      id
    );
    if (!available) throw new ConflictError('Vehicle not available for extension period');

    const vehicle = await Vehicle.findById(booking.vehicle._id);
    const extensionPricing = calculateExtensionPricing(vehicle, booking.endDate, newEnd);

    return {
      currentEndDate: booking.endDate,
      newEndDate: newEnd,
      extension: extensionPricing,
      currentTotal: booking.pricing?.totalAmount || 0,
      newTotal: (booking.pricing?.totalAmount || 0) + extensionPricing.chargeAmount,
    };
  }

  async extendBooking(id, userId, newEndDate) {
    const booking = await bookingRepository.findById(id);
    if (booking.user._id.toString() !== userId.toString()) {
      throw new ForbiddenError('Access denied');
    }

    if (![BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ACTIVE, BOOKING_STATUS.EXTENDED].includes(booking.status)) {
      throw new ConflictError('Booking cannot be extended in its current status');
    }

    const newEnd = new Date(newEndDate);
    const currentEnd = new Date(booking.endDate);
    if (newEnd <= currentEnd) {
      throw new ValidationError('New end date must be after the current end date');
    }

    const available = await vehicleRepository.checkAvailability(
      booking.vehicle._id,
      booking.endDate,
      newEnd,
      id
    );
    if (!available) throw new ConflictError('Vehicle not available for extension period');

    const vehicle = await Vehicle.findById(booking.vehicle._id);
    const extensionPricing = calculateExtensionPricing(vehicle, booking.endDate, newEnd);
    const chargeAmount = extensionPricing.chargeAmount;

    if (chargeAmount > 0) {
      await walletService.debit(userId, chargeAmount, {
        type: WALLET_TX_TYPE.PAYMENT,
        description: `Booking extension — ${booking.bookingNumber}`,
        referenceType: 'booking',
        referenceId: booking._id,
      });

      await Payment.create({
        booking: id,
        user: userId,
        amount: chargeAmount,
        provider: PAYMENT_PROVIDER.WALLET,
        status: PAYMENT_STATUS.COMPLETED,
        providerPaymentId: `wallet_ext_${Date.now()}`,
      });
    }

    const fullDurationMs = newEnd - new Date(booking.startDate);
    const updatedPricing = {
      ...(booking.pricing?.toObject?.() || booking.pricing || {}),
      baseAmount: (booking.pricing?.baseAmount || 0) + extensionPricing.baseAmount,
      tax: (booking.pricing?.tax || 0) + extensionPricing.tax,
      durationHours: Math.ceil(fullDurationMs / (1000 * 60 * 60)),
      extensionBaseAmount: (booking.pricing?.extensionBaseAmount || 0) + extensionPricing.baseAmount,
      extensionTax: (booking.pricing?.extensionTax || 0) + extensionPricing.tax,
      extensionAmount: (booking.pricing?.extensionAmount || 0) + chargeAmount,
      totalAmount: (booking.pricing?.totalAmount || 0) + chargeAmount,
    };

    const extensionRecord = {
      previousEndDate: booking.endDate,
      newEndDate: newEnd,
      baseAmount: extensionPricing.baseAmount,
      tax: extensionPricing.tax,
      chargeAmount,
      paidAt: new Date(),
    };

    const updated = await bookingRepository.update(id, {
      endDate: newEnd,
      status: BOOKING_STATUS.EXTENDED,
      extensionCount: booking.extensionCount + 1,
      pricing: updatedPricing,
      $push: { extensions: extensionRecord },
    });

    await bookingRepository.addHistory({
      booking: id,
      action: 'extended',
      previousStatus: booking.status,
      newStatus: BOOKING_STATUS.EXTENDED,
      performedBy: userId,
      changes: { newEndDate: newEnd, extensionPricing, chargeAmount },
    });

    return bookingRepository.findById(id);
  }

  async updateBookingStatus(id, status, adminId) {
    const booking = await bookingRepository.findById(id);
    const updated = await bookingRepository.update(id, { status });

    const vehicleId = booking.vehicle._id || booking.vehicle;
    if ([BOOKING_STATUS.ACTIVE, BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED].includes(status)) {
      await vehicleRepository.syncVehicleStatus(vehicleId);
    }
    if (status === BOOKING_STATUS.COMPLETED) {
      await Vehicle.findByIdAndUpdate(vehicleId, { $inc: { totalBookings: 1 } });
    }

    await bookingRepository.addHistory({
      booking: id,
      action: 'modified',
      previousStatus: booking.status,
      newStatus: status,
      performedBy: adminId,
    });

    return updated;
  }

  async submitOnboarding(bookingId, requestUserId, userRole, data) {
    const booking = await bookingRepository.findById(bookingId);
    const isAdmin = ['super_admin', 'admin', 'staff'].includes(userRole);
    if (!isAdmin) {
      throw new ForbiddenError('Pickup onboarding must be conducted by admin');
    }

    const customerId = booking.user._id;

    const onboarding = {
      completedAt: new Date(),
      completedBy: requestUserId,
      fullName: data.fullName,
      address: data.address,
      aadharNumber: data.aadharNumber,
      licenseNumber: data.licenseNumber,
      profilePhotoUrl: data.profilePhotoUrl,
    };

    await bookingRepository.update(bookingId, { onboarding });

    await User.findByIdAndUpdate(customerId, {
      firstName: data.fullName?.split(' ')[0] || undefined,
      lastName: data.fullName?.split(' ').slice(1).join(' ') || undefined,
      address: data.address,
      avatar: data.profilePhotoUrl || undefined,
      'kyc.aadharNumber': data.aadharNumber,
      'kyc.licenseNumber': data.licenseNumber,
      'kyc.profilePhotoUrl': data.profilePhotoUrl,
      'kyc.documentNumber': data.aadharNumber,
      'kyc.documentType': 'aadhar',
      'kyc.status': KYC_STATUS.VERIFIED,
      'kyc.verifiedAt': new Date(),
      'kyc.verifiedBy': requestUserId,
    });

    return bookingRepository.findById(bookingId);
  }

  getReturnChecklist(vehicleType) {
    return RETURN_CHECKLIST[vehicleType] || RETURN_CHECKLIST.bike;
  }

  async processReturn(id, adminId, { checklist, odometerEnd, notes }) {
    const booking = await bookingRepository.findById(id);

    if (![BOOKING_STATUS.ACTIVE, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.EXTENDED].includes(booking.status)) {
      throw new ConflictError('Booking is not eligible for return');
    }

    const securityDeposit = booking.pricing?.securityDeposit || 0;
    const processedChecklist = (checklist || []).map((item) => ({
      itemId: item.itemId,
      label: item.label,
      passed: item.passed !== false,
      repairCost: item.passed === false ? (item.repairCost || 0) : 0,
      notes: item.notes,
    }));

    const totalDeductions = processedChecklist.reduce((sum, i) => sum + (i.repairCost || 0), 0);
    const depositRefund = Math.max(0, securityDeposit - totalDeductions);
    const additionalDue = Math.max(0, totalDeductions - securityDeposit);

    const returnInspection = {
      completedAt: new Date(),
      completedBy: adminId,
      checklist: processedChecklist,
      totalDeductions,
      depositRefund,
      additionalDue,
      odometerEnd,
      notes,
    };

    const settlement = {
      rentalAmount: booking.pricing?.baseAmount || 0,
      tax: booking.pricing?.tax || 0,
      securityDeposit,
      totalDeductions,
      depositRefunded: depositRefund,
      additionalDue,
      finalInvoiceNumber: `INV-FINAL-${Date.now()}`,
      settledAt: new Date(),
    };

    const vehicleId = booking.vehicle._id || booking.vehicle;

    const updated = await bookingRepository.update(id, {
      status: BOOKING_STATUS.COMPLETED,
      actualReturnDate: new Date(),
      odometerEnd,
      returnInspection,
      settlement,
    });

    await Vehicle.findByIdAndUpdate(vehicleId, { $inc: { totalBookings: 1 } });
    await vehicleRepository.syncVehicleStatus(vehicleId);

    if (depositRefund > 0) {
      await walletService.credit(booking.user._id, depositRefund, {
        type: WALLET_TX_TYPE.REFUND,
        description: `Security deposit refund for ${booking.bookingNumber}`,
        referenceType: 'booking',
        referenceId: booking._id,
        createdBy: adminId,
      });
    }

    const invoiceItems = [
      { description: 'Vehicle Rental', quantity: 1, unitPrice: settlement.rentalAmount, amount: settlement.rentalAmount },
      { description: 'Tax/GST', quantity: 1, unitPrice: settlement.tax, amount: settlement.tax },
    ];

    if (totalDeductions > 0) {
      invoiceItems.push({
        description: 'Return inspection deductions',
        quantity: 1,
        unitPrice: -totalDeductions,
        amount: -totalDeductions,
      });
    }

    const invoiceTotal = (booking.pricing?.totalAmount || 0) - securityDeposit + totalDeductions + additionalDue;

    const paymentId = booking.payment?._id || booking.payment || undefined;

    const invoice = await Invoice.create({
      invoiceNumber: settlement.finalInvoiceNumber,
      booking: id,
      ...(paymentId ? { payment: paymentId } : {}),
      user: booking.user._id,
      items: invoiceItems,
      subtotal: settlement.rentalAmount,
      tax: settlement.tax,
      total: invoiceTotal,
      securityDeposit,
      deductions: totalDeductions,
      depositRefunded: depositRefund,
      additionalDue,
      isFinal: true,
    });

    const fullBooking = await bookingRepository.findById(id);
    const pdfUrl = await pdfService.generateFinalInvoice(fullBooking, invoice);
    await Invoice.findByIdAndUpdate(invoice._id, { pdfUrl });

    await bookingRepository.addHistory({
      booking: id,
      action: 'return_completed',
      previousStatus: booking.status,
      newStatus: BOOKING_STATUS.COMPLETED,
      performedBy: adminId,
      changes: { returnInspection, settlement },
    });

    return { booking: await bookingRepository.findById(id), invoice: { ...invoice.toObject(), pdfUrl } };
  }

  async getSummaryPdf(id, userId, userRole) {
    const booking = await this.getBooking(id, userId, userRole);
    const pdfUrl = await pdfService.generateBookingSummary(booking);
    return { pdfUrl, bookingNumber: booking.bookingNumber };
  }

  async getInvoicePdf(id, userId, userRole) {
    const booking = await this.getBooking(id, userId, userRole);

    const isFinal = booking.status === BOOKING_STATUS.COMPLETED;
    let invoice = await Invoice.findOne({
      booking: id,
      ...(isFinal ? { isFinal: true } : { isFinal: { $ne: true } }),
    }).sort('-createdAt');

    if (!invoice) {
      invoice = await Invoice.findOne({ booking: id }).sort('-createdAt');
    }
    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    if (!invoice.pdfUrl) {
      const pdfUrl = isFinal
        ? await pdfService.generateFinalInvoice(booking, invoice)
        : await pdfService.generateBookingSummary(booking);
      invoice = await Invoice.findByIdAndUpdate(invoice._id, { pdfUrl }, { new: true });
    }

    return { pdfUrl: invoice.pdfUrl, invoiceNumber: invoice.invoiceNumber, isFinal };
  }

  async getInvoiceData(id, userId, userRole) {
    const booking = await this.getBooking(id, userId, userRole);
    const isFinal = booking.status === BOOKING_STATUS.COMPLETED;

    let invoice = await Invoice.findOne({
      booking: id,
      ...(isFinal ? { isFinal: true } : { isFinal: { $ne: true } }),
    }).sort('-createdAt');

    if (!invoice) {
      invoice = await Invoice.findOne({ booking: id }).sort('-createdAt');
    }

    const pricing = booking.pricing || {};
    const rentalSubtotal = (pricing.baseAmount || 0) - (pricing.couponDiscount || 0) - (pricing.discount || 0);
    const rentalWithTax = rentalSubtotal + (pricing.tax || 0) + (pricing.lateFee || 0);

    return {
      type: isFinal ? 'final' : 'receipt',
      invoiceNumber: invoice?.invoiceNumber || `VR-${booking.bookingNumber}`,
      issuedAt: invoice?.issuedAt || booking.createdAt,
      booking: {
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        startDate: booking.startDate,
        endDate: booking.endDate,
        actualReturnDate: booking.actualReturnDate,
        pickupLocation: booking.pickupLocation,
        pricing: booking.pricing,
        settlement: booking.settlement,
        returnInspection: booking.returnInspection,
        extensionCount: booking.extensionCount,
        extensions: booking.extensions,
      },
      customer: {
        name: booking.onboarding?.fullName || `${booking.user?.firstName || ''} ${booking.user?.lastName || ''}`.trim(),
        email: booking.user?.email,
        phone: booking.user?.phone,
        address: booking.onboarding?.address || booking.user?.address,
      },
      vehicle: {
        name: booking.vehicle?.name,
        type: booking.vehicle?.type,
        registrationNumber: booking.vehicle?.registrationNumber,
      },
      payment: booking.payment
        ? {
            amount: booking.payment.amount,
            status: booking.payment.status,
            provider: booking.payment.provider,
            providerPaymentId: booking.payment.providerPaymentId,
            paidAt: booking.payment.updatedAt || booking.payment.createdAt,
          }
        : null,
      coupon: booking.coupon
        ? {
            code: booking.coupon.code,
            description: booking.coupon.description,
            discountType: booking.coupon.discountType,
            discountValue: booking.coupon.discountValue,
            discountApplied: pricing.couponDiscount || 0,
          }
        : null,
      breakdown: {
        baseAmount: pricing.baseAmount || 0,
        rateType: pricing.rateType,
        rateApplied: pricing.rateApplied,
        durationHours: pricing.durationHours,
        discount: pricing.discount || 0,
        couponDiscount: pricing.couponDiscount || 0,
        tax: pricing.tax || 0,
        securityDeposit: pricing.securityDeposit || 0,
        lateFee: pricing.lateFee || 0,
        totalAmount: pricing.totalAmount || 0,
        rentalSubtotal,
        rentalWithTax,
        amountPaid: pricing.totalAmount || 0,
        extensionBaseAmount: pricing.extensionBaseAmount || 0,
        extensionTax: pricing.extensionTax || 0,
        extensionAmount: pricing.extensionAmount || 0,
        originalBaseAmount: (pricing.baseAmount || 0) - (pricing.extensionBaseAmount || 0),
      },
      extensions: booking.extensions || [],
      settlement: isFinal
        ? {
            securityDeposit: booking.settlement?.securityDeposit ?? pricing.securityDeposit,
            totalDeductions: booking.settlement?.totalDeductions ?? booking.returnInspection?.totalDeductions,
            depositRefunded: booking.settlement?.depositRefunded ?? booking.returnInspection?.depositRefund,
            additionalDue: booking.settlement?.additionalDue ?? booking.returnInspection?.additionalDue,
            checklist: booking.returnInspection?.checklist,
          }
        : null,
    };
  }
}

export default new BookingService();

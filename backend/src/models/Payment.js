import mongoose from 'mongoose';
import { PAYMENT_STATUS, PAYMENT_PROVIDER } from '../utils/constants.js';

const paymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    provider: {
      type: String,
      enum: [...Object.values(PAYMENT_PROVIDER), 'wallet'],
      required: true,
    },
    providerPaymentId: String,
    providerOrderId: String,
    providerSessionId: String,
    refundAmount: { type: Number, default: 0 },
    refundReason: String,
    refundedAt: Date,
    metadata: mongoose.Schema.Types.Mixed,
    failureReason: String,
  },
  { timestamps: true }
);

paymentSchema.index({ booking: 1 });
paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ providerPaymentId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;

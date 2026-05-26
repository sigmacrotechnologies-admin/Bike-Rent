import mongoose from 'mongoose';
import { BOOKING_STATUS } from '../utils/constants.js';

const pricingBreakdownSchema = new mongoose.Schema({
  baseAmount: Number,
  durationHours: Number,
  rateType: { type: String, enum: ['hourly', 'daily', 'weekly', 'monthly'] },
  rateApplied: Number,
  dynamicMultiplier: { type: Number, default: 1 },
  discount: { type: Number, default: 0 },
  couponDiscount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  securityDeposit: { type: Number, default: 0 },
  lateFee: { type: Number, default: 0 },
  totalAmount: Number,
  extensionBaseAmount: { type: Number, default: 0 },
  extensionTax: { type: Number, default: 0 },
  extensionAmount: { type: Number, default: 0 },
});

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: { type: String, unique: true, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    actualReturnDate: Date,
    pickupLocation: {
      hub: String,
      address: String,
      coordinates: [Number],
    },
    dropoffLocation: {
      hub: String,
      address: String,
      coordinates: [Number],
    },
    pricing: pricingBreakdownSchema,
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    notes: String,
    cancellationReason: String,
    cancelledAt: Date,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    extensionCount: { type: Number, default: 0 },
    extensions: [{
      previousEndDate: Date,
      newEndDate: Date,
      baseAmount: Number,
      tax: Number,
      chargeAmount: Number,
      paidAt: Date,
    }],
    odometerStart: Number,
    odometerEnd: Number,
    onboarding: {
      completedAt: Date,
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      fullName: String,
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
      },
      aadharNumber: String,
      licenseNumber: String,
      profilePhotoUrl: String,
    },
    returnInspection: {
      completedAt: Date,
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      checklist: [{
        itemId: String,
        label: String,
        passed: { type: Boolean, default: true },
        repairCost: { type: Number, default: 0 },
        notes: String,
      }],
      totalDeductions: { type: Number, default: 0 },
      depositRefund: { type: Number, default: 0 },
      additionalDue: { type: Number, default: 0 },
      odometerEnd: Number,
      notes: String,
    },
    settlement: {
      rentalAmount: Number,
      tax: Number,
      securityDeposit: Number,
      totalDeductions: Number,
      depositRefunded: Number,
      additionalDue: Number,
      finalInvoiceNumber: String,
      settledAt: Date,
    },
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ vehicle: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ bookingNumber: 1 });
bookingSchema.index({ status: 1, startDate: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;

import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: String,
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscount: Number,
    vehicleTypes: [{ type: String, enum: ['bike', 'car', 'ev', 'scooter'] }],
    usageLimit: Number,
    usageCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

couponSchema.index({ code: 1 });
couponSchema.index({ validFrom: 1, validUntil: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;

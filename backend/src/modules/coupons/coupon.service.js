import Coupon from '../../models/Coupon.js';
import { NotFoundError, ConflictError } from '../../utils/AppError.js';

class CouponService {
  async create(data, userId) {
    const existing = await Coupon.findOne({ code: data.code.toUpperCase() });
    if (existing) throw new ConflictError('Coupon code already exists');
    return Coupon.create({ ...data, code: data.code.toUpperCase(), createdBy: userId });
  }

  async list(query) {
    const filter = {};
    if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
    return Coupon.find(filter).sort('-createdAt');
  }

  async validate(code, orderAmount, vehicleType) {
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
    });
    if (!coupon) throw new NotFoundError('Invalid coupon');

    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      throw new ConflictError(`Minimum order amount is ₹${coupon.minOrderAmount}`);
    }
    if (coupon.vehicleTypes?.length && !coupon.vehicleTypes.includes(vehicleType)) {
      throw new ConflictError('Coupon not valid for this vehicle type');
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new ConflictError('Coupon usage limit reached');
    }

    return coupon;
  }

  async update(id, data) {
    const coupon = await Coupon.findByIdAndUpdate(id, data, { new: true });
    if (!coupon) throw new NotFoundError('Coupon not found');
    return coupon;
  }

  async delete(id) {
    return Coupon.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }
}

export default new CouponService();

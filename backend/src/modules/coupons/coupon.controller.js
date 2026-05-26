import couponService from './coupon.service.js';
import { asyncHandler, successResponse } from '../../utils/response.js';
import { HTTP_STATUS } from '../../utils/constants.js';

class CouponController {
  create = asyncHandler(async (req, res) => {
    const coupon = await couponService.create(req.body, req.user._id);
    return successResponse(res, coupon, 'Coupon created', HTTP_STATUS.CREATED);
  });

  list = asyncHandler(async (req, res) => {
    const coupons = await couponService.list(req.query);
    return successResponse(res, coupons);
  });

  validate = asyncHandler(async (req, res) => {
    const coupon = await couponService.validate(req.body.code, req.body.orderAmount, req.body.vehicleType);
    return successResponse(res, coupon, 'Coupon valid');
  });

  update = asyncHandler(async (req, res) => {
    const coupon = await couponService.update(req.params.id, req.body);
    return successResponse(res, coupon, 'Coupon updated');
  });

  delete = asyncHandler(async (req, res) => {
    await couponService.delete(req.params.id);
    return successResponse(res, null, 'Coupon deactivated');
  });
}

export default new CouponController();

import userService from './user.service.js';
import { asyncHandler, successResponse, paginatedResponse } from '../../utils/response.js';
import { buildPaginationMeta } from '../../middlewares/validate.middleware.js';
import { authenticate, adminOnly } from '../../middlewares/auth.middleware.js';

class UserController {
  getProfile = asyncHandler(async (req, res) => {
    const user = await userService.getProfile(req.user._id);
    return successResponse(res, user);
  });

  updateProfile = asyncHandler(async (req, res) => {
    const user = await userService.updateProfile(req.user._id, req.body);
    return successResponse(res, user, 'Profile updated');
  });

  listCustomers = asyncHandler(async (req, res) => {
    const { users, total } = await userService.listCustomers(req.query);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    return paginatedResponse(res, users, buildPaginationMeta(total, page, limit));
  });

  submitKYC = asyncHandler(async (req, res) => {
    const userId = req.body.userId || req.user._id;
    const user = await userService.submitKYC(userId, req.body);
    return successResponse(res, user, 'KYC submitted for verification');
  });

  verifyKYC = asyncHandler(async (req, res) => {
    const user = await userService.verifyKYC(req.params.id, req.user._id, req.body);
    return successResponse(res, user, 'KYC status updated');
  });
}

export default new UserController();

import authService from './auth.service.js';
import { asyncHandler, successResponse } from '../../utils/response.js';
import { HTTP_STATUS } from '../../utils/constants.js';

class AuthController {
  register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    return successResponse(res, result, 'Registration successful', HTTP_STATUS.CREATED);
  });

  login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body.email, req.body.password);
    return successResponse(res, result, 'Login successful');
  });

  refreshToken = asyncHandler(async (req, res) => {
    const tokens = await authService.refreshToken(req.body.refreshToken);
    return successResponse(res, tokens, 'Token refreshed');
  });

  logout = asyncHandler(async (req, res) => {
    await authService.logout(req.user._id, req.body.refreshToken);
    return successResponse(res, null, 'Logged out successfully');
  });

  getMe = asyncHandler(async (req, res) => {
    return successResponse(res, req.user, 'Profile fetched');
  });
}

export default new AuthController();

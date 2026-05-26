import { Router } from 'express';
import authController from './auth.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authLimiter } from '../../middlewares/rateLimit.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from './auth.validator.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authenticate, validate(refreshTokenSchema), authController.logout);
router.get('/me', authenticate, authController.getMe);

export default router;

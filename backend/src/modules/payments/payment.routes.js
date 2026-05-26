import { Router } from 'express';
import paymentController from './payment.controller.js';
import { authenticate, adminOnly } from '../../middlewares/auth.middleware.js';
import { paymentLimiter } from '../../middlewares/rateLimit.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { initiatePaymentSchema, payWithWalletSchema } from './payment.validator.js';

const router = Router();

router.use(authenticate);

router.post('/wallet', paymentLimiter, validate(payWithWalletSchema), paymentController.payWithWallet);
router.post('/initiate', paymentLimiter, validate(initiatePaymentSchema), paymentController.initiate);
router.post('/verify/razorpay', paymentController.verifyRazorpay);
router.post('/verify/stripe', paymentController.verifyStripe);
router.post('/:id/refund', adminOnly, paymentController.refund);

export default router;

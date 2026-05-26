import { Router } from 'express';
import userController from './user.controller.js';
import { authenticate, adminOnly } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/kyc/submit', adminOnly, userController.submitKYC);
router.get('/customers', adminOnly, userController.listCustomers);
router.patch('/:id/kyc', adminOnly, userController.verifyKYC);

export default router;

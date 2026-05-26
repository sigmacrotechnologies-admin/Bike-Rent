import { Router } from 'express';
import walletController from './wallet.controller.js';
import { authenticate, adminOnly } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', walletController.getBalance);
router.get('/transactions', walletController.listTransactions);
router.post('/topup', walletController.topUp);

router.get('/admin/all', adminOnly, walletController.listAll);
router.post('/admin/:userId/adjust', adminOnly, walletController.adminAdjust);

export default router;

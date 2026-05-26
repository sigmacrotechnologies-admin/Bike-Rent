import { Router } from 'express';
import couponController from './coupon.controller.js';
import { authenticate, adminOnly } from '../../middlewares/auth.middleware.js';

const router = Router();

router.post('/validate', authenticate, couponController.validate);

router.use(authenticate, adminOnly);
router.post('/', couponController.create);
router.get('/', couponController.list);
router.put('/:id', couponController.update);
router.delete('/:id', couponController.delete);

export default router;

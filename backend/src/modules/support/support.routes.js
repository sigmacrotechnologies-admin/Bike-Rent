import { Router } from 'express';
import supportController from './support.controller.js';
import { authenticate, adminOnly } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', supportController.create);
router.get('/', supportController.list);
router.get('/:id', supportController.getById);
router.post('/:id/messages', supportController.addMessage);
router.patch('/:id', adminOnly, supportController.update);

export default router;

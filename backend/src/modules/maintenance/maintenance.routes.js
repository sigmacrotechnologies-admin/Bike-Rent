import { Router } from 'express';
import maintenanceController from './maintenance.controller.js';
import { authenticate, adminOnly } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate, adminOnly);

router.post('/', maintenanceController.create);
router.get('/', maintenanceController.list);
router.patch('/:id', maintenanceController.update);

export default router;

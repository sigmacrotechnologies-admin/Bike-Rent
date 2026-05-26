import { Router } from 'express';
import gpsController from './gps.controller.js';
import { authenticate, adminOnly } from '../../middlewares/auth.middleware.js';

const router = Router();

router.post('/record', gpsController.record);
router.get('/fleet', authenticate, adminOnly, gpsController.fleet);
router.get('/:vehicleId/live', authenticate, adminOnly, gpsController.live);
router.get('/:vehicleId/history', authenticate, adminOnly, gpsController.history);

export default router;

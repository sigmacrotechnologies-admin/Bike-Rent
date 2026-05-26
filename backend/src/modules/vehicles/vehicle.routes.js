import { Router } from 'express';
import vehicleController from './vehicle.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate, adminOnly, optionalAuth } from '../../middlewares/auth.middleware.js';
import { auditLog } from '../../middlewares/audit.middleware.js';
import {
  createVehicleSchema,
  updateVehicleSchema,
  searchVehicleSchema,
  sellVehicleSchema,
} from './vehicle.validator.js';

const router = Router();

router.get('/', validate(searchVehicleSchema, 'query'), optionalAuth, vehicleController.list);
router.get('/:id', optionalAuth, vehicleController.getById);
router.get('/:id/availability', vehicleController.checkAvailability);

router.post('/', authenticate, adminOnly, validate(createVehicleSchema), auditLog('create', 'vehicle'), vehicleController.create);
router.put('/:id', authenticate, adminOnly, validate(updateVehicleSchema), auditLog('update', 'vehicle'), vehicleController.update);
router.post('/:id/sell', authenticate, adminOnly, validate(sellVehicleSchema), auditLog('sell', 'vehicle'), vehicleController.sell);
router.delete('/:id', authenticate, adminOnly, auditLog('delete', 'vehicle'), vehicleController.delete);

export default router;

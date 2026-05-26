import { Router } from 'express';
import locationController from './location.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate, adminOnly, optionalAuth } from '../../middlewares/auth.middleware.js';
import {
  createCitySchema,
  updateCitySchema,
  createHubSchema,
  updateHubSchema,
  listLocationSchema,
} from './location.validator.js';

const router = Router();

router.get('/', validate(listLocationSchema, 'query'), optionalAuth, locationController.list);
router.post('/cities', authenticate, adminOnly, validate(createCitySchema), locationController.createCity);
router.put('/cities/:cityId', authenticate, adminOnly, validate(updateCitySchema), locationController.updateCity);
router.delete('/cities/:cityId', authenticate, adminOnly, locationController.deleteCity);
router.post('/cities/:cityId/hubs', authenticate, adminOnly, validate(createHubSchema), locationController.addHub);
router.put('/cities/:cityId/hubs/:hubId', authenticate, adminOnly, validate(updateHubSchema), locationController.updateHub);
router.delete('/cities/:cityId/hubs/:hubId', authenticate, adminOnly, locationController.deleteHub);

export default router;

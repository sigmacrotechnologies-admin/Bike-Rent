import { Router } from 'express';
import analyticsController from './analytics.controller.js';
import { authenticate, adminOnly } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/dashboard', analyticsController.dashboard);
router.get('/reports', analyticsController.reports);

export default router;

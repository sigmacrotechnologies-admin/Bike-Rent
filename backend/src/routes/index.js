import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/users/user.routes.js';
import vehicleRoutes from '../modules/vehicles/vehicle.routes.js';
import bookingRoutes from '../modules/bookings/booking.routes.js';
import paymentRoutes from '../modules/payments/payment.routes.js';
import analyticsRoutes from '../modules/analytics/analytics.routes.js';
import gpsRoutes from '../modules/gps/gps.routes.js';
import supportRoutes from '../modules/support/support.routes.js';
import maintenanceRoutes from '../modules/maintenance/maintenance.routes.js';
import couponRoutes from '../modules/coupons/coupon.routes.js';
import notificationRoutes from '../modules/notifications/notification.routes.js';
import assetRoutes from '../modules/assets/asset.routes.js';
import locationRoutes from '../modules/locations/location.routes.js';
import walletRoutes from '../modules/wallet/wallet.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/gps', gpsRoutes);
router.use('/support', supportRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/coupons', couponRoutes);
router.use('/notifications', notificationRoutes);
router.use('/assets', assetRoutes);
router.use('/locations', locationRoutes);
router.use('/wallet', walletRoutes);

export default router;

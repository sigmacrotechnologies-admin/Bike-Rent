import { Router } from 'express';
import bookingController from './booking.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate, adminOnly } from '../../middlewares/auth.middleware.js';
import {
  createBookingSchema,
  extendBookingSchema,
  cancelBookingSchema,
} from './booking.validator.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createBookingSchema), bookingController.create);
router.get('/', bookingController.list);
router.get('/:id', bookingController.getById);
router.post('/:id/cancel', validate(cancelBookingSchema), bookingController.cancel);
router.post('/:id/extend', validate(extendBookingSchema), bookingController.extend);
router.get('/:id/extension-quote', bookingController.getExtensionQuote);
router.post('/:id/onboarding', adminOnly, bookingController.submitOnboarding);
router.get('/:id/invoice-data', bookingController.getInvoiceData);
router.get('/:id/summary-pdf', bookingController.getSummaryPdf);
router.get('/:id/invoice-pdf', bookingController.getInvoicePdf);
router.get('/:id/return-checklist', adminOnly, bookingController.getReturnChecklist);
router.post('/:id/return', adminOnly, bookingController.processReturn);
router.patch('/:id/status', adminOnly, bookingController.updateStatus);

export default router;

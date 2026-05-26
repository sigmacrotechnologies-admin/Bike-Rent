import bookingService from './booking.service.js';
import { asyncHandler, successResponse, paginatedResponse } from '../../utils/response.js';
import { buildPaginationMeta } from '../../middlewares/validate.middleware.js';
import { HTTP_STATUS } from '../../utils/constants.js';

class BookingController {
  create = asyncHandler(async (req, res) => {
    const booking = await bookingService.createBooking(req.user._id, req.body);
    return successResponse(res, booking, 'Booking created', HTTP_STATUS.CREATED);
  });

  getById = asyncHandler(async (req, res) => {
    const booking = await bookingService.getBooking(req.params.id, req.user._id, req.user.role);
    return successResponse(res, booking);
  });

  list = asyncHandler(async (req, res) => {
    const { bookings, total } = await bookingService.listBookings(req.query, req.user._id, req.user.role);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    return paginatedResponse(res, bookings, buildPaginationMeta(total, page, limit));
  });

  cancel = asyncHandler(async (req, res) => {
    const result = await bookingService.cancelBooking(
      req.params.id,
      req.user._id,
      req.user.role,
      req.body.reason
    );
    return successResponse(res, result, 'Booking cancelled');
  });

  extend = asyncHandler(async (req, res) => {
    const booking = await bookingService.extendBooking(req.params.id, req.user._id, req.body.newEndDate);
    return successResponse(res, booking, 'Booking extended');
  });

  getExtensionQuote = asyncHandler(async (req, res) => {
    const quote = await bookingService.getExtensionQuote(
      req.params.id,
      req.user._id,
      req.user.role,
      req.query.newEndDate
    );
    return successResponse(res, quote);
  });

  updateStatus = asyncHandler(async (req, res) => {
    const booking = await bookingService.updateBookingStatus(req.params.id, req.body.status, req.user._id);
    return successResponse(res, booking, 'Booking status updated');
  });

  submitOnboarding = asyncHandler(async (req, res) => {
    const booking = await bookingService.submitOnboarding(
      req.params.id,
      req.user._id,
      req.user.role,
      req.body
    );
    return successResponse(res, booking, 'Pickup onboarding completed');
  });

  getReturnChecklist = asyncHandler(async (req, res) => {
    const booking = await bookingService.getBooking(req.params.id, req.user._id, req.user.role);
    const checklist = bookingService.getReturnChecklist(booking.vehicle?.type || 'bike');
    return successResponse(res, { checklist, vehicleType: booking.vehicle?.type });
  });

  processReturn = asyncHandler(async (req, res) => {
    const result = await bookingService.processReturn(req.params.id, req.user._id, req.body);
    return successResponse(res, result, 'Vehicle return processed');
  });

  getSummaryPdf = asyncHandler(async (req, res) => {
    const result = await bookingService.getSummaryPdf(req.params.id, req.user._id, req.user.role);
    return successResponse(res, result);
  });

  getInvoicePdf = asyncHandler(async (req, res) => {
    const result = await bookingService.getInvoicePdf(req.params.id, req.user._id, req.user.role);
    return successResponse(res, result);
  });

  getInvoiceData = asyncHandler(async (req, res) => {
    const data = await bookingService.getInvoiceData(req.params.id, req.user._id, req.user.role);
    return successResponse(res, data);
  });
}

export default new BookingController();

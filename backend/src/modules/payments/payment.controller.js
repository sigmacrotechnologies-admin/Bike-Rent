import paymentService from './payment.service.js';
import { asyncHandler, successResponse } from '../../utils/response.js';
import { HTTP_STATUS } from '../../utils/constants.js';

class PaymentController {
  initiate = asyncHandler(async (req, res) => {
    const result = await paymentService.initiatePayment(req.user._id, req.body);
    return successResponse(res, result, 'Payment initiated', HTTP_STATUS.CREATED);
  });

  payWithWallet = asyncHandler(async (req, res) => {
    const result = await paymentService.initiatePayment(req.user._id, {
      bookingId: req.body.bookingId,
      provider: 'wallet',
    });
    return successResponse(res, result, 'Booking paid with wallet', HTTP_STATUS.CREATED);
  });

  verifyRazorpay = asyncHandler(async (req, res) => {
    const payment = await paymentService.verifyRazorpayPayment(req.body);
    return successResponse(res, payment, 'Payment verified');
  });

  verifyStripe = asyncHandler(async (req, res) => {
    const payment = await paymentService.verifyStripePayment(req.body.sessionId);
    return successResponse(res, payment, 'Payment verified');
  });

  refund = asyncHandler(async (req, res) => {
    const payment = await paymentService.refundPayment(req.params.id, req.body.reason, req.body.amount);
    return successResponse(res, payment, 'Refund processed');
  });
}

export default new PaymentController();

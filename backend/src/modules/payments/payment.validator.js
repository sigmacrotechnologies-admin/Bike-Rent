import Joi from 'joi';

export const initiatePaymentSchema = Joi.object({
  bookingId: Joi.string().required(),
  provider: Joi.string().valid('razorpay', 'stripe', 'wallet').default('wallet'),
});

export const payWithWalletSchema = Joi.object({
  bookingId: Joi.string().required(),
});

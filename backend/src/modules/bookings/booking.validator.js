import Joi from 'joi';

export const createBookingSchema = Joi.object({
  vehicleId: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),
  pickupLocation: Joi.object({
    hub: Joi.string(),
    address: Joi.string(),
    coordinates: Joi.array().items(Joi.number()).length(2),
  }),
  dropoffLocation: Joi.object({
    hub: Joi.string(),
    address: Joi.string(),
    coordinates: Joi.array().items(Joi.number()).length(2),
  }),
  couponCode: Joi.string(),
  notes: Joi.string().max(500),
});

export const extendBookingSchema = Joi.object({
  newEndDate: Joi.date().iso().required(),
});

export const cancelBookingSchema = Joi.object({
  reason: Joi.string().required().max(500),
});

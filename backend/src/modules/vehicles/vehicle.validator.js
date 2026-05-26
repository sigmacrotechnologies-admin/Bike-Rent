import Joi from 'joi';
import { VEHICLE_TYPES, VEHICLE_STATUS } from '../../utils/constants.js';

export const createVehicleSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid(...Object.values(VEHICLE_TYPES)).required(),
  registrationNumber: Joi.string().required(),
  specs: Joi.object({
    brand: Joi.string(),
    model: Joi.string(),
    year: Joi.number().integer().min(2000),
    color: Joi.string(),
    fuelType: Joi.string().valid('petrol', 'diesel', 'electric', 'hybrid', 'cng'),
    transmission: Joi.string().valid('manual', 'automatic'),
    seats: Joi.number().integer().min(1),
    mileage: Joi.number(),
    engineCapacity: Joi.string(),
    batteryCapacity: Joi.string(),
    range: Joi.number(),
    topSpeed: Joi.number(),
  }),
  pricing: Joi.object({
    hourly: Joi.number().min(0).required(),
    daily: Joi.number().min(0).required(),
    weekly: Joi.number().min(0),
    monthly: Joi.number().min(0),
    securityDeposit: Joi.number().min(0),
    lateFeePerHour: Joi.number().min(0),
    taxPercent: Joi.number().min(0).max(100),
  }).required(),
  location: Joi.object({
    hub: Joi.string().required(),
    city: Joi.string().required(),
    address: Joi.string().allow(''),
    coordinates: Joi.array().items(Joi.number()).length(2),
  }).required(),
  features: Joi.array().items(Joi.string()),
  description: Joi.string().allow(''),
  gpsDeviceId: Joi.string().allow(''),
  isFeatured: Joi.boolean(),
  thumbnail: Joi.string().allow('', null).optional(),
});

export const updateVehicleSchema = createVehicleSchema.fork(
  ['name', 'type', 'registrationNumber', 'pricing', 'location'],
  (schema) => schema.optional()
).keys({
  status: Joi.string().valid(...Object.values(VEHICLE_STATUS)),
  isActive: Joi.boolean(),
  dynamicPricingMultiplier: Joi.number().min(0.5).max(3),
});

export const sellVehicleSchema = Joi.object({
  salePrice: Joi.number().min(0).required(),
  soldTo: Joi.string().allow(''),
  notes: Joi.string().allow(''),
});

export const searchVehicleSchema = Joi.object({
  type: Joi.string().valid(...Object.values(VEHICLE_TYPES)).allow(''),
  city: Joi.string().allow(''),
  hub: Joi.string().allow(''),
  status: Joi.string().valid(...Object.values(VEHICLE_STATUS)).allow(''),
  startDate: Joi.date(),
  endDate: Joi.date(),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  fuelType: Joi.string(),
  transmission: Joi.string(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(12),
  sort: Joi.string().default('-createdAt'),
  search: Joi.string().allow(''),
  admin: Joi.boolean().truthy('true').falsy('false'),
});

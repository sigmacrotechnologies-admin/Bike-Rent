import Joi from 'joi';

export const createCitySchema = Joi.object({
  name: Joi.string().min(2).required(),
  state: Joi.string().allow(''),
});

export const updateCitySchema = Joi.object({
  name: Joi.string().min(2),
  state: Joi.string().allow(''),
  isActive: Joi.boolean(),
});

export const createHubSchema = Joi.object({
  name: Joi.string().min(2).required(),
  address: Joi.string().allow(''),
});

export const updateHubSchema = Joi.object({
  name: Joi.string().min(2),
  address: Joi.string().allow(''),
  isActive: Joi.boolean(),
});

export const listLocationSchema = Joi.object({
  admin: Joi.boolean().truthy('true').falsy('false'),
});

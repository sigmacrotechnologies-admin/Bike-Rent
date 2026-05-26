import vehicleRepository from './vehicle.repository.js';
import { ConflictError } from '../../utils/AppError.js';
import { VEHICLE_STATUS, ADMIN_ROLES } from '../../utils/constants.js';
import { getThumbnail } from '../../utils/vehicleImages.js';

const normalizeVehiclePayload = (data) => {
  const payload = { ...data };

  if (payload.location?.coordinates && Array.isArray(payload.location.coordinates)) {
    payload.location = {
      ...payload.location,
      coordinates: {
        type: 'Point',
        coordinates: payload.location.coordinates,
      },
    };
  }

  if (payload.registrationNumber) {
    payload.registrationNumber = payload.registrationNumber.toUpperCase();
  }

  if (payload.thumbnail && !payload.thumbnail.startsWith('/assets/vehicles/')) {
    delete payload.thumbnail;
  }

  if (!payload.thumbnail && payload.registrationNumber && payload.type) {
    payload.thumbnail = getThumbnail(payload.registrationNumber, payload.type);
  }

  return payload;
};

class VehicleService {
  async createVehicle(data) {
    return vehicleRepository.create(normalizeVehiclePayload(data));
  }

  async getVehicle(id, user = null) {
    const vehicle = await vehicleRepository.findById(id);
    const isAdmin = user && ADMIN_ROLES.includes(user.role);
    const obj = vehicle.toObject ? vehicle.toObject() : vehicle;

    if (!isAdmin) {
      const hasActiveRental = await vehicleRepository.hasActiveRental(id);
      const isRentableStatus = ![VEHICLE_STATUS.SOLD, VEHICLE_STATUS.INACTIVE, VEHICLE_STATUS.MAINTENANCE].includes(
        vehicle.status
      );
      obj.isAvailableForBooking = vehicle.isActive && isRentableStatus && !hasActiveRental;
    }

    return obj;
  }

  async listVehicles(query, user = null) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 12;
    const skip = (page - 1) * limit;

    const isAdminList = query.admin === true || query.admin === 'true';
    const isAdmin = isAdminList && user && ADMIN_ROLES.includes(user.role);
    const filter = isAdmin
      ? {}
      : {
          isActive: true,
          status: { $nin: [VEHICLE_STATUS.SOLD, VEHICLE_STATUS.INACTIVE, VEHICLE_STATUS.MAINTENANCE] },
        };

    if (query.type) filter.type = query.type;
    if (query.city) filter['location.city'] = query.city;
    if (query.hub) filter['location.hub'] = query.hub;
    if (query.status && isAdmin) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { name: new RegExp(query.search, 'i') },
        { 'specs.brand': new RegExp(query.search, 'i') },
        { 'specs.model': new RegExp(query.search, 'i') },
      ];
    }
    if (query.fuelType) filter['specs.fuelType'] = query.fuelType;
    if (query.transmission) filter['specs.transmission'] = query.transmission;
    if (query.minPrice || query.maxPrice) {
      filter['pricing.daily'] = {};
      if (query.minPrice) filter['pricing.daily'].$gte = query.minPrice;
      if (query.maxPrice) filter['pricing.daily'].$lte = query.maxPrice;
    }

    if (query.startDate && query.endDate) {
      const bookedIds = await vehicleRepository.getAvailableVehicleIds(
        new Date(query.startDate),
        new Date(query.endDate)
      );
      filter._id = { ...(filter._id || {}), $nin: bookedIds };
    } else if (!isAdmin) {
      const unavailableIds = await vehicleRepository.getUnavailableVehicleIds();
      if (unavailableIds.length) {
        filter._id = { ...(filter._id || {}), $nin: unavailableIds };
      }
    }

    return vehicleRepository.findAll(filter, {
      skip,
      limit,
      sort: query.sort || '-createdAt',
    });
  }

  async updateVehicle(id, data) {
    return vehicleRepository.update(id, normalizeVehiclePayload(data));
  }

  async deleteVehicle(id) {
    return vehicleRepository.delete(id);
  }

  async sellVehicle(id, data) {
    return vehicleRepository.sell(id, data);
  }

  async checkAvailability(vehicleId, startDate, endDate) {
    const available = await vehicleRepository.checkAvailability(vehicleId, startDate, endDate);
    if (!available) throw new ConflictError('Vehicle not available for selected dates');
    return true;
  }

  async getAvailabilityStatus(vehicleId, startDate, endDate) {
    const vehicle = await vehicleRepository.findById(vehicleId);
    const available = await vehicleRepository.checkAvailability(vehicleId, startDate, endDate);
    const hasActiveRental = await vehicleRepository.hasActiveRental(vehicleId);

    let reason = null;
    if (!available) {
      if (hasActiveRental) {
        reason = 'This vehicle is currently booked and unavailable until returned';
      } else if (vehicle.status === 'maintenance') {
        reason = 'This vehicle is under maintenance';
      } else {
        reason = 'Vehicle not available for selected dates';
      }
    }

    return { available, reason };
  }
}

export default new VehicleService();

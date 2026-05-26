import Vehicle from '../../models/Vehicle.js';
import Booking from '../../models/Booking.js';
import { NotFoundError } from '../../utils/AppError.js';
import { BOOKING_STATUS, VEHICLE_STATUS } from '../../utils/constants.js';

/** Paid/active rentals — vehicle stays unavailable until returned or cancelled */
export const ACTIVE_RENTAL_STATUSES = [
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.ACTIVE,
  BOOKING_STATUS.EXTENDED,
];

/** Includes unpaid holds — used when checking date conflicts for new bookings */
export const BLOCKING_BOOKING_STATUSES = [
  BOOKING_STATUS.PENDING,
  ...ACTIVE_RENTAL_STATUSES,
];

class VehicleRepository {
  async create(data) {
    const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const count = await Vehicle.countDocuments({ slug: new RegExp(`^${slug}`) });
    return Vehicle.create({ ...data, slug: count ? `${slug}-${count + 1}` : slug });
  }

  async findById(id) {
    const vehicle = await Vehicle.findById(id).populate('images');
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    return vehicle;
  }

  async findAll(filter, options) {
    const { skip, limit, sort } = options;
    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter).sort(sort).skip(skip).limit(limit).populate('images'),
      Vehicle.countDocuments(filter),
    ]);
    return { vehicles, total };
  }

  async update(id, data) {
    const vehicle = await Vehicle.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    return vehicle;
  }

  async delete(id) {
    const vehicle = await Vehicle.findByIdAndUpdate(id, { isActive: false, status: 'inactive' }, { new: true });
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    return vehicle;
  }

  async sell(id, { salePrice, soldTo, notes }) {
    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      {
        status: 'sold',
        isActive: false,
        saleInfo: {
          salePrice,
          soldTo: soldTo || '',
          notes: notes || '',
          soldAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    );
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    return vehicle;
  }

  async checkAvailability(vehicleId, startDate, endDate, excludeBookingId = null) {
    const vehicle = await Vehicle.findById(vehicleId).select('status isActive');
    if (!vehicle?.isActive || vehicle.status === 'sold' || vehicle.status === 'inactive') {
      return false;
    }
    if (vehicle.status === 'maintenance') {
      return false;
    }

    const query = {
      vehicle: vehicleId,
      status: { $in: BLOCKING_BOOKING_STATUSES },
      $or: [{ startDate: { $lte: endDate }, endDate: { $gte: startDate } }],
    };
    if (excludeBookingId) query._id = { $ne: excludeBookingId };

    const conflict = await Booking.findOne(query);
    return !conflict;
  }

  async hasActiveRental(vehicleId) {
    const conflict = await Booking.findOne({
      vehicle: vehicleId,
      status: { $in: ACTIVE_RENTAL_STATUSES },
    });
    return !!conflict;
  }

  /** @deprecated use hasActiveRental */
  async hasBlockingBooking(vehicleId) {
    return this.hasActiveRental(vehicleId);
  }

  async getUnavailableVehicleIds() {
    return Booking.distinct('vehicle', {
      status: { $in: ACTIVE_RENTAL_STATUSES },
    });
  }

  async getAvailableVehicleIds(startDate, endDate) {
    const booked = await Booking.distinct('vehicle', {
      status: { $in: ACTIVE_RENTAL_STATUSES },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    });
    return booked;
  }

  async syncVehicleStatus(vehicleId) {
    const vehicle = await Vehicle.findById(vehicleId).select('status isActive');
    if (!vehicle?.isActive) return vehicle;

    if ([VEHICLE_STATUS.MAINTENANCE, VEHICLE_STATUS.SOLD, VEHICLE_STATUS.INACTIVE].includes(vehicle.status)) {
      return vehicle;
    }

    const hasActiveRental = await this.hasActiveRental(vehicleId);
    const targetStatus = hasActiveRental ? VEHICLE_STATUS.BOOKED : VEHICLE_STATUS.AVAILABLE;

    if (vehicle.status !== targetStatus) {
      return Vehicle.findByIdAndUpdate(vehicleId, { status: targetStatus }, { new: true });
    }

    return vehicle;
  }
}

export default new VehicleRepository();

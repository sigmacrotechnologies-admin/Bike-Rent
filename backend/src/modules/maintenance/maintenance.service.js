import Maintenance from '../../models/Maintenance.js';
import Vehicle from '../../models/Vehicle.js';
import { NotFoundError } from '../../utils/AppError.js';
import { VEHICLE_STATUS } from '../../utils/constants.js';

class MaintenanceService {
  async create(data, userId) {
    const record = await Maintenance.create({ ...data, createdBy: userId });

    if (data.status !== 'completed') {
      await Vehicle.findByIdAndUpdate(data.vehicle, { status: VEHICLE_STATUS.MAINTENANCE });
    }
    return record;
  }

  async list(query) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.vehicleId) filter.vehicle = query.vehicleId;

    const [records, total] = await Promise.all([
      Maintenance.find(filter)
        .populate('vehicle', 'name registrationNumber type')
        .sort('-scheduledDate')
        .skip(skip)
        .limit(limit),
      Maintenance.countDocuments(filter),
    ]);
    return { records, total };
  }

  async update(id, data) {
    const record = await Maintenance.findByIdAndUpdate(id, data, { new: true });
    if (!record) throw new NotFoundError('Maintenance record not found');

    if (data.status === 'completed') {
      await Vehicle.findByIdAndUpdate(record.vehicle, {
        status: VEHICLE_STATUS.AVAILABLE,
        lastMaintenanceDate: new Date(),
        nextMaintenanceDate: data.nextMaintenanceDate,
      });
    }
    return record;
  }
}

export default new MaintenanceService();

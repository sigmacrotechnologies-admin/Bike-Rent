import GPSLog from '../../models/GPSLog.js';
import Vehicle from '../../models/Vehicle.js';
import { NotFoundError } from '../../utils/AppError.js';

class GPSService {
  async recordLocation(data) {
    const log = await GPSLog.create({
      vehicle: data.vehicleId,
      booking: data.bookingId,
      deviceId: data.deviceId,
      location: { type: 'Point', coordinates: [data.longitude, data.latitude] },
      speed: data.speed,
      heading: data.heading,
      batteryLevel: data.batteryLevel,
      ignition: data.ignition,
      isMoving: data.speed > 0,
      odometer: data.odometer,
    });

    await this._checkGeofence(data.vehicleId, data.latitude, data.longitude);
    return log;
  }

  async getLiveLocation(vehicleId) {
    const log = await GPSLog.findOne({ vehicle: vehicleId }).sort('-timestamp');
    if (!log) throw new NotFoundError('No GPS data found');
    return log;
  }

  async getRouteHistory(vehicleId, { startDate, endDate }) {
    const filter = { vehicle: vehicleId };
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    return GPSLog.find(filter).sort('timestamp').limit(1000);
  }

  async getFleetLocations() {
    const vehicles = await Vehicle.find({ isActive: true, gpsDeviceId: { $exists: true, $ne: '' } });
    const locations = await Promise.all(
      vehicles.map(async (v) => {
        const log = await GPSLog.findOne({ vehicle: v._id }).sort('-timestamp');
        return { vehicle: v, location: log };
      })
    );
    return locations.filter((l) => l.location);
  }

  async _checkGeofence(vehicleId, lat, lng) {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle?.location?.coordinates) return;

    const [hubLng, hubLat] = vehicle.location.coordinates;
    const distance = this._haversineDistance(lat, lng, hubLat, hubLng);

    if (distance > 50) {
      return { alert: 'geofence_breach', vehicleId, distance };
    }
  }

  _haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

export default new GPSService();

import ServiceArea from '../../models/ServiceArea.js';
import { NotFoundError, ConflictError } from '../../utils/AppError.js';

const toSlug = (name) =>
  name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

class LocationService {
  async listAreas(includeInactive = false) {
    const filter = includeInactive ? {} : { isActive: true };
    const areas = await ServiceArea.find(filter).sort({ name: 1 }).lean();
    return areas.map((area) => ({
      ...area,
      hubs: (area.hubs || []).filter((h) => includeInactive || h.isActive),
    }));
  }

  async createCity(data) {
    const slug = toSlug(data.name);
    const existing = await ServiceArea.findOne({ $or: [{ slug }, { name: new RegExp(`^${data.name}$`, 'i') }] });
    if (existing) throw new ConflictError('City already exists');

    return ServiceArea.create({
      name: data.name.trim(),
      slug,
      state: data.state?.trim() || 'Maharashtra',
      hubs: [],
    });
  }

  async updateCity(cityId, data) {
    const area = await ServiceArea.findById(cityId);
    if (!area) throw new NotFoundError('City not found');

    if (data.name) {
      area.name = data.name.trim();
      area.slug = toSlug(data.name);
    }
    if (data.state !== undefined) area.state = data.state.trim();
    if (data.isActive !== undefined) area.isActive = data.isActive;

    await area.save();
    return area;
  }

  async deleteCity(cityId) {
    const area = await ServiceArea.findByIdAndUpdate(cityId, { isActive: false }, { new: true });
    if (!area) throw new NotFoundError('City not found');
    return area;
  }

  async addHub(cityId, data) {
    const area = await ServiceArea.findById(cityId);
    if (!area) throw new NotFoundError('City not found');

    const duplicate = area.hubs.find((h) => h.name.toLowerCase() === data.name.trim().toLowerCase());
    if (duplicate) throw new ConflictError('Location already exists in this city');

    area.hubs.push({
      name: data.name.trim(),
      address: data.address?.trim() || '',
      isActive: true,
    });
    await area.save();
    return area;
  }

  async updateHub(cityId, hubId, data) {
    const area = await ServiceArea.findById(cityId);
    if (!area) throw new NotFoundError('City not found');

    const hub = area.hubs.id(hubId);
    if (!hub) throw new NotFoundError('Location not found');

    if (data.name) hub.name = data.name.trim();
    if (data.address !== undefined) hub.address = data.address.trim();
    if (data.isActive !== undefined) hub.isActive = data.isActive;

    await area.save();
    return area;
  }

  async deleteHub(cityId, hubId) {
    const area = await ServiceArea.findById(cityId);
    if (!area) throw new NotFoundError('City not found');

    const hub = area.hubs.id(hubId);
    if (!hub) throw new NotFoundError('Location not found');

    hub.isActive = false;
    await area.save();
    return area;
  }
}

export default new LocationService();

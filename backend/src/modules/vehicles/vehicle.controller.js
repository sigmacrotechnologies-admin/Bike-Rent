import vehicleService from './vehicle.service.js';
import { asyncHandler, successResponse, paginatedResponse } from '../../utils/response.js';
import { buildPaginationMeta } from '../../middlewares/validate.middleware.js';
import { HTTP_STATUS } from '../../utils/constants.js';

class VehicleController {
  create = asyncHandler(async (req, res) => {
    const vehicle = await vehicleService.createVehicle(req.body);
    return successResponse(res, vehicle, 'Vehicle created', HTTP_STATUS.CREATED);
  });

  getById = asyncHandler(async (req, res) => {
    const vehicle = await vehicleService.getVehicle(req.params.id, req.user);
    return successResponse(res, vehicle);
  });

  list = asyncHandler(async (req, res) => {
    const { vehicles, total } = await vehicleService.listVehicles(req.query, req.user);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    return paginatedResponse(res, vehicles, buildPaginationMeta(total, page, limit));
  });

  update = asyncHandler(async (req, res) => {
    const vehicle = await vehicleService.updateVehicle(req.params.id, req.body);
    return successResponse(res, vehicle, 'Vehicle updated');
  });

  delete = asyncHandler(async (req, res) => {
    await vehicleService.deleteVehicle(req.params.id);
    return successResponse(res, null, 'Vehicle removed from fleet');
  });

  sell = asyncHandler(async (req, res) => {
    const vehicle = await vehicleService.sellVehicle(req.params.id, req.body);
    return successResponse(res, vehicle, 'Vehicle marked as sold');
  });

  checkAvailability = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const status = await vehicleService.getAvailabilityStatus(
      req.params.id,
      new Date(startDate),
      new Date(endDate)
    );
    return successResponse(res, status);
  });
}

export default new VehicleController();

import gpsService from './gps.service.js';
import { asyncHandler, successResponse } from '../../utils/response.js';
import { HTTP_STATUS } from '../../utils/constants.js';

class GPSController {
  record = asyncHandler(async (req, res) => {
    const log = await gpsService.recordLocation(req.body);
    return successResponse(res, log, 'Location recorded', HTTP_STATUS.CREATED);
  });

  live = asyncHandler(async (req, res) => {
    const location = await gpsService.getLiveLocation(req.params.vehicleId);
    return successResponse(res, location);
  });

  history = asyncHandler(async (req, res) => {
    const history = await gpsService.getRouteHistory(req.params.vehicleId, req.query);
    return successResponse(res, history);
  });

  fleet = asyncHandler(async (req, res) => {
    const fleet = await gpsService.getFleetLocations();
    return successResponse(res, fleet);
  });
}

export default new GPSController();

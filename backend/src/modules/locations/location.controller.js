import locationService from './location.service.js';
import { asyncHandler, successResponse } from '../../utils/response.js';
import { HTTP_STATUS, ADMIN_ROLES } from '../../utils/constants.js';

class LocationController {
  list = asyncHandler(async (req, res) => {
    const isAdmin = req.user && ADMIN_ROLES.includes(req.user.role);
    const includeInactive = (req.query.admin === true || req.query.admin === 'true') && isAdmin;
    const areas = await locationService.listAreas(includeInactive);
    return successResponse(res, areas);
  });

  createCity = asyncHandler(async (req, res) => {
    const area = await locationService.createCity(req.body);
    return successResponse(res, area, 'City created', HTTP_STATUS.CREATED);
  });

  updateCity = asyncHandler(async (req, res) => {
    const area = await locationService.updateCity(req.params.cityId, req.body);
    return successResponse(res, area, 'City updated');
  });

  deleteCity = asyncHandler(async (req, res) => {
    await locationService.deleteCity(req.params.cityId);
    return successResponse(res, null, 'City deactivated');
  });

  addHub = asyncHandler(async (req, res) => {
    const area = await locationService.addHub(req.params.cityId, req.body);
    return successResponse(res, area, 'Location added', HTTP_STATUS.CREATED);
  });

  updateHub = asyncHandler(async (req, res) => {
    const area = await locationService.updateHub(req.params.cityId, req.params.hubId, req.body);
    return successResponse(res, area, 'Location updated');
  });

  deleteHub = asyncHandler(async (req, res) => {
    const area = await locationService.deleteHub(req.params.cityId, req.params.hubId);
    return successResponse(res, area, 'Location deactivated');
  });
}

export default new LocationController();

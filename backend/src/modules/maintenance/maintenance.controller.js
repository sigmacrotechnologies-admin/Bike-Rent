import maintenanceService from './maintenance.service.js';
import { asyncHandler, successResponse, paginatedResponse } from '../../utils/response.js';
import { buildPaginationMeta } from '../../middlewares/validate.middleware.js';
import { HTTP_STATUS } from '../../utils/constants.js';

class MaintenanceController {
  create = asyncHandler(async (req, res) => {
    const record = await maintenanceService.create(req.body, req.user._id);
    return successResponse(res, record, 'Maintenance scheduled', HTTP_STATUS.CREATED);
  });

  list = asyncHandler(async (req, res) => {
    const { records, total } = await maintenanceService.list(req.query);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    return paginatedResponse(res, records, buildPaginationMeta(total, page, limit));
  });

  update = asyncHandler(async (req, res) => {
    const record = await maintenanceService.update(req.params.id, req.body);
    return successResponse(res, record, 'Maintenance updated');
  });
}

export default new MaintenanceController();

import analyticsService from './analytics.service.js';
import { asyncHandler, successResponse } from '../../utils/response.js';

class AnalyticsController {
  dashboard = asyncHandler(async (req, res) => {
    const stats = await analyticsService.getDashboardStats();
    return successResponse(res, stats);
  });

  reports = asyncHandler(async (req, res) => {
    const reports = await analyticsService.getReports(req.query);
    return successResponse(res, reports);
  });
}

export default new AnalyticsController();

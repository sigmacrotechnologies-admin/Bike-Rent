import notificationService from './notification.service.js';
import { asyncHandler, successResponse } from '../../utils/response.js';

class NotificationController {
  list = asyncHandler(async (req, res) => {
    const result = await notificationService.list(req.user._id, req.query);
    return successResponse(res, result);
  });

  markAsRead = asyncHandler(async (req, res) => {
    const notification = await notificationService.markAsRead(req.user._id, req.params.id);
    return successResponse(res, notification);
  });

  markAllAsRead = asyncHandler(async (req, res) => {
    await notificationService.markAllAsRead(req.user._id);
    return successResponse(res, null, 'All notifications marked as read');
  });
}

export default new NotificationController();

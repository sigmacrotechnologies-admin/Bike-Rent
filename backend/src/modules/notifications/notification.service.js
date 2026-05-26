import Notification from '../../models/Notification.js';

class NotificationService {
  async create(userId, { type, title, message, data, link }) {
    return Notification.create({ user: userId, type, title, message, data, link });
  }

  async list(userId, query) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = { user: userId };
    if (query.unreadOnly === 'true') filter.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort('-createdAt').skip(skip).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: userId, isRead: false }),
    ]);

    return { notifications, total, unreadCount };
  }

  async markAsRead(userId, notificationId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  }

  async markAllAsRead(userId) {
    await Notification.updateMany({ user: userId, isRead: false }, { isRead: true, readAt: new Date() });
  }
}

export default new NotificationService();

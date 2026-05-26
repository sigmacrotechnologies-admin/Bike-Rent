import Booking from '../../models/Booking.js';
import Payment from '../../models/Payment.js';
import Vehicle from '../../models/Vehicle.js';
import User from '../../models/User.js';
import SupportTicket from '../../models/SupportTicket.js';
import { BOOKING_STATUS, PAYMENT_STATUS, VEHICLE_STATUS } from '../../utils/constants.js';

class AnalyticsService {
  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    const [
      totalBookings,
      activeBookings,
      totalRevenue,
      monthlyRevenue,
      totalVehicles,
      availableVehicles,
      totalCustomers,
      pendingKYC,
      openTickets,
      bookingsByStatus,
      revenueByMonth,
      topVehicles,
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: BOOKING_STATUS.ACTIVE }),
      Payment.aggregate([
        { $match: { status: PAYMENT_STATUS.COMPLETED } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { status: PAYMENT_STATUS.COMPLETED, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Vehicle.countDocuments({ isActive: true }),
      Vehicle.countDocuments({ status: VEHICLE_STATUS.AVAILABLE, isActive: true }),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ 'kyc.status': 'pending' }),
      SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      Booking.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { status: PAYMENT_STATUS.COMPLETED, createdAt: { $gte: new Date(now.getFullYear(), 0, 1) } } },
        {
          $group: {
            _id: { $month: '$createdAt' },
            revenue: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Booking.aggregate([
        { $match: { status: BOOKING_STATUS.COMPLETED } },
        { $group: { _id: '$vehicle', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'vehicles', localField: '_id', foreignField: '_id', as: 'vehicle' } },
        { $unwind: '$vehicle' },
        { $project: { name: '$vehicle.name', type: '$vehicle.type', count: 1 } },
      ]),
    ]);

    return {
      kpis: {
        totalBookings,
        activeBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        totalVehicles,
        availableVehicles,
        fleetUtilization: totalVehicles ? Math.round(((totalVehicles - availableVehicles) / totalVehicles) * 100) : 0,
        totalCustomers,
        pendingKYC,
        openTickets,
      },
      bookingsByStatus: bookingsByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      revenueByMonth,
      topVehicles,
    };
  }

  async getReports(query) {
    const { startDate, endDate, type } = query;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    if (type === 'revenue') {
      return Payment.find({
        status: PAYMENT_STATUS.COMPLETED,
        ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
      }).populate('booking user', 'bookingNumber firstName lastName email');
    }

    return Booking.find({
      ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
    }).populate('user vehicle', 'firstName lastName email name type');
  }
}

export default new AnalyticsService();

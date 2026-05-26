import SupportTicket from '../../models/SupportTicket.js';
import { NotFoundError } from '../../utils/AppError.js';

const generateTicketNumber = () => `TKT-${Date.now().toString(36).toUpperCase()}`;

class SupportService {
  async createTicket(userId, data) {
    return SupportTicket.create({
      ...data,
      ticketNumber: generateTicketNumber(),
      user: userId,
    });
  }

  async getTicket(id, userId, role) {
    const ticket = await SupportTicket.findById(id)
      .populate('user', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName');
    if (!ticket) throw new NotFoundError('Ticket not found');

    const isAdmin = ['super_admin', 'admin', 'staff'].includes(role);
    if (!isAdmin && ticket.user._id.toString() !== userId.toString()) {
      throw new NotFoundError('Ticket not found');
    }
    return ticket;
  }

  async listTickets(query, userId, role) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    const isAdmin = ['super_admin', 'admin', 'staff'].includes(role);
    if (!isAdmin) filter.user = userId;
    if (query.status) filter.status = query.status;

    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter).sort('-createdAt').skip(skip).limit(limit).populate('user', 'firstName lastName email'),
      SupportTicket.countDocuments(filter),
    ]);
    return { tickets, total };
  }

  async addMessage(ticketId, userId, message) {
    const ticket = await SupportTicket.findByIdAndUpdate(
      ticketId,
      { $push: { messages: { sender: userId, message } } },
      { new: true }
    );
    if (!ticket) throw new NotFoundError('Ticket not found');
    return ticket;
  }

  async updateTicket(id, data) {
    const ticket = await SupportTicket.findByIdAndUpdate(id, data, { new: true });
    if (!ticket) throw new NotFoundError('Ticket not found');
    return ticket;
  }
}

export default new SupportService();

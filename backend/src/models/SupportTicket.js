import mongoose from 'mongoose';
import { TICKET_STATUS } from '../utils/constants.js';

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, unique: true, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['booking', 'payment', 'vehicle', 'account', 'technical', 'other'],
      default: 'other',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: Object.values(TICKET_STATUS),
      default: TICKET_STATUS.OPEN,
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    messages: [{
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      message: String,
      attachments: [String],
      createdAt: { type: Date, default: Date.now },
    }],
    resolvedAt: Date,
  },
  { timestamps: true }
);

supportTicketSchema.index({ user: 1, status: 1 });
supportTicketSchema.index({ ticketNumber: 1 });

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
export default SupportTicket;

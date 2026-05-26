import mongoose from 'mongoose';

const bookingHistorySchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    action: {
      type: String,
      enum: ['created', 'confirmed', 'started', 'extended', 'completed', 'cancelled', 'modified', 'return_completed'],
      required: true,
    },
    previousStatus: String,
    newStatus: String,
    changes: mongoose.Schema.Types.Mixed,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: String,
  },
  { timestamps: true }
);

bookingHistorySchema.index({ booking: 1, createdAt: -1 });

const BookingHistory = mongoose.model('BookingHistory', bookingHistorySchema);
export default BookingHistory;

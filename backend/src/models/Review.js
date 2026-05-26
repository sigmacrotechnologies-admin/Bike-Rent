import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: String,
    comment: String,
    isVerified: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

reviewSchema.index({ vehicle: 1, isPublished: 1 });
reviewSchema.index({ user: 1, booking: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;

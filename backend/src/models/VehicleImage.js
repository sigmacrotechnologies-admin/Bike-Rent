import mongoose from 'mongoose';

const vehicleImageSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    url: { type: String, required: true },
    publicId: String,
    alt: String,
    isPrimary: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

vehicleImageSchema.index({ vehicle: 1 });

const VehicleImage = mongoose.model('VehicleImage', vehicleImageSchema);
export default VehicleImage;

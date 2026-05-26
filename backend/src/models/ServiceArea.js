import mongoose from 'mongoose';

const hubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { _id: true, timestamps: true }
);

const serviceAreaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    state: { type: String, trim: true, default: 'Maharashtra' },
    isActive: { type: Boolean, default: true },
    hubs: [hubSchema],
  },
  { timestamps: true }
);

serviceAreaSchema.index({ name: 1 });
serviceAreaSchema.index({ slug: 1 });

const ServiceArea = mongoose.model('ServiceArea', serviceAreaSchema);
export default ServiceArea;

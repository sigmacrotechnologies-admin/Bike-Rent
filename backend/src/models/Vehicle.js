import mongoose from 'mongoose';
import { VEHICLE_TYPES, VEHICLE_STATUS } from '../utils/constants.js';

const pricingSchema = new mongoose.Schema({
  hourly: { type: Number, required: true, min: 0 },
  daily: { type: Number, required: true, min: 0 },
  weekly: { type: Number, min: 0 },
  monthly: { type: Number, min: 0 },
  securityDeposit: { type: Number, default: 0 },
  lateFeePerHour: { type: Number, default: 0 },
  taxPercent: { type: Number, default: 18, min: 0, max: 100 },
});

const specsSchema = new mongoose.Schema({
  brand: String,
  model: String,
  year: Number,
  color: String,
  fuelType: { type: String, enum: ['petrol', 'diesel', 'electric', 'hybrid', 'cng'] },
  transmission: { type: String, enum: ['manual', 'automatic'] },
  seats: Number,
  mileage: Number,
  engineCapacity: String,
  batteryCapacity: String,
  range: Number,
  topSpeed: Number,
});

const locationSchema = new mongoose.Schema({
  hub: { type: String, required: true },
  city: { type: String, required: true },
  address: String,
  coordinates: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
});

const vehicleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    type: { type: String, enum: Object.values(VEHICLE_TYPES), required: true },
    registrationNumber: { type: String, required: true, unique: true, uppercase: true },
    status: {
      type: String,
      enum: Object.values(VEHICLE_STATUS),
      default: VEHICLE_STATUS.AVAILABLE,
    },
    specs: specsSchema,
    pricing: pricingSchema,
    location: locationSchema,
    images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'VehicleImage' }],
    thumbnail: String,
    features: [String],
    description: String,
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    gpsDeviceId: String,
    currentOdometer: { type: Number, default: 0 },
    lastMaintenanceDate: Date,
    nextMaintenanceDate: Date,
    dynamicPricingMultiplier: { type: Number, default: 1, min: 0.5, max: 3 },
    saleInfo: {
      salePrice: Number,
      soldTo: String,
      notes: String,
      soldAt: Date,
    },
  },
  { timestamps: true }
);

vehicleSchema.index({ type: 1, status: 1 });
vehicleSchema.index({ 'location.city': 1 });
vehicleSchema.index({ 'location.coordinates': '2dsphere' });
vehicleSchema.index({ slug: 1 });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;

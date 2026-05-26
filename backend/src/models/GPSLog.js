import mongoose from 'mongoose';

const gpsLogSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    deviceId: String,
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    speed: { type: Number, default: 0 },
    heading: Number,
    altitude: Number,
    accuracy: Number,
    batteryLevel: Number,
    ignition: { type: Boolean, default: false },
    isMoving: { type: Boolean, default: false },
    odometer: Number,
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

gpsLogSchema.index({ vehicle: 1, timestamp: -1 });
gpsLogSchema.index({ location: '2dsphere' });
gpsLogSchema.index({ deviceId: 1, timestamp: -1 });

const GPSLog = mongoose.model('GPSLog', gpsLogSchema);
export default GPSLog;

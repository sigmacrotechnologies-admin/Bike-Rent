import mongoose from 'mongoose';

const maintenanceSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    type: {
      type: String,
      enum: ['scheduled', 'repair', 'inspection', 'emergency'],
      required: true,
    },
    title: { type: String, required: true },
    description: String,
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    scheduledDate: Date,
    completedDate: Date,
    cost: { type: Number, default: 0 },
    odometerAtService: Number,
    serviceProvider: String,
    partsReplaced: [String],
    notes: String,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

maintenanceSchema.index({ vehicle: 1, status: 1 });
maintenanceSchema.index({ scheduledDate: 1 });

const Maintenance = mongoose.model('Maintenance', maintenanceSchema);
export default Maintenance;

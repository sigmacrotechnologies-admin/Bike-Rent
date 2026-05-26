import mongoose from 'mongoose';
import { ROLES } from '../utils/constants.js';

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
      unique: true,
    },
    permissions: [{
      resource: String,
      actions: [{ type: String, enum: ['create', 'read', 'update', 'delete', 'manage'] }],
    }],
    description: String,
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Role = mongoose.model('Role', roleSchema);
export default Role;

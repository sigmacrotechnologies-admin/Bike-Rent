import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, KYC_STATUS } from '../utils/constants.js';

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: { type: String, default: 'India' },
});

const kycSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: Object.values(KYC_STATUS),
    default: KYC_STATUS.NOT_SUBMITTED,
  },
  documentType: { type: String, enum: ['aadhar', 'pan', 'passport', 'driving_license'] },
  documentNumber: String,
  documentFrontUrl: String,
  documentBackUrl: String,
  drivingLicenseUrl: String,
  aadharNumber: String,
  licenseNumber: String,
  profilePhotoUrl: String,
  verifiedAt: Date,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: String,
});

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CUSTOMER,
    },
    avatar: String,
    dateOfBirth: Date,
    address: addressSchema,
    kyc: kycSchema,
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    refreshTokens: [{ token: String, expiresAt: Date }],
    lastLogin: Date,
    preferences: {
      notifications: { type: Boolean, default: true },
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);
export default User;

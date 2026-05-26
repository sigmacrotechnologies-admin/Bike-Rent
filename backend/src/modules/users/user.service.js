import User from '../../models/User.js';
import { NotFoundError } from '../../utils/AppError.js';
import { KYC_STATUS } from '../../utils/constants.js';

class UserService {
  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  async updateProfile(userId, data) {
    return User.findByIdAndUpdate(userId, data, { new: true, runValidators: true });
  }

  async listCustomers(query) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = { role: 'customer' };
    if (query.search) {
      filter.$or = [
        { firstName: new RegExp(query.search, 'i') },
        { lastName: new RegExp(query.search, 'i') },
        { email: new RegExp(query.search, 'i') },
      ];
    }
    if (query.kycStatus) filter['kyc.status'] = query.kycStatus;

    const [users, total] = await Promise.all([
      User.find(filter).sort('-createdAt').skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);
    return { users, total };
  }

  async submitKYC(userId, data) {
    const update = {
      address: data.address,
      avatar: data.profilePhotoUrl || undefined,
      'kyc.aadharNumber': data.aadharNumber,
      'kyc.licenseNumber': data.licenseNumber,
      'kyc.profilePhotoUrl': data.profilePhotoUrl,
      'kyc.documentNumber': data.aadharNumber,
      'kyc.documentType': 'aadhar',
      'kyc.documentFrontUrl': data.documentFrontUrl,
      'kyc.drivingLicenseUrl': data.drivingLicenseUrl,
      'kyc.status': KYC_STATUS.PENDING,
    };
    if (data.fullName) {
      const parts = data.fullName.trim().split(/\s+/);
      update.firstName = parts[0];
      update.lastName = parts.slice(1).join(' ') || parts[0];
    }
    return User.findByIdAndUpdate(userId, update, { new: true, runValidators: true });
  }

  async verifyKYC(userId, adminId, { status, rejectionReason }) {
    const update = {
      'kyc.status': status,
      'kyc.verifiedAt': status === KYC_STATUS.VERIFIED ? new Date() : undefined,
      'kyc.verifiedBy': adminId,
      'kyc.rejectionReason': rejectionReason,
    };
    return User.findByIdAndUpdate(userId, update, { new: true });
  }
}

export default new UserService();

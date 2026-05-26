import User from '../../models/User.js';
import { ConflictError, NotFoundError } from '../../utils/AppError.js';

class AuthRepository {
  async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() }).select('+password');
  }

  async findById(id) {
    return User.findById(id);
  }

  async create(userData) {
    return User.create(userData);
  }

  async updateRefreshTokens(userId, refreshTokens) {
    return User.findByIdAndUpdate(userId, { refreshTokens }, { new: true });
  }

  async updateLastLogin(userId) {
    return User.findByIdAndUpdate(userId, { lastLogin: new Date() });
  }

  async emailExists(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) throw new ConflictError('Email already registered');
  }

  async phoneExists(phone) {
    const user = await User.findOne({ phone });
    if (user) throw new ConflictError('Phone number already registered');
  }
}

export default new AuthRepository();

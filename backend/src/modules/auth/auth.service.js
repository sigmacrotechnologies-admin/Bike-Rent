import authRepository from './auth.repository.js';
import { generateTokenPair, verifyRefreshToken } from '../../utils/jwt.js';
import { UnauthorizedError, NotFoundError } from '../../utils/AppError.js';
import { ROLES } from '../../utils/constants.js';

class AuthService {
  async register(data) {
    await authRepository.emailExists(data.email);
    await authRepository.phoneExists(data.phone);

    const user = await authRepository.create({
      ...data,
      role: ROLES.CUSTOMER,
    });

    const tokens = generateTokenPair(user);
    await this._storeRefreshToken(user._id, tokens.refreshToken);

    const userObj = user.toObject();
    delete userObj.password;

    return { user: userObj, ...tokens };
  }

  async login(email, password) {
    const user = await authRepository.findByEmail(email);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const tokens = generateTokenPair(user);
    await this._storeRefreshToken(user._id, tokens.refreshToken);
    await authRepository.updateLastLogin(user._id);

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshTokens;

    return { user: userObj, ...tokens };
  }

  async refreshToken(token) {
    const decoded = verifyRefreshToken(token);
    const user = await authRepository.findById(decoded.id);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const stored = user.refreshTokens?.find((rt) => rt.token === token);
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token expired or revoked');
    }

    const tokens = generateTokenPair(user);
    await this._storeRefreshToken(user._id, tokens.refreshToken, token);

    return tokens;
  }

  async logout(userId, refreshToken) {
    const user = await authRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const tokens = user.refreshTokens?.filter((rt) => rt.token !== refreshToken) || [];
    await authRepository.updateRefreshTokens(userId, tokens);
  }

  async _storeRefreshToken(userId, newToken, oldToken = null) {
    const user = await authRepository.findById(userId);
    let tokens = user.refreshTokens || [];

    if (oldToken) {
      tokens = tokens.filter((rt) => rt.token !== oldToken);
    }

    tokens.push({
      token: newToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    if (tokens.length > 5) tokens = tokens.slice(-5);
    await authRepository.updateRefreshTokens(userId, tokens);
  }
}

export default new AuthService();

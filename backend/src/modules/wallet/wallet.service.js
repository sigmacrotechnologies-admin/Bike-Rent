import Wallet from '../../models/Wallet.js';
import WalletTransaction from '../../models/WalletTransaction.js';
import User from '../../models/User.js';
import { NotFoundError, ValidationError } from '../../utils/AppError.js';
import { WALLET_TX_TYPE } from '../../utils/constants.js';

const DEMO_WALLET_BALANCE = 25000;

class WalletService {
  async getOrCreateWallet(userId) {
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      const user = await User.findById(userId);
      const initialBalance = user?.role === 'customer' ? DEMO_WALLET_BALANCE : 0;
      wallet = await Wallet.create({ user: userId, balance: initialBalance });

      if (initialBalance > 0) {
        await WalletTransaction.create({
          wallet: wallet._id,
          user: userId,
          type: WALLET_TX_TYPE.TOPUP,
          amount: initialBalance,
          balanceAfter: initialBalance,
          description: 'Demo wallet balance (replace with payment gateway later)',
          referenceType: 'topup',
        });
      }
    } else if (wallet.balance === 0) {
      const txCount = await WalletTransaction.countDocuments({ wallet: wallet._id });
      const user = await User.findById(userId);
      if (txCount === 0 && user?.role === 'customer') {
        await Wallet.findByIdAndUpdate(wallet._id, { balance: DEMO_WALLET_BALANCE });
        await WalletTransaction.create({
          wallet: wallet._id,
          user: userId,
          type: WALLET_TX_TYPE.TOPUP,
          amount: DEMO_WALLET_BALANCE,
          balanceAfter: DEMO_WALLET_BALANCE,
          description: 'Demo wallet balance (replace with payment gateway later)',
          referenceType: 'topup',
        });
        wallet = await Wallet.findById(wallet._id);
      }
    }
    return wallet;
  }

  async getBalance(userId) {
    const wallet = await this.getOrCreateWallet(userId);
    return wallet;
  }

  async listTransactions(userId, query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const wallet = await this.getOrCreateWallet(userId);
    const [transactions, total] = await Promise.all([
      WalletTransaction.find({ wallet: wallet._id })
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      WalletTransaction.countDocuments({ wallet: wallet._id }),
    ]);

    return { wallet, transactions, total };
  }

  async credit(userId, amount, { type = WALLET_TX_TYPE.CREDIT, description, referenceType, referenceId, createdBy } = {}) {
    if (amount <= 0) throw new ValidationError('Amount must be positive');

    const wallet = await this.getOrCreateWallet(userId);
    const newBalance = wallet.balance + amount;

    await Wallet.findByIdAndUpdate(wallet._id, { balance: newBalance });
    const tx = await WalletTransaction.create({
      wallet: wallet._id,
      user: userId,
      type,
      amount,
      balanceAfter: newBalance,
      description,
      referenceType,
      referenceId,
      createdBy,
    });

    return { wallet: { ...wallet.toObject(), balance: newBalance }, transaction: tx };
  }

  async debit(userId, amount, { type = WALLET_TX_TYPE.DEBIT, description, referenceType, referenceId, createdBy } = {}) {
    if (amount <= 0) throw new ValidationError('Amount must be positive');

    const wallet = await this.getOrCreateWallet(userId);
    if (wallet.balance < amount) {
      throw new ValidationError(`Insufficient wallet balance. Available: ₹${wallet.balance}`);
    }

    const newBalance = wallet.balance - amount;
    await Wallet.findByIdAndUpdate(wallet._id, { balance: newBalance });

    const tx = await WalletTransaction.create({
      wallet: wallet._id,
      user: userId,
      type,
      amount,
      balanceAfter: newBalance,
      description,
      referenceType,
      referenceId,
      createdBy,
    });

    return { wallet: { ...wallet.toObject(), balance: newBalance }, transaction: tx };
  }

  async adminAdjust(userId, amount, adminId, description) {
    if (amount === 0) throw new ValidationError('Adjustment amount cannot be zero');

    if (amount > 0) {
      return this.credit(userId, amount, {
        type: WALLET_TX_TYPE.ADMIN_ADJUST,
        description: description || 'Admin credit adjustment',
        referenceType: 'admin',
        createdBy: adminId,
      });
    }

    return this.debit(userId, Math.abs(amount), {
      type: WALLET_TX_TYPE.ADMIN_ADJUST,
      description: description || 'Admin debit adjustment',
      referenceType: 'admin',
      createdBy: adminId,
    });
  }

  async topUp(userId, amount, _provider = 'manual') {
    return this.credit(userId, amount, {
      type: WALLET_TX_TYPE.TOPUP,
      description: `Wallet top-up (₹${amount})`,
      referenceType: 'topup',
    });
  }

  async listAllWallets(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.search) {
      const users = await User.find({
        role: 'customer',
        $or: [
          { firstName: new RegExp(query.search, 'i') },
          { lastName: new RegExp(query.search, 'i') },
          { email: new RegExp(query.search, 'i') },
        ],
      }).select('_id');
      filter.user = { $in: users.map((u) => u._id) };
    }

    const [wallets, total] = await Promise.all([
      Wallet.find(filter)
        .populate('user', 'firstName lastName email phone')
        .sort('-updatedAt')
        .skip(skip)
        .limit(limit),
      Wallet.countDocuments(filter),
    ]);

    return { wallets, total };
  }
}

export default new WalletService();

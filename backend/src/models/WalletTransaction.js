import mongoose from 'mongoose';
import { WALLET_TX_TYPE } from '../utils/constants.js';

const walletTransactionSchema = new mongoose.Schema(
  {
    wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(WALLET_TX_TYPE), required: true },
    amount: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true },
    description: String,
    referenceType: { type: String, enum: ['booking', 'payment', 'admin', 'topup'] },
    referenceId: mongoose.Schema.Types.ObjectId,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

walletTransactionSchema.index({ user: 1, createdAt: -1 });
walletTransactionSchema.index({ wallet: 1 });

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);
export default WalletTransaction;

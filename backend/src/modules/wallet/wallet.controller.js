import walletService from './wallet.service.js';
import { asyncHandler, successResponse, paginatedResponse } from '../../utils/response.js';
import { buildPaginationMeta } from '../../middlewares/validate.middleware.js';
import { HTTP_STATUS } from '../../utils/constants.js';

class WalletController {
  getBalance = asyncHandler(async (req, res) => {
    const wallet = await walletService.getBalance(req.user._id);
    return successResponse(res, wallet);
  });

  listTransactions = asyncHandler(async (req, res) => {
    const { wallet, transactions, total } = await walletService.listTransactions(req.user._id, req.query);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    return paginatedResponse(res, { wallet, transactions }, buildPaginationMeta(total, page, limit));
  });

  topUp = asyncHandler(async (req, res) => {
    const result = await walletService.topUp(req.user._id, req.body.amount);
    return successResponse(res, result, 'Wallet topped up', HTTP_STATUS.CREATED);
  });

  listAll = asyncHandler(async (req, res) => {
    const { wallets, total } = await walletService.listAllWallets(req.query);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    return paginatedResponse(res, wallets, buildPaginationMeta(total, page, limit));
  });

  adminAdjust = asyncHandler(async (req, res) => {
    const result = await walletService.adminAdjust(
      req.params.userId,
      req.body.amount,
      req.user._id,
      req.body.description
    );
    return successResponse(res, result, 'Wallet adjusted');
  });
}

export default new WalletController();

import { Router } from 'express';
import { getDepositInfo, getBalanceAndLedger, getPromotionalAssets } from '../controllers/walletController.js';
import { withdrawInitiate, withdrawConfirm, getMyWithdrawals } from '../controllers/withdrawalController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/wallet/deposit-info', protect, getDepositInfo);
router.get('/wallet/promotional-assets', protect, getPromotionalAssets);
router.get('/ledger/balance', protect, getBalanceAndLedger);
router.post('/wallet/withdraw-initiate', protect, withdrawInitiate);
router.post('/wallet/withdraw-confirm', protect, withdrawConfirm);
router.get('/wallet/my-withdrawals', protect, getMyWithdrawals);

export default router;

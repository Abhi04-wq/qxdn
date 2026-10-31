import { Router } from 'express';
import { getReferralLink, getPlatformOverview, getAllStakes, getMemberDetail, getMemberTree, getReleaseLogs, getAdminIncomeLedger, impersonateMember, updateUserStatus } from '../controllers/adminController.js';
import { getAdminWithdrawals, processWithdrawalRequest } from '../controllers/adminWithdrawalController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.use('/admin', protect, requireAdmin);
router.get('/admin', (_req, res) => {
  res.status(200).json({ success: true, message: 'Admin API root' });
});
router.get('/admin/referral-link', getReferralLink);
router.get('/admin/overview', getPlatformOverview);
router.get('/admin/all-stakes', getAllStakes);
router.get('/admin/income-ledger', getAdminIncomeLedger);
router.get('/admin/member/:userId', getMemberDetail);
router.patch('/admin/users/:id/status', updateUserStatus);
router.patch('/admin/member/:userId/status', updateUserStatus);
router.get('/admin/member-tree/:userId', getMemberTree);
router.post('/admin/impersonate/:userId', impersonateMember);
router.get('/admin/release-logs', getReleaseLogs);
router.get('/admin/withdrawals', getAdminWithdrawals);
router.post('/admin/withdrawals/:id/process', processWithdrawalRequest);

export default router;

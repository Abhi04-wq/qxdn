import { Router } from 'express';
import { simulateDeposit, runDailyAccrual, runSaturdayRelease, getReleaseHistory } from '../controllers/testController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/test/simulate-deposit', protect, simulateDeposit);
router.post('/test/run-daily-accrual', protect, runDailyAccrual);
router.post('/test/run-saturday-release', protect, runSaturdayRelease);
router.get('/test/release-history', protect, getReleaseHistory);

export default router;

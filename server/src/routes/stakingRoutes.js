import { Router } from 'express';
import { createStake, getMyStakes } from '../controllers/stakingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/staking/create', protect, createStake);
router.get('/staking/my-stakes', protect, getMyStakes);

export default router;

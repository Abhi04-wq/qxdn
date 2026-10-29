import { Router } from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';
import { getTeamBreakdown, getDownlineTree, MAX_LEVEL } from '../services/referralService.js';

const router = Router();

// Reusable payload for every member referral response
const getReferralIdentity = async (userId) => {
  const user = await User.findById(userId).select('referralCode sponsorCode');
  if (!user) return null;
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  return {
    referralCode: user.referralCode,
    sponsorCode: user.sponsorCode,
    referralLink: `${clientUrl}/register?ref=${user.referralCode}`,
  };
};

// @route   GET /api/referral/link
// @desc    Member's referral link + sponsor code (with copy support)
router.get('/referral/link', protect, async (req, res, next) => {
  try {
    const identity = await getReferralIdentity(req.user.id);
    if (!identity) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: identity });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/referral/team
// @desc    Team breakdown grouped by level L1..L10: count, volume, earned commission
router.get('/referral/team', protect, async (req, res, next) => {
  try {
    const [identity, breakdown] = await Promise.all([
      getReferralIdentity(req.user.id),
      getTeamBreakdown(req.user.id),
    ]);
    if (!identity) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: { ...identity, maxLevel: MAX_LEVEL, ...breakdown } });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/referral/tree
// @desc    Nested downline tree for the member "My Team" tab
router.get('/referral/tree', protect, async (req, res, next) => {
  try {
    const [identity, tree] = await Promise.all([
      getReferralIdentity(req.user.id),
      getDownlineTree(req.user.id),
    ]);
    if (!identity) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: { ...identity, maxLevel: MAX_LEVEL, tree } });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/referral/count
// @desc    Number of members sponsored by the logged-in user (Step 2 compat)
router.get('/referral/count', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('referralCode');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const totalReferrals = await User.countDocuments({ sponsorCode: user.referralCode });
    res.status(200).json({ success: true, data: { totalReferrals } });
  } catch (error) {
    next(error);
  }
});

export default router;

import User from '../models/User.js';
import Ledger from '../models/Ledger.js';
import StakingPosition from '../models/StakingPosition.js';
import { deriveBalances } from '../services/balanceService.js';
import { distributeReferralCommissions } from '../services/referralService.js';
import { creditPromotionalRewards } from '../services/promotionalService.js';

const MIN_STAKE = 100;

// 6dp fixed-point rounding guards against float drift (USDT has 6 decimals)
const round = (n) => Math.round((Number(n) || 0) * 1e6) / 1e6;

// Developer Plan v2 tier rules: 100-1,000 -> 0.40% | 1,001-5,000 -> 0.45% | >5,000 -> 0.50%
const resolveDailyRate = (amount) => {
  if (amount <= 1000) return 0.004;
  if (amount <= 5000) return 0.0045;
  return 0.005;
};

// @route   POST /api/staking/create
// @desc    Activate a stake: lock principal from available deposit balance + pay sponsor bonus
export const createStake = async (req, res, next) => {
  try {
    const value = round(Number(req.body.amount));

    if (!Number.isFinite(value) || value <= 0) {
      return res.status(400).json({ success: false, message: 'Stake amount must be a positive number' });
    }
    if (value < MIN_STAKE) {
      return res.status(400).json({ success: false, message: `Minimum stake is ${MIN_STAKE} USDT` });
    }

    // Core rule: available balance is derived dynamically from the append-only ledger,
    // never read from a stored column.
    const balances = await deriveBalances(req.user.id);
    if (balances.availableDeposit < value) {
      return res.status(400).json({ success: false, message: 'Insufficient deposit balance' });
    }

    const dailyRate = resolveDailyRate(value);

    const stake = await StakingPosition.create({
      userId: req.user.id,
      amount: value,
      dailyRate,
      ruleVersion: 'v2.0',
      cumulativeReward: 0,
      maxRewardCap: round(value * 1.0),
      status: 'active',
      startDate: Date.now(),
    });

    // STAKE_LOCK debit is confirmed immediately: principal leaves availableDeposit at once
    const stakeLockEntry = await Ledger.appendConfirmed({
      userId: req.user.id,
      type: 'STAKE_LOCK',
      amount: -value,
      currency: 'USDT',
      status: 'confirmed',
      confirmations: 15,
      metadata: { stakeId: stake._id, ruleVersion: 'v2.0' },
    });

    // Step 4: multi-level referral engine - walk upline L1..L10 and append a
    // pending REFERRAL_BONUS ledger entry for every qualified sponsor.
    const referralResult = await distributeReferralCommissions(req.user.id, value, stake._id);

    // Step 6: Promotional Token Rewards Engine (SHIB, VET, WILD, DOGE Allocation)
    // Instantly credit promotional reward package based on stake amount tier
    const promotionalRewards = await creditPromotionalRewards(req.user.id, stake._id, value);

    const updatedBalances = await deriveBalances(req.user.id);

    res.status(201).json({
      success: true,
      message: 'Stake activated successfully',
      data: {
        stake,
        stakeLockLedger: stakeLockEntry,
        referralCommissions: referralResult
          ? {
              totalCommissions: referralResult.totalCommissions,
              entries: referralResult.entries,
              skipped: referralResult.skipped,
            }
          : null,
        promotionalRewards,
        balances: updatedBalances,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/staking/my-stakes
// @desc    All staking positions for the authenticated member + 100% cap progress
export const getMyStakes = async (req, res, next) => {
  try {
    const stakes = await StakingPosition.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    const data = stakes.map((s) => ({
      ...s,
      progressPercent: s.maxRewardCap
        ? Math.min(100, round((s.cumulativeReward / s.maxRewardCap) * 100))
        : 0,
    }));

    res.status(200).json({
      success: true,
      data: { stakes: data, totalStaked: round(stakes.filter((s) => s.status === 'active').reduce((sum, s) => sum + s.amount, 0)) },
    });
  } catch (error) {
    next(error);
  }
};

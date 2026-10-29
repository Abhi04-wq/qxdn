import crypto from 'crypto';
import Ledger from '../models/Ledger.js';
import StakingPosition from '../models/StakingPosition.js';
import ReleaseLog from '../models/ReleaseLog.js';
import { deriveBalances } from '../services/balanceService.js';
import { releasePendingRewards } from '../workers/releaseWorker.js';
import { executeDailyAccrual } from '../workers/accrualWorker.js';

const MIN_DEPOSIT = 100;
const round = (n) => Math.round((Number(n) || 0) * 1e6) / 1e6;
const simDateKey = (d = new Date()) => d.toISOString().slice(0, 10);

// @route   POST /api/test/simulate-deposit
// @desc    Mock on-chain BEP-20 deposit engine (development sandbox)
export const simulateDeposit = async (req, res, next) => {
  try {
    const { userId, amount, txHash } = req.body;

    // Authorization: members may only simulate for themselves
    const targetUserId = userId || req.user.id;
    if (targetUserId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot simulate deposits for another user' });
    }

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      return res.status(400).json({ success: false, message: 'Deposit amount must be a positive number' });
    }
    if (value < MIN_DEPOSIT) {
      return res.status(400).json({ success: false, message: `Minimum deposit is ${MIN_DEPOSIT} USDT` });
    }

    let hash = txHash;
    if (hash) {
      if (typeof hash !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(hash)) {
        return res.status(400).json({ success: false, message: 'txHash must be a 64-character hex string prefixed with 0x' });
      }
      const existing = await Ledger.findOne({ txHash: hash }).lean();
      if (existing) {
        return res.status(409).json({ success: false, message: 'Transaction already processed' });
      }
    } else {
      hash = `0x${crypto.randomBytes(32).toString('hex')}`;
    }

    let entry;
    try {
      entry = await Ledger.appendConfirmed({
        userId: targetUserId,
        type: 'DEPOSIT',
        amount: value,
        currency: 'USDT',
        status: 'confirmed',
        confirmations: 15,
        txHash: hash,
        metadata: { source: 'mock-engine', simulated: true },
      });
    } catch (err) {
      // Unique sparse index collision = duplicate on-chain transaction
      if (err.code === 11000 && err.keyPattern?.txHash) {
        return res.status(409).json({ success: false, message: 'Transaction already processed' });
      }
      throw err;
    }

    const balances = await deriveBalances(targetUserId);

    res.status(201).json({
      success: true,
      message: `Deposit credited: ${value} USDT (15 confirmations)`,
      data: { ledger: entry, balances },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/test/run-daily-accrual
// @desc    Sandbox simulator / manual trigger: run one accrual day (Step 4)
//          For every ACTIVE stake: idempotency check -> daily yield -> cap enforcement ->
//          append-only STAKING_DAILY_ACCRUAL (pending) -> advance cumulativeReward.
//          A stake can NEVER be credited twice for the same simulation date.
export const runDailyAccrual = async (req, res, next) => {
  try {
    const today = typeof req.body?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.body.date)
      ? req.body.date
      : undefined;

    const result = await executeDailyAccrual(today, 'manual');

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


// @route   GET /api/test/release-history
// @desc    Audit trail of all Saturday release batches (dev sandbox)
export const getReleaseHistory = async (req, res, next) => {
  try {
    const batches = await ReleaseLog.find({})
      .sort({ releasedAt: -1 })
      .limit(20)
      .populate('perUser.userId', 'email referralCode')
      .lean();

    res.status(200).json({
      success: true,
      data: { batches },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/test/run-saturday-release
// @desc    Manual trigger of the Weekly Saturday Release Engine (Step 4 sandbox).
//          Idempotent: flips every 'pending' STAKING_DAILY_ACCRUAL / REFERRAL_BONUS
//          ledger entry to 'confirmed' exactly once, appends a ReleaseLog audit
//          batch, and returns the per-user released summary.
export const runSaturdayRelease = async (req, res, next) => {
  try {
    const summary = await releasePendingRewards('manual');
    const byUser = summary.perUser.length
      ? await Promise.all(
          summary.perUser.map(async (p) => ({
            ...p,
            balances: await deriveBalances(p.userId),
          }))
        )
      : [];

    res.status(200).json({
      success: true,
      message: summary.message,
      data: {
        releaseBatch: summary.releaseBatch,
        trigger: summary.trigger,
        releasedAt: summary.releasedAt,
        totalEntries: summary.totalEntries,
        totalAmount: summary.totalAmount,
        byType: summary.byType,
        byUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

import crypto from 'crypto';
import User from '../models/User.js';
import Ledger from '../models/Ledger.js';
import { deriveBalances, ledgerHistory } from '../services/balanceService.js';
import { getPromotionalBalances } from '../services/promotionalService.js';
import { releasePendingRewards } from '../workers/releaseWorker.js';

// @route   GET /api/wallet/deposit-info
// @desc    Member's permanent mock BEP-20 deposit address + network instructions
export const getDepositInfo = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('depositAddress email referralCode');

    // Backfill for accounts created before Step 2
    if (!user.depositAddress) {
      user.depositAddress = `0x${crypto.randomBytes(20).toString('hex')}`;
      await user.save();
    }

    res.status(200).json({
      success: true,
      data: {
        depositAddress: user.depositAddress,
        network: 'BNB Smart Chain (BEP-20)',
        currency: 'USDT',
        minDeposit: 100,
        requiredConfirmations: 15,
        instructions: [
          'Send only BEP-20 USDT (BNB Smart Chain) to this address.',
          'Deposits below 100 USDT will not be credited.',
          'Funds appear after 15 network confirmations (instant in the mock engine).',
          'Sending any other asset or network will result in permanent loss.',
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/ledger/balance
// @desc    Derived balances (deposits - staked) + rewards + released + ledger history
export const getBalanceAndLedger = async (req, res, next) => {
  try {
    // If today is Saturday (UTC day 6), auto-release any pending rewards
    if (new Date().getUTCDay() === 6) {
      try {
        await releasePendingRewards('saturday-auto-sync');
      } catch (syncErr) {
        console.error('[AutoSync] Saturday release failed:', syncErr.message);
      }
    }

    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const [balances, entries] = await Promise.all([
      deriveBalances(req.user.id),
      ledgerHistory(req.user.id, limit),
    ]);

    res.status(200).json({
      success: true,
      data: { balances, ledger: entries },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/ledger/income
// @desc    Detailed income ledger entries with category breakdown & summary totals
export const getIncomeLedger = async (req, res, next) => {
  try {
    // If today is Saturday (UTC day 6), auto-release any pending rewards
    if (new Date().getUTCDay() === 6) {
      try {
        await releasePendingRewards('saturday-auto-sync');
      } catch (syncErr) {
        console.error('[AutoSync] Saturday release failed:', syncErr.message);
      }
    }

    const limit = Math.min(Number(req.query.limit) || 500, 1000);
    const { category, currency, status } = req.query;

    const filter = {};
    if (currency) filter.currency = currency;
    if (status) filter.status = status;

    // Category mapping for Income Ledger
    if (category === 'staking') {
      filter.type = 'STAKING_DAILY_ACCRUAL';
    } else if (category === 'referral') {
      filter.type = 'REFERRAL_BONUS';
    } else if (category === 'promotional') {
      filter.type = 'PROMOTIONAL_REWARD';
    } else if (category === 'unlocks') {
      filter.type = 'STAKE_UNLOCK';
    } else if (!category || category === 'all' || category === 'income') {
      filter.type = { $in: ['STAKING_DAILY_ACCRUAL', 'REFERRAL_BONUS', 'PROMOTIONAL_REWARD', 'STAKE_UNLOCK'] };
    }

    const [balances, entries, allIncomeAgg] = await Promise.all([
      deriveBalances(req.user.id),
      ledgerHistory(req.user.id, limit, filter),
      Ledger.aggregate([
        { $match: { userId: req.user._id, type: { $in: ['STAKING_DAILY_ACCRUAL', 'REFERRAL_BONUS', 'PROMOTIONAL_REWARD', 'STAKE_UNLOCK'] } } },
        {
          $group: {
            _id: { type: '$type', status: '$status', currency: '$currency' },
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Compute category breakdown totals
    let stakingTotal = 0;
    let referralTotal = 0;
    let unlocksTotal = 0;
    const promoTotals = { SHIB: 0, VET: 0, WILD: 0, DOGE: 0, USDT: 0 };

    allIncomeAgg.forEach((item) => {
      const { type, currency: curr } = item._id;
      if (type === 'STAKING_DAILY_ACCRUAL') stakingTotal += item.totalAmount;
      if (type === 'REFERRAL_BONUS') referralTotal += item.totalAmount;
      if (type === 'STAKE_UNLOCK') unlocksTotal += item.totalAmount;
      if (type === 'PROMOTIONAL_REWARD') {
        promoTotals[curr] = (promoTotals[curr] || 0) + item.totalAmount;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        balances,
        ledger: entries,
        summary: {
          stakingTotal: Math.round(stakingTotal * 1e6) / 1e6,
          referralTotal: Math.round(referralTotal * 1e6) / 1e6,
          unlocksTotal: Math.round(unlocksTotal * 1e6) / 1e6,
          promoTotals,
          totalIncome: Math.round((stakingTotal + referralTotal + unlocksTotal) * 1e6) / 1e6,
          count: entries.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/wallet/promotional-assets
// @desc    Aggregated confirmed promotional tokens (SHIB, VET, WILD, DOGE)
export const getPromotionalAssets = async (req, res, next) => {
  try {
    const assets = await getPromotionalBalances(req.user.id);
    res.status(200).json({
      success: true,
      data: { assets },
    });
  } catch (error) {
    next(error);
  }
};

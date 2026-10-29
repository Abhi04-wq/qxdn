import crypto from 'crypto';
import User from '../models/User.js';
import Ledger from '../models/Ledger.js';
import { deriveBalances, ledgerHistory } from '../services/balanceService.js';
import { getPromotionalBalances } from '../services/promotionalService.js';

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
    const [balances, entries] = await Promise.all([
      deriveBalances(req.user.id),
      ledgerHistory(req.user.id),
    ]);

    res.status(200).json({
      success: true,
      data: { balances, ledger: entries },
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

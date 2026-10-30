import mongoose from 'mongoose';
import Ledger from '../models/Ledger.js';

const round = (n) => Math.round((Number(n) || 0) * 1e6) / 1e6;

/**
 * Step 4 & 7 balance derivation (append-only ledger rule, nothing is ever stored):
 *   Confirmed deposits + Confirmed Saturday released rewards + Confirmed refunds + Confirmed STAKE_UNLOCK
 *   - Confirmed stake locks - Pending/Confirmed withdrawals
 *
 *   pendingRewards       = NOT-YET-RELEASED pending STAKING_DAILY_ACCRUAL + REFERRAL_BONUS
 *                          (unlocked every Saturday by the release worker)
 *   confirmedEarned      = STAKING_DAILY_ACCRUAL + REFERRAL_BONUS credits already released
 *   lifetimeEarned       = confirmedEarned + pendingRewards
 *   unlockedPrincipal    = STAKE_UNLOCK credits from completed stakes (100% cap reached)
 *   activeStakedAmount   = Confirmed stake locks - Confirmed STAKE_UNLOCK (currently active locked capital)
 *   availableBalance     = Inflows (deposits + released rewards + refunds + unlocked principal)
 *                          - Outflows (stake locks + withdrawals)
 *                          (strictly only Confirmed Available Balance is withdrawable)
 */
export const deriveBalances = async (userId) => {
  const uid = new mongoose.Types.ObjectId(String(userId));
  const [confirmedRows, pendingRows] = await Promise.all([
    Ledger.aggregate([
      { $match: { userId: uid, status: 'confirmed', currency: { $nin: ['SHIB', 'VET', 'WILD', 'DOGE'] } } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Ledger.aggregate([
      {
        $match: {
          userId: uid,
          status: 'pending',
          currency: { $nin: ['SHIB', 'VET', 'WILD', 'DOGE'] },
          type: { $in: ['STAKING_DAILY_ACCRUAL', 'REFERRAL_BONUS', 'WITHDRAWAL'] },
        },
      },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
  ]);

  const byType = Object.fromEntries(confirmedRows.map((r) => [r._id, round(r.total)]));
  const pendingByType = Object.fromEntries(pendingRows.map((r) => [r._id, round(r.total)]));

  const totalDeposits = byType.DEPOSIT || 0;
  const totalStakedLocked = Math.abs(byType.STAKE_LOCK || 0);
  const unlockedPrincipal = byType.STAKE_UNLOCK || 0;
  const activeStakedAmount = round(Math.max(0, totalStakedLocked - unlockedPrincipal));

  const confirmedWithdrawals = Math.abs(byType.WITHDRAWAL || 0);
  const pendingWithdrawals = Math.abs(pendingByType.WITHDRAWAL || 0);
  const withdrawalRefunds = byType.WITHDRAWAL_REFUND || 0;

  const netWithdrawals = round(Math.max(0, confirmedWithdrawals + pendingWithdrawals - withdrawalRefunds));

  const confirmedStakingRewards = byType.STAKING_DAILY_ACCRUAL || 0;
  const confirmedReferralRewards = byType.REFERRAL_BONUS || 0;
  const confirmedEarned = round(confirmedStakingRewards + confirmedReferralRewards);

  const pendingStaking = pendingByType.STAKING_DAILY_ACCRUAL || 0;
  const pendingReferral = pendingByType.REFERRAL_BONUS || 0;
  const pendingRewards = round(pendingStaking + pendingReferral);
  const lifetimeEarned = round(confirmedEarned + pendingRewards);

  // Financial Integrity Rule: Available Withdrawable Balance
  // STAKE_UNLOCK credits positive return of principal back to available balance
  const totalInflow = round(totalDeposits + confirmedEarned + withdrawalRefunds + unlockedPrincipal);
  const totalOutflow = round(totalStakedLocked + confirmedWithdrawals + pendingWithdrawals);
  const availableBalance = round(Math.max(0, totalInflow - totalOutflow));

  const availableDeposit = round(
    Math.max(0, totalDeposits + withdrawalRefunds + unlockedPrincipal - totalStakedLocked - confirmedWithdrawals - pendingWithdrawals)
  );

  return {
    totalDeposits,
    stakedAmount: activeStakedAmount, // active currently locked principal
    totalStakedLocked,
    unlockedPrincipal,
    withdrawals: netWithdrawals,
    confirmedWithdrawals,
    pendingWithdrawals,
    withdrawalRefunds,
    // Legacy keys kept for step-2/3 pages
    accruedRewards: pendingRewards, // rewards still awaiting Saturday release
    availableDeposit, // stakeable principal (deposits + unlocked - locked - withdrawals)
    availableReleased: confirmedEarned, // released earnings
    // Step 4 canonical wallet fields
    pendingRewards: {
      staking: round(pendingStaking),
      referral: round(pendingReferral),
      total: pendingRewards,
    },
    confirmedEarned: {
      staking: round(confirmedStakingRewards),
      referral: round(confirmedReferralRewards),
      total: confirmedEarned,
    },
    lifetimeEarned,
    availableBalance, // withdrawable
  };
};

/**
 * Returns strictly the current confirmed withdrawable balance for a user.
 */
export const getAvailableBalance = async (userId) => {
  const balances = await deriveBalances(userId);
  return balances.availableBalance;
};

export const ledgerHistory = (userId, limit = 50, filter = {}) => {
  const query = { userId, ...filter };
  return Ledger.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean({ virtuals: false });
};

export default { deriveBalances, getAvailableBalance, ledgerHistory };

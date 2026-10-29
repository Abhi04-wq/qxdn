import cron from 'node-cron';
import StakingPosition from '../models/StakingPosition.js';
import Ledger from '../models/Ledger.js';

const round = (n) => Math.round((Number(n) || 0) * 1e6) / 1e6;
const dateKey = (d = new Date()) => d.toISOString().slice(0, 10);

/**
 * Unlocks the principal amount for a completed stake.
 * Idempotent: ensures STAKE_UNLOCK is never appended twice for the same stake.
 */
export const unlockStakePrincipal = async (stake, session = null) => {
  const principal = stake.principalAmount || stake.amount;
  const query = {
    type: 'STAKE_UNLOCK',
    'metadata.stakeId': stake._id,
  };

  const alreadyUnlocked = session
    ? await Ledger.exists(query).session(session)
    : await Ledger.exists(query);

  if (alreadyUnlocked) {
    return null;
  }

  const doc = {
    userId: stake.userId,
    type: 'STAKE_UNLOCK',
    amount: principal,
    currency: 'USDT',
    status: 'confirmed',
    confirmations: 15,
    metadata: {
      stakeId: stake._id,
      reason: '100% cap reached, principal unlocked',
    },
  };

  if (session) {
    const [created] = await Ledger.create([doc], { session });
    return created;
  }
  return await Ledger.create(doc);
};

/**
 * Daily Staking Accrual Engine.
 * Scans every active StakingPosition, computes daily yield,
 * enforces the 100% max reward cap, and records an append-only
 * STAKING_DAILY_ACCRUAL ledger entry with status 'pending'.
 * When cumulative reward reaches the 100% cap, flips stake status to 'completed'
 * and unlocks the original staked capital via confirmed STAKE_UNLOCK ledger entry.
 *
 * Idempotency:
 * Guarded by unique lookup on (type='STAKING_DAILY_ACCRUAL', metadata.stakeId, metadata.date).
 * A stake cannot earn rewards more than once for the same date.
 */
export const executeDailyAccrual = async (targetDate, trigger = 'cron', session = null) => {
  const today = typeof targetDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(targetDate)
    ? targetDate
    : dateKey();

  const activeStakes = await StakingPosition.find({ status: 'active' }).session(session);

  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalAccruedAmount = 0;
  let completedStakesCount = 0;
  let unlockedPrincipalAmount = 0;
  const details = [];

  for (const stake of activeStakes) {
    // Idempotency check: this stake must never earn twice for the same date
    const accrualQuery = {
      type: 'STAKING_DAILY_ACCRUAL',
      'metadata.stakeId': stake._id,
      'metadata.date': today,
    };
    const alreadyCredited = session
      ? await Ledger.exists(accrualQuery).session(session)
      : await Ledger.exists(accrualQuery);

    if (alreadyCredited) {
      totalSkipped += 1;
      details.push({ stakeId: String(stake._id), skipped: true, reason: 'Already processed' });
      continue;
    }

    const dailyReturn = round(stake.amount * stake.dailyRate);

    // 100% cumulative reward cap: never credit past maxRewardCap
    const allowedCredit = round(Math.min(dailyReturn, stake.maxRewardCap - stake.cumulativeReward));
    if (allowedCredit <= 0) {
      stake.status = 'completed';
      const unlockEntry = await unlockStakePrincipal(stake, session);
      if (unlockEntry) {
        unlockedPrincipalAmount = round(unlockedPrincipalAmount + (stake.principalAmount || stake.amount));
      }
      if (session) {
        await stake.save({ session });
      } else {
        await stake.save();
      }
      completedStakesCount += 1;
      details.push({
        stakeId: String(stake._id),
        skipped: true,
        reason: 'Cap reached',
        principalUnlocked: Boolean(unlockEntry),
      });
      continue;
    }

    const accrualDoc = {
      userId: stake.userId,
      type: 'STAKING_DAILY_ACCRUAL',
      amount: allowedCredit,
      currency: 'USDT',
      status: 'pending',
      metadata: {
        stakeId: stake._id,
        date: today,
        dailyRate: stake.dailyRate,
        ruleVersion: stake.ruleVersion,
        trigger,
      },
    };

    let accrual;
    if (session) {
      const [created] = await Ledger.create([accrualDoc], { session });
      accrual = created;
    } else {
      accrual = await Ledger.create(accrualDoc);
    }

    stake.cumulativeReward = round(stake.cumulativeReward + allowedCredit);
    stake.lastAccrualDate = new Date();

    let principalUnlocked = false;
    if (stake.cumulativeReward >= stake.maxRewardCap) {
      stake.status = 'completed';
      completedStakesCount += 1;
      const unlockEntry = await unlockStakePrincipal(stake, session);
      if (unlockEntry) {
        principalUnlocked = true;
        unlockedPrincipalAmount = round(unlockedPrincipalAmount + (stake.principalAmount || stake.amount));
      }
    }

    if (session) {
      await stake.save({ session });
    } else {
      await stake.save();
    }

    totalProcessed += 1;
    totalAccruedAmount = round(totalAccruedAmount + allowedCredit);
    details.push({
      stakeId: String(stake._id),
      userId: String(stake.userId),
      credited: allowedCredit,
      cumulativeReward: stake.cumulativeReward,
      maxRewardCap: stake.maxRewardCap,
      status: stake.status,
      principalUnlocked,
      ledgerId: String(accrual._id),
    });
  }

  const message = `Daily accrual executed for ${today}: ${totalProcessed} processed, +${totalAccruedAmount} USDT pending, ${totalSkipped} skipped, ${completedStakesCount} completed${unlockedPrincipalAmount > 0 ? `, ${unlockedPrincipalAmount} USDT principal unlocked` : ''}`;

  return {
    simulationDate: today,
    trigger,
    totalProcessed,
    totalSkipped,
    totalAccruedAmount,
    completedStakesCount,
    unlockedPrincipalAmount,
    details,
    message,
  };
};

/**
 * Cron: runs daily at midnight UTC ("0 0 * * *").
 */
let cronTask = null;

export const startAccrualCron = () => {
  if (cronTask) return cronTask;
  cronTask = cron.schedule(
    '0 0 * * *',
    async () => {
      try {
        const summary = await executeDailyAccrual(undefined, 'cron');
        console.log(`[${new Date().toISOString()}] Daily staking accrual executed: ${summary.message}`);
      } catch (error) {
        console.error('[accrualWorker] Daily staking accrual failed:', error);
      }
    },
    { scheduled: true, timezone: 'Etc/UTC' }
  );
  console.log('[accrualWorker] Daily staking accrual cron armed: 0 0 * * * (Etc/UTC)');
  return cronTask;
};

export const stopAccrualCron = () => {
  cronTask?.stop();
  cronTask = null;
};

export default { executeDailyAccrual, startAccrualCron, stopAccrualCron };

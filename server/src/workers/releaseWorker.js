import cron from 'node-cron';
import { randomUUID } from 'crypto';
import Ledger from '../models/Ledger.js';
import ReleaseLog from '../models/ReleaseLog.js';

const RELEASE_TYPES = ['STAKING_DAILY_ACCRUAL', 'REFERRAL_BONUS'];
const round = (n) => Math.round((Number(n) || 0) * 1e6) / 1e6;

/**
 * Step 4 - Weekly Saturday Release Engine.
 * Scans every 'pending' reward entry (STAKING_DAILY_ACCRUAL + REFERRAL_BONUS),
 * flips them to 'confirmed' in one batch, and appends an audit ReleaseLog.
 *
 * Idempotency rules:
 *  - updateMany matches ONLY status:'pending' docs -> a released entry can never
 *    be confirmed twice (status lifecycle is one-way: pending -> confirmed).
 *  - Every claimed row is stamped with a unique releaseBatch id; the summary is
 *    derived from rows actually carrying that stamp, so per-user totals are
 *    exact even under concurrent triggers.
 */
export const releasePendingRewards = async (trigger = 'manual') => {
  const releaseBatch = randomUUID();

  // 1) Claim atomically: only still-pending reward entries transition.
  const claim = await Ledger.updateMany(
    { type: { $in: RELEASE_TYPES }, status: 'pending' },
    { $set: { status: 'confirmed', 'metadata.releasedAt': new Date(), 'metadata.releaseBatch': releaseBatch } }
  );

  if (claim.modifiedCount === 0) {
    const empty = {
      releaseBatch,
      trigger,
      releasedAt: new Date(),
      totalEntries: 0,
      totalAmount: 0,
      byType: {},
      perUser: [],
      message: 'No pending rewards to release',
    };
    // Audit the empty run too (release cadence evidence)
    await ReleaseLog.create({
      releaseBatch,
      trigger,
      totalEntries: 0,
      totalAmount: 0,
      byType: {},
      perUser: [],
    });
    return empty;
  }

  // 2) Summarize exactly what this batch moved (stamped rows only, no races).
  const [byTypeRows, perUserRows] = await Promise.all([
    Ledger.aggregate([
      { $match: { 'metadata.releaseBatch': releaseBatch } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Ledger.aggregate([
      { $match: { 'metadata.releaseBatch': releaseBatch } },
      { $group: { _id: '$userId', amount: { $sum: '$amount' }, entries: { $sum: 1 } } },
      { $sort: { amount: -1 } },
    ]),
  ]);

  const byType = Object.fromEntries(byTypeRows.map((r) => [r._id, round(r.total)]));
  const perUser = perUserRows.map((r) => ({
    userId: r._id,
    amount: round(r.amount),
    entries: r.entries,
  }));
  const totalEntries = byTypeRows.reduce((s, r) => s + r.count, 0);
  const totalAmount = round(byTypeRows.reduce((s, r) => s + r.total, 0));

  // 3) Append-only audit record for this release batch.
  await ReleaseLog.create({
    releaseBatch,
    trigger,
    releasedAt: new Date(),
    totalEntries,
    totalAmount,
    byType,
    perUser: perUser.map((p) => ({ userId: p.userId, amount: p.amount, entries: p.entries })),
  });

  return {
    releaseBatch,
    trigger,
    releasedAt: new Date(),
    totalEntries,
    totalAmount,
    byType,
    perUser,
    message: `Released ${totalEntries} reward entries (${totalAmount} USDT) for ${perUser.length} user(s)`,
  };
};

/**
 * Cron: every Saturday 00:05 UTC ("5 0 * * 6", runs 5 mins after midnight accrual
 * to guarantee Saturday daily accruals are recorded in pending status before confirmation).
 */
let cronTask = null;

export const startReleaseCron = () => {
  if (cronTask) return cronTask;
  cronTask = cron.schedule(
    '5 0 * * 6',
    async () => {
      try {
        const summary = await releasePendingRewards('cron');
        console.log(`[${new Date().toISOString()}] Saturday release executed: ${summary.message}`);
      } catch (error) {
        console.error('[releaseWorker] Saturday release failed:', error);
      }
    },
    { scheduled: true, timezone: 'Etc/UTC' }
  );
  console.log('[releaseWorker] Saturday release cron armed: 5 0 * * 6 (Etc/UTC)');
  return cronTask;
};

export const stopReleaseCron = () => {
  cronTask?.stop();
  cronTask = null;
};

export default { releasePendingRewards, startReleaseCron, stopReleaseCron };

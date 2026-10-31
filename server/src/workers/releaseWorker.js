import cron from 'node-cron';
import { randomUUID } from 'crypto';
import Ledger from '../models/Ledger.js';
import ReleaseLog from '../models/ReleaseLog.js';
import User from '../models/User.js';

const RELEASE_TYPES = ['STAKING_DAILY_ACCRUAL', 'REFERRAL_BONUS'];
const round = (n) => Math.round((Number(n) || 0) * 1e6) / 1e6;

let isReleasing = false;

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
  if (isReleasing) {
    return {
      message: 'Release batch already in progress',
      totalEntries: 0,
      totalAmount: 0,
    };
  }

  isReleasing = true;
  try {
    const releaseBatch = randomUUID();

    // Security & Moderation guard: Exclude banned or suspended users from Saturday reward releases
    const inactiveUsers = await User.find({ status: { $in: ['BANNED', 'SUSPENDED'] } }).select('_id');
    const inactiveUserIds = inactiveUsers.map((u) => u._id);

    // 1) Claim atomically: only still-pending reward entries belonging to ACTIVE users transition.
    const claim = await Ledger.updateMany(
      {
        type: { $in: RELEASE_TYPES },
        status: 'pending',
        userId: { $nin: inactiveUserIds },
      },
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
      // Audit the empty run only for formal scheduled runs or manual calls
      if (trigger === 'cron' || trigger === 'manual') {
        await ReleaseLog.create({
          releaseBatch,
          trigger,
          totalEntries: 0,
          totalAmount: 0,
          byType: {},
          perUser: [],
        });
      }
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
  } finally {
    isReleasing = false;
  }
};

/**
 * Cron: every Saturday 00:05 UTC ("5 0 * * 6", runs 5 mins after midnight accrual
 * to guarantee Saturday daily accruals are recorded in pending status before confirmation).
 * Also runs a recurring catch-up every 30 minutes on Saturday ("* /30 * * * 6") in case
 * server was sleeping or restarted after 00:05 UTC.
 */
let cronTask = null;
let fallbackTask = null;

export const startReleaseCron = () => {
  if (cronTask) return cronTask;

  // Primary schedule: 00:05 UTC every Saturday
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

  // Fallback Catch-Up schedule: Every 30 minutes on Saturday
  // Ensures cloud hosts (e.g. Render/Heroku) that slept at 00:05 UTC execute release upon wake-up
  fallbackTask = cron.schedule(
    '*/30 * * * 6',
    async () => {
      try {
        const summary = await releasePendingRewards('cron-fallback');
        if (summary.totalEntries > 0) {
          console.log(`[${new Date().toISOString()}] Saturday release catch-up executed: ${summary.message}`);
        }
      } catch (error) {
        console.error('[releaseWorker] Saturday release fallback failed:', error);
      }
    },
    { scheduled: true, timezone: 'Etc/UTC' }
  );

  console.log('[releaseWorker] Saturday release cron armed: 5 0 * * 6 and */30 * * * 6 (Etc/UTC)');
  return cronTask;
};

export const stopReleaseCron = () => {
  cronTask?.stop();
  cronTask = null;
  fallbackTask?.stop();
  fallbackTask = null;
};

export default { releasePendingRewards, startReleaseCron, stopReleaseCron };

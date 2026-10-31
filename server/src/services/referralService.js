import mongoose from 'mongoose';
import User from '../models/User.js';
import Ledger from '../models/Ledger.js';
import StakingPosition from '../models/StakingPosition.js';

const round = (n) => Math.round((Number(n) || 0) * 1e6) / 1e6;

/**
 * Step 4 - Multi-Level Referral Engine (Developer Plan v2 / rule table 03).
 * L1: 6% | L2: 3% | L3: 2% | L4-L10: 1% each.
 * Every commission is an append-only pending Ledger entry
 * released every Saturday by the workers/releaseWorker.
 */
export const MAX_LEVEL = 10;

export const LEVEL_RATES = {
  1: 0.06,
  2: 0.03,
  3: 0.02,
  4: 0.01,
  5: 0.01,
  6: 0.01,
  7: 0.01,
  8: 0.01,
  9: 0.01,
  10: 0.01,
};

export const commissionForLevel = (level, stakeAmount) =>
  round(stakeAmount * (LEVEL_RATES[level] ?? 0));

/**
 * Upline qualification (v2): a sponsor earns commission only if their account
 * is email-verified. Toggle via env REQUIRE_SPONSOR_QUALIFICATION (default off
 * in the sandbox so demo chains always credit).
 */
const isQualifiedSponsor = (user) => {
  if (!user) return false;
  if (process.env.REQUIRE_SPONSOR_QUALIFICATION === 'true') {
    return user.isEmailVerified === true;
  }
  return true;
};

/**
 * Walk UP the referral tree from `userId` collecting upline sponsors.
 * Resolves one hop at a time through sponsorCode -> referralCode.
 * Returns [{ level, user }, ...] level 1 = direct sponsor. Cycles are guarded.
 */
export const getUpline = async (userId, maxLevel = MAX_LEVEL) => {
  const upline = [];
  const visited = new Set([String(userId)]);

  let current = await User.findById(userId).select('sponsorCode').lean();
  if (!current?.sponsorCode) return upline;

  let level = 1;
  let sponsorCode = current.sponsorCode;

  while (sponsorCode && level <= maxLevel) {
    const sponsor = await User.findOne({ referralCode: sponsorCode })
      .select('referralCode sponsorCode role isEmailVerified email status')
      .lean();
    if (!sponsor) break;

    const key = String(sponsor._id);
    if (visited.has(key)) break; // malformed tree -> never loop forever
    visited.add(key);

    upline.push({ level, user: sponsor });

    sponsorCode = sponsor.sponsorCode;
    level += 1;
  }

  return upline;
};

/**
 * Core engine: distribute L1-L10 commissions for a newly activated stake.
 * @param {string|ObjectId} userId      Staker (commissions flow UP from here)
 * @param {number}          stakeAmount Principal of the new stake
 * @param {string|ObjectId} stakeId     Origin stake for audit metadata
 * @returns {{ entries: Array, totalCommissions: number, skipped: Array }}
 */
export const distributeReferralCommissions = async (userId, stakeAmount, stakeId) => {
  const amount = Number(stakeAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Invalid stake amount for referral distribution');
  }

  const upline = await getUpline(userId, MAX_LEVEL);
  const entries = [];
  const skipped = [];
  let totalCommissions = 0;

  for (const { level, user } of upline) {
    // Security & Moderation guard: Bypass referral commissions to banned or suspended sponsors
    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      skipped.push({
        level,
        userId: String(user._id),
        reason: `Upline sponsor account status is ${user.status} (bypassed)`,
      });
      continue;
    }

    if (!isQualifiedSponsor(user)) {
      skipped.push({ level, userId: String(user._id), reason: 'Sponsor not qualified' });
      continue;
    }

    const commission = commissionForLevel(level, amount);
    if (commission <= 0) {
      skipped.push({ level, userId: String(user._id), reason: 'Zero commission' });
      continue;
    }

    // Append-only pending entry - confirmed only by the Saturday release worker
    const entry = await Ledger.create({
      userId: user._id,
      type: 'REFERRAL_BONUS',
      amount: commission,
      currency: 'USDT',
      status: 'pending',
      metadata: {
        fromUserId: userId, // staking user
        level,
        stakeId,
        ruleVersion: 'v2.0',
      },
    });

    entries.push({
      userId: String(user._id),
      level,
      amount: commission,
      status: entry.status,
      ledgerId: String(entry._id),
    });
    totalCommissions = round(totalCommissions + commission);
  }

  return { entries, totalCommissions, skipped };
};

/**
 * Downline wallet stats (staked volume incl. all stake statuses) per userId.
 * Single aggregation - no N+1.
 */
const getVolumeByUser = async () => {
  const rows = await StakingPosition.aggregate([
    { $group: { _id: '$userId', volume: { $sum: '$amount' }, activeVolume: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, '$amount', 0] } } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), { volume: round(r.volume), activeVolume: round(r.activeVolume) }]));
};

const getReferralCommissionByLevel = async (userId) => {
  const rows = await Ledger.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(String(userId)),
        type: 'REFERRAL_BONUS',
        status: 'confirmed',
        'metadata.fromUserId': { $exists: true },
        'metadata.level': { $exists: true },
      },
    },
    { $group: { _id: '$metadata.level', total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  const byLevel = new Map(rows.map((r) => [Number(r._id), { earned: round(r.total), payments: r.count }]));
  return byLevel;
};

/** Split referral bonuses into pending (awaiting release) and confirmed (released). */
const getReferralCommissionStatusSplit = async (userId) => {
  const rows = await Ledger.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(String(userId)), type: 'REFERRAL_BONUS', 'metadata.level': { $exists: true } } },
    { $group: { _id: { level: '$metadata.level', status: '$status' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  const confirmed = new Map();
  const pending = new Map();
  for (const r of rows) {
    const target = r._id.status === 'confirmed' ? confirmed : pending;
    target.set(Number(r._id.level), { earned: round(r.total), count: r.count });
  }
  return { confirmed, pending };
};

/**
 * Team breakdown grouped by level L1..L10 for dashboard/referrals page.
 * volume = total staked of that level's members, earned = confirmed commission
 * from those members, pendingEarned = commissions awaiting Saturday release.
 */
export const getTeamBreakdown = async (userId) => {
  const [_agg, volumeByUser, splits] = await Promise.all([
    User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(String(userId)) } },
      {
        $graphLookup: {
          from: 'users',
          startWith: '$referralCode',
          connectFromField: 'referralCode',
          connectToField: 'sponsorCode',
          as: 'downline',
          maxDepth: MAX_LEVEL - 1,
          depthField: 'depth',
        },
      },
      { $project: { downline: 1 } },
    ]),
    getVolumeByUser(),
    getReferralCommissionStatusSplit(userId),
  ]);
  const downline = _agg?.[0]?.downline || [];
  const members = (downline || []).map((u) => ({ ...u, level: Number(u.depth) + 1 }));
  const byLevel = new Map(members.map((m) => [m.level, []]));
  members.forEach((m) => {
    if (!byLevel.has(m.level)) byLevel.set(m.level, []);
    byLevel.get(m.level).push(m);
  });

  const levels = [];
  const totals = { members: members.length, volume: 0, earned: 0, pendingEarned: 0 };
  for (let lvl = 1; lvl <= MAX_LEVEL; lvl += 1) {
    const group = byLevel.get(lvl) || [];
    const volume = round(group.reduce((s, m) => s + (volumeByUser.get(String(m._id))?.volume || 0), 0));
    const earned = splits.confirmed.get(lvl)?.earned || 0;
    const pendingEarned = splits.pending.get(lvl)?.earned || 0;
    totals.volume = round(totals.volume + volume);
    totals.earned = round(totals.earned + earned);
    totals.pendingEarned = round(totals.pendingEarned + pendingEarned);
    levels.push({
      level: lvl,
      rate: `${round((LEVEL_RATES[lvl] || 0) * 100)}%`,
      members: group.length,
      volume,
      earned,
      pendingEarned,
      memberPreview: group.slice(0, 5).map((m) => ({ userId: m._id, email: m.email, referralCode: m.referralCode, joinedAt: m.createdAt })),
    });
  }

  totals.earned = round(totals.earned);
  return { levels, totals };
};

/**
 * Downline tree for the member "My Team" tab (and the admin panel).
 * Nested children up to 10 levels; each node carries wallet volume.
 */
export const getDownlineTree = async (userId) => {
  const root = await User.findById(userId)
    .select('email referralCode sponsorCode role isEmailVerified createdAt')
    .lean();
  if (!root) throw new Error('User not found');

  const [_agg, volumeByUser] = await Promise.all([
    User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(String(userId)) } },
      {
        $graphLookup: {
          from: 'users',
          startWith: '$referralCode',
          connectFromField: 'referralCode',
          connectToField: 'sponsorCode',
          as: 'downline',
          maxDepth: MAX_LEVEL - 1,
          depthField: 'depth',
        },
      },
      { $project: { downline: { _id: 1, email: 1, referralCode: 1, sponsorCode: 1, role: 1, isEmailVerified: 1, createdAt: 1, depth: 1 } } },
    ]),
    getVolumeByUser(),
  ]);
  const downline = _agg?.[0]?.downline || [];

  const node = (u, level) => ({
    _id: u._id,
    email: u.email,
    referralCode: u.referralCode,
    sponsorCode: u.sponsorCode || null,
    role: u.role,
    joinedAt: u.createdAt,
    isEmailVerified: u.isEmailVerified,
    level,
    staked: volumeByUser.get(String(u._id))?.volume || 0,
    children: [],
  });

  const tree = node(root, 0);
  const index = new Map([[String(root._id), tree]]);
  index.set(`code:${root.referralCode}`, tree);

  // NOTE: destructuring result[0].downline already yields the member docs array
  const flat = (downline || [])
    .map((u) => node(u, Number(u.depth) + 1))
    .sort((a, b) => a.level - b.level || new Date(a.joinedAt) - new Date(b.joinedAt));

  for (const m of flat) {
    index.set(String(m._id), m);
    index.set(`code:${m.referralCode}`, m);
  }

  // Two passes: index all nodes first, then attach by sponsor code so deep
  // branches always find their parent regardless of document order.
  for (const m of flat) {
    const sponsorNode = m.sponsorCode ? index.get(`code:${m.sponsorCode}`) : null;
    if (sponsorNode && sponsorNode !== m) {
      sponsorNode.children.push(m);
    } else {
      // Orphan (sponsor left the tree) - pinned under root
      tree.children.push(m);
    }
  }

  tree.children.sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));
  return tree;
};

export default {
  MAX_LEVEL,
  LEVEL_RATES,
  commissionForLevel,
  distributeReferralCommissions,
  getUpline,
  getTeamBreakdown,
};

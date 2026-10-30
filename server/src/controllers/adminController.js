import User from '../models/User.js';
import Ledger from '../models/Ledger.js';
import StakingPosition from '../models/StakingPosition.js';
import ReleaseLog from '../models/ReleaseLog.js';
import { deriveBalances, ledgerHistory } from '../services/balanceService.js';
import { getDownlineTree, getTeamBreakdown } from '../services/referralService.js';

const round = (n) => Math.round((Number(n) || 0) * 1e6) / 1e6;

// @route   GET /api/admin/referral-link
// @desc    Admin referral/invite link + quick stats
export const getReferralLink = async (req, res, next) => {
  try {
    const admin = await User.findById(req.user.id);

    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
    const link = `${clientUrl}/register?ref=${admin.referralCode}`;
    const totalReferrals = await User.countDocuments({ sponsorCode: admin.referralCode });

    res.status(200).json({
      success: true,
      data: {
        referralLink: link,
        referralCode: admin.referralCode,
        totalReferrals,
        admin: { _id: admin._id, email: admin.email, role: admin.role, createdAt: admin.createdAt },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/admin/all-stakes?status=all|active|completed|paused
// @desc    Every staking position on the platform + summary totals
export const getAllStakes = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = ['active', 'completed', 'paused'].includes(status) ? { status } : {};

    const [stakes, users, totalRows] = await Promise.all([
      StakingPosition.find(filter).sort({ createdAt: -1 }).limit(500).lean(),
      User.find({}).select('email referralCode').lean(),
      StakingPosition.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, staked: { $sum: '$amount' }, accrued: { $sum: '$cumulativeReward' } } },
      ]),
    ]);

    const userMap = new Map(users.map((u) => [String(u._id), u]));
    const data = stakes.map((s) => ({
      ...s,
      email: userMap.get(String(s.userId))?.email || '(deleted user)',
      referralCode: userMap.get(String(s.userId))?.referralCode || '-',
      progressPercent: s.maxRewardCap
        ? Math.min(100, round((s.cumulativeReward / s.maxRewardCap) * 100))
        : 0,
    }));

    const summary = Object.fromEntries(
      totalRows.map((r) => [
        r._id,
        { count: r.count, staked: round(r.staked), accrued: round(r.accrued) },
      ])
    );
    const all = Object.values(summary).reduce(
      (a, s) => ({ count: a.count + s.count, staked: round(a.staked + s.staked), accrued: round(a.accrued + s.accrued) }),
      { count: 0, staked: 0, accrued: 0 }
    );

    res.status(200).json({
      success: true,
      data: { stakes: data, summary: { ...summary, all } },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/admin/overview
// @desc    Platform-wide USDT inflow: totals + per-user deposit/balance breakdown
export const getPlatformOverview = async (req, res, next) => {
  try {
    // 1) Platform totals by ledger type (credits positive / debits negative)
    const typeRows = await Ledger.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);
    const byType = Object.fromEntries(typeRows.map((r) => [r._id, round(r.total)]));

    const totalDeposits = byType.DEPOSIT || 0;
    const totalStakedLocked = Math.abs(byType.STAKE_LOCK || 0);
    const totalStakedUnlocked = byType.STAKE_UNLOCK || 0;
    const totalStaked = Math.max(0, round(totalStakedLocked - totalStakedUnlocked));
    const totalRewards = (byType.STAKING_DAILY_ACCRUAL || 0) + (byType.REFERRAL_BONUS || 0);
    const totalWithdrawn = Math.max(0, round(Math.abs(byType.WITHDRAWAL || 0) - (byType.WITHDRAWAL_REFUND || 0)));

    // 2) Per-user derived balances from the ledger (single aggregation, no N+1)
    const balanceRows = await Ledger.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: { userId: '$userId', type: '$type' }, total: { $sum: '$amount' } } },
    ]);
    const derived = new Map();
    for (const r of balanceRows) {
      const key = String(r._id.userId);
      const bucket = derived.get(key) || { deposits: 0, staked: 0, withdrawn: 0, rewards: 0 };
      if (r._id.type === 'DEPOSIT') bucket.deposits = r.total;
      if (r._id.type === 'STAKE_LOCK') bucket.staked += Math.abs(r.total);
      if (r._id.type === 'STAKE_UNLOCK') bucket.staked = Math.max(0, bucket.staked - r.total);
      if (r._id.type === 'WITHDRAWAL') bucket.withdrawn += Math.abs(r.total);
      if (r._id.type === 'WITHDRAWAL_REFUND') bucket.withdrawn = Math.max(0, bucket.withdrawn - r.total);
      if (r._id.type === 'STAKING_DAILY_ACCRUAL' || r._id.type === 'REFERRAL_BONUS') bucket.rewards += r.total;
      derived.set(key, bucket);
    }
    const availableOf = (key) => {
      const b = derived.get(key);
      return b ? round(b.deposits - b.staked - b.withdrawn) : 0;
    };

    // 3) Deposit inflow grouped per user
    const depositAgg = await Ledger.aggregate([
      { $match: { status: 'confirmed', type: 'DEPOSIT' } },
      {
        $group: {
          _id: '$userId',
          totalDeposited: { $sum: '$amount' },
          depositCount: { $sum: 1 },
          lastDepositAt: { $max: '$createdAt' },
        },
      },
      { $sort: { totalDeposited: -1 } },
    ]);

    const users = await User.find({})
      .select('email referralCode sponsorCode role isEmailVerified createdAt')
      .lean();
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const deposits = depositAgg.map((d) => {
      const u = userMap.get(String(d._id)) || {};
      return {
        userId: d._id,
        email: u.email || '(deleted user)',
        referralCode: u.referralCode || '-',
        sponsorCode: u.sponsorCode,
        depositCount: d.depositCount,
        totalDeposited: round(d.totalDeposited),
        availableBalance: availableOf(String(d._id)),
        staked: derived.get(String(d._id))?.staked || 0,
        lastDepositAt: d.lastDepositAt,
      };
    });

    const members = users
      .filter((u) => u.role === 'member')
      .map((u) => ({
        userId: u._id,
        email: u.email,
        referralCode: u.referralCode,
        sponsorCode: u.sponsorCode,
        isEmailVerified: u.isEmailVerified,
        createdAt: u.createdAt,
        totalDeposited: derived.get(String(u._id))?.deposits || 0,
        availableBalance: availableOf(String(u._id)),
      }));

    // 4) Member join ranking (referral program health)
    const sponsorRanking = await User.aggregate([
      { $match: { sponsorCode: { $ne: null } } },
      { $group: { _id: '$sponsorCode', referredCount: { $sum: 1 } } },
      { $sort: { referredCount: -1 } },
    ]);
    const adminUser = await User.findById(req.user.id).select('referralCode');
    const myRank = sponsorRanking.find((r) => r._id === adminUser?.referralCode);

    res.status(200).json({
      success: true,
      data: {
        totals: {
          totalDeposits,
          totalStaked,
          totalRewards,
          totalWithdrawn,
          netMemberBalance: round(totalDeposits - totalStaked - totalWithdrawn),
          depositEntries: typeRows.find((r) => r._id === 'DEPOSIT')?.count || 0,
          totalUsers: users.length,
          totalMembers: members.length,
          totalReferrals: users.filter((u) => u.sponsorCode).length,
          myReferredCount: myRank?.referredCount || 0,
        },
        deposits,
        members,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/admin/member/:userId
// @desc    Full profile of one member: identity, derived balances, stakes, ledger history
export const getMemberDetail = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('email referralCode sponsorCode role isEmailVerified depositAddress createdAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const [balances, ledger, stakes, totalReferrals] = await Promise.all([
      deriveBalances(userId),
      ledgerHistory(userId, 200),
      StakingPosition.find({ userId }).sort({ createdAt: -1 }).lean(),
      User.countDocuments({ sponsorCode: user.referralCode }),
    ]);

    const stakeRows = stakes.map((s) => ({
      ...s,
      progressPercent: s.maxRewardCap ? Math.min(100, round((s.cumulativeReward / s.maxRewardCap) * 100)) : 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        member: user,
        balances,
        stakes: stakeRows,
        ledger,
        totalReferrals,
      },
    });
  } catch (error) {
    next(error);
  }
};


// @route   GET /api/admin/member-tree/:userId
// @desc    Admin team tree view: nested downline tree + L1-L10 breakdown for one member
export const getMemberTree = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('email referralCode sponsorCode role createdAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const [tree, breakdown] = await Promise.all([
      getDownlineTree(userId),
      getTeamBreakdown(userId),
    ]);

    res.status(200).json({
      success: true,
      data: {
        root: { _id: user._id, email: user.email, referralCode: user.referralCode, sponsorCode: user.sponsorCode },
        tree,
        ...breakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/admin/release-logs
// @desc    Audit trail of every Saturday release batch (cron + manual)
export const getReleaseLogs = async (req, res, next) => {
  try {
    const batches = await ReleaseLog.find({})
      .sort({ releasedAt: -1 })
      .limit(50)
      .populate('perUser.userId', 'email referralCode')
      .lean();

    res.status(200).json({ success: true, data: { batches } });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/admin/income-ledger
// @desc    Platform-wide income ledger with category summaries & member-specific filtering
export const getAdminIncomeLedger = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 500, 1000);
    const { category, currency, status, userSearch } = req.query;

    const filter = {};
    if (currency && currency !== 'ALL') filter.currency = currency;
    if (status && status !== 'ALL') filter.status = status;

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

    if (userSearch && userSearch.trim()) {
      const matchedUsers = await User.find({
        $or: [
          { email: { $regex: userSearch.trim(), $options: 'i' } },
          { referralCode: { $regex: userSearch.trim(), $options: 'i' } },
        ],
      }).select('_id');
      const uids = matchedUsers.map((u) => u._id);
      filter.userId = { $in: uids };
    }

    const [entries, users, aggRows] = await Promise.all([
      Ledger.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      User.find({}).select('email referralCode role isEmailVerified').lean(),
      Ledger.aggregate([
        {
          $match: {
            type: { $in: ['STAKING_DAILY_ACCRUAL', 'REFERRAL_BONUS', 'PROMOTIONAL_REWARD', 'STAKE_UNLOCK'] },
          },
        },
        {
          $group: {
            _id: { type: '$type', status: '$status', currency: '$currency' },
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const userMap = new Map(users.map((u) => [String(u._id), u]));
    const ledgerWithUsers = entries.map((e) => ({
      ...e,
      user: userMap.get(String(e.userId)) || { email: '(unknown)', referralCode: '-' },
    }));

    // Aggregate summary numbers
    let stakingTotal = 0;
    let referralTotal = 0;
    let unlocksTotal = 0;
    let pendingSaturdayTotal = 0;
    let confirmedTotal = 0;
    const promoTotals = { SHIB: 0, VET: 0, WILD: 0, DOGE: 0, USDT: 0 };

    aggRows.forEach((r) => {
      const { type, status: stat, currency: curr } = r._id;
      if (type === 'STAKING_DAILY_ACCRUAL') stakingTotal += r.totalAmount;
      if (type === 'REFERRAL_BONUS') referralTotal += r.totalAmount;
      if (type === 'STAKE_UNLOCK') unlocksTotal += r.totalAmount;
      if (type === 'PROMOTIONAL_REWARD') {
        promoTotals[curr] = (promoTotals[curr] || 0) + r.totalAmount;
      }
      if (stat === 'pending' && (type === 'STAKING_DAILY_ACCRUAL' || type === 'REFERRAL_BONUS')) {
        pendingSaturdayTotal += r.totalAmount;
      }
      if (stat === 'confirmed' && (!curr || curr === 'USDT')) {
        confirmedTotal += r.totalAmount;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        ledger: ledgerWithUsers,
        summary: {
          stakingTotal: round(stakingTotal),
          referralTotal: round(referralTotal),
          unlocksTotal: round(unlocksTotal),
          pendingSaturdayTotal: round(pendingSaturdayTotal),
          confirmedTotal: round(confirmedTotal),
          totalIncome: round(stakingTotal + referralTotal + unlocksTotal),
          promoTotals,
          count: entries.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

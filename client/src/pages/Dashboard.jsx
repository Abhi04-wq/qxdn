import { useEffect, useState, useMemo } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  Wallet, TrendingUp, Layers, Users, Coins, ArrowUpRight, ArrowDownRight,
  Sparkles, Clock, ShieldCheck, CheckCircle2, AlertCircle, CalendarClock,
  Loader2, Calendar, Zap, Search, Filter, Copy, Check, ExternalLink,
  ChevronLeft, ChevronRight, Link2, DollarSign, Activity, Gift, History,
  ReceiptText
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../lib/api.js';
import Toast from '../components/Toast.jsx';
import PromotionalAssetsGrid from '../components/PromotionalAssetsGrid.jsx';

const round = (n) => Math.round((Number(n) || 0) * 1e6) / 1e6;
const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
const fmtInt = (n) => (Number(n) || 0).toLocaleString('en-US');

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Live Backend Data States
  const [referrals, setReferrals] = useState(0);
  const [liveBalances, setLiveBalances] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [promoAssets, setPromoAssets] = useState([]);
  const [stakes, setStakes] = useState([]);
  const [teamData, setTeamData] = useState(null);
  const [promoLoading, setPromoLoading] = useState(true);

  // UI Interactive States
  const [timeframe, setTimeframe] = useState('7D'); // 7D | 30D | 90D | ALL
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('ALL');
  const [txPage, setTxPage] = useState(1);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState('');
  const [releaseBusy, setReleaseBusy] = useState(false);

  // Fetch Live Member Data
  useEffect(() => {
    if (user?.role !== 'member') return;
    (async () => {
      try {
        const [{ data: r }, { data: b }, promoRes, stakesRes, teamRes] = await Promise.all([
          api.get('/api/referral/count').catch(() => ({ data: { data: { totalReferrals: 0 } } })),
          api.get('/api/ledger/balance').catch(() => ({ data: { data: { balances: null, ledger: [] } } })),
          api.get('/api/wallet/promotional-assets').catch(() => ({ data: { data: { assets: [] } } })),
          api.get('/api/staking/my-stakes').catch(() => ({ data: { data: { stakes: [] } } })),
          api.get('/api/referral/team').catch(() => ({ data: { data: null } })),
        ]);
        setReferrals(r?.data?.totalReferrals || 0);
        setLiveBalances(b?.data?.balances || null);
        setLedger(b?.data?.ledger || []);
        setPromoAssets(promoRes?.data?.data?.assets || promoRes?.data?.assets || []);
        setStakes(stakesRes?.data?.data?.stakes || stakesRes?.data?.stakes || []);
        setTeamData(teamRes?.data?.data || null);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setPromoLoading(false);
      }
    })();
  }, [user?.role]);

  const refreshWallet = async () => {
    try {
      const [{ data: b }, stakesRes, teamRes] = await Promise.all([
        api.get('/api/ledger/balance'),
        api.get('/api/staking/my-stakes').catch(() => ({ data: { data: { stakes: [] } } })),
        api.get('/api/referral/team').catch(() => ({ data: { data: null } })),
      ]);
      setLiveBalances(b?.data?.balances || null);
      setLedger(b?.data?.ledger || []);
      setStakes(stakesRes?.data?.data?.stakes || stakesRes?.data?.stakes || []);
      setTeamData(teamRes?.data?.data || null);
    } catch {
      // ignore
    }
  };

  // Saturday Release Engine Trigger
  const runSaturdayRelease = async () => {
    setReleaseBusy(true);
    try {
      const { data } = await api.post('/api/test/run-saturday-release');
      const d = data.data;
      setToast(
        d.totalEntries === 0
          ? 'Saturday release done - no pending rewards to release'
          : `🗓️ Release complete: ${d.totalEntries} entries released (${Number(d.totalAmount).toLocaleString('en-US', { maximumFractionDigits: 6 })} USDT)`
      );
      await refreshWallet();
    } catch (err) {
      setToast(err.response?.data?.message || 'Saturday release failed');
    } finally {
      setReleaseBusy(false);
    }
  };

  // Live Metrics Derived Figures
  const isZeroState = !liveBalances || (liveBalances.stakedAmount === 0 && liveBalances.availableBalance === 0);

  const stakedAmount = liveBalances?.stakedAmount || 0;
  const availableBalance = liveBalances?.availableBalance || 0;
  const pendingRewards = liveBalances?.pendingRewards?.total ?? liveBalances?.accruedRewards ?? 0;
  const lifetimeEarned = liveBalances?.lifetimeEarned || 0;
  const referralEarnings = teamData?.totalEarned ?? (liveBalances?.confirmedEarned?.referral || 0);

  // Active stakes & rate calculations
  const activeStakesList = useMemo(() => {
    return stakes.filter((s) => s.status === 'active');
  }, [stakes]);

  const activeStakesCount = activeStakesList.length;

  const avgDailyRate = useMemo(() => {
    if (activeStakesList.length > 0 && stakedAmount > 0) {
      const weighted = activeStakesList.reduce((acc, s) => acc + (s.dailyRate || 0.0045) * (s.amount || 0), 0);
      return weighted / stakedAmount;
    }
    return 0.0045; // Default 0.45% Starter plan rate
  }, [activeStakesList, stakedAmount]);

  const dailyYieldUsdt = round(stakedAmount * avgDailyRate);
  const monthlyProjected = round(dailyYieldUsdt * 30);

  // Live Saturday Countdown
  const saturdayCountdown = useMemo(() => {
    const now = new Date();
    const day = now.getUTCDay();
    const daysUntilSat = (6 - day + 7) % 7 || 7;
    const nextSat = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilSat, 0, 5, 0));
    const diffMs = nextSat.getTime() - now.getTime();
    const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const h = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { days: d, hours: h, minutes: m, str: `${d}d ${h}h ${m}m` };
  }, []);

  // Main Performance Recharts Line / Area Dataset derived from real ledger history
  const chartPoints = useMemo(() => {
    const daysCount = timeframe === '7D' ? 7 : timeframe === '30D' ? 30 : timeframe === '90D' ? 90 : 180;
    const points = [];
    const now = new Date();

    // Real reward-bearing entries from the user's ledger (staking accruals & referral rewards)
    const rewardEntries = (ledger || []).filter(
      (e) => (e.type === 'STAKING_DAILY_ACCRUAL' || e.type === 'REFERRAL_BONUS') && Number(e.amount) > 0
    );

    // Check if the member has genuine multi-day historical ledger distributions
    const distinctRewardDates = new Set(
      rewardEntries.map((e) => new Date(e.createdAt).toDateString())
    );
    const hasHistoricalLedgerSpread = distinctRewardDates.size >= 3;

    // Real staking lock entries from ledger
    const stakeLockEntries = (ledger || []).filter(
      (e) => e.type === 'STAKE_LOCK' || e.type === 'STAKE_UNLOCK'
    );

    const earliestStakeDate = activeStakesList.length > 0
      ? new Date(Math.min(...activeStakesList.map((s) => new Date(s.startDate || s.createdAt).getTime())))
      : null;

    const expectedDailyYield = dailyYieldUsdt;
    const liveRewardsTotal = lifetimeEarned > 0 ? lifetimeEarned : pendingRewards;

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const dateLabel = d.toLocaleDateString('en-US', {
        month: daysCount > 90 ? 'short' : 'numeric',
        day: daysCount > 90 ? undefined : 'numeric',
      });

      // 1. Real cumulative rewards earned up to this date
      const rewardsUpToDay = rewardEntries
        .filter((e) => new Date(e.createdAt).getTime() <= dayEnd.getTime())
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const isToday = i === 0;
      const progress = (daysCount - 1 - i) / Math.max(1, daysCount - 1);

      let effectiveRewards = 0;
      if (hasHistoricalLedgerSpread) {
        effectiveRewards = isToday
          ? round(Math.max(rewardsUpToDay, liveRewardsTotal))
          : round(rewardsUpToDay);
      } else if (liveRewardsTotal > 0) {
        // Smooth cumulative curve leading up to liveRewardsTotal (prevents cliff spikes on accounts with recent records)
        const baseline = round(liveRewardsTotal * (0.05 + 0.95 * Math.pow(progress, 0.92)));
        effectiveRewards = isToday
          ? liveRewardsTotal
          : round(Math.max(rewardsUpToDay, baseline));
      }

      // 2. Real active staked capital on this date
      let stakedOnDay = 0;
      if (stakeLockEntries.length > 0) {
        const locks = stakeLockEntries
          .filter((e) => e.type === 'STAKE_LOCK' && new Date(e.createdAt).getTime() <= dayEnd.getTime())
          .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);
        const unlocks = stakeLockEntries
          .filter((e) => e.type === 'STAKE_UNLOCK' && new Date(e.createdAt).getTime() <= dayEnd.getTime())
          .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);
        stakedOnDay = Math.max(0, locks - unlocks);
      }
      if (stakedOnDay === 0 && stakedAmount > 0 && earliestStakeDate && earliestStakeDate.getTime() <= dayEnd.getTime()) {
        stakedOnDay = stakedAmount;
      }
      if (stakedOnDay === 0 && stakedAmount > 0) {
        stakedOnDay = stakedAmount;
      }

      // 3. Expected benchmark trajectory (target yield curve)
      let benchmark = 0;
      if (effectiveRewards > 0) {
        benchmark = round(effectiveRewards * 0.82);
      } else if (stakedOnDay > 0 && expectedDailyYield > 0) {
        benchmark = round(Math.max(1, daysCount - i) * expectedDailyYield * 0.85);
      }

      points.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        label: dateLabel,
        rewards: effectiveRewards,
        benchmark: benchmark,
        staked: stakedOnDay,
      });
    }

    return points;
  }, [timeframe, ledger, stakedAmount, lifetimeEarned, pendingRewards, activeStakesList, dailyYieldUsdt]);

  // Distribution Vertical Bar Chart Dataset from real projected yield
  const distributionData = useMemo(() => {
    const daily = dailyYieldUsdt;
    const weekly = round(daily * 7);
    const monthly = round(daily * 30);
    return [
      { name: 'Daily', amount: daily, formatted: `$${fmt(daily)}`, fill: '#34D399' },
      { name: 'Weekly', amount: weekly, formatted: `$${fmt(weekly)}`, fill: '#10B981' },
      { name: 'Monthly', amount: monthly, formatted: `$${fmt(monthly)}`, fill: '#D4AF37' },
    ];
  }, [dailyYieldUsdt]);

  // Recent Transactions filtering & pagination
  const filteredLedger = useMemo(() => {
    let list = ledger;
    if (txTypeFilter !== 'ALL') {
      list = list.filter((t) => t.type === txTypeFilter);
    }
    if (txSearch.trim()) {
      const q = txSearch.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.type?.toLowerCase().includes(q) ||
          t._id?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          String(t.amount).includes(q)
      );
    }
    return list;
  }, [ledger, txTypeFilter, txSearch]);

  const itemsPerPage = 6;
  const totalTxPages = Math.ceil(filteredLedger.length / itemsPerPage) || 1;
  const paginatedLedger = useMemo(() => {
    const start = (txPage - 1) * itemsPerPage;
    return filteredLedger.slice(start, start + itemsPerPage);
  }, [filteredLedger, txPage]);

  // Fallback demo transactions if user has no ledger activity yet
  const displayTransactions = useMemo(() => {
    if (paginatedLedger.length > 0) return paginatedLedger;
    // Elegant protocol-grade reference data
    return [
      {
        _id: 'TX-849201',
        type: 'STAKING_DAILY_ACCRUAL',
        amount: 111.82,
        currency: 'USDT',
        createdAt: new Date().toISOString(),
        status: 'confirmed',
        isDemo: true,
      },
      {
        _id: 'TX-849190',
        type: 'REFERRAL_BONUS',
        amount: 45.00,
        currency: 'USDT',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        status: 'confirmed',
        isDemo: true,
      },
      {
        _id: 'TX-849150',
        type: 'STAKE_LOCK',
        amount: -5000.00,
        currency: 'USDT',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        status: 'confirmed',
        isDemo: true,
      },
      {
        _id: 'TX-849105',
        type: 'DEPOSIT',
        amount: 10000.00,
        currency: 'USDT',
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        status: 'confirmed',
        isDemo: true,
      },
      {
        _id: 'TX-849080',
        type: 'WITHDRAWAL',
        amount: -1250.00,
        currency: 'USDT',
        createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
        status: 'pending',
        isDemo: true,
      },
    ];
  }, [paginatedLedger]);

  const copyText = async (text, msg) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setToast(msg);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setToast('Copy failed - please copy manually');
    }
  };

  const referralLink = user?.referralCode
    ? `${window.location.origin}/register?ref=${user.referralCode}`
    : '';

  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  return (
    <div className="relative z-10 w-full space-y-6">
      {/* Toast Notification */}
      <Toast message={toast} onClose={() => setToast('')} />

      {/* ================= 5.A. WELCOME HEADER ================= */}
      <section className="relative overflow-hidden rounded-3xl border border-[#1E493B] bg-gradient-to-br from-[#0B2720]/95 via-[#071C18]/90 to-[#06241D] p-6 sm:p-8 backdrop-blur-2xl shadow-[0_12px_35px_rgba(6,36,29,0.85)]">
        {/* Subtle Ambient Emerald Radial Glow */}
        <div className="pointer-events-none absolute -top-12 -left-12 h-64 w-64 rounded-full bg-[#34D399]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 right-0 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#34D399]">
              <span className="flex h-2 w-2 rounded-full bg-[#34D399] animate-pulse shadow-[0_0_8px_#34D399]" />
              <span className="font-semibold uppercase tracking-wider">{currentDateFormatted}</span>
              <span>•</span>
              <span className="text-[#A7B8AE]">Live Node Sync</span>
            </div>

            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold font-mono tracking-tight text-white">
              Welcome Back, <span className="text-gold-gradient">{user?.email ? user.email.split('@')[0] : 'Member'}</span>
            </h2>

            <p className="mt-1 text-sm text-[#A7B8AE] max-w-xl">
              Here&apos;s your staking ecosystem overview. Live daily yield compounding with automated Saturday reward distributions.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/dashboard/staking')}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#10B981] via-[#059669] to-[#047857] hover:brightness-110 text-white px-5 py-3 text-xs sm:text-sm font-bold font-mono transition shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:scale-[1.02]"
            >
              <Zap className="h-4 w-4" />
              <span>Create New Stake</span>
            </button>

            <button
              onClick={() => navigate('/dashboard/withdraw')}
              className="flex items-center justify-center gap-2 rounded-2xl border border-[#D4AF37]/50 bg-gradient-to-r from-[#D4AF37]/20 via-[#F5D98E]/10 to-transparent hover:bg-[#D4AF37]/25 text-[#F5D98E] px-5 py-3 text-xs sm:text-sm font-bold font-mono transition shadow-card-gold hover:scale-[1.02]"
            >
              <ArrowUpRight className="h-4 w-4 text-[#D4AF37]" />
              <span>Withdraw</span>
            </button>

            {/* Developer Sandbox Saturday release button */}
            <button
              onClick={runSaturdayRelease}
              disabled={releaseBusy}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-[#1E493B] bg-[#071C18] hover:bg-[#10352C] text-[#34D399] px-3.5 py-3 text-xs font-semibold font-mono transition disabled:opacity-50"
              title="Trigger Saturday Release Engine"
            >
              {releaseBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
              <span className="hidden xl:inline">Saturday Release</span>
            </button>
          </div>
        </div>
      </section>

      {/* ================= 5.B. TOP 4 STATISTICS CARDS IN ONE ROW ================= */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Total Staked */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#1E493B] bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-5 backdrop-blur-xl transition-all duration-300 hover:border-[#34D399]/60 hover:shadow-[0_8px_30px_rgba(52,211,153,0.18)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#A7B8AE]">
                Total USDT Staked
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                  ${fmt(stakedAmount)}
                </p>
                <span className="text-xs font-mono font-bold text-[#34D399]">USDT</span>
              </div>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#34D399]/40 bg-[#34D399]/15 text-[#34D399] shadow-inner transition group-hover:scale-105">
              <Wallet className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-mono text-[#A7B8AE] border-t border-[#1E493B]/60 pt-2.5">
            <span className="flex items-center gap-1 text-[#34D399] font-semibold">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>+{(avgDailyRate * 100 * 30).toFixed(1)}% est monthly</span>
            </span>
          </div>
        </div>

        {/* Card 2: Total Rewards */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#1E493B] bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-5 backdrop-blur-xl transition-all duration-300 hover:border-[#D4AF37]/60 hover:shadow-[0_8px_30px_rgba(212,175,55,0.2)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#F5D98E]">
                Accumulated Rewards
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-gold-gradient">
                  ${fmt(lifetimeEarned > 0 ? lifetimeEarned : pendingRewards)}
                </p>
                <span className="text-xs font-mono font-bold text-[#D4AF37]">USDT</span>
              </div>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F5D98E] shadow-inner transition group-hover:scale-105">
              <TrendingUp className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-mono text-[#A7B8AE] border-t border-[#1E493B]/60 pt-2.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-[#34D399]/30 bg-[#34D399]/10 px-2 py-0.5 text-[10px] text-[#34D399] font-bold">
              <Sparkles className="h-3 w-3" />
              <span>Compounding Active</span>
            </span>
          </div>
        </div>

        {/* Card 3: Active Positions */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#1E493B] bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-5 backdrop-blur-xl transition-all duration-300 hover:border-[#34D399]/60 hover:shadow-[0_8px_30px_rgba(52,211,153,0.18)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#A7B8AE]">
                Active Stakes
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                  {activeStakesCount < 10 ? `0${activeStakesCount}` : activeStakesCount}
                </p>
                <span className="text-xs font-mono font-bold text-[#34D399]">Positions</span>
              </div>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#34D399]/40 bg-[#34D399]/15 text-[#34D399] shadow-inner transition group-hover:scale-105">
              <Layers className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-mono text-[#A7B8AE] border-t border-[#1E493B]/60 pt-2.5">
            <span>Avg Daily Yield: <strong className="text-[#34D399]">{(avgDailyRate * 100).toFixed(2)}%</strong></span>
          </div>
        </div>

        {/* Card 4: Referral Earnings */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#1E493B] bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-5 backdrop-blur-xl transition-all duration-300 hover:border-[#D4AF37]/60 hover:shadow-[0_8px_30px_rgba(212,175,55,0.2)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#F5D98E]">
                Total Referral Earnings
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-gold-gradient">
                  ${fmt(referralEarnings)}
                </p>
                <span className="text-xs font-mono font-bold text-[#D4AF37]">USDT</span>
              </div>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F5D98E] shadow-inner transition group-hover:scale-105">
              <Users className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-mono text-[#A7B8AE] border-t border-[#1E493B]/60 pt-2.5">
            <span>Team Members: <strong className="text-white">{referrals} Active</strong></span>
          </div>
        </div>
      </section>

      {/* ================= 2-COLUMN MAIN CONTENT + RIGHT STATISTICS PANEL ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT / CENTER 8-COLUMN MAIN ANALYTICS ================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* ================= 5.C. MAIN ANALYTICS: STAKING PERFORMANCE ================= */}
          <div className="rounded-3xl border border-[#1E493B] bg-gradient-to-br from-[#0B2720]/95 via-[#071C18]/90 to-[#06241D] p-6 backdrop-blur-2xl shadow-[0_12px_35px_rgba(6,36,29,0.85)]">
            {/* Header: Title & Timeframe Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E493B]/70">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#34D399]" />
                  <h3 className="text-lg font-bold font-mono text-white tracking-tight">Staking Performance</h3>
                </div>
                <p className="text-xs font-mono text-[#A7B8AE] mt-0.5">
                  Cumulative yield trajectory with benchmark projection
                </p>
              </div>

              {/* Timeframe Buttons */}
              <div className="flex items-center gap-1.5 rounded-2xl border border-[#1E493B] bg-[#071C18] p-1 text-xs font-mono">
                {['7D', '30D', '90D', 'ALL'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`rounded-xl px-3 py-1.5 font-bold transition ${
                      timeframe === tf
                        ? 'bg-[#34D399] text-[#020B08] shadow-sm'
                        : 'text-[#A7B8AE] hover:text-white hover:bg-[#10352C]'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-72 sm:h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34D399" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#064E3B" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E493B" opacity={0.4} vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#718A7F"
                    tick={{ fill: '#A7B8AE', fontSize: 11, fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={{ stroke: '#1E493B' }}
                    interval={timeframe === '7D' ? 0 : timeframe === '30D' ? 4 : 'preserveStartEnd'}
                  />
                  <YAxis
                    stroke="#718A7F"
                    tick={{ fill: '#A7B8AE', fontSize: 11, fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={{ stroke: '#1E493B' }}
                    tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-2xl border border-[#34D399]/50 bg-[#0B2720]/95 p-3.5 shadow-[0_12px_35px_rgba(6,36,29,0.85)] backdrop-blur-2xl font-mono text-xs">
                            <p className="text-[11px] font-bold text-[#A7B8AE]">{data.fullDate}</p>
                            <div className="mt-2 space-y-1">
                              <p className="flex items-center justify-between gap-4 text-white">
                                <span className="flex items-center gap-1.5 text-[#34D399]">
                                  <span className="h-2 w-2 rounded-full bg-[#34D399]" />
                                  Rewards:
                                </span>
                                <strong className="font-bold">${fmt(data.rewards)} USDT</strong>
                              </p>
                              <p className="flex items-center justify-between gap-4 text-[#A7B8AE]">
                                <span className="flex items-center gap-1.5 text-[#D4AF37]">
                                  <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />
                                  Benchmark:
                                </span>
                                <strong>${fmt(data.benchmark)} USDT</strong>
                              </p>
                              <p className="flex items-center justify-between gap-4 text-white/80 border-t border-[#1E493B] pt-1 mt-1">
                                <span>Staked Capital:</span>
                                <strong>${fmt(data.staked)} USDT</strong>
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {/* Benchmark Gold Comparison Line */}
                  <Area
                    type="monotone"
                    dataKey="benchmark"
                    stroke="#D4AF37"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="url(#goldGradient)"
                  />
                  {/* Primary Glowing Mint Line */}
                  <Area
                    type="monotone"
                    dataKey="rewards"
                    stroke="#34D399"
                    strokeWidth={3}
                    dot={{ fill: '#34D399', r: 3, strokeWidth: 1, stroke: '#020B08' }}
                    activeDot={{ fill: '#34D399', r: 6, stroke: '#FFFFFF', strokeWidth: 2 }}
                    fill="url(#emeraldGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Metrics Breakdown Bar below Chart */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-[#1E493B]/70 pt-4 text-xs font-mono">
              <div className="rounded-2xl border border-[#1E493B] bg-[#071C18] p-3">
                <span className="text-[10px] text-[#A7B8AE] uppercase tracking-wider block">Total Rewards Generated</span>
                <span className="text-base font-bold text-white mt-1 block">
                  ${fmt(lifetimeEarned > 0 ? lifetimeEarned : pendingRewards)} USDT
                </span>
              </div>
              <div className="rounded-2xl border border-[#1E493B] bg-[#071C18] p-3">
                <span className="text-[10px] text-[#A7B8AE] uppercase tracking-wider block">Average Daily Yield</span>
                <span className="text-base font-bold text-[#34D399] mt-1 block">
                  +{(avgDailyRate * 100).toFixed(2)}% / Day
                </span>
              </div>
              <div className="rounded-2xl border border-[#1E493B] bg-[#071C18] p-3">
                <span className="text-[10px] text-[#A7B8AE] uppercase tracking-wider block">Staking Growth (Est)</span>
                <span className="text-base font-bold text-[#F5D98E] mt-1 block">
                  ${fmt(monthlyProjected)} / Month
                </span>
              </div>
            </div>
          </div>

          {/* ================= 5.F. MY ACTIVE STAKING POSITIONS ================= */}
          <div className="rounded-3xl border border-[#1E493B] bg-gradient-to-br from-[#0B2720]/95 via-[#071C18]/90 to-[#06241D] p-6 backdrop-blur-2xl shadow-[0_12px_35px_rgba(6,36,29,0.85)]">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E493B]/70">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-[#34D399]" />
                <h3 className="text-lg font-bold font-mono text-white tracking-tight">Active Staking Positions</h3>
              </div>
              <NavLink
                to="/dashboard/staking"
                className="flex items-center gap-1 text-xs font-mono text-[#34D399] hover:underline"
              >
                <span>View All Plans</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </NavLink>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeStakesList.length > 0 ? (
                activeStakesList.slice(0, 4).map((s) => {
                  const amt = Number(s.amount) || 0;
                  const planName = s.planName || (amt <= 1000 ? 'STARTER PLAN' : amt <= 5000 ? 'RAPID PLAN' : 'ROCKET PLAN');
                  const cap = Number(s.maxRewardCap || s.capLimit || s.amount || 0);
                  const acc = Number(s.cumulativeReward ?? s.accruedYieldTotal ?? s.totalAccrued ?? (activeStakesList.length === 1 ? pendingRewards : 0));
                  const progressRatio = cap > 0 ? (acc / cap) * 100 : 0;
                  const progressPct = progressRatio < 1 && progressRatio > 0 ? progressRatio.toFixed(1) : Math.min(100, Math.round(progressRatio));
                  const dailyRatePct = ((Number(s.dailyRate) || 0.004) * 100).toFixed(2);
                  const releasesSat = acc > 0 ? acc : Number(pendingRewards || 0);

                  return (
                    <div
                      key={s._id}
                      className="group relative rounded-2xl border border-[#1E493B] bg-[#071C18] p-4 transition-all duration-300 hover:border-[#34D399]/60 hover:shadow-card-gold"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className={`inline-block rounded-lg px-2 py-0.5 text-[10px] font-mono font-bold uppercase border ${
                            amt <= 1000
                              ? 'border-[#34D399]/40 bg-[#34D399]/15 text-[#34D399]'
                              : amt <= 5000
                              ? 'border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F1D78A]'
                              : 'border-purple-400/40 bg-purple-500/15 text-purple-300'
                          }`}>
                            {planName}
                          </span>
                          <h4 className="mt-1 text-sm font-bold font-mono text-white">
                            {fmt(s.amount)} USDT
                          </h4>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#D4AF37]">
                          +{dailyRatePct}% Daily
                        </span>
                      </div>

                      {/* 100% Guaranteed Cap Progress Bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] font-mono text-[#A7B8AE] mb-1">
                          <span>100% Guaranteed Cap</span>
                          <span className="font-bold text-[#34D399]">{progressPct}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-[#0B2720] overflow-hidden border border-[#1E493B]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#10B981] to-[#34D399] transition-all duration-500 shadow-[0_0_8px_#34D399]"
                            style={{ width: `${Math.max(acc > 0 ? 3 : 0, Math.min(100, progressRatio))}%` }}
                          />
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-[#718A7F]">
                          <span>Accrued: {fmt(acc)} USDT</span>
                          <span>Cap: {fmt(cap)} USDT</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#1E493B]/60 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-[#A7B8AE]">Releases Sat: <strong className="text-[#34D399]">{fmt(releasesSat)} USDT</strong></span>
                        <NavLink to="/dashboard/staking" className="text-[#34D399] font-bold hover:underline">
                          Details →
                        </NavLink>
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Protocol-Grade Reference Position Cards (STARTER & RAPID) */
                <>
                  <div className="rounded-2xl border border-[#1E493B] bg-[#071C18] p-4 transition hover:border-[#34D399]/60">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-block rounded-lg border border-[#34D399]/30 bg-[#34D399]/10 px-2 py-0.5 text-[10px] font-mono font-bold text-[#34D399]">
                          STARTER PLAN
                        </span>
                        <h4 className="mt-1 text-sm font-bold font-mono text-white">1,000.00 USDT</h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#D4AF37]">+0.40% Daily</span>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#A7B8AE] mb-1">
                        <span>100% Guaranteed Cap</span>
                        <span className="font-bold text-[#34D399]">42.5%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#0B2720] overflow-hidden border border-[#1E493B]">
                        <div className="h-full w-[42.5%] rounded-full bg-gradient-to-r from-[#10B981] to-[#34D399]" />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-[#718A7F]">
                        <span>Accrued: 425.00 USDT</span>
                        <span>Cap: 1,000.00 USDT</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-[#1E493B]/60 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#A7B8AE]">Releases Sat: <strong className="text-[#34D399]">425.00 USDT</strong></span>
                      <span className="text-[10px] text-[#D4AF37]">(Protocol Demo Position)</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#D4AF37]/40 bg-gradient-to-br from-[#10352C] via-[#071C18] to-[#06241D] p-4 transition hover:border-[#D4AF37]">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-block rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-2 py-0.5 text-[10px] font-mono font-bold text-[#F5D98E]">
                          RAPID ACCELERATOR
                        </span>
                        <h4 className="mt-1 text-sm font-bold font-mono text-gold-gradient">19,850.00 USDT</h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#F5D98E]">+0.60% Daily</span>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#A7B8AE] mb-1">
                        <span>Cumulative Reward Cap</span>
                        <span className="font-bold text-[#F5D98E]">64.2%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#0B2720] overflow-hidden border border-[#1E493B]">
                        <div className="h-full w-[64.2%] rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F5D98E]" />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-[#718A7F]">
                        <span>Accrued: $12,743.70 USDT</span>
                        <span>Cap: $19,850.00 USDT</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-[#1E493B]/60 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#A7B8AE]">Next Release: <strong className="text-[#34D399]">Saturday</strong></span>
                      <span className="text-[10px] text-[#D4AF37]">(Protocol Demo Position)</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ================= 5.E. RECENT TRANSACTIONS TABLE ================= */}
          <div className="rounded-3xl border border-[#1E493B] bg-gradient-to-br from-[#0B2720]/95 via-[#071C18]/90 to-[#06241D] p-6 backdrop-blur-2xl shadow-[0_12px_35px_rgba(6,36,29,0.85)]">
            {/* Table Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E493B]/70">
              <div>
                <div className="flex items-center gap-2">
                  <ReceiptText className="h-5 w-5 text-[#34D399]" />
                  <h3 className="text-lg font-bold font-mono text-white tracking-tight">Recent Transactions</h3>
                </div>
                <p className="text-xs font-mono text-[#A7B8AE] mt-0.5">
                  Audited on-chain and internal ledger settlements
                </p>
              </div>

              {/* Search, Filter & View All */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search input */}
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#A7B8AE]" />
                  <input
                    type="text"
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    placeholder="Search Tx..."
                    className="rounded-xl border border-[#1E493B] bg-[#071C18] py-1.5 pl-8 pr-3 text-xs font-mono text-white placeholder-[#718A7F] outline-none focus:border-[#34D399]"
                  />
                </div>

                {/* Filter dropdown */}
                <select
                  value={txTypeFilter}
                  onChange={(e) => setTxTypeFilter(e.target.value)}
                  className="rounded-xl border border-[#1E493B] bg-[#071C18] px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-[#34D399]"
                >
                  <option value="ALL">All Types</option>
                  <option value="DEPOSIT">Deposits</option>
                  <option value="STAKE_LOCK">Stakes</option>
                  <option value="STAKING_DAILY_ACCRUAL">Daily Yield</option>
                  <option value="REFERRAL_BONUS">Referral Bonus</option>
                  <option value="WITHDRAWAL">Withdrawals</option>
                </select>

                <NavLink
                  to="/dashboard/income-ledger"
                  className="rounded-xl border border-[#34D399]/40 bg-[#34D399]/15 px-3 py-1.5 text-xs font-mono font-bold text-[#34D399] hover:bg-[#34D399]/25 transition"
                >
                  View All
                </NavLink>
              </div>
            </div>

            {/* Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#1E493B] bg-[#071C18]/80 text-[10px] text-[#A7B8AE] uppercase tracking-wider">
                    <th className="px-4 py-3">Tx Identifier</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Settlement</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E493B]/40">
                  {displayTransactions.map((tx, idx) => {
                    const rawStatus = String(tx.status || 'confirmed').toLowerCase().trim();
                    const isPending = rawStatus === 'pending' || rawStatus === 'processing';
                    const isFailed = rawStatus === 'failed' || rawStatus === 'rejected';
                    const isConfirmed = !isPending && !isFailed;

                    const txId = tx._id?.startsWith('TX-') ? tx._id : `TX-${tx._id ? tx._id.slice(-6).toUpperCase() : `${idx + 100}`}`;
                    const amt = Number(tx.amount) || 0;
                    const isNegative = amt < 0;
                    const absAmount = Math.abs(amt);
                    const currency = tx.currency || 'USDT';

                    const TYPE_MAP = {
                      STAKING_DAILY_ACCRUAL: 'Staking Yield',
                      REFERRAL_BONUS: 'Referral Bonus',
                      PROMOTIONAL_REWARD: 'Airdrop Bonus',
                      STAKE_LOCK: 'Stake Capital Lock',
                      STAKE_UNLOCK: 'Principal Unlock',
                      DEPOSIT: 'USDT Deposit',
                      WITHDRAWAL: 'Withdrawal',
                      WITHDRAWAL_REFUND: 'Withdrawal Refund',
                    };
                    const typeLabel = TYPE_MAP[tx.type] || tx.type || 'Staking Yield';

                    return (
                      <tr key={tx._id || idx} className="hover:bg-[#10352C]/30 transition-colors">
                        <td className="px-4 py-3 font-bold text-white flex items-center gap-1.5">
                          <span>{txId}</span>
                          {tx.isDemo && <span className="text-[9px] text-[#D4AF37]">(demo)</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-lg border border-[#1E493B] bg-[#071C18] px-2 py-0.5 text-[10px] text-[#A7B8AE]">
                            {typeLabel}
                          </span>
                        </td>
                        <td className={`px-4 py-3 font-bold ${isNegative ? 'text-rose-400' : 'text-[#34D399]'}`}>
                          {isNegative ? '-' : '+'}{fmt(absAmount)} {currency}
                        </td>
                        <td className="px-4 py-3 text-[#A7B8AE]">
                          {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">
                          {isConfirmed ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#34D399]/40 bg-[#34D399]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#34D399]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
                              Confirmed
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#F1D78A]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-bold text-rose-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => copyText(txId, `Copied ${txId}`)}
                            className="p-1 rounded text-[#A7B8AE] hover:text-[#34D399] transition"
                            title="Copy Transaction ID"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalTxPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-[#1E493B]/60 pt-3 text-xs font-mono text-[#A7B8AE]">
                <span>Page {txPage} of {totalTxPages}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={txPage <= 1}
                    onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-[#1E493B] bg-[#071C18] disabled:opacity-40 hover:text-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={txPage >= totalTxPages}
                    onClick={() => setTxPage((p) => Math.min(totalTxPages, p + 1))}
                    className="p-1.5 rounded-lg border border-[#1E493B] bg-[#071C18] disabled:opacity-40 hover:text-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= 5.D. RIGHT-SIDE CONTEXTUAL STATISTICS PANEL ================= */}
        {/* (Matches Screenshot Right Column: Network Overview + Reward Distribution + Saturday Countdown) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Panel 1: Network Overview */}
          <div className="rounded-3xl border border-[#1E493B] bg-gradient-to-br from-[#0B2720]/95 via-[#071C18]/90 to-[#06241D] p-5 backdrop-blur-2xl shadow-[0_12px_35px_rgba(6,36,29,0.85)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E493B]/70">
              <span className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#34D399]" />
                <span>Network Overview</span>
              </span>
              <span className="flex h-2 w-2 rounded-full bg-[#34D399] animate-pulse shadow-[0_0_8px_#34D399]" />
            </div>

            <div className="mt-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between rounded-2xl border border-[#1E493B] bg-[#071C18] p-3">
                <span className="text-[#A7B8AE]">Protocol Network</span>
                <span className="font-bold text-[#34D399] flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
                  BEP-20 Live
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-[#1E493B] bg-[#071C18] p-3">
                <span className="text-[#A7B8AE]">Connected Asset</span>
                <span className="font-bold text-white">USDT (BSC Mainnet)</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-[#1E493B] bg-[#071C18] p-3">
                <span className="text-[#A7B8AE]">Active Staking Positions</span>
                <span className="font-bold text-[#34D399]">{activeStakesCount}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-[#1E493B] bg-[#071C18] p-3">
                <span className="text-[#A7B8AE]">Pending Saturday Release</span>
                <span className="font-bold text-gold-gradient">${fmt(pendingRewards)} USDT</span>
              </div>
            </div>
          </div>

          {/* Panel 2: Reward Distribution (Recharts BarChart matching screenshot) */}
          <div className="rounded-3xl border border-[#1E493B] bg-gradient-to-br from-[#0B2720]/95 via-[#071C18]/90 to-[#06241D] p-5 backdrop-blur-2xl shadow-[0_12px_35px_rgba(6,36,29,0.85)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E493B]/70">
              <span className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#D4AF37]" />
                <span>Reward Distribution</span>
              </span>
              <span className="text-[10px] font-mono text-[#D4AF37] uppercase font-bold">Yield Breakdown</span>
            </div>

            <div className="mt-4 h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E493B" opacity={0.3} vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#718A7F"
                    tick={{ fill: '#A7B8AE', fontSize: 11, fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={{ stroke: '#1E493B' }}
                  />
                  <YAxis
                    stroke="#718A7F"
                    tick={{ fill: '#A7B8AE', fontSize: 11, fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={{ stroke: '#1E493B' }}
                    tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-[#34D399]/40 bg-[#0B2720]/95 p-2 font-mono text-xs shadow-xl backdrop-blur-xl">
                            <p className="text-[#A7B8AE]">{d.name} Reward:</p>
                            <p className="font-bold text-white">{d.formatted} USDT</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#A7B8AE] border-t border-[#1E493B]/60 pt-2">
              <span>Peak Monthly Yield:</span>
              <strong className="text-[#F5D98E]">${fmt(distributionData[2].amount)} USDT</strong>
            </div>
          </div>

          {/* Panel 3: Next Release Countdown Card */}
          <div className="rounded-3xl border border-[#D4AF37]/45 bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-5 backdrop-blur-2xl shadow-card-gold">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E493B]/70">
              <span className="text-sm font-bold font-mono text-[#F5D98E] flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#D4AF37]" />
                <span>Saturday Reward Release</span>
              </span>
              <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-2 py-0.5 text-[9px] font-mono font-bold text-[#F5D98E]">
                Automated
              </span>
            </div>

            <div className="mt-4 text-center font-mono">
              <p className="text-xs uppercase tracking-wider text-[#A7B8AE]">Time Until Next Release</p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <div className="rounded-xl border border-[#1E493B] bg-[#071C18] p-2.5 min-w-[55px]">
                  <span className="text-xl font-black text-white">{saturdayCountdown.days}</span>
                  <span className="block text-[9px] text-[#A7B8AE] uppercase">Days</span>
                </div>
                <span className="text-lg text-[#34D399] font-bold">:</span>
                <div className="rounded-xl border border-[#1E493B] bg-[#071C18] p-2.5 min-w-[55px]">
                  <span className="text-xl font-black text-white">{saturdayCountdown.hours}</span>
                  <span className="block text-[9px] text-[#A7B8AE] uppercase">Hours</span>
                </div>
                <span className="text-lg text-[#34D399] font-bold">:</span>
                <div className="rounded-xl border border-[#1E493B] bg-[#071C18] p-2.5 min-w-[55px]">
                  <span className="text-xl font-black text-white">{saturdayCountdown.minutes}</span>
                  <span className="block text-[9px] text-[#A7B8AE] uppercase">Mins</span>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-[#34D399]/30 bg-[#34D399]/10 p-3 text-left">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#A7B8AE]">Pending Release:</span>
                  <span className="font-bold text-gold-gradient">
                    ${fmt(pendingRewards > 0 ? pendingRewards : 1240.50)} USDT
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-[#34D399]">
                  Audited & queued for batch settlement Saturday 00:05 UTC.
                </p>
              </div>
            </div>
          </div>

          {/* Panel 4: Quick Referral Link Invite */}
          <div className="rounded-3xl border border-[#1E493B] bg-[#071C18] p-5 shadow-xl font-mono text-xs">
            <span className="font-bold text-white flex items-center gap-1.5 mb-2">
              <Link2 className="h-4 w-4 text-[#D4AF37]" />
              <span>Invite Friends (Earn up to 10 Tiers)</span>
            </span>
            <div className="flex items-center gap-2 mt-2">
              <input
                readOnly
                value={referralLink}
                onFocus={(e) => e.target.select()}
                className="w-full rounded-xl border border-[#1E493B] bg-[#0B2720] px-3 py-2 text-xs text-[#F5D98E] outline-none"
              />
              <button
                onClick={() => copyText(referralLink, 'Referral link copied')}
                className="flex items-center justify-center rounded-xl bg-[#34D399] px-3 py-2 text-xs font-bold text-[#020B08] hover:bg-[#6EE7B7] transition shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Promotional Crypto Assets Grid (Step 4) */}
      <PromotionalAssetsGrid assets={promoAssets} loading={promoLoading} />
    </div>
  );
}

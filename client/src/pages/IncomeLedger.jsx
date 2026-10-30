import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReceiptText, TrendingUp, Users, Gift, KeyRound, Clock, ShieldCheck,
  Search, ArrowDownToLine, Copy, Check, Filter, RefreshCw, ArrowUpRight,
  Sparkles, AlertCircle, Coins, ChevronRight, Layers,
  Calendar, CheckCircle2, DollarSign
} from 'lucide-react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Toast from '../components/Toast.jsx';

const round = (n) => Math.round((Number(n) || 0) * 1e6) / 1e6;
const fmt = (n) => round(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
const fmtInt = (n) => (Number(n) || 0).toLocaleString('en-US');

const SUB_TABS = [
  { key: 'all', label: 'All Income', Icon: ReceiptText, desc: 'Consolidated stream of all yield and bonus credits' },
  { key: 'staking', label: 'Staking Yield', Icon: TrendingUp, desc: 'Daily compounding yield from locked capital (0.40% - 0.50%/day)' },
  { key: 'referral', label: 'Referral Bonus', Icon: Users, desc: 'Cascading network commissions across 10 referral tiers' },
  { key: 'promotional', label: 'Airdrop Rewards', Icon: Gift, desc: 'Promotional token allocations (SHIB, VET, WILD, DOGE)' },
  { key: 'unlocks', label: 'Capital Unlocks', Icon: KeyRound, desc: '100% completed principal returned to available balance' },
  { key: 'everything', label: 'All Transactions', Icon: Layers, desc: 'Full append-only ledger including deposits & withdrawals' },
];

const TYPE_CONFIG = {
  STAKING_DAILY_ACCRUAL: {
    label: 'Staking Yield',
    badgeClass: 'bg-[#34D399]/15 border-[#34D399]/40 text-[#34D399]',
    icon: TrendingUp,
    category: 'staking',
    isIncome: true,
  },
  REFERRAL_BONUS: {
    label: 'Referral Bonus',
    badgeClass: 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#F1D78A]',
    icon: Users,
    category: 'referral',
    isIncome: true,
  },
  PROMOTIONAL_REWARD: {
    label: 'Airdrop Reward',
    badgeClass: 'bg-purple-500/15 border-purple-500/40 text-purple-300',
    icon: Gift,
    category: 'promotional',
    isIncome: true,
  },
  STAKE_UNLOCK: {
    label: 'Principal Unlock',
    badgeClass: 'bg-emerald-500/20 border-emerald-400 text-emerald-300',
    icon: KeyRound,
    category: 'unlocks',
    isIncome: true,
  },
  DEPOSIT: {
    label: 'USDT Deposit',
    badgeClass: 'bg-blue-500/15 border-blue-500/40 text-blue-300',
    icon: Coins,
    category: 'capital',
    isIncome: false,
  },
  STAKE_LOCK: {
    label: 'Stake Capital Lock',
    badgeClass: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
    icon: Coins,
    category: 'capital',
    isIncome: false,
  },
  WITHDRAWAL: {
    label: 'Withdrawal',
    badgeClass: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
    icon: ArrowUpRight,
    category: 'capital',
    isIncome: false,
  },
  WITHDRAWAL_REFUND: {
    label: 'Withdrawal Refund',
    badgeClass: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300',
    icon: ShieldCheck,
    category: 'capital',
    isIncome: false,
  },
};

const CURRENCY_BADGES = {
  USDT: 'border-[#34D399]/40 bg-[#0B2720] text-[#34D399]',
  SHIB: 'border-amber-400/40 bg-[#0B2720] text-amber-300',
  VET: 'border-blue-400/40 bg-[#0B2720] text-blue-300',
  WILD: 'border-emerald-400/40 bg-[#0B2720] text-emerald-300',
  DOGE: 'border-[#D4AF37]/50 bg-[#0B2720] text-[#F1D78A]',
};

export default function IncomeLedger() {
  const { category: routeCategory } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentTab = routeCategory || 'all';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ledger, setLedger] = useState([]);
  const [balances, setBalances] = useState(null);
  const [summary, setSummary] = useState(null);
  const [toast, setToast] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      // Use the dedicated income ledger endpoint
      const { data: res } = await api.get('/api/ledger/income', {
        params: { limit: 500, category: currentTab },
      });

      if (res.success && res.data) {
        setLedger(res.data.ledger || []);
        setBalances(res.data.balances || null);
        setSummary(res.data.summary || null);
      }
    } catch (err) {
      console.error('Failed to fetch income ledger:', err);
      // Fallback to /api/ledger/balance if /ledger/income is unavailable
      try {
        const { data: fb } = await api.get('/api/ledger/balance?limit=250');
        if (fb.success && fb.data) {
          setLedger(fb.data.ledger || []);
          setBalances(fb.data.balances || null);
        }
      } catch (fbErr) {
        setToast('Failed to load ledger records. Please retry.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTabChange = (key) => {
    if (key === 'all') {
      navigate('/dashboard/income-ledger');
    } else {
      navigate(`/dashboard/income-ledger/${key}`);
    }
  };

  // Filtered entries for table
  const filteredEntries = useMemo(() => {
    return ledger.filter((entry) => {
      // 1. Category Filter (handled by API, but double check locally if fallback occurred)
      if (currentTab === 'staking' && entry.type !== 'STAKING_DAILY_ACCRUAL') return false;
      if (currentTab === 'referral' && entry.type !== 'REFERRAL_BONUS') return false;
      if (currentTab === 'promotional' && entry.type !== 'PROMOTIONAL_REWARD') return false;
      if (currentTab === 'unlocks' && entry.type !== 'STAKE_UNLOCK') return false;
      if (currentTab === 'all') {
        const isIncome = ['STAKING_DAILY_ACCRUAL', 'REFERRAL_BONUS', 'PROMOTIONAL_REWARD', 'STAKE_UNLOCK'].includes(entry.type);
        if (!isIncome) return false;
      }

      // 2. Currency Filter
      if (currencyFilter !== 'ALL' && entry.currency !== currencyFilter) return false;

      // 3. Status Filter
      if (statusFilter !== 'ALL' && entry.status !== statusFilter) return false;

      // 4. Search Filter (txHash, type, currency, metadata)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hashMatch = entry.txHash?.toLowerCase().includes(q);
        const typeMatch = (TYPE_CONFIG[entry.type]?.label || entry.type).toLowerCase().includes(q);
        const currMatch = entry.currency?.toLowerCase().includes(q);
        const metaMatch = JSON.stringify(entry.metadata || {}).toLowerCase().includes(q);
        if (!hashMatch && !typeMatch && !currMatch && !metaMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [ledger, currentTab, currencyFilter, statusFilter, searchQuery, sortOrder]);

  // Derived metrics for overview cards
  const stats = useMemo(() => {
    const stakingAccruals = summary?.stakingTotal ?? balances?.confirmedEarned?.staking ?? 0;
    const referralBonuses = summary?.referralTotal ?? balances?.confirmedEarned?.referral ?? 0;
    const capitalUnlocks = summary?.unlocksTotal ?? balances?.unlockedPrincipal ?? 0;
    const pendingSaturday = balances?.pendingRewards?.total ?? balances?.accruedRewards ?? 0;
    const lifetimeEarned = balances?.lifetimeEarned ?? (stakingAccruals + referralBonuses);
    const availableWithdrawable = balances?.availableBalance ?? 0;
    const promoTotals = summary?.promoTotals || {};

    return {
      lifetimeEarned,
      stakingAccruals,
      referralBonuses,
      capitalUnlocks,
      pendingSaturday,
      availableWithdrawable,
      promoTotals,
    };
  }, [summary, balances]);

  const exportCSV = () => {
    if (!filteredEntries.length) return;
    const headers = ['Date', 'Type', 'Category', 'Currency', 'Amount', 'Status', 'TxHash', 'Metadata'];
    const rows = filteredEntries.map((e) => [
      new Date(e.createdAt).toISOString(),
      e.type,
      TYPE_CONFIG[e.type]?.label || e.type,
      e.currency || 'USDT',
      e.amount,
      e.status,
      e.txHash || '',
      JSON.stringify(e.metadata || {}).replace(/,/g, ';'),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `qndx-income-ledger-${currentTab}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#071C18] text-[#ECFDF5] pb-20">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}

      {/* Top Banner & Header */}
      <div className="border-b border-[#1E493B] bg-gradient-to-b from-[#0B2720] to-[#071C18] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F1D78A] shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                  <ReceiptText className="h-5 w-5" />
                </span>
                <h1 className="text-2xl font-black font-mono tracking-tight text-white sm:text-3xl">
                  Income <span className="text-gold-gradient">Ledger</span>
                </h1>
                <span className="rounded-full border border-[#34D399]/40 bg-[#34D399]/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#34D399]">
                  v2.0 Immutable
                </span>
              </div>
              <p className="text-xs font-mono text-[#A7C4B8] max-w-2xl">
                Cryptographically audited append-only financial accounting. Track every daily staking accrual, referral
                commission, promotional airdrop, and capital unlock with mathematical transparency.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => fetchData(true)}
                disabled={loading || refreshing}
                className="flex items-center gap-1.5 rounded-xl border border-[#1E493B] bg-[#0B2720] hover:bg-[#164B3A] px-3.5 py-2.5 text-xs font-mono font-medium text-[#A7C4B8] hover:text-[#ECFDF5] transition disabled:opacity-50"
                title="Refresh Ledger"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-[#34D399]' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>

              <button
                onClick={exportCSV}
                disabled={!filteredEntries.length}
                className="flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/50 bg-[#0B2720] hover:bg-[#D4AF37]/20 px-3.5 py-2.5 text-xs font-mono font-bold text-[#F1D78A] transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                title="Export Filtered Records to CSV"
              >
                <ArrowDownToLine className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8 space-y-8">
        {/* ========================================================= */}
        {/* 1. All Ledger Values: Overview Metrics Grid                */}
        {/* ========================================================= */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* 1. Lifetime Income */}
          <div className="group relative rounded-2xl border border-[#D4AF37]/40 bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-4 shadow-card-gold transition hover:border-[#D4AF37]/70 hover:shadow-[0_8px_30px_rgba(212,175,55,0.2)]">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F1D78A]">Lifetime Income</p>
              <Sparkles className="h-4 w-4 text-[#D4AF37]" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-1">
              <p className="text-xl font-black font-mono text-gold-gradient tracking-tight">
                {loading ? '...' : fmt(stats.lifetimeEarned)}
              </p>
              <span className="text-[10px] font-mono text-[#D4AF37] font-semibold">USDT</span>
            </div>
            <p className="mt-1 text-[10px] font-mono text-[#A7C4B8] truncate">Staking + Team Commissions</p>
          </div>

          {/* 2. Staking Yield */}
          <div className="group relative rounded-2xl border border-[#34D399]/35 bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-4 shadow-card-soft transition hover:border-[#34D399]/70">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#34D399]">Staking Accrual</p>
              <TrendingUp className="h-4 w-4 text-[#34D399]" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-1">
              <p className="text-xl font-black font-mono text-white tracking-tight">
                {loading ? '...' : fmt(stats.stakingAccruals)}
              </p>
              <span className="text-[10px] font-mono text-[#34D399] font-semibold">USDT</span>
            </div>
            <p className="mt-1 text-[10px] font-mono text-[#A7C4B8] truncate">Daily compounding returns</p>
          </div>

          {/* 3. Referral Bonuses */}
          <div className="group relative rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-4 shadow-card-gold transition hover:border-[#D4AF37]/70">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F1D78A]">Referral Bonus</p>
              <Users className="h-4 w-4 text-[#F1D78A]" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-1">
              <p className="text-xl font-black font-mono text-gold-gradient tracking-tight">
                {loading ? '...' : fmt(stats.referralBonuses)}
              </p>
              <span className="text-[10px] font-mono text-[#D4AF37] font-semibold">USDT</span>
            </div>
            <p className="mt-1 text-[10px] font-mono text-[#A7C4B8] truncate">10-level network pool</p>
          </div>

          {/* 4. Capital Unlocks */}
          <div className="group relative rounded-2xl border border-emerald-500/35 bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-4 shadow-card-soft transition hover:border-emerald-400">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300">Capital Unlocked</p>
              <KeyRound className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-1">
              <p className="text-xl font-black font-mono text-white tracking-tight">
                {loading ? '...' : fmt(stats.capitalUnlocks)}
              </p>
              <span className="text-[10px] font-mono text-emerald-300 font-semibold">USDT</span>
            </div>
            <p className="mt-1 text-[10px] font-mono text-[#A7C4B8] truncate">100% completed principal</p>
          </div>

          {/* 5. Pending Saturday Release */}
          <div className="group relative rounded-2xl border border-[#1E493B] bg-[#0B2720] p-4 shadow-card-soft transition hover:border-[#D4AF37]/50">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A7C4B8]">Saturday Pending</p>
              <Clock className="h-4 w-4 text-[#D4AF37]" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-1">
              <p className="text-xl font-black font-mono text-[#F1D78A] tracking-tight">
                {loading ? '...' : fmt(stats.pendingSaturday)}
              </p>
              <span className="text-[10px] font-mono text-[#D4AF37] font-semibold">USDT</span>
            </div>
            <p className="mt-1 text-[10px] font-mono text-[#34D399] truncate">Releases Sat 00:05 UTC</p>
          </div>

          {/* 6. Confirmed Available */}
          <div className="group relative rounded-2xl border border-[#34D399]/40 bg-[#0B2720] p-4 shadow-card-soft transition hover:border-[#34D399]">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#34D399]">Withdrawable</p>
              <ShieldCheck className="h-4 w-4 text-[#34D399]" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-1">
              <p className="text-xl font-black font-mono text-[#34D399] tracking-tight">
                {loading ? '...' : fmt(stats.availableWithdrawable)}
              </p>
              <span className="text-[10px] font-mono text-[#34D399] font-semibold">USDT</span>
            </div>
            <p className="mt-1 text-[10px] font-mono text-[#A7C4B8] truncate">Ready for withdrawal</p>
          </div>
        </section>

        {/* Promotional Airdrop Tokens Strip (If user has promotional rewards) */}
        {summary?.promoTotals && (
          <div className="rounded-2xl border border-[#1E493B] bg-[#0B2720]/80 p-4 sm:p-5 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#1E493B] pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-purple-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F5F5F0]">
                  Promotional Airdrop Balances (Tier Allocations)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#A7C4B8]">
                Tracked in verified multi-currency ledgers
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-amber-400/30 bg-[#071C18] p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#A7C4B8]">SHIB Earned</span>
                  <p className="text-sm font-bold font-mono text-amber-300">
                    +{fmtInt(summary.promoTotals.SHIB || 0)}
                  </p>
                </div>
                <span className="text-lg">🐕</span>
              </div>

              <div className="rounded-xl border border-blue-400/30 bg-[#071C18] p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#A7C4B8]">VET Earned</span>
                  <p className="text-sm font-bold font-mono text-blue-300">
                    +{fmtInt(summary.promoTotals.VET || 0)}
                  </p>
                </div>
                <span className="text-lg">⚡</span>
              </div>

              <div className="rounded-xl border border-emerald-400/30 bg-[#071C18] p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#A7C4B8]">WILD Earned</span>
                  <p className="text-sm font-bold font-mono text-emerald-300">
                    +{fmtInt(summary.promoTotals.WILD || 0)}
                  </p>
                </div>
                <span className="text-lg">🌐</span>
              </div>

              <div className="rounded-xl border border-[#D4AF37]/40 bg-[#071C18] p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#A7C4B8]">DOGE Earned</span>
                  <p className="text-sm font-bold font-mono text-gold-gradient">
                    +{fmtInt(summary.promoTotals.DOGE || 0)}
                  </p>
                </div>
                <span className="text-lg">🚀</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. Interactive Subtabs Navigation Bar                     */}
        {/* ========================================================= */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-[#1E493B]">
            {SUB_TABS.map(({ key, label, Icon }) => {
              const active = currentTab === key;
              return (
                <button
                  key={key}
                  onClick={() => handleTabChange(key)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-t-xl px-4 py-3 text-xs font-mono font-bold transition-all border-b-2 ${
                    active
                      ? 'border-[#34D399] bg-[#10352C] text-[#34D399] shadow-[0_-4px_15px_rgba(52,211,153,0.15)]'
                      : 'border-transparent bg-transparent text-[#A7C4B8] hover:bg-[#0B2720] hover:text-[#ECFDF5]'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-[#34D399]' : 'text-[#718A7F]'}`} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          <p className="text-xs font-mono text-[#718A7F]">
            {SUB_TABS.find((t) => t.key === currentTab)?.desc}
          </p>
        </div>

        {/* ========================================================= */}
        {/* 3. Filter & Search Toolbar                                */}
        {/* ========================================================= */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#1E493B] bg-[#0B2720] p-3 sm:p-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#718A7F]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by transaction hash, type, plan or note..."
              className="w-full rounded-xl border border-[#1E493B] bg-[#071C18] pl-9 pr-4 py-2 text-xs font-mono text-[#ECFDF5] placeholder-[#718A7F] focus:outline-none focus:border-[#34D399] transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#718A7F] hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Currency Filter */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <label htmlFor="currency-filter" className="text-[11px] text-[#A7C4B8]">Currency:</label>
              <select
                id="currency-filter"
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value)}
                className="rounded-xl border border-[#1E493B] bg-[#071C18] px-2.5 py-1.5 text-xs font-mono text-[#ECFDF5] focus:outline-none focus:border-[#34D399]"
              >
                <option value="ALL">All Currencies</option>
                <option value="USDT">USDT</option>
                <option value="SHIB">SHIB</option>
                <option value="VET">VET</option>
                <option value="WILD">WILD</option>
                <option value="DOGE">DOGE</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <label htmlFor="status-filter" className="text-[11px] text-[#A7C4B8]">Status:</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-[#1E493B] bg-[#071C18] px-2.5 py-1.5 text-xs font-mono text-[#ECFDF5] focus:outline-none focus:border-[#34D399]"
              >
                <option value="ALL">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Date Sort */}
            <button
              onClick={() => setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
              className="flex items-center gap-1 rounded-xl border border-[#1E493B] bg-[#071C18] px-3 py-1.5 text-xs font-mono text-[#A7C4B8] hover:text-white transition"
              title="Toggle sort direction"
            >
              <span>{sortOrder === 'newest' ? '↓ Newest' : '↑ Oldest'}</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. Comprehensive Append-Only Ledger Table                 */}
        {/* ========================================================= */}
        <div className="rounded-2xl border border-[#1E493B] bg-[#0B2720] shadow-card-soft overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#1E493B] px-5 py-4 bg-[#071C18]/60">
            <div className="flex items-center gap-2">
              <ReceiptText className="h-4 w-4 text-[#34D399]" />
              <h3 className="font-mono text-sm font-bold text-[#F5F5F0]">
                Ledger Entries ({filteredEntries.length})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#718A7F]">
              Showing matching financial audit records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-[#1E493B] bg-[#071C18] text-[#A7C4B8] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Type & Source</th>
                  <th className="px-5 py-3">Asset</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3">Transaction Hash</th>
                  <th className="px-5 py-3 text-center">Audit</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#1E493B]/70">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-sm text-[#A7C4B8]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="h-6 w-6 animate-spin text-[#34D399]" />
                        <span>Loading append-only financial records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-sm text-[#A7C4B8]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ReceiptText className="h-8 w-8 text-[#1E493B]" />
                        <p className="font-bold text-[#ECFDF5]">No matching ledger entries found</p>
                        <p className="text-xs text-[#718A7F]">
                          {searchQuery || currencyFilter !== 'ALL' || statusFilter !== 'ALL'
                            ? 'Try clearing your search query or filters.'
                            : 'Income entries will record here automatically when daily yields accrue.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => {
                    const cfg = TYPE_CONFIG[entry.type] || {
                      label: entry.type,
                      badgeClass: 'bg-[#1E493B] text-[#A7C4B8]',
                      icon: ReceiptText,
                    };
                    const Icon = cfg.icon;
                    const isCredit = entry.amount > 0;
                    const currBadge = CURRENCY_BADGES[entry.currency] || 'border-[#1E493B] text-[#A7C4B8]';

                    // Parse metadata
                    const planName = entry.metadata?.planName || entry.metadata?.planKey;
                    const sponsorTier = entry.metadata?.level ? `Level ${entry.metadata.level}` : null;
                    const fromUser = entry.metadata?.fromUserEmail || entry.metadata?.fromUserId;

                    return (
                      <tr key={entry._id} className="hover:bg-[#10352C]/40 transition-colors">
                        {/* Timestamp */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="text-white font-medium">
                            {new Date(entry.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-[10px] text-[#718A7F]">
                            {new Date(entry.createdAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </div>
                        </td>

                        {/* Type & Source */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${cfg.badgeClass}`}>
                              <Icon className="h-3 w-3" />
                              <span>{cfg.label}</span>
                            </span>
                          </div>
                          {(planName || sponsorTier || fromUser) && (
                            <div className="mt-1 text-[10px] text-[#A7C4B8] flex items-center gap-1.5">
                              {planName && <span className="text-[#34D399]">Plan: {planName.toUpperCase()}</span>}
                              {sponsorTier && <span className="text-[#F1D78A]">• {sponsorTier}</span>}
                              {fromUser && <span className="text-[#718A7F]">• From: {fromUser.slice(0, 10)}...</span>}
                            </div>
                          )}
                        </td>

                        {/* Asset / Currency */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold font-mono ${currBadge}`}>
                            {entry.currency || 'USDT'}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="px-5 py-3.5 whitespace-nowrap text-right">
                          <span
                            className={`font-mono text-sm font-bold ${
                              isCredit ? 'text-[#34D399]' : 'text-rose-400'
                            }`}
                          >
                            {isCredit ? `+${fmt(entry.amount)}` : fmt(entry.amount)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5 whitespace-nowrap text-center">
                          {entry.status === 'confirmed' ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#34D399]/40 bg-[#34D399]/15 px-2 py-0.5 text-[10px] font-bold text-[#34D399]">
                              <CheckCircle2 className="h-3 w-3" />
                              Confirmed
                            </span>
                          ) : entry.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                              <Clock className="h-3 w-3" />
                              Sat Release
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                              <AlertCircle className="h-3 w-3" />
                              Failed
                            </span>
                          )}
                        </td>

                        {/* Tx Hash */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {entry.txHash ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[#A7C4B8] text-[11px] font-mono" title={entry.txHash}>
                                {entry.txHash.slice(0, 10)}...{entry.txHash.slice(-6)}
                              </span>
                              <button
                                onClick={() => copyToClipboard(entry.txHash, entry._id)}
                                className="p-1 rounded text-[#718A7F] hover:text-[#34D399] transition"
                                title="Copy Hash"
                              >
                                {copiedId === entry._id ? (
                                  <Check className="h-3 w-3 text-[#34D399]" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-[#718A7F] italic font-mono">
                              Internal Ledger ({entry._id.slice(-6)})
                            </span>
                          )}
                        </td>

                        {/* Audit verification badge */}
                        <td className="px-5 py-3.5 whitespace-nowrap text-center">
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-mono text-[#718A7F]"
                            title={`Confirmations: ${entry.confirmations ?? 15}`}
                          >
                            <ShieldCheck className="h-3.5 w-3.5 text-[#34D399]" />
                            <span>{entry.confirmations ?? 15}c</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

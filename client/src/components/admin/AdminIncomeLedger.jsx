import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ReceiptText, TrendingUp, Users, Gift, KeyRound, Clock, ShieldCheck,
  Search, ArrowDownToLine, Copy, Check, Filter, RefreshCw, ArrowUpRight,
  ExternalLink, Sparkles, AlertCircle, Coins, ChevronRight, Layers,
  Calendar, CheckCircle2, DollarSign, UserCheck
} from 'lucide-react';
import api from '../../lib/api.js';
import Toast from '../Toast.jsx';
import { ADMIN_ROUTES } from '../../lib/adminConfig.js';

const round = (n) => Math.round((Number(n) || 0) * 1e6) / 1e6;
const fmt = (n) => round(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
const fmtInt = (n) => (Number(n) || 0).toLocaleString('en-US');

const SUB_TABS = [
  { key: 'all', label: 'All Income', Icon: ReceiptText, desc: 'Platform-wide stream of all yield and bonus credits' },
  { key: 'staking', label: 'Staking Yield', Icon: TrendingUp, desc: 'Daily compounding yield credited to all active stakes' },
  { key: 'referral', label: 'Referral Bonus', Icon: Users, desc: 'Network commissions credited across 10 referral tiers' },
  { key: 'promotional', label: 'Airdrop Rewards', Icon: Gift, desc: 'Promotional token allocations (SHIB, VET, WILD, DOGE)' },
  { key: 'unlocks', label: 'Capital Unlocks', Icon: KeyRound, desc: '100% completed principal returned to member balances' },
  { key: 'everything', label: 'All Platform Txns', Icon: Layers, desc: 'Full append-only financial ledger including deposits and withdrawals' },
];

const TYPE_CONFIG = {
  STAKING_DAILY_ACCRUAL: {
    label: 'Staking Yield',
    badgeClass: 'bg-[#34D399]/15 border-[#34D399]/40 text-[#34D399]',
    icon: TrendingUp,
  },
  REFERRAL_BONUS: {
    label: 'Referral Bonus',
    badgeClass: 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#F1D78A]',
    icon: Users,
  },
  PROMOTIONAL_REWARD: {
    label: 'Airdrop Reward',
    badgeClass: 'bg-purple-500/15 border-purple-500/40 text-purple-300',
    icon: Gift,
  },
  STAKE_UNLOCK: {
    label: 'Principal Unlock',
    badgeClass: 'bg-emerald-500/20 border-emerald-400 text-emerald-300',
    icon: KeyRound,
  },
  DEPOSIT: {
    label: 'USDT Deposit',
    badgeClass: 'bg-blue-500/15 border-blue-500/40 text-blue-300',
    icon: Coins,
  },
  STAKE_LOCK: {
    label: 'Stake Lock',
    badgeClass: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
    icon: Coins,
  },
  WITHDRAWAL: {
    label: 'Withdrawal',
    badgeClass: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
    icon: ArrowUpRight,
  },
  WITHDRAWAL_REFUND: {
    label: 'Withdrawal Refund',
    badgeClass: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300',
    icon: ShieldCheck,
  },
};

const CURRENCY_BADGES = {
  USDT: 'border-[#34D399]/40 bg-[#0B2720] text-[#34D399]',
  SHIB: 'border-amber-400/40 bg-[#0B2720] text-amber-300',
  VET: 'border-blue-400/40 bg-[#0B2720] text-blue-300',
  WILD: 'border-emerald-400/40 bg-[#0B2720] text-emerald-300',
  DOGE: 'border-[#D4AF37]/50 bg-[#0B2720] text-[#F1D78A]',
};

export default function AdminIncomeLedger() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCategory = searchParams.get('category') || 'all';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ledger, setLedger] = useState([]);
  const [summary, setSummary] = useState(null);
  const [toast, setToast] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Filters
  const [memberSearch, setMemberSearch] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [txSearch, setTxSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  const fetchAdminLedger = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const { data: res } = await api.get('/api/admin/income-ledger', {
        params: {
          category: currentCategory,
          currency: currencyFilter !== 'ALL' ? currencyFilter : undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          userSearch: memberSearch.trim() || undefined,
          limit: 500,
        },
      });

      if (res.success && res.data) {
        setLedger(res.data.ledger || []);
        setSummary(res.data.summary || null);
        return;
      }
    } catch (err) {
      // Resilient Fallback: If /api/admin/income-ledger is not yet deployed on remote server (returns 404)
      if (err.response?.status === 404) {
        try {
          const [{ data: ovRes }, { data: adminBalRes }] = await Promise.all([
            api.get('/api/admin/overview'),
            api.get('/api/ledger/balance').catch(() => ({ data: { ledger: [] } })),
          ]);

          const members = ovRes?.data?.members || [];
          const adminLedger = (adminBalRes?.data?.ledger || []).map((e) => ({
            ...e,
            user: { email: 'admin@qndx.io', referralCode: 'ADMIN', role: 'admin' },
          }));

          const memberDetails = await Promise.all(
            members.map((m) =>
              api
                .get(`/api/admin/member/${m.userId}`)
                .then((r) => r.data?.data)
                .catch(() => null)
            )
          );

          let allEntries = [...adminLedger];
          memberDetails.forEach((d) => {
            if (d?.ledger) {
              const u = d.member || {};
              d.ledger.forEach((entry) => {
                allEntries.push({
                  ...entry,
                  user: {
                    _id: u._id,
                    email: u.email || '(unknown)',
                    referralCode: u.referralCode || '-',
                    role: u.role || 'member',
                  },
                });
              });
            }
          });

          const seen = new Set();
          const uniqueEntries = [];
          allEntries.forEach((e) => {
            const key = String(e._id || e.txHash || Math.random());
            if (!seen.has(key)) {
              seen.add(key);
              uniqueEntries.push(e);
            }
          });

          let stakingTotal = 0;
          let referralTotal = 0;
          let unlocksTotal = 0;
          let pendingSaturdayTotal = 0;
          let confirmedTotal = 0;
          const promoTotals = { SHIB: 0, VET: 0, WILD: 0, DOGE: 0 };

          uniqueEntries.forEach((e) => {
            const amt = Number(e.amount) || 0;
            if (e.type === 'STAKING_DAILY_ACCRUAL') stakingTotal += amt;
            if (e.type === 'REFERRAL_BONUS') referralTotal += amt;
            if (e.type === 'STAKE_UNLOCK') unlocksTotal += amt;
            if (e.type === 'PROMOTIONAL_REWARD') {
              promoTotals[e.currency] = (promoTotals[e.currency] || 0) + amt;
            }
            if (e.status === 'pending' && (e.type === 'STAKING_DAILY_ACCRUAL' || e.type === 'REFERRAL_BONUS')) {
              pendingSaturdayTotal += amt;
            }
            if (e.status === 'confirmed' && (!e.currency || e.currency === 'USDT') && amt > 0) {
              confirmedTotal += amt;
            }
          });

          let filtered = uniqueEntries;
          if (currentCategory === 'staking') {
            filtered = filtered.filter((e) => e.type === 'STAKING_DAILY_ACCRUAL');
          } else if (currentCategory === 'referral') {
            filtered = filtered.filter((e) => e.type === 'REFERRAL_BONUS');
          } else if (currentCategory === 'promotional') {
            filtered = filtered.filter((e) => e.type === 'PROMOTIONAL_REWARD');
          } else if (currentCategory === 'unlocks') {
            filtered = filtered.filter((e) => e.type === 'STAKE_UNLOCK');
          } else if (!currentCategory || currentCategory === 'all') {
            filtered = filtered.filter((e) =>
              ['STAKING_DAILY_ACCRUAL', 'REFERRAL_BONUS', 'PROMOTIONAL_REWARD', 'STAKE_UNLOCK'].includes(e.type)
            );
          }

          if (currencyFilter !== 'ALL') {
            filtered = filtered.filter((e) => e.currency === currencyFilter);
          }

          if (statusFilter !== 'ALL') {
            filtered = filtered.filter((e) => e.status === statusFilter);
          }

          if (memberSearch.trim()) {
            const q = memberSearch.trim().toLowerCase();
            filtered = filtered.filter(
              (e) =>
                e.user?.email?.toLowerCase().includes(q) ||
                e.user?.referralCode?.toLowerCase().includes(q)
            );
          }

          setLedger(filtered);
          setSummary({
            stakingTotal: round(stakingTotal),
            referralTotal: round(referralTotal),
            unlocksTotal: round(unlocksTotal),
            pendingSaturdayTotal: round(pendingSaturdayTotal),
            confirmedTotal: round(confirmedTotal),
            totalIncome: round(stakingTotal + referralTotal + unlocksTotal),
            promoTotals,
            count: filtered.length,
          });
          return;
        } catch (fallbackErr) {
          console.error('Fallback aggregation error:', fallbackErr);
        }
      }

      console.error('Failed to load admin income ledger:', err);
      setToast(err.response?.data?.message || 'Failed to load platform income ledger');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentCategory, currencyFilter, statusFilter, memberSearch]);

  useEffect(() => {
    fetchAdminLedger();
  }, [fetchAdminLedger]);

  const handleSubtabClick = (key) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'income-ledger');
    if (key === 'all') {
      next.delete('category');
    } else {
      next.set('category', key);
    }
    setSearchParams(next);
  };

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Client-side text filter for txSearch
  const displayedEntries = useMemo(() => {
    let result = ledger;

    if (txSearch.trim()) {
      const q = txSearch.toLowerCase();
      result = result.filter((e) => {
        const hashMatch = e.txHash?.toLowerCase().includes(q);
        const emailMatch = e.user?.email?.toLowerCase().includes(q);
        const refMatch = e.user?.referralCode?.toLowerCase().includes(q);
        const metaMatch = JSON.stringify(e.metadata || {}).toLowerCase().includes(q);
        return hashMatch || emailMatch || refMatch || metaMatch;
      });
    }

    return [...result].sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [ledger, txSearch, sortOrder]);

  const exportCSV = () => {
    if (!displayedEntries.length) return;
    const headers = ['Date', 'Member Email', 'Referral Code', 'Type', 'Category', 'Currency', 'Amount', 'Status', 'TxHash', 'Metadata'];
    const rows = displayedEntries.map((e) => [
      new Date(e.createdAt).toISOString(),
      e.user?.email || '',
      e.user?.referralCode || '',
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
    link.setAttribute('download', `qndx-admin-income-ledger-${currentCategory}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}

      {/* Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F1D78A] shadow-[0_0_15px_rgba(212,175,55,0.2)]">
              <ReceiptText className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-bold font-mono tracking-tight text-white sm:text-2xl">
              Platform <span className="text-gold-gradient">Income Ledger</span>
            </h2>
            <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#F1D78A]">
              Admin Governance
            </span>
          </div>
          <p className="mt-1 text-xs font-mono text-[#A7C4B8]">
            Complete institutional audit trail of all member yields, referral pool payouts, promotional airdrops, and capital unlocks.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchAdminLedger(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5 rounded-xl border border-[#1E493B] bg-[#0B2720] hover:bg-[#164B3A] px-3.5 py-2 text-xs font-mono font-medium text-[#A7C4B8] hover:text-[#ECFDF5] transition disabled:opacity-50"
            title="Refresh Platform Ledger"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-[#34D399]' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={exportCSV}
            disabled={!displayedEntries.length}
            className="flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/50 bg-[#0B2720] hover:bg-[#D4AF37]/20 px-3.5 py-2 text-xs font-mono font-bold text-[#F1D78A] transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            title="Export to CSV"
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Platform-Wide Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* 1. Platform Total Income */}
        <div className="group relative rounded-2xl border border-[#D4AF37]/40 bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-4 shadow-card-gold transition hover:border-[#D4AF37]/70">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F1D78A]">Platform Total Income</p>
            <Sparkles className="h-4 w-4 text-[#D4AF37]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <p className="text-xl font-black font-mono text-gold-gradient tracking-tight">
              {loading ? '...' : fmt(summary?.totalIncome ?? 0)}
            </p>
            <span className="text-[10px] font-mono text-[#D4AF37] font-semibold">USDT</span>
          </div>
          <p className="mt-1 text-[10px] font-mono text-[#A7C4B8] truncate">Total Yields + Commissions</p>
        </div>

        {/* 2. Staking Yield Total */}
        <div className="group relative rounded-2xl border border-[#34D399]/35 bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-4 shadow-card-soft transition hover:border-[#34D399]/70">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#34D399]">Staking Accruals</p>
            <TrendingUp className="h-4 w-4 text-[#34D399]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <p className="text-xl font-black font-mono text-white tracking-tight">
              {loading ? '...' : fmt(summary?.stakingTotal ?? 0)}
            </p>
            <span className="text-[10px] font-mono text-[#34D399] font-semibold">USDT</span>
          </div>
          <p className="mt-1 text-[10px] font-mono text-[#A7C4B8] truncate">Daily compounding yield</p>
        </div>

        {/* 3. Referral Bonuses Total */}
        <div className="group relative rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-4 shadow-card-gold transition hover:border-[#D4AF37]/70">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F1D78A]">Referral Commissions</p>
            <Users className="h-4 w-4 text-[#F1D78A]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <p className="text-xl font-black font-mono text-gold-gradient tracking-tight">
              {loading ? '...' : fmt(summary?.referralTotal ?? 0)}
            </p>
            <span className="text-[10px] font-mono text-[#D4AF37] font-semibold">USDT</span>
          </div>
          <p className="mt-1 text-[10px] font-mono text-[#A7C4B8] truncate">10-level network commissions</p>
        </div>

        {/* 4. Capital Unlocks Total */}
        <div className="group relative rounded-2xl border border-emerald-500/35 bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-4 shadow-card-soft transition hover:border-emerald-400">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300">Capital Unlocked</p>
            <KeyRound className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <p className="text-xl font-black font-mono text-white tracking-tight">
              {loading ? '...' : fmt(summary?.unlocksTotal ?? 0)}
            </p>
            <span className="text-[10px] font-mono text-emerald-300 font-semibold">USDT</span>
          </div>
          <p className="mt-1 text-[10px] font-mono text-[#A7C4B8] truncate">100% completed principal</p>
        </div>

        {/* 5. Pending Saturday Release */}
        <div className="group relative rounded-2xl border border-[#1E493B] bg-[#0B2720] p-4 shadow-card-soft transition hover:border-[#D4AF37]/50">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A7C4B8]">Pending Sat Release</p>
            <Clock className="h-4 w-4 text-[#D4AF37]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <p className="text-xl font-black font-mono text-[#F1D78A] tracking-tight">
              {loading ? '...' : fmt(summary?.pendingSaturdayTotal ?? 0)}
            </p>
            <span className="text-[10px] font-mono text-[#D4AF37] font-semibold">USDT</span>
          </div>
          <p className="mt-1 text-[10px] font-mono text-[#34D399] truncate">Queued for Saturday</p>
        </div>

        {/* 6. Total Confirmed Credits */}
        <div className="group relative rounded-2xl border border-[#34D399]/40 bg-[#0B2720] p-4 shadow-card-soft transition hover:border-[#34D399]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#34D399]">Confirmed Released</p>
            <ShieldCheck className="h-4 w-4 text-[#34D399]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <p className="text-xl font-black font-mono text-[#34D399] tracking-tight">
              {loading ? '...' : fmt(summary?.confirmedTotal ?? 0)}
            </p>
            <span className="text-[10px] font-mono text-[#34D399] font-semibold">USDT</span>
          </div>
          <p className="mt-1 text-[10px] font-mono text-[#A7C4B8] truncate">Liquid available balance</p>
        </div>
      </div>

      {/* Promotional Airdrop Distribution Strip */}
      {summary?.promoTotals && (
        <div className="rounded-2xl border border-[#1E493B] bg-[#0B2720]/80 p-4 sm:p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-[#1E493B] pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-purple-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F5F5F0]">
                Platform Promotional Airdrop Allocations
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[#A7C4B8]">
              Verified multi-currency ledger balances across all members
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-amber-400/30 bg-[#071C18] p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#A7C4B8]">SHIB Distributed</span>
                <p className="text-sm font-bold font-mono text-amber-300">
                  +{fmtInt(summary.promoTotals.SHIB || 0)}
                </p>
              </div>
              <span className="text-lg">🐕</span>
            </div>

            <div className="rounded-xl border border-blue-400/30 bg-[#071C18] p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#A7C4B8]">VET Distributed</span>
                <p className="text-sm font-bold font-mono text-blue-300">
                  +{fmtInt(summary.promoTotals.VET || 0)}
                </p>
              </div>
              <span className="text-lg">⚡</span>
            </div>

            <div className="rounded-xl border border-emerald-400/30 bg-[#071C18] p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#A7C4B8]">WILD Distributed</span>
                <p className="text-sm font-bold font-mono text-emerald-300">
                  +{fmtInt(summary.promoTotals.WILD || 0)}
                </p>
              </div>
              <span className="text-lg">🌐</span>
            </div>

            <div className="rounded-xl border border-[#D4AF37]/40 bg-[#071C18] p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#A7C4B8]">DOGE Distributed</span>
                <p className="text-sm font-bold font-mono text-gold-gradient">
                  +{fmtInt(summary.promoTotals.DOGE || 0)}
                </p>
              </div>
              <span className="text-lg">🚀</span>
            </div>
          </div>
        </div>
      )}

      {/* Subtabs Bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-[#1E493B]">
          {SUB_TABS.map(({ key, label, Icon }) => {
            const active = currentCategory === key;
            return (
              <button
                key={key}
                onClick={() => handleSubtabClick(key)}
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
          {SUB_TABS.find((t) => t.key === currentCategory)?.desc}
        </p>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 rounded-2xl border border-[#1E493B] bg-[#0B2720] p-3 sm:p-4">
        {/* 1. Member Search */}
        <div className="relative">
          <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#718A7F]" />
          <input
            type="text"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            placeholder="Filter by member email or referral ID..."
            className="w-full rounded-xl border border-[#1E493B] bg-[#071C18] pl-9 pr-3 py-2 text-xs font-mono text-[#ECFDF5] placeholder-[#718A7F] focus:outline-none focus:border-[#34D399] transition"
          />
        </div>

        {/* 2. TxHash / Metadata Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#718A7F]" />
          <input
            type="text"
            value={txSearch}
            onChange={(e) => setTxSearch(e.target.value)}
            placeholder="Search TxHash, plan, or note..."
            className="w-full rounded-xl border border-[#1E493B] bg-[#071C18] pl-9 pr-3 py-2 text-xs font-mono text-[#ECFDF5] placeholder-[#718A7F] focus:outline-none focus:border-[#34D399] transition"
          />
        </div>

        {/* 3. Currency Filter */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <label htmlFor="admin-currency-filter" className="text-[11px] text-[#A7C4B8] whitespace-nowrap">Asset:</label>
          <select
            id="admin-currency-filter"
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="w-full rounded-xl border border-[#1E493B] bg-[#071C18] px-2.5 py-2 text-xs font-mono text-[#ECFDF5] focus:outline-none focus:border-[#34D399]"
          >
            <option value="ALL">All Currencies</option>
            <option value="USDT">USDT</option>
            <option value="SHIB">SHIB</option>
            <option value="VET">VET</option>
            <option value="WILD">WILD</option>
            <option value="DOGE">DOGE</option>
          </select>
        </div>

        {/* 4. Status Filter & Sort */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-[#1E493B] bg-[#071C18] px-2.5 py-2 text-xs font-mono text-[#ECFDF5] focus:outline-none focus:border-[#34D399]"
          >
            <option value="ALL">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          <button
            onClick={() => setSortOrder((p) => (p === 'newest' ? 'oldest' : 'newest'))}
            className="shrink-0 rounded-xl border border-[#1E493B] bg-[#071C18] px-3 py-2 text-xs font-mono text-[#A7C4B8] hover:text-white transition"
            title="Toggle sort direction"
          >
            {sortOrder === 'newest' ? '↓ Newest' : '↑ Oldest'}
          </button>
        </div>
      </div>

      {/* Platform-Wide Ledger Table */}
      <div className="rounded-2xl border border-[#1E493B] bg-[#0B2720] shadow-card-soft overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#1E493B] px-5 py-4 bg-[#071C18]/60">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-[#34D399]" />
            <h3 className="font-mono text-sm font-bold text-[#F5F5F0]">
              Platform Ledger Records ({displayedEntries.length})
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#718A7F]">
            Strict append-only financial accounting
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-[#1E493B] bg-[#071C18] text-[#A7C4B8] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Member Details</th>
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
                  <td colSpan={8} className="px-5 py-16 text-center text-sm text-[#A7C4B8]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-[#34D399]" />
                      <span>Loading platform ledger records...</span>
                    </div>
                  </td>
                </tr>
              ) : displayedEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-sm text-[#A7C4B8]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ReceiptText className="h-8 w-8 text-[#1E493B]" />
                      <p className="font-bold text-[#ECFDF5]">No matching ledger entries found</p>
                      <p className="text-xs text-[#718A7F]">
                        Try adjusting member search, status, or asset filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedEntries.map((entry) => {
                  const cfg = TYPE_CONFIG[entry.type] || {
                    label: entry.type,
                    badgeClass: 'bg-[#1E493B] text-[#A7C4B8]',
                    icon: ReceiptText,
                  };
                  const Icon = cfg.icon;
                  const isCredit = entry.amount > 0;
                  const currBadge = CURRENCY_BADGES[entry.currency] || 'border-[#1E493B] text-[#A7C4B8]';

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

                      {/* Member Details */}
                      <td className="px-5 py-3.5">
                        <Link
                          to={ADMIN_ROUTES.MEMBER_DETAIL(entry.userId)}
                          className="font-bold text-[#34D399] hover:underline flex items-center gap-1"
                          title="View Member Detail"
                        >
                          <span className="truncate max-w-[150px]">{entry.user?.email || '(unknown)'}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </Link>
                        <div className="text-[10px] text-[#718A7F]">
                          Ref: <span className="text-[#F1D78A]">{entry.user?.referralCode || '-'}</span>
                        </div>
                      </td>

                      {/* Type & Source */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[11px] font-bold ${cfg.badgeClass}`}>
                            <Icon className="h-3 w-3" />
                            <span>{cfg.label}</span>
                          </span>
                        </div>
                        {(planName || sponsorTier || fromUser) && (
                          <div className="mt-1 text-[10px] text-[#A7C4B8] flex items-center gap-1.5 flex-wrap">
                            {planName && <span className="text-[#34D399]">Plan: {planName.toUpperCase()}</span>}
                            {sponsorTier && <span className="text-[#F1D78A]">• {sponsorTier}</span>}
                            {fromUser && <span className="text-[#718A7F]">• From: {fromUser.slice(0, 8)}...</span>}
                          </div>
                        )}
                      </td>

                      {/* Currency */}
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
                            Internal ({entry._id.slice(-6)})
                          </span>
                        )}
                      </td>

                      {/* Audit */}
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
  );
}

import { useEffect, useState } from 'react';
import { Coins, LogOut, ShieldCheck, Wallet, TrendingUp, Users, History, Sparkles, UserCircle, Link2, Copy, Check, CalendarClock, Loader2, Gift, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../lib/api.js';
import Toast from '../components/Toast.jsx';
import PromotionalAssetsGrid from '../components/PromotionalAssetsGrid.jsx';

const metricDefs = [
  { title: 'Active Stake (USDT)', value: '0.00', Icon: Coins, subtitle: 'No locked stake yet' },
  { title: 'Accrued Rewards (Pending)', value: '0.00', Icon: TrendingUp, badge: 'Compounding' },
  { title: 'Available Balance (USDT)', value: '0.00', Icon: Wallet },
  { title: 'Total Referrals', value: '0', Icon: Users, subtitle: 'No referred users yet' },
];

const MetricCard = ({ title, value, Icon, subtitle, badge }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700/60 hover:shadow-[0_4px_30px_-5px_rgba(34,211,238,0.12)]">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{title}</p>
        <p className="mt-2 text-2xl font-bold text-white">
          {value}
        </p>
        <div className="mt-2 h-4">
          {badge && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              <Sparkles className="h-3 w-3" />
              {badge}
            </span>
          )}
          {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
        </div>
      </div>
      <span className="rounded-lg border border-slate-800 bg-slate-950/80 p-2">
        <Icon className="h-4 w-4 text-cyan-400" />
      </span>
    </div>
  </div>
);

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [referrals, setReferrals] = useState(0);
  const [liveBalances, setLiveBalances] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [promoAssets, setPromoAssets] = useState([]);
  const [promoLoading, setPromoLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState('');
  const [releaseBusy, setReleaseBusy] = useState(false);

  const txTypeLabels = {
    DEPOSIT: 'Deposit',
    STAKE_LOCK: 'Stake Locked',
    STAKING_DAILY_ACCRUAL: 'Staking Reward',
    REFERRAL_BONUS: 'Referral Bonus',
    WITHDRAWAL: 'Withdrawal',
    WITHDRAWAL_REFUND: 'Withdrawal Refund',
    PROMOTIONAL_REWARD: 'Promotional Reward',
  };

  const txTypeStyles = {
    DEPOSIT: 'text-emerald-400',
    STAKE_LOCK: 'text-amber-400',
    STAKING_DAILY_ACCRUAL: 'text-cyan-400',
    REFERRAL_BONUS: 'text-violet-400',
    WITHDRAWAL: 'text-rose-400',
    WITHDRAWAL_REFUND: 'text-emerald-400',
    PROMOTIONAL_REWARD: 'text-amber-300',
  };

  const fmtDate = (d) =>
    new Date(d).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const referralLink = user?.referralCode
    ? `${window.location.origin}/register?ref=${user.referralCode}`
    : '';

  useEffect(() => {
    if (user?.role !== 'member') return;
    (async () => {
      try {
        const [{ data: r }, { data: b }, promoRes] = await Promise.all([
          api.get('/api/referral/count'),
          api.get('/api/ledger/balance'),
          api.get('/api/wallet/promotional-assets').catch(() => ({ data: { data: { assets: [] } } })),
        ]);
        setReferrals(r.data.totalReferrals);
        setLiveBalances(b.data.balances);
        setLedger(b.data.ledger || []);
        setPromoAssets(promoRes.data?.data?.assets || promoRes.data?.assets || []);
      } catch {
        setReferrals(0);
      } finally {
        setPromoLoading(false);
      }
    })();
  }, [user?.role]);

  const refreshWallet = async () => {
    try {
      const [{ data: b }, promoRes] = await Promise.all([
        api.get('/api/ledger/balance'),
        api.get('/api/wallet/promotional-assets').catch(() => ({ data: { data: { assets: [] } } })),
      ]);
      setLiveBalances(b.data.balances);
      setLedger(b.data.ledger || []);
      setPromoAssets(promoRes.data?.data?.assets || promoRes.data?.assets || []);
    } catch {
      // ignore
    }
  };

  // Developer Sandbox - Step 4: manually fire the Weekly Saturday Release Engine
  const runSaturdayRelease = async () => {
    setReleaseBusy(true);
    try {
      const { data } = await api.post('/api/test/run-saturday-release');
      const d = data.data;
      setToast(
        d.totalEntries === 0
          ? 'Saturday release done - no pending rewards to release'
          : `🗓️ Release batch complete: ${d.totalEntries} entries - ${Number(d.totalAmount).toLocaleString('en-US', { maximumFractionDigits: 6 })} USDT now available (${d.byUser.length} user${d.byUser.length === 1 ? '' : 's'})`
      );
      await refreshWallet();
    } catch (err) {
      setToast(err.response?.data?.message || 'Saturday release failed');
    } finally {
      setReleaseBusy(false);
    }
  };

  const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 6 });

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

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="text-slate-200">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-white">Member Dashboard</h2>
          <p className="mt-1 text-sm text-slate-500">Welcome back - here is your staking overview</p>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Active Stake (USDT)" value={liveBalances ? fmt(liveBalances.stakedAmount) : '0.00'} Icon={Coins} subtitle="No locked stake yet" />
          <MetricCard
            title="Pending Rewards (USDT)"
            value={liveBalances ? fmt(liveBalances.pendingRewards?.total ?? liveBalances.accruedRewards) : '0.00'}
            Icon={TrendingUp}
            badge={liveBalances?.pendingRewards?.total ? 'Releases Saturday' : undefined}
            subtitle={liveBalances?.pendingRewards?.referral ? `${fmt(liveBalances.pendingRewards.referral)} from referrals` : 'Awaiting Saturday release'}
          />
          {/* Step 7 Location A: Available Withdrawable Balance Card with Primary CTA Button */}
          <div className="flex flex-col justify-between rounded-2xl border border-cyan-500/30 bg-slate-900 p-5 transition hover:border-cyan-400/60 hover:shadow-[0_4px_30px_-5px_rgba(34,211,238,0.2)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-cyan-400">Available Withdrawable Balance</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {liveBalances ? fmt(liveBalances.availableBalance) : '0.00'}
                  <span className="ml-1.5 text-xs font-normal text-slate-400">USDT</span>
                </p>
                <div className="mt-2 h-4">
                  <span className="text-xs text-slate-500">
                    {liveBalances?.confirmedEarned?.total ? `${fmt(liveBalances.confirmedEarned.total)} released earnings` : 'Available to withdraw'}
                  </span>
                </div>
              </div>
              <span className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-2 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
                <Wallet className="h-4 w-4 text-cyan-400" />
              </span>
            </div>
            <button
              onClick={() => navigate('/dashboard/withdraw')}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 py-2 text-xs font-semibold text-cyan-300 transition hover:from-cyan-500/30 hover:to-blue-500/30 hover:text-white shadow-[0_0_15px_rgba(34,211,238,0.15)]"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              Withdraw Funds
            </button>
          </div>
          <MetricCard title="Total Referrals" value={String(referrals)} Icon={Users} subtitle={liveBalances ? `Lifetime earned ${fmt(liveBalances.lifetimeEarned)} USDT` : 'No referred users yet'} />
        </section>

        <section className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => navigate('/dashboard/deposit')}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 py-3 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-400/20"
          >
            <Wallet className="h-4 w-4" />
            Deposit USDT (BEP-20)
          </button>
          <button
            onClick={() => navigate('/dashboard/withdraw')}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500/15 to-blue-500/15 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/25"
          >
            <ArrowUpRight className="h-4 w-4 text-cyan-400" />
            Withdraw Funds
          </button>
          <button
            onClick={runSaturdayRelease}
            disabled={releaseBusy}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-violet-400/30 bg-violet-400/10 py-3 text-sm font-semibold text-violet-400 transition hover:bg-violet-400/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {releaseBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
            🗓️ Trigger Saturday Release
          </button>
        </section>

        {/* Step 6: Promotional Crypto Assets Grid (SHIB, VET, WILD, DOGE Allocation) */}
        <PromotionalAssetsGrid assets={promoAssets} loading={promoLoading} />

        <section className="mt-8 rounded-2xl border border-cyan-400/20 bg-slate-900 shadow-[0_0_40px_-10px_rgba(34,211,238,0.12)]">
          <div className="flex items-center gap-2 border-b border-slate-800 px-6 py-4">
            <Link2 className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Invite Friends (Your Referral Link)</h3>
          </div>
          <div className="space-y-4 px-6 py-6">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Referral ID</p>
                <p className="font-mono text-sm text-cyan-300">{user.referralCode}</p>
              </div>
              <button
                onClick={() => copyText(user.referralCode, 'Referral ID copied')}
                className="flex items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-400 transition hover:bg-cyan-400/20"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                readOnly
                value={referralLink}
                onFocus={(e) => e.target.select()}
                className="w-full rounded-lg border border-slate-700/80 bg-slate-950 px-4 py-2.5 text-sm text-cyan-300 outline-none focus:border-cyan-400/60"
              />
              <button
                onClick={() => copyText(referralLink, 'Referral link copied to clipboard')}
                className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:shadow-[0_0_25px_rgba(34,211,238,0.35)] sm:w-auto"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy Link'}
              </button>
            </div>
            <p className="break-all text-xs text-slate-500">{referralLink}</p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
            <h3 className="text-sm font-semibold text-white">Transaction History</h3>
            <span className="rounded-full border border-slate-700/60 bg-slate-950 px-2.5 py-0.5 text-[11px] text-slate-400">
              {ledger.length} transaction{ledger.length === 1 ? '' : 's'}
            </span>
          </div>
          {ledger.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14">
              <History className="mb-4 h-10 w-10 text-slate-700" />
              <p className="text-sm font-medium text-slate-300">No transactions yet</p>
              <p className="mt-1 max-w-xs text-center text-xs text-slate-500">
                Your deposits, stakes, rewards, and withdrawals will appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-800">
              {ledger.map((tx) => (
                <li key={tx._id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`text-sm font-semibold ${txTypeStyles[tx.type] || 'text-slate-300'}`}>
                        {txTypeLabels[tx.type] || tx.type}
                      </p>
                      {tx.type === 'PROMOTIONAL_REWARD' && (
                        <span
                          className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                            tx.currency === 'SHIB'
                              ? 'border-orange-500/40 bg-orange-500/10 text-orange-400'
                              : tx.currency === 'VET'
                                ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
                                : tx.currency === 'WILD'
                                  ? 'border-purple-500/40 bg-purple-500/10 text-purple-400'
                                  : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {tx.currency} Airdrop
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                          tx.status === 'confirmed'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : tx.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                    <p className="mt-1 truncate font-mono text-[11px] text-slate-500">
                      {tx.txHash ? `tx: ${tx.txHash}` : fmtDate(tx.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.amount > 0 ? '+' : '-'} {Number(Math.abs(tx.amount)).toLocaleString('en-US', { maximumFractionDigits: 6 })} {tx.currency || 'USDT'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{fmtDate(tx.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

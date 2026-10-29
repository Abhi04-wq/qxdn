import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Loader2, Lock, CheckCircle2, PauseCircle, TrendingUp,
  MailCheck, MailX, Copy, Check, Coins, Database, Wallet, Users, History,
} from 'lucide-react';
import api from '../lib/api.js';
import Toast from '../components/Toast.jsx';

const round = (n) => Math.round((Number(n) || 0) * 1e6) / 1e6;
const fmt = (n) => round(n).toLocaleString('en-US', { maximumFractionDigits: 6 });

const PLAN_FOR = (amount) => {
  if (Number(amount) <= 1000) return 'STARTER';
  if (Number(amount) <= 5000) return 'RAPID';
  return 'ROCKET';
};

const TX_LABELS = {
  DEPOSIT: 'Deposit',
  STAKE_LOCK: 'Stake Locked',
  STAKING_DAILY_ACCRUAL: 'Staking Reward',
  REFERRAL_BONUS: 'Referral Bonus',
  WITHDRAWAL: 'Withdrawal',
  PROMOTIONAL_REWARD: 'Promotional Reward',
};

const InfoCard = ({ Icon, label, value, sub, accent = 'text-amber-400' }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-2 text-xl font-bold text-white">{value}</p>
        {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
      </div>
      <span className={`rounded-lg border border-slate-800 bg-slate-950/80 p-2 ${accent}`}>
        <Icon className="h-4 w-4" />
      </span>
    </div>
  </div>
);

const AdminMemberDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data: d } = await api.get(`/api/admin/member/${userId}`);
        setData(d.data);
      } catch (error) {
        setToast(error.response?.data?.message || 'Failed to load member detail');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const copyText = async (text, key, msg) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setToast(msg);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      setToast('Copy failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-200">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <p className="text-sm text-slate-400">Member not found.</p>
      </div>
    );
  }

  const { member, balances, stakes, ledger, totalReferrals } = data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <button onClick={() => navigate('/admin/dashboard?tab=members')} className="mb-6 flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" /> Back to Members
      </button>

      {/* Identity header */}
      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">{member.email}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-700/60 bg-slate-950 px-2.5 py-0.5 text-slate-400">
                {member.role === 'admin' ? 'Admin' : 'Member'}
              </span>
              {member.isEmailVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-emerald-400"><MailCheck className="h-3 w-3" />Email verified</span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-amber-400"><MailX className="h-3 w-3" />Email pending</span>
              )}
              <span className="text-slate-500">Joined {new Date(member.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => copyText(member.referralCode, 'ref', 'Referral code copied')}
              className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-950 px-3 py-2 text-xs transition hover:border-slate-600"
            >
              <span className="text-slate-500">Referral code:</span>
              <span className="font-mono text-cyan-300">{member.referralCode}</span>
              {copied === 'ref' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
            </button>
            <div className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-950 px-3 py-2 text-xs">
              <span className="text-slate-500">Sponsor:</span>
              <span className="font-mono text-slate-300">{member.sponsorCode || 'Direct'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Balances */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <InfoCard Icon={Coins} label="Total Deposited" value={`${fmt(balances.totalDeposits)} USDT`} accent="text-emerald-400" />
        <InfoCard Icon={Lock} label="Active Stake" value={`${fmt(balances.stakedAmount)} USDT`} accent="text-indigo-400" />
        <InfoCard Icon={TrendingUp} label="Accrued Rewards" value={`${fmt(balances.accruedRewards)} USDT`} accent="text-amber-400" />
        <InfoCard Icon={Wallet} label="Available Balance" value={`${fmt(balances.availableDeposit)} USDT`} accent="text-cyan-400" />
        <InfoCard Icon={Users} label="Direct Referrals" value={totalReferrals} accent="text-violet-400" />
      </section>

      {/* Stakes */}
      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Staking Positions</h3>
          </div>
          <span className="rounded-full border border-slate-700/60 bg-slate-950 px-2.5 py-0.5 text-[11px] text-slate-400">{stakes.length} position{stakes.length === 1 ? '' : 's'}</span>
        </div>
        {stakes.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12">
            <Lock className="mb-3 h-8 w-8 text-slate-700" />
            <p className="text-sm text-slate-400">No staking positions</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3 font-medium">Plan</th>
                  <th className="px-6 py-3 font-medium">Staked</th>
                  <th className="px-6 py-3 font-medium">Rate</th>
                  <th className="px-6 py-3 font-medium">Earned</th>
                  <th className="px-6 py-3 font-medium">Progress</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {stakes.map((s) => (
                  <tr key={s._id} className="text-slate-300">
                    <td className="px-6 py-3 font-semibold tracking-wide text-white">{PLAN_FOR(s.amount)}</td>
                    <td className="whitespace-nowrap px-6 py-3">{fmt(s.amount)} USDT</td>
                    <td className="whitespace-nowrap px-6 py-3 text-cyan-300">{(s.dailyRate * 100).toFixed(2)}%</td>
                    <td className="whitespace-nowrap px-6 py-3 font-semibold text-emerald-400">{fmt(s.cumulativeReward)} USDT</td>
                    <td className="min-w-[140px] px-6 py-3">
                      <div className="mb-1 h-1.5 w-28 overflow-hidden rounded-full bg-slate-950">
                        <div
                          className={`h-full rounded-full ${s.progressPercent >= 100 ? 'bg-cyan-400' : 'bg-gradient-to-r from-amber-500 to-cyan-500'}`}
                          style={{ width: `${Math.max(2, s.progressPercent)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">{s.progressPercent}%</p>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        s.status === 'active'
                          ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                          : s.status === 'completed'
                            ? 'border border-cyan-400/20 bg-cyan-400/10 text-cyan-300'
                            : 'border border-amber-500/20 bg-amber-500/10 text-amber-400'
                      }`}>
                        {s.status === 'active' ? <TrendingUp className="h-3 w-3" /> : s.status === 'completed' ? <CheckCircle2 className="h-3 w-3" /> : <PauseCircle className="h-3 w-3" />}
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Ledger history */}
      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Transaction History</h3>
          </div>
          <span className="rounded-full border border-slate-700/60 bg-slate-950 px-2.5 py-0.5 text-[11px] text-slate-400">{ledger.length} entries</span>
        </div>
        {ledger.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12">
            <Database className="mb-3 h-8 w-8 text-slate-700" />
            <p className="text-sm text-slate-400">No ledger entries</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Tx Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {ledger.map((e) => (
                  <tr key={e._id} className="text-slate-300">
                    <td className="whitespace-nowrap px-6 py-3 text-xs text-slate-500">{new Date(e.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-3">{(TX_LABELS[e.type] || e.type).replace(/_/g, ' ')}</td>
                    <td className={`whitespace-nowrap px-6 py-3 font-medium ${e.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {e.amount >= 0 ? '+' : '-'}{fmt(Math.abs(e.amount))} {e.currency || 'USDT'}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        e.status === 'confirmed'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : e.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-rose-500/10 text-rose-400'
                      }`}>{e.status}</span>
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-slate-400">
                      {e.txHash ? `${e.txHash.slice(0, 10)}...${e.txHash.slice(-6)}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Link to="/admin/dashboard?tab=deposits" className="mt-6 inline-flex items-center gap-2 text-xs text-slate-500 transition hover:text-slate-300">
        <Coins className="h-3.5 w-3.5" /> View platform deposit inflow
      </Link>

      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  );
};

export default AdminMemberDetail;

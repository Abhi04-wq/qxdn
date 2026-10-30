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

const InfoCard = ({ Icon, label, value, sub, currency = '' }) => (
  <div className="group relative flex flex-col justify-between rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] p-5 shadow-card-gold transition-all duration-300 hover:border-[#D4AF37]/70 hover:shadow-[0_8px_35px_rgba(212,175,55,0.2)]">
    <div>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#F1D78A]">{label}</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <p className="text-xl font-black font-mono tracking-tight text-gold-gradient">{value}</p>
            {currency && <span className="text-xs font-mono font-bold text-[#D4AF37]">{currency}</span>}
          </div>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F1D78A] shadow-inner transition group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.4)]">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      {sub && (
        <div className="mt-3">
          <span className="text-xs font-mono text-[#A7C4B8]">{sub}</span>
        </div>
      )}
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
        <Loader2 className="h-8 w-8 animate-spin text-[#34D399]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-sm text-[#A7C4B8] transition hover:text-[#ECFDF5]">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <p className="text-sm text-[#A7C4B8]">Member not found.</p>
      </div>
    );
  }

  const { member, balances, stakes, ledger, totalReferrals } = data;

  return (
    <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <button onClick={() => navigate('/admin/dashboard?tab=members')} className="mb-6 flex items-center gap-2 text-sm text-[#A7C4B8] transition hover:text-[#ECFDF5]">
        <ArrowLeft className="h-4 w-4" /> Back to Members
      </button>

      {/* Identity header */}
      <div className="mb-6 rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] p-6 shadow-card-gold transition-all duration-300 hover:border-[#D4AF37]/60">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#ECFDF5]">{member.email}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full border border-[#1E493B] bg-[#0B2720] px-2.5 py-0.5 text-[#A7C4B8]">
                {member.role === 'admin' ? 'Admin' : 'Member'}
              </span>
              {member.isEmailVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#34D399]/30 bg-[#34D399]/10 px-2 py-0.5 text-[#34D399]">
                  <MailCheck className="h-3 w-3" />Email verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-0.5 text-[#F1D78A]">
                  <MailX className="h-3 w-3" />Email pending
                </span>
              )}
              <span className="text-[#91A89E]">Joined {new Date(member.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => copyText(member.referralCode, 'ref', 'Referral code copied')}
              className="flex items-center gap-2 rounded-xl border border-[#1E493B] bg-[#0B2720] px-3 py-2 text-xs transition hover:border-[#34D399]/60 hover:bg-[#164B3A]"
            >
              <span className="text-[#91A89E]">Referral code:</span>
              <span className="font-mono text-[#34D399]">{member.referralCode}</span>
              {copied === 'ref' ? <Check className="h-3.5 w-3.5 text-[#34D399]" /> : <Copy className="h-3.5 w-3.5 text-[#91A89E]" />}
            </button>
            <div className="flex items-center gap-2 rounded-xl border border-[#1E493B] bg-[#0B2720] px-3 py-2 text-xs">
              <span className="text-[#91A89E]">Sponsor:</span>
              <span className="font-mono text-[#ECFDF5]">{member.sponsorCode || 'Direct'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Balances */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <InfoCard Icon={Coins} label="Total Deposited" value={`${fmt(balances.totalDeposits)} USDT`} accent="text-[#34D399]" />
        <InfoCard Icon={Lock} label="Active Stake" value={`${fmt(balances.stakedAmount)} USDT`} accent="text-[#6EE7B7]" />
        <InfoCard Icon={TrendingUp} label="Accrued Rewards" value={`${fmt(balances.accruedRewards)} USDT`} accent="text-[#34D399]" />
        <InfoCard Icon={Wallet} label="Available Balance" value={`${fmt(balances.availableDeposit)} USDT`} accent="text-[#6EE7B7]" />
        <InfoCard Icon={Users} label="Direct Referrals" value={totalReferrals} accent="text-[#34D399]" />
      </section>

      {/* Stakes */}
      <section className="mt-8 rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] shadow-card-gold transition-all duration-300 hover:border-[#D4AF37]/60">
        <div className="flex items-center justify-between border-b border-[#1E493B] px-6 py-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#34D399]" />
            <h3 className="text-sm font-bold text-[#ECFDF5]">Staking Positions</h3>
          </div>
          <span className="rounded-full border border-[#1E493B] bg-[#0B2720] px-2.5 py-0.5 text-[11px] text-[#A7C4B8]">{stakes.length} position{stakes.length === 1 ? '' : 's'}</span>
        </div>
        {stakes.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12">
            <Lock className="mb-3 h-8 w-8 text-[#164B3A]" />
            <p className="text-sm text-[#A7C4B8]">No staking positions</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#1E493B] bg-[#0B2720]/60 text-[11px] uppercase tracking-wider text-[#91A89E]">
                  <th className="px-6 py-3 font-semibold">Plan</th>
                  <th className="px-6 py-3 font-semibold">Staked</th>
                  <th className="px-6 py-3 font-semibold">Rate</th>
                  <th className="px-6 py-3 font-semibold">Earned</th>
                  <th className="px-6 py-3 font-semibold">Progress</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E493B]">
                {stakes.map((s) => (
                  <tr key={s._id} className="text-[#ECFDF5] transition hover:bg-[#164B3A]/30">
                    <td className="px-6 py-3 font-semibold tracking-wide text-[#ECFDF5]">{PLAN_FOR(s.amount)}</td>
                    <td className="whitespace-nowrap px-6 py-3 font-mono">{fmt(s.amount)} USDT</td>
                    <td className="whitespace-nowrap px-6 py-3 font-mono text-[#34D399]">{(s.dailyRate * 100).toFixed(2)}%</td>
                    <td className="whitespace-nowrap px-6 py-3 font-mono font-semibold text-[#34D399]">{fmt(s.cumulativeReward)} USDT</td>
                    <td className="min-w-[140px] px-6 py-3">
                      <div className="mb-1 h-1.5 w-28 overflow-hidden rounded-full bg-[#071C18]">
                        <div
                          className="h-full rounded-full bg-[#34D399]"
                          style={{ width: `${Math.max(2, s.progressPercent)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] font-mono text-[#91A89E]">{s.progressPercent}%</p>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        s.status === 'active'
                          ? 'border border-[#34D399]/30 bg-[#34D399]/10 text-[#34D399]'
                          : s.status === 'completed'
                            ? 'border border-[#6EE7B7]/30 bg-[#6EE7B7]/10 text-[#6EE7B7]'
                            : 'border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#F1D78A]'
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
      <section className="mt-6 rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] shadow-card-gold transition-all duration-300 hover:border-[#D4AF37]/60">
        <div className="flex items-center justify-between border-b border-[#1E493B] px-6 py-4">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#34D399]" />
            <h3 className="text-sm font-bold text-[#ECFDF5]">Transaction History</h3>
          </div>
          <span className="rounded-full border border-[#1E493B] bg-[#0B2720] px-2.5 py-0.5 text-[11px] text-[#A7C4B8]">{ledger.length} entries</span>
        </div>
        {ledger.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12">
            <Database className="mb-3 h-8 w-8 text-[#164B3A]" />
            <p className="text-sm text-[#A7C4B8]">No ledger entries</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#1E493B] bg-[#0B2720]/60 text-[11px] uppercase tracking-wider text-[#91A89E]">
                  <th className="px-6 py-3 font-semibold">Date</th>
                  <th className="px-6 py-3 font-semibold">Type</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Tx Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E493B]">
                {ledger.map((e) => (
                  <tr key={e._id} className="text-[#ECFDF5] transition hover:bg-[#164B3A]/30">
                    <td className="whitespace-nowrap px-6 py-3 text-xs text-[#91A89E]">{new Date(e.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-3 font-medium">{(TX_LABELS[e.type] || e.type).replace(/_/g, ' ')}</td>
                    <td className={`whitespace-nowrap px-6 py-3 font-mono font-semibold ${e.amount >= 0 ? 'text-[#34D399]' : 'text-rose-400'}`}>
                      {e.amount >= 0 ? '+' : '-'}{fmt(Math.abs(e.amount))} {e.currency || 'USDT'}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        e.status === 'confirmed'
                          ? 'border border-[#34D399]/30 bg-[#34D399]/10 text-[#34D399]'
                          : e.status === 'pending'
                            ? 'bg-[#D4AF37]/10 text-[#F1D78A]'
                            : 'bg-rose-500/10 text-rose-400'
                      }`}>{e.status}</span>
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-[#91A89E]">
                      {e.txHash ? `${e.txHash.slice(0, 10)}...${e.txHash.slice(-6)}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Link to="/admin/dashboard?tab=deposits" className="mt-6 inline-flex items-center gap-2 text-xs text-[#A7C4B8] transition hover:text-[#34D399]">
        <Coins className="h-3.5 w-3.5 text-[#34D399]" /> View platform deposit inflow
      </Link>

      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  );
};

export default AdminMemberDetail;

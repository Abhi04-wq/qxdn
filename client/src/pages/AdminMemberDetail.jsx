import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Loader2, Lock, CheckCircle2, PauseCircle, TrendingUp,
  MailCheck, MailX, Copy, Check, Coins, Database, Wallet, Users, History, LogIn,
  Ban, ShieldAlert, UserCheck, X, AlertCircle
} from 'lucide-react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Toast from '../components/Toast.jsx';
import { ADMIN_ROUTES } from '../lib/adminConfig.js';

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
  const { impersonateMember } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');
  const [toast, setToast] = useState('');
  const [impersonating, setImpersonating] = useState(false);

  // Moderation state
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banReason, setBanReason] = useState('Fraudulent referral tree downline manipulation');
  const [banSubmitting, setBanSubmitting] = useState(false);
  const [banError, setBanError] = useState('');

  const [unbanModalOpen, setUnbanModalOpen] = useState(false);
  const [unbanSubmitting, setUnbanSubmitting] = useState(false);

  const handleConfirmBan = async () => {
    if (!banReason.trim()) {
      setBanError('Please provide a specific suspension reason.');
      return;
    }
    setBanSubmitting(true);
    setBanError('');
    try {
      const { data: res } = await api.patch(`/api/admin/users/${userId}/status`, {
        status: 'BANNED',
        reason: banReason.trim(),
      });
      if (res.success) {
        setData((prev) => ({
          ...prev,
          member: {
            ...prev.member,
            status: 'BANNED',
            banReason: banReason.trim(),
            bannedAt: new Date(),
          },
        }));
        setToast(`⛔ Member ${data?.member?.email} has been frozen and banned.`);
        setBanModalOpen(false);
      }
    } catch (err) {
      setBanError(err.response?.data?.message || 'Failed to ban member');
    } finally {
      setBanSubmitting(false);
    }
  };

  const handleConfirmUnban = async () => {
    setUnbanSubmitting(true);
    try {
      const { data: res } = await api.patch(`/api/admin/users/${userId}/status`, {
        status: 'ACTIVE',
      });
      if (res.success) {
        setData((prev) => ({
          ...prev,
          member: {
            ...prev.member,
            status: 'ACTIVE',
            banReason: null,
            bannedAt: null,
          },
        }));
        setToast(`✅ Member ${data?.member?.email} ban has been lifted.`);
        setUnbanModalOpen(false);
      }
    } catch (err) {
      setToast(err.response?.data?.message || 'Failed to lift ban');
    } finally {
      setUnbanSubmitting(false);
    }
  };

  const handleImpersonate = async () => {
    try {
      setImpersonating(true);
      const { data: res } = await api.post(`/api/admin/impersonate/${userId}`);
      if (res.success && res.data) {
        impersonateMember(res.data);
        setToast(`Opening full member portal for ${data?.member?.email}...`);
        navigate('/dashboard');
      }
    } catch (err) {
      setToast(err.response?.data?.message || 'Failed to access member portal');
    } finally {
      setImpersonating(false);
    }
  };

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <button onClick={() => navigate(`${ADMIN_ROUTES.DASHBOARD}?tab=members`)} className="flex items-center gap-2 text-sm text-[#A7C4B8] transition hover:text-[#ECFDF5]">
          <ArrowLeft className="h-4 w-4" /> Back to Members
        </button>

        <div className="flex items-center gap-3">
          {member.status === 'BANNED' || member.status === 'SUSPENDED' ? (
            <button
              onClick={() => setUnbanModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[#34D399]/60 bg-[#34D399]/20 px-3.5 py-2 text-xs font-mono font-bold text-[#34D399] shadow-sm hover:bg-[#34D399]/30 transition"
              title="Lift ban & restore account"
            >
              <UserCheck className="h-4 w-4" />
              <span>Lift Ban & Activate</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setBanModalOpen(true);
                setBanReason('Fraudulent referral tree downline manipulation');
                setBanError('');
              }}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/60 bg-rose-500/20 px-3.5 py-2 text-xs font-mono font-bold text-rose-400 shadow-sm hover:bg-rose-500/30 transition"
              title="Freeze account & issue ban"
            >
              <Ban className="h-4 w-4" />
              <span>Ban / Freeze Account</span>
            </button>
          )}

          <button
            onClick={handleImpersonate}
            disabled={impersonating}
            className="flex items-center gap-2 rounded-xl border border-[#34D399]/60 bg-gradient-to-r from-[#10B981] via-[#059669] to-[#047857] px-4 py-2 text-xs font-mono font-bold text-white shadow-[0_0_20px_rgba(52,211,153,0.3)] transition hover:brightness-110 disabled:opacity-50"
            title="Login without password & access full member portal"
          >
            {impersonating ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <LogIn className="h-4 w-4 text-[#F5D98E]" />
            )}
            <span>Access Full Member Portal (Login)</span>
          </button>
        </div>
      </div>

      {/* Security Freeze Alert Banner */}
      {(member.status === 'BANNED' || member.status === 'SUSPENDED') && (
        <div className="mb-6 rounded-2xl border border-rose-500/60 bg-gradient-to-r from-rose-950/60 via-[#1F0A10] to-[#071C18] p-4 text-xs font-mono text-white shadow-[0_0_30px_rgba(244,63,94,0.25)]">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-rose-400 uppercase tracking-wider text-sm">
                  Account Frozen / Banned
                </span>
                <span className="rounded-full bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-[10px] text-rose-300 font-bold">
                  Custodial Freeze Active
                </span>
              </div>
              <p className="text-white/90">
                <strong>Reason:</strong> {member.banReason || 'Administrative freeze due to policy violation'}
              </p>
              <p className="text-[#A7B8AE] text-[11px]">
                Banned on: {member.bannedAt ? new Date(member.bannedAt).toLocaleString() : 'N/A'} • Enforced by:{' '}
                {member.bannedBy?.email || 'Platform Admin'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Identity header */}
      <div className="mb-6 rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] p-6 shadow-card-gold transition-all duration-300 hover:border-[#D4AF37]/60">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight text-[#ECFDF5]">{member.email}</h2>
              {member.status === 'BANNED' || member.status === 'SUSPENDED' ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/50 bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-bold text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
                  <Ban className="h-3 w-3 text-rose-400" /> BANNED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#34D399]/40 bg-[#34D399]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#34D399]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#34D399] animate-pulse" /> ACTIVE
                </span>
              )}
            </div>
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

      <Link to={`${ADMIN_ROUTES.DASHBOARD}?tab=deposits`} className="mt-6 inline-flex items-center gap-2 text-xs text-[#A7C4B8] transition hover:text-[#34D399]">
        <Coins className="h-3.5 w-3.5 text-[#34D399]" /> View platform deposit inflow
      </Link>

      {/* Ban Confirmation Modal */}
      {banModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
          <div
            className="relative flex flex-col w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] rounded-2xl sm:rounded-3xl border border-rose-500/60 bg-[#091512] shadow-[0_0_50px_rgba(244,63,94,0.35)] font-mono text-xs text-white overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pinned Modal Header */}
            <div className="shrink-0 flex items-start justify-between border-b border-[#1E493B] px-4 py-3.5 sm:px-6 sm:py-4 bg-[#0a1b16]">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-rose-500/50 bg-rose-500/20 text-rose-400">
                  <ShieldAlert className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider truncate">
                    Freeze Account & Ban Member
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#A7B8AE] truncate mt-0.5">
                    Target: <span className="text-rose-400 font-bold">{member.email}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBanModalOpen(false)}
                className="rounded-xl border border-[#1E493B] bg-[#071C18] p-1.5 text-[#A7B8AE] hover:text-white transition shrink-0 ml-2"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 scrollbar-thin">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#F1D78A] block uppercase tracking-wider">
                  Suspension Reason (Required)
                </label>
                <textarea
                  rows={2}
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter policy violation reason..."
                  className="w-full rounded-xl border border-rose-500/40 bg-[#071C18] p-2.5 text-xs text-white placeholder-[#718A7F] outline-none transition focus:border-rose-500 resize-none"
                />
                {banError && (
                  <p className="text-xs text-rose-400 font-bold flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{banError}</span>
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-rose-500/35 bg-rose-950/20 p-3 space-y-2">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                  Immediate Security Restrictions:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10.5px] text-[#ECFDF5]/90">
                  <div className="flex items-start gap-1.5">
                    <span className="text-rose-400 shrink-0">❌</span>
                    <span><strong>NO Withdrawals:</strong> Address & payout blocked</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-rose-400 shrink-0">❌</span>
                    <span><strong>NO Deposits/Stakes:</strong> Capital locking blocked</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-rose-400 shrink-0">❌</span>
                    <span><strong>NO Daily Yield:</strong> 0.40%–0.50% worker skipped</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-rose-400 shrink-0">❌</span>
                    <span><strong>NO Saturday Release:</strong> Pending rewards frozen</span>
                  </div>
                  <div className="flex items-start gap-1.5 sm:col-span-2">
                    <span className="text-rose-400 shrink-0">❌</span>
                    <span><strong>NO Referral Code:</strong> Registrations rejected</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pinned Modal Actions Footer */}
            <div className="shrink-0 flex items-center justify-end gap-2.5 sm:gap-3 px-4 py-3 sm:px-6 sm:py-3.5 border-t border-[#1E493B] bg-[#071C18]">
              <button
                type="button"
                onClick={() => setBanModalOpen(false)}
                disabled={banSubmitting}
                className="rounded-xl border border-[#1E493B] bg-[#091512] px-4 py-2 font-bold text-[#A7B8AE] hover:text-white transition text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBan}
                disabled={banSubmitting || !banReason.trim()}
                className="flex items-center gap-2 rounded-xl border border-rose-500 bg-rose-700 px-4 sm:px-5 py-2 font-bold text-white shadow-lg transition hover:bg-rose-600 disabled:opacity-50 text-xs"
              >
                {banSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Freezing...</span>
                  </>
                ) : (
                  <>
                    <Ban className="h-4 w-4" />
                    <span>Confirm Ban & Freeze</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unban Confirmation Modal */}
      {unbanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
          <div
            className="relative flex flex-col w-full max-w-md max-h-[92vh] sm:max-h-[88vh] rounded-2xl sm:rounded-3xl border border-[#34D399]/60 bg-[#091512] shadow-[0_0_50px_rgba(52,211,153,0.35)] font-mono text-xs text-white overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pinned Modal Header */}
            <div className="shrink-0 flex items-start justify-between border-b border-[#1E493B] px-4 py-3.5 sm:px-6 sm:py-4 bg-[#0a1b16]">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-[#34D399]/50 bg-[#34D399]/20 text-[#34D399]">
                  <UserCheck className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider truncate">
                    Lift Account Freeze
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#A7B8AE] truncate mt-0.5">
                    Target: <span className="text-[#34D399] font-bold">{member.email}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUnbanModalOpen(false)}
                className="rounded-xl border border-[#1E493B] bg-[#071C18] p-1.5 text-[#A7B8AE] hover:text-white transition shrink-0 ml-2"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 scrollbar-thin">
              <p className="text-[#A7B8AE] leading-relaxed text-xs">
                Lift ban and restore full platform interaction for <strong className="text-[#34D399]">{member.email}</strong>?
              </p>
            </div>

            {/* Pinned Modal Actions Footer */}
            <div className="shrink-0 flex items-center justify-end gap-2.5 sm:gap-3 px-4 py-3 sm:px-6 sm:py-3.5 border-t border-[#1E493B] bg-[#071C18]">
              <button
                type="button"
                onClick={() => setUnbanModalOpen(false)}
                disabled={unbanSubmitting}
                className="rounded-xl border border-[#1E493B] bg-[#091512] px-4 py-2 font-bold text-[#A7B8AE] hover:text-white transition text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUnban}
                disabled={unbanSubmitting}
                className="flex items-center gap-2 rounded-xl border border-[#34D399]/70 bg-gradient-to-r from-[#10B981] to-[#059669] px-4 sm:px-5 py-2 font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50 text-xs"
              >
                {unbanSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Activating...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Lift Ban</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  );
};

export default AdminMemberDetail;

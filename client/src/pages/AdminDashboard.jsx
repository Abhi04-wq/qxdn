import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Coins, Users, Wallet, TrendingUp, Loader2, Copy, Check, KeyRound,
  Link2, UserCheck, ShieldAlert, MailCheck, MailX, ExternalLink, Database,
  Lock, CheckCircle2, PauseCircle, Network, Layers, History,
} from 'lucide-react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Toast from '../components/Toast.jsx';
import TeamTree from '../components/TeamTree.jsx';
import AdminIncomeLedger from '../components/admin/AdminIncomeLedger.jsx';
import AdminOverviewAnalytics from '../components/admin/AdminOverviewAnalytics.jsx';
import AdminSupportDesk from '../components/admin/AdminSupportDesk.jsx';

const TABS = ['overview', 'income-ledger', 'deposits', 'members', 'stakes', 'referrals', 'tree', 'support'];

const PLAN_FOR = (amount) => {
  if (Number(amount) <= 1000) return 'STARTER';
  if (Number(amount) <= 5000) return 'RAPID';
  return 'ROCKET';
};

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 6 });

const StatCard = ({ Icon, label, value, sub, currency = '' }) => (
  <div className="group relative flex flex-col justify-between rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] p-5 shadow-card-gold transition-all duration-300 hover:border-[#D4AF37]/70 hover:shadow-[0_8px_35px_rgba(212,175,55,0.2)]">
    <div>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#F1D78A]">{label}</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <p className="text-2xl font-black font-mono tracking-tight text-gold-gradient">{value}</p>
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

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tab = TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'overview';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState('');
  const [stakes, setStakes] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [treeData, setTreeData] = useState(null);
  const [treeMemberId, setTreeMemberId] = useState('');
  const [treeLoading, setTreeLoading] = useState(false);
  const [releaseLogs, setReleaseLogs] = useState(null);
  const [treeError, setTreeError] = useState('');

  const reloadData = useCallback(async () => {
    try {
      const [{ data: ov }, { data: rl }, { data: st }] = await Promise.all([
        api.get('/api/admin/overview'),
        api.get('/api/admin/referral-link'),
        api.get('/api/admin/all-stakes?status=all').catch(() => ({ data: { data: null } })),
      ]);
      setData({ ...ov.data, referralLink: rl.data?.referralLink });
      if (st.data) setStakes(st.data);
    } catch (error) {
      setToast(error.response?.data?.message || 'Failed to load admin data');
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await reloadData();
      } finally {
        setLoading(false);
      }
    })();
  }, [reloadData]);

  const loadStakes = useCallback(async (status = 'all') => {
    const { data: s } = await api.get(`/api/admin/all-stakes?status=${status}`);
    setStakes(s.data);
  }, []);

  useEffect(() => {
    if (tab !== 'stakes') return;
    loadStakes(statusFilter).catch((e) => setToast(e.response?.data?.message || 'Failed to load stakes'));
  }, [tab, statusFilter, loadStakes]);

  // Member Tree tab: load release audit trail once
  useEffect(() => {
    if (tab !== 'tree') return;
    api
      .get('/api/admin/release-logs')
      .then(({ data }) => setReleaseLogs(data.data.batches || []))
      .catch(() => setReleaseLogs([]));
  }, [tab]);

  const loadTree = useCallback(async (userId) => {
    if (!userId) {
      setTreeData(null);
      return;
    }
    setTreeLoading(true);
    setTreeError('');
    try {
      const { data: res } = await api.get(`/api/admin/member-tree/${userId}`);
      setTreeData(res.data);
    } catch (err) {
      setTreeData(null);
      setTreeError(err.response?.data?.message || 'Failed to load member tree');
    } finally {
      setTreeLoading(false);
    }
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setToast('Referral link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setToast('Copy failed');
    }
  };

  const { totals = {} } = data || {};

  return (
    <div className="w-full px-4 py-8 sm:px-6 lg:px-8 text-[#ECFDF5]">
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[#34D399]" />
        </div>
      ) : (
        <>
          {/* OVERVIEW */}
          {tab === 'overview' && (
            <AdminOverviewAnalytics
              data={data}
              stakesData={stakes}
              loading={loading}
              onRefresh={reloadData}
            />
          )}

          {/* INCOME LEDGER */}
          {tab === 'income-ledger' && <AdminIncomeLedger />}

          {/* DEPOSITS */}
          {tab === 'deposits' && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-[#ECFDF5]">USDT Deposit Inflow</h2>
                <p className="mt-1 text-sm text-[#91A89E]">How much USDT entered and from which member</p>
              </div>
              <section className="overflow-hidden rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] shadow-card-gold transition-all duration-300 hover:border-[#D4AF37]/60">
                {data.deposits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-14">
                    <Coins className="mb-4 h-10 w-10 text-[#1E493B]" />
                    <p className="text-sm font-medium text-[#ECFDF5]">No deposits yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-[#0B2720]/80 text-[11px] uppercase tracking-wider text-[#91A89E]">
                          <th className="px-6 py-3 font-medium">User</th>
                          <th className="px-6 py-3 font-medium">Referral Code</th>
                          <th className="px-6 py-3 font-medium">Deposits</th>
                          <th className="px-6 py-3 font-medium">Total In</th>
                          <th className="px-6 py-3 font-medium">Staked</th>
                          <th className="px-6 py-3 font-medium">Available</th>
                          <th className="px-6 py-3 font-medium">Last Deposit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E493B]">
                        {data.deposits.map((d) => (
                          <tr key={d.userId} className="text-[#ECFDF5] transition hover:bg-[#164B3A]/40">
                            <td className="px-6 py-3 text-xs">{d.email}</td>
                            <td className="px-6 py-3 font-mono text-xs text-[#34D399] font-bold">{d.referralCode}</td>
                            <td className="px-6 py-3">{d.depositCount}</td>
                            <td className="whitespace-nowrap px-6 py-3 font-semibold text-[#34D399]">+{fmt(d.totalDeposited)} USDT</td>
                            <td className="px-6 py-3">{fmt(d.staked)} USDT</td>
                            <td className="whitespace-nowrap px-6 py-3 font-medium text-[#ECFDF5]">{fmt(d.availableBalance)} USDT</td>
                            <td className="whitespace-nowrap px-6 py-3 text-xs text-[#91A89E]">{new Date(d.lastDepositAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {/* MEMBERS */}
          {tab === 'members' && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-[#ECFDF5]">Members</h2>
                <p className="mt-1 text-sm text-[#91A89E]">{totals.totalMembers} registered members</p>
              </div>
              <section className="overflow-hidden rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] shadow-card-gold transition-all duration-300 hover:border-[#D4AF37]/60">
                {data.members.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-14">
                    <Users className="mb-4 h-10 w-10 text-[#1E493B]" />
                    <p className="text-sm font-medium text-[#ECFDF5]">No members yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-[#0B2720]/80 text-[11px] uppercase tracking-wider text-[#91A89E]">
                          <th className="px-6 py-3 font-medium">Email</th>
                          <th className="px-6 py-3 font-medium">Referral Code</th>
                          <th className="px-6 py-3 font-medium">Sponsor</th>
                          <th className="px-6 py-3 font-medium">Deposited</th>
                          <th className="px-6 py-3 font-medium">Available</th>
                          <th className="px-6 py-3 font-medium">Email</th>
                          <th className="px-6 py-3 font-medium">Joined</th>
                          <th className="px-6 py-3 font-medium"> </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E493B]">
                        {data.members.map((m) => (
                          <tr
                            key={m.userId}
                            onClick={() => navigate(`/admin/member/${m.userId}`)}
                            className="cursor-pointer text-[#ECFDF5] transition hover:bg-[#164B3A]/40"
                            title="Open member profile"
                          >
                            <td className="px-6 py-3 text-xs">{m.email}</td>
                            <td className="px-6 py-3 font-mono text-xs text-[#34D399] font-bold">{m.referralCode}</td>
                            <td className="px-6 py-3 font-mono text-xs text-[#A7C4B8]">{m.sponsorCode || 'Direct'}</td>
                            <td className="px-6 py-3">{fmt(m.totalDeposited)} USDT</td>
                            <td className="px-6 py-3 font-medium text-[#34D399]">{fmt(m.availableBalance)} USDT</td>
                            <td className="px-6 py-3">
                              {m.isEmailVerified ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-[#34D399]/30 bg-[#34D399]/10 px-2 py-0.5 text-[10px] text-[#34D399]"><MailCheck className="h-3 w-3" />Verified</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-0.5 text-[10px] text-[#F1D78A]"><MailX className="h-3 w-3" />Pending</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-6 py-3 text-xs text-[#91A89E]">{new Date(m.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-3">
                              <ExternalLink className="h-3.5 w-3.5 text-[#91A89E]" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {/* ALL STAKES */}
          {tab === 'stakes' && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-[#ECFDF5]">All Staking Positions</h2>
                <p className="mt-1 text-sm text-[#91A89E]">Every stake on the platform with 100% cap progress</p>
              </div>

              {stakes && (
                <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard Icon={Lock} label="Total Positions" value={stakes.summary.all.count} accent="text-[#34D399]" />
                  <StatCard Icon={Database} label="Total Staked" value={`${fmt(stakes.summary.all.staked)} USDT`} accent="text-[#6EE7B7]" />
                  <StatCard Icon={TrendingUp} label="Total Rewards Accrued" value={`${fmt(stakes.summary.all.accrued)} USDT`} accent="text-[#34D399]" />
                  <StatCard Icon={CheckCircle2} label="Completed / Active" value={`${stakes.summary.completed?.count || 0} / ${stakes.summary.active?.count || 0}`} accent="text-[#F1D78A]" />
                </section>
              )}

              <div className="mb-4 flex gap-2">
                {['all', 'active', 'completed', 'paused'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold capitalize transition ${
                      statusFilter === s
                        ? 'border-[#34D399] bg-[#164B3A] text-[#34D399]'
                        : 'border-[#1E493B] text-[#91A89E] hover:bg-[#10352C] hover:text-[#ECFDF5]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
                {stakes && (
                  <button
                    onClick={() => loadStakes(statusFilter)}
                    className="ml-auto rounded-xl border border-[#1E493B] bg-[#10352C] px-3 py-1.5 text-xs font-semibold text-[#A7C4B8] transition hover:bg-[#164B3A] hover:text-[#ECFDF5]"
                  >
                    Refresh
                  </button>
                )}
              </div>

              <section className="overflow-hidden rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] shadow-card-gold transition-all duration-300 hover:border-[#D4AF37]/60">
                {!stakes || stakes.stakes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-14">
                    <Lock className="mb-4 h-10 w-10 text-[#1E493B]" />
                    <p className="text-sm font-medium text-[#ECFDF5]">No staking positions{statusFilter !== 'all' ? ` (${statusFilter})` : ''}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] text-left text-sm">
                      <thead>
                        <tr className="bg-[#0B2720]/80 text-[11px] uppercase tracking-wider text-[#91A89E]">
                          <th className="px-6 py-3 font-medium">Member</th>
                          <th className="px-6 py-3 font-medium">Plan</th>
                          <th className="px-6 py-3 font-medium">Staked</th>
                          <th className="px-6 py-3 font-medium">Rate</th>
                          <th className="px-6 py-3 font-medium">Earned</th>
                          <th className="px-6 py-3 font-medium">Progress</th>
                          <th className="px-6 py-3 font-medium">Started</th>
                          <th className="px-6 py-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E493B]">
                        {stakes.stakes.map((s) => (
                          <tr key={s._id} className="text-[#ECFDF5] transition hover:bg-[#164B3A]/40">
                            <td className="px-6 py-3">
                              <p className="text-xs">{s.email}</p>
                              <p className="font-mono text-[11px] text-[#34D399] font-bold">{s.referralCode}</p>
                            </td>
                            <td className="px-6 py-3 font-semibold tracking-wide text-[#ECFDF5]">{PLAN_FOR(s.amount)}</td>
                            <td className="whitespace-nowrap px-6 py-3">{fmt(s.amount)} USDT</td>
                            <td className="whitespace-nowrap px-6 py-3 text-[#34D399]">{(s.dailyRate * 100).toFixed(2)}%</td>
                            <td className="whitespace-nowrap px-6 py-3 font-semibold text-[#34D399]">{fmt(s.cumulativeReward)} USDT</td>
                            <td className="min-w-[150px] px-6 py-3">
                              <div className="mb-1 h-1.5 w-32 overflow-hidden rounded-full bg-[#0B2720]">
                                <div
                                  className={`h-full rounded-full ${s.progressPercent >= 100 ? 'bg-[#34D399]' : 'bg-gradient-to-r from-[#34D399] to-[#6EE7B7]'}`}
                                  style={{ width: `${Math.max(2, s.progressPercent)}%` }}
                                />
                              </div>
                              <p className="mt-1 text-[11px] text-[#91A89E]">{s.progressPercent}%</p>
                            </td>
                            <td className="whitespace-nowrap px-6 py-3 text-xs text-[#91A89E]">{new Date(s.startDate).toLocaleDateString()}</td>
                            <td className="px-6 py-3">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                                s.status === 'active'
                                  ? 'border border-[#34D399]/30 bg-[#34D399]/10 text-[#34D399]'
                                  : s.status === 'completed'
                                    ? 'border border-[#6EE7B7]/20 bg-[#6EE7B7]/10 text-[#6EE7B7]'
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
            </>
          )}

          {/* REFERRALS */}
          {tab === 'referrals' && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-[#ECFDF5]">Referral / Invite Link</h2>
                <p className="mt-1 text-sm text-[#91A89E]">Share this to onboard sponsored members</p>
              </div>
              <section className="rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] shadow-card-gold transition-all duration-300 hover:border-[#D4AF37]/60">
                <div className="flex items-center gap-2 border-b border-[#1E493B] px-6 py-4">
                  <KeyRound className="h-4 w-4 text-[#34D399]" />
                  <h3 className="text-sm font-semibold text-[#ECFDF5]">Your Invite Link</h3>
                </div>
                <div className="px-6 py-6">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input readOnly value={data.referralLink} onFocus={(e) => e.target.select()} className="w-full rounded-xl border border-[#1E493B] bg-[#0B2720] px-4 py-2.5 font-mono text-sm text-[#34D399] outline-none focus:border-[#34D399]" />
                    <button onClick={copyLink} className="flex items-center justify-center gap-2 rounded-xl bg-[#34D399] px-5 py-2.5 text-sm font-bold text-[#071C18] transition hover:bg-[#6EE7B7] hover:shadow-[0_0_25px_rgba(52,211,153,0.35)] sm:w-auto">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? 'Copied' : 'Copy Link'}
                    </button>
                  </div>
                  <p className="mt-3 break-all font-mono text-xs text-[#91A89E]">
                    <Link2 className="mr-1 inline h-3 w-3 text-[#34D399]" />
                    {data.referralLink}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:max-w-sm">
                    <div className="rounded-xl border border-[#1E493B] bg-[#0B2720] p-3">
                      <p className="text-[10px] uppercase tracking-wider text-[#91A89E]">My Referral Code</p>
                      <p className="font-mono text-sm font-bold text-[#34D399]">{user.referralCode}</p>
                    </div>
                    <div className="rounded-xl border border-[#1E493B] bg-[#0B2720] p-3">
                      <p className="text-[10px] uppercase tracking-wider text-[#91A89E]">Members Referred</p>
                      <p className="text-sm font-semibold text-[#ECFDF5]">{totals.myReferredCount}</p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
          {/* MEMBER TEAM TREE */}
          {tab === 'tree' && (
            <>
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#ECFDF5]">Member Team Tree</h2>
                  <p className="mt-1 text-sm text-[#91A89E]">Inspect any member's full L1-L{10} downline hierarchy</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={treeMemberId}
                    onChange={(e) => {
                      setTreeMemberId(e.target.value);
                      loadTree(e.target.value);
                    }}
                    className="max-w-[280px] rounded-xl border border-[#1E493B] bg-[#0B2720] px-3 py-2.5 text-sm text-[#ECFDF5] outline-none focus:border-[#34D399]"
                  >
                    <option value="">Select a member...</option>
                    {(data?.members || [])
                      .slice()
                      .sort((a, b) => a.email.localeCompare(b.email))
                      .map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.email} ({m.referralCode})
                        </option>
                      ))}
                  </select>
                  {treeMemberId && (
                    <button
                      onClick={() => loadTree(treeMemberId)}
                      className="rounded-xl border border-[#1E493B] bg-[#10352C] px-3 py-2.5 text-xs font-semibold text-[#A7C4B8] transition hover:bg-[#164B3A] hover:text-[#ECFDF5]"
                    >
                      Refresh
                    </button>
                  )}
                </div>
              </div>

              {!treeMemberId ? (
                <section className="rounded-2xl border border-[#1E493B] bg-[#10352C]">
                  <div className="flex flex-col items-center justify-center px-6 py-14">
                    <Network className="mb-4 h-10 w-10 text-[#1E493B]" />
                    <p className="text-sm font-medium text-[#ECFDF5]">Select a member to view their team tree</p>
                  </div>
                </section>
              ) : treeLoading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="h-8 w-8 animate-spin text-[#34D399]" />
                </div>
              ) : treeError ? (
                <p className="py-14 text-center text-sm text-rose-400">{treeError}</p>
              ) : (
                <>
                  {treeData && (
                    <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <StatCard Icon={Users} label="Downline Members" value={treeData.totals?.members ?? 0} accent="text-[#34D399]" />
                      <StatCard Icon={Coins} label="Team Volume" value={`${fmt(treeData.totals?.volume ?? 0)} USDT`} accent="text-[#6EE7B7]" />
                      <StatCard Icon={TrendingUp} label="Commission Paid" value={`${fmt(treeData.totals?.earned ?? 0)} USDT`} accent="text-[#34D399]" />
                    </section>
                  )}

                  {treeData && (
                    <section className="mb-6 overflow-hidden rounded-2xl border border-[#1E493B] bg-[#10352C] shadow-sm">
                      <div className="flex items-center gap-2 border-b border-[#1E493B] px-6 py-4">
                        <Layers className="h-4 w-4 text-[#34D399]" />
                        <h3 className="text-sm font-semibold text-[#ECFDF5]">Level Breakdown (L1-L10)</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-left text-sm">
                          <thead>
                            <tr className="bg-[#0B2720]/80 text-[11px] uppercase tracking-wider text-[#91A89E]">
                              <th className="px-6 py-3 font-medium">Level</th>
                              <th className="px-6 py-3 font-medium">Rate</th>
                              <th className="px-6 py-3 font-medium">Members</th>
                              <th className="px-6 py-3 font-medium">Volume</th>
                              <th className="px-6 py-3 font-medium">Earned</th>
                              <th className="px-6 py-3 font-medium">Pending</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1E493B]">
                            {(treeData.levels || []).map((l) => (
                              <tr key={l.level} className={`text-[#ECFDF5] transition hover:bg-[#164B3A]/40 ${l.members === 0 ? 'opacity-50' : ''}`}>
                                <td className="px-6 py-3">
                                  <span className="rounded-full bg-[#164B3A] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#34D399]">L{l.level}</span>
                                </td>
                                <td className="px-6 py-3 font-semibold text-[#34D399]">{l.rate}</td>
                                <td className="px-6 py-3">{l.members}</td>
                                <td className="whitespace-nowrap px-6 py-3">{fmt(l.volume)} USDT</td>
                                <td className="whitespace-nowrap px-6 py-3 font-semibold text-[#34D399]">{fmt(l.earned)} USDT</td>
                                <td className="whitespace-nowrap px-6 py-3 text-[#F1D78A]">{l.pendingEarned > 0 ? fmt(l.pendingEarned) : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}

                  <section className="mb-6 rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] shadow-card-gold transition-all duration-300 hover:border-[#D4AF37]/60">
                    <div className="border-b border-[#1E493B] px-6 py-4">
                      <h3 className="text-sm font-semibold text-[#ECFDF5]">Tree View</h3>
                    </div>
                    <div className="p-4 sm:p-6">
                      {treeData?.tree?.children?.length === 0 ? (
                        <p className="py-10 text-center text-sm text-[#91A89E]">This member has no downline yet</p>
                      ) : (
                        <TeamTree node={treeData.tree} maxDepth={10} />
                      )}
                    </div>
                  </section>
                </>
              )}

              {/* Saturday release audit trail */}
              <section className="overflow-hidden rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] shadow-card-gold transition-all duration-300 hover:border-[#D4AF37]/60">
                <div className="flex items-center gap-2 border-b border-[#1E493B] px-6 py-4">
                  <History className="h-4 w-4 text-[#34D399]" />
                  <h3 className="text-sm font-semibold text-[#ECFDF5]">Saturday Release Audit Log</h3>
                  <span className="rounded-full border border-[#1E493B] bg-[#0B2720] px-2.5 py-0.5 text-[11px] text-[#A7C4B8]">
                    {releaseLogs ? `${releaseLogs.length} batch${releaseLogs.length === 1 ? '' : 'es'}` : '...'}
                  </span>
                </div>
                {!releaseLogs ? (
                  <div className="flex items-center justify-center py-14">
                    <Loader2 className="h-6 w-6 animate-spin text-[#34D399]" />
                  </div>
                ) : releaseLogs.length === 0 ? (
                  <p className="px-6 py-10 text-center text-sm text-[#91A89E]">No release batches yet - batches appear after each Saturday release</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-left text-sm">
                      <thead>
                        <tr className="bg-[#0B2720]/80 text-[11px] uppercase tracking-wider text-[#91A89E]">
                          <th className="px-6 py-3 font-medium">Batch</th>
                          <th className="px-6 py-3 font-medium">Trigger</th>
                          <th className="px-6 py-3 font-medium">Released At</th>
                          <th className="px-6 py-3 font-medium">Entries</th>
                          <th className="px-6 py-3 font-medium">Total Amount</th>
                          <th className="px-6 py-3 font-medium">Users</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E493B]">
                        {releaseLogs.map((b) => (
                          <tr key={b.releaseBatch} className="text-[#ECFDF5] transition hover:bg-[#164B3A]/40">
                            <td className="px-6 py-3 font-mono text-[11px] text-[#91A89E]">{b.releaseBatch.slice(0, 18)}…</td>
                            <td className="px-6 py-3">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${b.trigger === 'cron' ? 'bg-[#34D399]/15 text-[#34D399]' : 'bg-[#6EE7B7]/15 text-[#6EE7B7]'}`}>
                                {b.trigger}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-3 text-xs text-[#91A89E]">{new Date(b.releasedAt).toLocaleString()}</td>
                            <td className="px-6 py-3">{b.totalEntries}</td>
                            <td className="whitespace-nowrap px-6 py-3 font-semibold text-[#34D399]">{fmt(b.totalAmount)} USDT</td>
                            <td className="px-6 py-3">{b.perUser?.length || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {/* SUPPORT DESK */}
          {tab === 'support' && <AdminSupportDesk />}
        </>
      )}
      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  );
};

export default AdminDashboard;

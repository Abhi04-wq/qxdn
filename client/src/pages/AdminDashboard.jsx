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

const TABS = ['overview', 'deposits', 'members', 'stakes', 'referrals', 'tree'];

const PLAN_FOR = (amount) => {
  if (Number(amount) <= 1000) return 'STARTER';
  if (Number(amount) <= 5000) return 'RAPID';
  return 'ROCKET';
};

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 6 });

const StatCard = ({ Icon, label, value, sub, accent = 'text-cyan-400' }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-bold text-white">{value}</p>
        {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
      </div>
      <span className={`rounded-lg border border-slate-800 bg-slate-950/80 p-2 ${accent}`}>
        <Icon className="h-4 w-4" />
      </span>
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

  useEffect(() => {
    (async () => {
      try {
        const [{ data: ov }, { data: rl }] = await Promise.all([
          api.get('/api/admin/overview'),
          api.get('/api/admin/referral-link'),
        ]);
        setData({ ...ov.data, referralLink: rl.data.referralLink });
      } catch (error) {
        setToast(error.response?.data?.message || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        </div>
      ) : (
        <>
          {/* OVERVIEW */}
          {tab === 'overview' && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-white">Platform Overview</h2>
                <p className="mt-1 text-sm text-slate-500">All USDT flows, derived live from the append-only ledger</p>
              </div>
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard Icon={Coins} label="Total USDT Deposited" value={`${fmt(totals.totalDeposits)} USDT`} sub={`${totals.depositEntries} confirmed deposit entries`} accent="text-emerald-400" />
                <StatCard Icon={Database} label="Active Stake (All Members)" value={`${fmt(totals.totalStaked)} USDT`} accent="text-indigo-400" />
                <StatCard Icon={TrendingUp} label="Accrued Rewards (All)" value={`${fmt(totals.totalRewards)} USDT`} accent="text-amber-400" />
                <StatCard Icon={Wallet} label="Net Member Balance" value={`${fmt(totals.netMemberBalance)} USDT`} sub="Deposits − staked − withdrawals" accent="text-cyan-400" />
                <StatCard Icon={Users} label="Total Members" value={totals.totalMembers} sub={`${totals.totalUsers} accounts total`} />
                <StatCard Icon={UserCheck} label="Referrals" value={totals.totalReferrals} sub={`${totals.myReferredCount} sponsored by you`} accent="text-emerald-400" />
              </section>
            </>
          )}

          {/* DEPOSITS */}
          {tab === 'deposits' && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-white">USDT Deposit Inflow</h2>
                <p className="mt-1 text-sm text-slate-500">How much USDT entered and from which member</p>
              </div>
              <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                {data.deposits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-14">
                    <Coins className="mb-4 h-10 w-10 text-slate-700" />
                    <p className="text-sm font-medium text-slate-300">No deposits yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-[11px] uppercase tracking-wider text-slate-500">
                          <th className="px-6 py-3 font-medium">User</th>
                          <th className="px-6 py-3 font-medium">Referral Code</th>
                          <th className="px-6 py-3 font-medium">Deposits</th>
                          <th className="px-6 py-3 font-medium">Total In</th>
                          <th className="px-6 py-3 font-medium">Staked</th>
                          <th className="px-6 py-3 font-medium">Available</th>
                          <th className="px-6 py-3 font-medium">Last Deposit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {data.deposits.map((d) => (
                          <tr key={d.userId} className="text-slate-300">
                            <td className="px-6 py-3 text-xs">{d.email}</td>
                            <td className="px-6 py-3 font-mono text-xs text-cyan-300">{d.referralCode}</td>
                            <td className="px-6 py-3">{d.depositCount}</td>
                            <td className="whitespace-nowrap px-6 py-3 font-semibold text-emerald-400">+{fmt(d.totalDeposited)} USDT</td>
                            <td className="px-6 py-3">{fmt(d.staked)} USDT</td>
                            <td className="whitespace-nowrap px-6 py-3 font-medium text-white">{fmt(d.availableBalance)} USDT</td>
                            <td className="whitespace-nowrap px-6 py-3 text-xs text-slate-500">{new Date(d.lastDepositAt).toLocaleString()}</td>
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
                <h2 className="text-2xl font-bold tracking-tight text-white">Members</h2>
                <p className="mt-1 text-sm text-slate-500">{totals.totalMembers} registered members</p>
              </div>
              <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                {data.members.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-14">
                    <Users className="mb-4 h-10 w-10 text-slate-700" />
                    <p className="text-sm font-medium text-slate-300">No members yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-[11px] uppercase tracking-wider text-slate-500">
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
                      <tbody className="divide-y divide-slate-800">
                        {data.members.map((m) => (
                          <tr
                            key={m.userId}
                            onClick={() => navigate(`/admin/member/${m.userId}`)}
                            className="cursor-pointer text-slate-300 transition hover:bg-slate-800/40"
                            title="Open member profile"
                          >
                            <td className="px-6 py-3 text-xs">{m.email}</td>
                            <td className="px-6 py-3 font-mono text-xs text-cyan-300">{m.referralCode}</td>
                            <td className="px-6 py-3 font-mono text-xs text-slate-400">{m.sponsorCode || 'Direct'}</td>
                            <td className="px-6 py-3">{fmt(m.totalDeposited)} USDT</td>
                            <td className="px-6 py-3 font-medium text-white">{fmt(m.availableBalance)} USDT</td>
                            <td className="px-6 py-3">
                              {m.isEmailVerified ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400"><MailCheck className="h-3 w-3" />Verified</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400"><MailX className="h-3 w-3" />Pending</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-6 py-3 text-xs text-slate-500">{new Date(m.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-3">
                              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
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
                <h2 className="text-2xl font-bold tracking-tight text-white">All Staking Positions</h2>
                <p className="mt-1 text-sm text-slate-500">Every stake on the platform with 100% cap progress</p>
              </div>

              {stakes && (
                <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard Icon={Lock} label="Total Positions" value={stakes.summary.all.count} accent="text-cyan-400" />
                  <StatCard Icon={Database} label="Total Staked" value={`${fmt(stakes.summary.all.staked)} USDT`} accent="text-indigo-400" />
                  <StatCard Icon={TrendingUp} label="Total Rewards Accrued" value={`${fmt(stakes.summary.all.accrued)} USDT`} accent="text-emerald-400" />
                  <StatCard Icon={CheckCircle2} label="Completed / Active" value={`${stakes.summary.completed?.count || 0} / ${stakes.summary.active?.count || 0}`} accent="text-amber-400" />
                </section>
              )}

              <div className="mb-4 flex gap-2">
                {['all', 'active', 'completed', 'paused'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition ${
                      statusFilter === s
                        ? 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    {s}
                  </button>
                ))}
                {stakes && (
                  <button
                    onClick={() => loadStakes(statusFilter)}
                    className="ml-auto rounded-lg border border-slate-800 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-slate-900 hover:text-slate-200"
                  >
                    Refresh
                  </button>
                )}
              </div>

              <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                {!stakes || stakes.stakes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-14">
                    <Lock className="mb-4 h-10 w-10 text-slate-700" />
                    <p className="text-sm font-medium text-slate-300">No staking positions{statusFilter !== 'all' ? ` (${statusFilter})` : ''}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] text-left text-sm">
                      <thead>
                        <tr className="text-[11px] uppercase tracking-wider text-slate-500">
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
                      <tbody className="divide-y divide-slate-800">
                        {stakes.stakes.map((s) => (
                          <tr key={s._id} className="text-slate-300">
                            <td className="px-6 py-3">
                              <p className="text-xs">{s.email}</p>
                              <p className="font-mono text-[11px] text-slate-500">{s.referralCode}</p>
                            </td>
                            <td className="px-6 py-3 font-semibold tracking-wide text-white">{PLAN_FOR(s.amount)}</td>
                            <td className="whitespace-nowrap px-6 py-3">{fmt(s.amount)} USDT</td>
                            <td className="whitespace-nowrap px-6 py-3 text-cyan-300">{(s.dailyRate * 100).toFixed(2)}%</td>
                            <td className="whitespace-nowrap px-6 py-3 font-semibold text-emerald-400">{fmt(s.cumulativeReward)} USDT</td>
                            <td className="min-w-[150px] px-6 py-3">
                              <div className="mb-1 h-1.5 w-32 overflow-hidden rounded-full bg-slate-950">
                                <div
                                  className={`h-full rounded-full ${s.progressPercent >= 100 ? 'bg-cyan-400' : 'bg-gradient-to-r from-amber-500 to-cyan-500'}`}
                                  style={{ width: `${Math.max(2, s.progressPercent)}%` }}
                                />
                              </div>
                              <p className="mt-1 text-[11px] text-slate-500">{s.progressPercent}%</p>
                            </td>
                            <td className="whitespace-nowrap px-6 py-3 text-xs text-slate-500">{new Date(s.startDate).toLocaleDateString()}</td>
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
            </>
          )}

          {/* REFERRALS */}
          {tab === 'referrals' && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-white">Referral / Invite Link</h2>
                <p className="mt-1 text-sm text-slate-500">Share this to onboard sponsored members</p>
              </div>
              <section className="rounded-2xl border border-cyan-400/20 bg-slate-900 shadow-[0_0_40px_-10px_rgba(34,211,238,0.15)]">
                <div className="flex items-center gap-2 border-b border-slate-800 px-6 py-4">
                  <KeyRound className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white">Your Invite Link</h3>
                </div>
                <div className="px-6 py-6">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input readOnly value={data.referralLink} onFocus={(e) => e.target.select()} className="w-full rounded-lg border border-slate-700/80 bg-slate-950 px-4 py-2.5 font-mono text-sm text-cyan-300 outline-none focus:border-cyan-400/60" />
                    <button onClick={copyLink} className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:shadow-[0_0_25px_rgba(34,211,238,0.35)] sm:w-auto">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? 'Copied' : 'Copy Link'}
                    </button>
                  </div>
                  <p className="mt-3 break-all font-mono text-xs text-slate-500">
                    <Link2 className="mr-1 inline h-3 w-3" />
                    {data.referralLink}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:max-w-sm">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">My Referral Code</p>
                      <p className="font-mono text-sm text-cyan-300">{user.referralCode}</p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">Members Referred</p>
                      <p className="text-sm font-semibold text-white">{totals.myReferredCount}</p>
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
                  <h2 className="text-2xl font-bold tracking-tight text-white">Member Team Tree</h2>
                  <p className="mt-1 text-sm text-slate-500">Inspect any member's full L1-L{10} downline hierarchy</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={treeMemberId}
                    onChange={(e) => {
                      setTreeMemberId(e.target.value);
                      loadTree(e.target.value);
                    }}
                    className="max-w-[280px] rounded-lg border border-slate-700/80 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-amber-400/60"
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
                      className="rounded-lg border border-slate-800 px-3 py-2.5 text-xs text-slate-400 transition hover:bg-slate-900 hover:text-slate-200"
                    >
                      Refresh
                    </button>
                  )}
                </div>
              </div>

              {!treeMemberId ? (
                <section className="rounded-2xl border border-slate-800 bg-slate-900">
                  <div className="flex flex-col items-center justify-center px-6 py-14">
                    <Network className="mb-4 h-10 w-10 text-slate-700" />
                    <p className="text-sm font-medium text-slate-300">Select a member to view their team tree</p>
                  </div>
                </section>
              ) : treeLoading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
                </div>
              ) : treeError ? (
                <p className="py-14 text-center text-sm text-rose-400">{treeError}</p>
              ) : (
                <>
                  {treeData && (
                    <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <StatCard Icon={Users} label="Downline Members" value={treeData.totals?.members ?? 0} accent="text-cyan-400" />
                      <StatCard Icon={Coins} label="Team Volume" value={`${fmt(treeData.totals?.volume ?? 0)} USDT`} accent="text-indigo-400" />
                      <StatCard Icon={TrendingUp} label="Commission Paid" value={`${fmt(treeData.totals?.earned ?? 0)} USDT`} accent="text-emerald-400" />
                    </section>
                  )}

                  {treeData && (
                    <section className="mb-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                      <div className="flex items-center gap-2 border-b border-slate-800 px-6 py-4">
                        <Layers className="h-4 w-4 text-amber-400" />
                        <h3 className="text-sm font-semibold text-white">Level Breakdown (L1-L10)</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-left text-sm">
                          <thead>
                            <tr className="text-[11px] uppercase tracking-wider text-slate-500">
                              <th className="px-6 py-3 font-medium">Level</th>
                              <th className="px-6 py-3 font-medium">Rate</th>
                              <th className="px-6 py-3 font-medium">Members</th>
                              <th className="px-6 py-3 font-medium">Volume</th>
                              <th className="px-6 py-3 font-medium">Earned</th>
                              <th className="px-6 py-3 font-medium">Pending</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {(treeData.levels || []).map((l) => (
                              <tr key={l.level} className={`text-slate-300 ${l.members === 0 ? 'opacity-50' : ''}`}>
                                <td className="px-6 py-3">
                                  <span className="rounded-full bg-slate-800 px-2.5 py-0.5 font-mono text-[11px] font-bold text-slate-300">L{l.level}</span>
                                </td>
                                <td className="px-6 py-3 font-semibold text-amber-300">{l.rate}</td>
                                <td className="px-6 py-3">{l.members}</td>
                                <td className="whitespace-nowrap px-6 py-3">{fmt(l.volume)} USDT</td>
                                <td className="whitespace-nowrap px-6 py-3 font-semibold text-emerald-400">{fmt(l.earned)} USDT</td>
                                <td className="whitespace-nowrap px-6 py-3 text-amber-400">{l.pendingEarned > 0 ? fmt(l.pendingEarned) : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}

                  <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900">
                    <div className="border-b border-slate-800 px-6 py-4">
                      <h3 className="text-sm font-semibold text-white">Tree View</h3>
                    </div>
                    <div className="p-4 sm:p-6">
                      {treeData?.tree?.children?.length === 0 ? (
                        <p className="py-10 text-center text-sm text-slate-400">This member has no downline yet</p>
                      ) : (
                        <TeamTree node={treeData.tree} maxDepth={10} />
                      )}
                    </div>
                  </section>
                </>
              )}

              {/* Saturday release audit trail */}
              <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                <div className="flex items-center gap-2 border-b border-slate-800 px-6 py-4">
                  <History className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">Saturday Release Audit Log</h3>
                  <span className="rounded-full border border-slate-700/60 bg-slate-950 px-2.5 py-0.5 text-[11px] text-slate-400">
                    {releaseLogs ? `${releaseLogs.length} batch${releaseLogs.length === 1 ? '' : 'es'}` : '...'}
                  </span>
                </div>
                {!releaseLogs ? (
                  <div className="flex items-center justify-center py-14">
                    <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
                  </div>
                ) : releaseLogs.length === 0 ? (
                  <p className="px-6 py-10 text-center text-sm text-slate-400">No release batches yet - batches appear after each Saturday release</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-left text-sm">
                      <thead>
                        <tr className="text-[11px] uppercase tracking-wider text-slate-500">
                          <th className="px-6 py-3 font-medium">Batch</th>
                          <th className="px-6 py-3 font-medium">Trigger</th>
                          <th className="px-6 py-3 font-medium">Released At</th>
                          <th className="px-6 py-3 font-medium">Entries</th>
                          <th className="px-6 py-3 font-medium">Total Amount</th>
                          <th className="px-6 py-3 font-medium">Users</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {releaseLogs.map((b) => (
                          <tr key={b.releaseBatch} className="text-slate-300">
                            <td className="px-6 py-3 font-mono text-[11px] text-slate-500">{b.releaseBatch.slice(0, 18)}…</td>
                            <td className="px-6 py-3">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${b.trigger === 'cron' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cyan-400/10 text-cyan-400'}`}>
                                {b.trigger}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-3 text-xs text-slate-500">{new Date(b.releasedAt).toLocaleString()}</td>
                            <td className="px-6 py-3">{b.totalEntries}</td>
                            <td className="whitespace-nowrap px-6 py-3 font-semibold text-emerald-400">{fmt(b.totalAmount)} USDT</td>
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
        </>
      )}
      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  );
};

export default AdminDashboard;

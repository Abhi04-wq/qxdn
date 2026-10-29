import { useCallback, useEffect, useState } from 'react';
import {
  ArrowDownToLine, Clock, CheckCircle2, XCircle, ExternalLink,
  Copy, Check, Search, RefreshCw, Loader2, AlertCircle, ShieldAlert,
  Send, X, DollarSign, Wallet, Users, ChevronLeft, ChevronRight, FileText
} from 'lucide-react';
import api from '../lib/api.js';
import Toast from '../components/Toast.jsx';

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });

const StatCard = ({ icon: Icon, title, value, unit, subtitle, accentColor, borderColor }) => (
  <div className={`rounded-2xl border ${borderColor || 'border-slate-800'} bg-slate-900 p-5 transition hover:shadow-[0_4px_30px_-5px_rgba(34,211,238,0.1)]`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</p>
        <div className="mt-2 flex items-baseline gap-1.5">
          <p className="text-2xl font-extrabold text-white">{value}</p>
          {unit && <span className={`text-xs font-bold ${accentColor || 'text-cyan-400'}`}>{unit}</span>}
        </div>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>
      <span className={`rounded-xl border border-slate-800 bg-slate-950 p-2.5 ${accentColor || 'text-cyan-400'}`}>
        <Icon className="h-5 w-5" />
      </span>
    </div>
  </div>
);

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [stats, setStats] = useState({
    pendingPayoutVolume: 0,
    totalApprovedVolume: 0,
    pendingRequestsCount: 0,
    approvedRequestsCount: 0,
    rejectedRequestsCount: 0,
    totalRequestsCount: 0,
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 15, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('pending'); // default to pending for fast admin action
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  // Modals
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalType, setModalType] = useState(null); // 'approve' | 'reject' | null
  const [customTxHash, setCustomTxHash] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Random 64-char hex hash generator for mock BSC on-chain simulation
  const generateMockHash = () => {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  };

  const loadWithdrawals = useCallback(async (page = 1, status = statusFilter, search = searchQuery) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        status: status === 'all' ? undefined : status,
        search: search.trim() || undefined,
      };
      const { data } = await api.get('/api/admin/withdrawals', { params });
      setWithdrawals(data.data.withdrawals || []);
      setPagination(data.data.pagination || { page: 1, limit: 15, pages: 1, total: 0 });
      if (data.data.stats) {
        setStats(data.data.stats);
      }
    } catch (err) {
      setToast(err.response?.data?.message || 'Failed to fetch withdrawals');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadWithdrawals(1, statusFilter, searchQuery);
  }, [statusFilter, loadWithdrawals]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadWithdrawals(1, statusFilter, searchQuery);
  };

  const copyText = async (text, key, msg = 'Copied') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setToast(msg);
      setTimeout(() => setCopiedKey(''), 2000);
    } catch {
      setToast('Copy failed');
    }
  };

  const openApproveModal = (req) => {
    setSelectedRequest(req);
    setCustomTxHash(generateMockHash());
    setModalType('approve');
  };

  const openRejectModal = (req) => {
    setSelectedRequest(req);
    setRejectionReason('');
    setModalType('reject');
  };

  const handleApproveSubmit = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      const { data } = await api.post(`/api/admin/withdrawals/${selectedRequest._id}/process`, {
        action: 'approve',
        txHash: customTxHash.trim() || undefined,
      });

      setToast(data.message || 'Withdrawal approved successfully! Ledger confirmed.');
      setModalType(null);
      setSelectedRequest(null);
      await loadWithdrawals(pagination.page, statusFilter, searchQuery);
    } catch (err) {
      setToast(err.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      setToast('Please specify a rejection reason');
      return;
    }

    setActionLoading(true);
    try {
      const { data } = await api.post(`/api/admin/withdrawals/${selectedRequest._id}/process`, {
        action: 'reject',
        rejectionReason: rejectionReason.trim(),
      });

      setToast(data.message || 'Withdrawal rejected. Compensating refund credited to member.');
      setModalType(null);
      setSelectedRequest(null);
      await loadWithdrawals(pagination.page, statusFilter, searchQuery);
    } catch (err) {
      setToast(err.response?.data?.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const fmtDate = (d) =>
    new Date(d).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const truncate = (str, start = 8, end = 6) => {
    if (!str) return '—';
    if (str.length <= start + end) return str;
    return `${str.slice(0, start)}...${str.slice(-end)}`;
  };

  return (
    <div className="text-slate-200">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.15)]">
                <ArrowDownToLine className="h-5 w-5" />
              </span>
              Payouts & Withdrawals Management
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Audit, approve and settle BEP-20 member withdrawal requests with strict append-only ledger discipline
            </p>
          </div>
          <button
            onClick={() => loadWithdrawals(pagination.page, statusFilter, searchQuery)}
            className="flex items-center gap-2 self-start rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Queue
          </button>
        </div>

        {/* Top Stat Counters (3 cards required by specifications) */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={Clock}
            title="Pending Payout Volume"
            value={fmt(stats.pendingPayoutVolume)}
            unit="USDT"
            subtitle={`${stats.pendingRequestsCount} pending requests awaiting payout`}
            accentColor="text-amber-400"
            borderColor="border-amber-500/30"
          />
          <StatCard
            icon={CheckCircle2}
            title="Total Approved Volume"
            value={fmt(stats.totalApprovedVolume)}
            unit="USDT"
            subtitle={`${stats.approvedRequestsCount || 0} successfully settled transactions`}
            accentColor="text-emerald-400"
            borderColor="border-emerald-500/30"
          />
          <StatCard
            icon={ArrowDownToLine}
            title="Pending Requests Count"
            value={String(stats.pendingRequestsCount)}
            subtitle="Requires administrator action"
            accentColor="text-cyan-400"
            borderColor="border-cyan-500/30"
          />
        </section>

        {/* Actionable Request Table Card */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
          {/* Controls Bar: Tabs & Search */}
          <div className="flex flex-col gap-4 border-b border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 p-1">
              {[
                { id: 'pending', label: 'Pending Requests', count: stats.pendingRequestsCount },
                { id: 'approved', label: 'Approved', count: stats.approvedRequestsCount },
                { id: 'rejected', label: 'Rejected', count: stats.rejectedRequestsCount },
                { id: 'all', label: 'All Requests', count: stats.totalRequestsCount },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    statusFilter === tab.id
                      ? 'border border-amber-400/40 bg-amber-400/10 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.15)]'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                  {typeof tab.count === 'number' && (
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        statusFilter === tab.id
                          ? 'bg-amber-400/20 text-amber-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative sm:w-72">
              <input
                type="text"
                placeholder="Search address or hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950 pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-amber-400"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); loadWithdrawals(1, statusFilter, ''); }}
                  className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </form>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <ArrowDownToLine className="h-12 w-12 text-slate-700 mb-3" />
              <p className="text-sm font-semibold text-slate-300">No withdrawal requests found</p>
              <p className="mt-1 max-w-sm text-xs text-slate-500">
                {statusFilter === 'pending'
                  ? 'All member payout requests have been reviewed and settled.'
                  : `No records found matching status "${statusFilter}".`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5">Request ID</th>
                    <th className="px-5 py-3.5">Member Email</th>
                    <th className="px-4 py-3.5">Requested Date</th>
                    <th className="px-4 py-3.5">Gross Amount</th>
                    <th className="px-4 py-3.5">Net Payout</th>
                    <th className="px-4 py-3.5">BEP-20 Address</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {withdrawals.map((req) => (
                    <tr key={req._id} className="transition hover:bg-slate-800/30">
                      {/* Request ID */}
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <span>{truncate(req._id, 6, 4)}</span>
                          <button
                            type="button"
                            onClick={() => copyText(req._id, `id-${req._id}`, 'ID copied')}
                            className="rounded p-0.5 text-slate-500 hover:text-slate-300"
                            title="Copy ID"
                          >
                            {copiedKey === `id-${req._id}` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </td>

                      {/* Member Email */}
                      <td className="whitespace-nowrap px-5 py-4">
                        <p className="font-semibold text-slate-200">{req.userId?.email || '(unknown user)'}</p>
                        {req.userId?.referralCode && (
                          <p className="text-[10px] font-mono text-cyan-400">ID: {req.userId.referralCode}</p>
                        )}
                      </td>

                      {/* Requested Date */}
                      <td className="whitespace-nowrap px-4 py-4 text-slate-400">
                        {fmtDate(req.createdAt)}
                      </td>

                      {/* Gross Amount */}
                      <td className="whitespace-nowrap px-4 py-4 text-slate-200 font-medium">
                        {fmt(req.grossAmount)} USDT
                        <span className="block text-[10px] text-slate-500">Fee: {fmt(req.feeAmount)} USDT</span>
                      </td>

                      {/* Net Payout */}
                      <td className="whitespace-nowrap px-4 py-4 font-bold text-emerald-400">
                        {fmt(req.netAmount)} USDT
                      </td>

                      {/* Destination BEP-20 Address */}
                      <td className="whitespace-nowrap px-4 py-4 font-mono text-cyan-300">
                        <div className="flex items-center gap-1.5">
                          <span>{truncate(req.destinationAddress, 6, 4)}</span>
                          <button
                            type="button"
                            onClick={() => copyText(req.destinationAddress, `addr-${req._id}`, 'Address copied')}
                            className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                            title="Copy Address"
                          >
                            {copiedKey === `addr-${req._id}` ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                          <a
                            href={`https://bscscan.com/address/${req.destinationAddress}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-cyan-400"
                            title="View on BSCScan"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="whitespace-nowrap px-4 py-4">
                        {req.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                            <Clock className="h-3 w-3 animate-pulse" />
                            Pending
                          </span>
                        )}
                        {req.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Approved
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-400">
                            <XCircle className="h-3 w-3" />
                            Rejected
                          </span>
                        )}
                      </td>

                      {/* Action Column for Pending Rows */}
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        {req.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            {/* Green Button: Approve & Send Payout */}
                            <button
                              type="button"
                              onClick={() => openApproveModal(req)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/25 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Approve & Send Payout
                            </button>

                            {/* Red Button: Reject */}
                            <button
                              type="button"
                              onClick={() => openRejectModal(req)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/25"
                            >
                              <X className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </div>
                        ) : req.status === 'approved' ? (
                          <div className="flex items-center justify-end gap-1.5 font-mono text-[11px]">
                            {req.txHash ? (
                              <>
                                <a
                                  href={`https://bscscan.com/tx/${req.txHash}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-cyan-400 hover:underline"
                                >
                                  <span>{truncate(req.txHash, 6, 4)}</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => copyText(req.txHash, `tx-${req._id}`, 'Hash copied')}
                                  className="rounded p-1 text-slate-500 hover:text-slate-300"
                                >
                                  {copiedKey === `tx-${req._id}` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                </button>
                              </>
                            ) : (
                              <span className="text-slate-500">Confirmed (no hash)</span>
                            )}
                          </div>
                        ) : (
                          <div className="text-right">
                            <span className="block max-w-xs truncate text-[11px] text-rose-300" title={req.rejectionReason}>
                              {req.rejectionReason ? `Reason: ${req.rejectionReason}` : 'Refund issued'}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4">
              <span className="text-xs text-slate-400">
                Showing page <span className="font-semibold text-white">{pagination.page}</span> of{' '}
                <span className="font-semibold text-white">{pagination.pages}</span> ({pagination.total} total)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => loadWithdrawals(pagination.page - 1, statusFilter, searchQuery)}
                  className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => loadWithdrawals(pagination.page + 1, statusFilter, searchQuery)}
                  className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Modal: Approve & Send Payout */}
        {modalType === 'approve' && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-emerald-500/40 bg-slate-900 p-6 shadow-[0_0_50px_rgba(16,185,129,0.25)]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Check className="h-4 w-4" />
                  </span>
                  <h4 className="text-base font-bold text-white">Approve Withdrawal & Settle Payout</h4>
                </div>
                <button
                  onClick={() => setModalType(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Recipient Member:</span>
                    <span className="font-semibold text-white">{selectedRequest.userId?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gross Amount:</span>
                    <span className="font-semibold text-slate-300">{fmt(selectedRequest.grossAmount)} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Retained Fee (5%):</span>
                    <span className="font-semibold text-rose-400">+{fmt(selectedRequest.feeAmount)} USDT</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-bold">
                    <span className="text-emerald-400">Tokens to Transfer (Net):</span>
                    <span className="text-emerald-400">{fmt(selectedRequest.netAmount)} USDT</span>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">BEP-20 Destination Address</p>
                  <p className="mt-1 break-all rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-xs text-cyan-300">
                    {selectedRequest.destinationAddress}
                  </p>
                </div>

                {/* On-Chain txHash input with generator */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                      Transaction Hash (BSC TxHash)
                    </label>
                    <button
                      type="button"
                      onClick={() => setCustomTxHash(generateMockHash())}
                      className="text-[10px] font-semibold text-cyan-400 hover:underline"
                    >
                      Regenerate Hash
                    </button>
                  </div>
                  <input
                    type="text"
                    value={customTxHash}
                    onChange={(e) => setCustomTxHash(e.target.value)}
                    placeholder="0x..."
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 font-mono text-xs text-emerald-300 outline-none focus:border-emerald-400"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">
                    Approving will update the request to 'approved', store this on-chain txHash, and mark the associated ledger debit record as 'confirmed'.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setModalType(null)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleApproveSubmit}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Broadcasting...
                    </>
                  ) : (
                    'Confirm Approval & Ledger Settle'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Reject Payout */}
        {modalType === 'reject' && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-rose-500/40 bg-slate-900 p-6 shadow-[0_0_50px_rgba(244,63,94,0.25)]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
                    <X className="h-4 w-4" />
                  </span>
                  <h4 className="text-base font-bold text-white">Reject Withdrawal Request</h4>
                </div>
                <button
                  onClick={() => setModalType(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Member:</span>
                    <span className="font-semibold text-white">{selectedRequest.userId?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount to Refund:</span>
                    <span className="font-semibold text-emerald-400">+{fmt(selectedRequest.grossAmount)} USDT</span>
                  </div>
                </div>

                <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                  <p className="font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
                    Automatic Compensating Ledger Refund
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-rose-200/80">
                    Rejecting will insert a new confirmed credit record (<code className="text-white">WITHDRAWAL_REFUND</code>) into the append-only ledger for <span className="font-bold text-white">{fmt(selectedRequest.grossAmount)} USDT</span>, instantly restoring the member's available balance.
                  </p>
                </div>

                {/* Mandatory Rejection Reason */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                    Mandatory Rejection Reason <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Invalid BEP-20 address, suspicious activity, member requested cancellation..."
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/50"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setModalType(null)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading || !rejectionReason.trim()}
                  onClick={handleRejectSubmit}
                  className="flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-rose-600 shadow-[0_0_20px_rgba(244,63,94,0.3)] disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Refunding...
                    </>
                  ) : (
                    'Confirm Rejection & Refund'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
};

export default AdminWithdrawals;

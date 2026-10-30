import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  LifeBuoy, Search, MessageSquare, Clock, CheckCircle2,
  AlertCircle, AlertTriangle, ShieldCheck, ArrowUpRight, Copy, Check,
  ChevronRight, X, Send, Filter, RefreshCw, UserCheck, Sparkles,
  Layers, CheckSquare, Zap, ExternalLink, HelpCircle
} from 'lucide-react';
import api from '../../lib/api.js';
import socket from '../../lib/socket.js';
import Toast from '../Toast.jsx';

const CATEGORY_MAP = {
  DEPOSIT_ISSUE: 'Deposit Issue',
  WITHDRAWAL_QUERY: 'Withdrawal Query',
  STAKING_REWARDS: 'Staking Rewards',
  REFERRAL_TREE: 'Referral Tree',
  SECURITY_2FA: 'Security & 2FA',
  GENERAL_INQUIRY: 'General Inquiry',
};

const PRIORITIES = {
  LOW: { label: 'Low', badge: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' },
  MEDIUM: { label: 'Medium', badge: 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#F1D78A]' },
  HIGH: { label: 'High', badge: 'bg-amber-500/15 border-amber-500/40 text-amber-300' },
  URGENT: { label: 'Urgent', badge: 'bg-rose-500/15 border-rose-500/40 text-rose-300' },
};

const STATUSES = {
  OPEN: { label: 'Open', badge: 'bg-blue-500/15 border-blue-500/40 text-blue-300' },
  IN_PROGRESS: { label: 'In Progress', badge: 'bg-amber-500/15 border-amber-500/40 text-amber-300' },
  RESOLVED: { label: 'Resolved', badge: 'bg-[#34D399]/15 border-[#34D399]/40 text-[#34D399]' },
  CLOSED: { label: 'Closed', badge: 'bg-slate-500/15 border-slate-500/40 text-slate-300' },
};

const CANNED_RESPONSES = [
  'USDT deposit confirmed and verified on-chain. Credited to ledger.',
  'Please provide the transaction hash (TxHash) for on-chain audit.',
  'Daily yield accrual is compounding normally. Saturday release queued.',
  'Referral commission verified and mapped across the 10-tier tree.',
  'Your issue has been resolved. Please review your available balance.',
];

const LOCAL_STORAGE_KEY = 'qndx_member_support_tickets';

const getLocalTickets = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setLocalTickets = (tickets) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tickets));
  } catch {}
};

export default function AdminSupportDesk() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    totalAll: 0,
    totalOpen: 0,
    totalInProgress: 0,
    totalResolved: 0,
    totalClosed: 0,
    totalUrgent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Active Selected Ticket
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Admin Reply Form
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('IN_PROGRESS');
  const [sendingReply, setSendingReply] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const chatEndRef = useRef(null);
  const selectedTicketIdRef = useRef(selectedTicketId);
  const selectedTicketRef = useRef(selectedTicket);

  useEffect(() => {
    selectedTicketIdRef.current = selectedTicketId;
  }, [selectedTicketId]);

  useEffect(() => {
    selectedTicketRef.current = selectedTicket;
  }, [selectedTicket]);

  useEffect(() => {
    if (selectedTicket?.messages) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages?.length]);

  const fetchAdminTickets = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const { data: res } = await api.get('/api/admin/tickets', {
        params: {
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
          search: search.trim() || undefined,
          limit: 100,
        },
      });

      if (res.success && res.data) {
        const list = res.data.tickets || [];
        setTickets(list);
        if (res.data.stats) setStats(res.data.stats);

        if (list.length > 0) {
          const currId = selectedTicketIdRef.current;
          if (!currId) {
            setSelectedTicketId(list[0]._id || list[0].ticketId);
            setSelectedTicket(list[0]);
          } else {
            const current = list.find(
              (t) => (t._id || t.ticketId) === currId || t.ticketId === currId || t._id === currId
            );
            if (current) {
              setSelectedTicket(current);
            }
          }
        }
        return;
      }
    } catch (err) {
      // Graceful local storage sync if remote backend returns 404 (prior to deploy)
      if (err.response?.status === 404) {
        let local = getLocalTickets();
        if (statusFilter !== 'ALL') local = local.filter((t) => t.status === statusFilter);
        if (priorityFilter !== 'ALL') local = local.filter((t) => t.priority === priorityFilter);
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          local = local.filter(
            (t) =>
              t.ticketId.toLowerCase().includes(q) ||
              t.subject.toLowerCase().includes(q) ||
              t.user?.email?.toLowerCase().includes(q)
          );
        }

        const all = getLocalTickets();
        const calculatedStats = {
          totalAll: all.length,
          totalOpen: all.filter((t) => t.status === 'OPEN').length,
          totalInProgress: all.filter((t) => t.status === 'IN_PROGRESS').length,
          totalResolved: all.filter((t) => t.status === 'RESOLVED').length,
          totalClosed: all.filter((t) => t.status === 'CLOSED').length,
          totalUrgent: all.filter((t) => t.priority === 'URGENT' && t.status !== 'CLOSED').length,
        };

        setTickets(local);
        setStats(calculatedStats);

        if (local.length > 0) {
          const current = local.find((t) => t.ticketId === selectedTicketId) || local[0];
          setSelectedTicketId(current._id || current.ticketId);
          setSelectedTicket(current);
        }
        return;
      }

      console.error('Failed to load admin tickets:', err);
      setToast(err.response?.data?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, priorityFilter, search]);

  // 1. Join admin feed room & 5-second background auto-poll & socket event listeners
  useEffect(() => {
    fetchAdminTickets();

    socket.emit('join_admin_feed');

    const interval = setInterval(() => {
      fetchAdminTickets(true);
    }, 5000);

    const onTicketCreated = (newTicket) => {
      fetchAdminTickets(true);
      setToast(`New Ticket: ${newTicket.ticketId}`);
    };

    const onTicketUpdated = (updated) => {
      setTickets((prev) =>
        prev.map((t) => (t.ticketId === updated.ticketId || t._id === updated._id ? { ...t, ...updated } : t))
      );
      const currId = selectedTicketIdRef.current;
      if (currId && (updated.ticketId === currId || updated._id === currId)) {
        setSelectedTicket(updated);
      }
    };

    const onTicketMessage = (payload) => {
      const currId = selectedTicketIdRef.current;
      if (currId && (payload.ticketId === currId || payload.ticket?._id === currId || payload.ticket?.ticketId === currId)) {
        if (payload.ticket) {
          setSelectedTicket(payload.ticket);
        }
      }
      fetchAdminTickets(true);
    };

    socket.on('ticket_created', onTicketCreated);
    socket.on('ticket_updated', onTicketUpdated);
    socket.on('ticket_message', onTicketMessage);

    return () => {
      clearInterval(interval);
      socket.emit('leave_admin_feed');
      socket.off('ticket_created', onTicketCreated);
      socket.off('ticket_updated', onTicketUpdated);
      socket.off('ticket_message', onTicketMessage);
    };
  }, [fetchAdminTickets]);

  // 2. Real-time active ticket thread socket room & 3.5s silent poll
  useEffect(() => {
    if (!selectedTicketId) return;

    socket.emit('join_ticket', selectedTicketId);
    if (selectedTicket?.ticketId && selectedTicket.ticketId !== selectedTicketId) {
      socket.emit('join_ticket', selectedTicket.ticketId);
    }

    const pollActive = setInterval(async () => {
      try {
        const { data: res } = await api.get(`/api/tickets/${selectedTicketId}`);
        if (res.success && res.data) {
          setSelectedTicket(res.data);
        }
      } catch {
        // silent
      }
    }, 3500);

    return () => {
      socket.emit('leave_ticket', selectedTicketId);
      if (selectedTicket?.ticketId && selectedTicket.ticketId !== selectedTicketId) {
        socket.emit('leave_ticket', selectedTicket.ticketId);
      }
      clearInterval(pollActive);
    };
  }, [selectedTicketId, selectedTicket?.ticketId]);

  const handleSelectTicket = (t) => {
    setSelectedTicketId(t._id || t.ticketId);
    setSelectedTicket(t);
    setReplyStatus(t.status === 'OPEN' ? 'IN_PROGRESS' : t.status);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAdminReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;

    setSendingReply(true);
    try {
      const { data: res } = await api.post(`/api/admin/tickets/${selectedTicket._id || selectedTicket.ticketId}/reply`, {
        message: replyText.trim(),
        status: replyStatus,
      });

      if (res.success && res.data) {
        setSelectedTicket(res.data);
        setReplyText('');
        setToast('Admin response sent');
        fetchAdminTickets(true);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        const newMsg = {
          _id: String(Date.now()),
          senderRole: 'admin',
          message: replyText.trim(),
          createdAt: new Date().toISOString(),
        };

        const updated = {
          ...selectedTicket,
          status: replyStatus,
          messages: [...(selectedTicket.messages || []), newMsg],
          lastActivityAt: new Date().toISOString(),
        };

        const list = getLocalTickets().map((t) => (t.ticketId === selectedTicket.ticketId ? updated : t));
        setLocalTickets(list);

        setSelectedTicket(updated);
        setReplyText('');
        setToast('Admin response sent (Local session updated)');
        fetchAdminTickets(true);
      } else {
        setToast(err.response?.data?.message || 'Failed to send admin response');
      }
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedTicket || selectedTicket.status === newStatus) return;

    try {
      const { data: res } = await api.patch(`/api/admin/tickets/${selectedTicket._id || selectedTicket.ticketId}/status`, {
        status: newStatus,
      });

      if (res.success && res.data) {
        setSelectedTicket(res.data);
        setToast(`Status updated to ${newStatus}`);
        fetchAdminTickets(true);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        const updated = { ...selectedTicket, status: newStatus, lastActivityAt: new Date().toISOString() };
        const list = getLocalTickets().map((t) => (t.ticketId === selectedTicket.ticketId ? updated : t));
        setLocalTickets(list);
        setSelectedTicket(updated);
        setToast(`Status updated to ${newStatus}`);
        fetchAdminTickets(true);
      } else {
        setToast(err.response?.data?.message || 'Failed to update status');
      }
    }
  };

  const handlePriorityChange = async (newPriority) => {
    if (!selectedTicket || selectedTicket.priority === newPriority) return;

    try {
      const { data: res } = await api.patch(`/api/admin/tickets/${selectedTicket._id || selectedTicket.ticketId}/status`, {
        priority: newPriority,
      });

      if (res.success && res.data) {
        setSelectedTicket(res.data);
        setToast(`Priority set to ${newPriority}`);
        fetchAdminTickets(true);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        const updated = { ...selectedTicket, priority: newPriority, lastActivityAt: new Date().toISOString() };
        const list = getLocalTickets().map((t) => (t.ticketId === selectedTicket.ticketId ? updated : t));
        setLocalTickets(list);
        setSelectedTicket(updated);
        setToast(`Priority set to ${newPriority}`);
        fetchAdminTickets(true);
      } else {
        setToast(err.response?.data?.message || 'Failed to update priority');
      }
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}

      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-r from-[#10352C] via-[#0B2720] to-[#071C18] p-5 shadow-card-gold">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#34D399]/40 bg-[#34D399]/15 text-[#34D399] shadow-[0_0_20px_rgba(52,211,153,0.25)]">
            <LifeBuoy className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white font-mono">
                Admin Support Desk
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-2.5 py-0.5 text-[10px] font-mono font-bold text-[#F1D78A]">
                Helpdesk Console
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[#91A89E]">
              Institutional member service desk: triage inquiries, send responses, and resolve account tickets.
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchAdminTickets(true)}
          className="flex items-center gap-1.5 rounded-xl border border-[#1E493B] bg-[#0B2720] px-3.5 py-2 text-xs font-mono font-semibold text-[#A7C4B8] hover:border-[#34D399]/50 hover:bg-[#164B3A] hover:text-[#ECFDF5] transition"
          title="Refresh support queue"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-[#34D399]' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* 2. Overview Stats Bar (4 Institutional KPI Tiles) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total Open */}
        <div className="rounded-2xl border border-blue-500/30 bg-[#0B2720] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-blue-300">Open Tickets</span>
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
          </div>
          <p className="mt-2 text-2xl font-black font-mono text-white">{stats.totalOpen}</p>
          <span className="text-[10px] font-mono text-[#718A7F]">Awaiting first response</span>
        </div>

        {/* Urgent Attention */}
        <div className="rounded-2xl border border-rose-500/35 bg-[#0B2720] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-rose-300">Urgent Priority</span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <p className="mt-2 text-2xl font-black font-mono text-rose-300">{stats.totalUrgent}</p>
          <span className="text-[10px] font-mono text-[#718A7F]">High SLA escalation</span>
        </div>

        {/* In Progress */}
        <div className="rounded-2xl border border-amber-500/30 bg-[#0B2720] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-amber-300">In Review</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-black font-mono text-white">{stats.totalInProgress}</p>
          <span className="text-[10px] font-mono text-[#718A7F]">Active discussions</span>
        </div>

        {/* Resolved */}
        <div className="rounded-2xl border border-[#34D399]/35 bg-[#0B2720] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-[#34D399]">Resolved Tickets</span>
            <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
          </div>
          <p className="mt-2 text-2xl font-black font-mono text-[#34D399]">{stats.totalResolved}</p>
          <span className="text-[10px] font-mono text-[#718A7F]">Successfully resolved</span>
        </div>
      </div>

      {/* 3. Split-View Inbox Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
        {/* Left Column: Ticket Queue (5 cols) */}
        <div className="lg:col-span-5 flex flex-col rounded-3xl border border-[#1E493B] bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-4 shadow-sm overflow-hidden">
          {/* Search & Status Filters */}
          <div className="space-y-3 pb-3 border-b border-[#1E493B]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#718A7F]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ticket, member email, ref..."
                className="w-full rounded-xl border border-[#1E493B] bg-[#071C18] py-2 pl-9 pr-3 text-xs font-mono text-white placeholder-[#718A7F] outline-none focus:border-[#34D399]"
              />
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
              {[
                { key: 'ALL', label: 'All' },
                { key: 'OPEN', label: 'Open' },
                { key: 'IN_PROGRESS', label: 'In Progress' },
                { key: 'RESOLVED', label: 'Resolved' },
                { key: 'CLOSED', label: 'Closed' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-mono font-semibold transition ${
                    statusFilter === key
                      ? 'border border-[#34D399]/50 bg-[#34D399]/20 text-[#34D399]'
                      : 'border border-transparent text-[#718A7F] hover:bg-[#164B3A] hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket Queue List */}
          <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <RefreshCw className="h-6 w-6 animate-spin text-[#34D399] mb-2" />
                <p className="text-xs font-mono text-[#718A7F]">Loading queue...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-14 px-4">
                <LifeBuoy className="h-8 w-8 text-[#1E493B] mx-auto mb-2" />
                <p className="text-xs font-mono font-bold text-white">No Tickets in Queue</p>
                <p className="text-[11px] font-mono text-[#718A7F] mt-1">No tickets match the selected filters.</p>
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = (t._id || t.ticketId) === selectedTicketId;
                const pri = PRIORITIES[t.priority] || PRIORITIES.MEDIUM;
                const stat = STATUSES[t.status] || STATUSES.OPEN;

                return (
                  <div
                    key={t._id || t.ticketId}
                    onClick={() => handleSelectTicket(t)}
                    className={`rounded-2xl border p-3.5 transition cursor-pointer ${
                      isSelected
                        ? 'border-[#D4AF37]/70 bg-gradient-to-r from-[#D4AF37]/15 to-transparent text-white shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                        : 'border-[#1E493B]/70 bg-[#071C18]/60 hover:bg-[#164B3A]/30 text-[#A7C4B8]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-[#34D399]">{t.ticketId}</span>
                        <span className={`rounded-md border px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase ${pri.badge}`}>
                          {pri.label}
                        </span>
                      </div>
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-mono font-bold ${stat.badge}`}>
                        {stat.label}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-white font-mono line-clamp-1">
                      {t.subject}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-[#718A7F]">
                      <span className="truncate max-w-[160px]">
                        {t.userId?.email || t.user?.email || 'Member'}
                      </span>
                      <span>{new Date(t.lastActivityAt || t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation & Member Dossier (7 cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-3xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-5 sm:p-6 shadow-card-gold overflow-hidden">
          {!selectedTicket ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <LifeBuoy className="h-12 w-12 text-[#1E493B] mb-3" />
              <p className="text-sm font-mono font-bold text-white">Select a Ticket from Queue</p>
              <p className="text-xs font-mono text-[#718A7F] mt-1 max-w-xs">
                Pick any inquiry from the left panel to review message history, inspect user details, and send responses.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Dossier Header */}
              <div className="border-b border-[#1E493B] pb-4 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold font-mono text-[#34D399]">
                        {selectedTicket.ticketId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedTicket.ticketId, selectedTicket.ticketId)}
                        className="text-[#718A7F] hover:text-[#34D399]"
                        title="Copy Ticket ID"
                      >
                        {copiedId === selectedTicket.ticketId ? (
                          <Check className="h-3.5 w-3.5 text-[#34D399]" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <span className="text-xs font-mono text-[#A7C4B8]">
                        ({CATEGORY_MAP[selectedTicket.category] || selectedTicket.category})
                      </span>
                    </div>
                    <h3 className="text-sm font-bold font-mono text-white mt-1">
                      {selectedTicket.subject}
                    </h3>
                  </div>

                  {/* Priority & Status Controls */}
                  <div className="flex items-center gap-2">
                    {/* Priority Selector */}
                    <select
                      value={selectedTicket.priority}
                      onChange={(e) => handlePriorityChange(e.target.value)}
                      className="rounded-xl border border-[#1E493B] bg-[#071C18] px-2.5 py-1.5 text-xs font-mono font-semibold text-white outline-none focus:border-[#34D399]"
                    >
                      {Object.keys(PRIORITIES).map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>

                    {/* Status Selector */}
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="rounded-xl border border-[#1E493B] bg-[#071C18] px-2.5 py-1.5 text-xs font-mono font-semibold text-white outline-none focus:border-[#34D399]"
                    >
                      {Object.keys(STATUSES).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Member Identity Strip */}
                <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-[#1E493B] bg-[#071C18]/80 px-3 py-2 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-[#34D399]" />
                    <span className="text-white font-semibold">
                      {selectedTicket.userId?.email || selectedTicket.user?.email || '(unknown member)'}
                    </span>
                  </div>
                  <div className="text-[#A7C4B8]">
                    Ref: <span className="text-[#34D399] font-bold">{selectedTicket.userId?.referralCode || selectedTicket.user?.referralCode || '-'}</span>
                  </div>
                  {selectedTicket.userId?._id && (
                    <button
                      onClick={() => window.open(`/admin/member/${selectedTicket.userId._id}`, '_blank')}
                      className="ml-auto flex items-center gap-1 text-[11px] text-[#34D399] hover:underline"
                    >
                      <span>Member Dossier</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Thread Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
                {(selectedTicket.messages || []).map((msg, i) => {
                  const isAdmin = msg.senderRole === 'admin';
                  return (
                    <div
                      key={msg._id || i}
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] font-mono text-[#718A7F]">
                        {isAdmin ? (
                          <span className="flex items-center gap-1 font-bold text-[#F1D78A]">
                            <ShieldCheck className="h-3 w-3 text-[#D4AF37]" />
                            <span>You (Support Admin)</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 font-semibold text-[#34D399]">
                            <UserCheck className="h-3 w-3" />
                            <span>Member</span>
                          </span>
                        )}
                        <span>•</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div
                        className={`max-w-[85%] rounded-2xl p-4 text-xs font-mono shadow-md ${
                          isAdmin
                            ? 'border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] text-[#ECFDF5]'
                            : 'border border-[#34D399]/40 bg-[#164B3A] text-white shadow-[0_0_15px_rgba(52,211,153,0.1)]'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Canned Responses */}
              <div className="border-t border-[#1E493B] pt-3 mb-3">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-[#718A7F] mb-1.5 flex items-center gap-1">
                  <Zap className="h-3 w-3 text-[#D4AF37]" />
                  <span>Quick Canned Responses:</span>
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
                  {CANNED_RESPONSES.map((cr, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReplyText(cr)}
                      className="whitespace-nowrap rounded-lg border border-[#1E493B] bg-[#071C18] px-2.5 py-1 text-[10px] font-mono text-[#A7C4B8] hover:border-[#34D399]/40 hover:text-white transition"
                    >
                      {cr.slice(0, 32)}…
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Reply Composer */}
              <div className="rounded-2xl border border-[#1E493B] bg-[#071C18] p-3 space-y-2">
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type official admin response..."
                  className="w-full bg-transparent text-xs font-mono text-white placeholder-[#718A7F] outline-none resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAdminReply();
                    }
                  }}
                />

                <div className="flex items-center justify-between pt-2 border-t border-[#1E493B]/60">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#718A7F]">Update to:</span>
                    <select
                      value={replyStatus}
                      onChange={(e) => setReplyStatus(e.target.value)}
                      className="rounded-lg border border-[#1E493B] bg-[#0B2720] px-2 py-1 text-[11px] font-mono text-white outline-none"
                    >
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>

                  <button
                    onClick={handleAdminReply}
                    disabled={sendingReply || !replyText.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-[#34D399] px-4 py-2 text-xs font-mono font-bold text-[#071C18] hover:bg-[#6EE7B7] disabled:opacity-50 transition shadow-sm"
                  >
                    {sendingReply ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    <span>Send Admin Response</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

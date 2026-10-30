import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  LifeBuoy, Plus, Search, MessageSquare, Clock, CheckCircle2,
  AlertCircle, AlertTriangle, ShieldCheck, ArrowUpRight, Copy, Check,
  ChevronRight, X, Send, Filter, RefreshCw, UserCheck, Sparkles
} from 'lucide-react';
import api from '../lib/api.js';
import socket from '../lib/socket.js';
import Toast from '../components/Toast.jsx';

const CATEGORIES = [
  { value: 'DEPOSIT_ISSUE', label: 'Deposit Issue', desc: 'USDT on-chain deposit not credited' },
  { value: 'WITHDRAWAL_QUERY', label: 'Withdrawal Query', desc: 'Pending or delayed withdrawal request' },
  { value: 'STAKING_REWARDS', label: 'Staking Rewards', desc: 'Daily yield accrual & 100% cap inquiries' },
  { value: 'REFERRAL_TREE', label: 'Referral Tree', desc: 'Downline commissions & sponsor tracking' },
  { value: 'SECURITY_2FA', label: 'Security & 2FA', desc: 'Password reset, OTP & email security' },
  { value: 'GENERAL_INQUIRY', label: 'General Inquiry', desc: 'Platform mechanics & account questions' },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

const PRIORITIES = [
  { value: 'LOW', label: 'Low', badge: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' },
  { value: 'MEDIUM', label: 'Medium', badge: 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#F1D78A]' },
  { value: 'HIGH', label: 'High', badge: 'bg-amber-500/15 border-amber-500/40 text-amber-300' },
  { value: 'URGENT', label: 'Urgent', badge: 'bg-rose-500/15 border-rose-500/40 text-rose-300' },
];

const STATUSES = {
  OPEN: { label: 'Open', badge: 'bg-blue-500/15 border-blue-500/40 text-blue-300' },
  IN_PROGRESS: { label: 'In Progress', badge: 'bg-amber-500/15 border-amber-500/40 text-amber-300' },
  RESOLVED: { label: 'Resolved', badge: 'bg-[#34D399]/15 border-[#34D399]/40 text-[#34D399]' },
  CLOSED: { label: 'Closed', badge: 'bg-slate-500/15 border-slate-500/40 text-slate-300' },
};

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

export default function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // New Ticket Form
  const [form, setForm] = useState({
    subject: '',
    category: 'DEPOSIT_ISSUE',
    priority: 'MEDIUM',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Reply state
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const chatEndRef = useRef(null);
  const activeTicketRef = useRef(activeTicket);
  useEffect(() => {
    activeTicketRef.current = activeTicket;
  }, [activeTicket]);

  useEffect(() => {
    if (activeTicket?.messages) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTicket?.messages?.length]);

  const fetchTickets = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const { data: res } = await api.get('/api/tickets/my-tickets', {
        params: {
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
          search: search.trim() || undefined,
        },
      });

      if (res.success && res.data) {
        const list = res.data.tickets || [];
        setTickets(list);
        if (res.data.stats) setStats(res.data.stats);

        // Keep activeTicket in sync with the fetched list if open
        if (activeTicketRef.current) {
          const matched = list.find(
            (t) => t.ticketId === activeTicketRef.current.ticketId || t._id === activeTicketRef.current._id
          );
          if (matched && matched.lastActivityAt !== activeTicketRef.current.lastActivityAt) {
            setActiveTicket(matched);
          }
        }
        return;
      }
    } catch (err) {
      // Graceful local fallback if endpoint is not deployed yet on remote host (404)
      if (err.response?.status === 404) {
        let local = getLocalTickets();
        if (statusFilter !== 'ALL') local = local.filter((t) => t.status === statusFilter);
        if (categoryFilter !== 'ALL') local = local.filter((t) => t.category === categoryFilter);
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          local = local.filter((t) => t.ticketId.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q));
        }

        const all = getLocalTickets();
        const calculatedStats = {
          total: all.length,
          open: all.filter((t) => t.status === 'OPEN').length,
          inProgress: all.filter((t) => t.status === 'IN_PROGRESS').length,
          resolved: all.filter((t) => t.status === 'RESOLVED').length,
          closed: all.filter((t) => t.status === 'CLOSED').length,
        };

        setTickets(local);
        setStats(calculatedStats);
        return;
      }

      console.error('Failed to load tickets:', err);
      setToast(err.response?.data?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, categoryFilter, search]);

  // 1. Silent periodic polling for ticket list (every 6s) + socket listener
  useEffect(() => {
    fetchTickets();

    const interval = setInterval(() => {
      fetchTickets(true);
    }, 6000);

    const onListUpdate = () => fetchTickets(true);
    socket.on('ticket_list_updated', onListUpdate);

    return () => {
      clearInterval(interval);
      socket.off('ticket_list_updated', onListUpdate);
    };
  }, [fetchTickets]);

  // 2. Real-time sync for active ticket thread (WebSocket room + 3.5s silent poll)
  useEffect(() => {
    if (!activeTicket) return;

    const ticketId = activeTicket.ticketId;
    const rawId = activeTicket._id;

    socket.emit('join_ticket', ticketId);
    if (rawId && rawId !== ticketId) socket.emit('join_ticket', rawId);

    const onTicketMessage = (payload) => {
      if (payload?.ticketId === ticketId || payload?.ticket?._id === rawId || payload?.ticket?.ticketId === ticketId) {
        setActiveTicket(payload.ticket);
        fetchTickets(true);
      }
    };

    const onStatusChanged = (payload) => {
      if (payload?.ticketId === ticketId || payload?.ticket?._id === rawId || payload?.ticket?.ticketId === ticketId) {
        if (payload.ticket) {
          setActiveTicket(payload.ticket);
        } else {
          setActiveTicket((prev) => (prev ? { ...prev, status: payload.status, priority: payload.priority || prev.priority } : prev));
        }
        fetchTickets(true);
      }
    };

    socket.on('ticket_message', onTicketMessage);
    socket.on('ticket_status_changed', onStatusChanged);

    // High frequency fallback poll while drawer is open
    const threadInterval = setInterval(async () => {
      try {
        const { data: res } = await api.get(`/api/tickets/${rawId || ticketId}`);
        if (res.success && res.data) {
          setActiveTicket(res.data);
        }
      } catch {
        // silent
      }
    }, 3500);

    return () => {
      socket.emit('leave_ticket', ticketId);
      if (rawId && rawId !== ticketId) socket.emit('leave_ticket', rawId);
      socket.off('ticket_message', onTicketMessage);
      socket.off('ticket_status_changed', onStatusChanged);
      clearInterval(threadInterval);
    };
  }, [activeTicket?.ticketId, activeTicket?._id, fetchTickets]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!form.subject.trim()) {
      setToast('Please enter a ticket subject');
      return;
    }
    if (!form.message.trim()) {
      setToast('Please enter your inquiry details');
      return;
    }

    setSubmitting(true);
    try {
      const { data: res } = await api.post('/api/tickets/create', form);
      if (res.success) {
        setToast('Support ticket opened successfully');
        setIsCreateOpen(false);
        setForm({ subject: '', category: 'DEPOSIT_ISSUE', priority: 'MEDIUM', message: '' });
        fetchTickets(true);
        if (res.data) {
          setActiveTicket(res.data);
        }
      }
    } catch (err) {
      // Local fallback creation if backend 404
      if (err.response?.status === 404) {
        const fakeId = `TK-${Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase()}`;
        const newDoc = {
          _id: String(Date.now()),
          ticketId: fakeId,
          subject: form.subject.trim(),
          category: form.category,
          priority: form.priority,
          status: 'OPEN',
          messages: [
            {
              _id: String(Date.now()),
              senderRole: 'member',
              message: form.message.trim(),
              createdAt: new Date().toISOString(),
            },
          ],
          lastActivityAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };

        const existing = getLocalTickets();
        setLocalTickets([newDoc, ...existing]);

        setToast('Support ticket created (Local session synced)');
        setIsCreateOpen(false);
        setForm({ subject: '', category: 'DEPOSIT_ISSUE', priority: 'MEDIUM', message: '' });
        fetchTickets(true);
        setActiveTicket(newDoc);
      } else {
        setToast(err.response?.data?.message || 'Failed to submit ticket');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeTicket) return;

    setSendingReply(true);
    try {
      const { data: res } = await api.post(`/api/tickets/${activeTicket._id || activeTicket.ticketId}/reply`, {
        message: replyText.trim(),
      });

      if (res.success && res.data) {
        setActiveTicket(res.data);
        setReplyText('');
        fetchTickets(true);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        const newMessage = {
          _id: String(Date.now()),
          senderRole: 'member',
          message: replyText.trim(),
          createdAt: new Date().toISOString(),
        };

        const updatedTicket = {
          ...activeTicket,
          status: activeTicket.status === 'RESOLVED' ? 'IN_PROGRESS' : activeTicket.status,
          messages: [...(activeTicket.messages || []), newMessage],
          lastActivityAt: new Date().toISOString(),
        };

        const list = getLocalTickets().map((t) => (t.ticketId === activeTicket.ticketId ? updatedTicket : t));
        setLocalTickets(list);

        setActiveTicket(updatedTicket);
        setReplyText('');
        fetchTickets(true);
      } else {
        setToast(err.response?.data?.message || 'Failed to send reply');
      }
    } finally {
      setSendingReply(false);
    }
  };

  const handleMarkResolved = async () => {
    if (!activeTicket) return;
    try {
      const { data: res } = await api.patch(`/api/tickets/${activeTicket._id || activeTicket.ticketId}/resolve`);
      if (res.success) {
        setActiveTicket({ ...activeTicket, status: 'RESOLVED' });
        setToast('Ticket marked as resolved');
        fetchTickets(true);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        const updated = { ...activeTicket, status: 'RESOLVED', lastActivityAt: new Date().toISOString() };
        const list = getLocalTickets().map((t) => (t.ticketId === activeTicket.ticketId ? updated : t));
        setLocalTickets(list);
        setActiveTicket(updated);
        setToast('Ticket marked as resolved');
        fetchTickets(true);
      } else {
        setToast(err.response?.data?.message || 'Failed to update ticket');
      }
    }
  };

  return (
    <div className="w-full px-4 py-8 sm:px-6 lg:px-8 text-[#ECFDF5] space-y-6">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}

      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-r from-[#10352C] via-[#0B2720] to-[#071C18] p-5 shadow-card-gold">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#34D399]/40 bg-[#34D399]/15 text-[#34D399] shadow-[0_0_20px_rgba(52,211,153,0.25)]">
            <LifeBuoy className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-mono">
                Helpdesk & Member Support
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#34D399]/40 bg-[#34D399]/15 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase text-[#34D399]">
                24/7 SLA
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[#91A89E]">
              Submit inquiries regarding USDT deposits, daily staking rewards, capital unlocks, or referral commissions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTickets(true)}
            className="flex items-center gap-1.5 rounded-xl border border-[#1E493B] bg-[#0B2720] px-3 py-2 text-xs font-mono font-semibold text-[#A7C4B8] hover:border-[#34D399]/50 hover:bg-[#164B3A] hover:text-[#ECFDF5] transition"
            title="Refresh tickets"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-[#34D399]' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[#34D399] px-4 py-2 text-xs font-mono font-bold text-[#071C18] shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:bg-[#6EE7B7] hover:shadow-[0_0_30px_rgba(52,211,153,0.5)] transition"
          >
            <Plus className="h-4 w-4" />
            <span>Open New Ticket</span>
          </button>
        </div>
      </div>

      {/* 2. Stats Bar (3 Glass Cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Card 1: Active Tickets */}
        <div className="rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-4 shadow-card-gold transition hover:border-[#D4AF37]/70">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F1D78A]">Active Inquiries</span>
            <MessageSquare className="h-4 w-4 text-[#D4AF37]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <p className="text-2xl font-black font-mono text-gold-gradient tracking-tight">
              {stats.open + stats.inProgress}
            </p>
            <span className="text-[10px] font-mono text-[#D4AF37]">Tickets</span>
          </div>
          <p className="mt-1 text-[11px] font-mono text-[#A7C4B8]">
            {stats.open} Open • {stats.inProgress} In Review
          </p>
        </div>

        {/* Card 2: Awaiting Staff Response */}
        <div className="rounded-2xl border border-[#34D399]/35 bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-4 shadow-card-soft transition hover:border-[#34D399]/70">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#34D399]">Awaiting Staff Response</span>
            <Clock className="h-4 w-4 text-[#34D399]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <p className="text-2xl font-black font-mono text-white tracking-tight">
              {stats.open}
            </p>
            <span className="text-[10px] font-mono text-[#34D399]">Queued</span>
          </div>
          <p className="mt-1 text-[11px] font-mono text-[#A7C4B8]">Average response time &lt; 2 hours</p>
        </div>

        {/* Card 3: Resolved Tickets */}
        <div className="rounded-2xl border border-[#1E493B] bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-4 transition hover:border-[#34D399]/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#91A89E]">Resolved Tickets</span>
            <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <p className="text-2xl font-black font-mono text-[#34D399] tracking-tight">
              {stats.resolved + stats.closed}
            </p>
            <span className="text-[10px] font-mono text-[#91A89E]">Completed</span>
          </div>
          <p className="mt-1 text-[11px] font-mono text-[#A7C4B8]">
            {stats.total > 0 ? Math.round(((stats.resolved + stats.closed) / stats.total) * 100) : 100}% Resolution Rate
          </p>
        </div>
      </div>

      {/* 3. Filter & Search Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between rounded-2xl border border-[#1E493B] bg-[#0B2720] p-3 sm:p-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 lg:pb-0">
          {[
            { key: 'ALL', label: 'All Tickets' },
            { key: 'OPEN', label: 'Open' },
            { key: 'IN_PROGRESS', label: 'In Progress' },
            { key: 'RESOLVED', label: 'Resolved' },
            { key: 'CLOSED', label: 'Closed' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-mono font-semibold transition ${
                statusFilter === key
                  ? 'border border-[#34D399]/50 bg-[#34D399]/15 text-[#34D399] shadow-sm'
                  : 'border border-transparent text-[#A7C4B8] hover:bg-[#164B3A] hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto rounded-xl border border-[#1E493B] bg-[#071C18] px-3 py-1.5 text-xs font-mono text-[#ECFDF5] outline-none focus:border-[#34D399]"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#718A7F]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID or subject..."
              className="w-full rounded-xl border border-[#1E493B] bg-[#071C18] py-1.5 pl-9 pr-3 text-xs font-mono text-white placeholder-[#718A7F] outline-none focus:border-[#34D399]"
            />
          </div>
        </div>
      </div>

      {/* 4. Tickets Table & Card List */}
      <section className="overflow-hidden rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] shadow-card-gold transition hover:border-[#D4AF37]/60">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-[#34D399] mb-3" />
            <p className="text-xs font-mono text-[#91A89E]">Loading your support tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <LifeBuoy className="h-12 w-12 text-[#1E493B] mb-3" />
            <p className="text-sm font-mono font-bold text-white">No Support Tickets Found</p>
            <p className="mt-1 text-xs font-mono text-[#718A7F] max-w-sm">
              You haven't submitted any inquiries yet or no tickets match your current filters.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-4 flex items-center gap-1.5 rounded-xl bg-[#34D399] px-4 py-2 text-xs font-mono font-bold text-[#071C18] hover:bg-[#6EE7B7] transition shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Open First Ticket</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-[#0B2720]/80 border-b border-[#1E493B] text-[10px] text-[#718A7F] uppercase tracking-wider">
                  <th className="px-5 py-3.5 font-medium">Ticket ID</th>
                  <th className="px-5 py-3.5 font-medium">Subject & Category</th>
                  <th className="px-5 py-3.5 font-medium">Priority</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 font-medium">Messages</th>
                  <th className="px-5 py-3.5 font-medium">Last Activity</th>
                  <th className="px-5 py-3.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E493B]">
                {tickets.map((t) => {
                  const pri = PRIORITIES.find((p) => p.value === t.priority) || PRIORITIES[1];
                  const stat = STATUSES[t.status] || STATUSES.OPEN;
                  const msgCount = t.messages?.length || 1;

                  return (
                    <tr
                      key={t._id || t.ticketId}
                      className="text-[#ECFDF5] hover:bg-[#164B3A]/30 transition group cursor-pointer"
                      onClick={() => setActiveTicket(t)}
                    >
                      {/* Ticket ID */}
                      <td className="px-5 py-3.5 font-bold text-[#34D399] whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <span>{t.ticketId}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(t.ticketId, t.ticketId);
                            }}
                            className="text-[#718A7F] hover:text-[#34D399] transition"
                            title="Copy Ticket ID"
                          >
                            {copiedId === t.ticketId ? <Check className="h-3 w-3 text-[#34D399]" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </span>
                      </td>

                      {/* Subject & Category */}
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-white group-hover:text-[#34D399] transition line-clamp-1">
                          {t.subject}
                        </p>
                        <span className="inline-block mt-0.5 text-[10px] text-[#A7C4B8]">
                          {CATEGORY_MAP[t.category] || t.category}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${pri.badge}`}>
                          {pri.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${stat.badge}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {stat.label}
                        </span>
                      </td>

                      {/* Messages count */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-[#A7C4B8]">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3 text-[#718A7F]" />
                          <span>{msgCount} turn{msgCount === 1 ? '' : 's'}</span>
                        </span>
                      </td>

                      {/* Last Activity */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-[#718A7F]">
                        {new Date(t.lastActivityAt || t.createdAt).toLocaleString()}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-lg border border-[#1E493B] bg-[#0B2720] px-2.5 py-1 text-xs text-[#34D399] group-hover:border-[#34D399]/40 group-hover:bg-[#164B3A] transition"
                        >
                          <span>View Thread</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 5. Create Ticket Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071C18]/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-[#D4AF37]/40 bg-[#0B2720] p-6 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-[#1E493B] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <LifeBuoy className="h-5 w-5 text-[#34D399]" />
                <h3 className="text-base font-bold font-mono text-white">Open Support Ticket</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1 text-[#A7C4B8] hover:bg-[#164B3A] hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs font-mono">
              {/* Category */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#A7C4B8] mb-1.5">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl border border-[#1E493B] bg-[#071C18] p-2.5 text-xs text-white outline-none focus:border-[#34D399]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label} ({c.desc})
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#A7C4B8] mb-1.5">
                  Priority
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setForm({ ...form, priority: p.value })}
                      className={`rounded-xl border py-2 text-center text-xs font-bold transition ${
                        form.priority === p.value
                          ? `${p.badge} ring-1 ring-current`
                          : 'border-[#1E493B] bg-[#071C18] text-[#718A7F] hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#A7C4B8] mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="e.g., USDT deposit confirmation delay"
                  className="w-full rounded-xl border border-[#1E493B] bg-[#071C18] p-2.5 text-xs text-white placeholder-[#718A7F] outline-none focus:border-[#34D399]"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#A7C4B8] mb-1.5">
                  Inquiry Details
                </label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Provide transaction hashes, wallet addresses, or specific error details to expedite support..."
                  className="w-full rounded-xl border border-[#1E493B] bg-[#071C18] p-2.5 text-xs text-white placeholder-[#718A7F] outline-none focus:border-[#34D399] resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E493B]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border border-[#1E493B] bg-[#071C18] px-4 py-2 text-xs font-semibold text-[#A7C4B8] hover:bg-[#10352C] hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-xl bg-[#34D399] px-5 py-2 text-xs font-bold text-[#071C18] hover:bg-[#6EE7B7] disabled:opacity-50 transition shadow-sm"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Ticket</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Threaded Conversation Drawer / Modal */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071C18]/85 p-3 sm:p-6 backdrop-blur-md">
          <div className="flex flex-col h-[90vh] w-full max-w-3xl rounded-3xl border border-[#D4AF37]/40 bg-[#0B2720] shadow-2xl backdrop-blur-2xl overflow-hidden">
            {/* Thread Header */}
            <div className="flex items-center justify-between border-b border-[#1E493B] bg-[#071C18]/90 px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-mono text-[#34D399]">{activeTicket.ticketId}</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                      PRIORITIES.find((p) => p.value === activeTicket.priority)?.badge || ''
                    }`}
                  >
                    {activeTicket.priority}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-mono font-bold ${
                      STATUSES[activeTicket.status]?.badge || ''
                    }`}
                  >
                    {STATUSES[activeTicket.status]?.label || activeTicket.status}
                  </span>
                </div>
                <h3 className="mt-1 text-sm font-bold font-mono text-white truncate max-w-lg">
                  {activeTicket.subject}
                </h3>
                <p className="text-[11px] font-mono text-[#718A7F]">
                  Category: {CATEGORY_MAP[activeTicket.category] || activeTicket.category}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {activeTicket.status !== 'RESOLVED' && activeTicket.status !== 'CLOSED' && (
                  <button
                    onClick={handleMarkResolved}
                    className="flex items-center gap-1 rounded-xl border border-[#34D399]/40 bg-[#34D399]/10 px-3 py-1.5 text-xs font-mono font-bold text-[#34D399] hover:bg-[#34D399]/20 transition"
                    title="Mark ticket as resolved"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Mark Resolved</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveTicket(null)}
                  className="rounded-lg p-1.5 text-[#A7C4B8] hover:bg-[#164B3A] hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages Chat Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-[#071C18]/40 to-[#0B2720]/80">
              {(activeTicket.messages || []).map((msg, i) => {
                const isAdmin = msg.senderRole === 'admin';
                return (
                  <div
                    key={msg._id || i}
                    className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] font-mono text-[#718A7F]">
                      {isAdmin ? (
                        <span className="flex items-center gap-1 font-bold text-[#F1D78A]">
                          <ShieldCheck className="h-3 w-3 text-[#D4AF37]" />
                          <span>QNDX Support Specialist</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-semibold text-[#34D399]">
                          <UserCheck className="h-3 w-3" />
                          <span>You (Member)</span>
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

            {/* Reply Composer */}
            <div className="border-t border-[#1E493B] bg-[#071C18] p-4">
              {activeTicket.status === 'CLOSED' ? (
                <p className="text-center text-xs font-mono text-[#718A7F] py-2">
                  This support ticket is closed. Please open a new ticket if you require further assistance.
                </p>
              ) : (
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your message reply..."
                    className="flex-1 rounded-2xl border border-[#1E493B] bg-[#0B2720] p-3 text-xs font-mono text-white placeholder-[#718A7F] outline-none focus:border-[#34D399] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyText.trim()}
                    className="flex items-center justify-center gap-1.5 self-end rounded-2xl bg-[#34D399] px-5 py-3 text-xs font-mono font-bold text-[#071C18] hover:bg-[#6EE7B7] disabled:opacity-50 transition shadow-sm"
                  >
                    {sendingReply ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span className="hidden sm:inline">Reply</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

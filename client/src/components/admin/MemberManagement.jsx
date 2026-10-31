import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, ShieldAlert, ShieldCheck, UserCheck, UserX, AlertTriangle,
  X, Check, Loader2, LogIn, ExternalLink, Search, Filter, Ban,
  MailCheck, MailX, Wallet, Copy, Lock, AlertCircle
} from 'lucide-react';
import api from '../../lib/api.js';
import { ADMIN_ROUTES } from '../../lib/adminConfig.js';

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });

const PRESET_REASONS = [
  { label: 'Referral Fraud', text: 'Fraudulent referral tree downline manipulation' },
  { label: 'Sybil / Multi-Acc', text: 'Multi-account sybil abuse & duplicate registrations' },
  { label: 'Suspicious Velocity', text: 'Suspicious on-chain deposit velocity / wash trading' },
  { label: 'Security Flag', text: 'Identity dispute or security audit flag' },
  { label: 'Compliance Freeze', text: 'Direct administrative compliance freeze' },
];

export default function MemberManagement({
  members = [],
  onUpdateMember,
  onImpersonate,
  impersonateLoading = '',
  onToast,
}) {
  const navigate = useNavigate();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | ACTIVE | BANNED | SUSPENDED

  // Modal states
  const [banModalTarget, setBanModalTarget] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [banSubmitting, setBanSubmitting] = useState(false);
  const [banError, setBanError] = useState('');

  const [unbanModalTarget, setUnbanModalTarget] = useState(null);
  const [unbanSubmitting, setUnbanSubmitting] = useState(false);

  const [copiedWallet, setCopiedWallet] = useState('');

  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedWallet(id);
      setTimeout(() => setCopiedWallet(''), 2000);
    } catch {}
  };

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return (members || []).filter((m) => {
      // Status filter
      const currentStatus = m.status || 'ACTIVE';
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'BANNED' && currentStatus !== 'BANNED' && currentStatus !== 'SUSPENDED') return false;
        if (statusFilter === 'ACTIVE' && currentStatus !== 'ACTIVE') return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const emailMatch = m.email?.toLowerCase().includes(q);
        const refMatch = m.referralCode?.toLowerCase().includes(q);
        const sponsorMatch = m.sponsorCode?.toLowerCase().includes(q);
        const idMatch = String(m.userId || m._id).toLowerCase().includes(q);
        return emailMatch || refMatch || sponsorMatch || idMatch;
      }

      return true;
    });
  }, [members, statusFilter, searchTerm]);

  // Open Ban Modal
  const openBanModal = (member, e) => {
    if (e) e.stopPropagation();
    setBanModalTarget(member);
    setBanReason(PRESET_REASONS[0].text);
    setBanError('');
  };

  // Open Unban Modal
  const openUnbanModal = (member, e) => {
    if (e) e.stopPropagation();
    setUnbanModalTarget(member);
  };

  // Submit Ban Action
  const handleConfirmBan = async () => {
    if (!banModalTarget) return;
    if (!banReason.trim()) {
      setBanError('Please provide a specific suspension reason.');
      return;
    }

    setBanSubmitting(true);
    setBanError('');

    try {
      const targetId = banModalTarget.userId || banModalTarget._id;
      const { data: res } = await api.patch(`/api/admin/users/${targetId}/status`, {
        status: 'BANNED',
        reason: banReason.trim(),
      });

      if (res.success) {
        const updated = res.data?.user || { ...banModalTarget, status: 'BANNED', banReason: banReason.trim() };
        if (onUpdateMember) {
          onUpdateMember(targetId, updated);
        }
        if (onToast) {
          onToast(`⛔ Account ${banModalTarget.email} has been frozen and banned.`);
        }
        setBanModalTarget(null);
      }
    } catch (err) {
      setBanError(err.response?.data?.message || 'Failed to freeze account. Please try again.');
    } finally {
      setBanSubmitting(false);
    }
  };

  // Submit Unban Action
  const handleConfirmUnban = async () => {
    if (!unbanModalTarget) return;

    setUnbanSubmitting(true);
    try {
      const targetId = unbanModalTarget.userId || unbanModalTarget._id;
      const { data: res } = await api.patch(`/api/admin/users/${targetId}/status`, {
        status: 'ACTIVE',
      });

      if (res.success) {
        const updated = res.data?.user || { ...unbanModalTarget, status: 'ACTIVE', banReason: null };
        if (onUpdateMember) {
          onUpdateMember(targetId, updated);
        }
        if (onToast) {
          onToast(`✅ Member ${unbanModalTarget.email} has been unbanned and restored to ACTIVE.`);
        }
        setUnbanModalTarget(null);
      }
    } catch (err) {
      if (onToast) {
        onToast(err.response?.data?.message || 'Failed to lift ban');
      }
    } finally {
      setUnbanSubmitting(false);
    }
  };

  const totalMembers = members.length;
  const bannedCount = members.filter((m) => m.status === 'BANNED' || m.status === 'SUSPENDED').length;
  const activeCount = totalMembers - bannedCount;

  return (
    <div className="space-y-6">
      {/* Header & Stats Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-mono tracking-tight text-white flex items-center gap-2.5">
            <Users className="h-6 w-6 text-[#34D399]" />
            <span>Member Management & Account Moderation</span>
          </h2>
          <p className="mt-1 text-sm text-[#A7B8AE] font-mono">
            Full compliance control: freeze malicious accounts, block custodial withdrawals, and bypass yield accruals.
          </p>
        </div>

        {/* Quick Counts */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="rounded-2xl border border-[#34D399]/30 bg-[#0B2720] px-3.5 py-2 text-white">
            <span className="text-[#A7B8AE] mr-2">Active:</span>
            <strong className="text-[#34D399] font-bold">{activeCount}</strong>
          </div>
          <div className="rounded-2xl border border-rose-500/40 bg-[#1A0A0E] px-3.5 py-2 text-white">
            <span className="text-[#A7B8AE] mr-2">Frozen/Banned:</span>
            <strong className="text-rose-400 font-bold">{bannedCount}</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-[#1E493B] bg-[#071C18] p-3 font-mono text-xs">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718A7F]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search member by email, referral code, sponsor, or user ID..."
            className="w-full rounded-xl border border-[#164336] bg-[#0B2720] py-2 pl-10 pr-4 text-xs text-white placeholder-[#718A7F] outline-none transition focus:border-[#34D399]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718A7F] hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 rounded-xl border border-[#164336] bg-[#0B2720] p-1">
          {[
            { id: 'ALL', label: `All (${totalMembers})` },
            { id: 'ACTIVE', label: `Active (${activeCount})` },
            { id: 'BANNED', label: `Banned (${bannedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-lg px-3 py-1.5 font-bold transition ${
                statusFilter === tab.id
                  ? tab.id === 'BANNED'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-[#34D399] text-[#020B08] shadow-sm'
                  : 'text-[#A7B8AE] hover:text-white hover:bg-[#10352C]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Member Management Table */}
      <section className="overflow-hidden rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#041A14] shadow-card-gold backdrop-blur-xl">
        {filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 font-mono text-center">
            <Users className="mb-4 h-12 w-12 text-[#1E493B]" />
            <p className="text-sm font-semibold text-white">No members matched the filter</p>
            <p className="mt-1 text-xs text-[#A7B8AE]">Try clearing your search query or selecting a different status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm font-mono">
              <thead>
                <tr className="border-b border-[#1E493B] bg-[#0B2720]/90 text-[11px] uppercase tracking-wider text-[#A7B8AE]">
                  <th className="px-5 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 font-bold">Email</th>
                  <th className="px-5 py-3.5 font-bold">Referral Code</th>
                  <th className="px-5 py-3.5 font-bold">Sponsor</th>
                  <th className="px-5 py-3.5 font-bold">Deposited</th>
                  <th className="px-5 py-3.5 font-bold">Staked</th>
                  <th className="px-5 py-3.5 font-bold">Available</th>
                  <th className="px-5 py-3.5 font-bold">Joined</th>
                  <th className="px-5 py-3.5 font-bold text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E493B]/70">
                {filteredMembers.map((m) => {
                  const isBanned = m.status === 'BANNED' || m.status === 'SUSPENDED';

                  return (
                    <tr
                      key={m.userId || m._id}
                      onClick={() => navigate(ADMIN_ROUTES.MEMBER_DETAIL(m.userId || m._id))}
                      className={`cursor-pointer transition-colors ${
                        isBanned
                          ? 'bg-rose-950/20 hover:bg-rose-950/30 border-l-2 border-l-rose-500'
                          : 'hover:bg-[#164B3A]/40'
                      }`}
                      title="Click to view detailed member audit & balances"
                    >
                      {/* Status Column */}
                      <td className="px-5 py-3.5">
                        {isBanned ? (
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/50 bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-bold text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
                            <Ban className="h-3 w-3 animate-pulse text-rose-400" />
                            <span>BANNED</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#34D399]/40 bg-[#34D399]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#34D399] shadow-[0_0_12px_rgba(52,211,153,0.25)]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#34D399] animate-pulse" />
                            <span>ACTIVE</span>
                          </div>
                        )}
                      </td>

                      {/* Member Email */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-white truncate max-w-[200px]">
                            {m.email}
                          </span>
                          {isBanned && m.banReason && (
                            <span className="text-[10px] text-rose-400/90 truncate max-w-[200px]" title={m.banReason}>
                              Reason: {m.banReason}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Referral Code */}
                      <td className="px-5 py-3.5 text-xs text-[#34D399] font-bold font-mono">
                        {m.referralCode}
                      </td>

                      {/* Sponsor */}
                      <td className="px-5 py-3.5 text-xs text-[#A7C4B8] font-mono">
                        {m.sponsorCode || 'Direct (Root)'}
                      </td>

                      {/* Deposited */}
                      <td className="px-5 py-3.5 text-xs text-white">
                        {fmt(m.totalDeposited)} USDT
                      </td>

                      {/* Staked */}
                      <td className="px-5 py-3.5 text-xs text-[#F1D78A]">
                        {fmt(m.staked)} USDT
                      </td>

                      {/* Available Balance */}
                      <td className="px-5 py-3.5 text-xs font-bold text-[#34D399]">
                        {fmt(m.availableBalance)} USDT
                      </td>

                      {/* Joined Date */}
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-[#91A89E]">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {/* Ban / Lift Ban Button */}
                          {isBanned ? (
                            <button
                              onClick={(e) => openUnbanModal(m, e)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-[#34D399]/50 bg-[#34D399]/15 px-2.5 py-1 text-xs font-bold text-[#34D399] transition hover:bg-[#34D399]/30 hover:border-[#34D399] shadow-sm"
                              title="Lift suspension and restore account features"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              <span>Lift Ban</span>
                            </button>
                          ) : (
                            <button
                              onClick={(e) => openBanModal(m, e)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/50 bg-rose-500/15 px-2.5 py-1 text-xs font-bold text-rose-400 transition hover:bg-rose-500/25 hover:border-rose-400 shadow-sm"
                              title="Freeze account: block withdrawals, deposits, and daily yield"
                            >
                              <Ban className="h-3.5 w-3.5" />
                              <span>Ban Member</span>
                            </button>
                          )}

                          {/* Login Portal (Impersonate) */}
                          <button
                            onClick={(e) => onImpersonate && onImpersonate(m.userId || m._id, m.email, e)}
                            disabled={impersonateLoading === (m.userId || m._id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#34D399]/40 bg-[#34D399]/15 px-2.5 py-1 text-xs font-bold text-[#34D399] transition hover:bg-[#34D399]/25 hover:border-[#34D399] disabled:opacity-50 shadow-sm"
                            title="Login without password & view member dashboard"
                          >
                            {impersonateLoading === (m.userId || m._id) ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <LogIn className="h-3.5 w-3.5" />
                            )}
                            <span className="hidden xl:inline">Portal</span>
                          </button>

                          {/* External Link */}
                          <button
                            onClick={() => navigate(ADMIN_ROUTES.MEMBER_DETAIL(m.userId || m._id))}
                            className="rounded-lg border border-[#1E493B] bg-[#071C18] p-1.5 text-[#91A89E] hover:text-white hover:border-[#34D399]/40 transition"
                            title="View Full Member Profile"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ================= 2. BAN CONFIRMATION MODAL ================= */}
      {banModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
          <div
            className="relative flex flex-col w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] rounded-2xl sm:rounded-3xl border border-rose-500/60 bg-[#091512] shadow-[0_0_50px_rgba(244,63,94,0.35)] font-mono text-xs text-white overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pinned Modal Header */}
            <div className="shrink-0 flex items-start justify-between border-b border-[#1E493B] px-4 py-3.5 sm:px-6 sm:py-4 bg-[#0a1b16]">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-rose-500/50 bg-rose-500/20 text-rose-400 shadow-inner">
                  <ShieldAlert className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider truncate">
                    Freeze Account & Issue Ban
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#A7B8AE] truncate mt-0.5">
                    Target: <span className="text-rose-400 font-bold">{banModalTarget.email}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBanModalTarget(null)}
                className="rounded-xl border border-[#1E493B] bg-[#071C18] p-1.5 text-[#A7B8AE] hover:text-white transition shrink-0 ml-2"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 scrollbar-thin">
              {/* Target User Financial Summary */}
              <div className="rounded-xl border border-[#1E493B] bg-[#071C18] p-3 space-y-2">
                <div className="text-[10px] uppercase font-bold text-[#A7B8AE] tracking-wider">
                  Target User Financial State
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-[#A7B8AE] block text-[10px]">Referral Code:</span>
                    <strong className="text-[#34D399] font-mono text-[11px] truncate block">{banModalTarget.referralCode}</strong>
                  </div>
                  <div>
                    <span className="text-[#A7B8AE] block text-[10px]">Total Deposited:</span>
                    <strong className="text-white font-mono text-[11px] block">${fmt(banModalTarget.totalDeposited)} USDT</strong>
                  </div>
                  <div>
                    <span className="text-[#A7B8AE] block text-[10px]">Staked Capital:</span>
                    <strong className="text-[#F1D78A] font-mono text-[11px] block">${fmt(banModalTarget.staked)} USDT</strong>
                  </div>
                  <div>
                    <span className="text-[#A7B8AE] block text-[10px]">Available Funds:</span>
                    <strong className="text-[#34D399] font-mono text-[11px] block">${fmt(banModalTarget.availableBalance)} USDT</strong>
                  </div>
                </div>
                {banModalTarget.depositAddress && (
                  <div className="pt-2 border-t border-[#1E493B]/70 flex items-center justify-between gap-2">
                    <div className="truncate text-[10.5px] text-[#A7B8AE]">
                      <span>Wallet: </span>
                      <span className="text-white font-mono">{banModalTarget.depositAddress}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(banModalTarget.depositAddress, 'modal-wallet')}
                      className="text-[#34D399] hover:underline shrink-0 text-[10px] font-bold"
                    >
                      {copiedWallet === 'modal-wallet' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>

              {/* Suspension Reason (Required) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#F1D78A] block uppercase tracking-wider">
                  Suspension Reason (Required)
                </label>

                {/* Preset Quick Selectors */}
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_REASONS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setBanReason(preset.text)}
                      className={`rounded-lg border px-2.5 py-1 text-[10.5px] font-semibold transition ${
                        banReason === preset.text
                          ? 'border-rose-500 bg-rose-500/25 text-rose-300 font-bold shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                          : 'border-[#1E493B] bg-[#071C18] text-[#A7B8AE] hover:text-white hover:border-[#2D735C]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={2}
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter detailed reason for account suspension and custodial asset freeze..."
                  className="w-full rounded-xl border border-rose-500/40 bg-[#071C18] p-2.5 text-xs text-white placeholder-[#718A7F] outline-none transition focus:border-rose-500 focus:ring-1 focus:ring-rose-500 resize-none"
                />
                {banError && (
                  <p className="text-xs text-rose-400 font-bold flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{banError}</span>
                  </p>
                )}
              </div>

              {/* Security Warning Checklist */}
              <div className="rounded-xl border border-rose-500/35 bg-rose-950/20 p-3 space-y-2">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                  Explicit Security & Freeze Rules Applied:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10.5px] text-[#ECFDF5]/90">
                  <div className="flex items-start gap-1.5">
                    <span className="text-rose-400 shrink-0">❌</span>
                    <span><strong>NO Withdrawals:</strong> Destination payouts blocked.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-rose-400 shrink-0">❌</span>
                    <span><strong>NO Deposits & Stakes:</strong> Capital locking blocked.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-rose-400 shrink-0">❌</span>
                    <span><strong>NO Daily Yield:</strong> 0.40%–0.50% worker skips user.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-rose-400 shrink-0">❌</span>
                    <span><strong>NO Saturday Release:</strong> Pending rewards frozen.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-rose-400 shrink-0">❌</span>
                    <span><strong>NO Referral Comms:</strong> Sponsor code disabled.</span>
                  </div>
                  <div className="flex items-start gap-1.5 sm:col-span-2">
                    <span className="text-[#34D399] shrink-0">🛡️</span>
                    <span><strong>APPEAL PERMITTED:</strong> View tickets & submit appeal.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pinned Modal Actions Footer */}
            <div className="shrink-0 flex items-center justify-end gap-2.5 sm:gap-3 px-4 py-3 sm:px-6 sm:py-3.5 border-t border-[#1E493B] bg-[#071C18]">
              <button
                type="button"
                onClick={() => setBanModalTarget(null)}
                disabled={banSubmitting}
                className="rounded-xl border border-[#1E493B] bg-[#091512] px-4 py-2 font-bold text-[#A7B8AE] hover:text-white transition disabled:opacity-50 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBan}
                disabled={banSubmitting || !banReason.trim()}
                className="flex items-center gap-2 rounded-xl border border-rose-500/80 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 px-4 sm:px-5 py-2 font-bold text-white shadow-[0_0_20px_rgba(244,63,94,0.45)] transition hover:brightness-110 disabled:opacity-50 text-xs"
              >
                {banSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Freezing Account...</span>
                  </>
                ) : (
                  <>
                    <Ban className="h-4 w-4 text-white" />
                    <span>Confirm Ban & Freeze Account</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 3. UNBAN CONFIRMATION MODAL ================= */}
      {unbanModalTarget && (
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
                    Target: <span className="text-[#34D399] font-bold">{unbanModalTarget.email}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUnbanModalTarget(null)}
                className="rounded-xl border border-[#1E493B] bg-[#071C18] p-1.5 text-[#A7B8AE] hover:text-white transition shrink-0 ml-2"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 scrollbar-thin">
              <p className="text-[#A7B8AE] leading-relaxed text-xs">
                Are you sure you want to lift the suspension for{' '}
                <strong className="text-[#34D399]">{unbanModalTarget.email}</strong>?
              </p>

              <div className="rounded-xl border border-[#34D399]/30 bg-[#34D399]/10 p-3 space-y-1.5 text-[11px] text-[#ECFDF5]">
                <p className="font-bold text-[#34D399] uppercase tracking-wider text-[10px]">Restored Permissions:</p>
                <p>✓ Daily yield calculations will resume at 00:00 UTC.</p>
                <p>✓ Withdrawals and deposit creations will be re-enabled.</p>
                <p>✓ Saturday release batch will resume converting pending rewards.</p>
                <p>✓ Sponsor invite code will be restored for registrations.</p>
              </div>
            </div>

            {/* Pinned Modal Actions Footer */}
            <div className="shrink-0 flex items-center justify-end gap-2.5 sm:gap-3 px-4 py-3 sm:px-6 sm:py-3.5 border-t border-[#1E493B] bg-[#071C18]">
              <button
                type="button"
                onClick={() => setUnbanModalTarget(null)}
                disabled={unbanSubmitting}
                className="rounded-xl border border-[#1E493B] bg-[#091512] px-4 py-2 font-bold text-[#A7B8AE] hover:text-white transition text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUnban}
                disabled={unbanSubmitting}
                className="flex items-center gap-2 rounded-xl border border-[#34D399]/70 bg-gradient-to-r from-[#10B981] via-[#059669] to-[#047857] px-4 sm:px-5 py-2 font-bold text-white shadow-[0_0_20px_rgba(52,211,153,0.35)] transition hover:brightness-110 disabled:opacity-50 text-xs"
              >
                {unbanSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Lifting Ban...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Lift Ban & Activate Account</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

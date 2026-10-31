import { useState, useMemo, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Coins, LogOut, ShieldCheck, ShieldAlert, LayoutDashboard, Wallet, TrendingUp,
  UserCircle, Users, Network, ArrowUpRight, ChevronLeft, ChevronRight,
  ReceiptText, Gift, KeyRound, ChevronDown, LifeBuoy, Search, Menu,
  X, Bell, SlidersHorizontal, Sparkles, Check, Copy, ExternalLink,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import AmbientBackground from './dashboard/AmbientBackground.jsx';
import ResetPasswordModal from './ResetPasswordModal.jsx';
import Toast from './Toast.jsx';
import { ADMIN_ROUTES } from '../lib/adminConfig.js';

const TABS = [
  { tab: 'overview', to: '/dashboard', label: 'Overview', Icon: LayoutDashboard },
  {
    tab: 'income-ledger',
    to: '/dashboard/income-ledger',
    label: 'Income Ledger',
    Icon: ReceiptText,
    children: [
      { category: 'all', to: '/dashboard/income-ledger', label: 'All Income', Icon: ReceiptText },
      { category: 'staking', to: '/dashboard/income-ledger/staking', label: 'Staking Yield', Icon: TrendingUp },
      { category: 'referral', to: '/dashboard/income-ledger/referral', label: 'Referral Bonus', Icon: Users },
      { category: 'promotional', to: '/dashboard/income-ledger/promotional', label: 'Airdrop Rewards', Icon: Gift },
      { category: 'unlocks', to: '/dashboard/income-ledger/unlocks', label: 'Capital Unlocks', Icon: KeyRound },
    ],
  },
  { tab: 'deposits', to: '/dashboard/deposit', label: 'USDT Deposits', Icon: Coins },
  { tab: 'withdraw', to: '/dashboard/withdraw', label: 'USDT Withdrawals', Icon: ArrowUpRight },
  { tab: 'stakes', to: '/dashboard/staking', label: 'Staking Plan', Icon: Lock },
  { tab: 'referrals', to: '/dashboard/referrals', label: 'Referrals', Icon: Users },
  { tab: 'tree', to: '/dashboard/team', label: 'My Team', Icon: Network },
  { tab: 'support', to: '/dashboard/support', label: 'Support Desk', Icon: LifeBuoy },
];

const MemberLayout = () => {
  const { user, logout, isImpersonating, exitImpersonation } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('member_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const topBarRef = useRef(null);
  const [topBarHeight, setTopBarHeight] = useState(isImpersonating ? 101 : 64);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [headerSearch, setHeaderSearch] = useState('');
  const [incomeOpen, setIncomeOpen] = useState(() =>
    location.pathname.startsWith('/dashboard/income-ledger')
  );
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [layoutToast, setLayoutToast] = useState('');

  useEffect(() => {
    setMobileOpen(false);
    setNotificationsOpen(false);
    setProfileDropdownOpen(false);
    if (location.pathname.startsWith('/dashboard/income-ledger')) {
      setIncomeOpen(true);
    }
  }, [location.search, location.pathname]);

  // Dynamically track top bar height (impersonation banner + header) so sidebar offset is always pixel-perfect
  useEffect(() => {
    if (!topBarRef.current) return;
    const updateHeight = () => {
      if (topBarRef.current) {
        setTopBarHeight(topBarRef.current.offsetHeight);
      }
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(topBarRef.current);
    return () => observer.disconnect();
  }, [isImpersonating]);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('member_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const walletAddress = user?.depositAddress || '0x71C8A9b72C9a22f35492A0bC55D2Ef36dE1F';
  const shortWallet = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  const copyWallet = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopiedWallet(true);
      setTimeout(() => setCopiedWallet(false), 2000);
    } catch {}
  };

  const isTabActive = (item) => {
    const pathname = location.pathname;
    if (item.tab === 'overview') {
      return pathname === '/dashboard' || pathname === '/dashboard/';
    }
    if (item.tab === 'income-ledger') {
      return pathname.startsWith('/dashboard/income-ledger');
    }
    if (item.tab === 'deposits') {
      return pathname.startsWith('/dashboard/deposit');
    }
    if (item.tab === 'withdraw') {
      return pathname.startsWith('/dashboard/withdraw');
    }
    if (item.tab === 'stakes') {
      return pathname.startsWith('/dashboard/staking');
    }
    if (item.tab === 'referrals') {
      return pathname === '/dashboard/referrals' && !location.search.includes('tab=team');
    }
    if (item.tab === 'tree') {
      return pathname === '/dashboard/team' || (pathname === '/dashboard/referrals' && location.search.includes('tab=team'));
    }
    if (item.tab === 'support') {
      return pathname.startsWith('/dashboard/support');
    }
    return pathname === item.to;
  };

  const isSubActive = (sub) => {
    const pathname = location.pathname;
    if (sub.category === 'all') {
      return pathname === '/dashboard/income-ledger' || pathname === '/dashboard/income-ledger/all';
    }
    return pathname === sub.to;
  };

  const filteredTabs = useMemo(() => {
    if (!navSearch.trim()) return TABS;
    const q = navSearch.trim().toLowerCase();
    return TABS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.children?.some((c) => c.label.toLowerCase().includes(q))
    );
  }, [navSearch]);

  return (
    <div className="min-h-screen bg-[#041A14] text-[#ECFDF5] flex flex-col font-sans selection:bg-[#34D399]/30 relative">
      <AmbientBackground />

      {/* Sticky Top Header Area (Impersonation Banner + Header) */}
      <div ref={topBarRef} className="sticky top-0 z-40 w-full backdrop-blur-2xl">
        {/* Admin Impersonation Top Banner */}
        {isImpersonating && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D4AF37]/50 bg-gradient-to-r from-[#D4AF37]/25 via-[#10352C] to-[#071C18] px-4 py-2 text-xs font-mono shadow-xl">
            <div className="flex items-center gap-2 text-[#F1D78A]">
              <ShieldCheck className="h-4 w-4 text-[#D4AF37] animate-pulse shrink-0" />
              <span>
                <strong className="text-white">Admin Impersonation Mode:</strong> Viewing full member account of{' '}
                <span className="text-[#34D399] font-bold">{user?.email}</span> ({user?.referralCode || 'Member'})
              </span>
            </div>
            <button
              onClick={() => {
                exitImpersonation();
                navigate(`${ADMIN_ROUTES.DASHBOARD}?tab=members`);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-[#D4AF37]/60 bg-[#D4AF37] px-3 py-1 text-xs font-bold font-mono text-[#020B08] shadow-sm hover:bg-[#F5D98E] transition shrink-0"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Exit & Return to Admin Panel</span>
            </button>
          </div>
        )}

        {/* Member Account Frozen / Suspension Notice */}
        {(user?.status === 'BANNED' || user?.status === 'SUSPENDED') && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-500/60 bg-gradient-to-r from-rose-950/60 via-[#1C080E] to-[#071C18] px-4 py-2 text-xs font-mono shadow-xl text-rose-300">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-400 animate-pulse shrink-0" />
              <span>
                <strong className="text-white">ACCOUNT FROZEN:</strong> Withdrawals, deposits, and staking yields are disabled.
                {user?.banReason ? ` Reason: ${user.banReason}` : ''}
              </span>
            </div>
            <NavLink
              to="/dashboard/support"
              className="flex items-center gap-1.5 rounded-lg border border-rose-400/60 bg-rose-500/20 px-3 py-1 text-xs font-bold font-mono text-white shadow-sm hover:bg-rose-500/30 transition shrink-0"
            >
              <span>Submit Suspension Appeal →</span>
            </NavLink>
          </div>
        )}

        {/* ================= 1. TOP HEADER BAR ================= */}
        <header className="flex h-16 w-full items-center justify-between border-b border-[#144234]/70 bg-[#06241D]/95 px-4 sm:px-6 shadow-sm">
        {/* Left: Hamburger + Brand */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => {
              if (window.innerWidth >= 768) {
                toggleSidebar();
              } else {
                setMobileOpen((prev) => !prev);
              }
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#164336] bg-[#07241C] text-[#8EA99D] hover:border-[#34D399]/50 hover:bg-[#0D382B] hover:text-white transition shadow-sm"
            title="Toggle Sidebar"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#34D399]/40 bg-gradient-to-br from-[#0B3327] to-[#041F18] shadow-[0_0_15px_rgba(52,211,153,0.25)] group-hover:border-[#34D399] transition-all">
              <Coins className="h-5 w-5 text-[#34D399]" />
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-white font-mono leading-none">
                  QNDX <span className="text-[#34D399]">PROTOCOL</span>
                </span>
                <span className="rounded-full border border-[#34D399]/40 bg-[#34D399]/15 px-1.5 py-0.2 text-[8px] font-mono font-bold text-[#34D399]">
                  v2.0
                </span>
              </div>
              <span className="text-[9px] font-mono tracking-widest uppercase text-[#34D399] font-bold">
                Staking Portal
              </span>
            </div>
          </NavLink>
        </div>

        {/* Center: Elongated Pill Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#719183]" />
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="Search transactions, stakes, ledger, wallet..."
              className="w-full rounded-full border border-[#164336] bg-[#07251D]/90 py-2 pl-10 pr-4 text-xs font-mono text-white placeholder-[#719183] outline-none transition focus:border-[#34D399] focus:bg-[#0B2720] focus:ring-1 focus:ring-[#34D399]/40 shadow-inner"
            />
          </div>
        </div>

        {/* Right: Actions + Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* BEP-20 Network Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-[#34D399]/30 bg-[#34D399]/10 px-3 py-1 text-[11px] font-mono text-[#34D399]">
            <span className="h-2 w-2 rounded-full bg-[#34D399] animate-pulse shadow-[0_0_8px_#34D399]" />
            <span className="font-semibold">BEP-20 Live</span>
          </div>

          {/* Notifications Toggle */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen((prev) => !prev)}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#164336] bg-[#07241C] text-[#8EA99D] hover:border-[#34D399]/40 hover:text-white transition"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#34D399] shadow-[0_0_8px_#34D399]" />
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl border border-[#164336] bg-[#0B2720]/98 p-3 shadow-2xl backdrop-blur-2xl z-50 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-[#1E493B] pb-2 mb-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5 text-[#34D399]" />
                    <span>System Alerts</span>
                  </span>
                  <span className="text-[10px] text-[#34D399] font-semibold">Live Audited</span>
                </div>
                <div className="space-y-2 py-1">
                  <div className="rounded-xl border border-[#34D399]/20 bg-[#34D399]/5 p-2 text-[11px]">
                    <p className="font-bold text-[#ECFDF5]">🗓️ Saturday Release Scheduled</p>
                    <p className="text-[#8EA99D] mt-0.5">Weekly staking rewards automatically distribute Saturdays 00:05 UTC.</p>
                  </div>
                  <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-2 text-[11px]">
                    <p className="font-bold text-[#F1D78A]">⚡ Daily Staking Active</p>
                    <p className="text-[#8EA99D] mt-0.5">Your daily compounding yield accrues at 00:00 UTC daily.</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setNotificationsOpen(false);
                    navigate('/dashboard/support');
                  }}
                  className="w-full mt-2 text-center text-[10px] text-[#34D399] hover:underline"
                >
                  View Helpdesk & Tickets →
                </button>
              </div>
            )}
          </div>

          {/* Helpdesk Shortcut */}
          <NavLink
            to="/dashboard/support"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#164336] bg-[#07241C] text-[#8EA99D] hover:border-[#34D399]/40 hover:text-white transition"
            title="Helpdesk & Support"
          >
            <LifeBuoy className="h-4 w-4" />
          </NavLink>

          {/* Income Ledger Shortcut */}
          <NavLink
            to="/dashboard/income-ledger"
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border border-[#164336] bg-[#07241C] text-[#8EA99D] hover:border-[#34D399]/40 hover:text-white transition"
            title="Income Ledger Analytics"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </NavLink>

          {/* Quick Deposit Button */}
          <NavLink
            to="/dashboard/deposit"
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-[#34D399]/40 bg-gradient-to-r from-[#10B981]/20 to-[#059669]/10 hover:border-[#34D399] px-3 py-1.5 text-xs font-mono font-semibold text-[#34D399] transition shadow-sm"
            title="Deposit USDT"
          >
            <Wallet className="h-3.5 w-3.5 text-[#34D399]" />
            <span>Deposit</span>
          </NavLink>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full border border-[#1E5243] bg-[#07241C] p-1 pr-2.5 hover:border-[#34D399]/60 transition"
              title="Account Menu"
            >
              <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#059669] to-[#34D399] text-xs font-bold font-mono text-[#041A14] shadow-sm">
                {user?.email ? user.email.slice(0, 1).toUpperCase() : 'M'}
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-[#07241C] bg-[#34D399]" />
              </div>
              <span className="hidden xl:inline text-xs font-mono font-medium text-white max-w-[110px] truncate">
                {user?.email ? user.email.split('@')[0] : 'Member'}
              </span>
              <ChevronDown className="h-3 w-3 text-[#8EA99D]" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#164336] bg-[#0B2720]/98 p-3 shadow-2xl backdrop-blur-2xl z-50 font-mono text-xs">
                <div className="border-b border-[#1E493B] pb-2 mb-2">
                  <p className="text-[10px] text-[#8EA99D] uppercase tracking-wider">Signed in as</p>
                  <p className="text-white font-bold truncate mt-0.5">{user?.email}</p>
                  <span className="inline-block mt-1 text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#34D399]/15 text-[#34D399] font-semibold border border-[#34D399]/30">
                    {user?.role || 'Member'} Tier
                  </span>
                </div>
                <div className="space-y-1">
                  <NavLink
                    to="/profile"
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-[#8EA99D] hover:bg-[#10352C] hover:text-white transition"
                  >
                    <UserCircle className="h-3.5 w-3.5" />
                    <span>My Profile</span>
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setResetPasswordOpen(true);
                    }}
                    className="flex w-full items-center gap-2 px-2.5 py-2 rounded-xl text-[#34D399] hover:bg-[#10352C] transition text-left"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-[#34D399]" />
                    <span>Reset / Forgot Password</span>
                  </button>
                  <NavLink
                    to="/dashboard/income-ledger"
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-[#8EA99D] hover:bg-[#10352C] hover:text-white transition"
                  >
                    <ReceiptText className="h-3.5 w-3.5" />
                    <span>Income Ledger</span>
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-2.5 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition text-left"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>

      {/* ================= 2. BODY LAYOUT ================= */}
      <div className="flex flex-1 relative">
        {/* Mobile Backdrop */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-[#020F0C]/80 backdrop-blur-sm md:hidden transition-opacity"
          />
        )}

        {/* Sidebar */}
        <aside
          style={{ top: `${topBarHeight}px` }}
          className={`fixed bottom-0 left-0 z-30 flex flex-col border-r border-[#144234]/70 bg-gradient-to-b from-[#06241D] via-[#05201A] to-[#041A14] py-4 transition-all duration-300 md:translate-x-0 ${
            mobileOpen ? 'translate-x-0 w-72 px-4 shadow-2xl' : '-translate-x-full md:translate-x-0'
          } ${
            collapsed ? 'md:w-20 md:px-3 md:items-center' : 'md:w-64 md:px-4'
          }`}
        >
          {/* Quick Search Item */}
          {!collapsed && (
            <div className="relative mb-3.5 px-0.5">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#719183]" />
              <input
                type="text"
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Search"
                className="w-full rounded-2xl border border-[#164336] bg-[#07251D] py-2.5 pl-9 pr-3 text-xs font-mono text-white placeholder-[#719183] outline-none transition focus:border-[#34D399] focus:bg-[#0B2720] shadow-inner"
              />
              {navSearch && (
                <button
                  onClick={() => setNavSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#719183] hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {/* Navigation Items (Matches Admin Panel Tab Architecture) */}
          <nav className="flex-1 w-full space-y-1.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#164336] hover:scrollbar-thumb-[#34D399]/40 scrollbar-track-transparent">
            {filteredTabs.map((item) => {
              const { tab, to, label, Icon, children } = item;
              const hasChildren = Boolean(children?.length);
              const isGroupActive = isTabActive(item);

              if (!hasChildren) {
                return (
                  <NavLink
                    key={tab}
                    to={to}
                    className={() =>
                      `group relative flex items-center rounded-2xl text-[13px] font-medium transition-all duration-200 ${
                        collapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'
                      } ${
                        isGroupActive
                          ? 'border border-[#34D399]/60 bg-gradient-to-r from-[#10B981] via-[#059669] to-[#047857] text-white font-bold shadow-[0_4px_22px_rgba(16,185,129,0.35)]'
                          : 'border border-transparent text-[#8EA99D] hover:bg-[#0D382B]/80 hover:text-white hover:border-[#164B3A]/60'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Icon
                        className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                          isGroupActive ? 'text-white' : 'text-[#8EA99D] group-hover:text-[#34D399]'
                        }`}
                      />
                      {!collapsed && <span className="truncate">{label}</span>}
                    </div>

                    {!collapsed && isGroupActive && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 border border-white/40 shadow-sm ml-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      </span>
                    )}

                    {collapsed && (
                      <div className="pointer-events-none absolute left-full ml-3 hidden rounded-xl border border-[#34D399]/40 bg-[#0B2720]/98 px-3 py-1.5 font-mono text-xs font-semibold text-white shadow-xl backdrop-blur-xl group-hover:block z-50 whitespace-nowrap">
                        {label}
                      </div>
                    )}
                  </NavLink>
                );
              }

              // Income Ledger with Subtabs (Accordion like Admin Panel)
              return (
                <div key={tab} className="space-y-1">
                  <div className="relative group">
                    <div
                      className={`flex items-center rounded-2xl text-[13px] font-medium transition-all duration-200 ${
                        collapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'
                      } ${
                        isGroupActive
                          ? 'border border-[#34D399]/60 bg-gradient-to-r from-[#10B981] via-[#059669] to-[#047857] text-white font-bold shadow-[0_4px_22px_rgba(16,185,129,0.35)]'
                          : 'border border-transparent text-[#8EA99D] hover:bg-[#0D382B]/80 hover:text-white hover:border-[#164B3A]/60'
                      }`}
                    >
                      <NavLink to={to} className="flex items-center gap-3.5 min-w-0 flex-1">
                        <Icon
                          className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                            isGroupActive ? 'text-white' : 'text-[#8EA99D] group-hover:text-[#34D399]'
                          }`}
                        />
                        {!collapsed && <span className="truncate">{label}</span>}
                      </NavLink>

                      {!collapsed && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setIncomeOpen((prev) => !prev);
                          }}
                          className="p-1 rounded-lg hover:bg-black/20 text-white/80 hover:text-white transition ml-1"
                          title={incomeOpen ? 'Collapse subtabs' : 'Expand subtabs'}
                        >
                          <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform duration-200 ${
                              incomeOpen ? 'rotate-180 text-white' : ''
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {collapsed && (
                      <div className="pointer-events-none group-hover:pointer-events-auto absolute left-full top-0 ml-3 hidden min-w-[210px] rounded-2xl border border-[#34D399]/40 bg-[#0B2720]/98 p-2 font-mono shadow-2xl backdrop-blur-2xl group-hover:block z-50">
                        <div className="border-b border-[#1E493B] px-3 py-2 text-[11px] font-bold text-[#34D399] uppercase tracking-wider">
                          {label}
                        </div>
                        <div className="pt-1.5 space-y-1">
                          {children.map((sub) => {
                            const SubIcon = sub.Icon;
                            const isSubCategoryActive = isSubActive(sub);
                            return (
                              <NavLink
                                key={sub.category}
                                to={sub.to}
                                className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs transition ${
                                  isSubCategoryActive
                                    ? 'bg-[#34D399]/20 text-[#34D399] font-bold border border-[#34D399]/40'
                                    : 'text-[#8EA99D] hover:bg-[#164B3A] hover:text-white'
                                }`}
                              >
                                <SubIcon className="h-3.5 w-3.5 shrink-0" />
                                <span>{sub.label}</span>
                              </NavLink>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {!collapsed && incomeOpen && (
                    <div className="ml-5 pl-3 border-l-2 border-[#164336] space-y-1 pt-1">
                      {children.map((sub) => {
                        const SubIcon = sub.Icon;
                        const isSubCategoryActive = isSubActive(sub);
                        return (
                          <NavLink
                            key={sub.category}
                            to={sub.to}
                            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-mono transition-all duration-150 ${
                              isSubCategoryActive
                                ? 'bg-[#10B981]/20 text-[#34D399] font-bold border border-[#34D399]/40 shadow-sm'
                                : 'text-[#8EA99D] hover:bg-[#0D382B]/60 hover:text-white'
                            }`}
                          >
                            <SubIcon className="h-3 w-3 shrink-0" />
                            <span className="truncate">{sub.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer Card */}
          <div className="w-full space-y-2 border-t border-[#144234]/70 pt-3 mt-auto shrink-0">
            {/* Connected Wallet with 1-Click Copy */}
            {!collapsed && (
              <div className="flex items-center justify-between rounded-2xl border border-[#164336] bg-[#07241C] px-3 py-2 text-xs font-mono">
                <div className="flex items-center gap-2 min-w-0">
                  <Wallet className="h-3.5 w-3.5 text-[#34D399] shrink-0" />
                  <span className="truncate text-[11px] text-[#ECFDF5]">{shortWallet}</span>
                </div>
                <button
                  onClick={copyWallet}
                  className="p-1 rounded text-[#8EA99D] hover:text-[#34D399] transition"
                  title="Copy Wallet Address"
                >
                  {copiedWallet ? <Check className="h-3.5 w-3.5 text-[#34D399]" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}

            {/* User Profile Card */}
            <NavLink
              to="/profile"
              className={`flex items-center rounded-2xl border border-[#164336] bg-[#07241C] hover:border-[#34D399]/50 transition ${
                collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2.5'
              }`}
              title={collapsed ? `${user?.email} (${user?.role})` : undefined}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#059669]/20 border border-[#34D399]/30 text-[#34D399]">
                <UserCircle className="h-4 w-4" />
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate text-xs font-mono font-medium text-white">
                    {user?.email}
                  </span>
                  <span className="text-[10px] font-mono text-[#34D399] uppercase tracking-wider">
                    {user?.role || 'Member'} Tier
                  </span>
                </div>
              )}
            </NavLink>

            {/* Quick Reset / Forgot Password */}
            <button
              onClick={() => setResetPasswordOpen(true)}
              className={`group relative flex w-full items-center rounded-2xl text-[13px] font-medium text-[#8EA99D] transition hover:bg-[#34D399]/10 hover:text-[#34D399] hover:border-[#34D399]/30 border border-transparent ${
                collapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2'
              }`}
              title={collapsed ? 'Forgot / Reset Password' : undefined}
            >
              <KeyRound className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110 text-[#34D399]" />
              {!collapsed ? (
                <span className="truncate text-xs">Reset / Forgot Password</span>
              ) : (
                <div className="pointer-events-none absolute left-full ml-3 hidden rounded-xl border border-[#34D399]/40 bg-[#0B2720] px-3 py-1.5 font-mono text-xs font-semibold text-[#34D399] shadow-xl backdrop-blur-xl group-hover:block z-50 whitespace-nowrap">
                  Forgot / Reset Password
                </div>
              )}
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className={`group relative flex w-full items-center rounded-2xl text-[13px] font-medium text-[#8EA99D] transition hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 border border-transparent ${
                collapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2.5'
              }`}
              title={collapsed ? 'Sign Out' : undefined}
            >
              <LogOut className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
              {!collapsed ? (
                <span>Sign Out</span>
              ) : (
                <div className="pointer-events-none absolute left-full ml-3 hidden rounded-xl border border-rose-500/30 bg-[#0B2720] px-3 py-1.5 font-mono text-xs font-semibold text-rose-400 shadow-xl backdrop-blur-xl group-hover:block z-50 whitespace-nowrap">
                  Sign Out
                </div>
              )}
            </button>
          </div>
        </aside>

        {/* Dynamic Main Content */}
        <main
          className={`flex-1 w-full overflow-x-hidden transition-all duration-300 p-4 sm:p-6 lg:p-8 ${
            collapsed ? 'md:ml-20' : 'md:ml-64'
          }`}
        >
          <Outlet />
        </main>
      </div>

      {/* Forgot / Reset Password Modal */}
      <ResetPasswordModal
        isOpen={resetPasswordOpen}
        onClose={() => setResetPasswordOpen(false)}
        initialEmail={user?.email}
        isAuthenticated={true}
        onSuccess={(msg) => {
          setLayoutToast(msg);
          setResetPasswordOpen(false);
        }}
      />

      <Toast message={layoutToast} onClose={() => setLayoutToast('')} />
    </div>
  );
};

export default MemberLayout;

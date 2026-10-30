import { useState, useMemo, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Coins, LogOut, ShieldCheck, LayoutDashboard, Wallet, TrendingUp,
  UserCircle, Users, Network, ArrowUpRight, ChevronLeft, ChevronRight,
  ReceiptText, Gift, KeyRound, ChevronDown, LifeBuoy, Search, Menu,
  X, Bell, SlidersHorizontal, Sparkles, Check, Copy, ExternalLink,
  Layers, Zap, History, Award, FileText, Settings, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import AmbientBackground from './dashboard/AmbientBackground.jsx';

// Reference-inspired navigation groupings
const NAV_SECTIONS = [
  {
    title: 'MAIN MENU',
    items: [
      { to: '/dashboard', label: 'Overview', Icon: LayoutDashboard, end: true },
      { to: '/dashboard/staking', label: 'My Staking', Icon: TrendingUp },
      { to: '/dashboard/staking', label: 'Staking Plans', Icon: Layers },
      { to: '/dashboard/staking', label: 'Yield Calculator', Icon: Zap },
      { to: '/dashboard/income-ledger/promotional', label: 'Token Drops', Icon: Gift },
    ],
  },
  {
    title: 'FINANCIAL ACTIVITY',
    items: [
      { to: '/dashboard/income-ledger', label: 'Transactions', Icon: ReceiptText },
      { to: '/dashboard/withdraw', label: 'Withdrawal', Icon: ArrowUpRight },
      { to: '/dashboard/deposit', label: 'Deposit History', Icon: Wallet },
      { to: '/dashboard/income-ledger/staking', label: 'Reward History', Icon: History },
    ],
  },
  {
    title: 'NETWORK',
    items: [
      { to: '/dashboard/referrals', label: 'Referral Network', Icon: Users },
      { to: '/dashboard/team', label: 'Team Overview', Icon: Network },
      { to: '/dashboard/income-ledger/referral', label: 'Referral Earnings', Icon: Award },
    ],
  },
  {
    title: 'PROTOCOL',
    items: [
      { to: '/dashboard/support', label: 'Security & Ledger', Icon: ShieldCheck },
      { to: '#whitepaper', label: 'Whitepaper', Icon: FileText, external: true },
      { to: '/profile', label: 'Settings', Icon: Settings },
      { to: '/dashboard/support', label: 'Support & Helpdesk', Icon: LifeBuoy },
    ],
  },
];

const MemberLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('member_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [mobileOpen, setMobileOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [headerSearch, setHeaderSearch] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
    setNotificationsOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname, location.search]);

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
    } catch {
      // fallback
    }
  };

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!navSearch.trim()) return NAV_SECTIONS;
    const q = navSearch.trim().toLowerCase();
    return NAV_SECTIONS.map((sec) => ({
      ...sec,
      items: sec.items.filter((item) => item.label.toLowerCase().includes(q)),
    })).filter((sec) => sec.items.length > 0);
  }, [navSearch]);

  // Derive current breadcrumb title
  const currentTitle = useMemo(() => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Protocol Overview';
    if (path.includes('staking')) return 'Staking Positions & Yields';
    if (path.includes('income-ledger')) return 'Unified Income Ledger';
    if (path.includes('deposit')) return 'USDT On-Chain Deposit';
    if (path.includes('withdraw')) return 'USDT Capital Withdrawal';
    if (path.includes('referral')) return 'Referral Network & Commissions';
    if (path.includes('team')) return '10-Tier Downline Team';
    if (path.includes('support')) return 'Institutional Helpdesk';
    if (path.includes('profile')) return 'Member Profile & Security';
    return 'QNDX Protocol v2.0';
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen bg-[#020B08] text-[#F5F5F0] flex flex-col font-sans selection:bg-[#34D399]/30">
      {/* Ambient background with radial lighting and soft particles */}
      <AmbientBackground />

      {/* ================= 1. TOP NAVIGATION BAR (Reference-Inspired) ================= */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[#1E493B]/70 bg-[#05251D]/90 px-4 sm:px-6 backdrop-blur-xl shadow-sm">
        {/* Left: Breadcrumbs & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (window.innerWidth >= 768) {
                toggleSidebar();
              } else {
                setMobileOpen((prev) => !prev);
              }
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E493B] bg-[#071C18] text-[#A7B8AE] hover:border-[#34D399]/60 hover:bg-[#0B2720] hover:text-[#34D399] transition shadow-sm"
            title="Toggle Sidebar"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Brand Logo & Name (visible when collapsed or on mobile) */}
          <NavLink to="/dashboard" className="flex items-center gap-2 group md:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#0B2720] shadow-[0_0_12px_rgba(212,175,55,0.3)]">
              <Coins className="h-4 w-4 text-[#D4AF37]" />
            </span>
            <span className="text-sm font-extrabold tracking-tight text-white font-mono">QNDX</span>
          </NavLink>

          {/* Breadcrumb path for desktop */}
          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#A7B8AE]">
              <span>Protocol</span>
              <span>/</span>
              <span>Staking</span>
              <span>/</span>
              <span className="text-[#34D399] font-bold">Overview</span>
            </div>
            <h1 className="text-sm font-bold font-mono text-white tracking-tight leading-none mt-0.5">
              {currentTitle}
            </h1>
          </div>
        </div>

        {/* Center: Large Rounded Search Field */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A7B8AE]" />
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="Search transactions, wallets, staking..."
              className="w-full rounded-full border border-[#1E493B] bg-[#071C18]/90 py-2 pl-10 pr-4 text-xs font-mono text-[#F5F5F0] placeholder-[#A7B8AE] outline-none transition focus:border-[#34D399] focus:bg-[#0B2720] focus:ring-1 focus:ring-[#34D399]/40 shadow-inner"
            />
          </div>
        </div>

        {/* Right: Actions, BEP-20 Network Indicator, Wallet & Profile Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* BEP-20 Live Network Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-[#34D399]/30 bg-[#34D399]/10 px-3 py-1 text-[11px] font-mono text-[#34D399]">
            <span className="h-2 w-2 rounded-full bg-[#34D399] animate-pulse shadow-[0_0_8px_#34D399]" />
            <span className="font-semibold">BEP-20 Live</span>
          </div>

          {/* Notifications Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen((prev) => !prev)}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E493B] bg-[#071C18] text-[#A7B8AE] hover:border-[#34D399]/50 hover:text-white transition"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#34D399] shadow-[0_0_8px_#34D399]" />
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl border border-[#1E493B] bg-[#0B2720]/98 p-3 shadow-2xl backdrop-blur-2xl z-50 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-[#1E493B] pb-2 mb-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5 text-[#34D399]" />
                    <span>System Alerts</span>
                  </span>
                  <span className="text-[10px] text-[#34D399] font-semibold">Live Audited</span>
                </div>
                <div className="space-y-2 py-1">
                  <div className="rounded-xl border border-[#34D399]/20 bg-[#34D399]/5 p-2 text-[11px]">
                    <p className="font-bold text-[#F5F5F0]">🗓️ Saturday Release Scheduled</p>
                    <p className="text-[#A7B8AE] mt-0.5">Weekly staking rewards automatically distribute Saturdays 00:05 UTC.</p>
                  </div>
                  <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-2 text-[11px]">
                    <p className="font-bold text-[#F5D98E]">⚡ Live Staking Active</p>
                    <p className="text-[#A7B8AE] mt-0.5">Your daily compounding yield accrues at 00:00 UTC daily.</p>
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

          {/* Help / Support Icon */}
          <NavLink
            to="/dashboard/support"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E493B] bg-[#071C18] text-[#A7B8AE] hover:border-[#34D399]/50 hover:text-white transition"
            title="Helpdesk & Support"
          >
            <LifeBuoy className="h-4 w-4" />
          </NavLink>

          {/* Quick Wallet Address / Deposit Action */}
          <button
            onClick={() => navigate('/dashboard/deposit')}
            className="hidden sm:flex items-center gap-2 rounded-xl border border-[#D4AF37]/40 bg-gradient-to-r from-[#10352C] to-[#0B2720] px-3 py-1.5 text-xs font-mono font-semibold text-[#F5D98E] hover:border-[#D4AF37] transition shadow-sm"
            title="Deposit USDT"
          >
            <Wallet className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span>Deposit</span>
          </button>

          {/* User Avatar Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full border border-[#1E493B] bg-[#071C18] p-1 pr-2 hover:border-[#34D399]/60 transition"
              title="Account Menu"
            >
              <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#064E3B] via-[#059669] to-[#34D399] text-xs font-bold font-mono text-[#020B08] shadow-sm">
                {user?.email ? user.email.slice(0, 1).toUpperCase() : 'M'}
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-[#071C18] bg-[#34D399]" />
              </div>
              <ChevronDown className="h-3 w-3 text-[#A7B8AE]" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#1E493B] bg-[#0B2720]/98 p-3 shadow-2xl backdrop-blur-2xl z-50 font-mono text-xs">
                <div className="border-b border-[#1E493B] pb-2 mb-2">
                  <p className="text-[10px] text-[#A7B8AE] uppercase tracking-wider">Signed in as</p>
                  <p className="text-white font-bold truncate mt-0.5">{user?.email}</p>
                  <span className="inline-block mt-1 text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#34D399]/15 text-[#34D399] font-semibold border border-[#34D399]/30">
                    {user?.role} Tier
                  </span>
                </div>
                <div className="space-y-1">
                  <NavLink
                    to="/profile"
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-[#A7B8AE] hover:bg-[#10352C] hover:text-white transition"
                  >
                    <UserCircle className="h-3.5 w-3.5" />
                    <span>My Profile</span>
                  </NavLink>
                  <NavLink
                    to="/dashboard/income-ledger"
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-[#A7B8AE] hover:bg-[#10352C] hover:text-white transition"
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

      {/* ================= 2. BODY LAYOUT: SIDEBAR + CONTENT ================= */}
      <div className="flex flex-1 relative z-10">
        {/* Mobile Backdrop */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-[#020B08]/85 backdrop-blur-sm md:hidden transition-opacity"
          />
        )}

        {/* ================= 3. LEFT SIDEBAR (Reference-Inspired) ================= */}
        <aside
          className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-[#1E493B]/80 bg-[#05251D] py-5 transition-all duration-300 md:translate-x-0 ${
            mobileOpen ? 'translate-x-0 w-[260px] px-3.5 shadow-2xl' : '-translate-x-full md:translate-x-0'
          } ${
            collapsed ? 'md:w-[78px] md:px-2.5 md:items-center' : 'md:w-[260px] md:px-3.5'
          }`}
        >
          {/* Sidebar Header: Logo Container + Gold Animated Aura + Brand + v2.0 badge */}
          <div
            className={`mb-5 flex items-center w-full ${
              collapsed ? 'justify-center' : 'justify-between px-1'
            }`}
          >
            <NavLink to="/dashboard" className="flex items-center gap-3 group min-w-0" title="QNDX Staking Protocol v2.0">
              {/* Rounded emerald logo container with gold animated aura */}
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/50 bg-gradient-to-br from-[#10352C] to-[#0B2720] shadow-[0_0_22px_rgba(212,175,55,0.45)] ring-1 ring-[#D4AF37]/40 transition-transform group-hover:scale-105">
                <Coins className="h-5 w-5 text-[#F5D98E]" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34D399] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#34D399]" />
                </span>
              </div>

              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-extrabold tracking-tight text-white font-mono leading-none">
                      QNDX
                    </span>
                    <span className="rounded-full border border-[#34D399]/40 bg-[#34D399]/15 px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#34D399]">
                      v2.0
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#A7B8AE] truncate mt-0.5">
                    Staking Protocol
                  </span>
                </div>
              )}
            </NavLink>

            {/* Collapse toggle (desktop only) */}
            {!collapsed && (
              <button
                onClick={toggleSidebar}
                className="hidden md:flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#1E493B] bg-[#071C18] text-[#A7B8AE] hover:border-[#D4AF37]/60 hover:text-[#F5D98E] transition"
                title="Collapse sidebar (78px)"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Search Item inside Sidebar (Matches Screenshot) */}
          {!collapsed && (
            <div className="relative mb-4 px-0.5">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#A7B8AE]" />
              <input
                type="text"
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Search"
                className="w-full rounded-xl border border-[#1E493B] bg-[#071C18] py-2 pl-9 pr-3 text-xs font-mono text-white placeholder-[#A7B8AE] outline-none transition focus:border-[#34D399] focus:bg-[#0B2720]"
              />
              {navSearch && (
                <button
                  onClick={() => setNavSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#A7B8AE] hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {/* Navigation Sections */}
          <nav className="flex-1 w-full space-y-4 overflow-y-auto scrollbar-none pr-0.5">
            {filteredSections.map((sec, secIdx) => (
              <div key={sec.title || secIdx} className="space-y-1">
                {/* Section Title */}
                {!collapsed && (
                  <p className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-[#718A7F] mb-1">
                    {sec.title}
                  </p>
                )}

                {/* Section Items */}
                <div className="space-y-1">
                  {sec.items.map((item) => {
                    const { to, label, Icon, end, external } = item;

                    if (external) {
                      return (
                        <a
                          key={label}
                          href={to}
                          target="_blank"
                          rel="noreferrer"
                          className={`group relative flex items-center rounded-xl text-xs font-mono font-medium transition-all duration-200 ${
                            collapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'
                          } border border-transparent text-[#A7B8AE] hover:bg-[#0B2720] hover:text-white hover:border-[#1E493B]`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon className="h-4 w-4 shrink-0 text-[#A7B8AE] group-hover:text-[#34D399] transition-colors" />
                            {!collapsed && <span className="truncate">{label}</span>}
                          </div>
                          {!collapsed && <ExternalLink className="h-3 w-3 text-[#718A7F] group-hover:text-white" />}
                        </a>
                      );
                    }

                    return (
                      <NavLink
                        key={label}
                        to={to}
                        end={end}
                        className={({ isActive }) =>
                          `group relative flex items-center rounded-xl text-xs font-mono font-medium transition-all duration-200 ${
                            collapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'
                          } ${
                            isActive
                              ? 'border border-[#34D399]/60 bg-gradient-to-r from-[#10B981] via-[#059669] to-[#047857] text-white font-bold shadow-[0_4px_20px_rgba(16,185,129,0.35)] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r before:bg-[#34D399] before:shadow-[0_0_10px_#34D399]'
                              : 'border border-transparent text-[#A7B8AE] hover:bg-[#0B2720] hover:text-white hover:border-[#1E493B]'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <div className="flex items-center gap-3 min-w-0">
                              <Icon
                                className={`h-4 w-4 shrink-0 transition-colors ${
                                  isActive ? 'text-white' : 'text-[#A7B8AE] group-hover:text-[#34D399]'
                                }`}
                              />
                              {!collapsed && <span className="truncate">{label}</span>}
                            </div>

                            {/* Reference-inspired Circular Indicator Badge 'O' on Active Nav item */}
                            {!collapsed && isActive && (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 border border-white/40 shadow-sm ml-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                              </span>
                            )}

                            {/* Collapsed Sidebar Hover Tooltip */}
                            {collapsed && (
                              <div className="pointer-events-none absolute left-full ml-3 hidden rounded-xl border border-[#34D399]/40 bg-[#0B2720]/98 px-3 py-1.5 font-mono text-xs font-semibold text-white shadow-xl backdrop-blur-xl group-hover:block z-50 whitespace-nowrap">
                                {label}
                              </div>
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* ================= Sidebar Bottom Section ================= */}
          <div className="w-full space-y-2 border-t border-[#1E493B]/70 pt-3 mt-2">
            {/* BEP-20 Network Status */}
            <div
              className={`flex items-center rounded-xl border border-[#1E493B] bg-[#071C18] ${
                collapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2 w-2 rounded-full bg-[#34D399] animate-pulse shrink-0 shadow-[0_0_8px_#34D399]" />
                {!collapsed && (
                  <span className="text-[11px] font-mono text-[#34D399] font-semibold truncate">
                    BEP-20 Live
                  </span>
                )}
              </div>
              {!collapsed && (
                <span className="text-[10px] font-mono text-[#718A7F]">3s Block</span>
              )}
            </div>

            {/* Connected Wallet with 1-Click Copy */}
            {!collapsed && (
              <div className="flex items-center justify-between rounded-xl border border-[#1E493B] bg-[#071C18] px-3 py-2 text-xs font-mono">
                <div className="flex items-center gap-2 min-w-0">
                  <Wallet className="h-3.5 w-3.5 text-[#D4AF37] shrink-0" />
                  <span className="truncate text-[11px] text-[#F5F5F0]">{shortWallet}</span>
                </div>
                <button
                  onClick={copyWallet}
                  className="p-1 rounded text-[#A7B8AE] hover:text-[#34D399] transition"
                  title="Copy Wallet Address"
                >
                  {copiedWallet ? <Check className="h-3.5 w-3.5 text-[#34D399]" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}

            {/* User Profile Card */}
            <div
              className={`flex items-center rounded-xl border border-[#1E493B] bg-[#0B2720] ${
                collapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2'
              }`}
              title={collapsed ? `${user?.email} (${user?.role})` : undefined}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#064E3B] border border-[#34D399]/40 text-[#34D399] font-bold font-mono text-xs">
                {user?.email ? user.email.slice(0, 1).toUpperCase() : 'M'}
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate text-xs font-mono font-bold text-white">
                    {user?.email}
                  </span>
                  <span className="text-[10px] font-mono text-[#34D399] uppercase tracking-wider">
                    {user?.role} Access
                  </span>
                </div>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className={`group relative flex w-full items-center rounded-xl text-xs font-mono font-medium text-[#A7B8AE] transition hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 border border-transparent ${
                collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2'
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

        {/* Dynamic Main Content Wrapper */}
        <main
          className={`flex-1 w-full overflow-x-hidden transition-all duration-300 p-4 sm:p-6 lg:p-8 ${
            collapsed ? 'md:ml-[78px]' : 'md:ml-[260px]'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MemberLayout;

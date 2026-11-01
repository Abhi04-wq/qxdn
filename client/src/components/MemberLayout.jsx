import { useState, useMemo, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Coins, LogOut, ShieldCheck, ShieldAlert, LayoutDashboard, Wallet, TrendingUp,
  UserCircle, Users, Network, ArrowUpRight, ChevronLeft, ChevronRight,
  ReceiptText, Gift, KeyRound, ChevronDown, LifeBuoy, Search, Menu,
  X, Bell, SlidersHorizontal, Sparkles, Check, Copy, ExternalLink,
  Lock, PanelLeft
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
  const mainContentRef = useRef(null);

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
  const [incomeOpen, setIncomeOpen] = useState(() =>
    location.pathname.startsWith('/dashboard/income-ledger')
  );
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [layoutToast, setLayoutToast] = useState('');

  // Close modals/drawers and reset scroll position when route changes
  useEffect(() => {
    setMobileOpen(false);
    setNotificationsOpen(false);
    setProfileDropdownOpen(false);
    if (location.pathname.startsWith('/dashboard/income-ledger')) {
      setIncomeOpen(true);
    }
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.search, location.pathname]);

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

  const activeTabLabel = useMemo(() => {
    const p = location.pathname;
    if (p === '/dashboard' || p === '/dashboard/') return 'Overview';
    if (p.startsWith('/dashboard/income-ledger')) return 'Income Ledger';
    if (p.startsWith('/dashboard/deposit')) return 'USDT Deposits';
    if (p.startsWith('/dashboard/withdraw')) return 'USDT Withdrawals';
    if (p.startsWith('/dashboard/staking')) return 'Staking Plan';
    if (p.startsWith('/dashboard/referrals')) {
      if (location.search.includes('tab=team')) return 'My Team';
      return 'Referrals';
    }
    if (p.startsWith('/dashboard/team')) return 'My Team';
    if (p.startsWith('/dashboard/support')) return 'Support Desk';
    if (p.startsWith('/profile')) return 'My Profile';
    return 'Dashboard';
  }, [location.pathname, location.search]);

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
    <div className="h-screen w-screen min-h-screen bg-gradient-to-b from-[#06241D] via-[#05201A] to-[#041A14] text-[#ECFDF5] flex font-sans selection:bg-[#34D399]/30 relative overflow-hidden">
      
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-[#06241D]/80 backdrop-blur-sm md:hidden transition-opacity"
        />
      )}

      {/* ================= 1. MOBILE SIDEBAR DRAWER ================= */}
      {mobileOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 w-72 sm:w-80 border-r border-[#1E493B]/60 bg-gradient-to-b from-[#06241D] via-[#05201A] to-[#041A14] p-4 flex flex-col shadow-[0_20px_50px_rgba(6,36,29,0.95)] md:hidden overflow-y-auto">
          {/* Brand Header & Close */}
          <div className="flex items-center justify-between pb-3 border-b border-[#1E493B]/60 mb-3">
            <NavLink to="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#34D399]/40 bg-gradient-to-br from-[#0B3327] to-[#041F18] shadow-[0_0_15px_rgba(52,211,153,0.25)]">
                <Coins className="h-5 w-5 text-[#34D399]" />
              </span>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold tracking-tight text-white font-mono leading-none">
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
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg border border-[#1E493B] text-[#A7C4B8] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#91A89E]" />
            <input
              type="text"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Search navigation..."
              className="w-full rounded-2xl border border-[#1E493B] bg-[#0B2720] py-2.5 pl-9 pr-3 text-xs font-mono text-white placeholder-[#91A89E] outline-none transition focus:border-[#34D399] focus:bg-[#10352C] shadow-inner"
            />
          </div>

          {/* Navigation Links (Matches Admin Panel Color Combination + Glassmorphism Gradient Active) */}
          <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
            {filteredTabs.map((item) => {
              const { tab, to, label, Icon, children } = item;
              const hasChildren = Boolean(children?.length);
              const isGroupActive = isTabActive(item);

              if (!hasChildren) {
                return (
                  <NavLink
                    key={tab}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className={`group relative flex items-center rounded-2xl px-4 py-3 text-[13px] font-medium transition-all duration-200 ${
                      isGroupActive
                        ? 'border border-[#34D399]/25 bg-gradient-to-r from-black via-[#072A20] to-[#228B6B] text-white font-semibold shadow-[0_4px_20px_rgba(34,139,107,0.25)]'
                        : 'border border-transparent text-[#A7C4B8] hover:bg-[#164B3A]/60 hover:text-white hover:border-[#1E493B]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Icon className={`h-4.5 w-4.5 shrink-0 transition-colors ${isGroupActive ? 'text-white' : 'text-[#A7C4B8] group-hover:text-[#34D399]'}`} />
                      <span className="truncate">{label}</span>
                    </div>
                  </NavLink>
                );
              }

              return (
                <div key={tab} className="space-y-1">
                  <div
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-[13px] font-medium transition-all duration-200 ${
                      isGroupActive
                        ? 'border border-[#34D399]/25 bg-gradient-to-r from-black via-[#072A20] to-[#228B6B] text-white font-semibold shadow-[0_4px_20px_rgba(34,139,107,0.25)]'
                        : 'border border-transparent text-[#A7C4B8] hover:bg-[#164B3A]/60 hover:text-white hover:border-[#1E493B]'
                    }`}
                  >
                    <NavLink
                      to={to}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3.5 flex-1 min-w-0"
                    >
                      <Icon className={`h-4.5 w-4.5 shrink-0 transition-colors ${isGroupActive ? 'text-white' : 'text-[#A7C4B8] group-hover:text-[#34D399]'}`} />
                      <span className="truncate">{label}</span>
                    </NavLink>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setIncomeOpen((prev) => !prev);
                      }}
                      className="p-1 rounded-lg hover:bg-[#06241D]/50 text-white/80 hover:text-white transition ml-1"
                    >
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${incomeOpen ? 'rotate-180 text-white' : ''}`} />
                    </button>
                  </div>

                  {incomeOpen && (
                    <div className="ml-5 pl-3 border-l-2 border-[#1E493B] space-y-1 pt-1">
                      {children.map((sub) => {
                        const SubIcon = sub.Icon;
                        const isSubActiveCategory = isSubActive(sub);
                        return (
                          <NavLink
                            key={sub.category}
                            to={sub.to}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-mono transition-all duration-150 ${
                              isSubActiveCategory
                                ? 'border border-[#34D399]/30 bg-gradient-to-r from-black via-[#072A20] to-[#228B6B]/80 text-white font-semibold shadow-[0_2px_10px_rgba(34,139,107,0.2)]'
                                : 'text-[#A7C4B8] hover:bg-[#164B3A]/40 hover:text-white'
                            }`}
                          >
                            <SubIcon className="h-3.5 w-3.5 shrink-0" />
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

          {/* Bottom Cards */}
          <div className="mt-auto pt-3 border-t border-[#1E493B]/60 space-y-2">
            <div className="flex items-center justify-between rounded-2xl border border-[#1E493B] bg-[#0B2720] px-3 py-2 text-xs font-mono shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <Wallet className="h-3.5 w-3.5 text-[#34D399] shrink-0" />
                <span className="truncate text-[11px] text-[#ECFDF5]">{shortWallet}</span>
              </div>
              <button onClick={copyWallet} className="p-1 text-[#A7C4B8] hover:text-[#34D399]">
                {copiedWallet ? <Check className="h-3.5 w-3.5 text-[#34D399]" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <NavLink
              to="/profile"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 rounded-2xl border border-[#1E493B] bg-[#0B2720] p-2.5 text-xs font-mono shadow-sm hover:border-[#34D399]/50 transition"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#059669]/20 border border-[#34D399]/30 text-[#34D399]">
                <UserCircle className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate text-xs text-white font-medium">{user?.email}</span>
                <span className="text-[10px] text-[#34D399] uppercase tracking-wider font-semibold">
                  {user?.role || 'Member'} Tier
                </span>
              </div>
            </NavLink>
            <button
              onClick={() => {
                setMobileOpen(false);
                setResetPasswordOpen(true);
              }}
              className="flex w-full items-center gap-2 rounded-2xl border border-transparent px-3 py-2 text-xs font-mono text-[#34D399] hover:bg-[#34D399]/10"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Reset / Forgot Password</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-2xl border border-transparent px-3 py-2 text-xs font-mono text-rose-400 hover:bg-rose-500/10"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>
      )}

      {/* ================= 2. DESKTOP FLUSH-LEFT SIDEBAR (SEAMLESS TRANSPARENT OVER GRADIENT BG) ================= */}
      <aside
        className={`hidden md:flex flex-col shrink-0 border-none bg-transparent py-4 px-3.5 transition-all duration-300 z-30 select-none h-full ${
          collapsed ? 'w-20 items-center px-2.5' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} mb-4 px-1 shrink-0 w-full`}>
          <NavLink to="/dashboard" className="flex items-center gap-2.5 group min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#34D399]/40 bg-gradient-to-br from-[#0B3327] to-[#041F18] shadow-[0_0_15px_rgba(52,211,153,0.25)] group-hover:border-[#34D399] transition-all">
              <Coins className="h-4.5 w-4.5 text-[#34D399]" />
            </span>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold tracking-tight text-white font-mono leading-none truncate">
                    QNDX <span className="text-[#34D399]">PROTOCOL</span>
                  </span>
                  <span className="rounded-full border border-[#34D399]/40 bg-[#34D399]/15 px-1.5 py-0.2 text-[8px] font-mono font-bold text-[#34D399] shrink-0">
                    v2.0
                  </span>
                </div>
                <span className="text-[9px] font-mono tracking-widest uppercase text-[#34D399] font-bold mt-0.5">
                  Staking Portal
                </span>
              </div>
            )}
          </NavLink>
        </div>

        {/* Quick Search Item */}
        {!collapsed && (
          <div className="relative mb-3.5 px-0.5 shrink-0">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#91A89E]" />
            <input
              type="text"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Search"
              className="w-full rounded-2xl border border-[#1E493B] bg-[#0B2720] py-2.5 pl-9 pr-3 text-xs font-mono text-white placeholder-[#91A89E] outline-none transition focus:border-[#34D399] focus:bg-[#10352C] shadow-inner"
            />
            {navSearch && (
              <button
                onClick={() => setNavSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#91A89E] hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* Navigation Items (Exact Admin Panel Typography + Gradient Glassmorphism Active Tab) */}
        <nav className="flex-1 w-full space-y-2 overflow-y-auto pr-0.5 scrollbar-none">
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
                      collapsed ? 'justify-center p-3.5' : 'px-4 py-3'
                    } ${
                      isGroupActive
                        ? 'border border-[#34D399]/25 bg-gradient-to-r from-black via-[#072A20] to-[#228B6B] text-white font-semibold shadow-[0_4px_20px_rgba(34,139,107,0.25)]'
                        : 'border border-transparent text-[#A7C4B8] hover:bg-[#164B3A]/60 hover:text-white hover:border-[#1E493B]'
                    }`
                  }
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Icon
                      className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                        isGroupActive ? 'text-white' : 'text-[#A7C4B8] group-hover:text-[#34D399]'
                      }`}
                    />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </div>

                  {collapsed && (
                    <div className="pointer-events-none absolute left-full ml-3 hidden rounded-xl border border-[#34D399]/40 bg-[#0B2720]/98 px-3 py-1.5 font-mono text-xs font-semibold text-white shadow-[0_10px_30px_rgba(6,36,29,0.9)] backdrop-blur-xl group-hover:block z-50 whitespace-nowrap">
                      {label}
                    </div>
                  )}
                </NavLink>
              );
            }

            {/* Income Ledger Accordion (Admin Panel Pattern) */}
            return (
              <div key={tab} className="space-y-1">
                <div className="relative group">
                  <div
                    className={`flex items-center rounded-2xl text-[13px] font-medium transition-all duration-200 ${
                      collapsed ? 'justify-center p-3.5' : 'justify-between px-4 py-3'
                    } ${
                      isGroupActive
                        ? 'border border-[#34D399]/25 bg-gradient-to-r from-black via-[#072A20] to-[#228B6B] text-white font-semibold shadow-[0_4px_20px_rgba(34,139,107,0.25)]'
                        : 'border border-transparent text-[#A7C4B8] hover:bg-[#164B3A]/60 hover:text-white hover:border-[#1E493B]'
                    }`}
                  >
                    <NavLink to={to} className="flex items-center gap-3.5 min-w-0 flex-1">
                      <Icon
                        className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                          isGroupActive ? 'text-white' : 'text-[#A7C4B8] group-hover:text-[#34D399]'
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
                        className="p-1 rounded-lg hover:bg-[#06241D]/50 text-white/80 hover:text-white transition ml-1"
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
                    <div className="pointer-events-none group-hover:pointer-events-auto absolute left-full top-0 ml-3 hidden min-w-[210px] rounded-2xl border border-[#34D399]/40 bg-[#0B2720]/98 p-2 font-mono shadow-[0_12px_40px_rgba(6,36,29,0.95)] backdrop-blur-2xl group-hover:block z-50">
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
                                  ? 'border border-[#34D399]/30 bg-gradient-to-r from-black via-[#072A20] to-[#228B6B]/80 text-white font-semibold shadow-sm'
                                  : 'text-[#A7C4B8] hover:bg-[#164B3A] hover:text-white'
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
                  <div className="ml-5 pl-3 border-l-2 border-[#1E493B] space-y-1 pt-1">
                    {children.map((sub) => {
                      const SubIcon = sub.Icon;
                      const isSubCategoryActive = isSubActive(sub);
                      return (
                        <NavLink
                          key={sub.category}
                          to={sub.to}
                          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-mono transition-all duration-150 ${
                            isSubCategoryActive
                              ? 'border border-[#34D399]/30 bg-gradient-to-r from-black via-[#072A20] to-[#228B6B]/80 text-white font-semibold shadow-[0_2px_10px_rgba(34,139,107,0.2)]'
                              : 'text-[#A7C4B8] hover:bg-[#164B3A]/40 hover:text-white'
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

        {/* Bottom Card Group (Matches Admin Panel Profile Card Architecture) */}
        <div className="w-full space-y-2 border-t border-[#1E493B]/60 pt-3.5 mt-auto shrink-0">
          {/* Connected Wallet with 1-Click Copy */}
          {!collapsed && (
            <div className="flex items-center justify-between rounded-2xl border border-[#1E493B] bg-[#0B2720] px-3 py-2 text-xs font-mono shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2 w-2 rounded-full bg-[#34D399] shadow-[0_0_8px_#34D399] shrink-0" />
                <span className="truncate text-[11px] text-[#ECFDF5]">{shortWallet}</span>
              </div>
              <button
                onClick={copyWallet}
                className="p-1 rounded text-[#A7C4B8] hover:text-[#34D399] transition"
                title="Copy Wallet Address"
              >
                {copiedWallet ? <Check className="h-3.5 w-3.5 text-[#34D399]" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}

          {/* User Profile Card */}
          <NavLink
            to="/profile"
            className={`flex items-center rounded-2xl border border-[#1E493B] bg-[#0B2720] hover:border-[#34D399]/50 transition ${
              collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2.5'
            } shadow-sm`}
            title={collapsed ? `${user?.email} (${user?.role})` : undefined}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#059669]/20 border border-[#34D399]/30 text-[#34D399]">
              <UserCircle className="h-3.5 w-3.5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate text-xs font-mono font-medium text-white">
                  {user?.email}
                </span>
                <span className="text-[10px] font-mono text-[#34D399] uppercase tracking-wider font-semibold">
                  {user?.role || 'Member'} Tier
                </span>
              </div>
            )}
          </NavLink>

          {/* Quick Reset / Forgot Password */}
          <button
            onClick={() => setResetPasswordOpen(true)}
            className={`group relative flex w-full items-center rounded-2xl text-[13px] font-medium text-[#A7C4B8] transition hover:bg-[#34D399]/10 hover:text-[#34D399] hover:border-[#34D399]/30 border border-transparent ${
              collapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2'
            }`}
            title={collapsed ? 'Forgot / Reset Password' : undefined}
          >
            <KeyRound className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110 text-[#34D399]" />
            {!collapsed ? (
              <span className="truncate text-xs font-mono">Reset / Forgot Password</span>
            ) : (
              <div className="pointer-events-none absolute left-full ml-3 hidden rounded-xl border border-[#34D399]/40 bg-[#0B2720] px-3 py-1.5 font-mono text-xs font-semibold text-[#34D399] shadow-[0_10px_30px_rgba(6,36,29,0.9)] backdrop-blur-xl group-hover:block z-50 whitespace-nowrap">
                Forgot / Reset Password
              </div>
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`group relative flex w-full items-center rounded-2xl text-[13px] font-medium text-[#A7C4B8] transition hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 border border-transparent ${
              collapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2.5'
            }`}
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 text-rose-400" />
            {!collapsed ? (
              <span className="text-xs font-mono">Sign Out</span>
            ) : (
              <div className="pointer-events-none absolute left-full ml-3 hidden rounded-xl border border-rose-500/30 bg-[#0B2720] px-3 py-1.5 font-mono text-xs font-semibold text-rose-400 shadow-[0_10px_30px_rgba(6,36,29,0.9)] backdrop-blur-xl group-hover:block z-50 whitespace-nowrap">
                Sign Out
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* ================= 3. INSET FLOATING MAIN PANEL (SHADCN SIDEBAR-INSET PATTERN) ================= */}
      <div className="flex-1 flex flex-col min-w-0 my-2 mr-2 md:my-3 md:mr-3 md:ml-2 rounded-2xl md:rounded-[24px] border border-[#1E493B]/70 bg-gradient-to-b from-[#06241D]/90 via-[#05201A]/90 to-[#041A14]/90 backdrop-blur-xl shadow-[0_12px_45px_rgba(6,36,29,0.9),0_0_20px_rgba(52,211,153,0.08)] relative overflow-hidden h-[calc(100vh-1rem)] md:h-[calc(100vh-1.5rem)] z-10">
        
        {/* Glowing Cyber Grid Matrix strictly inside the background of the main content */}
        <AmbientBackground isAbsolute={true} />

        {/* Admin Impersonation Top Banner */}
        {isImpersonating && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D4AF37]/50 bg-gradient-to-r from-[#D4AF37]/25 via-[#10352C] to-[#071C18] px-4 sm:px-6 py-2 text-xs font-mono shadow-[0_10px_30px_rgba(6,36,29,0.9)] shrink-0 z-20">
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
              className="flex items-center gap-1.5 rounded-lg border border-[#D4AF37]/60 bg-[#D4AF37] px-3 py-1 text-xs font-bold font-mono text-[#071C18] shadow-sm hover:bg-[#F5D98E] transition shrink-0"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Exit & Return to Admin Panel</span>
            </button>
          </div>
        )}

        {/* Member Account Frozen / Suspension Notice */}
        {(user?.status === 'BANNED' || user?.status === 'SUSPENDED') && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-500/60 bg-gradient-to-r from-rose-950/60 via-[#1C080E] to-[#071C18] px-4 sm:px-6 py-2 text-xs font-mono shadow-[0_10px_30px_rgba(6,36,29,0.9)] text-rose-300 shrink-0 z-20">
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

        {/* Top Header Bar (Inside Inset Frame with PanelLeft Toggle & Breadcrumb) */}
        <header className="flex h-14 sm:h-16 w-full items-center justify-between border-b border-[#1E493B]/50 bg-[#06241D]/60 backdrop-blur-xl px-4 sm:px-6 shrink-0 z-20 shadow-sm">
          {/* Left Side: Sidebar Toggle (PanelLeft) + Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.innerWidth >= 768) {
                  toggleSidebar();
                } else {
                  setMobileOpen(true);
                }
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1E493B] bg-[#0B2720] text-[#A7C4B8] hover:border-[#34D399]/50 hover:bg-[#164B3A] hover:text-white transition shadow-sm"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              aria-label="Toggle Navigation Sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </button>

            {/* Vertical Divider */}
            <div className="h-4 w-[1px] bg-[#1E493B]" />

            {/* Active Breadcrumb / Section Label (Matches Shadcn Documents Header) */}
            <span className="text-xs sm:text-sm font-semibold font-mono text-white tracking-tight flex items-center gap-1.5">
              <span>{activeTabLabel}</span>
            </span>
          </div>

          {/* Center: Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-6">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#91A89E]" />
              <input
                type="text"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                placeholder="Search transactions, stakes, ledger, wallet..."
                className="w-full rounded-full border border-[#1E493B] bg-[#0B2720] py-1.5 pl-10 pr-4 text-xs font-mono text-white placeholder-[#91A89E] outline-none transition focus:border-[#34D399] focus:bg-[#10352C] focus:ring-1 focus:ring-[#34D399]/40 shadow-inner"
              />
            </div>
          </div>

          {/* Right Side: Quick Action Deposit Button + Notification Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* BEP-20 Live Badge */}
            <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-[#34D399]/30 bg-[#34D399]/10 px-2.5 py-1 text-[11px] font-mono text-[#34D399]">
              <span className="h-2 w-2 rounded-full bg-[#34D399] animate-pulse shadow-[0_0_8px_#34D399]" />
              <span className="font-semibold">BEP-20</span>
            </div>

            {/* Helpdesk Shortcut */}
            <NavLink
              to="/dashboard/support"
              className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg border border-[#1E493B] bg-[#0B2720] text-[#A7C4B8] hover:border-[#34D399]/40 hover:text-white transition"
              title="Helpdesk & Support"
            >
              <LifeBuoy className="h-4 w-4" />
            </NavLink>

            {/* Income Ledger Shortcut */}
            <NavLink
              to="/dashboard/income-ledger"
              className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg border border-[#1E493B] bg-[#0B2720] text-[#A7C4B8] hover:border-[#34D399]/40 hover:text-white transition"
              title="Income Ledger Analytics"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </NavLink>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-[#1E493B] bg-[#0B2720] text-[#A7C4B8] hover:border-[#34D399]/40 hover:text-white transition"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#34D399] shadow-[0_0_8px_#34D399]" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl border border-[#1E493B] bg-[#0B2720]/98 p-3 shadow-[0_15px_40px_rgba(6,36,29,0.95)] backdrop-blur-2xl z-50 font-mono text-xs">
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
                      <p className="text-[#A7C4B8] mt-0.5">Weekly staking rewards automatically distribute Saturdays 00:05 UTC.</p>
                    </div>
                    <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-2 text-[11px]">
                      <p className="font-bold text-[#F1D78A]">⚡ Daily Staking Active</p>
                      <p className="text-[#A7C4B8] mt-0.5">Your daily compounding yield accrues at 00:00 UTC daily.</p>
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

            {/* Quick Action Deposit Button */}
            <NavLink
              to="/dashboard/deposit"
              className="flex items-center gap-1.5 rounded-xl border border-[#34D399]/50 bg-gradient-to-r from-[#10B981] to-[#34D399] hover:from-[#34D399] hover:to-[#10B981] px-3 py-1.5 text-xs font-mono font-bold text-[#071C18] transition shadow-[0_0_18px_rgba(52,211,153,0.35)] hover:shadow-[0_0_24px_rgba(52,211,153,0.55)] hover:scale-[1.02]"
              title="Deposit USDT"
            >
              <Wallet className="h-3.5 w-3.5 text-[#071C18]" />
              <span>Deposit</span>
              <ArrowUpRight className="h-3 w-3 text-[#071C18] stroke-[2.5]" />
            </NavLink>

            {/* User Profile Pill / Menu */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-[#1E493B] bg-[#0B2720] p-1 pr-2 hover:border-[#34D399]/60 transition"
                title="Account Menu"
              >
                <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-[#059669] to-[#34D399] text-xs font-bold font-mono text-[#071C18] shadow-sm">
                  {user?.email ? user.email.slice(0, 1).toUpperCase() : 'M'}
                </div>
                <span className="hidden xl:inline text-xs font-mono font-medium text-white max-w-[100px] truncate">
                  {user?.email ? user.email.split('@')[0] : 'Member'}
                </span>
                <ChevronDown className="h-3 w-3 text-[#A7C4B8]" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#1E493B] bg-[#0B2720]/98 p-3 shadow-[0_15px_40px_rgba(6,36,29,0.95)] backdrop-blur-2xl z-50 font-mono text-xs">
                  <div className="border-b border-[#1E493B] pb-2 mb-2">
                    <p className="text-[10px] text-[#A7C4B8] uppercase tracking-wider">Signed in as</p>
                    <p className="text-white font-bold truncate mt-0.5">{user?.email}</p>
                    <span className="inline-block mt-1 text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#34D399]/15 text-[#34D399] font-semibold border border-[#34D399]/30">
                      {user?.role || 'Member'} Tier
                    </span>
                  </div>
                  <div className="space-y-1">
                    <NavLink
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-[#A7C4B8] hover:bg-[#164B3A] hover:text-white transition"
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
                      className="flex w-full items-center gap-2 px-2.5 py-2 rounded-xl text-[#34D399] hover:bg-[#164B3A] transition text-left"
                    >
                      <KeyRound className="h-3.5 w-3.5 text-[#34D399]" />
                      <span>Reset / Forgot Password</span>
                    </button>
                    <NavLink
                      to="/dashboard/income-ledger"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-[#A7C4B8] hover:bg-[#164B3A] hover:text-white transition"
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

        {/* Scrollable Main Content Area */}
        <main
          ref={mainContentRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative z-10 scrollbar-thin scrollbar-thumb-[#1E493B] hover:scrollbar-thumb-[#34D399]/40 scrollbar-track-transparent"
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

import { useState, useMemo, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Coins, LogOut, ShieldCheck, LayoutDashboard, Users, KeyRound, Lock,
  Network, ArrowDownToLine, ChevronLeft, ChevronRight, ReceiptText,
  TrendingUp, Gift, ChevronDown, Layers, LifeBuoy, Search, Menu,
  X, Bell, SlidersHorizontal, Sparkles, PanelLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import AmbientBackground from './dashboard/AmbientBackground.jsx';
import { ADMIN_ROUTES } from '../lib/adminConfig.js';

const TABS = [
  { tab: 'overview', to: `${ADMIN_ROUTES.DASHBOARD}?tab=overview`, label: 'Overview', Icon: LayoutDashboard },
  {
    tab: 'income-ledger',
    to: `${ADMIN_ROUTES.DASHBOARD}?tab=income-ledger`,
    label: 'Income Ledger',
    Icon: ReceiptText,
    children: [
      { category: 'all', to: `${ADMIN_ROUTES.DASHBOARD}?tab=income-ledger`, label: 'All Income', Icon: ReceiptText },
      { category: 'staking', to: `${ADMIN_ROUTES.DASHBOARD}?tab=income-ledger&category=staking`, label: 'Staking Yield', Icon: TrendingUp },
      { category: 'referral', to: `${ADMIN_ROUTES.DASHBOARD}?tab=income-ledger&category=referral`, label: 'Referral Bonus', Icon: Users },
      { category: 'promotional', to: `${ADMIN_ROUTES.DASHBOARD}?tab=income-ledger&category=promotional`, label: 'Airdrop Rewards', Icon: Gift },
      { category: 'unlocks', to: `${ADMIN_ROUTES.DASHBOARD}?tab=income-ledger&category=unlocks`, label: 'Capital Unlocks', Icon: KeyRound },
      { category: 'everything', to: `${ADMIN_ROUTES.DASHBOARD}?tab=income-ledger&category=everything`, label: 'All Platform Txns', Icon: Layers },
    ],
  },
  { tab: 'deposits', to: `${ADMIN_ROUTES.DASHBOARD}?tab=deposits`, label: 'USDT Deposits', Icon: Coins },
  { tab: 'stakes', to: `${ADMIN_ROUTES.DASHBOARD}?tab=stakes`, label: 'All Stakes', Icon: Lock },
  { tab: 'members', to: `${ADMIN_ROUTES.DASHBOARD}?tab=members`, label: 'Members', Icon: Users },
  { tab: 'tree', to: `${ADMIN_ROUTES.DASHBOARD}?tab=tree`, label: 'Member Tree', Icon: Network },
  { tab: 'support', to: `${ADMIN_ROUTES.DASHBOARD}?tab=support`, label: 'Support Desk', Icon: LifeBuoy },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mainContentRef = useRef(null);

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [mobileOpen, setMobileOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [headerSearch, setHeaderSearch] = useState('');
  const [incomeOpen, setIncomeOpen] = useState(true);

  useEffect(() => {
    setMobileOpen(false);
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.search, location.pathname]);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('admin_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const activeTab = new URLSearchParams(location.search).get('tab') || 'overview';
  const activeCategory = new URLSearchParams(location.search).get('category') || 'all';

  const handleLogout = () => {
    logout();
    navigate(ADMIN_ROUTES.LOGIN, { replace: true });
  };

  const activeTabLabel = useMemo(() => {
    if (activeTab === 'overview') return 'Overview Analytics';
    if (activeTab === 'income-ledger') {
      if (activeCategory === 'staking') return 'Income Ledger · Staking Yield';
      if (activeCategory === 'referral') return 'Income Ledger · Referral Bonus';
      if (activeCategory === 'promotional') return 'Income Ledger · Airdrop Rewards';
      if (activeCategory === 'unlocks') return 'Income Ledger · Capital Unlocks';
      if (activeCategory === 'everything') return 'Income Ledger · All Platform Txns';
      return 'Income Ledger · All Income';
    }
    if (activeTab === 'deposits') return 'USDT Deposits Management';
    if (activeTab === 'stakes') return 'All Stakes & Positions';
    if (activeTab === 'members') return 'Member Governance';
    if (activeTab === 'tree') return 'Member Tree & Hierarchy';
    if (activeTab === 'support') return 'Support Desk & Appeals';
    return 'Governance Portal';
  }, [activeTab, activeCategory]);

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
            <NavLink to={ADMIN_ROUTES.DASHBOARD} onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#34D399]/40 bg-gradient-to-br from-[#0B3327] to-[#041F18] shadow-[0_0_15px_rgba(52,211,153,0.25)]">
                <ShieldCheck className="h-5 w-5 text-[#34D399]" />
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-extrabold tracking-tight text-white font-mono leading-none">
                  QNDX <span className="text-[#34D399]">ADMIN</span>
                </span>
                <span className="text-[9px] font-mono tracking-widest uppercase text-[#34D399] font-bold">
                  Governance Portal
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
              placeholder="Search admin tabs..."
              className="w-full rounded-2xl border border-[#1E493B]/60 bg-[#07241C]/80 py-2.5 pl-9 pr-3 text-xs font-mono text-white placeholder-[#91A89E] outline-none transition focus:border-[#34D399] focus:bg-[#0B2E25] shadow-inner"
            />
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
            {filteredTabs.map((item) => {
              const { tab, to, label, Icon, children } = item;
              const hasChildren = Boolean(children?.length);
              const isGroupActive = location.pathname === ADMIN_ROUTES.DASHBOARD && activeTab === tab;

              if (!hasChildren) {
                return (
                  <NavLink
                    key={tab}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className={`group relative flex items-center rounded-2xl px-4 py-3 text-[13px] font-medium transition-all duration-200 ${
                      isGroupActive
                        ? 'border border-[#34D399]/25 bg-gradient-to-r from-black via-[#072A20] to-[#228B6B] text-white font-semibold shadow-[0_4px_20px_rgba(34,139,107,0.25)]'
                        : 'border border-transparent text-[#A7C4B8] hover:bg-[#164B3A]/60 hover:text-white hover:border-[#1E493B]/60'
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
                        : 'border border-transparent text-[#A7C4B8] hover:bg-[#164B3A]/60 hover:text-white hover:border-[#1E493B]/60'
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
                        const isSubActive = isGroupActive && activeCategory === sub.category;
                        return (
                          <NavLink
                            key={sub.category}
                            to={sub.to}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-mono transition-all duration-150 ${
                              isSubActive
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

          {/* Bottom Card */}
          <div className="mt-auto pt-3.5 border-t border-[#1E493B]/60 space-y-2">
            <div className="flex items-center gap-2.5 rounded-2xl border border-[#1E493B]/60 bg-[#07241C]/80 p-2.5 text-xs font-mono shadow-sm">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#059669]/20 border border-[#34D399]/30 text-[#34D399]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate text-xs text-white font-medium">{user?.email}</span>
                <span className="text-[10px] text-[#34D399] uppercase tracking-wider font-semibold">
                  Super Admin
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-2xl border border-transparent px-3 py-2.5 text-xs font-mono text-rose-400 hover:bg-rose-500/10 transition"
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
          <NavLink to={ADMIN_ROUTES.DASHBOARD} className="flex items-center gap-2.5 group min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#34D399]/40 bg-gradient-to-br from-[#0B3327] to-[#041F18] shadow-[0_0_15px_rgba(52,211,153,0.25)] group-hover:border-[#34D399] transition-all">
              <ShieldCheck className="h-4.5 w-4.5 text-[#34D399]" />
            </span>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-extrabold tracking-tight text-white font-mono leading-none truncate">
                  QNDX <span className="text-[#34D399]">ADMIN</span>
                </span>
                <span className="text-[9px] font-mono tracking-widest uppercase text-[#34D399] font-bold mt-0.5">
                  Governance Portal
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
              className="w-full rounded-2xl border border-[#1E493B]/60 bg-[#07241C]/80 py-2.5 pl-9 pr-3 text-xs font-mono text-white placeholder-[#91A89E] outline-none transition focus:border-[#34D399] focus:bg-[#0B2E25] shadow-inner"
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

        {/* Navigation Items (Exact Admin Palette + Gradient Glassmorphism Active Tab) */}
        <nav className="flex-1 w-full space-y-2 overflow-y-auto pr-0.5 scrollbar-none">
          {filteredTabs.map((item) => {
            const { tab, to, label, Icon, children } = item;
            const hasChildren = Boolean(children?.length);
            const isGroupActive = location.pathname === ADMIN_ROUTES.DASHBOARD && activeTab === tab;

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
                        : 'border border-transparent text-[#A7C4B8] hover:bg-[#164B3A]/60 hover:text-white hover:border-[#1E493B]/60'
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

            {/* Income Ledger with Subtabs */}
            return (
              <div key={tab} className="space-y-1">
                <div className="relative group">
                  <div
                    className={`flex items-center rounded-2xl text-[13px] font-medium transition-all duration-200 ${
                      collapsed ? 'justify-center p-3.5' : 'justify-between px-4 py-3'
                    } ${
                      isGroupActive
                        ? 'border border-[#34D399]/25 bg-gradient-to-r from-black via-[#072A20] to-[#228B6B] text-white font-semibold shadow-[0_4px_20px_rgba(34,139,107,0.25)]'
                        : 'border border-transparent text-[#A7C4B8] hover:bg-[#164B3A]/60 hover:text-white hover:border-[#1E493B]/60'
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
                          const isSubActive = isGroupActive && activeCategory === sub.category;
                          return (
                            <NavLink
                              key={sub.category}
                              to={sub.to}
                              className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs transition ${
                                isSubActive
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
                      const isSubActive = isGroupActive && activeCategory === sub.category;
                      return (
                        <NavLink
                          key={sub.category}
                          to={sub.to}
                          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-mono transition-all duration-150 ${
                            isSubActive
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

        {/* Footer Card */}
        <div className="w-full space-y-2 border-t border-[#1E493B]/60 pt-3.5 mt-auto shrink-0">
          <div
            className={`flex items-center rounded-2xl border border-[#1E493B]/60 bg-[#07241C]/80 hover:border-[#34D399]/50 transition ${
              collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2.5'
            } shadow-sm backdrop-blur-md`}
            title={collapsed ? `${user?.email} (${user?.role})` : undefined}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#059669]/20 border border-[#34D399]/30 text-[#34D399]">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate text-xs font-mono font-medium text-white">
                  {user?.email}
                </span>
                <span className="text-[10px] font-mono text-[#34D399] uppercase tracking-wider font-semibold">
                  Super Admin
                </span>
              </div>
            )}
          </div>

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

            {/* Active Breadcrumb / Section Label */}
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
                placeholder="Search members, ledger, stakes, deposits..."
                className="w-full rounded-full border border-[#1E493B] bg-[#0B2720] py-1.5 pl-10 pr-4 text-xs font-mono text-white placeholder-[#91A89E] outline-none transition focus:border-[#34D399] focus:bg-[#10352C] focus:ring-1 focus:ring-[#34D399]/40 shadow-inner"
              />
            </div>
          </div>

          {/* Right Side: Quick Actions & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Helpdesk Dispatch Shortcut */}
            <NavLink
              to={`${ADMIN_ROUTES.DASHBOARD}?tab=support`}
              className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-[#1E493B] bg-[#0B2720] text-[#A7C4B8] hover:border-[#34D399]/40 hover:text-white transition"
              title="Helpdesk Dispatch"
            >
              <LifeBuoy className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#34D399] shadow-[0_0_8px_#34D399]" />
            </NavLink>

            {/* Income Ledger Shortcut */}
            <NavLink
              to={`${ADMIN_ROUTES.DASHBOARD}?tab=income-ledger`}
              className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg border border-[#1E493B] bg-[#0B2720] text-[#A7C4B8] hover:border-[#34D399]/40 hover:text-white transition"
              title="Income Ledger Analytics"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </NavLink>

            {/* Super Admin Profile Pill */}
            <div className="flex items-center gap-2 rounded-full border border-[#1E493B] bg-[#0B2720] p-1 pr-2.5">
              <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-[#059669] to-[#34D399] text-xs font-bold font-mono text-[#071C18] shadow-sm">
                {user?.email ? user.email.slice(0, 1).toUpperCase() : 'A'}
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-[#0B2720] bg-[#34D399]" />
              </div>
              <span className="hidden xl:inline text-xs font-mono font-medium text-white max-w-[110px] truncate">
                {user?.email ? user.email.split('@')[0] : 'Admin'}
              </span>
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
    </div>
  );
};

export default AdminLayout;

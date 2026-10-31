import { useState, useMemo, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Coins, LogOut, ShieldCheck, LayoutDashboard, Users, KeyRound, Lock,
  Network, ArrowDownToLine, ChevronLeft, ChevronRight, ReceiptText,
  TrendingUp, Gift, ChevronDown, Layers, LifeBuoy, Search, Menu,
  X, Bell, SlidersHorizontal, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
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
    <div className="min-h-screen bg-[#041A14] text-[#ECFDF5] flex flex-col font-sans selection:bg-[#34D399]/30">
      {/* ================= 1. TOP HEADER BAR ================= */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[#144234]/70 bg-[#06241D]/90 px-4 sm:px-6 backdrop-blur-2xl">
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

          <NavLink to={ADMIN_ROUTES.DASHBOARD} className="flex items-center gap-2.5 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#34D399]/40 bg-gradient-to-br from-[#0B3327] to-[#041F18] shadow-[0_0_15px_rgba(52,211,153,0.25)] group-hover:border-[#34D399] transition-all">
              <ShieldCheck className="h-5 w-5 text-[#34D399]" />
            </span>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-white font-mono leading-none">
                QNDX <span className="text-[#34D399]">ADMIN</span>
              </span>
              <span className="text-[9px] font-mono tracking-widest uppercase text-[#34D399] font-bold">
                Governance Portal
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
              placeholder="Search members, ledger, stakes, deposits..."
              className="w-full rounded-full border border-[#164336] bg-[#07251D]/90 py-2 pl-10 pr-4 text-xs font-mono text-white placeholder-[#719183] outline-none transition focus:border-[#34D399] focus:bg-[#0B3327] focus:ring-1 focus:ring-[#34D399]/40 shadow-inner"
            />
          </div>
        </div>

        {/* Right: Actions + Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <NavLink
            to={`${ADMIN_ROUTES.DASHBOARD}?tab=support`}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#164336] bg-[#07241C] text-[#8EA99D] hover:border-[#34D399]/40 hover:text-white transition"
            title="Helpdesk Dispatch"
          >
            <LifeBuoy className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#34D399] shadow-[0_0_8px_#34D399]" />
          </NavLink>

          <NavLink
            to={`${ADMIN_ROUTES.DASHBOARD}?tab=income-ledger`}
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border border-[#164336] bg-[#07241C] text-[#8EA99D] hover:border-[#34D399]/40 hover:text-white transition"
            title="Income Ledger Analytics"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </NavLink>

          <div className="flex items-center gap-2 rounded-full border border-[#1E5243] bg-[#07241C] p-1 pr-2.5">
            <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#059669] to-[#34D399] text-xs font-bold font-mono text-[#041A14] shadow-sm">
              {user?.email ? user.email.slice(0, 1).toUpperCase() : 'A'}
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-[#07241C] bg-[#34D399]" />
            </div>
            <span className="hidden xl:inline text-xs font-mono font-medium text-white max-w-[110px] truncate">
              {user?.email ? user.email.split('@')[0] : 'Admin'}
            </span>
          </div>
        </div>
      </header>

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
          className={`fixed top-16 bottom-0 left-0 z-40 flex flex-col border-r border-[#144234]/70 bg-gradient-to-b from-[#06241D] via-[#05201A] to-[#041A14] py-5 transition-all duration-300 md:translate-x-0 ${
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
                className="w-full rounded-2xl border border-[#164336] bg-[#07251D] py-2.5 pl-9 pr-3 text-xs font-mono text-white placeholder-[#719183] outline-none transition focus:border-[#34D399] focus:bg-[#0B3327] shadow-inner"
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

          {/* Navigation Items */}
          <nav className="flex-1 w-full space-y-2 overflow-y-auto scrollbar-none pr-0.5">
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
                        collapsed ? 'justify-center p-3.5' : 'justify-between px-4 py-3'
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

              // Income Ledger with Subtabs
              return (
                <div key={tab} className="space-y-1">
                  <div className="relative group">
                    <div
                      className={`flex items-center rounded-2xl text-[13px] font-medium transition-all duration-200 ${
                        collapsed ? 'justify-center p-3.5' : 'justify-between px-4 py-3'
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
                            const isSubActive = isGroupActive && activeCategory === sub.category;
                            return (
                              <NavLink
                                key={sub.category}
                                to={sub.to}
                                className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs transition ${
                                  isSubActive
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
                        const isSubActive = isGroupActive && activeCategory === sub.category;
                        return (
                          <NavLink
                            key={sub.category}
                            to={sub.to}
                            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-mono transition-all duration-150 ${
                              isSubActive
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
          <div className="w-full space-y-2 border-t border-[#144234]/70 pt-3.5 mt-2">
            <div
              className={`flex items-center rounded-2xl border border-[#164336] bg-[#07241C] ${
                collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2.5'
              }`}
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
                  <span className="text-[10px] font-mono text-[#34D399] uppercase tracking-wider">
                    Super Admin
                  </span>
                </div>
              )}
            </div>

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
    </div>
  );
};

export default AdminLayout;

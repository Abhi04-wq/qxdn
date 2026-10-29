import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Coins, LogOut, ShieldCheck, LayoutDashboard, Users, KeyRound, Lock, Network, ArrowDownToLine } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const TABS = [
  { tab: 'overview', to: '/admin/dashboard?tab=overview', label: 'Overview', Icon: LayoutDashboard },
  { tab: 'deposits', to: '/admin/dashboard?tab=deposits', label: 'USDT Deposits', Icon: Coins },
  { tab: 'stakes', to: '/admin/dashboard?tab=stakes', label: 'All Stakes', Icon: Lock },
  { tab: 'members', to: '/admin/dashboard?tab=members', label: 'Members', Icon: Users },
  { tab: 'tree', to: '/admin/dashboard?tab=tree', label: 'Member Tree', Icon: Network },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = new URLSearchParams(location.search).get('tab') || 'overview';

  const linkCls = (isActive) =>
    `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
      isActive
        ? 'border border-amber-400/30 bg-amber-400/10 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.15)]'
        : 'border border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
    }`;

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-slate-800 bg-slate-950/80 px-4 py-6 md:flex">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/30 bg-slate-900 shadow-[0_0_20px_rgba(251,191,36,0.2)]">
            <ShieldCheck className="h-5 w-5 text-amber-400" />
          </span>
          <span className="text-sm font-bold tracking-tight text-white">
            QNDX <span className="text-amber-400">Admin</span>
          </span>
        </div>

        <nav className="flex-1 space-y-1">
          {TABS.map(({ tab, to, label, Icon }) => (
            <NavLink key={tab} to={to} className={() => linkCls(location.pathname === '/admin/dashboard' && activeTab === tab)}>
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
          <NavLink to="/admin/withdrawals" className={() => linkCls(location.pathname === '/admin/withdrawals')}>
            <ArrowDownToLine className="h-4 w-4" />
            Payouts & Withdrawals
          </NavLink>
          <NavLink to="/admin/dashboard?tab=referrals" className={() => linkCls(location.pathname === '/admin/dashboard' && activeTab === 'referrals')}>
            <KeyRound className="h-4 w-4" />
            Referral Link
          </NavLink>
        </nav>

        <div className="space-y-3 border-t border-slate-800 pt-4">
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-400">
              <ShieldCheck className="h-3 w-3" />
              admin
            </span>
            <span className="truncate text-[11px] text-slate-500">{user.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950/95 px-4 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-amber-400" />
          <span className="text-sm font-bold text-white">QNDX Admin</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-1.5 rounded-lg border border-slate-800 px-2.5 py-1.5 text-xs text-slate-400">
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="flex-1 md:ml-56">
        <div className="h-14 md:hidden" />
        {/* Mobile tab row */}
        <div className="flex gap-2 overflow-x-auto border-b border-slate-800 bg-slate-950/60 px-4 py-2 md:hidden">
          {TABS.map(({ tab, label }) => (
            <NavLink key={tab} to={`/admin/dashboard?tab=${tab}`} className={() => `whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs ${location.pathname === '/admin/dashboard' && activeTab === tab ? 'border-amber-400/30 bg-amber-400/10 text-amber-300' : 'border-slate-800 text-slate-400'}`}>
              {label}
            </NavLink>
          ))}
          <NavLink to="/admin/withdrawals" className={() => `whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs ${location.pathname === '/admin/withdrawals' ? 'border-amber-400/30 bg-amber-400/10 text-amber-300' : 'border-slate-800 text-slate-400'}`}>
            Payouts & Withdrawals
          </NavLink>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;

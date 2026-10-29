import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Coins, LogOut, ShieldCheck, LayoutDashboard, Wallet, TrendingUp, UserCircle, Users, Network, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/dashboard/deposit', label: 'Deposit USDT', Icon: Wallet },
  { to: '/dashboard/withdraw', label: 'Withdraw', Icon: ArrowUpRight },
  { to: '/dashboard/staking', label: 'My Staking', Icon: TrendingUp },
  { to: '/dashboard/referrals', label: 'Referrals', Icon: Users },
  { to: '/dashboard/team', label: 'My Team', Icon: Network },
  { to: '/profile', label: 'Profile', Icon: UserCircle },
];

const linkCls = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? 'border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
      : 'border border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
  }`;

const MemberLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200">
      {/* Sidebar - desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-slate-800 bg-slate-950/80 px-4 py-6 md:flex">
        <NavLink to="/dashboard" className="mb-8 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/30 bg-slate-900 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
            <Coins className="h-5 w-5 text-cyan-400" />
          </span>
          <span className="text-sm font-bold tracking-tight text-white">
            QNDX <span className="text-cyan-400">Staking</span>
          </span>
        </NavLink>

        <nav className="flex-1 space-y-1">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkCls}>
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-3 border-t border-slate-800 pt-4">
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-cyan-400">
              <ShieldCheck className="h-3 w-3" />
              {user.role}
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

      {/* Mobile top nav */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950/95 px-4 backdrop-blur md:hidden">
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-cyan-400" />
          <span className="text-sm font-bold text-white">QNDX</span>
        </NavLink>
        <nav className="flex items-center gap-2">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs ${isActive ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300' : 'border-slate-800 text-slate-400'}`}>
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
          <button onClick={handleLogout} className="flex items-center gap-1.5 rounded-lg border border-slate-800 px-2.5 py-1.5 text-xs text-slate-400">
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </nav>
      </header>

      <div className="flex-1 md:ml-56">
        <div className="h-14 md:hidden" />
        <Outlet />
      </div>
    </div>
  );
};

export default MemberLayout;

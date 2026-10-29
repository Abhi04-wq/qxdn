import { useAuth } from '../context/AuthContext.jsx';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import DashboardLoginLink from './DashboardLoginLink.jsx';

const AdminRoute = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (user.role !== 'admin') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-4 text-center">
        <ShieldAlert className="h-12 w-12 text-red-400" />
        <div>
          <p className="text-lg font-semibold text-white">Admin access required</p>
          <p className="mt-1 text-sm text-slate-400">
            Your account is not an admin. Sign in with an admin account to view this page.
          </p>
        </div>
        <DashboardLoginLink />
      </div>
    );
  }

  return <Outlet />;
};

export default AdminRoute;

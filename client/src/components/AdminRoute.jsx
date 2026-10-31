import { useAuth } from '../context/AuthContext.jsx';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import DashboardLoginLink from './DashboardLoginLink.jsx';
import { ADMIN_ROUTES } from '../lib/adminConfig.js';

const AdminRoute = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#071C18]">
        <Loader2 className="h-10 w-10 animate-spin text-[#34D399]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ADMIN_ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  if (user.role !== 'admin') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#071C18] px-4 text-center">
        <ShieldAlert className="h-12 w-12 text-rose-400" />
        <div>
          <p className="text-lg font-bold text-[#ECFDF5]">Admin access required</p>
          <p className="mt-1 text-sm text-[#A7C4B8]">
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

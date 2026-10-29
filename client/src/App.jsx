import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import MemberLayout from './components/MemberLayout.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import Login from './pages/Login.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminMemberDetail from './pages/AdminMemberDetail.jsx';
import AdminWithdrawals from './pages/AdminWithdrawals.jsx';
import Register from './pages/Register.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import Profile from './pages/Profile.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Deposit from './pages/Deposit.jsx';
import WithdrawPage from './pages/WithdrawPage.jsx';
import StakingPage from './pages/StakingPage.jsx';
import ReferralsPage from './pages/Referrals.jsx';

const Gate = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return <Navigate to={user ? (user.role === 'admin' ? '/admin/dashboard' : '/dashboard') : '/login'} replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
          <Route path="/admin/member/:userId" element={<AdminMemberDetail />} />
        </Route>
      </Route>
      <Route element={<PrivateRoute />}>
        <Route element={<MemberLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/deposit" element={<Deposit />} />
          <Route path="/dashboard/withdraw" element={<WithdrawPage />} />
          <Route path="/dashboard/staking" element={<StakingPage />} />
          <Route path="/dashboard/referrals" element={<ReferralsPage />} />
          <Route path="/dashboard/team" element={<ReferralsPage />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>
      <Route path="*" element={<Gate />} />
    </Routes>
  );
}

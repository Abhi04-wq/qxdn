import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Coins, LogOut, ShieldCheck, User, Users, Link2, MailCheck,
  BadgeCheck, CalendarDays, Copy, Check, KeyRound, Lock, Sparkles
} from 'lucide-react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Toast from '../components/Toast.jsx';
import ResetPasswordModal from '../components/ResetPasswordModal.jsx';

const InfoRow = ({ Icon, label, value, mono, actions }) => (
  <div className="group relative flex items-center justify-between gap-4 rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] px-5 py-4 shadow-card-gold transition-all duration-300 hover:border-[#D4AF37]/70 hover:shadow-[0_8px_35px_rgba(212,175,55,0.2)]">
    <div className="flex items-center gap-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F1D78A] shadow-inner transition group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.4)]">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#F1D78A]">{label}</p>
        <p className={`mt-0.5 text-sm font-bold text-[#ECFDF5] ${mono ? 'font-mono text-gold-gradient' : ''}`}>{value}</p>
      </div>
    </div>
    {actions}
  </div>
);

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(user);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState('');
  const [resetModalOpen, setResetModalOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/auth/me');
        setProfile(data.data);
      } catch {
        /* interceptor handles 401 */
      }
    })();
  }, []);

  const copyReferral = async () => {
    const code = profile?.referralCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setToast('Referral code copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setToast('Copy failed');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const copyBtn = (
    <button onClick={copyReferral} className="flex items-center gap-1.5 rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-3 py-1.5 text-xs font-semibold text-[#F1D78A] transition hover:bg-gold-gradient hover:text-[#071C18]">
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );

  return (
    <div className="text-[#ECFDF5]">
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#ECFDF5]">My Profile</h2>
            <p className="mt-1 text-sm text-[#91A89E]">Account details and referral information</p>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-4">
          <InfoRow Icon={User} label="Email" value={profile?.email ?? '-'} />
          <InfoRow
            Icon={BadgeCheck}
            label="Email Status"
            value={profile?.isEmailVerified ? 'Verified' : 'Pending verification'}
          />
          <InfoRow Icon={Users} label="Sponsor ID" value={profile?.sponsorCode ?? 'Direct sign-up'} mono />
          <InfoRow Icon={Link2} label="My Referral Code" value={profile?.referralCode ?? '-'} mono actions={copyBtn} />
          <InfoRow
            Icon={CalendarDays}
            label="Member Since"
            value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}
          />
          <div className="group rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] px-5 py-4 shadow-card-gold transition-all duration-300 hover:border-[#D4AF37]/60">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F1D78A]">
                <MailCheck className="h-4 w-4" />
              </span>
              <p className="text-sm font-medium text-[#ECFDF5]">
                {profile?.isEmailVerified
                  ? 'Your email is verified — full access unlocked.'
                  : 'Verify your email to unlock staking features.'}
              </p>
            </div>
          </div>
        </section>

        {/* Security & Password Section */}
        <div className="mt-8">
          <div className="mb-4">
            <h3 className="text-lg font-bold tracking-tight text-[#ECFDF5]">Security & Password</h3>
            <p className="mt-0.5 text-xs text-[#91A89E]">Manage your credentials or recover your forgotten password</p>
          </div>

          <div className="rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] p-5 shadow-card-gold backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E493B] pb-4 mb-4">
              <div className="flex items-center gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#34D399]/40 bg-[#34D399]/15 text-[#34D399] shadow-inner">
                  <KeyRound className="h-5 w-5" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Password Protection</h4>
                  <p className="text-xs text-[#A7C4B8] mt-0.5">Secure your protocol staking account and financial withdrawals.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setResetModalOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-[#34D399]/60 bg-gradient-to-r from-[#10B981] via-[#059669] to-[#047857] px-4 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(52,211,153,0.35)] transition hover:brightness-110 font-mono"
              >
                <KeyRound className="h-4 w-4" />
                <span>Forgot / Reset Password (Email OTP)</span>
              </button>

              <button
                type="button"
                onClick={() => setResetModalOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-[#1E493B] bg-[#071C18] px-4 py-2.5 text-xs font-bold text-[#A7B8AE] hover:text-white hover:border-[#34D399]/40 transition font-mono"
              >
                <Lock className="h-4 w-4 text-[#F1D78A]" />
                <span>Change Password</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        initialEmail={profile?.email || user?.email}
        isAuthenticated={true}
        onSuccess={(msg) => {
          setToast(msg);
          setResetModalOpen(false);
        }}
      />

      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  );
};

export default Profile;

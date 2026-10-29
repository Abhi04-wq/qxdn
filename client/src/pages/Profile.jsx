import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, LogOut, ShieldCheck, User, Users, Link2, MailCheck, BadgeCheck, CalendarDays, Copy, Check } from 'lucide-react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Toast from '../components/Toast.jsx';

const InfoRow = ({ Icon, label, value, mono, actions }) => (
  <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
    <div className="flex items-center gap-3">
      <span className="rounded-lg border border-slate-800 bg-slate-900 p-2">
        <Icon className="h-4 w-4 text-cyan-400" />
      </span>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
        <p className={`text-sm text-slate-200 ${mono ? 'font-mono' : ''}`}>{value}</p>
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
    <button onClick={copyReferral} className="flex items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-400 transition hover:bg-cyan-400/20">
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );

  return (
    <div className="text-slate-200">
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">My Profile</h2>
            <p className="mt-1 text-sm text-slate-500">Account details and referral information</p>
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
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <MailCheck className="h-4 w-4 text-emerald-400" />
              <p className="text-sm text-emerald-300">
                {profile?.isEmailVerified
                  ? 'Your email is verified - full access unlocked.'
                  : 'Verify your email to unlock staking features.'}
              </p>
            </div>
          </div>
        </section>
      </main>

      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  );
};

export default Profile;

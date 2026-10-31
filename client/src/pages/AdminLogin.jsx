import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Mail, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { ADMIN_ROUTES } from '../lib/adminConfig.js';

const VALIDATION = {
  email: (v) => (!v ? 'Email is required' : !/^\S+@\S+\.\S+$/.test(v) ? 'Enter a valid email address' : ''),
  password: (v) => (!v ? 'Password is required' : ''),
};

const AdminLogin = () => {
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = Object.fromEntries(Object.entries(VALIDATION).map(([k, fn]) => [k, fn(form[k])]));
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setSubmitting(true);
    try {
      await loginAdmin(form.email, form.password);
      navigate(location.state?.from?.pathname || ADMIN_ROUTES.DASHBOARD, { replace: true });
    } catch (error) {
      setServerError(error.response?.data?.message || 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const field = (invalid) =>
    `w-full rounded-xl border bg-[#0B2720] py-2.5 pl-10 pr-4 text-sm text-[#ECFDF5] placeholder-[#91A89E] outline-none transition focus:border-[#34D399] focus:ring-1 focus:ring-[#34D399] ${
      invalid ? 'border-red-500/60' : 'border-[#1E493B]'
    }`;

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#071C18] px-4 py-12 text-[#ECFDF5]">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#34D399]/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-12 bottom-8 h-56 w-56 rounded-full bg-[#10352C]/60 blur-[100px]" />

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F1D78A] shadow-[0_0_25px_rgba(212,175,55,0.3)]">
            <ShieldCheck className="h-7 w-7 text-[#F1D78A]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#ECFDF5]">
            QNDX <span className="text-gold-gradient">Admin</span> Portal
          </h1>
          <p className="mt-1 text-sm text-[#A7C4B8]">Restricted access — administrators only</p>
        </div>

        <div className="rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] p-6 shadow-card-gold backdrop-blur-md transition-all duration-300 hover:border-[#D4AF37]/60 sm:p-8">
          {serverError && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#ECFDF5]">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#91A89E]" />
                <input id="email" name="email" type="email" autoComplete="username" placeholder="admin@qndx.io" value={form.email} onChange={handleChange} className={field(errors.email)} />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#ECFDF5]">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#91A89E]" />
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" value={form.password} onChange={handleChange} className={`${field(errors.password)} pr-10`} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#91A89E] transition hover:text-[#ECFDF5]">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/60 bg-gradient-to-r from-[#D4AF37] via-[#F5D98E] to-[#D4AF37] py-2.5 text-sm font-bold font-mono text-[#020B08] shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all hover:brightness-110 hover:shadow-[0_0_35px_rgba(212,175,55,0.6)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#020B08]" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 text-[#020B08]" />
                  <span>Sign In to Admin</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#A7C4B8]">
            Member?{' '}
            <Link to="/login" className="font-semibold text-[#34D399] hover:text-[#6EE7B7]">
              Member sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

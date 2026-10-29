import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Mail, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

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
      navigate(location.state?.from?.pathname || '/admin/dashboard', { replace: true });
    } catch (error) {
      setServerError(error.response?.data?.message || 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const field = (invalid) =>
    `w-full rounded-lg border bg-slate-950/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 ${
      invalid ? 'border-red-500/60' : 'border-slate-700/80'
    }`;

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-red-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-12 bottom-8 h-56 w-56 rounded-full bg-indigo-600/20 blur-[100px]" />

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-400/30 bg-slate-900 shadow-[0_0_30px_rgba(248,113,113,0.2)]">
            <ShieldCheck className="h-7 w-7 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            QNDX <span className="text-red-400">Admin</span> Portal
          </h1>
          <p className="mt-1 text-sm text-slate-400">Restricted access - administrators only</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm sm:p-8">
          {serverError && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input id="email" name="email" type="email" autoComplete="username" placeholder="admin@qndx.io" value={form.email} onChange={handleChange} className={field(errors.email)} />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" value={form.password} onChange={handleChange} className={`${field(errors.password)} pr-10`} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
            </div>

            <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-red-500 py-2.5 text-sm font-semibold text-slate-950 transition hover:shadow-[0_0_25px_rgba(248,113,113,0.3)] disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Sign In to Admin'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Member?{' '}
            <Link to="/login" className="font-medium text-cyan-400 hover:text-cyan-300">
              Member sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

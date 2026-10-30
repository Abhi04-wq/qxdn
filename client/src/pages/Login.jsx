import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Mail, AlertCircle, Coins, LogIn, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const Login = () => {
  const { loginMember } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const next = {};
    if (!form.email) next.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address';
    if (!form.password) next.password = 'Password is required';
    return next;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      await loginMember(form.email, form.password);
      navigate('/dashboard', { replace: true });
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
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#34D399]/15 blur-[120px]" />
      <div className="pointer-events-none absolute right-12 bottom-8 h-56 w-56 rounded-full bg-[#10352C]/60 blur-[100px]" />

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F1D78A] shadow-[0_0_25px_rgba(212,175,55,0.3)]">
            <Coins className="h-7 w-7 text-[#F1D78A]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#ECFDF5]">
            QNDX <span className="text-gold-gradient">Staking</span>
          </h1>
          <p className="mt-1 text-sm text-[#A7C4B8]">Sign in to your member dashboard</p>
        </div>

        <div className="rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] p-6 shadow-card-gold backdrop-blur-md transition-all duration-300 hover:border-[#D4AF37]/60 sm:p-8">
          {serverError && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="text-sm">{serverError}</span>
              </div>
              {serverError.toLowerCase().includes('verify') && (
                <Link
                  to={`/verify-email?email=${encodeURIComponent(form.email)}`}
                  className="mt-2 ml-7 inline-flex items-center gap-1.5 text-xs font-semibold text-[#34D399] hover:text-[#6EE7B7]"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Open verification page
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#ECFDF5]">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#91A89E]" />
                <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={handleChange} className={field(errors.email)} />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#ECFDF5]">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#91A89E]" />
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" value={form.password} onChange={handleChange} className={`${field(errors.password)} pr-10`} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#91A89E] transition hover:text-[#ECFDF5]">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
            </div>

            <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient py-2.5 text-sm font-bold text-[#071C18] transition hover:brightness-110 hover:shadow-[0_0_25px_rgba(212,175,55,0.35)] disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#071C18]" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3 text-xs text-[#91A89E]">
            <div className="h-px flex-1 bg-[#1E493B]" />
            <span>new to qndx?</span>
            <div className="h-px flex-1 bg-[#1E493B]" />
          </div>

          <p className="mt-5 text-center text-sm text-[#A7C4B8]">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-[#34D399] hover:text-[#6EE7B7]">
              Register with sponsor ID
            </Link>
          </p>
          <p className="mt-2 text-center text-xs text-[#91A89E]">
            Admin? <Link to="/admin/login" className="text-[#A7C4B8] hover:text-[#34D399]">Admin portal</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

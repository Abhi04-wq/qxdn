import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Mail, AlertCircle, Coins, UserPlus, CheckCircle2, Link2, LockKeyhole, KeyRound, ArrowRight, RotateCw } from 'lucide-react';
import api from '../lib/api.js';
import otpApi from '../lib/otpApi.js';

const RESEND_COOLDOWN_SECONDS = 60;

const Register = () => {
  const [searchParams] = useSearchParams();
  const lockedSponsor = useMemo(() => searchParams.get('ref') || '', [searchParams]);

  const [step, setStep] = useState('form'); // form | otp | verified
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', sponsorCode: lockedSponsor });
  const [otp, setOtp] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpNotice, setOtpNotice] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = (values) => {
    const next = {};
    if (!values.email) next.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(values.email)) next.email = 'Enter a valid email address';
    if (!values.password) next.password = 'Password is required';
    else if (values.password.length < 8) next.password = 'At least 8 characters required';
    if (!values.confirmPassword) next.confirmPassword = 'Please confirm your password';
    else if (values.password !== values.confirmPassword) next.confirmPassword = 'Passwords do not match';
    if (!values.sponsorCode) next.sponsorCode = 'Sponsor ID is required';
    return next;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = validate(form);
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setSubmitting(true);
    try {
      const { data } = await api.post('/api/auth/register-with-referral', {
        email: form.email,
        password: form.password,
        sponsorCode: form.sponsorCode,
      });
      setOtpEmail(data.data.email);
      setOtpNotice(data.message);
      setOtp('');
      setOtpError('');
      setStep('otp');
    } catch (error) {
      setServerError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      setOtpError('Enter the 6-digit code from your email');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      await otpApi.verifyOtp({ email: otpEmail, otp: otp.trim() });
      setStep('verified');
    } catch (error) {
      setOtpError(error.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending || cooldown > 0) return;
    setResending(true);
    setOtpError('');
    try {
      await otpApi.resendOtp(otpEmail);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      const timer = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) clearInterval(timer);
          return c - 1;
        });
      }, 1000);
    } catch (error) {
      setOtpError(error.response?.data?.message || 'Could not resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const field = (invalid, extra = '') =>
    `w-full rounded-xl border bg-[#0B2720] py-2.5 pl-10 pr-4 text-sm text-[#ECFDF5] placeholder-[#91A89E] outline-none transition focus:border-[#34D399] focus:ring-1 focus:ring-[#34D399] ${
      invalid ? 'border-red-500/60' : 'border-[#1E493B]'
    } ${extra}`;

  if (step === 'verified') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#071C18] px-4 text-[#ECFDF5]">
        <div className="w-full max-w-md rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] p-8 text-center shadow-card-gold backdrop-blur">
          <CheckCircle2 className="mx-auto h-12 w-12 text-[#F1D78A]" />
          <h2 className="mt-4 text-xl font-bold text-[#ECFDF5]">Email Verified!</h2>
          <p className="mt-2 text-sm text-[#A7C4B8]">
            Your account is now active. Sign in to access your staking dashboard.
          </p>
          <Link
            to="/login"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#10B981] via-[#059669] to-[#047857] py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(52,211,153,0.35)] transition-all hover:brightness-110 hover:shadow-[0_0_30px_rgba(52,211,153,0.55)]"
          >
            Go to Member Login
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#071C18] px-4 text-[#ECFDF5]">
        <div className="w-full max-w-md rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] p-8 shadow-card-gold backdrop-blur">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F1D78A] shadow-[0_0_25px_rgba(212,175,55,0.3)]">
            <KeyRound className="h-7 w-7 text-[#F1D78A]" />
          </div>
          <h2 className="text-center text-xl font-bold text-[#ECFDF5]">Verification email sent</h2>
          <p className="mt-2 text-center text-sm text-[#A7C4B8]">
            {otpNotice || `Enter the 6-digit code sent to ${otpEmail}`}
          </p>

          {otpNotice?.startsWith('SMTP is not configured') && (
            <div className="mt-3 rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/10 p-3 text-xs text-[#F1D78A]">
              Server Alert: {otpNotice}
            </div>
          )}

          {otpError && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{otpError}</span>
            </div>
          )}

          <form onSubmit={handleVerifyOtp} noValidate className="mt-5 space-y-4">
            <input
              autoFocus
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, ''));
                setOtpError('');
              }}
              className="w-full rounded-xl border border-[#1E493B] bg-[#0B2720] py-3 text-center text-2xl font-mono tracking-[0.5em] text-[#34D399] outline-none transition placeholder-[#91A89E] focus:border-[#34D399] focus:ring-1 focus:ring-[#34D399]"
            />
            <button
              type="submit"
              disabled={otpLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#10B981] via-[#059669] to-[#047857] py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(52,211,153,0.35)] transition-all hover:brightness-110 hover:shadow-[0_0_30px_rgba(52,211,153,0.55)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {otpLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Verifying...</span>
                </>
              ) : (
                'Verify Email'
              )}
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-[#91A89E]">
            Didn&apos;t receive a code?{' '}
            {cooldown > 0 ? (
              <span className="text-[#91A89E]">Retry in {cooldown}s</span>
            ) : (
              <button onClick={handleResend} disabled={resending} className="inline-flex items-center gap-1 font-semibold text-[#34D399] hover:text-[#6EE7B7] disabled:opacity-50">
                <RotateCw className={`h-3 w-3 ${resending ? 'animate-spin' : ''}`} />
                Resend code
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

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
            QNDX <span className="text-gold-gradient">Register</span>
          </h1>
          <p className="mt-1 text-sm text-[#A7C4B8]">
            {lockedSponsor ? 'Invited by your sponsor — sponsor ID locked' : 'Create your member account'}
          </p>
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
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Minimum 8 characters" value={form.password} onChange={handleChange} className={`${field(errors.password)} pr-10`} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#91A89E] transition hover:text-[#ECFDF5]">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-[#ECFDF5]">Confirm Password</label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#91A89E]" />
                <input id="confirmPassword" name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Repeat your password" value={form.confirmPassword} onChange={handleChange} className={field(errors.confirmPassword)} />
              </div>
              {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword}</p>}
            </div>

            <div>
              <label htmlFor="sponsorCode" className="mb-1.5 block text-sm font-medium text-[#ECFDF5]">Sponsor ID</label>
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#91A89E]" />
                <input
                  id="sponsorCode"
                  name="sponsorCode"
                  type="text"
                  placeholder="QNDX-XXXXXXXX"
                  value={form.sponsorCode}
                  onChange={handleChange}
                  readOnly={Boolean(lockedSponsor)}
                  className={`${field(errors.sponsorCode, lockedSponsor ? 'cursor-not-allowed text-[#34D399] font-bold' : '')}`}
                />
              </div>
              {lockedSponsor && (
                <p className="mt-1.5 text-xs text-[#91A89E]">
                  Pre-filled from your invite link <Link2 className="inline h-3 w-3 text-[#34D399]" /> (locked)
                </p>
              )}
              {errors.sponsorCode && <p className="mt-1.5 text-xs text-red-400">{errors.sponsorCode}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#10B981] via-[#059669] to-[#047857] py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(52,211,153,0.35)] transition-all hover:brightness-110 hover:shadow-[0_0_30px_rgba(52,211,153,0.55)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 text-white" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#A7C4B8]">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-[#34D399] hover:text-[#6EE7B7]">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

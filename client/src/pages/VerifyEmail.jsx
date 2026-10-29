import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, KeyRound, AlertCircle, RotateCw, ArrowRight } from 'lucide-react';
import otpApi from '../lib/otpApi.js';

const RESEND_COOLDOWN_SECONDS = 60;

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }
    if (otp.trim().length !== 6) {
      setError('Enter the 6-digit code from your email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await otpApi.verifyOtp({ email, otp: otp.trim() });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending || cooldown > 0 || !email) {
      if (!email) setError('Enter your email first to resend a code');
      return;
    }
    setResending(true);
    setError('');
    try {
      const { data } = await otpApi.resendOtp(email);
      setInfo(data.message);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      const timer = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) clearInterval(timer);
          return c - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-8 text-center shadow-xl backdrop-blur">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/30 bg-slate-900">
            <KeyRound className="h-7 w-7 text-emerald-400" />
          </span>
          <h2 className="mt-4 text-xl font-bold text-white">Email Verified!</h2>
          <p className="mt-2 text-sm text-slate-400">You can now sign in with your credentials.</p>
          <Link
            to="/login"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 py-2.5 text-sm font-semibold text-slate-950 transition hover:shadow-[0_0_25px_rgba(34,211,238,0.35)]"
          >
            Go to Member Login
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl backdrop-blur">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-slate-900 shadow-[0_0_30px_rgba(34,211,238,0.25)]">
          <KeyRound className="h-7 w-7 text-cyan-400" />
        </div>
        <h2 className="text-center text-xl font-bold text-white">Verify Your Email</h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Enter the 6-digit code we emailed you to activate your account.
        </p>

        {info && (
          <div className={`mt-4 rounded-lg border p-3 text-sm ${info.startsWith('SMTP is not configured') ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-emerald-500/30 bg-green-500/10 text-emerald-300'}`}>
            {info}
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="mt-5 space-y-4">
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-700/80 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
          />
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, ''));
              setError('');
            }}
            className="w-full rounded-lg border border-slate-700/80 bg-slate-950 py-3 text-center text-2xl font-mono tracking-[0.5em] text-cyan-300 outline-none transition placeholder-slate-700 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 py-2.5 text-sm font-semibold text-slate-950 transition hover:shadow-[0_0_25px_rgba(34,211,238,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Email'
            )}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-slate-500">
          Didn&apos;t receive a code?{' '}
          {cooldown > 0 ? (
            <span className="text-slate-600">Retry in {cooldown}s</span>
          ) : (
            <button onClick={handleResend} disabled={resending} className="inline-flex items-center gap-1 font-medium text-cyan-400 hover:text-cyan-300 disabled:opacity-50">
              <RotateCw className={`h-3 w-3 ${resending ? 'animate-spin' : ''}`} />
              Resend code
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;

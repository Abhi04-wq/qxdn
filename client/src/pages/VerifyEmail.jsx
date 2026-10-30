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
      <div className="flex min-h-screen items-center justify-center bg-[#071C18] px-4 text-[#ECFDF5]">
        <div className="w-full max-w-md rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] p-8 text-center shadow-card-gold backdrop-blur">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F1D78A] shadow-[0_0_25px_rgba(212,175,55,0.3)]">
            <KeyRound className="h-7 w-7 text-[#F1D78A]" />
          </span>
          <h2 className="mt-4 text-xl font-bold text-[#ECFDF5]">Email Verified!</h2>
          <p className="mt-2 text-sm text-[#A7C4B8]">You can now sign in with your credentials.</p>
          <Link
            to="/login"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient py-2.5 text-sm font-bold text-[#071C18] transition hover:brightness-110 hover:shadow-[0_0_25px_rgba(212,175,55,0.35)]"
          >
            Go to Member Login
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#071C18] px-4 text-[#ECFDF5]">
      <div className="w-full max-w-md rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] p-8 shadow-card-gold backdrop-blur-md transition-all duration-300 hover:border-[#D4AF37]/60">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F1D78A] shadow-[0_0_25px_rgba(212,175,55,0.3)]">
          <KeyRound className="h-7 w-7 text-[#F1D78A]" />
        </div>
        <h2 className="text-center text-xl font-bold text-[#ECFDF5]">Verify Your Email</h2>
        <p className="mt-2 text-center text-sm text-[#91A89E]">
          Enter the 6-digit code we emailed you to activate your account.
        </p>

        {info && (
          <div className={`mt-4 rounded-xl border p-3 text-sm ${info.startsWith('SMTP is not configured') ? 'border-[#D4AF37]/35 bg-[#D4AF37]/10 text-[#F1D78A]' : 'border-[#34D399]/30 bg-[#34D399]/10 text-[#34D399]'}`}>
            {info}
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
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
            className="w-full rounded-xl border border-[#1E493B] bg-[#0B2720] px-4 py-2.5 text-sm text-[#ECFDF5] placeholder-[#91A89E] outline-none transition focus:border-[#34D399] focus:ring-1 focus:ring-[#34D399]"
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
            className="w-full rounded-xl border border-[#1E493B] bg-[#0B2720] py-3 text-center text-2xl font-mono tracking-[0.5em] text-[#34D399] outline-none transition placeholder-[#91A89E] focus:border-[#34D399] focus:ring-1 focus:ring-[#34D399]"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient py-2.5 text-sm font-bold text-[#071C18] transition hover:brightness-110 hover:shadow-[0_0_25px_rgba(212,175,55,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#071C18]" />
                Verifying...
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
};

export default VerifyEmail;

import { useState, useEffect } from 'react';
import {
  KeyRound, Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2,
  AlertCircle, X, ArrowLeft, RefreshCw, ShieldCheck, Sparkles
} from 'lucide-react';
import api from '../lib/api.js';

export default function ResetPasswordModal({
  isOpen,
  onClose,
  initialEmail = '',
  isAuthenticated = false,
  onSuccess,
}) {
  // Mode: 'forgot' (OTP flow) | 'change' (Current Password flow)
  const [mode, setMode] = useState(isAuthenticated ? 'change' : 'forgot');

  // Forgot password OTP flow state
  const [step, setStep] = useState(1); // 1: Enter email & request OTP, 2: Enter OTP & New Password, 3: Success
  const [email, setEmail] = useState(initialEmail || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Change password flow state
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sync initial email when opened
  useEffect(() => {
    if (isOpen) {
      if (initialEmail) setEmail(initialEmail);
      setMode(isAuthenticated ? 'change' : 'forgot');
      setStep(1);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      setError('');
      setSuccessMsg('');
      setDevOtpCode('');
    }
  }, [isOpen, initialEmail, isAuthenticated]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // 1. Request Password Reset OTP
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your account email address.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data: res } = await api.post('/api/auth/forgot-password', {
        email: email.trim(),
      });
      if (res.success) {
        setStep(2);
        setResendCooldown(60);
        if (res.devOtp) {
          setDevOtpCode(res.devOtp);
          setOtp(res.devOtp); // auto-populate in dev mode for convenience
        }
        setSuccessMsg(res.message || 'Verification code sent to your email.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit OTP + New Password Reset
  const handleConfirmReset = async (e) => {
    if (e) e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    if (otp.trim().length !== 6) {
      setError('Verification code must be exactly 6 digits.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data: res } = await api.post('/api/auth/reset-password', {
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });

      if (res.success) {
        setStep(3);
        setSuccessMsg(res.message || 'Password successfully reset!');
        if (onSuccess) onSuccess('Password reset successfully! You can now log in.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please check your OTP and try again.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Submit Authenticated Password Change
  const handleChangePassword = async (e) => {
    if (e) e.preventDefault();
    if (!currentPassword) {
      setError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data: res } = await api.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (res.success) {
        setStep(3);
        setSuccessMsg(res.message || 'Password successfully updated.');
        if (onSuccess) onSuccess('Password successfully updated.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div
        className="relative flex flex-col w-full max-w-md max-h-[92vh] sm:max-h-[88vh] rounded-2xl sm:rounded-3xl border border-[#34D399]/40 bg-[#091512] shadow-[0_0_50px_rgba(52,211,153,0.25)] font-mono text-xs text-white overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Modal Header */}
        <div className="shrink-0 flex items-start justify-between border-b border-[#1E493B] px-4 py-3.5 sm:px-6 sm:py-4 bg-[#0a1b16]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-[#34D399]/40 bg-[#34D399]/15 text-[#34D399] shadow-inner">
              <KeyRound className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider truncate">
                {mode === 'change' ? 'Change Account Password' : 'Reset Account Password'}
              </h3>
              <p className="text-[11px] sm:text-xs text-[#A7B8AE] truncate mt-0.5">
                {mode === 'change'
                  ? 'Verify current password & set new password'
                  : 'Recover password via 6-digit email OTP'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-[#1E493B] bg-[#071C18] p-1.5 text-[#A7B8AE] hover:text-white transition shrink-0 ml-2"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode Selector Tabs (If Authenticated Member) */}
        {isAuthenticated && step !== 3 && (
          <div className="shrink-0 flex border-b border-[#1E493B] bg-[#071C18]">
            <button
              type="button"
              onClick={() => {
                setMode('change');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 text-center text-xs font-bold transition border-b-2 ${
                mode === 'change'
                  ? 'border-[#34D399] text-[#34D399] bg-[#34D399]/10'
                  : 'border-transparent text-[#8EA99D] hover:text-white'
              }`}
            >
              Change Password
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('forgot');
                setError('');
                setSuccessMsg('');
                setStep(1);
              }}
              className={`flex-1 py-2.5 text-center text-xs font-bold transition border-b-2 ${
                mode === 'forgot'
                  ? 'border-[#34D399] text-[#34D399] bg-[#34D399]/10'
                  : 'border-transparent text-[#8EA99D] hover:text-white'
              }`}
            >
              Forgot Password (OTP)
            </button>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && step !== 3 && (
            <div className="flex items-start gap-2 rounded-xl border border-[#34D399]/40 bg-[#34D399]/15 p-3 text-xs text-[#ECFDF5]">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[#34D399]" />
              <span>{successMsg}</span>
            </div>
          )}

          {devOtpCode && step === 2 && (
            <div className="rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 p-3 text-[11px] text-[#F1D78A] space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#F1D78A]" />
                <span>Dev Mode Fallback (SMTP not set):</span>
              </p>
              <p>Your one-time verification code is: <strong className="text-white bg-black/40 px-2 py-0.5 rounded tracking-widest">{devOtpCode}</strong></p>
            </div>
          )}

          {/* ================= STEP 3: SUCCESS STATE ================= */}
          {step === 3 ? (
            <div className="py-6 text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#34D399]/50 bg-[#34D399]/20 text-[#34D399] shadow-[0_0_30px_rgba(52,211,153,0.35)]">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h4 className="text-base font-bold text-white uppercase tracking-wider">
                {mode === 'change' ? 'Password Changed Successfully!' : 'Password Reset Successfully!'}
              </h4>
              <p className="text-xs text-[#A7B8AE] max-w-xs mx-auto">
                Your account password has been updated. You can now use your new credentials to securely log in.
              </p>
            </div>
          ) : mode === 'change' ? (
            /* ================= MODE: CHANGE PASSWORD ================= */
            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-[#A7B8AE] uppercase tracking-wider block mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#719183]" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter current password..."
                    className="w-full rounded-xl border border-[#1E493B] bg-[#071C18] py-2.5 pl-10 pr-10 text-xs text-white placeholder-[#719183] outline-none transition focus:border-[#34D399] focus:ring-1 focus:ring-[#34D399]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#719183] hover:text-white transition"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#A7B8AE] uppercase tracking-wider block mb-1">
                  New Password (min 8 characters)
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#719183]" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter new strong password..."
                    className="w-full rounded-xl border border-[#1E493B] bg-[#071C18] py-2.5 pl-10 pr-10 text-xs text-white placeholder-[#719183] outline-none transition focus:border-[#34D399] focus:ring-1 focus:ring-[#34D399]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#719183] hover:text-white transition"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#A7B8AE] uppercase tracking-wider block mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#719183]" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Confirm new password..."
                    className="w-full rounded-xl border border-[#1E493B] bg-[#071C18] py-2.5 pl-10 pr-4 text-xs text-white placeholder-[#719183] outline-none transition focus:border-[#34D399] focus:ring-1 focus:ring-[#34D399]"
                    required
                  />
                </div>
              </div>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setStep(1);
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="text-[11px] text-[#34D399] hover:underline transition"
                >
                  Forgot your current password? Reset with Email OTP →
                </button>
              </div>
            </form>
          ) : step === 1 ? (
            /* ================= MODE: FORGOT PASSWORD (STEP 1 - REQUEST OTP) ================= */
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <p className="text-xs text-[#A7B8AE] leading-relaxed">
                Enter your registered QNDX account email. We will send a secure 6-digit verification code to reset your password.
              </p>

              <div>
                <label className="text-[11px] font-bold text-[#A7B8AE] uppercase tracking-wider block mb-1">
                  Account Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#719183]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-[#1E493B] bg-[#071C18] py-2.5 pl-10 pr-4 text-xs text-white placeholder-[#719183] outline-none transition focus:border-[#34D399] focus:ring-1 focus:ring-[#34D399]"
                    required
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[#1E493B] bg-[#071C18] p-3 text-[11px] text-[#A7B8AE] space-y-1">
                <p className="font-bold text-[#34D399] flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Security Guarantee:</span>
                </p>
                <p>• Verification code is valid for 10 minutes.</p>
                <p>• No old password required.</p>
              </div>
            </form>
          ) : (
            /* ================= MODE: FORGOT PASSWORD (STEP 2 - ENTER OTP & NEW PASSWORD) ================= */
            <form onSubmit={handleConfirmReset} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-[#F1D78A] uppercase tracking-wider block">
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || loading}
                    onClick={handleRequestOtp}
                    className="text-[10px] text-[#34D399] hover:underline disabled:opacity-50 transition"
                  >
                    {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ''));
                    setError('');
                  }}
                  placeholder="• • • • • •"
                  className="w-full text-center text-lg tracking-[0.5em] font-mono font-bold rounded-xl border border-[#34D399]/60 bg-[#071C18] py-2 text-white placeholder-[#719183] outline-none transition focus:border-[#34D399] focus:ring-1 focus:ring-[#34D399]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#A7B8AE] uppercase tracking-wider block mb-1">
                  New Password (min 8 characters)
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#719183]" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter new strong password..."
                    className="w-full rounded-xl border border-[#1E493B] bg-[#071C18] py-2.5 pl-10 pr-10 text-xs text-white placeholder-[#719183] outline-none transition focus:border-[#34D399] focus:ring-1 focus:ring-[#34D399]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#719183] hover:text-white transition"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#A7B8AE] uppercase tracking-wider block mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#719183]" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Confirm new password..."
                    className="w-full rounded-xl border border-[#1E493B] bg-[#071C18] py-2.5 pl-10 pr-4 text-xs text-white placeholder-[#719183] outline-none transition focus:border-[#34D399] focus:ring-1 focus:ring-[#34D399]"
                    required
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Pinned Modal Actions Footer */}
        <div className="shrink-0 flex items-center justify-between gap-2.5 sm:gap-3 px-4 py-3 sm:px-6 sm:py-3.5 border-t border-[#1E493B] bg-[#071C18]">
          {step === 2 && mode === 'forgot' ? (
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setError('');
              }}
              className="flex items-center gap-1.5 text-xs text-[#A7B8AE] hover:text-white transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-[#1E493B] bg-[#091512] px-4 py-2 font-bold text-[#A7B8AE] hover:text-white transition disabled:opacity-50 text-xs"
            >
              {step === 3 ? 'Close' : 'Cancel'}
            </button>

            {step === 3 ? (
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 rounded-xl border border-[#34D399]/60 bg-gradient-to-r from-[#10B981] via-[#059669] to-[#047857] px-5 py-2 font-bold text-white shadow-[0_0_20px_rgba(52,211,153,0.35)] transition hover:brightness-110 text-xs"
              >
                <span>Done</span>
              </button>
            ) : mode === 'change' ? (
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                className="flex items-center gap-2 rounded-xl border border-[#34D399]/60 bg-gradient-to-r from-[#10B981] via-[#059669] to-[#047857] px-4 sm:px-5 py-2 font-bold text-white shadow-[0_0_20px_rgba(52,211,153,0.35)] transition hover:brightness-110 disabled:opacity-50 text-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            ) : step === 1 ? (
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={loading || !email.trim()}
                className="flex items-center gap-2 rounded-xl border border-[#34D399]/60 bg-gradient-to-r from-[#10B981] via-[#059669] to-[#047857] px-4 sm:px-5 py-2 font-bold text-white shadow-[0_0_20px_rgba(52,211,153,0.35)] transition hover:brightness-110 disabled:opacity-50 text-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    <span>Send Reset Code</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={loading || !otp || !newPassword || !confirmPassword}
                className="flex items-center gap-2 rounded-xl border border-[#34D399]/60 bg-gradient-to-r from-[#10B981] via-[#059669] to-[#047857] px-4 sm:px-5 py-2 font-bold text-white shadow-[0_0_20px_rgba(52,211,153,0.35)] transition hover:brightness-110 disabled:opacity-50 text-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>Confirm & Reset</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
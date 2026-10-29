import { useCallback, useEffect, useState, useRef } from 'react';
import {
  Wallet, ArrowUpRight, Check, Copy, ExternalLink, AlertCircle,
  CheckCircle2, Clock, XCircle, Loader2, ShieldAlert, DollarSign,
  Info, RefreshCw, X, Zap, ShieldCheck, Mail, Send, Timer
} from 'lucide-react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Toast from '../components/Toast.jsx';

const BEP20_REGEX = /^0x[a-fA-F0-9]{40}$/;
const MANUAL_THRESHOLD = 300;
const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });

const WithdrawPage = () => {
  const { user } = useAuth();
  const [balances, setBalances] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Form State
  const [amount, setAmount] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [toast, setToast] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState(600); // 10 minutes
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resending, setResending] = useState(false);

  const otpInputRefs = useRef([]);

  const grossNum = Number(amount) || 0;
  const feeAmount = Math.round(grossNum * 0.05 * 1e6) / 1e6;
  const netAmount = Math.round((grossNum - feeAmount) * 1e6) / 1e6;

  const availableBalance = balances?.availableBalance || 0;
  const isAddressValid = destinationAddress.trim() ? BEP20_REGEX.test(destinationAddress.trim()) : false;
  const isAmountValid = grossNum >= 20 && grossNum <= availableBalance;
  const isOverBalance = grossNum > availableBalance;
  const isUnderMin = amount !== '' && grossNum > 0 && grossNum < 20;
  const isInstant = grossNum > 0 && grossNum < MANUAL_THRESHOLD;

  const loadData = useCallback(async () => {
    try {
      const [{ data: balRes }, { data: withRes }] = await Promise.all([
        api.get('/api/ledger/balance'),
        api.get('/api/wallet/my-withdrawals'),
      ]);
      setBalances(balRes.data.balances);
      setWithdrawals(withRes.data.withdrawals || []);
    } catch (err) {
      setToast(err.response?.data?.message || 'Failed to load withdrawal data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // OTP Countdown Timer
  useEffect(() => {
    let interval = null;
    if (showOtpModal && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showOtpModal, timerSeconds]);

  const copyText = async (text, key, msg = 'Copied to clipboard') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setToast(msg);
      setTimeout(() => setCopiedKey(''), 2000);
    } catch {
      setToast('Copy failed - please copy manually');
    }
  };

  const handleQuickPercent = (pct) => {
    if (!availableBalance || availableBalance <= 0) return;
    const calculated = (availableBalance * pct).toFixed(2);
    setAmount(calculated);
  };

  // Step 1: Initiate Withdrawal -> Generate & Send OTP
  const handleInitiateWithdrawal = async (e) => {
    e?.preventDefault();
    if (!isAmountValid || !isAddressValid) return;

    setInitiating(true);
    try {
      const { data } = await api.post('/api/wallet/withdraw-initiate', {
        amount: grossNum,
        destinationAddress: destinationAddress.trim(),
      });

      setRegisteredEmail(data.data?.email || user?.email || 'your email');
      setTimerSeconds(600); // 10 minutes
      setOtpDigits(['', '', '', '', '', '']);
      setShowOtpModal(true);
      setToast(data.message || 'OTP verification code sent to your email');

      // Auto focus first OTP input after modal renders
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err) {
      setToast(err.response?.data?.message || 'Failed to initiate withdrawal');
    } finally {
      setInitiating(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resending) return;
    setResending(true);
    try {
      const { data } = await api.post('/api/wallet/withdraw-initiate', {
        amount: grossNum,
        destinationAddress: destinationAddress.trim(),
      });
      setTimerSeconds(600);
      setOtpDigits(['', '', '', '', '', '']);
      setToast(data.message || 'New OTP sent to your registered email');
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      setToast(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  // Step 2: Confirm OTP & Execute Payout Routing
  const handleConfirmWithdrawal = async () => {
    const enteredOtp = otpDigits.join('').trim();
    if (enteredOtp.length !== 6) {
      setToast('Please enter all 6 digits of the OTP verification code');
      return;
    }

    setConfirming(true);
    try {
      const { data } = await api.post('/api/wallet/withdraw-confirm', {
        amount: grossNum,
        destinationAddress: destinationAddress.trim(),
        otpCode: enteredOtp,
      });

      setShowOtpModal(false);
      setAmount('');
      setDestinationAddress('');
      setOtpDigits(['', '', '', '', '', '']);

      if (data.data?.balances) {
        setBalances(data.data.balances);
      }

      if (data.autoProcessed) {
        setToast(`⚡ Payout Dispatched! ${fmt(data.data?.netAmount)} USDT sent on-chain. TxHash generated.`);
      } else {
        setToast('🛡️ Request Authorized! Submitted for Admin Approval (amount >= 300 USDT).');
      }

      await loadData();
    } catch (err) {
      setToast(err.response?.data?.message || 'OTP Verification failed');
    } finally {
      setConfirming(false);
    }
  };

  // Handle OTP 6-box input changes & auto-advance
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste of 6 digits
      const pasted = value.replace(/\D/g, '').slice(0, 6);
      if (pasted.length > 0) {
        const nextDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          nextDigits[i] = pasted[i] || '';
        }
        setOtpDigits(nextDigits);
        const nextFocus = Math.min(5, pasted.length);
        otpInputRefs.current[nextFocus]?.focus();
      }
      return;
    }

    const cleanChar = value.replace(/\D/g, '');
    const nextDigits = [...otpDigits];
    nextDigits[index] = cleanChar;
    setOtpDigits(nextDigits);

    // Auto-advance
    if (cleanChar && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const fmtDate = (d) =>
    new Date(d).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const truncate = (str, start = 8, end = 6) => {
    if (!str) return '—';
    if (str.length <= start + end) return str;
    return `${str.slice(0, start)}...${str.slice(-end)}`;
  };

  return (
    <div className="text-slate-200">
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
                <ArrowUpRight className="h-5 w-5" />
              </span>
              Withdraw Funds (USDT)
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Two-factor OTP verified payouts with tiered instant & manual on-chain execution
            </p>
          </div>
          <button
            onClick={() => { setLoading(true); loadData(); }}
            className="flex items-center gap-2 self-start rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Top Summary Banner */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-6 shadow-[0_0_35px_-5px_rgba(34,211,238,0.15)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  Confirmed Available Withdrawable Balance
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white sm:text-4xl">
                  {balances ? fmt(balances.availableBalance) : '0.00'}
                </span>
                <span className="text-lg font-bold text-cyan-400">USDT</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                * Available balance strictly comprises confirmed deposits and Saturday released rewards minus active locks and withdrawals.
              </p>
            </div>

            <div className="rounded-xl border border-slate-700/60 bg-slate-950/70 p-4 md:max-w-xs">
              <div className="flex items-start gap-2.5">
                <Info className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <p className="font-semibold text-amber-300">Platform Policies</p>
                  <p className="mt-1">
                    Min withdrawal: <span className="font-semibold text-white">20 USDT</span> | Fee: <span className="font-semibold text-white">5%</span>
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    • <span className="text-emerald-400 font-semibold">&lt; 300 USDT:</span> Instant Auto-Payout via OTP<br />
                    • <span className="text-amber-400 font-semibold">&ge; 300 USDT:</span> OTP + Admin Manual Review
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Withdrawal Form Card */}
        <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
          <div className="mb-6 border-b border-slate-800 pb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Request Payout</h3>
              <p className="mt-1 text-xs text-slate-500">
                Step 1 of 2: Enter amount and destination wallet to receive a 6-digit email authorization code
              </p>
            </div>
          </div>

          {/* Dynamic Tier Alert Badge */}
          {grossNum >= 20 && (
            <div className="mb-6">
              {isInstant ? (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.12)]">
                  <Zap className="h-5 w-5 shrink-0 text-emerald-400" />
                  <div>
                    <p className="font-bold text-emerald-300">⚡ Instant Payout via OTP Verification</p>
                    <p className="mt-0.5 text-[11px] text-emerald-200/80">
                      Amount is under 300 USDT. Upon entering the 6-digit code sent to your email, funds will be broadcast to the blockchain instantly without waiting for admin approval.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.12)]">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-amber-400" />
                  <div>
                    <p className="font-bold text-amber-300">🛡️ Requires OTP + Admin Manual Review</p>
                    <p className="mt-0.5 text-[11px] text-amber-200/80">
                      Amount is 300 USDT or higher. After OTP verification, your request is submitted to our compliance desk for expedited manual review.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Input Column */}
            <div className="space-y-5 lg:col-span-7">
              {/* Amount Input */}
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="withdraw-amount" className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Amount (USDT)
                  </label>
                  <span className="text-xs text-slate-400">
                    Available: <span className="font-medium text-cyan-300">{fmt(availableBalance)} USDT</span>
                  </span>
                </div>

                <div className="relative mt-2">
                  <input
                    id="withdraw-amount"
                    type="number"
                    step="any"
                    min="20"
                    max={availableBalance}
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-lg font-bold text-white placeholder-slate-600 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <span>USDT</span>
                  </div>
                </div>

                {/* Quick percentage buttons */}
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-500">Quick select:</span>
                  {[
                    { label: '25%', value: 0.25 },
                    { label: '50%', value: 0.5 },
                    { label: 'Max', value: 1.0 },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() => handleQuickPercent(btn.value)}
                      className="rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-1 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-300"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Validation Warnings */}
                {isUnderMin && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Minimum withdrawal is 20 USDT.
                  </p>
                )}
                {isOverBalance && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Amount exceeds your available balance ({fmt(availableBalance)} USDT).
                  </p>
                )}
              </div>

              {/* Destination Address Input */}
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="destination-address" className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    BEP-20 Destination Wallet Address
                  </label>
                  {destinationAddress.trim() && (
                    <span className={`flex items-center gap-1 text-[11px] font-medium ${isAddressValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isAddressValid ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {isAddressValid ? 'Valid BEP-20 address' : 'Invalid address format'}
                    </span>
                  )}
                </div>

                <div className="relative mt-2">
                  <input
                    id="destination-address"
                    type="text"
                    placeholder="0x..."
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    className={`w-full rounded-xl border bg-slate-950 px-4 py-3 font-mono text-sm text-cyan-300 placeholder-slate-600 outline-none transition ${
                      destinationAddress.trim()
                        ? isAddressValid
                          ? 'border-emerald-500/50 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50'
                          : 'border-rose-500/50 focus:border-rose-400 focus:ring-1 focus:ring-rose-400/50'
                        : 'border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50'
                    }`}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Must be a valid BEP-20 address on BNB Smart Chain (starts with 0x and contains 40 hex characters).
                </p>
              </div>
            </div>

            {/* Live Calculation Box Column */}
            <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-5 lg:col-span-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Live Calculation Summary
                </p>

                <div className="mt-4 space-y-3 divide-y divide-slate-800 text-sm">
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-400">Gross Amount</span>
                    <span className="font-semibold text-white">
                      {grossNum > 0 ? fmt(grossNum) : '0.00'} USDT
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Platform Fee (5%)</span>
                    </div>
                    <span className="font-semibold text-rose-400">
                      {grossNum > 0 ? `-${fmt(feeAmount)}` : '0.00'} USDT
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-cyan-300">Net Amount</span>
                      <span className="text-[10px] text-slate-500">(Tokens Received)</span>
                    </div>
                    <span className="text-lg font-bold text-emerald-400">
                      {grossNum > 0 && netAmount > 0 ? fmt(netAmount) : '0.00'} USDT
                    </span>
                  </div>
                </div>

                <div className="mt-5 rounded-lg border border-slate-800/80 bg-slate-900/60 p-3 text-xs text-slate-400">
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-300 font-semibold">
                    <Mail className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    Mandatory Two-Step Security
                  </p>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                    Clicking Proceed will dispatch a secure 6-digit OTP code to your registered email address before any funds are moved.
                  </p>
                </div>
              </div>

              {/* Submit Button -> Initiates OTP */}
              <button
                type="button"
                disabled={!isAmountValid || !isAddressValid || initiating}
                onClick={handleInitiateWithdrawal}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-semibold text-slate-950 transition hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-40 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
              >
                {initiating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Dispatching Security OTP...
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="h-4 w-4" />
                    Proceed to Withdraw
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* STEP 2: OTP VERIFICATION MODAL */}
        {showOtpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
            <div className="w-full max-w-lg rounded-2xl border border-cyan-400/40 bg-slate-900 p-6 shadow-[0_0_60px_rgba(34,211,238,0.3)]">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <h4 className="text-base font-bold text-white">Two-Factor OTP Authorization</h4>
                    <p className="text-[11px] text-slate-400">Step 2 of 2: Confirm your withdrawal request</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Transaction Summary Card */}
              <div className="mt-4 space-y-3.5">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Withdrawal Gross:</span>
                    <span className="font-semibold text-white">{fmt(grossNum)} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Processing Fee (5%):</span>
                    <span className="font-semibold text-rose-400">-{fmt(feeAmount)} USDT</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-1.5 font-bold">
                    <span className="text-cyan-300">Net Received:</span>
                    <span className="text-emerald-400">{fmt(netAmount)} USDT</span>
                  </div>
                  <div className="flex justify-between pt-1 text-[11px]">
                    <span className="text-slate-400">Payout Mode:</span>
                    {isInstant ? (
                      <span className="font-semibold text-emerald-400">⚡ Instant On-Chain Processing (&lt; 300 USDT)</span>
                    ) : (
                      <span className="font-semibold text-amber-400">🛡️ Admin Manual Review (&ge; 300 USDT)</span>
                    )}
                  </div>
                </div>

                {/* Email instruction */}
                <div className="text-center pt-1">
                  <p className="text-xs text-slate-300">
                    Enter the 6-digit code sent to <strong className="text-cyan-300 font-mono">{registeredEmail}</strong>
                  </p>
                </div>

                {/* 6-Digit OTP Input Boxes */}
                <div className="flex items-center justify-center gap-2.5 my-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="h-12 w-12 rounded-xl border border-slate-700 bg-slate-950 text-center font-mono text-xl font-bold text-cyan-300 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
                    />
                  ))}
                </div>

                {/* Timer & Resend */}
                <div className="flex items-center justify-between text-xs px-2">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Timer className="h-3.5 w-3.5 text-amber-400" />
                    <span>Expires in:</span>
                    <span className={`font-mono font-bold ${timerSeconds < 60 ? 'text-rose-400' : 'text-amber-300'}`}>
                      {formatTimer(timerSeconds)}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={resending || timerSeconds > 540}
                    onClick={handleResendOtp}
                    className="text-xs font-semibold text-cyan-400 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {resending ? 'Sending...' : 'Resend Code'}
                  </button>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  disabled={confirming}
                  onClick={() => setShowOtpModal(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={confirming || otpDigits.join('').length !== 6 || timerSeconds <= 0}
                  onClick={handleConfirmWithdrawal}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:from-cyan-300 hover:to-blue-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:opacity-50"
                >
                  {confirming ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying & Authorizing...
                    </>
                  ) : (
                    'Confirm & Submit Withdrawal'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal History Table */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="flex flex-col justify-between gap-2 border-b border-slate-800 px-6 py-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-base font-semibold text-white">Withdrawal History</h3>
              <p className="text-xs text-slate-500">
                Detailed record of all submitted payout requests, processing tiers, and on-chain proofs
              </p>
            </div>
            <span className="self-start rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-400">
              {withdrawals.length} request{withdrawals.length === 1 ? '' : 's'}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <Wallet className="h-12 w-12 text-slate-700 mb-3" />
              <p className="text-sm font-semibold text-slate-300">No withdrawal requests yet</p>
              <p className="mt-1 max-w-sm text-xs text-slate-500">
                When you request a payout, its processing tier, status, and BSCScan transaction details will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5">Date & Time</th>
                    <th className="px-4 py-3.5">Gross</th>
                    <th className="px-4 py-3.5">Fee (5%)</th>
                    <th className="px-4 py-3.5">Net Payout</th>
                    <th className="px-4 py-3.5">Destination</th>
                    <th className="px-4 py-3.5">Tier</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">BscScan TxHash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {withdrawals.map((req) => (
                    <tr key={req._id} className="transition hover:bg-slate-800/30">
                      <td className="whitespace-nowrap px-5 py-4 text-slate-300">
                        {fmtDate(req.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-200">
                        {fmt(req.grossAmount)} USDT
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-rose-400">
                        -{fmt(req.feeAmount)} USDT
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-bold text-emerald-400">
                        {fmt(req.netAmount)} USDT
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-mono text-cyan-300">
                        <div className="flex items-center gap-1.5">
                          <span>{truncate(req.destinationAddress, 6, 4)}</span>
                          <button
                            type="button"
                            onClick={() => copyText(req.destinationAddress, `addr-${req._id}`, 'Address copied')}
                            className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                            title="Copy Address"
                          >
                            {copiedKey === `addr-${req._id}` ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Tier Badge: Instant vs Manual */}
                      <td className="whitespace-nowrap px-4 py-4">
                        {req.autoProcessed ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                            <Zap className="h-3 w-3 text-cyan-400" />
                            Instant
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                            <ShieldCheck className="h-3 w-3 text-amber-400" />
                            Manual Review
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="whitespace-nowrap px-4 py-4">
                        {req.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                            <Clock className="h-3 w-3 animate-pulse" />
                            Under Review
                          </span>
                        )}
                        {req.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Approved
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-400">
                              <XCircle className="h-3 w-3" />
                              Rejected
                            </span>
                            {req.rejectionReason && (
                              <p className="max-w-xs truncate text-[10px] text-rose-300/80" title={req.rejectionReason}>
                                Reason: {req.rejectionReason}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* TxHash Column */}
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        {req.txHash ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`https://bscscan.com/tx/${req.txHash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-cyan-400 hover:underline hover:text-cyan-300"
                            >
                              <span>{truncate(req.txHash, 6, 4)}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <button
                              type="button"
                              onClick={() => copyText(req.txHash, `tx-${req._id}`, 'TxHash copied')}
                              className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                              title="Copy TxHash"
                            >
                              {copiedKey === `tx-${req._id}` ? (
                                <Check className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        ) : req.status === 'pending' ? (
                          <span className="text-amber-400/80 italic text-[11px]">Under Admin Review</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
};

export default WithdrawPage;

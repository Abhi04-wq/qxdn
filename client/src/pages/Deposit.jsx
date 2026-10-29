import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Coins, LogOut, ShieldCheck, UserCircle, Link2, Copy, Check, Wallet, AlertCircle,
  QrCode, Loader2, X, FlaskConical, History, ExternalLink, CheckCircle2, ArrowRight, Network,
} from 'lucide-react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Toast from '../components/Toast.jsx';

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 6 });

const TYPE_LABEL = {
  DEPOSIT: 'Deposit',
  PROMOTIONAL_REWARD: 'Promotional Reward',
  STAKE_LOCK: 'Stake Locked',
  STAKING_DAILY_ACCRUAL: 'Staking Reward',
  REFERRAL_BONUS: 'Referral Bonus',
  WITHDRAWAL: 'Withdrawal',
};

const Deposit = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [wallet, setWallet] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simOpen, setSimOpen] = useState(false);
  const [copied, setCopied] = useState('');
  const [toast, setToast] = useState('');

  const refreshBalance = useCallback(async () => {
    const { data } = await api.get('/api/ledger/balance');
    setBalances(data.data.balances);
    setLedger(data.data.ledger);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data: w } = await api.get('/api/wallet/deposit-info');
        setWallet(w.data);
        await refreshBalance();
      } catch (error) {
        setToast(error.response?.data?.message || 'Failed to load wallet data');
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshBalance]);

  const copyText = async (text, key, msg) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setToast(msg);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      setToast('Copy failed - please copy manually');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="text-slate-200">
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Deposit USDT</h2>
            <p className="mt-1 text-sm text-slate-500">Fund your account to start staking</p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Available Deposit</p>
              <p className="text-sm font-bold text-white">{balances ? `${fmt(balances.availableDeposit)} USDT` : '—'}</p>
            </div>
            <button onClick={() => setSimOpen(true)} className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-medium text-emerald-400 transition hover:bg-emerald-400/20">
              <FlaskConical className="h-3.5 w-3.5" />
              Simulator
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:col-span-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white">Your Permanent Deposit Address</h3>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                  <p className="truncate font-mono text-sm text-cyan-300">{wallet?.depositAddress}</p>
                  <button
                    onClick={() => copyText(wallet.depositAddress, 'addr', 'Deposit address copied')}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-400 transition hover:bg-cyan-400/20"
                  >
                    {copied === 'addr' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied === 'addr' ? 'Copied' : 'Copy Address'}
                  </button>
                </div>
                <ul className="mt-4 space-y-2">
                  {[wallet?.network, `Minimum Deposit: 100 USDT`, 'Requires 15 Confirmations'].map((t) => (
                    <li key={t} className="flex items-center gap-2 text-xs text-slate-400">
                      <Network className="h-3 w-3 text-slate-600" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950 p-6">
                  <QrCode className="h-24 w-24 text-slate-600" />
                </div>
                <p className="mt-3 text-xs text-slate-600">QR placeholder (scan via wallet app soon)</p>
              </div>
            </section>

            <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white">Transaction History</h3>
                </div>
                <span className="rounded-full border border-slate-700/60 bg-slate-950 px-2.5 py-0.5 text-[11px] text-slate-400">
                  {ledger.length} events
                </span>
              </div>

              {ledger.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-14">
                  <Coins className="mb-4 h-10 w-10 text-slate-700" />
                  <p className="text-sm font-medium text-slate-300">No transactions yet</p>
                  <p className="mt-1 text-center text-xs text-slate-500">
                    Use the simulator (dev) to simulate an on-chain BEP-20 deposit of at least 100 USDT.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-slate-500">
                        <th className="px-6 py-3 font-medium">Date</th>
                        <th className="px-6 py-3 font-medium">Type</th>
                        <th className="px-6 py-3 font-medium">Amount</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium">Tx Hash</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {ledger.map((e) => (
                        <tr key={e._id} className="text-slate-300">
                          <td className="whitespace-nowrap px-6 py-3 text-xs text-slate-500">{new Date(e.createdAt).toLocaleString()}</td>
                          <td className="px-6 py-3">{(TYPE_LABEL[e.type] || e.type).replace(/_/g, ' ')}</td>
                          <td className={`whitespace-nowrap px-6 py-3 font-medium ${e.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {e.amount >= 0 ? '+' : ''}{e.amount.toLocaleString('en-US', { maximumFractionDigits: 6 })} {e.currency || 'USDT'}
                          </td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                              e.status === 'confirmed'
                                ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                : e.status === 'failed'
                                ? 'border border-red-500/20 bg-red-500/10 text-red-400'
                                : 'border border-amber-500/20 bg-amber-500/10 text-amber-400'
                            }`}>
                              <CheckCircle2 className="h-3 w-3" />
                              {e.status === 'confirmed' ? `Confirmed (${e.confirmations})` : e.status}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <span className="flex items-center gap-1 font-mono text-xs text-slate-400" title={e.txHash}>
                              {e.txHash ? `${e.txHash.slice(0, 10)}...${e.txHash.slice(-6)}` : '—'}
                              <ExternalLink className="h-3 w-3 text-slate-600" />
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {simOpen && wallet && (
        <SimulateModal
          onClose={() => setSimOpen(false)}
          setToast={setToast}
          onSimulated={refreshBalance}
        />
      )}

      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  );
};

const SimulateModal = ({ onClose, setToast, onSimulated }) => {
  const [amount, setAmount] = useState('100');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const submit = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (value < 100) {
      setError('Minimum deposit is 100 USDT');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/api/test/simulate-deposit', { amount: value });
      setDone({ entry: data.data.ledger, balances: data.data.balances });
      setToast(data.message);
      onSimulated?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to simulate deposit');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" onClick={() => !busy && onClose()}>
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Developer Sandbox - Simulate Deposit</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 transition hover:text-slate-300" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {done ? (
          <div className="mt-5 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
            <p className="mt-3 text-sm font-medium text-white">
              {Number(done.entry.amount).toLocaleString()} USDT credited
            </p>
            <p className="mt-1 break-all font-mono text-[10px] text-slate-500">{done.entry.txHash}</p>
            <div className="mt-4 space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-left">
              <p className="flex justify-between text-xs"><span className="text-slate-500">Available Deposit</span><span className="font-semibold text-white">{fmt(done.balances.availableDeposit)} USDT</span></p>
              <p className="flex justify-between text-xs"><span className="text-slate-500">Total Deposits</span><span className="text-slate-300">{fmt(done.balances.totalDeposits)} USDT</span></p>
            </div>
            <button onClick={onClose} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 py-2.5 text-sm font-semibold text-slate-950">
              Done
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[100, 500, 1000].map((v) => (
                <button
                  key={v}
                  onClick={() => { setAmount(String(v)); setError(''); }}
                  className={`rounded-lg border py-2.5 text-sm font-medium transition ${
                    Number(amount) === v
                      ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-300'
                      : 'border-slate-700/80 bg-slate-950 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {v} USDT
                </button>
              ))}
            </div>
            <input
              type="number"
              min="100"
              step="1"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(''); }}
              placeholder="Custom amount (min 100)"
              className="mt-3 w-full rounded-lg border border-slate-700/80 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
            />
            <button
              onClick={submit}
              disabled={busy}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 py-2.5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
              Simulate On-Chain Deposit
            </button>
            <p className="mt-3 text-center text-[11px] text-slate-500">
              Credits a confirmed DEPOSIT with a unique 0x txHash into the append-only ledger.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Deposit;

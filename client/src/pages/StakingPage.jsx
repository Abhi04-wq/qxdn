import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, X, FlaskConical, AlertCircle, CheckCircle2, Lock, TrendingUp, Zap, Gift,
} from 'lucide-react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Toast from '../components/Toast.jsx';
import AirdropBonusPreview from '../components/AirdropBonusPreview.jsx';

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const round = (n) => Math.round((Number(n) || 0) * 1e6) / 1e6;
const todayKey = () => new Date().toISOString().slice(0, 10);

// Developer Plan v2 tier rules (100% cumulative cap -> days to complete = 100 / rate)
const PLANS = [
  {
    key: 't1', name: 'STARTER', subtitle: 'Staking Plan', rate: 0.004,
    min: 100, max: 1000, days: 250, rangeLabel: '100-1,000 USDT',
    quick: [100, 500, 1000], defaultAmount: 1000,
    promoBonus: '1M SHIB + 500 VET',
  },
  {
    key: 't2', name: 'RAPID', subtitle: 'Staking Plan', rate: 0.0045,
    min: 1001, max: 5000, days: 223, rangeLabel: '1,001-5,000 USDT',
    quick: [1500, 3000, 5000], defaultAmount: 3000,
    promoBonus: '2M SHIB + 100 VET + 50 WILD',
  },
  {
    key: 't3', name: 'ROCKET', subtitle: 'Staking Plan', rate: 0.005,
    min: 5001, max: null, days: 200, rangeLabel: '5,000+ USDT',
    quick: [6000, 10000, 25000], defaultAmount: 6000,
    promoBonus: '10M SHIB + 5K VET + 250 WILD + 250 DOGE',
  },
];

const planForStake = (amount) => {
  if (amount <= 1000) return PLANS[0];
  if (amount <= 5000) return PLANS[1];
  return PLANS[2];
};

const StakingPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [balances, setBalances] = useState(null);
  const [stakes, setStakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [amount, setAmount] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [accrualBusy, setAccrualBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const refresh = useCallback(async () => {
    const [{ data: b }, { data: s }] = await Promise.all([
      api.get('/api/ledger/balance'),
      api.get('/api/staking/my-stakes'),
    ]);
    setBalances(b.data.balances);
    setStakes(s.data.stakes || []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } catch (err) {
        setToast(err.response?.data?.message || 'Failed to load staking data');
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const openPlan = (p) => {
    setPlan(p);
    setAmount(String(p.defaultAmount));
    setError('');
    setConfirmOpen(true);
  };

  const value = Number(amount);
  const inRange = plan && Number.isFinite(value) && value >= plan.min && (plan.max === null || value <= plan.max);
  const withinBalance = balances ? value <= balances.availableDeposit : false;
  const dailyYield = inRange ? round(value * plan.rate) : null;

  const submitStake = async () => {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/api/staking/create', { amount: value });
      setToast(`Stake activated: ${fmt(value)} USDT @ ${(data.data.stake.dailyRate * 100).toFixed(2)}%/day`);
      setConfirmOpen(false);
      await refresh();
    } catch (err) {
      setConfirmOpen(false);
      setToast(err.response?.data?.message || 'Failed to create stake');
    } finally {
      setBusy(false);
    }
  };

  const runAccrual = async () => {
    setAccrualBusy(true);
    try {
      const { data } = await api.post('/api/test/run-daily-accrual', {});
      const d = data.data;
      setToast(`Accrual ${d.simulationDate}: ${d.totalProcessed} processed, +${fmt(d.totalAccruedAmount)} USDT pending, ${d.completedStakesCount} completed`);
      await refresh();
    } catch (err) {
      setToast(err.response?.data?.message || 'Accrual simulation failed');
    } finally {
      setAccrualBusy(false);
    }
  };

  return (
    <div className="text-slate-200">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Staking Plans</h2>
            <p className="mt-1 text-sm text-slate-500">Welcome back, choose a plan and start earning</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Available Deposit</p>
              <p className="text-sm font-bold text-white">{balances ? `${fmt(balances.availableDeposit)} USDT` : '—'}</p>
            </div>
            <button
              onClick={runAccrual}
              disabled={accrualBusy}
              className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {accrualBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
              Simulate 1-Day Accrual
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : (
          <>
            {/* Plan cards */}
            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {PLANS.map((p) => (
                <div
                  key={p.key}
                  className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-400/30 hover:shadow-[0_0_35px_-10px_rgba(34,211,238,0.15)]"
                >
                  <h3 className="text-base font-bold tracking-wide text-white">{p.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{p.subtitle}</p>

                  <p className="mt-4 text-4xl font-bold tracking-tight text-emerald-400">
                    {(p.rate * 100).toFixed(2)}<span className="text-2xl">%</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Daily Staking Reward for {p.days} Days</p>

                  <div className="mt-5 space-y-2 border-t border-slate-800 pt-4 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500">Staking Range</span>
                      <span className="font-semibold text-slate-200">{p.rangeLabel}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500">Maximum Rewards</span>
                      <span className="font-semibold text-slate-200">Up to 100%</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 text-amber-300">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400">
                        <Gift className="h-3 w-3" /> Airdrop Bonus
                      </span>
                      <span className="font-mono text-[10px] font-bold text-amber-300">{p.promoBonus}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => openPlan(p)}
                    className="mt-6 w-full rounded-lg border border-cyan-400/30 bg-cyan-400/5 py-2.5 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/15"
                  >
                    Stake Now
                  </button>
                </div>
              ))}
            </section>

            {/* Active stakes table */}
            <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white">Your Active Stakes</h3>
                </div>
                <span className="rounded-full border border-slate-700/60 bg-slate-950 px-2.5 py-0.5 text-[11px] text-slate-400">
                  {stakes.length} position{stakes.length === 1 ? '' : 's'}
                </span>
              </div>

              {stakes.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-14">
                  <Lock className="mb-4 h-10 w-10 text-slate-700" />
                  <p className="text-sm font-medium text-slate-300">No stakes yet</p>
                  <p className="mt-1 max-w-xs text-center text-xs text-slate-500">
                    Pick a plan above and click Stake Now to start earning daily rewards.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-slate-500">
                        <th className="px-6 py-3 font-medium">Plan</th>
                        <th className="px-6 py-3 font-medium">Staked</th>
                        <th className="px-6 py-3 font-medium">Reward Rate</th>
                        <th className="px-6 py-3 font-medium">Rewards Earned</th>
                        <th className="px-6 py-3 font-medium">Progress</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {stakes.map((s) => {
                        const p = planForStake(s.amount);
                        const pct = Math.min(100, round((s.cumulativeReward / s.maxRewardCap) * 100));
                        return (
                          <tr key={s._id} className="text-slate-300">
                            <td className="px-6 py-4">
                              <p className="font-semibold tracking-wide text-white">{p.name}</p>
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                Started {new Date(s.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                              </p>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">{fmt(s.amount)} USDT</td>
                            <td className="whitespace-nowrap px-6 py-4">{(s.dailyRate * 100).toFixed(2)}%</td>
                            <td className="whitespace-nowrap px-6 py-4 font-semibold text-emerald-400">{fmt(s.cumulativeReward)} USDT</td>
                            <td className="min-w-[160px] px-6 py-4">
                              <div className="mb-1 h-1.5 w-36 overflow-hidden rounded-full bg-slate-950">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-cyan-400' : 'bg-gradient-to-r from-emerald-500 to-cyan-500'}`}
                                  style={{ width: `${Math.max(2, pct)}%` }}
                                />
                              </div>
                              <p className="mt-1 text-[11px] text-slate-500">{fmt(s.cumulativeReward)} / {fmt(s.maxRewardCap)} - {pct}%</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                                s.status === 'active'
                                  ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                  : s.status === 'completed'
                                    ? 'border border-cyan-400/20 bg-cyan-400/10 text-cyan-300'
                                    : 'border border-amber-500/20 bg-amber-500/10 text-amber-400'
                              }`}>
                                {s.status === 'completed' ? <CheckCircle2 className="h-3 w-3" /> : null}
                                {s.status === 'completed' ? 'Completed' : s.status === 'active' ? 'Active' : 'Paused'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {confirmOpen && plan && (
        <StakeModal
          plan={plan}
          amount={amount}
          setAmount={setAmount}
          inRange={inRange}
          withinBalance={withinBalance}
          dailyYield={dailyYield}
          available={balances?.availableDeposit ?? 0}
          busy={busy}
          error={error}
          setError={setError}
          onConfirm={submitStake}
          onClose={() => !busy && setConfirmOpen(false)}
        />
      )}

      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  );
};

const StakeModal = ({
  plan, amount, setAmount, inRange, withinBalance, dailyYield, available,
  busy, error, setError, onConfirm, onClose,
}) => {
  const value = Number(amount);
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" onClick={() => !busy && onClose()}>
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">{plan.name} - Stake USDT</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 transition hover:text-slate-300" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Range: {plan.rangeLabel} - {(plan.rate * 100).toFixed(2)}% daily - Available: {fmt(available)} USDT
        </p>

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          {plan.quick.map((v) => (
            <button
              key={v}
              onClick={() => { setAmount(String(v)); setError(''); }}
              className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition ${
                Number(amount) === v
                  ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-300'
                  : 'border-slate-700/80 bg-slate-950 text-slate-300 hover:border-slate-600'
              }`}
            >
              {v.toLocaleString()}
            </button>
          ))}
        </div>

        <input
          type="number"
          min="0"
          step="1"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setError(''); }}
          placeholder={`Amount (${plan.rangeLabel})`}
          className="mt-3 w-full rounded-lg border border-slate-700/80 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
        />

        {/* Dynamic Airdrop Bonus Preview Card */}
        <AirdropBonusPreview amount={amount} />

        {value > 0 && Number.isFinite(value) && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-sm">
            <Zap className="h-4 w-4 text-cyan-400" />
            <span className="text-slate-300">
              ${fmt(value)} {'\u2192'} {(plan.rate * 100).toFixed(2)}% = <span className="font-semibold text-cyan-300">${fmt(dailyYield)}/day</span>
            </span>
          </div>
        )}
        {value > 0 && Number.isFinite(value) && !inRange && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
            <AlertCircle className="h-4 w-4" />
            Amount must be within {plan.rangeLabel}
          </div>
        )}
        {inRange && !withinBalance && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-400">
            <AlertCircle className="h-4 w-4" />
            Exceeds available deposit balance
          </div>
        )}

        <button
          onClick={onConfirm}
          disabled={!inRange || !withinBalance || busy}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 py-2.5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          Confirm & Stake
        </button>

        <p className="mt-3 text-center text-[11px] text-slate-500">
          Principal is locked (STAKE_LOCK) - max reward cap is 100% of principal - your sponsor gets a one-time 6% bonus.
        </p>
      </div>
    </div>
  );
};

export default StakingPage;

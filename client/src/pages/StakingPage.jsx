import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, X, AlertCircle, CheckCircle2, Lock, TrendingUp, Zap, Gift,
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

  return (
    <div className="text-[#ECFDF5] min-h-screen bg-[#071C18]">
      <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold font-mono tracking-tight text-[#ECFDF5]">Staking Positions</h2>
            <p className="mt-1 text-sm text-[#A7C4B8]">Choose your emerald staking tier and accrue daily yields</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-[#1E493B] bg-[#0B2720] px-4 py-2 shadow-sm">
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#91A89E]">Available Deposit</p>
              <p className="text-sm font-bold font-mono text-[#34D399]">{balances ? `${fmt(balances.availableDeposit)} USDT` : '—'}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-[#34D399]" />
          </div>
        ) : (
          <>
            {/* Plan cards */}
            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {PLANS.map((p) => (
                <div
                  key={p.key}
                  className="group relative flex flex-col justify-between rounded-3xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] p-6 shadow-card-gold transition-all duration-300 hover:border-[#D4AF37]/70 hover:shadow-[0_8px_35px_rgba(212,175,55,0.2)]"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold font-mono tracking-wide text-[#F1D78A]">{p.name}</h3>
                      <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2 py-0.5 text-[10px] font-mono font-bold text-[#F1D78A]">
                        {p.days} Days
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs font-mono text-[#A7C4B8]">{p.subtitle}</p>

                    <p className="mt-4 text-4xl font-black font-mono tracking-tight text-gold-gradient">
                      {(p.rate * 100).toFixed(2)}<span className="text-2xl text-[#D4AF37]">%</span>
                    </p>
                    <p className="mt-1 text-xs font-mono text-[#91A89E]">Daily Yield for {p.days} Days</p>

                    <div className="mt-5 space-y-2 border-t border-[#1E493B] pt-4 text-xs font-mono">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[#A7C4B8]">Staking Range</span>
                        <span className="font-semibold text-[#ECFDF5]">{p.rangeLabel}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[#A7C4B8]">Reward Cap</span>
                        <span className="font-semibold text-[#F1D78A]">100% Guaranteed</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 rounded-xl border border-[#1E493B] bg-[#0B2720] px-2.5 py-1.5 text-[#6EE7B7]">
                        <span className="flex items-center gap-1 text-[11px] font-medium text-[#D4AF37]">
                          <Gift className="h-3 w-3" /> Airdrop Bonus
                        </span>
                        <span className="font-mono text-[10px] font-bold text-[#F1D78A]">{p.promoBonus}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => openPlan(p)}
                    className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F1D78A] to-[#D4AF37] hover:brightness-110 py-2.5 text-sm font-bold font-mono text-[#071C18] transition shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                  >
                    Stake Now
                  </button>
                </div>
              ))}
            </section>

            {/* Active stakes table */}
            <section className="mt-8 rounded-3xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] shadow-card-gold transition-all duration-300 hover:border-[#D4AF37]/60">
              <div className="flex items-center justify-between border-b border-[#1E493B] px-6 py-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#34D399]" />
                  <h3 className="text-sm font-semibold font-mono text-[#ECFDF5]">Your Active Stakes</h3>
                </div>
                <span className="rounded-full border border-[#1E493B] bg-[#0B2720] px-2.5 py-0.5 text-[11px] font-mono text-[#A7C4B8]">
                  {stakes.length} position{stakes.length === 1 ? '' : 's'}
                </span>
              </div>

              {stakes.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-14">
                  <Lock className="mb-4 h-10 w-10 text-[#1E493B]" />
                  <p className="text-sm font-medium text-[#A7C4B8]">No stakes yet</p>
                  <p className="mt-1 max-w-xs text-center text-xs text-[#91A89E]">
                    Pick a plan above and click Stake Now to start earning daily rewards.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead>
                      <tr className="text-[11px] font-mono uppercase tracking-wider text-[#91A89E] border-b border-[#1E493B]">
                        <th className="px-6 py-3 font-medium">Plan</th>
                        <th className="px-6 py-3 font-medium">Staked</th>
                        <th className="px-6 py-3 font-medium">Reward Rate</th>
                        <th className="px-6 py-3 font-medium">Rewards Earned</th>
                        <th className="px-6 py-3 font-medium">Progress</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E493B]">
                      {stakes.map((s) => {
                        const p = planForStake(s.amount);
                        const pct = Math.min(100, round((s.cumulativeReward / s.maxRewardCap) * 100));
                        return (
                          <tr key={s._id} className="text-[#ECFDF5] hover:bg-[#164B3A]/40 transition">
                            <td className="px-6 py-4">
                              <p className="font-semibold font-mono tracking-wide text-[#ECFDF5]">{p.name}</p>
                              <p className="mt-0.5 text-[11px] font-mono text-[#91A89E]">
                                Started {new Date(s.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                              </p>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 font-mono">{fmt(s.amount)} USDT</td>
                            <td className="whitespace-nowrap px-6 py-4 font-mono text-[#6EE7B7]">{(s.dailyRate * 100).toFixed(2)}%</td>
                            <td className="whitespace-nowrap px-6 py-4 font-semibold font-mono text-[#34D399]">{fmt(s.cumulativeReward)} USDT</td>
                            <td className="min-w-[160px] px-6 py-4">
                              <div className="mb-1 h-2 w-36 overflow-hidden rounded-full bg-[#0B2720] border border-[#1E493B]">
                                <div
                                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#34D399] to-[#6EE7B7]"
                                  style={{ width: `${Math.max(2, pct)}%` }}
                                />
                              </div>
                              <p className="mt-1 text-[11px] font-mono text-[#91A89E]">{fmt(s.cumulativeReward)} / {fmt(s.maxRewardCap)} - {pct}%</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-mono font-medium ${
                                s.status === 'active'
                                  ? 'border border-[#34D399]/30 bg-[#34D399]/10 text-[#34D399]'
                                  : s.status === 'completed'
                                    ? 'border border-[#6EE7B7]/30 bg-[#6EE7B7]/10 text-[#6EE7B7]'
                                    : 'border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#F1D78A]'
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#071C18]/80 p-4 backdrop-blur-sm" onClick={() => !busy && onClose()}>
      <div className="w-full max-w-md rounded-3xl border border-[#D4AF37]/40 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] p-6 shadow-[0_0_50px_rgba(212,175,55,0.25)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-[#1E493B]">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#D4AF37]" />
            <h3 className="text-sm font-semibold font-mono text-[#F1D78A]">{plan.name} - Stake USDT</h3>
          </div>
          <button onClick={onClose} className="text-[#A7C4B8] transition hover:text-[#ECFDF5]" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-xs font-mono text-[#A7C4B8]">
          Range: {plan.rangeLabel} - {(plan.rate * 100).toFixed(2)}% daily - Available: {fmt(available)} USDT
        </p>

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          {plan.quick.map((v) => (
            <button
              key={v}
              onClick={() => { setAmount(String(v)); setError(''); }}
              className={`flex-1 rounded-xl border py-2.5 text-xs font-bold font-mono transition ${
                Number(amount) === v
                  ? 'border-[#34D399] bg-[#34D399]/20 text-[#34D399]'
                  : 'border-[#1E493B] bg-[#0B2720] text-[#A7C4B8] hover:border-[#34D399]/40'
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
          className="mt-3 w-full rounded-xl border border-[#1E493B] bg-[#0B2720] px-4 py-2.5 text-sm font-mono text-[#ECFDF5] placeholder-[#91A89E] outline-none focus:border-[#34D399]"
        />

        {/* Dynamic Airdrop Bonus Preview Card */}
        <AirdropBonusPreview amount={amount} />

        {value > 0 && Number.isFinite(value) && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#34D399]/20 bg-[#10352C] px-4 py-3 text-sm">
            <Zap className="h-4 w-4 text-[#34D399]" />
            <span className="text-[#A7C4B8] text-xs font-mono">
              ${fmt(value)} {'\u2192'} {(plan.rate * 100).toFixed(2)}% = <span className="font-semibold text-[#34D399]">${fmt(dailyYield)}/day</span>
            </span>
          </div>
        )}
        {value > 0 && Number.isFinite(value) && !inRange && (
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 px-4 py-3 text-xs text-[#F1D78A]">
            <AlertCircle className="h-4 w-4" />
            Amount must be within {plan.rangeLabel}
          </div>
        )}
        {inRange && !withinBalance && (
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4" />
            Exceeds available deposit balance
          </div>
        )}

        <button
          onClick={onConfirm}
          disabled={!inRange || !withinBalance || busy}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#34D399] hover:bg-[#6EE7B7] py-3 text-sm font-bold font-mono text-[#071C18] disabled:cursor-not-allowed disabled:opacity-50 transition shadow-[0_0_20px_rgba(52,211,153,0.3)]"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          Confirm & Stake
        </button>

        <p className="mt-3 text-center text-[11px] font-mono text-[#91A89E]">
          Principal is locked (STAKE_LOCK) - max reward cap is 100% of principal.
        </p>
      </div>
    </div>
  );
};

export default StakingPage;

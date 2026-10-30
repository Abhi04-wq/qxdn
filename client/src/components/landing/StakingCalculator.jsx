import { useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, ArrowRight, Sparkles, Gift, Check, ShieldCheck, Zap, Lock, Unlock, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function StakingCalculator() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const sliderId = useId();

  const [amount, setAmount] = useState(2500);

  // Dynamic Tier Detection based on QNDX Architecture
  const getTier = (val) => {
    if (val <= 1000) {
      return {
        id: 'starter',
        name: 'STARTER Plan',
        rate: 0.004,
        rateFormatted: '0.40%',
        days: 250,
        apy: '146.0%',
        badgeColor: 'border-[#34D399]/40 text-[#34D399] bg-[#34D399]/10',
        tokens: [
          { name: 'SHIB', count: '1,000,000', icon: '🐕', locked: false },
          { name: 'VET', count: '500', icon: '⚡', locked: false },
          { name: 'WILD', count: 'Locked', icon: '🌐', locked: true },
          { name: 'DOGE', count: 'Locked', icon: '🚀', locked: true },
        ],
      };
    }
    if (val <= 5000) {
      return {
        id: 'rapid',
        name: 'RAPID Plan',
        rate: 0.0045,
        rateFormatted: '0.45%',
        days: 223,
        apy: '164.25%',
        badgeColor: 'border-[#34D399] text-[#34D399] bg-[#34D399]/20 shadow-[0_0_15px_rgba(52,211,153,0.25)]',
        tokens: [
          { name: 'SHIB', count: '2,000,000', icon: '🐕', locked: false },
          { name: 'VET', count: '100', icon: '⚡', locked: false },
          { name: 'WILD', count: '50', icon: '🌐', locked: false },
          { name: 'DOGE', count: 'Locked', icon: '🚀', locked: true },
        ],
      };
    }
    return {
      id: 'rocket',
      name: 'ROCKET Plan',
      rate: 0.005,
      rateFormatted: '0.50%',
      days: 200,
      apy: '182.5%',
      badgeColor: 'border-[#D4AF37] text-[#F5D98E] bg-[#D4AF37]/20 shadow-[0_0_18px_rgba(212,175,55,0.35)]',
      tokens: [
        { name: 'SHIB', count: '10,000,000', icon: '🐕', locked: false },
        { name: 'VET', count: '5,000', icon: '⚡', locked: false },
        { name: 'WILD', count: '250', icon: '🌐', locked: false },
        { name: 'DOGE', count: '250', icon: '🚀', locked: false },
      ],
    };
  };

  const currentTier = getTier(amount);
  const dailyReturn = Math.round(amount * currentTier.rate * 100) / 100;
  const weeklyReturn = Math.round(dailyReturn * 7 * 100) / 100;
  const maxCumulativeCap = amount; // 100% of principal
  const totalReturnWithUnlock = amount + maxCumulativeCap; // Principal + 100% cap

  // Slider progress percent
  const minSlider = 100;
  const maxSlider = 10000;
  const progressPercent = Math.min(100, Math.max(0, ((amount - minSlider) / (maxSlider - minSlider)) * 100));

  const presets = [500, 1000, 2500, 5000, 10000];

  const handleStartStaking = () => {
    if (user) {
      navigate('/dashboard/staking');
    } else {
      navigate('/register');
    }
  };

  const isRocket = currentTier.id === 'rocket';

  return (
    <section id="calculator" className="relative py-24 sm:py-32 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle_at_50%_50%,rgba(52,211,153,0.06),transparent_70%)] blur-3xl pointer-events-none" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#1E493B] bg-[#0B2720]/80 backdrop-blur-md mb-4 shadow-[0_0_15px_rgba(52,211,153,0.1)]"
        >
          <Calculator className="w-3.5 h-3.5 text-[#34D399]" />
          <span className="text-xs font-mono font-medium text-[#34D399]">Live Mathematical Simulator</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#F5F5F0] tracking-tight font-mono"
        >
          Interactive Yield & Return Calculator
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 text-[#A7B8AE] text-sm sm:text-base leading-relaxed max-w-2xl mx-auto"
        >
          Simulate your earnings across tiered rates, Saturday liquidity releases, guaranteed 100% principal return cap,
          and instant multi-token airdrop allocations.
        </motion.p>
      </div>

      {/* Main Calculator Glass Container */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: false, amount: 0.15 }}
        transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch rounded-3xl border border-[#1E493B] bg-[#0B2720]/80 backdrop-blur-2xl p-6 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_35px_rgba(52,211,153,0.08)]"
      >
        {/* Left Column: Slider & Amount Configurator */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor={sliderId} className="text-xs font-mono uppercase tracking-wider text-[#A7B8AE]">
                Staking Principal Amount
              </label>
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${currentTier.badgeColor}`}>
                {currentTier.name} ({currentTier.rateFormatted}/day)
              </span>
            </div>

            {/* Big Interactive Amount Value */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-5xl sm:text-7xl font-black text-[#F5F5F0] font-mono tracking-tight drop-shadow-[0_0_25px_rgba(52,211,153,0.25)]">
                ${amount.toLocaleString()}
              </span>
              <span className="text-xl font-bold font-mono text-[#34D399]">USDT</span>
            </div>

            {/* Modern Accessible Range Slider */}
            <div className="mt-8">
              <input
                id={sliderId}
                type="range"
                min={minSlider}
                max={maxSlider}
                step={50}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                aria-valuetext={`${amount} USDT locked in ${currentTier.name}`}
                className="qndx-slider w-full"
                style={{ '--slider-progress': `${progressPercent}%` }}
              />
              <div className="flex justify-between text-xs font-mono text-[#718A7F] mt-2">
                <span>Min: $100</span>
                <span>$2,500</span>
                <span>$5,000</span>
                <span>Max: $10,000+</span>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="mt-6 flex flex-wrap gap-2.5">
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => setAmount(p)}
                  className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all border ${
                    amount === p
                      ? 'border-[#34D399] bg-[#34D399]/20 text-[#34D399] shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                      : 'border-[#1E493B] bg-[#071C18]/80 text-[#A7B8AE] hover:border-[#34D399]/40 hover:text-[#F5F5F0]'
                  }`}
                >
                  ${p.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Instant Multi-Token Airdrop Preview */}
          <div className="p-5 rounded-2xl border border-[#1E493B] bg-[#071C18]/85 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#34D399]">
                <Gift className="w-4 h-4 text-[#34D399]" />
                <span>Instant Guaranteed Multi-Token Allocation</span>
              </div>
              <span className="text-[10px] font-mono text-[#A7B8AE] uppercase bg-[#0B2720] px-2 py-0.5 rounded border border-[#1E493B]">
                On-Chain Credit
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {currentTier.tokens.map((token) => (
                <div
                  key={token.name}
                  className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                    token.locked
                      ? 'border-[#1E493B]/60 bg-[#0B2720]/40 opacity-50'
                      : 'border-[#1E493B] bg-[#0B2720]/90 shadow-[0_0_10px_rgba(52,211,153,0.05)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{token.icon}</span>
                    {token.locked ? (
                      <Lock className="w-3 h-3 text-[#718A7F]" />
                    ) : (
                      <Unlock className="w-3 h-3 text-[#34D399]" />
                    )}
                  </div>
                  <div className="mt-2.5">
                    <p
                      className={`font-mono text-xs font-black ${
                        token.locked ? 'text-[#718A7F]' : 'text-[#F5F5F0]'
                      }`}
                    >
                      {token.locked ? 'Locked' : `+${token.count}`}
                    </p>
                    <p className="text-[10px] font-mono text-[#A7B8AE] uppercase">{token.name}</p>
                  </div>
                </div>
              ))}
            </div>
            {currentTier.id !== 'rocket' && (
              <p className="text-[11px] font-mono text-[#718A7F] text-center pt-1">
                * Staking $5,001+ unlocks the full 4-token suite including DOGE & WILD.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Yield Breakdown & Action */}
        <div className="lg:col-span-5 rounded-2xl border border-[#1E493B] bg-[#071C18]/95 p-6 sm:p-8 flex flex-col justify-between shadow-[0_0_35px_rgba(52,211,153,0.06)] relative overflow-hidden">
          {/* Ambient card corner glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-[radial-gradient(circle_at_100%_0%,rgba(52,211,153,0.12),transparent_70%)] pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E493B]">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#A7B8AE]">
                Mathematical Protocol Breakdown
              </h3>
              <span className="text-[10px] font-mono text-[#34D399] flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {currentTier.apy} APY
              </span>
            </div>

            {/* Calculations List */}
            <div className="mt-6 space-y-5">
              {/* Daily Earnings */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#F5F5F0]">Daily Return Rate</p>
                  <p className="text-[11px] text-[#718A7F] font-mono">00:00 UTC Daily Accrual</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xl font-bold text-[#34D399]">
                    +${dailyReturn.toFixed(2)}{' '}
                    <span className="text-xs font-normal text-[#A7B8AE]">/ day</span>
                  </p>
                  <p className="text-[10px] font-mono text-[#A7F3D0]">{currentTier.rateFormatted} compounding yield</p>
                </div>
              </div>

              {/* Saturday Weekly Release */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#F5F5F0]">Saturday Release Batch</p>
                  <p className="text-[11px] text-[#718A7F] font-mono">Weekly Liquidity Settlement</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xl font-bold text-[#F5F5F0]">
                    +${weeklyReturn.toFixed(2)}{' '}
                    <span className="text-xs font-normal text-[#A7B8AE]">/ week</span>
                  </p>
                  <p className="text-[10px] font-mono text-[#718A7F]">Every Saturday @ 00:05 UTC</p>
                </div>
              </div>

              {/* Cumulative Cap Duration */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#F5F5F0]">Time to 100% Cap</p>
                  <p className="text-[11px] text-[#718A7F] font-mono">100% Cumulative Max Return</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-base font-bold text-[#A7F3D0]">{currentTier.days} Days</p>
                  <p className="text-[10px] font-mono text-[#718A7F]">Full cycle completion</p>
                </div>
              </div>

              {/* Total Gross Return Card */}
              <div className="p-4 rounded-xl border border-[#1E493B] bg-[#0B2720]/80 space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-mono font-medium text-[#F5F5F0]">Total Capital at Completion</span>
                  <span className={`text-xl font-bold font-mono ${isRocket ? 'text-[#F5D98E]' : 'text-[#34D399]'}`}>
                    ${totalReturnWithUnlock.toLocaleString()} USDT
                  </span>
                </div>
                <p className="text-[11px] text-[#A7B8AE] leading-relaxed">
                  Includes 100% rewards (${maxCumulativeCap.toLocaleString()}) + 100% original principal unlock credited
                  automatically via <code className="text-[#34D399] font-mono">STAKE_UNLOCK</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="mt-8 pt-6 border-t border-[#1E493B] relative z-10">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartStaking}
              className={`relative group overflow-hidden w-full py-4 rounded-xl font-bold font-mono text-sm tracking-wide flex items-center justify-center gap-2 transition-all ${
                isRocket
                  ? 'bg-gradient-to-r from-[#D4AF37] via-[#F5D98E] to-[#D4AF37] text-[#020B08] shadow-[0_0_25px_rgba(212,175,55,0.4)]'
                  : 'bg-gradient-to-r from-[#34D399] to-[#6EE7B7] text-[#020B08] shadow-[0_0_25px_rgba(52,211,153,0.35)]'
              }`}
            >
              {/* Light sweep */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

              <span>Lock & Activate Position (${amount.toLocaleString()})</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </motion.button>

            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#718A7F] font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
              <span>Audited append-only financial ledger on BNB Smart Chain</span>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

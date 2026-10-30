import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Check, Sparkles, Zap, ArrowRight, Shield, Gift, Flame, Trophy, Coins, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

function TiltTierCard({ tier, idx, onSelect }) {
  const cardRef = useRef(null);

  // Mouse tilt physics
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 200, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 200, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7deg', '-7deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7deg', '7deg']);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const isRocket = tier.id === 'rocket';
  const isRapid = tier.id === 'rapid';

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      initial={{ opacity: 0, y: 45, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: false, amount: 0.15 }}
      transition={{ duration: 0.9, delay: idx * 0.15, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -10 }}
      className={`relative rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 backdrop-blur-2xl ${
        isRocket
          ? 'bg-gradient-to-b from-[#0B2720]/95 via-[#071C18]/95 to-[#020B08]/95 border-2 border-[#D4AF37]/70 shadow-[0_0_40px_rgba(212,175,55,0.22)]'
          : isRapid
          ? 'bg-gradient-to-b from-[#10352C]/90 via-[#0B2720]/90 to-[#071C18]/90 border-2 border-[#34D399]/60 shadow-[0_0_35px_rgba(52,211,153,0.18)]'
          : 'bg-[#0B2720]/80 border border-[#1E493B] hover:border-[#34D399]/40 hover:shadow-[0_0_25px_rgba(52,211,153,0.1)]'
      }`}
    >
      {/* Popular or Top Tier Badges */}
      {isRapid && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#34D399] to-[#6EE7B7] text-[#020B08] font-mono text-[11px] font-black uppercase tracking-wider shadow-[0_0_18px_rgba(52,211,153,0.5)] flex items-center gap-1.5 z-20">
          <Zap className="w-3.5 h-3.5 fill-[#020B08]" />
          <span>Most Popular Choice</span>
        </div>
      )}

      {isRocket && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F5D98E] to-[#D4AF37] text-[#020B08] font-mono text-[11px] font-black uppercase tracking-wider shadow-[0_0_20px_rgba(212,175,55,0.5)] flex items-center gap-1.5 z-20">
          <Flame className="w-3.5 h-3.5 fill-[#020B08] text-[#020B08]" />
          <span>Maximum APY & Airdrops</span>
        </div>
      )}

      {/* Ambient background glow inside card */}
      <div
        className={`absolute inset-0 rounded-3xl pointer-events-none opacity-30 ${
          isRocket
            ? 'bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.25),transparent_70%)]'
            : isRapid
            ? 'bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,0.25),transparent_70%)]'
            : 'bg-[radial-gradient(circle_at_50%_0%,rgba(30,73,59,0.3),transparent_70%)]'
        }`}
      />

      <div className="relative z-10">
        {/* Tier Name & Subtitle */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-2xl font-black font-mono tracking-wider ${isRocket ? 'text-[#F5D98E]' : 'text-[#F5F5F0]'}`}>
                {tier.name}
              </h3>
              {isRocket && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                  FLAGSHIP
                </span>
              )}
            </div>
            <p className="text-xs text-[#A7B8AE] mt-1">{tier.subtitle}</p>
          </div>
          <span
            className={`text-xs font-mono px-3 py-1 rounded-full border ${
              isRocket
                ? 'bg-[#0B2720] border-[#D4AF37]/50 text-[#F5D98E]'
                : isRapid
                ? 'bg-[#0B2720] border-[#34D399]/50 text-[#34D399]'
                : 'bg-[#071C18] border-[#1E493B] text-[#A7B8AE]'
            }`}
          >
            {tier.range}
          </span>
        </div>

        {/* Big Daily Rate & APY */}
        <div className={`mt-7 pb-6 border-b ${isRocket ? 'border-[#D4AF37]/25' : 'border-[#1E493B]'}`}>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-5xl sm:text-6xl font-black font-mono tracking-tight ${
                isRocket
                  ? 'bg-gradient-to-r from-[#F5D98E] via-[#D4AF37] to-[#F1D78A] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                  : 'text-[#34D399] drop-shadow-[0_0_20px_rgba(52,211,153,0.3)]'
              }`}
            >
              {tier.rate}
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-[#A7B8AE]">/ day</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-[#071C18]/80 border border-[#1E493B]">
              <span className="text-[10px] text-[#718A7F] block uppercase">Time to 100% Cap</span>
              <span className="text-[#F5F5F0] font-bold text-sm">{tier.days} Days</span>
            </div>
            <div className={`p-2.5 rounded-xl bg-[#071C18]/80 border ${isRocket ? 'border-[#D4AF37]/40' : 'border-[#1E493B]'}`}>
              <span className="text-[10px] text-[#718A7F] block uppercase">Annualized APY</span>
              <span className={`font-bold text-sm ${isRocket ? 'text-[#F5D98E]' : 'text-[#34D399]'}`}>
                {tier.annualized}
              </span>
            </div>
          </div>
        </div>

        {/* Guaranteed Airdrop Box */}
        <div
          className={`mt-6 p-4 rounded-2xl border ${
            isRocket
              ? 'border-[#D4AF37]/40 bg-[#D4AF37]/10'
              : isRapid
              ? 'border-[#34D399]/40 bg-[#34D399]/10'
              : 'border-[#1E493B] bg-[#071C18]/80'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
              <Gift className={`w-3.5 h-3.5 ${isRocket ? 'text-[#D4AF37]' : 'text-[#34D399]'}`} />
              <span className={isRocket ? 'text-[#F5D98E]' : 'text-[#34D399]'}>Instant Promotional Drop</span>
            </div>
            <span className="text-[9px] font-mono uppercase text-[#A7B8AE] bg-[#020B08]/60 px-2 py-0.5 rounded">
              Verified
            </span>
          </div>
          <p className="font-mono text-xs text-[#F5F5F0] font-bold leading-relaxed">{tier.promoAirdrop}</p>
        </div>

        {/* Features List */}
        <div className="mt-6 space-y-3">
          {tier.features.map((feature, i) => (
            <div key={i} className="flex items-start gap-2.5 text-xs text-[#A7B8AE] leading-snug">
              <div
                className={`mt-0.5 rounded-full p-0.5 shrink-0 ${
                  isRocket
                    ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                    : 'bg-[#34D399]/20 text-[#34D399]'
                }`}
              >
                <Check className="w-3 h-3" />
              </div>
              <span className="text-[#D1FAE5]/90">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action CTA Button */}
      <div className={`mt-8 pt-6 border-t ${isRocket ? 'border-[#D4AF37]/25' : 'border-[#1E493B]'} relative z-10`}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(tier)}
          className={`relative group overflow-hidden w-full py-3.5 rounded-xl font-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
            isRocket
              ? 'bg-gradient-to-r from-[#D4AF37] via-[#F5D98E] to-[#D4AF37] text-[#020B08] shadow-[0_0_25px_rgba(212,175,55,0.4)]'
              : isRapid
              ? 'bg-gradient-to-r from-[#34D399] to-[#6EE7B7] text-[#020B08] shadow-[0_0_20px_rgba(52,211,153,0.35)]'
              : 'border border-[#1E493B] bg-[#0B2720] hover:bg-[#10352C] text-[#34D399] hover:border-[#34D399]/50'
          }`}
        >
          {/* Light sweep animation */}
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          <span>Select {tier.name}</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function TierCards() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const tiers = [
    {
      id: 'starter',
      name: 'STARTER',
      subtitle: 'Accessible Capital Accumulation',
      range: '100 – 1,000 USDT',
      rate: '0.40%',
      rateNum: 0.004,
      days: 250,
      annualized: '146.0%',
      badge: 'Starter Tier',
      promoAirdrop: '1,000,000 SHIB + 500 VET',
      features: [
        'Daily Accrual Engine (00:00 UTC Automated)',
        'Weekly Saturday Batch Liquidity Release',
        '100% Cumulative Cap Guarantee (250 Days)',
        'Automatic Principal Capital STAKE_UNLOCK',
        '10-Level Referral Commission Qualified',
      ],
    },
    {
      id: 'rapid',
      name: 'RAPID',
      subtitle: 'Accelerated Yield Velocity',
      range: '1,001 – 5,000 USDT',
      rate: '0.45%',
      rateNum: 0.0045,
      days: 223,
      annualized: '164.25%',
      badge: 'Most Popular',
      promoAirdrop: '2M SHIB + 100 VET + 50 WILD',
      features: [
        'Enhanced 0.45% Daily Compounding Accrual',
        'Accelerated Cycle to 100% Cap (~223 Days)',
        'Weekly Saturday Batch Liquidity Release',
        'Guaranteed Principal Return at Maturity',
        'Priority L1–L10 Network Depth Tracking',
      ],
    },
    {
      id: 'rocket',
      name: 'ROCKET',
      subtitle: 'Maximum Protocol APY Tier',
      range: '5,001+ USDT',
      rate: '0.50%',
      rateNum: 0.005,
      days: 200,
      annualized: '182.5%',
      badge: 'Maximum APY & Airdrops',
      promoAirdrop: '10M SHIB + 5K VET + 250 WILD + 250 DOGE',
      features: [
        'Maximum 0.50% Daily Yield (182.5% Annualized)',
        'Fastest Maturity: 200 Days to 100% Cap',
        'All 4 Instant Token Airdrops Included',
        'Full Principal Capital Unlocked at Cap Reach',
        'Maximized Sponsor Commissions for Network',
      ],
    },
  ];

  const handleSelectTier = (tier) => {
    if (user) {
      navigate('/dashboard/staking');
    } else {
      navigate('/register');
    }
  };

  return (
    <section id="tiers" className="relative py-24 sm:py-32 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Background radial atmosphere */}
      <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-[radial-gradient(circle_at_50%_50%,rgba(52,211,153,0.06),transparent_70%)] blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.05),transparent_70%)] blur-3xl pointer-events-none" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#1E493B] bg-[#0B2720]/80 backdrop-blur-md mb-4 shadow-[0_0_15px_rgba(52,211,153,0.1)]"
        >
          <Zap className="w-3.5 h-3.5 text-[#34D399]" />
          <span className="text-xs font-mono font-medium text-[#34D399]">Developer Plan v2.0 Architecture</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#F5F5F0] tracking-tight font-mono"
        >
          Tiered Staking Positions
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 text-[#A7B8AE] text-sm sm:text-base leading-relaxed max-w-2xl mx-auto"
        >
          Transparent rates governed by audited smart contracts and immutable append-only ledgers. Higher staking
          positions unlock accelerated yield velocity and the full 4-token promotional allocation suite.
        </motion.p>
      </div>

      {/* Cards 3D Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch perspective-[1200px]">
        {tiers.map((tier, idx) => (
          <TiltTierCard key={tier.id} tier={tier} idx={idx} onSelect={handleSelectTier} />
        ))}
      </div>
    </section>
  );
}

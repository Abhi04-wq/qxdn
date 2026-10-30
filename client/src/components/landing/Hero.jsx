import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Coins,
  Clock,
  Sparkles,
  Zap,
  Lock,
  ChevronRight,
  ExternalLink,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Hero({ onOpenWhitepaper }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Live simulation accrual ticker
  const [liveAccrual, setLiveAccrual] = useState(4.5);
  const [saturdayCountdown, setSaturdayCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  // Mouse Parallax 3D Card Physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 22, stiffness: 160 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), springConfig);

  const handleCardMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleCardMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  useEffect(() => {
    // Micro tick simulation
    const interval = setInterval(() => {
      setLiveAccrual((prev) => +(prev + 0.00005).toFixed(5));
    }, 100);

    // Calculate time until next Saturday 00:05 UTC
    const updateCountdown = () => {
      const now = new Date();
      const target = new Date();
      const currentDay = now.getUTCDay();
      const daysUntilSaturday = (6 - currentDay + 7) % 7 || 7;
      target.setUTCDate(now.getUTCDate() + daysUntilSaturday);
      target.setUTCHours(0, 5, 0, 0);

      const diff = target - now;
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / 1000 / 60) % 60);
        const secs = Math.floor((diff / 1000) % 60);
        setSaturdayCountdown({ days, hours, mins, secs });
      }
    };

    updateCountdown();
    const countInterval = setInterval(updateCountdown, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countInterval);
    };
  }, []);

  const handleStartStaking = () => {
    if (user) {
      navigate('/dashboard/staking');
    } else {
      navigate('/register');
    }
  };

  const airdropTokens = [
    { name: 'SHIB', amount: '2,000,000', color: 'from-[#D4AF37] to-[#F5D98E]', pos: '-top-5 -left-4', delay: 0 },
    { name: 'VET', amount: '1,000', color: 'from-[#34D399] to-[#A7F3D0]', pos: '-top-7 -right-5', delay: 0.2 },
    { name: 'WILD', amount: '100', color: 'from-[#064E3B] to-[#34D399]', pos: '-bottom-6 -left-5', delay: 0.4 },
    { name: 'DOGE', amount: '50', color: 'from-[#F5D98E] to-[#D4AF37]', pos: '-bottom-7 -right-4', delay: 0.6 },
  ];

  return (
    <section
      id="hero"
      className="relative min-h-screen pt-32 pb-20 lg:pt-36 lg:pb-28 flex items-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden"
    >
      {/* Ambient background glow accents */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 w-[650px] h-[650px] bg-[radial-gradient(circle_at_50%_50%,rgba(6,78,59,0.22),rgba(2,44,34,0.08)_50%,transparent_80%)] blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.12),transparent_75%)] blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full">
        {/* LEFT COLUMN: Content & Strategic Typography */}
        <div className="lg:col-span-7 flex flex-col items-start z-10">
          {/* Eyebrow badge with glowing emerald pulse & gold hairline */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#D4AF37]/35 bg-gradient-to-r from-[#022C22]/90 via-[#064E3B]/60 to-[#022C22]/90 backdrop-blur-md mb-6 shadow-[0_0_25px_rgba(212,175,55,0.15)]"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34D399] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#34D399]" />
            </span>
            <span className="text-[11px] sm:text-xs font-mono font-semibold tracking-wider uppercase text-[#A7F3D0]">
              Institutional Staking Ecosystem • Up to 182.5% APY
            </span>
          </motion.div>

          {/* Staggered Word Reveal Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.95, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#F5F5F0] leading-[1.12]"
          >
            Next-Gen Capital Accumulation &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A7F3D0] via-[#D1FAE5] to-[#F5D98E] drop-shadow-[0_0_35px_rgba(52,211,153,0.35)]">
              Multi-Token Yields
            </span>
          </motion.h1>

          {/* Engaging Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-base sm:text-lg text-[#A7B8AE] max-w-xl leading-relaxed"
          >
            Stake USDT on Binance Smart Chain with mathematical certainty. Earn{' '}
            <span className="text-[#A7F3D0] font-semibold font-mono">0.40% to 0.50% daily</span>, unlock instant 4-token airdrops
            (SHIB, VET, WILD, DOGE), and benefit from a cryptographically audited append-only ledger.
          </motion.p>

          {/* Dual Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto"
          >
            {/* Primary Action Button: Emerald Gradient with Metallic Gold Border */}
            <motion.button
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartStaking}
              className="relative group overflow-hidden px-8 py-4 rounded-xl bg-gradient-to-r from-[#064E3B] via-[#0B3D2E] to-[#022C22] border border-[#D4AF37]/70 text-[#F5F5F0] font-bold font-mono text-sm tracking-wide shadow-[0_0_30px_rgba(212,175,55,0.25),0_0_20px_rgba(52,211,153,0.2)] flex items-center justify-center gap-2 transition-all hover:border-[#D4AF37]"
            >
              {/* Animated Light Sweep on Hover */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform ease-in-out pointer-events-none" />
              <span className="relative z-10 text-gold-gradient font-black">Start Staking Now</span>
              <ArrowRight className="w-4 h-4 text-[#F5D98E] group-hover:translate-x-1 transition-transform relative z-10" />
            </motion.button>

            {/* Secondary Action: Transparent Glass Button with Mint Border */}
            <motion.button
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenWhitepaper}
              className="relative px-6 py-4 rounded-xl border border-[#A7F3D0]/40 bg-[#022C22]/60 hover:bg-[#064E3B]/60 hover:border-[#A7F3D0] backdrop-blur-xl text-[#A7F3D0] hover:text-[#D1FAE5] transition-all font-mono text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>Explore Architecture & Whitepaper</span>
            </motion.button>
          </motion.div>

          {/* Supporting Trust Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-wrap items-center gap-6 text-xs text-[#A7B8AE] font-mono"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#34D399]" />
              <span>Strict Append-Only Ledger</span>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#F5D98E]" />
              <span>Zero Native Inflation</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#A7F3D0]" />
              <span>Saturday Batch Releases</span>
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN: 3D Interactive Tilt Card with Orbiting Airdrops */}
        <div
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
          className="lg:col-span-5 relative flex justify-center items-center mt-6 lg:mt-0 perspective-1000"
        >
          {/* Orbiting Airdrop Token Chips with floating physics */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {airdropTokens.map((token, i) => (
              <motion.div
                key={token.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: [0, -9, 0],
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'easeInOut',
                  delay: token.delay,
                }}
                className={`absolute ${token.pos} z-20 pointer-events-auto`}
              >
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#D4AF37]/40 bg-[#022C22]/95 backdrop-blur-xl shadow-[0_10px_25px_rgba(0,0,0,0.6),0_0_15px_rgba(212,175,55,0.15)] hover:border-[#D4AF37] transition-all">
                  <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${token.color} shadow-sm`} />
                  <span className="font-mono text-xs font-bold text-[#F5F5F0]">+{token.amount}</span>
                  <span className="font-mono text-[10px] text-[#A7F3D0] uppercase font-semibold">{token.name}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Central 3D Interactive Parallax Card */}
          <motion.div
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            initial={{ opacity: 0, scale: 0.92, y: 40 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md rounded-3xl border border-[#D4AF37]/40 bg-gradient-to-b from-[#10352C]/90 via-[#0B2720]/95 to-[#020B08]/98 p-6 sm:p-7 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(212,175,55,0.18)] relative overflow-hidden"
          >
            {/* Top Glare Hairline */}
            <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-[#F5D98E] to-transparent opacity-70" />

            {/* Position Header */}
            <div className="flex items-center justify-between pb-5 border-b border-[#1E493B]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#F5D98E]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#A7B8AE]">Active Position</span>
                  <p className="font-bold text-[#F5F5F0] text-base font-mono">RAPID Plan v2.0</p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-mono font-bold rounded-full border border-[#34D399]/40 bg-[#34D399]/10 text-[#34D399] flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                Accruing Yield
              </span>
            </div>

            {/* Staked Principal Display */}
            <div className="py-5">
              <span className="text-[11px] font-mono text-[#A7B8AE] uppercase tracking-wider">Locked Staked Principal</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#F5F5F0] font-mono tracking-tight">
                  1,000.00 <span className="text-sm font-normal text-[#D4AF37]">USDT</span>
                </span>
                <span className="text-xs font-mono font-bold text-[#A7F3D0] bg-[#064E3B]/60 border border-[#A7F3D0]/30 px-2 py-0.5 rounded">
                  0.45% / day
                </span>
              </div>
            </div>

            {/* Micro Live Accrual Counter */}
            <div className="p-4 rounded-2xl bg-[#020B08]/90 border border-[#1E493B] space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#A7B8AE]">Live Accrued Reward</span>
                <span className="text-gold-gradient font-bold font-mono">+{liveAccrual.toFixed(5)} USDT</span>
              </div>
              {/* Progress bar towards 100% Guaranteed Cap */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-[#A7B8AE]">
                  <span>100% Cumulative Cap Progress</span>
                  <span className="text-[#A7F3D0] font-bold">45.2%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#0B2720] overflow-hidden border border-[#1E493B]">
                  <div
                    className="h-full bg-gradient-to-r from-[#064E3B] via-[#34D399] to-[#D4AF37] rounded-full"
                    style={{ width: '45.2%' }}
                  />
                </div>
              </div>
            </div>

            {/* Saturday Release Countdown Clock */}
            <div className="mt-5 pt-4 border-t border-[#1E493B]/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-xs font-mono text-[#A7B8AE]">Next Saturday Release:</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-xs font-bold text-[#F5F5F0]">
                <span className="bg-[#020B08] border border-[#1E493B] px-1.5 py-0.5 rounded text-[#A7F3D0]">
                  {saturdayCountdown.days}d
                </span>
                <span>:</span>
                <span className="bg-[#020B08] border border-[#1E493B] px-1.5 py-0.5 rounded text-[#A7F3D0]">
                  {String(saturdayCountdown.hours).padStart(2, '0')}h
                </span>
                <span>:</span>
                <span className="bg-[#020B08] border border-[#1E493B] px-1.5 py-0.5 rounded text-[#A7F3D0]">
                  {String(saturdayCountdown.mins).padStart(2, '0')}m
                </span>
                <span>:</span>
                <span className="bg-[#020B08] border border-[#D4AF37]/40 px-1.5 py-0.5 rounded text-[#F5D98E]">
                  {String(saturdayCountdown.secs).padStart(2, '0')}s
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

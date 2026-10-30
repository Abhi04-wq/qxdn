import { motion } from 'framer-motion';
import { ShieldCheck, Lock, RefreshCcw, Calendar, CheckCircle2, FileText, Code2, Terminal, ArrowRight, Sparkles } from 'lucide-react';

export default function SecurityGrid({ onOpenWhitepaper }) {
  const securityPillars = [
    {
      icon: ShieldCheck,
      title: 'Append-Only Financial Ledger',
      tag: 'Cryptographic Integrity',
      color: 'text-[#34D399] bg-[#34D399]/15 border-[#34D399]/40',
      glow: 'hover:shadow-[0_0_30px_rgba(52,211,153,0.15)]',
      description:
        'Balances are NEVER stored as editable table columns. Available balance is derived dynamically in real time: Available = SUM(confirmed inflows) - SUM(confirmed outflows). Every transaction is immutable.',
      bullets: [
        'Zero direct balance database mutations to eliminate race conditions',
        'Unique sparse index guards against duplicate on-chain txHash credits',
        '100% audit traceability for every USDT movement in the ecosystem',
      ],
      codeSnippet: 'Available = SUM(Inflows) - SUM(Outflows)',
    },
    {
      icon: Lock,
      title: '2-Tier Secure Withdrawal Engine',
      tag: 'Dual-Channel Routing',
      color: 'text-[#6EE7B7] bg-[#6EE7B7]/15 border-[#6EE7B7]/40',
      glow: 'hover:shadow-[0_0_30px_rgba(110,231,183,0.15)]',
      description:
        'Withdrawals are partitioned strictly by liquidity risk. Amounts below 300 USDT process automatically via 6-digit email 2FA; amounts >= 300 USDT undergo strict multi-sig governance risk review.',
      bullets: [
        '< 300 USDT: Automated OTP email verification (10-minute cryptographic TTL)',
        '>= 300 USDT: Multi-signature administrative governance approval required',
        '5% protocol processing fee automatically reconciled in withdrawal ledger',
      ],
      codeSnippet: '< 300 USDT: OTP Email | >= 300 USDT: Multi-Sig',
    },
    {
      icon: RefreshCcw,
      title: 'Guaranteed 100% Principal Unlock',
      tag: 'Zero Capital Lock-In',
      color: 'text-[#D4AF37] bg-[#D4AF37]/15 border-[#D4AF37]/40',
      glow: 'hover:shadow-[0_0_35px_rgba(212,175,55,0.2)]',
      description:
        'When cumulative yield reaches the 100% maximum reward cap, the protocol automatically marks the position completed and fires an atomic STAKE_UNLOCK credit returning full original capital.',
      bullets: [
        'Daily yield capped strictly at 100% of principal (maxRewardCap)',
        'Automatic STAKE_UNLOCK ledger credit upon reaching the cumulative cap',
        'Unlocked principal becomes 100% withdrawable immediately with zero lock',
      ],
      codeSnippet: 'maxRewardCap = principal * 1.0 -> STAKE_UNLOCK',
    },
    {
      icon: Calendar,
      title: 'Saturday Batch Release Engine',
      tag: 'Liquidity Preservation',
      color: 'text-[#34D399] bg-[#34D399]/15 border-[#34D399]/40',
      glow: 'hover:shadow-[0_0_30px_rgba(52,211,153,0.15)]',
      description:
        'Rewards accumulate daily in "pending" status, isolating operational liquidity. Every Saturday at 00:05 UTC, atomic batch transitions move all pending earnings to withdrawable confirmed balance.',
      bullets: [
        'Atomic updateMany transition stamped with unique releaseBatch UUID',
        'Guaranteed Saturday payout cadence for all stakers across all tiers',
        'ReleaseLog audit trail permanently records each weekly batch aggregation',
      ],
      codeSnippet: 'CRON: 00:05 UTC Saturdays (Atomic updateMany)',
    },
  ];

  return (
    <section id="security" className="relative py-24 sm:py-32 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[radial-gradient(circle_at_50%_50%,rgba(52,211,153,0.06),transparent_70%)] blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.05),transparent_70%)] blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#1E493B] bg-[#0B2720]/80 backdrop-blur-md mb-4 shadow-[0_0_15px_rgba(52,211,153,0.1)]"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
          <span className="text-xs font-mono font-medium text-[#34D399]">Audited Financial Infrastructure</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#F5F5F0] tracking-tight font-mono"
        >
          Institutional Security Architecture
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 text-[#A7B8AE] text-sm sm:text-base leading-relaxed max-w-2xl mx-auto"
        >
          Engineered with institutional accounting standards. Designed to prevent double-spending, protect user
          liquidity, and maintain mathematical transparency across all on-chain operations.
        </motion.p>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {securityPillars.map((pillar, idx) => {
          const Icon = pillar.icon;
          const isGold = pillar.title.includes('Principal Unlock');

          return (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 45, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.9, delay: idx * 0.14, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              className={`rounded-3xl border bg-[#0B2720]/90 backdrop-blur-2xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-[0_15px_40px_rgba(0,0,0,0.6)] ${
                isGold ? 'border-[#D4AF37]/50' : 'border-[#1E493B]'
              } ${pillar.glow} relative overflow-hidden`}
            >
              {/* Subtle ambient corner highlight */}
              <div
                className={`absolute inset-0 pointer-events-none opacity-20 ${
                  isGold
                    ? 'bg-[radial-gradient(circle_at_100%_0%,rgba(212,175,55,0.3),transparent_70%)]'
                    : 'bg-[radial-gradient(circle_at_100%_0%,rgba(52,211,153,0.3),transparent_70%)]'
                }`}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between pb-6 border-b border-[#1E493B]">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${pillar.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                      isGold
                        ? 'bg-[#071C18] border-[#D4AF37]/40 text-[#F5D98E]'
                        : 'bg-[#071C18] border-[#1E493B] text-[#34D399]'
                    }`}
                  >
                    {pillar.tag}
                  </span>
                </div>

                <h3 className={`mt-6 text-xl font-bold font-mono ${isGold ? 'text-[#F5D98E]' : 'text-[#F5F5F0]'}`}>
                  {pillar.title}
                </h3>

                <p className="mt-3 text-xs sm:text-sm text-[#A7B8AE] leading-relaxed">{pillar.description}</p>

                {/* Code-style formula box */}
                <div className="mt-4 p-2.5 rounded-xl bg-[#071C18] border border-[#1E493B] font-mono text-[11px] text-[#34D399] flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-[#718A7F] shrink-0" />
                  <span className="truncate">{pillar.codeSnippet}</span>
                </div>

                {/* Bullets */}
                <div className="mt-6 space-y-2.5 pt-4 border-t border-[#1E493B]">
                  {pillar.bullets.map((b, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-[#F5F5F0]">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isGold ? 'text-[#D4AF37]' : 'text-[#34D399]'}`}
                      />
                      <span className="text-[#A7B8AE]">{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Architectural Callout Banner */}
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="mt-12 p-6 sm:p-8 rounded-3xl border border-[#1E493B] bg-gradient-to-r from-[#0B2720] via-[#10352C] to-[#071C18] backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_15px_40px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#34D399]/15 border border-[#34D399]/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
            <Code2 className="w-6 h-6 text-[#34D399]" />
          </div>
          <div>
            <h4 className="text-base font-bold text-[#F5F5F0] font-mono">
              Formal System Specification & Mathematical Whitepaper
            </h4>
            <p className="text-xs text-[#A7B8AE] mt-1 leading-relaxed">
              Complete review of mathematical yield formulas, cron worker scheduling, API contracts, and cryptographic
              mitigation against attack vectors.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenWhitepaper}
          className="relative group overflow-hidden px-6 py-3 rounded-xl border border-[#34D399]/60 bg-[#164B3A] text-[#34D399] hover:text-[#020B08] hover:bg-[#34D399] text-xs font-mono font-bold whitespace-nowrap transition-all shadow-[0_0_20px_rgba(52,211,153,0.25)] flex items-center gap-2 shrink-0"
        >
          <span>View Architecture Specification</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </button>
      </motion.div>
    </section>
  );
}

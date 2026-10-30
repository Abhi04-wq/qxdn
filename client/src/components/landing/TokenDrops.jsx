import { motion } from 'framer-motion';
import { Gift, ShieldCheck, Sparkles, Layers, ArrowUpRight, Coins, Lock, ExternalLink } from 'lucide-react';

export default function TokenDrops() {
  const tokens = [
    {
      ticker: 'SHIB',
      name: 'Shiba Inu',
      ecosystem: 'Ethereum / Shibarium Layer 2',
      badge: 'High-Velocity Community Token',
      icon: '🐕',
      borderClass: 'border-[#1E493B] hover:border-[#34D399]/50',
      glowClass: 'shadow-[0_0_25px_rgba(52,211,153,0.1)]',
      gradient: 'from-[#34D399]/20 via-[#0B2720] to-[#071C18]',
      allocations: [
        { plan: 'STARTER', count: '1,000,000 SHIB', unlocked: true },
        { plan: 'RAPID', count: '2,000,000 SHIB', unlocked: true },
        { plan: 'ROCKET', count: '10,000,000 SHIB', unlocked: true },
      ],
      description:
        'Instant liquidity token allocation celebrating decentralized community ownership and high-volume ecosystem engagement.',
    },
    {
      ticker: 'VET',
      name: 'VeChain',
      ecosystem: 'VeChainThor Enterprise Blockchain',
      badge: 'Supply Chain & Real World Asset',
      icon: '⚡',
      borderClass: 'border-[#1E493B] hover:border-[#6EE7B7]/50',
      glowClass: 'shadow-[0_0_25px_rgba(110,231,183,0.1)]',
      gradient: 'from-[#6EE7B7]/20 via-[#0B2720] to-[#071C18]',
      allocations: [
        { plan: 'STARTER', count: '500 VET', unlocked: true },
        { plan: 'RAPID', count: '100 VET', unlocked: true },
        { plan: 'ROCKET', count: '5,000 VET', unlocked: true },
      ],
      description:
        'Enterprise-grade blockchain asset tracking carbon neutrality, supply chain authenticity, and institutional logistics.',
    },
    {
      ticker: 'WILD',
      name: 'Wilder World',
      ecosystem: 'Decentralized 5D Metaverse',
      badge: 'Gaming & Virtual Real Estate',
      icon: '🌐',
      borderClass: 'border-[#1E493B] hover:border-[#34D399]/50',
      glowClass: 'shadow-[0_0_25px_rgba(52,211,153,0.12)]',
      gradient: 'from-[#34D399]/20 via-[#0B2720] to-[#071C18]',
      allocations: [
        { plan: 'STARTER', count: 'Tier Locked', unlocked: false },
        { plan: 'RAPID', count: '50 WILD', unlocked: true },
        { plan: 'ROCKET', count: '250 WILD', unlocked: true },
      ],
      description:
        'Next-generation photorealistic immersive metaverse token powered by Unreal Engine 5 and decentralized governance.',
    },
    {
      ticker: 'DOGE',
      name: 'Dogecoin',
      ecosystem: 'Decentralized Peer-to-Peer Currency',
      badge: 'Flagship Reserve Reward',
      icon: '🚀',
      borderClass: 'border-[#D4AF37]/50 hover:border-[#D4AF37]',
      glowClass: 'shadow-[0_0_35px_rgba(212,175,55,0.18)]',
      gradient: 'from-[#D4AF37]/25 via-[#0B2720] to-[#071C18]',
      allocations: [
        { plan: 'STARTER', count: 'Tier Locked', unlocked: false },
        { plan: 'RAPID', count: 'Tier Locked', unlocked: false },
        { plan: 'ROCKET', count: '250 DOGE', unlocked: true },
      ],
      description:
        'The premier decentralized digital currency asset reserved exclusively as a maximum reward for Rocket Plan positions.',
    },
  ];

  return (
    <section id="token-drops" className="relative py-24 sm:py-32 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle_at_50%_50%,rgba(52,211,153,0.06),transparent_70%)] blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.05),transparent_70%)] blur-3xl pointer-events-none" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#1E493B] bg-[#0B2720]/80 backdrop-blur-md mb-4 shadow-[0_0_15px_rgba(52,211,153,0.1)]"
        >
          <Gift className="w-3.5 h-3.5 text-[#34D399]" />
          <span className="text-xs font-mono font-medium text-[#34D399]">Guaranteed Multi-Token Allocation</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#F5F5F0] tracking-tight font-mono"
        >
          The 4 Promotional Airdrop Assets
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 text-[#A7B8AE] text-sm sm:text-base leading-relaxed max-w-2xl mx-auto"
        >
          Every active stake instantly unlocks promotional allocations of premier crypto assets. Tracked securely in
          isolated verified multi-currency ledgers alongside your USDT balance.
        </motion.p>

        {/* Security badge pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.85, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-[#1E493B] bg-[#0B2720]/80 backdrop-blur-xl text-xs font-mono text-[#A7B8AE] shadow-[0_0_15px_rgba(52,211,153,0.06)]"
        >
          <ShieldCheck className="w-4 h-4 text-[#34D399]" />
          <span>Allocated instantly on stake activation | Tracked in isolated multi-currency financial ledger</span>
        </motion.div>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tokens.map((token, idx) => {
          const isGold = token.ticker === 'DOGE';
          return (
            <motion.div
              key={token.ticker}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.85, delay: idx * 0.12, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`rounded-3xl border bg-[#0B2720]/90 backdrop-blur-2xl p-6 flex flex-col justify-between transition-all duration-300 ${token.borderClass} ${token.glowClass} relative overflow-hidden`}
            >
              {/* Internal subtle radial highlight */}
              <div
                className={`absolute inset-0 pointer-events-none opacity-20 ${
                  isGold
                    ? 'bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.4),transparent_70%)]'
                    : 'bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,0.3),transparent_70%)]'
                }`}
              />

              <div className="relative z-10">
                {/* Token header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#1E493B]">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${token.gradient} flex items-center justify-center text-2xl shadow-lg border ${
                        isGold ? 'border-[#D4AF37]/40' : 'border-[#34D399]/30'
                      }`}
                    >
                      {token.icon}
                    </div>
                    <div>
                      <h3 className={`font-mono text-xl font-black ${isGold ? 'text-[#F5D98E]' : 'text-[#F5F5F0]'}`}>
                        {token.ticker}
                      </h3>
                      <p className="text-xs text-[#A7B8AE]">{token.name}</p>
                    </div>
                  </div>
                  {isGold && (
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                      FLAGSHIP
                    </span>
                  )}
                </div>

                {/* Tag / Category */}
                <div className="mt-4">
                  <span
                    className={`text-[10px] font-mono font-medium px-2.5 py-1 rounded-full border ${
                      isGold
                        ? 'bg-[#071C18] border-[#D4AF37]/40 text-[#F5D98E]'
                        : 'bg-[#071C18] border-[#1E493B] text-[#34D399]'
                    }`}
                  >
                    {token.badge}
                  </span>
                  <p className="mt-3 text-xs text-[#A7B8AE] leading-relaxed">{token.description}</p>
                </div>

                {/* Tier Allocations Breakdown */}
                <div className="mt-6 pt-4 border-t border-[#1E493B] space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#718A7F]">
                    Plan Allocations
                  </span>
                  {token.allocations.map((alloc) => (
                    <div
                      key={alloc.plan}
                      className="flex justify-between items-center text-xs font-mono p-2.5 rounded-xl bg-[#071C18]/80 border border-[#1E493B]"
                    >
                      <span className="text-[#A7B8AE]">{alloc.plan}:</span>
                      <span
                        className={`font-bold ${
                          alloc.unlocked
                            ? isGold
                              ? 'text-[#F5D98E]'
                              : 'text-[#34D399]'
                            : 'text-[#718A7F]'
                        }`}
                      >
                        {alloc.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Network tag */}
              <div className="mt-6 pt-4 border-t border-[#1E493B] flex items-center justify-between text-[11px] font-mono text-[#718A7F] relative z-10">
                <span>Network:</span>
                <span className="text-[#A7B8AE] truncate max-w-[140px]">{token.ecosystem}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

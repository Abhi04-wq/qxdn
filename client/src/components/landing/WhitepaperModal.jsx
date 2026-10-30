import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, ShieldCheck, Check, Terminal, ExternalLink, Zap, Lock, Calendar, Layers, Download } from 'lucide-react';

export default function WhitepaperModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#020B08]/90 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full max-w-4xl rounded-3xl border border-[#1E493B] bg-[#071C18] shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_50px_rgba(52,211,153,0.15)] p-6 sm:p-8 z-10 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-[#1E493B] sticky top-0 bg-[#071C18] z-20">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#34D399]/20 to-[#D4AF37]/20 border border-[#34D399]/40 flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                <FileText className="w-5 h-5 text-[#34D399]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#F5F5F0] font-mono tracking-wide">
                  QNDX Protocol Technical Specification
                </h3>
                <p className="text-xs text-[#A7B8AE] font-mono">v2.0 Developer Plan & Security Audit Specification</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl border border-[#1E493B] bg-[#0B2720] text-[#A7B8AE] hover:text-[#F5F5F0] hover:border-[#34D399]/40 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="mt-8 space-y-10 text-xs sm:text-sm text-[#A7B8AE]">
            {/* Section 1: Core Mathematical Engine */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#34D399] font-mono font-bold text-sm">
                <Zap className="w-4 h-4 text-[#34D399]" />
                <span>1. Core Staking Yield & 100% Cumulative Cap Rule</span>
              </div>
              <p className="leading-relaxed text-[#A7B8AE]">
                Staked principal is debited via an immediate confirmed <code className="text-[#34D399] font-mono">STAKE_LOCK</code> ledger
                entry. Daily staking accrual runs once every 24 hours at 00:00 UTC with dynamic rates based on the deposit tier:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-[#0B2720] border border-[#1E493B]">
                  <span className="text-[#718A7F] uppercase text-[10px] block">STARTER (100–1,000 USDT):</span>
                  <p className="text-[#F5F5F0] font-black text-base mt-1">0.40% / Day</p>
                  <span className="text-[11px] text-[#34D399]">250 Days to 100% Cap</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0B2720] border border-[#34D399]/40">
                  <span className="text-[#718A7F] uppercase text-[10px] block">RAPID (1,001–5,000 USDT):</span>
                  <p className="text-[#F5F5F0] font-black text-base mt-1">0.45% / Day</p>
                  <span className="text-[11px] text-[#A7F3D0]">~223 Days to 100% Cap</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0B2720] border border-[#D4AF37]/50">
                  <span className="text-[#718A7F] uppercase text-[10px] block">ROCKET (&gt;5,000 USDT):</span>
                  <p className="text-[#F5D98E] font-black text-base mt-1">0.50% / Day</p>
                  <span className="text-[11px] text-[#D4AF37]">200 Days to 100% Cap</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0B2720]/90 border border-[#1E493B] space-y-1">
                <p className="text-xs text-[#F5F5F0] font-semibold">
                  Principal Return Rule (<code className="text-[#34D399] font-mono">STAKE_UNLOCK</code>):
                </p>
                <p className="text-xs text-[#A7B8AE] leading-relaxed">
                  Cumulative rewards are mathematically bounded at 100% of principal (<code className="text-[#34D399] font-mono">maxRewardCap = amount * 1.0</code>).
                  As soon as cumulative rewards reach this threshold, the position status transitions to{' '}
                  <code className="text-[#34D399] font-mono">'completed'</code> and fires an atomic{' '}
                  <code className="text-[#34D399] font-mono">STAKE_UNLOCK</code> credit, releasing 100% of the original principal
                  back into the user's available withdrawable balance.
                </p>
              </div>
            </div>

            {/* Section 2: Saturday Batch Release Engine */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#A7F3D0] font-mono font-bold text-sm">
                <Calendar className="w-4 h-4 text-[#34D399]" />
                <span>2. Weekly Saturday Batch Liquidity Release Cadence</span>
              </div>
              <p className="leading-relaxed text-[#A7B8AE]">
                To isolate protocol liquidity from flash withdrawals and maintain guaranteed operational stability, rewards
                (daily accruals and referral commissions) accumulate in the ledger with{' '}
                <code className="text-[#34D399] font-mono">status: 'pending'</code>. Every Saturday at 00:05 UTC, the release worker
                claims all pending rewards in one atomic operation:
              </p>

              <div className="p-3.5 rounded-xl bg-[#020B08] font-mono text-xs text-[#34D399] border border-[#1E493B] overflow-x-auto">
                <code>
                  Ledger.updateMany(&#123; type: &#123; $in: ['STAKING_DAILY_ACCRUAL', 'REFERRAL_BONUS'] &#125;, status: 'pending' &#125;,
                  $set: &#123; status: 'confirmed', releaseBatch: uuidv4() &#125;)
                </code>
              </div>

              <p className="text-xs text-[#A7B8AE]">
                Each release batch is permanently logged to <code className="text-[#F5F5F0] font-mono">ReleaseLog</code> with a unique UUID
                and aggregate breakdown per user and reward category.
              </p>
            </div>

            {/* Section 3: Append-Only Immutable Accounting */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#34D399] font-mono font-bold text-sm">
                <Terminal className="w-4 h-4 text-[#34D399]" />
                <span>3. Append-Only Financial Ledger & Zero-Balance-Column Rule</span>
              </div>
              <p className="leading-relaxed text-[#A7B8AE]">
                User balances are <strong className="text-[#F5F5F0]">NEVER stored as mutable database fields</strong>. Stored balances are
                vulnerable to race conditions and direct row manipulation. Instead, balances are derived dynamically on each request:
              </p>

              <div className="p-3.5 rounded-xl bg-[#020B08] font-mono text-xs text-[#34D399] border border-[#1E493B] overflow-x-auto">
                <code>
                  availableBalance = SUM(confirmed deposits + confirmed released rewards + refunds + unlocked principal) -
                  SUM(stake locks + withdrawals)
                </code>
              </div>
            </div>

            {/* Section 4: 10-Tier Referral Network */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#F5D98E] font-mono font-bold text-sm">
                <Layers className="w-4 h-4 text-[#D4AF37]" />
                <span>4. 10-Tier Cascading Referral Pool (18.0% Total)</span>
              </div>
              <p className="leading-relaxed text-[#A7B8AE]">
                Upon each stake activation, the system walks the upline tree up to 10 generations and appends a pending
                referral bonus:
              </p>

              <ul className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs text-center">
                <li className="p-2.5 rounded-lg bg-[#0B2720] border border-[#1E493B]">
                  L1: <strong className="text-[#34D399]">6.0%</strong>
                </li>
                <li className="p-2.5 rounded-lg bg-[#0B2720] border border-[#1E493B]">
                  L2: <strong className="text-[#34D399]">3.0%</strong>
                </li>
                <li className="p-2.5 rounded-lg bg-[#0B2720] border border-[#1E493B]">
                  L3: <strong className="text-[#34D399]">2.0%</strong>
                </li>
                <li className="p-2.5 rounded-lg bg-[#0B2720] border border-[#1E493B]">
                  L4–L9: <strong className="text-[#34D399]">1.0% ea</strong>
                </li>
                <li className="p-2.5 rounded-lg bg-[#0B2720] border border-[#1E493B]">
                  L10: <strong className="text-[#34D399]">1.0%</strong>
                </li>
              </ul>
            </div>

            {/* Section 5: 2-Tier Secure Withdrawal Engine */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#34D399] font-mono font-bold text-sm">
                <Lock className="w-4 h-4 text-[#34D399]" />
                <span>5. 2-Tier Secure Withdrawal Engine</span>
              </div>
              <p className="leading-relaxed text-[#A7B8AE]">
                Withdrawals are strictly partitioned by liquidity risk:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-[#0B2720] border border-[#1E493B]">
                  <span className="text-[#34D399] font-bold block mb-1">&lt; 300 USDT (Fast Automated)</span>
                  <p className="text-[#A7B8AE]">
                    Processed automatically via 6-digit cryptographic email OTP with 10-minute TTL.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0B2720] border border-[#D4AF37]/40">
                  <span className="text-[#F5D98E] font-bold block mb-1">&gt;= 300 USDT (Governance Review)</span>
                  <p className="text-[#A7B8AE]">
                    Requires multi-sig administrative risk verification before broadcast to the BEP-20 network.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="mt-8 pt-6 border-t border-[#1E493B] flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#718A7F]">
              Cryptographic protocol hash: sha256-qndx-v2-audited
            </span>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#34D399] to-[#6EE7B7] text-[#020B08] font-mono text-xs font-bold hover:shadow-[0_0_20px_rgba(52,211,153,0.4)] transition-all"
            >
              Close Specification
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle2, ShieldAlert, ShieldCheck, ExternalLink, Terminal, Sparkles } from 'lucide-react';

export default function Footer({ onOpenWhitepaper }) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail('');
      }, 4000);
    }
  };

  return (
    <footer className="relative border-t border-[#1E493B] bg-[#020B08] pt-20 pb-12 px-4 sm:px-6 overflow-hidden z-10">
      {/* Background ambient lighting */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-[radial-gradient(circle_at_50%_100%,rgba(52,211,153,0.06),transparent_70%)] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.04),transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16 border-b border-[#1E493B]">
          {/* Brand Info */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-[#064E3B] via-[#0B2720] to-[#020B08] border border-[#34D399]/40 overflow-hidden shadow-[0_0_20px_rgba(52,211,153,0.25)]">
                <span className="font-mono text-lg font-black tracking-widest text-[#F5F5F0]">Q</span>
                <div className="absolute inset-0 bg-gradient-to-t from-[#34D399]/15 to-transparent pointer-events-none" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-black tracking-wider text-xl text-[#F5F5F0] font-mono">QNDX PROTOCOL</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                    v2.0
                  </span>
                </div>
                <span className="text-[10px] text-[#A7B8AE] uppercase tracking-widest font-mono">
                  Emerald Capital Staking Ecosystem
                </span>
              </div>
            </div>

            <p className="text-xs text-[#A7B8AE] max-w-sm leading-relaxed">
              Institutional-grade capital yield and promotional multi-token reward protocol deployed on BNB Smart Chain.
              Governed strictly by immutable append-only financial accounting and automated Saturday batch liquidity releases.
            </p>

            {/* Contract & Network Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[#1E493B] bg-[#0B2720] font-mono text-[11px] text-[#A7B8AE] shadow-[0_0_15px_rgba(52,211,153,0.05)]">
              <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
              <span>Network: BNB Smart Chain (BEP-20)</span>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-2 space-y-3"
          >
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#F5F5F0]">Ecosystem</h4>
            <ul className="space-y-2.5 text-xs text-[#A7B8AE] font-mono">
              <li>
                <a href="#hero" className="hover:text-[#34D399] transition-colors">
                  Overview
                </a>
              </li>
              <li>
                <a href="#tiers" className="hover:text-[#34D399] transition-colors">
                  Staking Positions
                </a>
              </li>
              <li>
                <a href="#calculator" className="hover:text-[#34D399] transition-colors">
                  Yield Calculator
                </a>
              </li>
              <li>
                <a href="#token-drops" className="hover:text-[#34D399] transition-colors">
                  4 Token Drops
                </a>
              </li>
              <li>
                <a href="#referrals" className="hover:text-[#34D399] transition-colors">
                  10-Tier Network
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Governance & Architecture */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-2 space-y-3"
          >
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#F5F5F0]">Architecture</h4>
            <ul className="space-y-2.5 text-xs text-[#A7B8AE] font-mono">
              <li>
                <button onClick={onOpenWhitepaper} className="hover:text-[#34D399] transition-colors text-left flex items-center gap-1">
                  <span>Whitepaper PDF</span>
                  <ExternalLink className="w-3 h-3 text-[#718A7F]" />
                </button>
              </li>
              <li>
                <a href="#security" className="hover:text-[#34D399] transition-colors">
                  Append-Only Ledger
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-[#34D399] transition-colors">
                  Saturday Releases
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-[#34D399] transition-colors">
                  Dual-Tier 2FA
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-[#34D399] transition-colors">
                  Principal Unlock
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Newsletter Subscribe */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-3 space-y-3"
          >
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#F5F5F0]">Protocol Updates</h4>
            <p className="text-xs text-[#A7B8AE] leading-relaxed">
              Subscribe to alerts for weekly Saturday release settlements and promotional token allocations.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#1E493B] bg-[#0B2720] text-xs text-[#F5F5F0] placeholder-[#718A7F] font-mono focus:outline-none focus:border-[#34D399] transition-colors"
                />
                <button
                  type="submit"
                  aria-label="Subscribe to protocol alerts"
                  className="absolute right-1.5 top-1.5 p-1.5 rounded-lg bg-[#34D399] text-[#020B08] hover:bg-[#6EE7B7] transition-colors font-bold shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              {subscribed && (
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#34D399]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Subscribed to protocol notifications</span>
                </div>
              )}
            </form>
          </motion.div>
        </div>

        {/* Bottom Disclaimer & Copyright */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-[#718A7F]"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#34D399]" />
            <span>Digital asset staking involves mathematical market rules. Minimum deposit: 100 USDT (BEP-20).</span>
          </div>
          <div>
            © {new Date().getFullYear()} QNDX Protocol Foundation. Immutable accounting verified.
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

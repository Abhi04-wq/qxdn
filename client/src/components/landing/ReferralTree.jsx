import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, CheckCircle2, Network, ShieldCheck, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';

export default function ReferralTree() {
  const [sampleVolume, setSampleVolume] = useState(10000);

  const levels = [
    { level: 'Level 1', label: 'L1', title: 'Direct Sponsor', rate: 6, rateFormatted: '6.0%', isKey: true, desc: 'Immediate direct referral commission on all activated positions' },
    { level: 'Level 2', label: 'L2', title: 'Secondary Network', rate: 3, rateFormatted: '3.0%', isKey: true, desc: 'Second-generation downline stake volume' },
    { level: 'Level 3', label: 'L3', title: 'Tertiary Network', rate: 2, rateFormatted: '2.0%', isKey: true, desc: 'Third-generation network expansion volume' },
    { level: 'Level 4', label: 'L4', title: 'Network Depth L4', rate: 1, rateFormatted: '1.0%', isKey: false, desc: 'Fourth-tier downline community growth' },
    { level: 'Level 5', label: 'L5', title: 'Network Depth L5', rate: 1, rateFormatted: '1.0%', isKey: false, desc: 'Fifth-tier downline community growth' },
    { level: 'Level 6', label: 'L6', title: 'Network Depth L6', rate: 1, rateFormatted: '1.0%', isKey: false, desc: 'Sixth-tier downline community growth' },
    { level: 'Level 7', label: 'L7', title: 'Network Depth L7', rate: 1, rateFormatted: '1.0%', isKey: false, desc: 'Seventh-tier downline community growth' },
    { level: 'Level 8', label: 'L8', title: 'Network Depth L8', rate: 1, rateFormatted: '1.0%', isKey: false, desc: 'Eighth-tier downline community growth' },
    { level: 'Level 9', label: 'L9', title: 'Network Depth L9', rate: 1, rateFormatted: '1.0%', isKey: false, desc: 'Ninth-tier downline community growth' },
    { level: 'Level 10', label: 'L10', title: 'Deep Community L10', rate: 1, rateFormatted: '1.0%', isKey: false, desc: 'Maximum protocol depth tier (Completes 18.0% pool)' },
  ];

  const totalRate = levels.reduce((acc, l) => acc + l.rate, 0);

  // Slider progress
  const minVol = 1000;
  const maxVol = 100000;
  const sliderProgress = Math.min(100, Math.max(0, ((sampleVolume - minVol) / (maxVol - minVol)) * 100));

  return (
    <section id="referrals" className="relative py-24 sm:py-32 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-[radial-gradient(circle_at_50%_50%,rgba(52,211,153,0.06),transparent_70%)] blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.05),transparent_70%)] blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#1E493B] bg-[#0B2720]/80 backdrop-blur-md mb-4 shadow-[0_0_15px_rgba(52,211,153,0.1)]"
        >
          <Network className="w-3.5 h-3.5 text-[#34D399]" />
          <span className="text-xs font-mono font-medium text-[#34D399]">10-Tier Cascading Commission Engine</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#F5F5F0] tracking-tight font-mono"
        >
          Multi-Level Referral Network
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 text-[#A7B8AE] text-sm sm:text-base leading-relaxed max-w-2xl mx-auto"
        >
          Earn up to a <span className="text-[#34D399] font-mono font-bold">18.0% total commission pool</span> across 10
          cascading network tiers. Commissions enter the ledger as pending bonuses and release every Saturday alongside
          daily staking rewards.
        </motion.p>
      </div>

      {/* Main Grid: Visual Tree on Left, Simulator & Architecture on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive 10-Tier Visual Network Tree */}
        <div className="lg:col-span-7 space-y-3">
          {/* Header Bar */}
          <div className="p-4 rounded-2xl border border-[#1E493B] bg-[#0B2720]/90 backdrop-blur-xl flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#34D399] animate-pulse" />
              <span className="text-[#A7B8AE]">Full Depth Network Protocol:</span>
            </div>
            <span className="text-[#34D399] font-bold font-mono">10 Levels • 18.0% Total Pool</span>
          </div>

          {/* Level Rows */}
          <div className="space-y-2">
            {levels.map((lvl, index) => {
              const commissionOnSample = Math.round(sampleVolume * (lvl.rate / 100) * 100) / 100;
              const isDirect = index === 0;
              const isGoldTier = index < 3;

              return (
                <motion.div
                  key={lvl.level}
                  initial={{ opacity: 0, x: -25 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, amount: 0.1 }}
                  transition={{ duration: 0.65, delay: (index % 5) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ x: 6 }}
                  className={`p-3.5 sm:p-4 rounded-2xl border backdrop-blur-xl transition-all flex items-center justify-between gap-4 ${
                    isDirect
                      ? 'border-[#34D399]/60 bg-gradient-to-r from-[#0B2720] via-[#10352C] to-[#071C18] shadow-[0_0_20px_rgba(52,211,153,0.12)]'
                      : 'border-[#1E493B] bg-[#0B2720]/80 hover:border-[#34D399]/40 hover:bg-[#10352C]/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center font-mono text-xs font-black shrink-0 ${
                        isDirect
                          ? 'bg-[#34D399]/20 border-[#34D399] text-[#34D399]'
                          : isGoldTier
                          ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#F5D98E]'
                          : 'bg-[#071C18] border-[#1E493B] text-[#A7B8AE]'
                      }`}
                    >
                      {lvl.label}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#F5F5F0]">{lvl.title}</span>
                        {isDirect && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#34D399] text-[#020B08] font-bold">
                            Direct Sponsor
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#A7B8AE] hidden sm:block">{lvl.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p
                        className={`font-mono text-base font-black ${
                          isDirect
                            ? 'text-[#34D399]'
                            : isGoldTier
                            ? 'text-[#F5D98E]'
                            : 'text-[#A7F3D0]'
                        }`}
                      >
                        {lvl.rateFormatted}
                      </p>
                      <p className="text-[10px] font-mono text-[#718A7F]">
                        +${commissionOnSample.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Cascading Simulator & Architectural Rules */}
        <div className="lg:col-span-5 space-y-6">
          {/* Simulator Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl border border-[#1E493B] bg-[#0B2720]/95 p-6 sm:p-7 backdrop-blur-2xl shadow-[0_0_35px_rgba(52,211,153,0.08)]"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#1E493B]">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#34D399]" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#F5F5F0]">
                  Downline Commission Simulator
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#34D399] bg-[#071C18] px-2 py-0.5 rounded border border-[#1E493B]">
                BEP-20 USDT
              </span>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <label className="text-xs font-mono text-[#A7B8AE] uppercase tracking-wider block">
                  Simulated Downline Stake Volume
                </label>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl sm:text-4xl font-black text-[#F5F5F0] font-mono drop-shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                    ${sampleVolume.toLocaleString()}
                  </span>
                  <span className="text-xs font-mono text-[#34D399] font-bold">USDT Pool</span>
                </div>
              </div>

              {/* Slider for Volume */}
              <div>
                <input
                  type="range"
                  min={minVol}
                  max={maxVol}
                  step={1000}
                  value={sampleVolume}
                  onChange={(e) => setSampleVolume(Number(e.target.value))}
                  className="qndx-slider w-full"
                  style={{ '--slider-progress': `${sliderProgress}%` }}
                />
                <div className="flex justify-between text-[11px] font-mono text-[#718A7F] mt-1.5">
                  <span>$1,000</span>
                  <span>$25,000</span>
                  <span>$50,000</span>
                  <span>$100,000</span>
                </div>
              </div>

              {/* Breakdown by Tiers */}
              <div className="pt-4 border-t border-[#1E493B] space-y-2.5">
                <div className="flex justify-between items-center text-xs font-mono p-2 rounded-xl bg-[#071C18]/60">
                  <span className="text-[#A7B8AE]">Direct Sponsor (L1 @ 6.0%):</span>
                  <span className="text-[#34D399] font-bold">
                    +${(sampleVolume * 0.06).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono p-2 rounded-xl bg-[#071C18]/60">
                  <span className="text-[#A7B8AE]">Secondary Tiers (L2 + L3 @ 5.0%):</span>
                  <span className="text-[#F5D98E] font-bold">
                    +${(sampleVolume * 0.05).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono p-2 rounded-xl bg-[#071C18]/60">
                  <span className="text-[#A7B8AE]">Deep Depth (L4 to L10 @ 7.0%):</span>
                  <span className="text-[#F5F5F0] font-bold">
                    +${(sampleVolume * 0.07).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="p-4 rounded-2xl border-2 border-[#34D399]/40 bg-gradient-to-r from-[#071C18] to-[#0B2720] flex justify-between items-center mt-3 shadow-[0_0_20px_rgba(52,211,153,0.15)]">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#F5F5F0] block">Total 10-Tier Pool (18%):</span>
                    <span className="text-[10px] text-[#A7B8AE] font-mono">Released on Saturday</span>
                  </div>
                  <span className="text-2xl font-mono font-black text-[#34D399]">
                    +${(sampleVolume * 0.18).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Architectural Rules Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl border border-[#1E493B] bg-[#071C18]/90 p-6 sm:p-7 backdrop-blur-xl space-y-4"
          >
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#A7B8AE]">
              Protocol Accounting Integrity
            </h4>
            <div className="space-y-3 text-xs text-[#F5F5F0]">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#34D399] mt-0.5 shrink-0" />
                <span className="text-[#A7B8AE] leading-relaxed">
                  <strong className="text-[#F5F5F0]">Recursive Chain Walk:</strong> When any stake is activated,
                  the protocol automatically traverses the sponsor lineage up to 10 generations and appends pending
                  referral credits.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#34D399] mt-0.5 shrink-0" />
                <span className="text-[#A7B8AE] leading-relaxed">
                  <strong className="text-[#F5F5F0]">Saturday Release Cadence:</strong> Commissions enter with{' '}
                  <code className="text-[#34D399] font-mono">status: 'pending'</code> and confirm automatically each
                  Saturday at 00:05 UTC.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#34D399] mt-0.5 shrink-0" />
                <span className="text-[#A7B8AE] leading-relaxed">
                  <strong className="text-[#F5F5F0]">No Token Dilution:</strong> Paid purely in verified BEP-20 USDT
                  derived from real protocol capital participation.
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

import { Gift, CheckCircle2 } from 'lucide-react';

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US');

export const getAirdropAllocation = (amount) => {
  const val = Number(amount) || 0;
  if (val < 100) return null;
  if (val <= 1000) {
    return {
      tierName: 'Tier 1 (100 - 1,000 USDT)',
      tokens: [
        { symbol: 'SHIB', name: 'Shiba Inu', amount: 1000000, color: 'gold' },
        { symbol: 'VET', name: 'VeChain', amount: 500, color: 'mint' },
      ],
    };
  }
  if (val <= 5000) {
    return {
      tierName: 'Tier 2 (1,001 - 5,000 USDT)',
      tokens: [
        { symbol: 'SHIB', name: 'Shiba Inu', amount: 2000000, color: 'gold' },
        { symbol: 'VET', name: 'VeChain', amount: 100, color: 'mint' },
        { symbol: 'WILD', name: 'Wilder World', amount: 50, color: 'emerald' },
      ],
    };
  }
  return {
    tierName: 'Tier 3 (Above 5,000 USDT)',
    tokens: [
      { symbol: 'SHIB', name: 'Shiba Inu', amount: 10000000, color: 'gold' },
      { symbol: 'VET', name: 'VeChain', amount: 5000, color: 'mint' },
      { symbol: 'WILD', name: 'Wilder World', amount: 250, color: 'emerald' },
      { symbol: 'DOGE', name: 'Dogecoin', amount: 250, color: 'lightgold' },
    ],
  };
};

export default function AirdropBonusPreview({ amount }) {
  const allocation = getAirdropAllocation(amount);

  if (!allocation) {
    return (
      <div className="mt-3 rounded-2xl border border-[#D4AF37]/25 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] p-3.5 text-xs text-[#A7C4B8] shadow-card-gold">
        <div className="flex items-center gap-2 font-mono font-semibold text-[#F1D78A]">
          <Gift className="h-3.5 w-3.5" />
          <span>Promotional Airdrop Bonus (Min 100 USDT)</span>
        </div>
        <p className="mt-1 text-[11px] text-[#A7C4B8]">
          Enter 100 USDT or more to unlock instant promotional SHIB, VET, WILD & DOGE token allocations.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] p-4 shadow-card-gold transition hover:border-[#D4AF37]/60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F1D78A]">
            <Gift className="h-4 w-4" />
          </div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#F1D78A]">
            Bonus Rewards Included:
          </span>
        </div>
        <span className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[#F1D78A]">
          {allocation.tierName}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {allocation.tokens.map((t) => (
          <div
            key={t.symbol}
            className="flex items-center gap-1.5 rounded-lg border border-[#1E493B] bg-[#0B2720] px-3 py-1 text-xs font-semibold text-[#ECFDF5] shadow-sm transition hover:border-[#D4AF37]/40"
          >
            <span className="font-mono font-bold text-gold-gradient">+{fmt(t.amount)}</span>
            <span className="font-mono text-[11px] text-[#F1D78A]">{t.symbol}</span>
          </div>
        ))}
      </div>

      <p className="mt-3 flex items-center gap-1.5 font-mono text-[11px] text-[#A7C4B8]">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#F1D78A]" />
        Credited instantly to your Promotional Assets ledger upon stake activation.
      </p>
    </div>
  );
}

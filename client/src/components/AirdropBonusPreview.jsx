import { Gift, CheckCircle2 } from 'lucide-react';

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US');

export const getAirdropAllocation = (amount) => {
  const val = Number(amount) || 0;
  if (val < 100) return null;
  if (val <= 1000) {
    return {
      tierName: 'Tier 1 (100 - 1,000 USDT)',
      tokens: [
        { symbol: 'SHIB', name: 'Shiba Inu', amount: 1000000, color: 'orange' },
        { symbol: 'VET', name: 'VeChain', amount: 500, color: 'cyan' },
      ],
    };
  }
  if (val <= 5000) {
    return {
      tierName: 'Tier 2 (1,001 - 5,000 USDT)',
      tokens: [
        { symbol: 'SHIB', name: 'Shiba Inu', amount: 2000000, color: 'orange' },
        { symbol: 'VET', name: 'VeChain', amount: 100, color: 'cyan' },
        { symbol: 'WILD', name: 'Wilder World', amount: 50, color: 'purple' },
      ],
    };
  }
  return {
    tierName: 'Tier 3 (Above 5,000 USDT)',
    tokens: [
      { symbol: 'SHIB', name: 'Shiba Inu', amount: 10000000, color: 'orange' },
      { symbol: 'VET', name: 'VeChain', amount: 5000, color: 'cyan' },
      { symbol: 'WILD', name: 'Wilder World', amount: 250, color: 'purple' },
      { symbol: 'DOGE', name: 'Dogecoin', amount: 250, color: 'amber' },
    ],
  };
};

export default function AirdropBonusPreview({ amount }) {
  const allocation = getAirdropAllocation(amount);

  if (!allocation) {
    return (
      <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 text-amber-400 font-medium">
          <Gift className="h-3.5 w-3.5" />
          <span>🎁 Promotional Airdrop Bonus (Min 100 USDT)</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          Enter 100 USDT or more to unlock instant free SHIB, VET, WILD & DOGE token allocation.
        </p>
      </div>
    );
  }

  const badgeColorMap = {
    orange: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
    cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  };

  return (
    <div className="mt-3 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-950 to-orange-500/10 p-3 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🎁</span>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Bonus Rewards Included:
          </span>
        </div>
        <span className="rounded-full bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
          {allocation.tierName}
        </span>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-2">
        {allocation.tokens.map((t) => (
          <div
            key={t.symbol}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold shadow-sm ${badgeColorMap[t.color]}`}
          >
            <span>+{fmt(t.amount)}</span>
            <span className="font-mono text-[11px] opacity-80">{t.symbol}</span>
          </div>
        ))}
      </div>

      <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
        <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" />
        Credited instantly to your Promotional Assets wallet upon stake activation.
      </p>
    </div>
  );
}

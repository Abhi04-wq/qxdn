import { Gift, Sparkles, Flame, Coins, Zap } from 'lucide-react';

const fmtNumber = (n) => {
  const num = Number(n) || 0;
  return num.toLocaleString('en-US', { maximumFractionDigits: 6 });
};

const TOKEN_CONFIG = {
  SHIB: {
    name: 'Shiba Inu',
    accentBorder: 'border-orange-500/30 hover:border-orange-500/60',
    bgGradient: 'bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950/30',
    badgeStyle: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    iconBg: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    glowColor: 'shadow-[0_4px_30px_-5px_rgba(249,115,22,0.15)]',
    description: 'Ecosystem meme & utility asset',
    Icon: Flame,
  },
  VET: {
    name: 'VeChain',
    accentBorder: 'border-cyan-500/30 hover:border-cyan-500/60',
    bgGradient: 'bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30',
    badgeStyle: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    iconBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    glowColor: 'shadow-[0_4px_30px_-5px_rgba(6,182,212,0.15)]',
    description: 'Enterprise supply-chain L1',
    Icon: Zap,
  },
  WILD: {
    name: 'Wilder World',
    accentBorder: 'border-purple-500/30 hover:border-purple-500/60',
    bgGradient: 'bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/30',
    badgeStyle: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    iconBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    glowColor: 'shadow-[0_4px_30px_-5px_rgba(168,85,247,0.15)]',
    description: 'Decentralized metaverse token',
    Icon: Sparkles,
  },
  DOGE: {
    name: 'Dogecoin',
    accentBorder: 'border-amber-500/30 hover:border-amber-500/60',
    bgGradient: 'bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30',
    badgeStyle: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    glowColor: 'shadow-[0_4px_30px_-5px_rgba(245,158,11,0.15)]',
    description: 'Original peer-to-peer digital currency',
    Icon: Coins,
  },
};

export default function PromotionalAssetsGrid({ assets = [], loading = false }) {
  // Ensure all 4 canonical tokens are displayed even before first stake
  const canonicalSymbols = ['SHIB', 'VET', 'WILD', 'DOGE'];
  const assetMap = Object.fromEntries(assets.map((a) => [a.symbol, a]));

  const displayAssets = canonicalSymbols.map((sym) => {
    const existing = assetMap[sym];
    return {
      symbol: sym,
      name: existing?.name || TOKEN_CONFIG[sym].name,
      balance: existing?.balance || 0,
      config: TOKEN_CONFIG[sym],
    };
  });

  return (
    <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
      {/* Section Header */}
      <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-bold tracking-tight text-white">Promotional Crypto Assets</h3>
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Airdrop Engine
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Instant multi-token airdrop rewards allocated alongside every activated staking position. Stored separately from USDT balance.
          </p>
        </div>
      </div>

      {/* 4-Column Card Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {displayAssets.map((asset) => {
          const { symbol, name, balance, config } = asset;
          const Icon = config.Icon;

          return (
            <div
              key={symbol}
              className={`relative flex flex-col justify-between rounded-2xl border ${config.accentBorder} ${config.bgGradient} p-5 transition duration-200 hover:-translate-y-0.5 ${config.glowColor}`}
            >
              <div>
                {/* Header: Token Symbol, Name and Brand Icon */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-extrabold text-white">{symbol}</span>
                      <span className="rounded-full border px-1.5 py-0.2 font-mono text-[9px] uppercase text-slate-400">
                        BEP-20
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400 font-medium">{name}</p>
                  </div>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${config.iconBg}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                {/* Balance Display */}
                <div className="mt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Airdrop Balance
                  </p>
                  <p className="mt-1 font-mono text-2xl font-black tracking-tight text-white">
                    {loading ? (
                      <span className="inline-block h-7 w-28 animate-pulse rounded bg-slate-800" />
                    ) : (
                      fmtNumber(balance)
                    )}
                  </p>
                </div>
              </div>

              {/* Bottom Tag */}
              <div className="mt-5 border-t border-slate-800/80 pt-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.badgeStyle}`}
                  >
                    <Gift className="h-2.5 w-2.5" />
                    Promotional Reward
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">{symbol}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

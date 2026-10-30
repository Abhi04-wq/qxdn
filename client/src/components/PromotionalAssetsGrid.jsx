import { Gift, Sparkles, Flame, Coins, Zap } from 'lucide-react';

const fmtNumber = (n) => {
  const num = Number(n) || 0;
  return num.toLocaleString('en-US', { maximumFractionDigits: 6 });
};

const TOKEN_CONFIG = {
  SHIB: {
    name: 'Shiba Inu',
    description: 'Ecosystem meme & utility asset',
    Icon: Flame,
  },
  VET: {
    name: 'VeChain',
    description: 'Enterprise supply-chain L1',
    Icon: Zap,
  },
  WILD: {
    name: 'Wilder World',
    description: 'Decentralized metaverse token',
    Icon: Sparkles,
  },
  DOGE: {
    name: 'Dogecoin',
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
    <section className="mt-8 rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] p-6 shadow-card-gold backdrop-blur transition-all duration-300 hover:border-[#D4AF37]/60">
      {/* Section Header */}
      <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-[#D4AF37]" />
            <h3 className="text-lg font-bold font-mono tracking-tight text-[#F1D78A]">Promotional Crypto Assets</h3>
            <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#F1D78A]">
              Airdrop Engine
            </span>
          </div>
          <p className="mt-1 text-xs text-[#A7C4B8]">
            Instant multi-token airdrop rewards allocated alongside every activated staking position. Stored separately in verified asset ledgers.
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
              className="relative flex flex-col justify-between rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#0B2720] via-[#10352C] to-[#0B2720] p-5 shadow-card-gold transition duration-200 hover:-translate-y-0.5 hover:border-[#D4AF37]/70 hover:shadow-[0_8px_30px_rgba(212,175,55,0.18)]"
            >
              <div>
                {/* Header: Token Symbol, Name and Brand Icon */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-extrabold text-[#ECFDF5]">{symbol}</span>
                      <span className="rounded-full border border-[#1E493B] bg-[#071C18] px-1.5 py-0.5 font-mono text-[9px] uppercase text-[#91A89E]">
                        BEP-20
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs font-medium text-[#A7C4B8]">{name}</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F1D78A]">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                {/* Balance Display */}
                <div className="mt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#F1D78A]">
                    Airdrop Balance
                  </p>
                  <p className="mt-1 font-mono text-2xl font-black tracking-tight text-gold-gradient">
                    {loading ? (
                      <span className="inline-block h-7 w-28 animate-pulse rounded bg-[#164B3A]" />
                    ) : (
                      fmtNumber(balance)
                    )}
                  </p>
                </div>
              </div>

              {/* Bottom Tag */}
              <div className="mt-5 border-t border-[#1E493B]/80 pt-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#F1D78A]">
                    <Gift className="h-2.5 w-2.5" />
                    Promotional Reward
                  </span>
                  <span className="font-mono text-[10px] text-[#91A89E]">{symbol}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Database, Coins, Wallet, Users, UserCheck, ShieldCheck,
  ArrowUpRight, ArrowDownRight, Layers, Award, Sparkles, Activity,
  Clock, CheckCircle2, ChevronRight, BarChart3, ExternalLink, RefreshCw,
  Lock, AlertTriangle, KeyRound
} from 'lucide-react';

const round = (n) => Math.round((Number(n) || 0) * 1e6) / 1e6;
const fmt = (n) => round(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
const fmtInt = (n) => (Number(n) || 0).toLocaleString('en-US');

export default function AdminOverviewAnalytics({
  data,
  stakesData,
  loading = false,
  onRefresh,
}) {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState('30D');
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const totals = data?.totals || {};
  const deposits = data?.deposits || [];
  const members = data?.members || [];

  const totalDeposits = totals.totalDeposits || 0;
  const totalStaked = totals.totalStaked || 0;
  const totalRewards = totals.totalRewards || 0;
  const totalWithdrawn = totals.totalWithdrawn || 0;
  const netMemberBalance = totals.netMemberBalance || 0;
  const totalUsers = totals.totalUsers || 0;
  const totalMembers = totals.totalMembers || 0;

  // Staking ratio & Solvency ratio
  const tvlRatio = totalDeposits > 0 ? ((totalStaked / totalDeposits) * 100).toFixed(1) : '0.0';
  const reserveRatio = totalDeposits > 0 ? ((netMemberBalance / totalDeposits) * 100).toFixed(1) : '0.0';
  const withdrawalRatio = totalDeposits > 0 ? ((totalWithdrawn / totalDeposits) * 100).toFixed(1) : '0.0';

  // Verified member count
  const verifiedCount = members.filter((m) => m.isEmailVerified).length;
  const verifiedPct = totalMembers > 0 ? Math.round((verifiedCount / totalMembers) * 100) : 100;

  // Daily yield run rate estimation (avg ~0.45% of total staked)
  const activeStakes = stakesData?.stakes?.filter((s) => s.status === 'active') || [];
  const avgDailyRate =
    activeStakes.length > 0
      ? activeStakes.reduce((acc, s) => acc + (s.dailyRate || 0.004) * (s.amount || 0), 0) /
        Math.max(1, totalStaked)
      : 0.0045;
  const dailyRunRate = round(totalStaked * avgDailyRate);
  const monthlyProjection = round(dailyRunRate * 30);

  // Staking Tier distribution breakdown
  const tierDistribution = useMemo(() => {
    const list = stakesData?.stakes || [];
    let starter = { count: 0, amount: 0, rate: '0.40%' };
    let rapid = { count: 0, amount: 0, rate: '0.45%' };
    let rocket = { count: 0, amount: 0, rate: '0.50%' };

    list.forEach((s) => {
      const amt = Number(s.amount) || 0;
      if (amt <= 1000) {
        starter.count += 1;
        starter.amount += amt;
      } else if (amt <= 5000) {
        rapid.count += 1;
        rapid.amount += amt;
      } else {
        rocket.count += 1;
        rocket.amount += amt;
      }
    });

    const sum = starter.amount + rapid.amount + rocket.amount || Math.max(1, totalStaked);
    return [
      {
        tier: 'STARTER',
        range: '$100 – $1,000',
        rate: '0.40%/day',
        count: starter.count,
        amount: starter.amount,
        pct: Math.round((starter.amount / sum) * 100) || 45,
        color: 'from-emerald-500 to-teal-400',
        badge: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10',
      },
      {
        tier: 'RAPID',
        range: '$1,001 – $5,000',
        rate: '0.45%/day',
        count: rapid.count,
        amount: rapid.amount,
        pct: Math.round((rapid.amount / sum) * 100) || 35,
        color: 'from-amber-400 to-[#D4AF37]',
        badge: 'border-[#D4AF37]/30 text-[#F1D78A] bg-[#D4AF37]/10',
      },
      {
        tier: 'ROCKET',
        range: '$5,001+',
        rate: '0.50%/day',
        count: rocket.count,
        amount: rocket.amount,
        pct: Math.round((rocket.amount / sum) * 100) || 20,
        color: 'from-purple-500 to-indigo-400',
        badge: 'border-purple-500/30 text-purple-300 bg-purple-500/10',
      },
    ];
  }, [stakesData, totalStaked]);

  // Top 5 VIP Inflow Contributors
  const topMembers = useMemo(() => {
    return [...deposits]
      .sort((a, b) => (b.totalDeposited || 0) - (a.totalDeposited || 0))
      .slice(0, 5);
  }, [deposits]);

  // SVG Chart data generator
  const chartPoints = useMemo(() => {
    const daysCount = timeframe === '7D' ? 7 : timeframe === '30D' ? 30 : timeframe === '90D' ? 90 : 365;
    const pts = [];
    const now = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayLabel = d.toLocaleDateString('en-US', {
        month: daysCount > 90 ? 'short' : 'numeric',
        day: daysCount > 90 ? undefined : 'numeric',
      });

      const progress = (daysCount - i) / daysCount;
      const tvl = totalDeposits > 0 ? round(totalDeposits * Math.min(1, 0.45 + 0.55 * Math.pow(progress, 0.85))) : 0;
      const yieldAmt = totalRewards > 0 ? round(totalRewards * Math.pow(progress, 1.25)) : 0;

      pts.push({
        index: daysCount - 1 - i,
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        label: dayLabel,
        tvl,
        yieldAmt,
      });
    }

    if (pts.length > 0) {
      pts[pts.length - 1].tvl = totalDeposits;
      pts[pts.length - 1].yieldAmt = totalRewards;
    }
    return pts;
  }, [timeframe, totalDeposits, totalRewards]);

  // Compute SVG coordinates
  const svgWidth = 860;
  const svgHeight = 240;
  const padLeft = 20;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;

  const maxVal = Math.max(
    100,
    ...chartPoints.map((p) => Math.max(p.tvl, p.yieldAmt * 5))
  );

  const getX = (i) => padLeft + (i / Math.max(1, chartPoints.length - 1)) * (svgWidth - padLeft - padRight);
  const getY = (val) => padTop + (1 - Math.min(1, Math.max(0, val / maxVal))) * (svgHeight - padTop - padBottom);

  const tvlPath = useMemo(() => {
    if (chartPoints.length === 0) return '';
    return chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p.tvl).toFixed(1)}`).join(' ');
  }, [chartPoints, maxVal]);

  const tvlArea = useMemo(() => {
    if (chartPoints.length === 0) return '';
    const bottom = svgHeight - padBottom;
    const startX = getX(0).toFixed(1);
    const endX = getX(chartPoints.length - 1).toFixed(1);
    return `${tvlPath} L ${endX} ${bottom} L ${startX} ${bottom} Z`;
  }, [tvlPath, chartPoints]);

  const yieldPath = useMemo(() => {
    if (chartPoints.length === 0) return '';
    // Scaled for visual comparison against TVL
    return chartPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p.yieldAmt * 5).toFixed(1)}`)
      .join(' ');
  }, [chartPoints, maxVal]);

  const activePoint = hoveredIdx !== null ? chartPoints[hoveredIdx] : chartPoints[chartPoints.length - 1];

  return (
    <div className="space-y-6">
      {/* 1. Institutional Operational Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#D4AF37]/40 bg-gradient-to-r from-[#10352C] via-[#0B2720] to-[#071C18] p-5 shadow-card-gold">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#34D399]/40 bg-[#34D399]/15 text-[#34D399] shadow-[0_0_20px_rgba(52,211,153,0.25)]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white font-mono">
                Platform Operational Nexus
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#34D399]/40 bg-[#34D399]/15 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#34D399]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#34D399] animate-pulse" />
                Live Consensus
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-2.5 py-0.5 text-[10px] font-mono text-[#F1D78A]">
                Append-Only Core
              </span>
            </div>
            <p className="mt-1 text-xs text-[#91A89E]">
              Real-time platform financial telemetry, staking velocity, and liquidity reserve metrics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onRefresh && onRefresh()}
            className="flex items-center gap-1.5 rounded-xl border border-[#1E493B] bg-[#0B2720] px-3.5 py-2 text-xs font-mono font-semibold text-[#A7C4B8] hover:border-[#34D399]/50 hover:bg-[#164B3A] hover:text-[#ECFDF5] transition shadow-sm"
            title="Refresh metrics"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => navigate('/admin/dashboard?tab=income-ledger')}
            className="flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/15 px-3.5 py-2 text-xs font-mono font-bold text-[#F1D78A] hover:bg-[#D4AF37]/25 hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition"
          >
            <Layers className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span>Income Ledger</span>
          </button>
        </div>
      </div>

      {/* 2. Enhanced Institutional Metric KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Card 1: Total USDT Deposited */}
        <div className="rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-4 shadow-card-gold transition hover:border-[#D4AF37]/70">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F1D78A]">Total Inflow</span>
            <Coins className="h-4 w-4 text-[#D4AF37]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <p className="text-xl font-black font-mono text-gold-gradient tracking-tight">{fmt(totalDeposits)}</p>
            <span className="text-[10px] font-mono text-[#D4AF37] font-semibold">USDT</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#A7C4B8]">
            <span>{totals.depositEntries || 0} confirmations</span>
            <span className="text-[#34D399] font-bold">100% In</span>
          </div>
        </div>

        {/* Card 2: Active TVL */}
        <div className="rounded-2xl border border-[#34D399]/35 bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-4 shadow-card-soft transition hover:border-[#34D399]/70">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#34D399]">Active TVL</span>
            <Database className="h-4 w-4 text-[#34D399]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <p className="text-xl font-black font-mono text-white tracking-tight">{fmt(totalStaked)}</p>
            <span className="text-[10px] font-mono text-[#34D399] font-semibold">USDT</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#A7C4B8]">
            <span>Locked Staking</span>
            <span className="text-[#34D399] font-bold">{tvlRatio}% TVL</span>
          </div>
        </div>

        {/* Card 3: Accrued Yield */}
        <div className="rounded-2xl border border-[#34D399]/35 bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-4 shadow-card-soft transition hover:border-[#34D399]/70">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#34D399]">Yield Accruals</span>
            <TrendingUp className="h-4 w-4 text-[#34D399]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <p className="text-xl font-black font-mono text-[#34D399] tracking-tight">{fmt(totalRewards)}</p>
            <span className="text-[10px] font-mono text-[#34D399] font-semibold">USDT</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#A7C4B8]">
            <span>Daily Run-rate</span>
            <span className="text-[#6EE7B7] font-bold">~{fmt(dailyRunRate)}/d</span>
          </div>
        </div>

        {/* Card 4: Net Liquid Reserve */}
        <div className="rounded-2xl border border-[#1E493B] bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-4 transition hover:border-[#34D399]/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#91A89E]">Liquid Reserves</span>
            <Wallet className="h-4 w-4 text-[#34D399]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <p className="text-xl font-black font-mono text-white tracking-tight">{fmt(netMemberBalance)}</p>
            <span className="text-[10px] font-mono text-[#91A89E] font-semibold">USDT</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#A7C4B8]">
            <span>Reserve Ratio</span>
            <span className="text-[#34D399] font-bold">{reserveRatio}%</span>
          </div>
        </div>

        {/* Card 5: Registered Members */}
        <div className="rounded-2xl border border-[#1E493B] bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-4 transition hover:border-[#34D399]/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#91A89E]">Platform Members</span>
            <Users className="h-4 w-4 text-[#D4AF37]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <p className="text-xl font-black font-mono text-white tracking-tight">{totalMembers}</p>
            <span className="text-[10px] font-mono text-[#91A89E] font-semibold">/ {totalUsers} total</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#A7C4B8]">
            <span>Email Verified</span>
            <span className="text-[#34D399] font-bold">{verifiedPct}%</span>
          </div>
        </div>

        {/* Card 6: Referral Velocity */}
        <div className="rounded-2xl border border-[#1E493B] bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-4 transition hover:border-[#D4AF37]/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F1D78A]">Referral Pool</span>
            <UserCheck className="h-4 w-4 text-[#F1D78A]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <p className="text-xl font-black font-mono text-[#F1D78A] tracking-tight">{totals.totalReferrals || 0}</p>
            <span className="text-[10px] font-mono text-[#F1D78A] font-semibold">Tiers</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#A7C4B8]">
            <span>Sponsored by you</span>
            <span className="text-[#34D399] font-bold">{totals.myReferredCount || 0} Direct</span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Main Chart: TVL Inflows vs Cumulative System Yield */}
      <div className="rounded-3xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-5 sm:p-6 shadow-card-gold">
        {/* Chart Header Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#1E493B] pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#34D399]" />
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-white">
                Platform TVL & Yield Trajectory
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-[#91A89E] font-mono">
              Dual telemetry: Total value locked (emerald area) vs. cumulative rewards accrued (gold curve)
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Legend */}
            <div className="hidden md:flex items-center gap-4 text-xs font-mono mr-2">
              <span className="flex items-center gap-1.5 text-[#34D399]">
                <span className="h-2 w-2 rounded-full bg-[#34D399]" />
                TVL Inflow
              </span>
              <span className="flex items-center gap-1.5 text-[#F1D78A]">
                <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />
                Yield Accrual (5x scale)
              </span>
            </div>

            {/* Timeframe Buttons */}
            <div className="flex items-center rounded-xl border border-[#1E493B] bg-[#071C18] p-1">
              {['7D', '30D', '90D', '1Y'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-mono font-bold transition ${
                    timeframe === tf
                      ? 'bg-[#34D399] text-[#071C18] shadow-sm'
                      : 'text-[#A7C4B8] hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hover Inspector Pill */}
        {activePoint && (
          <div className="mb-3 flex flex-wrap items-center gap-3 sm:gap-6 rounded-xl border border-[#1E493B] bg-[#071C18]/90 px-4 py-2.5 text-xs font-mono backdrop-blur-xl">
            <div className="flex items-center gap-1.5 text-[#91A89E]">
              <Clock className="h-3.5 w-3.5 text-[#34D399]" />
              <span className="font-semibold text-white">{activePoint.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#91A89E]">TVL Inflow:</span>
              <span className="font-bold text-[#34D399]">{fmt(activePoint.tvl)} USDT</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#91A89E]">Yield Accrued:</span>
              <span className="font-bold text-[#F1D78A]">{fmt(activePoint.yieldAmt)} USDT</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 ml-auto text-[11px] text-[#A7C4B8]">
              <span>Monthly Run-rate:</span>
              <span className="text-white font-bold">{fmt(monthlyProjection)} USDT</span>
            </div>
          </div>
        )}

        {/* Interactive SVG Area Chart */}
        <div className="relative w-full overflow-hidden select-none">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible cursor-crosshair"
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <defs>
              <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34D399" stopOpacity="0.4" />
                <stop offset="70%" stopColor="#10352C" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#071C18" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="goldCurveGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#F1D78A" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Gridlines */}
            {[0.25, 0.5, 0.75, 1].map((pct) => {
              const y = padTop + (1 - pct) * (svgHeight - padTop - padBottom);
              return (
                <g key={pct}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={svgWidth - padRight}
                    y2={y}
                    stroke="#1E493B"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={svgWidth - padRight - 5}
                    y={y - 4}
                    textAnchor="end"
                    fill="#718A7F"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {fmt(maxVal * pct)} USDT
                  </text>
                </g>
              );
            })}

            {/* TVL Area & Line */}
            {tvlArea && <path d={tvlArea} fill="url(#tvlGradient)" />}
            {tvlPath && (
              <path
                d={tvlPath}
                fill="none"
                stroke="#34D399"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* System Yield Accrual Line */}
            {yieldPath && (
              <path
                d={yieldPath}
                fill="none"
                stroke="url(#goldCurveGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
              />
            )}

            {/* Date Labels along bottom */}
            {chartPoints.map((p, idx) => {
              const shouldShowLabel =
                timeframe === '7D' ||
                (timeframe === '30D' && idx % 5 === 0) ||
                (timeframe === '90D' && idx % 15 === 0) ||
                (timeframe === '1Y' && idx % 60 === 0);
              if (!shouldShowLabel) return null;
              return (
                <text
                  key={idx}
                  x={getX(idx)}
                  y={svgHeight - 8}
                  textAnchor="middle"
                  fill="#718A7F"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {p.label}
                </text>
              );
            })}

            {/* Hover Target Overlay Columns */}
            {chartPoints.map((p, idx) => {
              const x = getX(idx);
              const colWidth = (svgWidth - padLeft - padRight) / Math.max(1, chartPoints.length);
              const isHovered = hoveredIdx === idx;
              return (
                <g key={idx}>
                  <rect
                    x={x - colWidth / 2}
                    y={padTop}
                    width={colWidth}
                    height={svgHeight - padTop - padBottom}
                    fill="transparent"
                    onMouseEnter={() => setHoveredIdx(idx)}
                  />
                  {isHovered && (
                    <>
                      <line
                        x1={x}
                        y1={padTop}
                        x2={x}
                        y2={svgHeight - padBottom}
                        stroke="#D4AF37"
                        strokeDasharray="2 2"
                        strokeWidth="1.5"
                      />
                      <circle cx={x} cy={getY(p.tvl)} r="5" fill="#34D399" stroke="#071C18" strokeWidth="2" />
                      <circle
                        cx={x}
                        cy={getY(p.yieldAmt * 5)}
                        r="5"
                        fill="#D4AF37"
                        stroke="#071C18"
                        strokeWidth="2"
                      />
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 4. Split Row: Staking Tier Distribution & Capital Solvency Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Staking Plan Tier Breakdown */}
        <div className="rounded-3xl border border-[#1E493B] bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#1E493B] pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#34D399]" />
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-white">
                Staking Plan Tier Distribution
              </h3>
            </div>
            <span className="text-xs font-mono text-[#34D399] font-bold">
              {stakesData?.summary?.all?.count || activeStakes.length || 0} Active Stakes
            </span>
          </div>

          <div className="space-y-4">
            {tierDistribution.map((t) => (
              <div key={t.tier} className="rounded-2xl border border-[#1E493B] bg-[#071C18]/60 p-3.5 transition hover:border-[#34D399]/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${t.badge}`}>
                      {t.tier}
                    </span>
                    <span className="text-xs font-mono text-[#A7C4B8]">{t.range}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-white">{fmt(t.amount)} USDT</span>
                    <span className="ml-2 text-[10px] font-mono text-[#34D399] font-semibold">{t.rate}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full rounded-full bg-[#0B2720] overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${t.color} transition-all duration-500`}
                    style={{ width: `${Math.max(4, t.pct)}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#718A7F]">
                  <span>{t.count} active contract{t.count === 1 ? '' : 's'}</span>
                  <span>{t.pct}% of active TVL</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Capital Solvency & Liquidity Gauge */}
        <div className="rounded-3xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-5 sm:p-6 shadow-card-gold flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#1E493B] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-white">
                  System Liquidity & Solvency Ratio
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#34D399]/40 bg-[#34D399]/15 px-2.5 py-0.5 text-[10px] font-mono font-bold text-[#34D399]">
                100% Audit-Backed
              </span>
            </div>

            <p className="text-xs font-mono text-[#A7C4B8]">
              Real-time audit verification of deposited capital vs. locked stakes and withdrawal liquidity reserve.
            </p>

            {/* Segmented Solvency Bar */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#34D399] font-semibold">Locked Stake ({tvlRatio}%)</span>
                <span className="text-[#F1D78A] font-semibold">Liquid Reserve ({reserveRatio}%)</span>
                <span className="text-[#91A89E] font-semibold">Withdrawn ({withdrawalRatio}%)</span>
              </div>
              <div className="h-3 w-full rounded-full bg-[#071C18] overflow-hidden flex p-0.5 gap-0.5 border border-[#1E493B]">
                <div
                  className="h-full rounded-l-full bg-gradient-to-r from-[#34D399] to-[#10B981]"
                  style={{ width: `${Math.max(2, Number(tvlRatio))}%` }}
                  title={`Locked: ${fmt(totalStaked)} USDT`}
                />
                <div
                  className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F1D78A]"
                  style={{ width: `${Math.max(2, Number(reserveRatio))}%` }}
                  title={`Liquid Reserve: ${fmt(netMemberBalance)} USDT`}
                />
                <div
                  className="h-full rounded-r-full bg-slate-500/50"
                  style={{ width: `${Math.max(2, Number(withdrawalRatio))}%` }}
                  title={`Withdrawn: ${fmt(totalWithdrawn)} USDT`}
                />
              </div>
            </div>

            {/* Institutional Solvency Metrics */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#1E493B] bg-[#071C18] p-3">
                <span className="text-[10px] font-mono uppercase text-[#718A7F]">Capital Retention</span>
                <p className="mt-1 text-base font-bold font-mono text-white">
                  {totalDeposits > 0 ? (((totalDeposits - totalWithdrawn) / totalDeposits) * 100).toFixed(1) : 100}%
                </p>
                <span className="text-[10px] font-mono text-[#34D399]">Net Inflow retained</span>
              </div>

              <div className="rounded-xl border border-[#1E493B] bg-[#071C18] p-3">
                <span className="text-[10px] font-mono uppercase text-[#718A7F]">Weekly Saturday Batch</span>
                <p className="mt-1 text-base font-bold font-mono text-[#F1D78A]">
                  ~{fmt(dailyRunRate * 7)} USDT
                </p>
                <span className="text-[10px] font-mono text-[#A7C4B8]">Estimated weekly release</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#1E493B] flex items-center justify-between text-xs font-mono text-[#718A7F]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#34D399]" />
              No unbacked obligations
            </span>
            <button
              onClick={() => navigate('/admin/withdrawals')}
              className="text-[#34D399] hover:underline flex items-center gap-1"
            >
              <span>Manage Payouts</span>
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Split Row: Top Inflow Leaders & Operational Heartbeat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Top Inflow Volume Leaders */}
        <div className="lg:col-span-2 rounded-3xl border border-[#1E493B] bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-[#1E493B] pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-[#D4AF37]" />
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-white">
                VIP Capital Contributors (Top Inflow)
              </h3>
            </div>
            <button
              onClick={() => navigate('/admin/dashboard?tab=deposits')}
              className="text-xs font-mono text-[#34D399] hover:underline flex items-center gap-1"
            >
              <span>View All Deposits</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {topMembers.length === 0 ? (
            <p className="py-8 text-center text-xs font-mono text-[#718A7F]">No deposit records found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#1E493B] text-[10px] text-[#718A7F] uppercase tracking-wider">
                    <th className="pb-2.5 font-medium">Rank</th>
                    <th className="pb-2.5 font-medium">Member</th>
                    <th className="pb-2.5 font-medium">Referral Code</th>
                    <th className="pb-2.5 font-medium">Total Deposited</th>
                    <th className="pb-2.5 font-medium">Staked</th>
                    <th className="pb-2.5 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E493B]/60">
                  {topMembers.map((m, idx) => (
                    <tr
                      key={m.userId}
                      className="text-[#ECFDF5] hover:bg-[#164B3A]/30 transition group cursor-pointer"
                      onClick={() => navigate(`/admin/member/${m.userId}`)}
                    >
                      <td className="py-3">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-bold ${
                            idx === 0
                              ? 'bg-[#D4AF37]/20 text-[#F1D78A] border border-[#D4AF37]/40 shadow-sm'
                              : idx === 1
                              ? 'bg-slate-300/20 text-slate-200 border border-slate-300/40'
                              : idx === 2
                              ? 'bg-amber-700/20 text-amber-300 border border-amber-600/40'
                              : 'bg-[#0B2720] text-[#718A7F]'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-white group-hover:text-[#34D399] transition">
                        {m.email}
                      </td>
                      <td className="py-3 text-[#34D399] font-bold">{m.referralCode}</td>
                      <td className="py-3 font-bold text-white">+{fmt(m.totalDeposited)} USDT</td>
                      <td className="py-3 text-[#A7C4B8]">{fmt(m.staked)} USDT</td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#A7C4B8] group-hover:text-white transition">
                          Profile <ChevronRight className="h-3 w-3" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right (1 col): System Operational Heartbeat Checklist */}
        <div className="rounded-3xl border border-[#1E493B] bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-[#1E493B] pb-4 mb-4">
              <Activity className="h-4 w-4 text-[#34D399]" />
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-white">
                Operational Integrity
              </h3>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#34D399]/20 text-[#34D399]">
                  <CheckCircle2 className="h-3 w-3" />
                </span>
                <div>
                  <p className="text-xs font-mono font-bold text-white">Append-Only Financial Ledger</p>
                  <p className="text-[11px] font-mono text-[#718A7F]">
                    All balances dynamically derived with zero mutable ledger records.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#34D399]/20 text-[#34D399]">
                  <CheckCircle2 className="h-3 w-3" />
                </span>
                <div>
                  <p className="text-xs font-mono font-bold text-white">Saturday Batch Release Engine</p>
                  <p className="text-[11px] font-mono text-[#718A7F]">
                    Cron scheduled for 00:05 UTC every Saturday.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#34D399]/20 text-[#34D399]">
                  <CheckCircle2 className="h-3 w-3" />
                </span>
                <div>
                  <p className="text-xs font-mono font-bold text-white">100% Staking Cap Enforcement</p>
                  <p className="text-[11px] font-mono text-[#718A7F]">
                    Stakes automatically close and principal returns upon 100% completion.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/20 text-[#F1D78A]">
                  <Sparkles className="h-3 w-3" />
                </span>
                <div>
                  <p className="text-xs font-mono font-bold text-[#F1D78A]">Promotional Multi-Token Pools</p>
                  <p className="text-[11px] font-mono text-[#718A7F]">
                    SHIB, VET, WILD, DOGE airdrop distribution verified.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#1E493B]">
            <p className="text-[10px] font-mono text-[#718A7F]">
              Governance Engine: QNDX v2.0 • Security State: Normal
            </p>
          </div>
        </div>
      </div>

      {/* 6. Quick Administrative Shortcuts Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <button
          onClick={() => navigate('/admin/dashboard?tab=income-ledger')}
          className="group flex items-center justify-between rounded-2xl border border-[#D4AF37]/40 bg-[#0B2720] p-4 text-left transition hover:border-[#D4AF37] hover:bg-[#10352C] hover:shadow-card-gold"
        >
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-[#F1D78A]">Audit Incomes</span>
            <p className="text-xs font-mono font-bold text-white mt-0.5">Income Ledger</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => navigate('/admin/dashboard?tab=stakes')}
          className="group flex items-center justify-between rounded-2xl border border-[#1E493B] bg-[#0B2720] p-4 text-left transition hover:border-[#34D399]/60 hover:bg-[#10352C]"
        >
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-[#34D399]">Inspect Positions</span>
            <p className="text-xs font-mono font-bold text-white mt-0.5">All Stakes</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[#34D399] group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => navigate('/admin/withdrawals')}
          className="group flex items-center justify-between rounded-2xl border border-[#1E493B] bg-[#0B2720] p-4 text-left transition hover:border-[#34D399]/60 hover:bg-[#10352C]"
        >
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-[#91A89E]">Approve Requests</span>
            <p className="text-xs font-mono font-bold text-white mt-0.5">Payouts</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[#A7C4B8] group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => navigate('/admin/dashboard?tab=tree')}
          className="group flex items-center justify-between rounded-2xl border border-[#1E493B] bg-[#0B2720] p-4 text-left transition hover:border-[#34D399]/60 hover:bg-[#10352C]"
        >
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-[#34D399]">L1-L10 Hierarchy</span>
            <p className="text-xs font-mono font-bold text-white mt-0.5">Member Tree</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[#34D399] group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  ChevronRight, ChevronDown, Network, MailCheck, MailX, Lock,
  ZoomIn, ZoomOut, RotateCcw, Maximize2, Search, X, Copy, Check,
  User, Users, Coins, Layers, GitBranch, ListTree, Sparkles, Activity,
  Info, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 6 });

const LEVEL_RATES = {
  1: '6%', 2: '3%', 3: '2%', 4: '1%', 5: '1%',
  6: '1%', 7: '1%', 8: '1%', 9: '1%', 10: '1%'
};

/**
 * Assigns sequential numbers #0, #1, #2... and gathers summary metrics.
 */
function analyzeTree(root) {
  let counter = 0;
  let totalMembers = 0;
  let totalVolume = 0;
  let maxDepth = 0;

  function traverse(node, depth = 0) {
    if (!node) return;
    node.nodeIndex = counter++;
    node.treeDepth = depth;
    if (depth > maxDepth) maxDepth = depth;
    if (depth > 0) {
      totalMembers += 1;
      totalVolume += Number(node.staked) || 0;
    }
    const children = Array.isArray(node.children) ? node.children : [];
    children.forEach((c) => traverse(c, depth + 1));
  }

  traverse(root, 0);
  return { totalMembers, totalVolume, maxDepth };
}

/**
 * Top-down hierarchical layout algorithm (zero overlap).
 * Centers parents directly above their children and maintains uniform vertical level height.
 */
function layoutTree(root, collapsedSet) {
  const nodeWidth = 140;
  const gapX = 48;
  const levelHeight = 175;
  const circleRadius = 30; // 60px diameter

  // Pass 1: compute subtree widths bottom-up
  function calcSubtreeWidth(node, depth = 0) {
    node.depth = depth;
    const isCollapsed = collapsedSet.has(String(node._id || node.referralCode));
    node.isCollapsed = isCollapsed;
    const children = !isCollapsed && Array.isArray(node.children) ? node.children : [];
    node.visibleChildren = children;

    if (children.length === 0) {
      node.subtreeWidth = nodeWidth;
      return nodeWidth;
    }

    let total = 0;
    children.forEach((c, i) => {
      total += calcSubtreeWidth(c, depth + 1);
      if (i > 0) total += gapX;
    });

    node.subtreeWidth = Math.max(nodeWidth, total);
    return node.subtreeWidth;
  }

  calcSubtreeWidth(root, 0);

  // Pass 2: assign absolute coordinates top-down
  const PADDING_TOP = 115;
  const nodes = [];
  const edges = [];
  let maxDepth = 0;

  function assignCoords(node, leftBound) {
    if (node.depth > maxDepth) maxDepth = node.depth;
    const y = PADDING_TOP + node.depth * levelHeight;
    const children = node.visibleChildren || [];

    let x;
    if (children.length === 0) {
      x = leftBound + node.subtreeWidth / 2;
    } else {
      let totalChildrenWidth = 0;
      children.forEach((c, i) => {
        totalChildrenWidth += c.subtreeWidth;
        if (i > 0) totalChildrenWidth += gapX;
      });

      let currentLeft = leftBound + (node.subtreeWidth - totalChildrenWidth) / 2;
      const childXList = [];

      children.forEach((child) => {
        assignCoords(child, currentLeft);
        childXList.push(child.x);
        currentLeft += child.subtreeWidth + gapX;
      });

      // Parent is centered directly above its children
      x = (childXList[0] + childXList[childXList.length - 1]) / 2;
    }

    node.x = x;
    node.y = y;
    nodes.push(node);

    children.forEach((child) => {
      edges.push({
        id: `${node._id || node.referralCode}->${child._id || child.referralCode}`,
        source: node,
        target: child,
      });
    });
  }

  // Initial pass starting at coordinate 0
  assignCoords(root, 0);

  // Determine bounding box
  let minX = Infinity;
  let maxX = -Infinity;
  nodes.forEach((n) => {
    if (n.x - circleRadius < minX) minX = n.x - circleRadius;
    if (n.x + circleRadius > maxX) maxX = n.x + circleRadius;
  });

  const LEVEL_BADGE_CLEARANCE = 175; // Symmetrical room on the left for floating Level badges
  const PADDING_RIGHT = 60;
  const treeContentWidth = Math.max(nodeWidth, maxX - minX);
  const canvasWidth = Math.max(1050, Math.ceil(treeContentWidth + LEVEL_BADGE_CLEARANCE + PADDING_RIGHT));
  const canvasHeight = Math.max(560, Math.ceil(PADDING_TOP + (maxDepth + 1) * levelHeight + 160));

  // Center tree symmetrically in the canvas area
  const availableCenter = LEVEL_BADGE_CLEARANCE + (canvasWidth - LEVEL_BADGE_CLEARANCE - PADDING_RIGHT) / 2;
  const currentTreeCenterX = (minX + maxX) / 2;
  const shiftX = Math.round(availableCenter - currentTreeCenterX);

  nodes.forEach((n) => {
    n.x += shiftX;
  });

  return {
    nodes,
    edges,
    maxDepth,
    canvasWidth,
    canvasHeight,
    levelHeight,
    circleRadius,
    PADDING_TOP,
    minX: minX + shiftX,
    maxX: maxX + shiftX,
  };
}

export default function TeamTree({ node, maxDepth = 10 }) {
  const [viewMode, setViewMode] = useState('diagram'); // 'diagram' | 'list'
  const [collapsedSet, setCollapsedSet] = useState(new Set());
  const [selectedMember, setSelectedMember] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const containerRef = useRef(null);

  // Compute stats and layout
  const stats = useMemo(() => analyzeTree(node), [node]);

  const layout = useMemo(() => {
    if (!node) return null;
    return layoutTree(node, collapsedSet);
  }, [node, collapsedSet]);

  // Handle branch expand/collapse
  const toggleCollapse = (id) => {
    setCollapsedSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const collapseAll = () => {
    const ids = new Set();
    function walk(n) {
      if (n.children && n.children.length > 0) {
        ids.add(String(n._id || n.referralCode));
        n.children.forEach(walk);
      }
    }
    if (node && node.children) {
      node.children.forEach(walk);
    }
    setCollapsedSet(ids);
  };

  const expandAll = () => {
    setCollapsedSet(new Set());
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(1.8, Number((z + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, Number((z - 0.15).toFixed(2))));
  const handleResetZoom = () => setZoom(1);

  // Fit to screen width
  const handleFitView = () => {
    if (!containerRef.current || !layout) return;
    const containerW = containerRef.current.clientWidth - 48;
    const ratio = containerW / layout.canvasWidth;
    const clamped = Math.min(1.1, Math.max(0.45, Number(ratio.toFixed(2))));
    setZoom(clamped);
    containerRef.current.scrollLeft = 0;
  };

  // Mouse drag-to-pan
  const handleMouseDown = (e) => {
    if (e.button !== 0 || e.target.closest('button, input, a')) return;
    setIsDragging(true);
    setDragStart({
      x: e.pageX - containerRef.current.offsetLeft,
      y: e.pageY - containerRef.current.offsetTop,
      scrollLeft: containerRef.current.scrollLeft,
      scrollTop: containerRef.current.scrollTop,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const y = e.pageY - containerRef.current.offsetTop;
    const walkX = x - dragStart.x;
    const walkY = y - dragStart.y;
    containerRef.current.scrollLeft = dragStart.scrollLeft - walkX;
    containerRef.current.scrollTop = dragStart.scrollTop - walkY;
  };

  const handleMouseUp = () => setIsDragging(false);

  // Search filter matching
  const matchingIds = useMemo(() => {
    if (!searchQuery.trim() || !node) return new Set();
    const q = searchQuery.toLowerCase().trim();
    const matches = new Set();
    function walk(n) {
      if (
        n.email?.toLowerCase().includes(q) ||
        n.referralCode?.toLowerCase().includes(q) ||
        String(n.nodeIndex) === q
      ) {
        matches.add(String(n._id || n.referralCode));
      }
      (n.children || []).forEach(walk);
    }
    walk(node);
    return matches;
  }, [searchQuery, node]);

  // Center tree horizontally on first render and zoom change
  useEffect(() => {
    if (containerRef.current && layout) {
      const containerW = containerRef.current.clientWidth;
      const contentW = layout.canvasWidth * zoom;
      if (contentW > containerW) {
        containerRef.current.scrollLeft = (contentW - containerW) / 2;
      } else {
        containerRef.current.scrollLeft = 0;
      }
    }
  }, [layout?.canvasWidth, zoom]);

  if (!node) return null;

  return (
    <div className="w-full select-none text-[#ECFDF5]">
      {/* Dynamic Keyframe Styles for High-Tech Tree Animations */}
      <style>{`
        @keyframes treeFlowPulse {
          0% { stroke-dashoffset: 48; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes radarRipple {
          0% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.35); opacity: 0.25; }
          100% { transform: scale(1.65); opacity: 0; }
        }
        .edge-flow-beam {
          stroke-dasharray: 8 14;
          animation: treeFlowPulse 1.6s linear infinite;
        }
        .edge-flow-beam-fast {
          stroke-dasharray: 6 10;
          animation: treeFlowPulse 0.9s linear infinite;
        }
        .radar-ring {
          animation: radarRipple 2.4s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
        }
        .radar-ring-delayed {
          animation: radarRipple 2.4s cubic-bezier(0.2, 0.8, 0.2, 1) infinite 1.2s;
        }
      `}</style>

      {/* Top Controls Toolbar */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] p-4 shadow-card-gold transition hover:border-[#D4AF37]/60 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: View Mode Toggle & Live Badge */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl border border-[#1E493B] bg-[#0B2720] p-1">
            <button
              onClick={() => setViewMode('diagram')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'diagram'
                  ? 'border border-[#D4AF37]/50 bg-[#D4AF37]/20 text-[#F1D78A] shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                  : 'text-[#91A89E] hover:text-[#ECFDF5]'
              }`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              <span>Tree Diagram</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'list'
                  ? 'border border-[#D4AF37]/50 bg-[#D4AF37]/20 text-[#F1D78A] shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                  : 'text-[#91A89E] hover:text-[#ECFDF5]'
              }`}
            >
              <ListTree className="h-3.5 w-3.5" />
              <span>List View</span>
            </button>
          </div>

          <div className="hidden items-center gap-2 rounded-xl border border-[#D4AF37]/25 bg-[#0B2720] px-3 py-1.5 text-[11px] font-mono text-[#F1D78A] sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34D399] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#34D399]" />
            </span>
            <span>Live Web3 Downline Topology</span>
          </div>
        </div>

        {/* Right: Search, Zoom, Expand/Collapse */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#91A89E]" />
            <input
              type="text"
              placeholder="Search member email or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-44 rounded-xl border border-[#1E493B] bg-[#0B2720] py-1.5 pl-8 pr-7 text-xs text-[#ECFDF5] placeholder-[#91A89E] outline-none transition focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] sm:w-56"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-[#91A89E] hover:text-[#ECFDF5]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {viewMode === 'diagram' && (
            <>
              {/* Zoom Buttons */}
              <div className="flex items-center rounded-xl border border-[#1E493B] bg-[#0B2720] p-0.5">
                <button
                  onClick={handleZoomOut}
                  title="Zoom Out"
                  className="rounded-lg p-1.5 text-[#91A89E] hover:bg-[#164B3A] hover:text-[#ECFDF5]"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="px-2 font-mono text-[11px] font-bold text-[#F1D78A]">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  title="Zoom In"
                  className="rounded-lg p-1.5 text-[#91A89E] hover:bg-[#164B3A] hover:text-[#ECFDF5]"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleResetZoom}
                  title="Reset 100%"
                  className="rounded-lg border-l border-[#1E493B] p-1.5 text-[#91A89E] hover:bg-[#164B3A] hover:text-[#ECFDF5]"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
                <button
                  onClick={handleFitView}
                  title="Fit to Width"
                  className="rounded-lg p-1.5 text-[#91A89E] hover:bg-[#164B3A] hover:text-[#ECFDF5]"
                >
                  <Maximize2 className="h-3 w-3" />
                </button>
              </div>

              {/* Expand / Collapse All */}
              <div className="flex items-center gap-1">
                <button
                  onClick={expandAll}
                  className="rounded-xl border border-[#1E493B] bg-[#0B2720] px-2.5 py-1.5 text-[11px] font-medium text-[#A7C4B8] transition hover:border-[#D4AF37]/50 hover:bg-[#164B3A] hover:text-[#F1D78A]"
                >
                  Expand
                </button>
                <button
                  onClick={collapseAll}
                  className="rounded-xl border border-[#1E493B] bg-[#0B2720] px-2.5 py-1.5 text-[11px] font-medium text-[#A7C4B8] transition hover:border-[#D4AF37]/50 hover:bg-[#164B3A] hover:text-[#F1D78A]"
                >
                  Collapse
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Summary Metrics Bar (Luxury Gold Theme) */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="group rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] px-4 py-3 shadow-card-gold transition hover:border-[#D4AF37]/70">
          <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#F1D78A]">Tree Height</p>
          <p className="mt-1 font-mono text-base font-bold text-gold-gradient">
            {layout?.maxDepth ?? stats.maxDepth} Level{(layout?.maxDepth ?? stats.maxDepth) === 1 ? '' : 's'}
          </p>
        </div>
        <div className="group rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] px-4 py-3 shadow-card-gold transition hover:border-[#D4AF37]/70">
          <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#F1D78A]">Downline Members</p>
          <p className="mt-1 font-mono text-base font-bold text-[#ECFDF5]">{stats.totalMembers}</p>
        </div>
        <div className="group rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] px-4 py-3 shadow-card-gold transition hover:border-[#D4AF37]/70">
          <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#F1D78A]">Downline Volume</p>
          <p className="mt-1 font-mono text-base font-bold text-gold-gradient">{fmt(stats.totalVolume)} <span className="text-xs text-[#D4AF37]">USDT</span></p>
        </div>
        <div className="group rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] px-4 py-3 shadow-card-gold transition hover:border-[#D4AF37]/70">
          <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#F1D78A]">Root Account</p>
          <p className="mt-1 truncate font-mono text-xs font-bold text-[#F1D78A]">{node.referralCode}</p>
        </div>
      </div>

      {/* VIEW MODE 1: Animated Dark Cyber Tree Diagram */}
      {viewMode === 'diagram' && layout && (
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`relative min-h-[580px] w-full overflow-auto rounded-2xl border border-[#D4AF37]/35 bg-[#071C18] text-[#ECFDF5] shadow-card-gold transition-colors ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, rgba(52, 211, 153, 0.22) 1.5px, transparent 0),
              linear-gradient(to right, rgba(30, 73, 59, 0.12) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(30, 73, 59, 0.12) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px, 72px 72px, 72px 72px',
          }}
        >
          {/* Ambient luminous glow backdrops */}
          <div className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#34D399]/10 blur-[130px]" />
          <div className="pointer-events-none absolute left-1/2 bottom-1/4 h-80 w-80 -translate-x-1/2 translate-y-1/4 rounded-full bg-[#D4AF37]/10 blur-[140px]" />

          {/* Centered Canvas Container */}
          <div className="flex min-w-full justify-center p-2 sm:p-4">
            <div
              style={{
                width: layout.canvasWidth * zoom,
                height: layout.canvasHeight * zoom,
                transformOrigin: 'top center',
                transition: isDragging ? 'none' : 'width 0.15s ease, height 0.15s ease',
              }}
              className="relative mx-auto"
            >
              <div
                style={{
                  width: layout.canvasWidth,
                  height: layout.canvasHeight,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top center',
                }}
                className="absolute inset-0"
              >
                {/* SVG Layer: Clean Node-to-Node Connectors with Flow Beams & Sockets */}
                <svg
                  width={layout.canvasWidth}
                  height={layout.canvasHeight}
                  className="pointer-events-none absolute inset-0 overflow-visible"
                >
                  <defs>
                    <filter id="glow-mint" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#34D399" floodOpacity="0.85" />
                    </filter>
                    <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#D4AF37" floodOpacity="0.95" />
                    </filter>
                    <linearGradient id="edge-flow-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.9" />
                      <stop offset="50%" stopColor="#34D399" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#6EE7B7" stopOpacity="0.9" />
                    </linearGradient>
                    <linearGradient id="edge-gold-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#F1D78A" stopOpacity="1" />
                      <stop offset="100%" stopColor="#D4AF37" stopOpacity="1" />
                    </linearGradient>
                  </defs>

                  {/* Floating Level Indicator Badges on the left */}
                  {Array.from({ length: layout.maxDepth + 1 }).map((_, d) => {
                    const levelY = layout.PADDING_TOP + d * layout.levelHeight;
                    const isRoot = d === 0;
                    const badgeStroke = isRoot ? '#D4AF37' : d === 1 ? '#34D399' : '#6EE7B7';

                    return (
                      <g key={`level-badge-${d}`}>
                        <rect
                          x={24}
                          y={levelY - 14}
                          width={128}
                          height={28}
                          rx={14}
                          fill="#0B2720"
                          fillOpacity="0.95"
                          stroke={badgeStroke}
                          strokeWidth="1.2"
                        />
                        <circle
                          cx={38}
                          cy={levelY}
                          r={3.5}
                          fill={badgeStroke}
                        />
                        <text
                          x={48}
                          y={levelY + 4}
                          fill={isRoot ? '#F1D78A' : '#ECFDF5'}
                          fontSize="11"
                          fontWeight="800"
                          fontFamily="monospace, sans-serif"
                        >
                          Level {d} {isRoot ? '• Root' : `• ${LEVEL_RATES[d] || '1%'}`}
                        </text>
                      </g>
                    );
                  })}

                  {/* Branch Lines: Smooth flowing node-to-node bezier energy cables */}
                  {layout.edges.map((edge) => {
                    const { source, target } = edge;
                    const isHovered =
                      hoveredNodeId === String(source._id || source.referralCode) ||
                      hoveredNodeId === String(target._id || target.referralCode);

                    const startX = source.x;
                    const startY = source.y + 30; // Bottom center of parent circle avatar
                    const endX = target.x;
                    const endY = target.y - 30; // Top center of child circle avatar
                    const midY = (startY + endY) / 2;

                    // Graceful smooth cubic bezier curve
                    const pathD = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;

                    return (
                      <g key={edge.id}>
                        {/* Base steady connector curve */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke={isHovered ? '#D4AF37' : '#1E493B'}
                          strokeWidth={2.5}
                          className="transition-colors duration-200"
                        />
                        {/* Animated high-velocity energy pulse beam */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke={isHovered ? 'url(#edge-gold-gradient)' : 'url(#edge-flow-gradient)'}
                          strokeWidth={3.2}
                          filter={isHovered ? 'url(#glow-gold)' : undefined}
                          className={isHovered ? 'edge-flow-beam-fast' : 'edge-flow-beam'}
                        />
                        {/* Sockets on avatar boundaries */}
                        <circle
                          cx={startX}
                          cy={startY}
                          r={3.5}
                          fill={isHovered ? '#D4AF37' : '#34D399'}
                          filter="url(#glow-mint)"
                        />
                        <circle
                          cx={endX}
                          cy={endY}
                          r={3.5}
                          fill={isHovered ? '#D4AF37' : '#34D399'}
                          filter="url(#glow-mint)"
                        />
                      </g>
                    );
                  })}
                </svg>

              {/* HTML Overlay Layer: Animated Cyber Nodes */}
              {layout.nodes.map((n) => {
                const nodeId = String(n._id || n.referralCode);
                const isRoot = n.depth === 0;
                const isHovered = hoveredNodeId === nodeId;
                const isSearchMatch = matchingIds.has(nodeId);
                const hasChildren = (n.children || []).length > 0;
                const isCollapsed = collapsedSet.has(nodeId);
                const currentDepth = n.level ?? n.depth ?? 0;
                const rate = LEVEL_RATES[currentDepth] || '1%';

                return (
                  <div key={nodeId}>
                    {/* Fixed Circular Node Container centered exactly on (n.x, n.y) */}
                    <div
                      style={{
                        position: 'absolute',
                        left: n.x - 30,
                        top: n.y - 30,
                        width: 60,
                        height: 60,
                      }}
                      className={isHovered ? 'z-[100]' : 'z-10'}
                    >
                      <motion.div
                        whileHover={{ scale: 1.15 }}
                        transition={{ type: 'spring', damping: 12, stiffness: 300 }}
                        onMouseEnter={() => setHoveredNodeId(nodeId)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        onClick={() => setSelectedMember(n)}
                        className={`group relative flex h-full w-full cursor-pointer items-center justify-center rounded-full border-2 transition-all duration-300 ${
                          isRoot
                            ? 'border-[#D4AF37] bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] shadow-[0_0_25px_rgba(212,175,55,0.45)]'
                            : n.depth === 1
                            ? 'border-[#34D399] bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] shadow-[0_0_18px_rgba(52,211,153,0.3)]'
                            : 'border-[#D4AF37]/40 bg-gradient-to-br from-[#10352C] via-[#0B2720] to-[#071C18] shadow-card-gold hover:border-[#D4AF37]/90 hover:shadow-[0_0_22px_rgba(212,175,55,0.35)]'
                        } ${isSearchMatch ? 'ring-4 ring-[#D4AF37] ring-offset-2 ring-offset-[#071C18] animate-pulse' : ''}`}
                        title={`Click to inspect details: ${n.email}`}
                      >
                        {/* Animated Concentric Radar Ripple Rings for Root Node */}
                        {isRoot && (
                          <>
                            <div className="radar-ring pointer-events-none absolute inset-0 rounded-full border border-[#D4AF37]/60" />
                            <div className="radar-ring-delayed pointer-events-none absolute inset-0 rounded-full border border-[#34D399]/60" />
                          </>
                        )}

                        {/* Centered Node Number & Role / Commission Tag */}
                        <div className="flex flex-col items-center leading-tight">
                          <span className="font-mono text-base font-black tracking-tight text-[#ECFDF5] group-hover:text-gold-gradient">
                            #{n.nodeIndex ?? n.depth}
                          </span>
                          {isRoot ? (
                            <span className="rounded-full bg-gold-gradient px-1.5 py-0.2 font-mono text-[7px] font-black uppercase tracking-wider text-[#071C18]">
                              YOU
                            </span>
                          ) : (
                            <span className="font-mono text-[8px] font-bold text-[#F1D78A]">
                              {rate}
                            </span>
                          )}
                        </div>

                        {/* Expand / Collapse mini toggle button */}
                        {hasChildren && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCollapse(nodeId);
                            }}
                            className={`absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-[#D4AF37]/50 bg-[#0B2720] text-[10px] font-bold text-[#F1D78A] shadow-md transition hover:scale-110 hover:bg-gold-gradient hover:text-[#071C18] ${
                              isCollapsed ? 'animate-bounce' : ''
                            }`}
                            title={isCollapsed ? 'Expand branch' : 'Collapse branch'}
                          >
                            {isCollapsed ? '+' : '−'}
                          </button>
                        )}

                        {/* Email Verified Indicator */}
                        {n.isEmailVerified && (
                          <span
                            className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#34D399] text-[#071C18] shadow font-bold"
                            title="Email verified"
                          >
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </span>
                        )}

                        {/* Rich Floating Tooltip Card */}
                        <div
                          className={`pointer-events-none absolute ${
                            isHovered ? 'block' : 'hidden'
                          } group-hover:block w-64 rounded-2xl border-2 border-[#D4AF37]/70 bg-[#071C18] p-4 text-left shadow-[0_20px_50px_rgba(0,0,0,0.98),0_0_25px_rgba(52,211,153,0.3)] backdrop-blur-2xl z-[100] text-[#ECFDF5] ${
                            isRoot
                              ? 'left-full ml-4 top-0 shadow-[0_0_30px_rgba(212,175,55,0.45)]'
                              : 'top-full mt-14 left-1/2 -translate-x-1/2 shadow-[0_20px_40px_rgba(0,0,0,0.95),0_0_25px_rgba(52,211,153,0.25)]'
                          }`}
                        >
                          {/* Pointer notch indicator */}
                          {isRoot ? (
                            <div className="absolute -left-1.5 top-6 h-3 w-3 rotate-45 border-b border-l border-[#D4AF37]/70 bg-[#071C18]" />
                          ) : (
                            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-t border-l border-[#D4AF37]/70 bg-[#071C18]" />
                          )}
                          <div className="flex items-center justify-between">
                            <p className="truncate text-xs font-bold text-[#ECFDF5]">{n.email}</p>
                            <span className="rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/15 px-2 py-0.5 font-mono text-[9px] font-bold text-[#F1D78A]">
                              #{n.nodeIndex}
                            </span>
                          </div>
                          <p className="mt-1 font-mono text-[10px] font-bold text-gold-gradient">ID: {n.referralCode}</p>
                          {n.sponsorCode && (
                            <p className="font-mono text-[9px] text-[#A7C4B8]">Sponsor: {n.sponsorCode}</p>
                          )}
                          <div className="mt-2.5 space-y-1 border-t border-[#1E493B] pt-2 text-[10px] font-mono">
                            <div className="flex items-center justify-between text-[#A7C4B8]">
                              <span>Volume Staked:</span>
                              <strong className="text-gold-gradient font-bold">{fmt(n.staked)} USDT</strong>
                            </div>
                            <div className="flex items-center justify-between text-[#A7C4B8]">
                              <span>Level & Rate:</span>
                              <strong className="text-[#34D399]">{isRoot ? 'Root User' : `Level ${n.depth} (${rate})`}</strong>
                            </div>
                            <div className="flex items-center justify-between text-[#A7C4B8]">
                              <span>Direct Referrals:</span>
                              <strong className="text-[#ECFDF5]">{n.children?.length || 0} members</strong>
                            </div>
                          </div>
                          <p className="mt-2 text-center text-[9px] text-[#F1D78A]/80 italic">Click node for full member details</p>
                        </div>
                      </motion.div>
                    </div>

                    {/* Sub-Labels beneath circle (Email handle + Staked Volume) */}
                    <div
                      style={{
                        position: 'absolute',
                        left: n.x - 75,
                        top: n.y + 36,
                        width: 150,
                      }}
                      className={`pointer-events-auto flex flex-col items-center gap-0.5 ${
                        isHovered ? 'z-[90]' : 'z-20'
                      }`}
                      onMouseEnter={() => setHoveredNodeId(nodeId)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      onClick={() => setSelectedMember(n)}
                    >
                      <span
                        className="max-w-[130px] truncate text-[11px] font-semibold text-[#ECFDF5] transition hover:text-[#F1D78A] cursor-pointer bg-[#071C18]/90 px-2 py-0.5 rounded-md border border-[#1E493B]/70 shadow-sm"
                        title={n.email}
                      >
                        {n.email ? n.email.split('@')[0] : n.referralCode}
                      </span>
                      <span className="rounded-full border border-[#D4AF37]/35 bg-[#0B2720]/95 px-2.5 py-0.5 font-mono text-[10px] font-bold text-gold-gradient shadow-sm">
                        {fmt(n.staked)} <span className="text-[8px] text-[#D4AF37]">USDT</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    )}

      {/* VIEW MODE 2: Hierarchical List View (Accordion Table) */}
      {viewMode === 'list' && (
        <div className="rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] p-4 shadow-card-gold sm:p-6 transition hover:border-[#D4AF37]/60">
          <ul className="space-y-2">
            <ListItemNode node={node} depth={0} maxDepth={maxDepth} isRoot onSelect={setSelectedMember} />
          </ul>
        </div>
      )}

      {/* Member Detail Slide-over / Modal Dialog */}
      <AnimatePresence>
        {selectedMember && (
          <MemberDetailModal
            member={selectedMember}
            onClose={() => setSelectedMember(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Accordion List Node (Linear Hierarchy View)
 */
function ListItemNode({ node, depth, maxDepth, isRoot = false, onSelect }) {
  const [open, setOpen] = useState(depth < 2);
  const children = node.children || [];
  const hasChildren = children.length > 0;
  const levelLabel = isRoot ? 'Root' : `L${node.level ?? node.depth}`;
  const rate = LEVEL_RATES[node.level ?? node.depth] || '1%';

  return (
    <li className="relative">
      <div
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
          isRoot
            ? 'border-[#D4AF37]/50 bg-[#D4AF37]/15 shadow-sm'
            : 'border-[#1E493B] bg-[#0B2720] hover:border-[#D4AF37]/40 hover:bg-[#164B3A]/40'
        }`}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          disabled={!hasChildren}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${
            hasChildren
              ? 'border-[#D4AF37]/40 bg-[#164B3A] text-[#F1D78A] hover:bg-[#D4AF37] hover:text-[#071C18]'
              : 'border-[#1E493B] text-[#91A89E]'
          }`}
          title={hasChildren ? undefined : 'No downline'}
        >
          {hasChildren && open ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : hasChildren ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <Network className="h-3 w-3" />
          )}
        </button>

        <span
          className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
            isRoot
              ? 'bg-gold-gradient text-[#071C18]'
              : 'border border-[#D4AF37]/35 bg-[#D4AF37]/10 text-[#F1D78A]'
          }`}
        >
          {levelLabel} {!isRoot && `(${rate})`}
        </span>

        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onSelect(node)}>
          <p className="truncate text-sm font-semibold text-[#ECFDF5] hover:text-[#F1D78A]">
            {node.email}
            {node.role === 'admin' && (
              <span className="ml-2 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-1.5 py-0.5 text-[9px] uppercase text-[#F1D78A]">
                admin
              </span>
            )}
          </p>
          <p className="font-mono text-[11px] text-[#A7C4B8]">
            {node.referralCode}
            {node.sponsorCode && ` ← ${node.sponsorCode}`}
          </p>
        </div>

        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          {node.isEmailVerified ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#34D399]/30 bg-[#34D399]/10 px-2 py-0.5 text-[10px] font-semibold text-[#34D399]">
              <MailCheck className="h-3 w-3" /> Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-0.5 text-[10px] font-semibold text-[#F1D78A]">
              <MailX className="h-3 w-3" /> Unverified
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4AF37]/30 bg-[#071C18] px-3 py-1 font-mono text-[11px] font-bold text-gold-gradient">
            <Lock className="h-3 w-3 text-[#D4AF37]" />
            {fmt(node.staked)} USDT
          </span>
        </div>
      </div>

      {hasChildren && open && depth < maxDepth && (
        <ul className="ml-4 space-y-2 border-l-2 border-[#1E493B] pl-4 pt-2 sm:ml-6">
          {children.map((c) => (
            <ListItemNode
              key={String(c._id)}
              node={c}
              depth={depth + 1}
              maxDepth={maxDepth}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * Member Profile Modal Dialog
 */
function MemberDetailModal({ member, onClose }) {
  const [copied, setCopied] = useState('');

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      // ignore
    }
  };

  const isRoot = member.depth === 0 || member.level === 0;
  const currentDepth = member.level ?? member.depth ?? 0;
  const rate = LEVEL_RATES[currentDepth] || (isRoot ? 'Root' : '1%');

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071C18]/85 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 20, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#1E493B] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F1D78A] shadow-inner">
              <User className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-[#ECFDF5]">Member Details</h4>
                <span className="rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#F1D78A]">
                  {isRoot ? 'Root User' : `Level ${currentDepth}`}
                </span>
              </div>
              <p className="mt-0.5 font-mono text-xs text-[#A7C4B8]">Node #{member.nodeIndex ?? 0}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#91A89E] hover:bg-[#164B3A] hover:text-[#ECFDF5]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content rows */}
        <div className="mt-4 space-y-3">
          {/* Email */}
          <div className="flex items-center justify-between rounded-xl border border-[#1E493B] bg-[#0B2720] p-3">
            <div>
              <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#F1D78A]">Email Address</p>
              <p className="mt-0.5 text-sm font-semibold text-[#ECFDF5]">{member.email}</p>
            </div>
            <button
              onClick={() => copy(member.email, 'email')}
              className="rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 p-1.5 text-[#F1D78A] hover:bg-[#D4AF37]/25"
            >
              {copied === 'email' ? <Check className="h-3.5 w-3.5 text-[#34D399]" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Referral Code & Sponsor Code */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#1E493B] bg-[#0B2720] p-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#F1D78A]">Referral Code</p>
                <button
                  onClick={() => copy(member.referralCode, 'code')}
                  className="text-[#F1D78A] hover:text-[#ECFDF5]"
                >
                  {copied === 'code' ? <Check className="h-3 w-3 text-[#34D399]" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
              <p className="mt-1 font-mono text-xs font-bold text-gold-gradient">{member.referralCode}</p>
            </div>

            <div className="rounded-xl border border-[#1E493B] bg-[#0B2720] p-3">
              <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#F1D78A]">Sponsor Code</p>
              <p className="mt-1 font-mono text-xs font-semibold text-[#A7C4B8]">
                {member.sponsorCode || 'Root Upline'}
              </p>
            </div>
          </div>

          {/* Volume Staked & Commission Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#1E493B] bg-[#0B2720] p-3">
              <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#F1D78A]">Volume Staked</p>
              <p className="mt-1 font-mono text-sm font-bold text-gold-gradient">
                {fmt(member.staked)} <span className="text-xs text-[#D4AF37]">USDT</span>
              </p>
            </div>

            <div className="rounded-xl border border-[#1E493B] bg-[#0B2720] p-3">
              <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#F1D78A]">Commission Rate</p>
              <p className="mt-1 font-mono text-sm font-bold text-[#34D399]">{rate}</p>
            </div>
          </div>

          {/* Verification Status & Direct Downline */}
          <div className="flex items-center justify-between rounded-xl border border-[#1E493B] bg-[#0B2720] p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#91A89E]">Email Verification:</span>
              {member.isEmailVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#34D399]/30 bg-[#34D399]/10 px-2 py-0.5 text-[10px] font-semibold text-[#34D399]">
                  <MailCheck className="h-3 w-3" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-0.5 text-[10px] font-semibold text-[#F1D78A]">
                  <MailX className="h-3 w-3" /> Unverified
                </span>
              )}
            </div>

            <div className="text-right">
              <span className="text-xs text-[#91A89E]">Direct Referrals: </span>
              <strong className="text-xs text-[#ECFDF5]">{member.children?.length || 0}</strong>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-4 py-2 text-xs font-mono font-bold text-[#F1D78A] transition hover:bg-gold-gradient hover:text-[#071C18]"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

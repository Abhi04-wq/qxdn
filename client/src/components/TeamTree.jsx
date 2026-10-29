import { useState, useMemo, useRef, useEffect } from 'react';
import {
  ChevronRight, ChevronDown, Network, MailCheck, MailX, Lock,
  ZoomIn, ZoomOut, RotateCcw, Maximize2, Search, X, Copy, Check,
  User, Users, Coins, Layers, GitBranch, ListTree, Sun, Moon,
  Info, ExternalLink
} from 'lucide-react';

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
 * Top-down hierarchical layout algorithm (guarantees zero overlap, Image 2 style).
 * Centers parents directly above their children and maintains uniform vertical level height.
 */
function layoutTree(root, collapsedSet) {
  const nodeWidth = 140;
  const gapX = 40;
  const levelHeight = 160;
  const circleRadius = 28; // diameter = 56px

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
  const PADDING_TOP = 80;
  const PADDING_LEFT = 70;
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

  assignCoords(root, PADDING_LEFT);

  // Determine bounding box
  let minX = Infinity;
  let maxX = -Infinity;
  nodes.forEach((n) => {
    if (n.x - nodeWidth / 2 < minX) minX = n.x - nodeWidth / 2;
    if (n.x + nodeWidth / 2 > maxX) maxX = n.x + nodeWidth / 2;
  });

  const BRACKET_MARGIN = 220; // room for dashed lines, "Level X" and "] HEIGHT OF TREE = N"
  const canvasWidth = Math.max(920, Math.ceil(maxX + BRACKET_MARGIN));
  const canvasHeight = Math.ceil(PADDING_TOP + (maxDepth + 1) * levelHeight + 50);

  return {
    nodes,
    edges,
    maxDepth,
    canvasWidth,
    canvasHeight,
    levelHeight,
    circleRadius,
    PADDING_TOP,
    minX: Math.max(20, minX),
    maxX,
  };
}

export default function TeamTree({ node, maxDepth = 10 }) {
  // Default to 'diagram' mode to show the CS Tree Diagram (Image 2) out of the box
  const [viewMode, setViewMode] = useState('diagram'); // 'diagram' | 'list'
  const [themeMode, setThemeMode] = useState('textbook'); // 'textbook' (exact Image 2) | 'dark'
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

  // Center tree horizontally on first render
  useEffect(() => {
    if (containerRef.current && layout) {
      const containerW = containerRef.current.clientWidth;
      if (layout.canvasWidth > containerW) {
        containerRef.current.scrollLeft = (layout.canvasWidth * zoom - containerW) / 2;
      }
    }
  }, [layout?.canvasWidth]);

  if (!node) return null;

  const isTextbook = themeMode === 'textbook';

  return (
    <div className="w-full select-none">
      {/* Top Controls Toolbar */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        {/* Left: View Mode Toggle & Theme Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Switch: Tree Diagram (Image 2) vs List View */}
          <div className="flex rounded-xl border border-slate-800 bg-slate-900 p-1">
            <button
              onClick={() => setViewMode('diagram')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'diagram'
                  ? 'border border-cyan-400/40 bg-cyan-400/15 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              <span>Tree Diagram (Image 2)</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'list'
                  ? 'border border-cyan-400/40 bg-cyan-400/15 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListTree className="h-3.5 w-3.5" />
              <span>List View</span>
            </button>
          </div>

          {/* Canvas Style: Textbook (Exact Image 2) vs Dark Canvas */}
          {viewMode === 'diagram' && (
            <div className="flex rounded-xl border border-slate-800 bg-slate-900 p-1">
              <button
                onClick={() => setThemeMode('textbook')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  isTextbook
                    ? 'bg-slate-200 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Exact CS graph style matching Image 2 (Light gray background)"
              >
                <Sun className="h-3 w-3" />
                <span>Textbook (Image 2)</span>
              </button>
              <button
                onClick={() => setThemeMode('dark')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                  !isTextbook
                    ? 'border border-cyan-400/40 bg-slate-800 text-cyan-300 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Dark theme blueprint matching dashboard"
              >
                <Moon className="h-3 w-3" />
                <span>Dark Slate</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Search, Zoom, Expand/Collapse */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search member email or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-44 rounded-xl border border-slate-800 bg-slate-900 py-1.5 pl-8 pr-7 text-xs text-slate-200 placeholder-slate-500 outline-none transition focus:border-cyan-400/50 sm:w-56"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-slate-500 hover:text-slate-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {viewMode === 'diagram' && (
            <>
              {/* Zoom Buttons */}
              <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900 p-0.5">
                <button
                  onClick={handleZoomOut}
                  title="Zoom Out"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="px-2 font-mono text-[11px] text-slate-300">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  title="Zoom In"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleResetZoom}
                  title="Reset 100%"
                  className="rounded-lg border-l border-slate-800 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
                <button
                  onClick={handleFitView}
                  title="Fit to Width"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                >
                  <Maximize2 className="h-3 w-3" />
                </button>
              </div>

              {/* Expand / Collapse All */}
              <div className="flex items-center gap-1">
                <button
                  onClick={expandAll}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                >
                  Expand
                </button>
                <button
                  onClick={collapseAll}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                >
                  Collapse
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Tree Height</p>
          <p className="mt-0.5 font-mono text-base font-bold text-cyan-400">
            {layout?.maxDepth ?? stats.maxDepth} Level{(layout?.maxDepth ?? stats.maxDepth) === 1 ? '' : 's'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Downline Members</p>
          <p className="mt-0.5 font-mono text-base font-bold text-white">{stats.totalMembers}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Downline Volume</p>
          <p className="mt-0.5 font-mono text-base font-bold text-emerald-400">{fmt(stats.totalVolume)} USDT</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Root Account</p>
          <p className="mt-0.5 truncate font-mono text-xs font-semibold text-slate-300">{node.referralCode}</p>
        </div>
      </div>

      {/* VIEW MODE 1: Top-down Visual Tree Diagram (Exact Image 2 style) */}
      {viewMode === 'diagram' && layout && (
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`relative min-h-[540px] w-full overflow-auto rounded-2xl border transition-colors ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          } ${
            isTextbook
              ? 'border-slate-300 bg-[#f1f3f5] shadow-inner text-slate-900'
              : 'border-slate-800 bg-slate-950 text-slate-100'
          }`}
          style={{
            backgroundImage: isTextbook
              ? 'radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.35) 1px, transparent 0)'
              : 'radial-gradient(circle at 1px 1px, rgba(51, 65, 85, 0.35) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        >
          {/* Zoomable Canvas Container */}
          <div
            style={{
              width: layout.canvasWidth * zoom,
              height: layout.canvasHeight * zoom,
              transformOrigin: 'top left',
              transition: isDragging ? 'none' : 'width 0.15s ease, height 0.15s ease',
            }}
            className="relative"
          >
            <div
              style={{
                width: layout.canvasWidth,
                height: layout.canvasHeight,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
              }}
              className="absolute inset-0"
            >
              {/* SVG Layer: Connectors, Dashed Level Lines, Level Labels, Height of Tree Bracket */}
              <svg
                width={layout.canvasWidth}
                height={layout.canvasHeight}
                className="pointer-events-none absolute inset-0 overflow-visible"
              >
                <defs>
                  <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#22d3ee" floodOpacity="0.8" />
                  </filter>
                </defs>

                {/* 1. Horizontal Dashed Lines across each level (Exact Image 2 feature) */}
                {Array.from({ length: layout.maxDepth + 1 }).map((_, d) => {
                  const levelY = layout.PADDING_TOP + d * layout.levelHeight;
                  const labelX = layout.maxX + 45;
                  const isLevelHighlighted = d === 0;

                  return (
                    <g key={`level-guide-${d}`}>
                      {/* Horizontal Dashed Line passing right through node center */}
                      <line
                        x1={30}
                        y1={levelY}
                        x2={labelX - 15}
                        y2={levelY}
                        stroke={
                          isTextbook
                            ? isLevelHighlighted ? '#0284c7' : '#94a3b8'
                            : isLevelHighlighted ? 'rgba(56, 189, 248, 0.6)' : 'rgba(71, 85, 105, 0.6)'
                        }
                        strokeWidth="1.5"
                        strokeDasharray="6 6"
                      />

                      {/* Level Label on the right (e.g. "Level 0", "Level 1"...) */}
                      <text
                        x={labelX}
                        y={levelY + 4}
                        fill={
                          isTextbook
                            ? isLevelHighlighted ? '#0369a1' : '#334155'
                            : isLevelHighlighted ? '#38bdf8' : d <= 2 ? '#a78bfa' : '#94a3b8'
                        }
                        fontSize="13"
                        fontWeight="700"
                        fontFamily="monospace, sans-serif"
                        textAnchor="start"
                      >
                        Level {d}
                      </text>
                    </g>
                  );
                })}

                {/* 2. Height of Tree Bracket on the right (Exact Image 2 feature) */}
                {(() => {
                  const bracketX = layout.maxX + 140;
                  const y0 = layout.PADDING_TOP;
                  const ymax = layout.PADDING_TOP + layout.maxDepth * layout.levelHeight;

                  if (layout.maxDepth === 0) {
                    return (
                      <g key="tree-height-bracket-zero">
                        <text
                          x={bracketX + 10}
                          y={y0 + 4}
                          fill={isTextbook ? '#475569' : '#94a3b8'}
                          fontSize="11"
                          fontWeight="700"
                          fontFamily="monospace"
                        >
                          HEIGHT OF TREE = 0
                        </text>
                      </g>
                    );
                  }

                  // Square bracket shape `]` facing left towards the levels
                  const bracketPath = `
                    M ${bracketX} ${y0}
                    H ${bracketX + 12}
                    V ${ymax}
                    H ${bracketX}
                  `;
                  const midY = (y0 + ymax) / 2;
                  const textX = bracketX + 32;

                  return (
                    <g key="tree-height-bracket">
                      {/* Square Bracket line */}
                      <path
                        d={bracketPath}
                        fill="none"
                        stroke={isTextbook ? '#334155' : '#94a3b8'}
                        strokeWidth="2"
                        strokeLinecap="square"
                      />

                      {/* Vertically oriented text: HEIGHT OF TREE = N (Reading top to bottom matching Image 2) */}
                      <text
                        x={textX}
                        y={midY}
                        transform={`rotate(90, ${textX}, ${midY})`}
                        fill={isTextbook ? '#0f172a' : '#cbd5e1'}
                        fontSize="12"
                        fontWeight="700"
                        fontFamily="monospace"
                        textAnchor="middle"
                        letterSpacing="0.1em"
                      >
                        HEIGHT OF TREE = {layout.maxDepth}
                      </text>
                    </g>
                  );
                })()}

                {/* 3. Branch Lines connecting parent to child (Exact Image 2 straight Euclidean lines) */}
                {layout.edges.map((edge) => {
                  const { source, target } = edge;
                  const isHovered =
                    hoveredNodeId === String(source._id || source.referralCode) ||
                    hoveredNodeId === String(target._id || target.referralCode);

                  // Lines connect mathematical center to center; the opaque circle masks the interior cleanly!
                  return (
                    <g key={edge.id}>
                      <line
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke={
                          isHovered
                            ? '#0284c7'
                            : isTextbook
                              ? '#475569'
                              : '#64748b'
                        }
                        strokeWidth={isHovered ? 2.5 : 1.75}
                        filter={isHovered && !isTextbook ? 'url(#glow-cyan)' : undefined}
                        className="transition-colors duration-200"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* HTML Overlay Layer: Circular Nodes (Exact Image 2 Style) */}
              {layout.nodes.map((n) => {
                const nodeId = String(n._id || n.referralCode);
                const isRoot = n.depth === 0;
                const isHovered = hoveredNodeId === nodeId;
                const isSearchMatch = matchingIds.has(nodeId);
                const hasChildren = (n.children || []).length > 0;
                const isCollapsed = collapsedSet.has(nodeId);

                // Circular Node Styling: Light gray silver disc with dark crisp border matching Image 2
                const circleBg = isTextbook
                  ? 'bg-[#d8d8d8] text-slate-900 border-[#334155] shadow-sm'
                  : 'bg-slate-200 text-slate-950 border-slate-700 shadow-lg';

                const rootBorder = isRoot
                  ? isTextbook
                    ? 'ring-2 ring-sky-500 ring-offset-2 ring-offset-[#f1f3f5]'
                    : 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.35)]'
                  : '';

                return (
                  <div key={nodeId}>
                    {/* Circular Node - Centered precisely on (n.x, n.y) */}
                    <div
                      style={{
                        position: 'absolute',
                        left: n.x,
                        top: n.y,
                        width: 56,
                        height: 56,
                        transform: 'translate(-50%, -50%)',
                      }}
                      onMouseEnter={() => setHoveredNodeId(nodeId)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      onClick={() => setSelectedMember(n)}
                      className={`group z-10 flex cursor-pointer items-center justify-center rounded-full border-2 transition-transform duration-200 hover:scale-115 ${circleBg} ${rootBorder} ${
                        isSearchMatch ? 'ring-4 ring-amber-400 ring-offset-2 animate-pulse' : ''
                      }`}
                      title={`Click to inspect details: ${n.email}`}
                    >
                      {/* Centered Node Number (Exact representation of 15, 35, 9, 40 in Image 2) */}
                      <div className="flex flex-col items-center leading-none">
                        <span className="font-mono text-base font-black tracking-tight text-slate-950">
                          {n.nodeIndex ?? n.depth}
                        </span>
                        {isRoot && (
                          <span className="mt-0.5 rounded px-1 font-mono text-[7px] font-black uppercase tracking-wider bg-slate-950 text-white">
                            YOU
                          </span>
                        )}
                      </div>

                      {/* Collapse/Expand mini toggle on circle perimeter */}
                      {hasChildren && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCollapse(nodeId);
                          }}
                          className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-[10px] font-bold text-white shadow hover:bg-cyan-500 hover:text-slate-950"
                          title={isCollapsed ? 'Expand branch' : 'Collapse branch'}
                        >
                          {isCollapsed ? '+' : '−'}
                        </button>
                      )}

                      {/* Email verified indicator */}
                      {n.isEmailVerified && (
                        <span
                          className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-white shadow"
                          title="Email verified"
                        >
                          <Check className="h-2 w-2 stroke-[3]" />
                        </span>
                      )}

                      {/* Rich Floating Hover Tooltip Card */}
                      <div className="pointer-events-none absolute bottom-full mb-2 hidden w-56 rounded-xl border border-slate-700 bg-slate-900/95 p-3 text-left shadow-2xl backdrop-blur group-hover:block z-40 text-slate-200">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-xs font-semibold text-white">{n.email}</p>
                          <span className="font-mono text-[9px] font-bold text-cyan-300">#{n.nodeIndex}</span>
                        </div>
                        <p className="mt-0.5 font-mono text-[10px] text-cyan-400">ID: {n.referralCode}</p>
                        {n.sponsorCode && (
                          <p className="font-mono text-[9px] text-slate-400">Sponsor: {n.sponsorCode}</p>
                        )}
                        <div className="mt-2 border-t border-slate-800 pt-1.5 space-y-0.5 text-[10px]">
                          <p className="text-slate-400">
                            Staked: <strong className="text-emerald-400">{fmt(n.staked)} USDT</strong>
                          </p>
                          <p className="text-slate-400">
                            Level: <strong className="text-indigo-400">{isRoot ? 'Root (Level 0)' : `Level ${n.depth} (${LEVEL_RATES[n.depth] || '1%'})`}</strong>
                          </p>
                          <p className="text-slate-400">
                            Direct referrals: <strong className="text-white">{n.children?.length || 0}</strong>
                          </p>
                        </div>
                        <p className="mt-2 text-[9px] text-slate-500 italic">Click node for full details</p>
                      </div>
                    </div>

                    {/* Sub-Labels beneath circle (Email handle + Staked Volume) */}
                    <div
                      style={{
                        position: 'absolute',
                        left: n.x,
                        top: n.y + 34,
                        transform: 'translateX(-50%)',
                      }}
                      className="pointer-events-auto z-10 flex flex-col items-center gap-0.5 whitespace-nowrap"
                      onClick={() => setSelectedMember(n)}
                    >
                      <span
                        className={`max-w-[120px] truncate text-[11px] font-semibold cursor-pointer transition hover:text-cyan-400 ${
                          isTextbook ? 'text-slate-800' : 'text-slate-300'
                        }`}
                        title={n.email}
                      >
                        {n.email.split('@')[0]}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold shadow-sm ${
                          isTextbook
                            ? 'border-slate-300 bg-white/95 text-emerald-600'
                            : 'border-slate-800 bg-slate-950/90 text-emerald-400'
                        }`}
                      >
                        {fmt(n.staked)} USDT
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: Hierarchical List View (Accordion Table) */}
      {viewMode === 'list' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
          <ul className="space-y-2">
            <ListItemNode node={node} depth={0} maxDepth={maxDepth} isRoot onSelect={setSelectedMember} />
          </ul>
        </div>
      )}

      {/* Member Detail Slide-over / Modal Dialog */}
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
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
  const levelLabel = isRoot ? 'You' : `L${node.level ?? node.depth}`;

  return (
    <li className="relative">
      <div
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
          isRoot
            ? 'border-cyan-400/30 bg-cyan-400/10'
            : 'border-slate-800 bg-slate-900 hover:border-slate-700'
        }`}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          disabled={!hasChildren}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${
            hasChildren
              ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/20'
              : 'border-slate-800 text-slate-700'
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
              ? 'bg-cyan-400 text-slate-950'
              : (node.level || node.depth) <= 3
                ? 'bg-violet-500/15 text-violet-300'
                : 'bg-slate-800 text-slate-400'
          }`}
        >
          {levelLabel}
        </span>

        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onSelect(node)}>
          <p className="truncate text-sm font-medium text-white hover:text-cyan-300">
            {node.email}
            {node.role === 'admin' && (
              <span className="ml-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-1.5 py-0.5 text-[9px] uppercase text-amber-400">
                admin
              </span>
            )}
          </p>
          <p className="font-mono text-[11px] text-slate-500">
            {node.referralCode}
            {node.sponsorCode && ` ← ${node.sponsorCode}`}
          </p>
        </div>

        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          {node.isEmailVerified ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
              <MailCheck className="h-3 w-3" />
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
              <MailX className="h-3 w-3" />
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1 font-mono text-[11px] text-slate-300">
            <Lock className="h-3 w-3 text-slate-500" />
            {fmt(node.staked)} USDT
          </span>
        </div>
      </div>

      {hasChildren && open && depth < maxDepth && (
        <ul className="ml-4 space-y-2 border-l-2 border-slate-800/70 pl-4 pt-2 sm:ml-6">
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                isRoot
                  ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-400'
                  : 'border-violet-500/40 bg-violet-500/10 text-violet-400'
              }`}
            >
              <User className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-white">Member Details</h4>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                  {isRoot ? 'Root User' : `Level ${currentDepth}`}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">Node #{member.nodeIndex ?? 0}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content rows */}
        <div className="mt-4 space-y-3">
          {/* Email */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Email Address</p>
              <p className="mt-0.5 text-sm font-semibold text-white">{member.email}</p>
            </div>
            <button
              onClick={() => copy(member.email, 'email')}
              className="rounded-lg border border-slate-800 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              {copied === 'email' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Referral Code & Sponsor Code */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Referral Code</p>
                <button
                  onClick={() => copy(member.referralCode, 'code')}
                  className="text-slate-400 hover:text-white"
                >
                  {copied === 'code' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
              <p className="mt-1 font-mono text-xs font-bold text-cyan-300">{member.referralCode}</p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Sponsor Code</p>
              <p className="mt-1 font-mono text-xs font-semibold text-slate-300">
                {member.sponsorCode || 'Root Upline'}
              </p>
            </div>
          </div>

          {/* Volume Staked & Commission Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Volume Staked</p>
              <p className="mt-1 font-mono text-sm font-bold text-emerald-400">
                {fmt(member.staked)} USDT
              </p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Commission Rate</p>
              <p className="mt-1 font-mono text-sm font-bold text-indigo-400">{rate}</p>
            </div>
          </div>

          {/* Verification Status & Direct Downline */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Email Verification:</span>
              {member.isEmailVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <MailCheck className="h-3 w-3" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                  <MailX className="h-3 w-3" /> Unverified
                </span>
              )}
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">Direct Referrals: </span>
              <strong className="text-xs text-white">{member.children?.length || 0}</strong>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
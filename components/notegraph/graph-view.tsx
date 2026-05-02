'use client';

import * as React from 'react';
import { Loader2, RefreshCw, ZoomIn, ZoomOut, Maximize2, Network } from 'lucide-react';
import { api } from '@/lib/api';
import type { GraphData, GraphNode } from '@/lib/types';
import { cn } from '@/lib/utils';

interface GraphViewProps {
  selectedId: string | null;
  onNavigate: (id: string) => void;
}

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  meta: GraphNode;
}

function computeForceLayout(data: GraphData, w: number, h: number): LayoutNode[] {
  const n = data.nodes.length;
  if (!n) return [];

  const cx = w / 2;
  const cy = h / 2;

  type SimNode = { id: string; x: number; y: number; vx: number; vy: number; meta: GraphNode };

  const nodes: SimNode[] = data.nodes.map((node, i) => ({
    id: node.id,
    x: cx + Math.cos((i / n) * Math.PI * 2) * Math.min(w, h) * 0.3,
    y: cy + Math.sin((i / n) * Math.PI * 2) * Math.min(w, h) * 0.3,
    vx: 0,
    vy: 0,
    meta: node,
  }));

  const nodeIndex = new Map(nodes.map((nd, i) => [nd.id, i]));
  const idealDist = Math.sqrt((w * h) / Math.max(n, 1)) * 1.4;

  for (let iter = 0; iter < 300; iter++) {
    const cooling = Math.max(0.05, 1 - iter / 300);
    const temp = 35 * cooling;

    for (const nd of nodes) { nd.vx = 0; nd.vy = 0; }

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = nodes[i].x - nodes[j].x;
        let dy = nodes[i].y - nodes[j].y;
        if (dx === 0 && dy === 0) { dx = (Math.random() - 0.5) * 0.1; dy = (Math.random() - 0.5) * 0.1; }
        const d = Math.sqrt(dx * dx + dy * dy);
        const f = (idealDist * idealDist) / d;
        nodes[i].vx += (dx / d) * f; nodes[i].vy += (dy / d) * f;
        nodes[j].vx -= (dx / d) * f; nodes[j].vy -= (dy / d) * f;
      }
    }

    for (const e of data.edges) {
      const si = nodeIndex.get(e.source);
      const ti = nodeIndex.get(e.target);
      if (si === undefined || ti === undefined) continue;
      const dx = nodes[ti].x - nodes[si].x;
      const dy = nodes[ti].y - nodes[si].y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const f = (d * d) / idealDist;
      nodes[si].vx += (dx / d) * f; nodes[si].vy += (dy / d) * f;
      nodes[ti].vx -= (dx / d) * f; nodes[ti].vy -= (dy / d) * f;
    }

    for (const nd of nodes) {
      nd.vx += (cx - nd.x) * 0.015;
      nd.vy += (cy - nd.y) * 0.015;
    }

    for (const nd of nodes) {
      const speed = Math.sqrt(nd.vx * nd.vx + nd.vy * nd.vy) || 0.01;
      const move = Math.min(speed, temp);
      nd.x += (nd.vx / speed) * move;
      nd.y += (nd.vy / speed) * move;
      nd.x = Math.max(32, Math.min(w - 32, nd.x));
      nd.y = Math.max(32, Math.min(h - 32, nd.y));
    }
  }

  return nodes.map((nd) => ({ id: nd.id, x: nd.x, y: nd.y, meta: nd.meta }));
}

const NODE_R = 8;
const NODE_R_SELECTED = 12;
const LABEL_ALWAYS_THRESHOLD = 20; // show labels for all nodes when ≤ N nodes

export function GraphView({ selectedId, onNavigate }: GraphViewProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [graphData, setGraphData] = React.useState<GraphData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [layoutNodes, setLayoutNodes] = React.useState<LayoutNode[]>([]);
  const [containerSize, setContainerSize] = React.useState({ w: 800, h: 600 });
  const [hovered, setHovered] = React.useState<string | null>(null);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const dragging = React.useRef(false);
  const dragStart = React.useRef({ mx: 0, my: 0, px: 0, py: 0 });

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) setContainerSize({ w: width, h: height });
    });
    obs.observe(el);
    const r = el.getBoundingClientRect();
    if (r.width > 0) setContainerSize({ w: r.width, h: r.height });
    return () => obs.disconnect();
  }, []);

  async function loadGraph() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.graph.get();
      setGraphData(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load graph');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { loadGraph(); }, []);

  React.useEffect(() => {
    if (!graphData) return;
    const layout = computeForceLayout(graphData, containerSize.w, containerSize.h);
    setLayoutNodes(layout);
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, [graphData, containerSize]);

  function handleWheel(e: React.WheelEvent<SVGSVGElement>) {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.15, Math.min(5, zoom * factor));
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setPan((p) => ({
      x: mx - (mx - p.x) * (newZoom / zoom),
      y: my - (my - p.y) * (newZoom / zoom),
    }));
    setZoom(newZoom);
  }

  function handleSvgMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    const target = e.target as SVGElement;
    if (target.closest('[data-node]')) return;
    dragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
    e.currentTarget.style.cursor = 'grabbing';
  }

  function handleSvgMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!dragging.current) return;
    setPan({
      x: dragStart.current.px + (e.clientX - dragStart.current.mx),
      y: dragStart.current.py + (e.clientY - dragStart.current.my),
    });
  }

  function handleSvgMouseUp(e: React.MouseEvent<SVGSVGElement>) {
    dragging.current = false;
    e.currentTarget.style.cursor = 'grab';
  }

  function zoomBy(factor: number) {
    const newZoom = Math.max(0.15, Math.min(5, zoom * factor));
    const cx = containerSize.w / 2;
    const cy = containerSize.h / 2;
    setPan((p) => ({
      x: cx - (cx - p.x) * (newZoom / zoom),
      y: cy - (cy - p.y) * (newZoom / zoom),
    }));
    setZoom(newZoom);
  }

  function resetView() { setPan({ x: 0, y: 0 }); setZoom(1); }

  const posMap = React.useMemo(
    () => new Map(layoutNodes.map((n) => [n.id, { x: n.x, y: n.y }])),
    [layoutNodes]
  );

  const showAllLabels = layoutNodes.length <= LABEL_ALWAYS_THRESHOLD;

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
          <p className="text-xs text-muted-foreground">Building graph…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center flex-col gap-4 animate-fade-in">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: 'hsl(var(--destructive) / 0.1)' }}>
          <Network className="h-6 w-6" style={{ color: 'hsl(var(--destructive))' }} />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium">Failed to load graph</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
        <button
          onClick={loadGraph}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium border border-border hover:bg-muted transition-all duration-150"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  const edges = graphData?.edges ?? [];

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden graph-canvas-bg"
      style={{ background: 'hsl(var(--background))' }}
    >
      {/* SVG gradient defs */}
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="edge-highlight-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--graph-edge-highlight))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--graph-edge-highlight))" stopOpacity="0.2" />
          </linearGradient>
          <filter id="node-glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* ── Controls (glassmorphism) ──────────────────────── */}
      <div
        className="absolute top-4 right-4 z-10 flex flex-col gap-1 rounded-xl p-1.5"
        style={{
          background: 'hsl(var(--card) / 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0 4px 16px hsl(0 0% 0% / 0.10)',
        }}
      >
        {[
          { icon: ZoomIn, label: 'Zoom in', action: () => zoomBy(1.3) },
          { icon: ZoomOut, label: 'Zoom out', action: () => zoomBy(0.77) },
          { icon: Maximize2, label: 'Reset view', action: resetView },
          { icon: RefreshCw, label: 'Reload', action: loadGraph },
        ].map(({ icon: Icon, label, action }) => (
          <button
            key={label}
            onClick={action}
            title={label}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>

      {/* ── Stats pill ───────────────────────────────────── */}
      <div
        className="absolute bottom-4 left-4 z-10 select-none text-[11px] font-medium px-3 py-1.5 rounded-full"
        style={{
          background: 'hsl(var(--card) / 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--muted-foreground))',
        }}
      >
        {layoutNodes.length} notes · {edges.length} links
      </div>

      {/* ── Legend ───────────────────────────────────────── */}
      <div
        className="absolute bottom-4 right-4 z-10 select-none flex flex-col gap-1.5 text-[11px] px-3 py-2.5 rounded-xl"
        style={{
          background: 'hsl(var(--card) / 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--muted-foreground))',
        }}
      >
        {[
          { color: 'hsl(var(--graph-node))', label: 'note' },
          { color: 'hsl(var(--graph-node-stub))', label: 'stub' },
          { color: 'hsl(var(--graph-node-deleted))', label: 'deleted', opacity: 0.6 },
        ].map(({ color, label, opacity }) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
              style={{ background: color, opacity }}
            />
            {label}
          </div>
        ))}
      </div>

      {/* ── Empty state ──────────────────────────────────── */}
      {layoutNodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-fade-in">
          <div className="text-center space-y-3">
            <Network className="h-10 w-10 mx-auto text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">No notes yet — create one to build your graph.</p>
          </div>
        </div>
      )}

      {/* ── SVG Canvas ───────────────────────────────────── */}
      <svg
        width={containerSize.w}
        height={containerSize.h}
        className="cursor-grab select-none"
        style={{ display: 'block' }}
        onWheel={handleWheel}
        onMouseDown={handleSvgMouseDown}
        onMouseMove={handleSvgMouseMove}
        onMouseUp={handleSvgMouseUp}
        onMouseLeave={handleSvgMouseUp}
      >
        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>

          {/* Edges */}
          {edges.map((edge) => {
            const s = posMap.get(edge.source);
            const t = posMap.get(edge.target);
            if (!s || !t) return null;
            const isHighlighted =
              edge.source === selectedId || edge.target === selectedId ||
              edge.source === hovered || edge.target === hovered;
            return (
              <line
                key={edge.id}
                x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                stroke={
                  edge.is_broken
                    ? 'hsl(var(--destructive))'
                    : isHighlighted
                    ? 'hsl(var(--graph-edge-highlight))'
                    : 'hsl(var(--graph-edge))'
                }
                strokeWidth={(edge.is_broken ? 1.5 : isHighlighted ? 2 : 1) / zoom}
                strokeDasharray={edge.is_broken ? `${4 / zoom} ${3 / zoom}` : undefined}
                strokeOpacity={isHighlighted ? 0.9 : 0.5}
              />
            );
          })}

          {/* Nodes */}
          {layoutNodes.map((node) => {
            const isSelected = node.id === selectedId;
            const isHovered = node.id === hovered;
            const { is_placeholder: isPlaceholder, is_deleted: isDeleted } = node.meta;

            const nodeColor = isDeleted
              ? 'hsl(var(--graph-node-deleted))'
              : isPlaceholder
              ? 'hsl(var(--graph-node-stub))'
              : isSelected
              ? 'hsl(var(--graph-node-selected))'
              : 'hsl(var(--graph-node))';

            const r = ((isSelected ? NODE_R_SELECTED : isHovered ? NODE_R + 2 : NODE_R)) / zoom;
            const labelSize = 11 / zoom;
            const showLabel = showAllLabels || isSelected || isHovered;

            return (
              <g
                key={node.id}
                data-node="true"
                transform={`translate(${node.x},${node.y})`}
                style={{ cursor: 'pointer' }}
                onClick={() => onNavigate(node.id)}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Outer glow ring — selected */}
                {isSelected && (
                  <circle
                    r={r + 8 / zoom}
                    fill={nodeColor}
                    opacity={0.15}
                    className="graph-node-glow"
                  />
                )}
                {/* Hover ring */}
                {isHovered && !isSelected && (
                  <circle
                    r={r + 5 / zoom}
                    fill={nodeColor}
                    opacity={0.12}
                  />
                )}

                {/* Main circle */}
                <circle
                  r={r}
                  fill={nodeColor}
                  fillOpacity={isDeleted ? 0.55 : 1}
                  stroke={isSelected ? nodeColor : 'transparent'}
                  strokeWidth={2 / zoom}
                  filter={isSelected ? 'url(#node-glow)' : undefined}
                  style={{
                    strokeDasharray: isPlaceholder ? `${3 / zoom} ${2 / zoom}` : undefined,
                  }}
                />

                {/* Label */}
                {showLabel && (
                  <>
                    {/* Backdrop rect for readability */}
                    <rect
                      x={-(node.meta.title.length > 20 ? 60 : node.meta.title.length * 3.4) / zoom}
                      y={(r + 5) / zoom}
                      width={(node.meta.title.length > 20 ? 120 : node.meta.title.length * 6.8) / zoom}
                      height={16 / zoom}
                      rx={3 / zoom}
                      fill="hsl(var(--background))"
                      fillOpacity={0.75}
                    />
                    <text
                      y={r + 15 / zoom}
                      textAnchor="middle"
                      fontSize={labelSize}
                      fill="hsl(var(--foreground))"
                      style={{
                        pointerEvents: 'none',
                        fontFamily: 'var(--font-geist-sans, sans-serif)',
                        fontWeight: isSelected ? '600' : '400',
                      }}
                    >
                      {node.meta.title.length > 24
                        ? node.meta.title.slice(0, 22) + '…'
                        : node.meta.title}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

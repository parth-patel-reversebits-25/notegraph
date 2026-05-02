'use client';

import * as React from 'react';
import { Loader2, RefreshCw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { GraphData, GraphNode } from '@/lib/types';

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

    for (const nd of nodes) {
      nd.vx = 0;
      nd.vy = 0;
    }

    // Repulsion (all pairs)
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = nodes[i].x - nodes[j].x;
        let dy = nodes[i].y - nodes[j].y;
        if (dx === 0 && dy === 0) {
          dx = (Math.random() - 0.5) * 0.1;
          dy = (Math.random() - 0.5) * 0.1;
        }
        const d = Math.sqrt(dx * dx + dy * dy);
        const f = (idealDist * idealDist) / d;
        nodes[i].vx += (dx / d) * f;
        nodes[i].vy += (dy / d) * f;
        nodes[j].vx -= (dx / d) * f;
        nodes[j].vy -= (dy / d) * f;
      }
    }

    // Attraction (edges)
    for (const e of data.edges) {
      const si = nodeIndex.get(e.source);
      const ti = nodeIndex.get(e.target);
      if (si === undefined || ti === undefined) continue;
      const dx = nodes[ti].x - nodes[si].x;
      const dy = nodes[ti].y - nodes[si].y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const f = (d * d) / idealDist;
      nodes[si].vx += (dx / d) * f;
      nodes[si].vy += (dy / d) * f;
      nodes[ti].vx -= (dx / d) * f;
      nodes[ti].vy -= (dy / d) * f;
    }

    // Weak center gravity
    for (const nd of nodes) {
      nd.vx += (cx - nd.x) * 0.015;
      nd.vy += (cy - nd.y) * 0.015;
    }

    // Apply with cooling
    for (const nd of nodes) {
      const speed = Math.sqrt(nd.vx * nd.vx + nd.vy * nd.vy) || 0.01;
      const move = Math.min(speed, temp);
      nd.x += (nd.vx / speed) * move;
      nd.y += (nd.vy / speed) * move;
      nd.x = Math.max(28, Math.min(w - 28, nd.x));
      nd.y = Math.max(28, Math.min(h - 28, nd.y));
    }
  }

  return nodes.map((nd) => ({ id: nd.id, x: nd.x, y: nd.y, meta: nd.meta }));
}

const NODE_R = 7;
const NODE_R_SELECTED = 10;

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

  // Measure container on resize
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

  React.useEffect(() => {
    loadGraph();
  }, []);

  // Recompute layout when data or size changes
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

  function resetView() {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }

  const posMap = React.useMemo(
    () => new Map(layoutNodes.map((n) => [n.id, { x: n.x, y: n.y }])),
    [layoutNodes]
  );

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center flex-col gap-3">
        <p className="text-sm text-destructive">{error}</p>
        <Button size="sm" variant="outline" onClick={loadGraph}>
          Retry
        </Button>
      </div>
    );
  }

  const edges = graphData?.edges ?? [];

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden bg-background">
      {/* Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
        <Button size="icon" variant="outline" className="h-7 w-7" title="Zoom in" onClick={() => zoomBy(1.3)}>
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="outline" className="h-7 w-7" title="Zoom out" onClick={() => zoomBy(0.77)}>
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="outline" className="h-7 w-7" title="Reset view" onClick={resetView}>
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="outline" className="h-7 w-7" title="Reload graph" onClick={loadGraph}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Stats */}
      <div className="absolute bottom-3 left-3 z-10 text-xs text-muted-foreground select-none">
        {layoutNodes.length} notes · {edges.length} links
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1 text-xs text-muted-foreground select-none">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
          note
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-muted-foreground" />
          stub
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-destructive opacity-60" />
          deleted
        </div>
      </div>

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
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke={edge.is_broken ? '#ef4444' : isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
                strokeWidth={(edge.is_broken ? 1.5 : isHighlighted ? 1.5 : 1) / zoom}
                strokeDasharray={edge.is_broken ? `${4 / zoom} ${3 / zoom}` : undefined}
                strokeOpacity={isHighlighted ? 0.9 : 0.45}
              />
            );
          })}

          {/* Nodes */}
          {layoutNodes.map((node) => {
            const isSelected = node.id === selectedId;
            const isHovered = node.id === hovered;
            const { is_placeholder: isPlaceholder, is_deleted: isDeleted } = node.meta;

            let fillColor = 'hsl(var(--primary))';
            if (isPlaceholder) fillColor = 'hsl(var(--muted-foreground))';
            if (isDeleted) fillColor = '#ef4444';

            const r = (isSelected ? NODE_R_SELECTED : NODE_R) / zoom;
            const labelSize = 11 / zoom;

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
                {/* Selection glow ring */}
                {isSelected && (
                  <circle r={r + 6 / zoom} fill="hsl(var(--primary))" opacity={0.18} />
                )}
                {/* Hover ring */}
                {isHovered && !isSelected && (
                  <circle r={r + 4 / zoom} fill="hsl(var(--primary))" opacity={0.1} />
                )}
                {/* Main circle */}
                <circle
                  r={r}
                  fill={fillColor}
                  fillOpacity={isDeleted ? 0.5 : 1}
                  stroke={
                    isSelected
                      ? 'hsl(var(--primary))'
                      : isPlaceholder
                      ? 'hsl(var(--muted-foreground))'
                      : 'transparent'
                  }
                  strokeWidth={isPlaceholder ? 1.5 / zoom : 2 / zoom}
                  strokeDasharray={isPlaceholder ? `${3 / zoom} ${2 / zoom}` : undefined}
                />
                {/* Label */}
                {(isSelected || isHovered) && (
                  <text
                    y={r + 14 / zoom}
                    textAnchor="middle"
                    fontSize={labelSize}
                    fill="hsl(var(--foreground))"
                    style={{ pointerEvents: 'none', fontFamily: 'var(--font-geist-sans, sans-serif)' }}
                  >
                    {node.meta.title.length > 28
                      ? node.meta.title.slice(0, 26) + '…'
                      : node.meta.title}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

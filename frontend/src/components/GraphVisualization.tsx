import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { Fragrance, GraphData } from '../types';
import { CONFIG } from '../config';

interface GraphVisualizationProps {
  data: GraphData;
  selectedNode: Fragrance | null;
  onNodeSelect: (node: Fragrance | null) => void;
  darkMode: boolean;
  refreshKey?: number;
  highlightedIds?: Set<string>;
  isSpotlightMode?: boolean;
}

const getClusterColor = (cluster: string): string => {
  return CONFIG.style.clusterColors[cluster.toLowerCase()] || CONFIG.style.clusterColors['unclassified'];
};

const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  data,
  selectedNode,
  onNodeSelect,
  darkMode,
  refreshKey,
  highlightedIds,
  isSpotlightMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const hoveredNodeRef = useRef<Fragrance | null>(null);
  const mousePosRef = useRef({ x: -9999, y: -9999 });

  // Initialize with zoomed out state
  const transformRef = useRef(
    d3.zoomIdentity
      .translate(
        (window.innerWidth / 2) * (1 - CONFIG.defaults.initialZoom),
        (window.innerHeight / 2) * (1 - CONFIG.defaults.initialZoom)
      )
      .scale(CONFIG.defaults.initialZoom)
  );
  const zoomRef = useRef<any>(null);
  
  const [activeHoverNode, setActiveHoverNode] = useState<Fragrance | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null);
  const lastProcessedRefreshKey = useRef<number>(-1);
  
  const connectionInfo = useMemo(() => {
    const counts = new Map<string, number>();
    const adjacency = new Map<string, Set<string>>();
    data.nodes.forEach(n => {
      counts.set(n.id, 0);
      adjacency.set(n.id, new Set());
    });
    data.links.forEach((l: any) => {
      const sId = typeof l.source === 'object' ? l.source.id : l.source;
      const tId = typeof l.target === 'object' ? l.target.id : l.target;
      counts.set(sId, (counts.get(sId) || 0) + 1);
      counts.set(tId, (counts.get(tId) || 0) + 1);
      if (adjacency.has(sId)) adjacency.get(sId)!.add(tId);
      if (adjacency.has(tId)) adjacency.get(tId)!.add(sId);
    });
    return { counts, adjacency };
  }, [data]);

  const calculateNodeSize = useCallback((node: Fragrance) => {
    const count = connectionInfo.counts.get(node.id) || 0;
    const { baseSize, connectivityMultiplier, ratingMultiplier } = CONFIG.node;
    return baseSize + Math.sqrt(count) * connectivityMultiplier + (node.rating / 5) * ratingMultiplier;
  }, [connectionInfo.counts]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false })!;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const { physics, interaction } = CONFIG;

    // If refreshKey changed, we want to re-randomize positions
    if (refreshKey !== undefined && refreshKey > lastProcessedRefreshKey.current) {
      data.nodes.forEach((n: any) => {
        // Start nodes in a small random cluster near the center for a nice expansion effect
        n.x = width / 2 + (Math.random() - 0.5) * 100;
        n.y = height / 2 + (Math.random() - 0.5) * 100;
        n.vx = 0;
        n.vy = 0;
      });
      lastProcessedRefreshKey.current = refreshKey;
    }

    // Simulation setup
    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links)
        .id((d: any) => d.id)
        .distance((d: any) => isSpotlightMode ? 200 : (physics.linkDistanceBase - d.weight * physics.linkDistanceWeight))
        .strength(isSpotlightMode ? 1 : physics.linkStrength)
      )
      .force('charge', d3.forceManyBody().strength(isSpotlightMode ? -2000 : physics.chargeStrength).distanceMax(physics.chargeMaxDistance))
      .force('center', d3.forceCenter(width / 2, height / 2).strength(isSpotlightMode ? 1 : physics.centerStrength))
      .force('collide', d3.forceCollide().radius(d => calculateNodeSize(d as any) + (isSpotlightMode ? 20 : physics.collisionRadiusPlus)))
      .velocityDecay(isSpotlightMode ? 0.2 : physics.velocityDecay);

    simulationRef.current = simulation;

    const render = () => {
      ctx.save();
      const theme = darkMode ? CONFIG.style.dark : CONFIG.style.light;
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, width, height);

      ctx.translate(transformRef.current.x, transformRef.current.y);
      ctx.scale(transformRef.current.k, transformRef.current.k);

      const hoveredNode = hoveredNodeRef.current;
      const k = transformRef.current.k;
      const mX = mousePosRef.current.x;
      const mY = mousePosRef.current.y;

      // Draw links
      data.links.forEach((link: any) => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        
        const isHighlighted = highlightedIds && highlightedIds.size > 0 && 
                             highlightedIds.has(sourceId) && highlightedIds.has(targetId);
        
        const isRelatedToHover = hoveredNode && (
          sourceId === hoveredNode.id || targetId === hoveredNode.id
        );

        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y);
        ctx.lineTo(link.target.x, link.target.y);
        
        if (isRelatedToHover) {
          ctx.strokeStyle = theme.linkHover;
          ctx.globalAlpha = 0.8;
          ctx.lineWidth = 2 / k;
        } else if (highlightedIds && highlightedIds.size > 0) {
          ctx.strokeStyle = theme.linkDefault;
          ctx.globalAlpha = isHighlighted ? 0.4 : 0.03;
          ctx.lineWidth = (isHighlighted ? 1.5 : 0.5) / k;
        } else {
          ctx.strokeStyle = theme.linkDefault;
          ctx.globalAlpha = 0.3;
          ctx.lineWidth = 1 / k;
        }
        ctx.stroke();
      });

      // Draw nodes
      data.nodes.forEach((node: any) => {
        let size = calculateNodeSize(node);
        const isHovered = hoveredNode?.id === node.id;
        const isSelected = selectedNode?.id === node.id;
        const isConnected = hoveredNode && connectionInfo.adjacency.get(hoveredNode.id)?.has(node.id);
        const isHighlighted = !highlightedIds || highlightedIds.size === 0 || highlightedIds.has(node.id);
        
        const dx = node.x - mX;
        const dy = node.y - mY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < interaction.magnificationRadius) {
          const mag = 1 + (interaction.magnificationStrength * (1 - dist / interaction.magnificationRadius));
          size *= mag;
        }

        let alpha = 1;
        if (hoveredNode) {
          alpha = (isHovered || isConnected) ? 1 : 0.15;
        } else if (highlightedIds && highlightedIds.size > 0) {
          alpha = isHighlighted ? 1 : 0.08;
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
        ctx.fillStyle = getClusterColor(node.cluster);
        ctx.globalAlpha = alpha;
        ctx.fill();
        
        if (isSelected || (isHovered && isHighlighted) || isConnected) {
          ctx.strokeStyle = isSelected ? (darkMode ? '#fff' : '#000') : (darkMode ? '#94a3b8' : '#475569');
          ctx.lineWidth = (isSelected ? 3 : 1.5) / k;
          ctx.globalAlpha = Math.max(alpha, 0.5);
          ctx.stroke();
        }
        
        if (k > interaction.labelZoomThreshold || isSelected || isHovered) {
          if (highlightedIds && highlightedIds.size > 0 && !isHighlighted && !isHovered && !isSelected) {
            // Hide labels for dimmed nodes
          } else {
            ctx.globalAlpha = alpha;
            ctx.font = `600 ${Math.max(11 / k, 9)}px Inter, sans-serif`;
            ctx.fillStyle = theme.text;
            ctx.textAlign = 'center';
            ctx.fillText(node.name.length > 20 ? node.name.substring(0, 17) + '...' : node.name, node.x, node.y + size + 14 / k);
          }
        }
      });
      ctx.restore();
    };

    simulation.on('tick', render);

    const zoom = d3.zoom<HTMLCanvasElement, unknown>()
      .scaleExtent(interaction.zoomExtent)
      .on('zoom', (event) => {
        transformRef.current = event.transform;
        render();
      });

    zoomRef.current = zoom;
    d3.select(canvas)
      .call(zoom as any)
      .call(zoom.transform as any, transformRef.current);

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left - transformRef.current.x) / transformRef.current.k;
      const y = (event.clientY - rect.top - transformRef.current.y) / transformRef.current.k;
      mousePosRef.current = { x, y };

      let closest: any = null;
      let minDistance = interaction.clickPickRadius / transformRef.current.k;
      data.nodes.forEach((node: any) => {
        const dx = node.x - x;
        const dy = node.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance) {
          minDistance = distance;
          closest = node;
        }
      });

      if (closest !== hoveredNodeRef.current) {
        hoveredNodeRef.current = closest;
        setActiveHoverNode(closest);
      }
      setTooltipPos({ x: event.clientX, y: event.clientY });
      render();
    };

    const handleClick = () => {
      onNodeSelect(hoveredNodeRef.current);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    render();

    return () => {
      simulation.stop();
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [data, selectedNode, darkMode, onNodeSelect, calculateNodeSize, connectionInfo.adjacency, refreshKey]);

  const handleZoom = (factor: number) => {
    if (zoomRef.current && canvasRef.current) {
      d3.select(canvasRef.current)
        .transition()
        .duration(400)
        .call(zoomRef.current.scaleBy, factor);
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full relative cursor-crosshair overflow-hidden select-none bg-white dark:bg-slate-950">
      <canvas ref={canvasRef} className="block w-full h-full" />
      
      {/* Zoom Controls */}
      <div className="absolute top-8 left-8 flex flex-col gap-3 z-30">
        <button 
          onClick={() => handleZoom(1.5)}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-xl hover:scale-110 active:scale-95 transition-all text-xl font-bold text-slate-800 dark:text-white"
          title="Zoom In"
        >
          +
        </button>
        <button 
          onClick={() => handleZoom(0.6)}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-xl hover:scale-110 active:scale-95 transition-all text-xl font-bold text-slate-800 dark:text-white"
          title="Zoom Out"
        >
          −
        </button>
      </div>

      {activeHoverNode && (
        <div 
          className="fixed p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-200"
          style={{ 
            left: tooltipPos.x + 20, 
            top: tooltipPos.y + 20,
          }}
        >
          <div className="flex items-start gap-4">
            <div className="w-4 h-4 rounded-full mt-1.5 shadow-sm" style={{ backgroundColor: getClusterColor(activeHoverNode.cluster) }} />
            <div>
              <div className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight leading-none mb-1">{activeHoverNode.name}</div>
              <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">{activeHoverNode.brand}</div>
              <div className="flex items-center gap-3">
                <div className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 text-[10px] font-bold flex items-center gap-1">
                  <span>★</span> {activeHoverNode.rating.toFixed(1)}
                </div>
                <div className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                  {activeHoverNode.cluster.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-10 right-10 p-6 glass rounded-[2.5rem] shadow-2xl max-w-xs max-h-[50vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-right-10 duration-700">
        <div className="flex items-center gap-3 mb-5">
           <div className="w-1.5 h-5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
           <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Universe Hubs</h3>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {Object.entries(data.metadata.clusters).sort((a: any, b: any) => b[1].count - a[1].count).slice(0, 15).map(([cluster, info]: [string, any]) => (
            <div key={cluster} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full shadow-inner transform group-hover:scale-125 transition-transform duration-300" style={{ backgroundColor: getClusterColor(cluster) }} />
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 capitalize tracking-wide">{cluster}</span>
              </div>
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 font-mono tracking-tighter">
                {((info.count / data.nodes.length) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GraphVisualization;

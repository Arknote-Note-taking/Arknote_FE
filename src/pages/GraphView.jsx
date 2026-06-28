import React, { useState, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import API from '../services/api';
import { Network, Loader2 } from 'lucide-react';

const getTagColor = (subject) => {
  const s = subject?.toLowerCase?.() || '';
  if (s.includes('nhân sự')) return 'bg-[#E0F2FE] text-[#0284C7] dark:bg-[#0284C7]/15 dark:text-[#38BDF8]';
  if (s.includes('hành chính')) return 'bg-[#FAE8FF] text-[#C026D3] dark:bg-[#C026D3]/15 dark:text-[#E879F9]';
  if (s.includes('pháp luật')) return 'bg-[#FEF3C7] text-[#D97706] dark:bg-[#D97706]/15 dark:text-[#FBB024]';
  if (s.includes('học tập')) return 'bg-[#DCFCE7] text-[#16A34A] dark:bg-[#16A34A]/15 dark:text-[#4ADE80]';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300';
};
const getSubjectColorStr = (subject) => {
  const s = subject?.toLowerCase?.() || '';
  if (s.includes('nhân sự')) return '#3B82F6';
  if (s.includes('hành chính')) return '#A855F7';
  if (s.includes('pháp luật')) return '#F59E0B';
  if (s.includes('học tập')) return '#22C55E';
  return '#9CA3AF';
};

// Custom collision force to bypass Vite import / resolution issues
const customCollideForce = (radius) => {
  let nodes = [];
  const force = (alpha) => {
    for (let i = 0; i < nodes.length; i++) {
      const nodeA = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeB = nodes[j];
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = radius * 2;
        if (dist < minDist) {
          const overlap = minDist - dist;
          // Calculate push direction and scale
          const forceX = (dx / (dist || 1)) * overlap * 0.5;
          const forceY = (dy / (dist || 1)) * overlap * 0.5;
          // Apply velocity adjustments scaled by alpha
          nodeB.vx += forceX * alpha;
          nodeB.vy += forceY * alpha;
          nodeA.vx -= forceX * alpha;
          nodeA.vy -= forceY * alpha;
        }
      }
    }
  };
  force.initialize = (_) => {
    nodes = _;
  };
  return force;
};

// Polyfill roundRect for canvas if needed
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

const GraphView = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [nodeDetails, setNodeDetails] = useState(null);
  const [loadingGraph, setLoadingGraph] = useState(true);

  const containerRef = useRef(null);
  const fgRef = useRef();

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const res = await API.get('/documents/graph');
        const formattedData = {
          nodes: res.data.nodes,
          links: res.data.edges.map(e => ({ source: e.source, target: e.target, value: e.weight }))
        };
        setGraphData(formattedData);
      } catch (err) {
        console.error("Graph fetch failed", err);
      } finally {
        setLoadingGraph(false);
      }
    };
    fetchGraph();
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    // small delay to let DOM settle flex bounds
    setTimeout(updateDimensions, 100);
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [loadingGraph]);

  // Config forces and Center Graph on load
  useEffect(() => {
    if (!loadingGraph && graphData.nodes.length > 0 && fgRef.current) {
      // Balanced repulsion between nodes
      fgRef.current.d3Force('charge').strength(-60);
      // Balanced link distance between connected nodes
      fgRef.current.d3Force('link').distance(40);
      // Add custom collision force to prevent rectangular node boundaries from overlapping
      fgRef.current.d3Force('collide', customCollideForce(22));
      
      setTimeout(() => {
        fgRef.current?.zoomToFit(500, 50);
      }, 500);
    }
  }, [loadingGraph, graphData]);

  const handleNodeClick = async (node) => {
    setSelectedNodeId(node.id);
    setFetchingDetails(true);
    try {
      const res = await API.get(`/documents/${node.id}`);

      const relatedEdgeTargets = graphData.links.filter(l => (l.source.id || l.source) === node.id).map(l => l.target.id || l.target);
      const relatedEdgeSources = graphData.links.filter(l => (l.target.id || l.target) === node.id).map(l => l.source.id || l.source);
      const allRelatedIds = [...new Set([...relatedEdgeTargets, ...relatedEdgeSources])];
      const linkedDocs = graphData.nodes.filter(n => allRelatedIds.includes(n.id) && n.id !== node.id);

      setNodeDetails({ ...res.data, linkedDocs });
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingDetails(false);
    }
  };

  const renderNode = (node, ctx, globalScale) => {
    const isSelected = node.id === selectedNodeId;
    const label = node.title;

    // Abstract base scale relative drawing
    const fontSize = 4;
    ctx.font = `600 ${fontSize}px Inter, sans-serif`;

    const textWidth = ctx.measureText(label).width;
    const w = Math.max(textWidth + 8, 24);
    const h = 14;

    const x = node.x - w / 2;
    const y = node.y - h / 2;

    // Background shadow simulation
    if (isSelected) {
      ctx.shadowColor = 'rgba(50, 205, 50, 0.2)';
      ctx.shadowBlur = 10;
    } else {
      ctx.shadowBlur = 0;
    }

    // Box
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 2);
    ctx.fill();
    ctx.shadowBlur = 0; // reset

    // Border
    ctx.strokeStyle = isSelected ? '#10B981' : '#E5E7EB';
    ctx.lineWidth = isSelected ? 1 : 0.2;
    ctx.stroke();

    // Dot
    ctx.fillStyle = getSubjectColorStr(node.subject);
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 4, 1.2, 0, 2 * Math.PI, false);
    ctx.fill();

    // Text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#111827';
    ctx.fillText(label, node.x, y + 9);
  };

  return (
    <div className="max-w-[1600px] w-full mx-auto h-full flex flex-col">

      <div className="flex h-[calc(100vh-180px)] gap-6">

        {/* Left Column: Graph View */}
        <div
          className="flex-1 bg-surface border border-border rounded-xl relative overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
          ref={containerRef}
        >
          {loadingGraph ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
            </div>
          ) : graphData.nodes.length > 0 ? (
            <ForceGraph2D
              ref={fgRef}
              width={dimensions.width}
              height={dimensions.height}
              graphData={graphData}
              nodeCanvasObject={renderNode}
              nodePointerAreaPaint={(node, color, ctx) => {
                // Ensure pointer hits the box area properly
                ctx.fillStyle = color;
                const w = 40; const h = 14;
                ctx.fillRect(node.x - w / 2, node.y - h / 2, w, h);
              }}
              onNodeClick={handleNodeClick}
              onNodeDragStart={(node) => {
                // Pin all other nodes in place so they remain stationary
                graphData.nodes.forEach(n => {
                  if (n.id !== node.id) {
                    n.fx = n.x;
                    n.fy = n.y;
                  }
                });
              }}
              onNodeDragEnd={(node) => {
                // Keep the dragged node pinned at its dropped position
                node.fx = node.x;
                node.fy = node.y;
                // Release all other nodes to allow D3 simulation to settle
                graphData.nodes.forEach(n => {
                  if (n.id !== node.id) {
                    n.fx = null;
                    n.fy = null;
                  }
                });
              }}
              linkColor={(link) => {
                const isDark = document.documentElement.classList.contains('dark');
                const isHighlighted = (link.source.id || link.source) === selectedNodeId || (link.target.id || link.target) === selectedNodeId;
                if (isHighlighted) {
                  return isDark ? '#34D399' : '#10B981';
                }
                return isDark ? '#374151' : '#E5E7EB';
              }}
              linkWidth={(link) => {
                const isHighlighted = (link.source.id || link.source) === selectedNodeId || (link.target.id || link.target) === selectedNodeId;
                return isHighlighted ? 2.0 : 0.8;
              }}
              backgroundColor="transparent"
              warmupTicks={50}
              cooldownTicks={100}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-text-secondary">
              <div className="flex flex-col items-center">
                <Network className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Chưa có kết nối nào trong dữ liệu.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Details & Legend */}
        <div className="w-80 flex flex-col space-y-4 shrink-0 overflow-y-auto custom-scrollbar">

          {selectedNodeId ? (
            <div className="bg-surface border border-border rounded-xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-opacity">
              {fetchingDetails ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-text-secondary" /></div>
              ) : nodeDetails ? (
                <div>
                  <h3 className="font-bold text-text-primary text-sm mb-3 leading-snug">{nodeDetails.title}</h3>
                  <div className="mb-4">
                    <span className={`inline-block px-2.5 py-1 rounded-sm text-[10px] font-semibold ${getTagColor(nodeDetails.subject)}`}>
                      {nodeDetails.subject}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mb-5 leading-relaxed bg-background/50 p-2 rounded border border-border/50">
                    {nodeDetails.summary || "Đang xử lý tóm tắt..."}
                  </p>

                  <div>
                    <p className="text-[10px] font-semibold text-text-secondary mb-2 whitespace-nowrap">Liên kết đến:</p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {nodeDetails.linkedDocs?.map(ld => (
                        <div
                          key={ld.id}
                          className="bg-background border border-border px-3 py-2 rounded text-[11px] text-text-primary hover:border-primary/50 cursor-pointer transition-colors line-clamp-2"
                          onClick={() => handleNodeClick(ld)}
                        >
                          {ld.title}
                        </div>
                      ))}
                      {(!nodeDetails.linkedDocs || nodeDetails.linkedDocs.length === 0) && (
                        <p className="text-[11px] text-text-secondary italic">Không có liên kết đồng cấp.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-center">
              <p className="text-[11px] font-medium text-text-secondary text-center">Nhấn vào một node để xem chi tiết liên kết</p>
            </div>
          )}

          <div className="bg-surface border border-border rounded-xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <h3 className="text-[11px] font-bold text-text-primary mb-3">Chú thích</h3>
            <div className="space-y-2.5">
              {['Nhân sự', 'Hành chính', 'Pháp luật', 'Học tập'].map(subj => (
                <div key={subj} className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getSubjectColorStr(subj) }}></div>
                  <span className="text-xs text-text-primary font-medium">{subj}</span>
                </div>
              ))}
              <div className="flex items-center space-x-3 pt-1">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-400"></div>
                <span className="text-xs text-text-primary font-medium">Khác</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default GraphView;

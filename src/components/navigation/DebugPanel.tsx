import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Play, 
  Pause, 
  RotateCcw
} from 'lucide-react';
import { cn } from '@core/utils';
import type { NavigationNode } from '@core/spatial/types';

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
  graphData: {
    nodes: NavigationNode[];
    edges: Array<{ from: string; to: string; weight: number }>;
  };
  algorithmSteps?: AlgorithmStep[];
  performanceStats?: PerformanceStats;
  heatmapData?: HeatmapCell[];
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onReset?: () => void;
  currentStep?: number;
  onStepChange?: (step: number) => void;
}

interface AlgorithmStep {
  iteration: number;
  currentNode: string;
  openSet: string[];
  closedSet: string[];
  gScores: Map<string, number>;
  fScores: Map<string, number>;
}

interface HeatmapCell {
  x: number;
  y: number;
  weight: number;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  isOpen,
  onClose,
  graphData,
  algorithmSteps = [],
  performanceStats,
  heatmapData = [],
  isPlaying = false,
  onPlayPause,
  onReset,
  currentStep = 0,
  onStepChange
}) => {
  const [activeTab, setActiveTab] = useState<'graph' | 'algorithm' | 'performance' | 'heatmap'>('graph');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const nodePositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    graphData.nodes.forEach(node => {
      positions.set(node.id, { x: node.position.x, y: node.position.y });
    });
    return positions;
  }, [graphData.nodes]);

  const currentStepData = algorithmSteps[currentStep];

  const renderGraphVisualization = () => (
    <div className="relative w-full h-64 bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {graphData.edges.map((edge, index) => {
          const from = nodePositions.get(edge.from);
          const to = nodePositions.get(edge.to);
          if (!from || !to) return null;

          const isInPath = currentStepData && (
            currentStepData.openSet.includes(edge.from) || 
            currentStepData.openSet.includes(edge.to) ||
            currentStepData.closedSet.includes(edge.from) ||
            currentStepData.closedSet.includes(edge.to)
          );

          return (
            <line
              key={`edge-${index}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={isInPath ? '#6366f1' : '#334155'}
              strokeWidth={isInPath ? 0.4 : 0.2}
              opacity={isInPath ? 1 : 0.4}
            />
          );
        })}

        {graphData.nodes.map(node => {
          const pos = nodePositions.get(node.id);
          if (!pos) return null;

          let fill = '#64748b';
          let radius = 1.2;

          if (currentStepData) {
            if (currentStepData.currentNode === node.id) {
              fill = '#f59e0b';
              radius = 2;
            } else if (currentStepData.openSet.includes(node.id)) {
              fill = '#10b981';
            } else if (currentStepData.closedSet.includes(node.id)) {
              fill = '#6366f1';
            }
          }

          return (
            <g key={`node-${node.id}`}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={radius}
                fill={fill}
              />
              {currentStepData && currentStepData.currentNode === node.id && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={3}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={0.3}
                  opacity={0.5}
                >
                  <animate
                    attributeName="r"
                    values="3;4;3"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </g>
          );
        })}
      </svg>

      {algorithmSteps.length > 0 && (
        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 bg-slate-900/90 p-2 rounded-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPlayPause}
            className="h-8 w-8 p-0"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 w-8 p-0"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <input
            type="range"
            min={0}
            max={algorithmSteps.length - 1}
            value={currentStep}
            onChange={(e) => onStepChange?.(parseInt(e.target.value))}
            className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-slate-400 w-16 text-right">
            {currentStep + 1} / {algorithmSteps.length}
          </span>
        </div>
      )}
    </div>
  );

  const renderAlgorithmInfo = () => {
    if (!currentStepData) return (
      <div className="text-slate-500 text-center py-8">
        No algorithm data available
      </div>
    );

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Iteration</div>
            <div className="text-lg font-mono text-white">{currentStepData.iteration}</div>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Current Node</div>
            <div className="text-lg font-mono text-amber-400">{currentStepData.currentNode}</div>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Open Set</div>
            <div className="text-sm font-mono text-emerald-400">{currentStepData.openSet.length} nodes</div>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Closed Set</div>
            <div className="text-sm font-mono text-indigo-400">{currentStepData.closedSet.length} nodes</div>
          </div>
        </div>

        {currentStepData.gScores.size > 0 && (
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-500 mb-2">G-Scores</div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {Array.from(currentStepData.gScores.entries()).slice(0, 8).map(([node, score]) => (
                <div key={node} className="flex justify-between">
                  <span className="text-slate-400">{node}:</span>
                  <span className="font-mono text-white">{score.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPerformanceStats = () => {
    if (!performanceStats) return (
      <div className="text-slate-500 text-center py-8">
        No performance data available
      </div>
    );

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Cache Size</div>
            <div className="text-lg font-mono text-white">{performanceStats.cacheStats.size}</div>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Cache Hit Rate</div>
            <div className="text-lg font-mono text-emerald-400">
              {(performanceStats.cacheStats.hitRate * 100).toFixed(1)}%
            </div>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Nodes</div>
            <div className="text-lg font-mono text-white">{performanceStats.graphSize.nodes}</div>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Edges</div>
            <div className="text-lg font-mono text-white">{performanceStats.graphSize.edges}</div>
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <div className="text-xs text-slate-500 mb-3">Algorithm Timings</div>
          {Array.from(performanceStats.algorithmTimings.entries()).map(([algo, stats]) => (
            <div key={algo} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
              <span className="text-sm text-slate-300 uppercase">{algo}</span>
              <div className="flex gap-4 text-xs">
                <span className="text-slate-500">Avg: <span className="text-white font-mono">{stats.avg.toFixed(1)}ms</span></span>
                <span className="text-slate-500">Min: <span className="text-emerald-400 font-mono">{stats.min.toFixed(1)}ms</span></span>
                <span className="text-slate-500">Max: <span className="text-rose-400 font-mono">{stats.max.toFixed(1)}ms</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHeatmap = () => (
    <div className="relative w-full h-64 bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {heatmapData.map((cell, index) => (
          <rect
            key={`heat-${index}`}
            x={cell.x - 2}
            y={cell.y - 2}
            width="4"
            height="4"
            fill={`rgba(99, 102, 241, ${cell.weight})`}
            opacity={0.7}
          />
        ))}
      </svg>
      <div className="absolute bottom-2 left-2 bg-slate-900/90 px-2 py-1 rounded text-xs text-slate-400">
        Node exploration heatmap
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 bottom-0 w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 overflow-y-auto"
        >
          <div className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-slate-800 p-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-white">Debug Panel</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            <div className="flex gap-1 mt-4">
              {(['graph', 'algorithm', 'performance', 'heatmap'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize',
                    activeTab === tab
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 space-y-4">
            {activeTab === 'graph' && (
              <>
                {renderGraphVisualization()}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="text-slate-400">Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-slate-400">Open</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-400" />
                    <span className="text-slate-400">Closed</span>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'algorithm' && renderAlgorithmInfo()}
            {activeTab === 'performance' && renderPerformanceStats()}
            {activeTab === 'heatmap' && renderHeatmap()}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

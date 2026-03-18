import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Route,
  Navigation,
  Map as MapIcon,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Download,
  Zap,
  Compass,
  Accessibility,
  Users,
  Gem,
  BarChart3,
  Clock,
  Footprints,
  Target,
  Layers,
  ChevronRight,
  Calculator
} from 'lucide-react';

import type { Vector2 } from '@core/spatial/types';
import { useSmartRoute, useShoppingMode } from '@hooks/navigation';
import { Button } from '@components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/Card';
import { cn } from '@core/utils';
import { useUIActions } from '@store';

import { AnimatedPath } from '@components/navigation/AnimatedPath';
import { DirectionIndicator } from '@components/navigation/DirectionIndicator';
import { AIThinkingAnimation } from '@components/navigation/AIThinkingAnimation';

import type { ShoppingMode, TSPNode } from '@navigation/path-engine';

interface ZonePosition {
  id: string;
  name: string;
  position: Vector2;
  color: string;
}

const zonePositions: ZonePosition[] = [
  { id: 'entrance', name: 'Entrance', position: { x: 50, y: 75 }, color: '#14b8a6' },
  { id: 'electronics', name: 'Electronics', position: { x: 18, y: 14 }, color: '#6366f1' },
  { id: 'grocery', name: 'Grocery', position: { x: 52, y: 23 }, color: '#10b981' },
  { id: 'clothing', name: 'Clothing', position: { x: 82, y: 24 }, color: '#f59e0b' },
  { id: 'home', name: 'Home', position: { x: 15, y: 42 }, color: '#ec4899' },
  { id: 'sports', name: 'Sports', position: { x: 18, y: 68 }, color: '#3b82f6' },
  { id: 'pharmacy', name: 'Pharmacy', position: { x: 80, y: 52 }, color: '#ef4444' },
  { id: 'checkout', name: 'Checkout', position: { x: 45, y: 68 }, color: '#8b5cf6' }
];

const modeConfig: Record<ShoppingMode, { icon: typeof Zap; color: string; label: string }> = {
  'quick-buy': { icon: Zap, color: '#10b981', label: 'Quick Buy' },
  'exploration': { icon: Compass, color: '#f59e0b', label: 'Exploration' },
  'accessibility': { icon: Accessibility, color: '#3b82f6', label: 'Accessibility' },
  'rush-hour': { icon: Users, color: '#ef4444', label: 'Rush Hour' },
  'treasure': { icon: Gem, color: '#8b5cf6', label: 'Treasure' }
};

export function RouteLabPage() {
  const { addToast } = useUIActions();
  const { route, isCalculating, calculationProgress, calculateRoute, clearRoute } = useSmartRoute();
  const { mode, setMode, availableModes } = useShoppingMode();

  const [activeTab, setActiveTab] = useState<'overview' | 'algorithm' | 'simulation'>('overview');
  const [selectedWaypoints, setSelectedWaypoints] = useState<string[]>(['entrance', 'checkout']);
  const [showPath, setShowPath] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);

  useEffect(() => {
    addToast({
      type: 'success',
      title: 'Route Lab Initialized',
      message: 'Smart Path Optimization Engine ready'
    });
  }, [addToast]);

  const selectedNodes = useMemo(() => {
    return zonePositions.filter(z => selectedWaypoints.includes(z.id));
  }, [selectedWaypoints]);

  const handleCalculateRoute = useCallback(async () => {
    if (selectedWaypoints.length < 2) {
      addToast({
        type: 'error',
        title: 'Route Error',
        message: 'Select at least 2 waypoints'
      });
      return;
    }

    const stops: TSPNode[] = selectedNodes.map((node, index) => ({
      id: node.id,
      nodeId: node.id,
      position: node.position,
      zoneId: node.id,
      priority: index === 0 ? -1 : index === selectedNodes.length - 1 ? -2 : index
    }));

    await calculateRoute(stops);
    setShowPath(true);

    addToast({
      type: 'success',
      title: 'Route Calculated',
      message: `Optimized ${selectedWaypoints.length}-stop route computed`
    });
  }, [selectedWaypoints, selectedNodes, calculateRoute, addToast]);

  const toggleWaypoint = useCallback((zoneId: string) => {
    setSelectedWaypoints(prev => {
      if (prev.includes(zoneId)) {
        return prev.filter(id => id !== zoneId);
      }
      if (prev.length >= 6) {
        addToast({
          type: 'warning',
          title: 'Limit Reached',
          message: 'Maximum 6 waypoints allowed'
        });
        return prev;
      }
      return [...prev, zoneId];
    });
  }, [addToast]);

  const pathSegments = useMemo(() => {
    if (!route || !showPath) return [];
    return route.segments.map(seg => ({
      from: seg.from.position,
      to: seg.to.position,
      completed: seg.completed
    }));
  }, [route, showPath]);

  const ModeIcon = modeConfig[mode].icon;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Route className="w-6 h-6 text-white" />
                {isCalculating && (
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-white/50"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Route Optimization Lab
                </h1>
                <p className="text-sm text-slate-500">
                  Spatial Intelligence & Path Analysis
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800">
                <ModeIcon className="w-4 h-4" style={{ color: modeConfig[mode].color }} />
                <span className="text-sm text-slate-400 capitalize">{modeConfig[mode].label}</span>
              </div>

              <div className="flex items-center gap-2">
                {!isCalculating ? (
                  <Button 
                    onClick={handleCalculateRoute} 
                    className="bg-indigo-600 hover:bg-indigo-700"
                    disabled={selectedWaypoints.length < 2}
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate Route
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={() => {}}>
                    <Pause className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                )}
                <Button variant="outline" size="icon" onClick={clearRoute}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 mt-4">
            {(['overview', 'algorithm', 'simulation'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-all capitalize',
                  activeTab === tab
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-3 space-y-6">
                  <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2 text-slate-300">
                        <Settings className="w-4 h-4 text-indigo-400" />
                        Shopping Mode
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {availableModes.map((m) => {
                          const config = modeConfig[m];
                          const Icon = config.icon;
                          return (
                            <button
                              key={m}
                              onClick={() => setMode(m)}
                              className={cn(
                                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-left',
                                mode === m
                                  ? 'bg-slate-800 border border-slate-700 text-white'
                                  : 'text-slate-400 hover:bg-slate-950 hover:text-slate-300'
                              )}
                            >
                              <Icon className="w-4 h-4" style={{ color: config.color }} />
                              <span className="capitalize">{config.label}</span>
                              {mode === m && (
                                <motion.div
                                  layoutId="mode-indicator"
                                  className="ml-auto w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: config.color }}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2 text-slate-300">
                        <MapIcon className="w-4 h-4 text-green-400" />
                        Waypoints ({selectedWaypoints.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        {zonePositions.map((zone) => {
                          const isSelected = selectedWaypoints.includes(zone.id);
                          return (
                            <button
                              key={zone.id}
                              onClick={() => toggleWaypoint(zone.id)}
                              className={cn(
                                'px-3 py-2 rounded-lg text-xs transition-all text-left',
                                isSelected
                                  ? 'bg-slate-800 border border-slate-600 text-white'
                                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:border-slate-700'
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: zone.color }}
                                />
                                <span>{zone.name}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="col-span-12 lg:col-span-6">
                  <Card className="bg-slate-900 border-slate-800 h-full">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2 text-slate-300">
                        <Navigation className="w-4 h-4 text-purple-400" />
                        Route Visualization
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative">
                      <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-lg overflow-hidden">
                        <svg 
                          viewBox="0 0 100 80" 
                          className="w-full h-full"
                          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
                        >
                          <defs>
                            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1e293b" strokeWidth="0.5"/>
                            </pattern>
                          </defs>
                          <rect width="100" height="80" fill="url(#grid)" />

                          {zonePositions.map((zone) => (
                            <g key={zone.id}>
                              <circle
                                cx={zone.position.x}
                                cy={zone.position.y}
                                r="8"
                                fill={zone.color}
                                opacity={selectedWaypoints.includes(zone.id) ? 0.3 : 0.1}
                              />
                              <circle
                                cx={zone.position.x}
                                cy={zone.position.y}
                                r="3"
                                fill={zone.color}
                                stroke="#1e293b"
                                strokeWidth="0.5"
                              />
                              {selectedWaypoints.includes(zone.id) && (
                                <text
                                  x={zone.position.x}
                                  y={zone.position.y - 5}
                                  textAnchor="middle"
                                  fill={zone.color}
                                  fontSize="3"
                                  fontWeight="bold"
                                >
                                  {selectedWaypoints.indexOf(zone.id) + 1}
                                </text>
                              )}
                            </g>
                          ))}

                          {showPath && pathSegments.length > 0 && (
                            <AnimatedPath
                              segments={pathSegments}
                              scale={1}
                              strokeWidth={0.8}
                              color="#6366f1"
                              completedColor="#10b981"
                            />
                          )}
                        </svg>

                        {isCalculating && (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80">
                            <AIThinkingAnimation progress={calculationProgress} />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="col-span-12 lg:col-span-3 space-y-6">
                  <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2 text-slate-300">
                        <BarChart3 className="w-4 h-4 text-pink-400" />
                        Route Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                            <Footprints className="w-3 h-3" />
                            Distance
                          </div>
                          <div className="text-xl font-mono text-white">
                            {route ? `${(route.totalDistance).toFixed(0)}m` : '--'}
                          </div>
                        </div>
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                            <Clock className="w-3 h-3" />
                            Time
                          </div>
                          <div className="text-xl font-mono text-white">
                            {route ? `${Math.round(route.totalTime / 60)}min` : '--'}
                          </div>
                        </div>
                      </div>

                      {route && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Waypoints</span>
                            <span className="text-white">{route.waypoints.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Zones</span>
                            <span className="text-white">{route.zonesVisited.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Algorithm</span>
                            <span className="text-indigo-400 uppercase">{route.algorithm}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Score</span>
                            <span className="text-green-400">{route.score.toFixed(0)}%</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {route && route.waypoints.length > 0 && (
                    <Card className="bg-slate-900 border-slate-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2 text-slate-300">
                          <Layers className="w-4 h-4 text-yellow-400" />
                          Waypoint Order
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {route.waypoints.map((wp, index) => {
                            const zone = zonePositions.find(z => z.id === wp.zoneId);
                            return (
                              <div
                                key={wp.id}
                                className="flex items-center gap-3 p-2 rounded-lg bg-slate-950 border border-slate-800"
                              >
                                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-mono text-slate-400">
                                  {index + 1}
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm text-white capitalize">
                                    {zone?.name || wp.type}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {wp.type === 'start' ? 'Start' : wp.type === 'billing' ? 'End' : 'Item'}
                                  </div>
                                </div>
                                {zone && (
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: zone.color }}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'algorithm' && (
            <motion.div
              key="algorithm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-12 gap-6"
            >
              <div className="col-span-12 lg:col-span-6">
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-slate-300">Algorithm Comparison</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-indigo-400 font-semibold">A* Search</span>
                        <span className="text-xs text-slate-500">Heuristic-based</span>
                      </div>
                      <p className="text-sm text-slate-400 mb-3">
                        Uses Manhattan distance heuristic for faster pathfinding. 
                        Optimal for real-time navigation with consistent estimates.
                      </p>
                      <div className="flex gap-4 text-xs">
                        <span className="text-green-400">Fast</span>
                        <span className="text-green-400">Optimal</span>
                        <span className="text-yellow-400">Heuristic-dependent</span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-purple-400 font-semibold">Dijkstra</span>
                        <span className="text-xs text-slate-500">Uniform cost</span>
                      </div>
                      <p className="text-sm text-slate-400 mb-3">
                        Explores all paths equally. Guaranteed optimal but slower for large graphs.
                        Best for accessibility modes with complex constraints.
                      </p>
                      <div className="flex gap-4 text-xs">
                        <span className="text-yellow-400">Slower</span>
                        <span className="text-green-400">Guaranteed optimal</span>
                        <span className="text-green-400">Constraint-friendly</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="col-span-12 lg:col-span-6">
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-slate-300">TSP Optimization</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                      <div className="text-sm font-semibold text-white mb-2">Nearest Neighbor</div>
                      <p className="text-xs text-slate-400">
                        Greedy approach - always visit closest unvisited node. Fast but suboptimal.
                      </p>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                      <div className="text-sm font-semibold text-white mb-2">2-Opt Improvement</div>
                      <p className="text-xs text-slate-400">
                        Iteratively improves route by swapping edges. Good balance of speed and quality.
                      </p>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                      <div className="text-sm font-semibold text-white mb-2">3-Opt / Zone Grouping</div>
                      <p className="text-xs text-slate-400">
                        Advanced optimization for exploration mode. Groups nearby items together.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === 'simulation' && (
            <motion.div
              key="simulation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <Card className="bg-slate-900 border-slate-800 max-w-md w-full">
                <CardHeader>
                  <CardTitle className="text-slate-300 text-center">Route Simulation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center text-slate-400">
                    Simulate walking through the calculated route with real-time adaptation
                  </div>
                  
                  {route ? (
                    <div className="space-y-4">
                      <DirectionIndicator
                        type="straight"
                        text="Continue to next waypoint"
                        distance={50}
                      />
                      <div className="flex justify-center gap-2">
                        <Button variant="outline" size="sm">
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </Button>
                        <Button size="sm">
                          <Play className="w-4 h-4 mr-1" />
                          Resume
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 py-8">
                      Calculate a route first to start simulation
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

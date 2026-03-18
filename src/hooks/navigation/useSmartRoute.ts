import { useState, useCallback, useRef, useEffect } from 'react';
import type { Vector2, NavigationNode } from '@core/spatial/types';
import { NavigationGraphEngine, RouteOptimizer, ShoppingModeManager } from '@navigation/path-engine';
import type { 
  OptimizedRoute, 
  RouteOptimizationResult, 
  ShoppingMode,
  TSPNode,
  PathAlgorithm
} from '@navigation/path-engine';

interface UseSmartRouteOptions {
  autoCalculate?: boolean;
  defaultMode?: ShoppingMode;
  algorithm?: PathAlgorithm;
}

interface UseSmartRouteReturn {
  route: OptimizedRoute | null;
  isCalculating: boolean;
  calculationProgress: number;
  error: Error | null;
  alternatives: OptimizedRoute[];
  selectedRouteIndex: number;
  
  calculateRoute: (stops: TSPNode[]) => Promise<void>;
  calculateFromPositions: (positions: Vector2[], destination: Vector2) => Promise<void>;
  selectAlternativeRoute: (index: number) => void;
  recalculateRoute: () => Promise<void>;
  clearRoute: () => void;
  
  getRouteMetrics: () => import('@navigation/path-engine').RouteMetrics | null;
  exportRoute: () => string | null;
  importRoute: (data: string) => boolean;
}

export const useSmartRoute = (options: UseSmartRouteOptions = {}): UseSmartRouteReturn => {
  const { 
    autoCalculate = false, 
    defaultMode = 'quick-buy',
    algorithm = 'astar'
  } = options;

  const graphRef = useRef<NavigationGraphEngine | null>(null);
  const optimizerRef = useRef<RouteOptimizer | null>(null);
  const modeManagerRef = useRef<ShoppingModeManager | null>(null);
  const currentStopsRef = useRef<TSPNode[]>([]);

  const [route, setRoute] = useState<OptimizedRoute | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationProgress, setCalculationProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [alternatives, setAlternatives] = useState<OptimizedRoute[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  useEffect(() => {
    graphRef.current = new NavigationGraphEngine();
    modeManagerRef.current = new ShoppingModeManager();
    optimizerRef.current = new RouteOptimizer(graphRef.current);

    return () => {
      graphRef.current?.clear();
    };
  }, []);

  const simulateProgress = useCallback(() => {
    setCalculationProgress(0);
    const interval = setInterval(() => {
      setCalculationProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 100);
    return interval;
  }, []);

  const calculateRoute = useCallback(async (stops: TSPNode[]) => {
    if (!optimizerRef.current || !modeManagerRef.current) return;

    setIsCalculating(true);
    setError(null);
    setCalculationProgress(0);
    currentStopsRef.current = stops;

    const progressInterval = simulateProgress();

    try {
      const mode = modeManagerRef.current.getMode();
      const algo = algorithm || modeManagerRef.current.getAlgorithm();

      const result = optimizerRef.current.optimizeMultiStopRoute(stops, mode, algo);

      clearInterval(progressInterval);
      setCalculationProgress(100);

      setRoute(result.route);
      setAlternatives(result.alternatives);
      setSelectedRouteIndex(0);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err : new Error('Route calculation failed'));
    } finally {
      setTimeout(() => setIsCalculating(false), 300);
    }
  }, [algorithm, simulateProgress]);

  const calculateFromPositions = useCallback(async (positions: Vector2[], destination: Vector2) => {
    if (!graphRef.current) return;

    const stops: TSPNode[] = positions.map((pos, index) => {
      const nearestNode = graphRef.current!.findNearestNode(pos);
      return {
        id: `stop-${index}`,
        nodeId: nearestNode?.id || `node-${index}`,
        position: pos,
        priority: index === 0 ? -1 : 1
      };
    });

    const destNode = graphRef.current.findNearestNode(destination);
    if (destNode) {
      stops.push({
        id: 'destination',
        nodeId: destNode.id,
        position: destination,
        priority: -2
      });
    }

    await calculateRoute(stops);
  }, [calculateRoute]);

  const selectAlternativeRoute = useCallback((index: number) => {
    if (index >= 0 && index < alternatives.length) {
      setSelectedRouteIndex(index);
      setRoute(alternatives[index]);
    }
  }, [alternatives]);

  const recalculateRoute = useCallback(async () => {
    if (currentStopsRef.current.length > 0) {
      await calculateRoute(currentStopsRef.current);
    }
  }, [calculateRoute]);

  const clearRoute = useCallback(() => {
    setRoute(null);
    setAlternatives([]);
    setSelectedRouteIndex(0);
    setCalculationProgress(0);
    setError(null);
    currentStopsRef.current = [];
  }, []);

  const getRouteMetrics = useCallback(() => {
    if (!route || !optimizerRef.current) return null;
    return null;
  }, [route]);

  const exportRoute = useCallback(() => {
    if (!route) return null;
    return JSON.stringify(route);
  }, [route]);

  const importRoute = useCallback((data: string) => {
    try {
      const importedRoute: OptimizedRoute = JSON.parse(data);
      setRoute(importedRoute);
      setAlternatives([]);
      setSelectedRouteIndex(0);
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    route,
    isCalculating,
    calculationProgress,
    error,
    alternatives,
    selectedRouteIndex,
    calculateRoute,
    calculateFromPositions,
    selectAlternativeRoute,
    recalculateRoute,
    clearRoute,
    getRouteMetrics,
    exportRoute,
    importRoute
  };
};

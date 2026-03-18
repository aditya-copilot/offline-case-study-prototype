import { useState, useCallback, useRef, useEffect } from 'react';
import type { Vector2 } from '@core/spatial/types';
import { RouteOptimizer, NavigationGraphEngine, ShoppingModeManager } from '@navigation/path-engine';
import type { 
  TSPNode, 
  OptimizedRoute, 
  ShoppingMode,
  RouteMetrics 
} from '@navigation/path-engine';

interface UseRouteOptimizerOptions {
  enableZoneGrouping?: boolean;
  maxDetourPercent?: number;
}

interface UseRouteOptimizerReturn {
  optimizedRoute: OptimizedRoute | null;
  isOptimizing: boolean;
  zoneGroups: Map<string, TSPNode[]>;
  routeAlternatives: OptimizedRoute[];
  selectedAlternative: number;
  
  optimizeFromList: (
    itemPositions: Array<{ id: string; position: Vector2; zoneId?: string; priority?: number }>,
    startPosition: Vector2,
    endPosition: Vector2
  ) => Promise<void>;
  
  optimizeFromZones: (
    zones: string[],
    startPosition: Vector2,
    endPosition: Vector2
  ) => Promise<void>;
  
  groupItemsByZone: (
    items: Array<{ id: string; position: Vector2; zoneId?: string }>
  ) => Map<string, Array<{ id: string; position: Vector2; zoneId?: string }>>;
  
  selectAlternative: (index: number) => void;
  getOptimizationMetrics: () => RouteMetrics | null;
  reorderWaypoints: (newOrder: string[]) => void;
}

export const useRouteOptimizer = (
  options: UseRouteOptimizerOptions = {}
): UseRouteOptimizerReturn => {
  const { enableZoneGrouping = true, maxDetourPercent = 20 } = options;

  const graphRef = useRef<NavigationGraphEngine | null>(null);
  const optimizerRef = useRef<RouteOptimizer | null>(null);
  const modeManagerRef = useRef<ShoppingModeManager | null>(null);

  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [zoneGroups, setZoneGroups] = useState<Map<string, TSPNode[]>>(new Map());
  const [routeAlternatives, setRouteAlternatives] = useState<OptimizedRoute[]>([]);
  const [selectedAlternative, setSelectedAlternative] = useState(0);
  const [currentMetrics, setCurrentMetrics] = useState<RouteMetrics | null>(null);

  useEffect(() => {
    graphRef.current = new NavigationGraphEngine();
    modeManagerRef.current = new ShoppingModeManager();
    optimizerRef.current = new RouteOptimizer(graphRef.current);
  }, []);

  const optimizeFromList = useCallback(async (
    itemPositions: Array<{ id: string; position: Vector2; zoneId?: string; priority?: number }>,
    startPosition: Vector2,
    endPosition: Vector2
  ) => {
    if (!optimizerRef.current || !modeManagerRef.current || !graphRef.current) return;

    setIsOptimizing(true);

    try {
      const startNode = graphRef.current.findNearestNode(startPosition);
      const endNode = graphRef.current.findNearestNode(endPosition);

      const stops: TSPNode[] = [
        {
          id: 'start',
          nodeId: startNode?.id || 'start',
          position: startPosition,
          priority: -1
        },
        ...itemPositions.map(item => ({
          id: item.id,
          nodeId: graphRef.current!.findNearestNode(item.position)?.id || item.id,
          position: item.position,
          zoneId: item.zoneId,
          priority: item.priority ?? 1
        })),
        {
          id: 'end',
          nodeId: endNode?.id || 'end',
          position: endPosition,
          priority: -2
        }
      ];

      if (enableZoneGrouping) {
        const groups = groupStopsByZone(stops);
        setZoneGroups(groups);
      }

      const mode = modeManagerRef.current.getMode();
      const result = optimizerRef.current.optimizeMultiStopRoute(stops, mode);

      setOptimizedRoute(result.route);
      setRouteAlternatives(result.alternatives);
      setSelectedAlternative(0);
      setCurrentMetrics(result.metrics);
    } finally {
      setIsOptimizing(false);
    }
  }, [enableZoneGrouping]);

  const optimizeFromZones = useCallback(async (
    zones: string[],
    startPosition: Vector2,
    endPosition: Vector2
  ) => {
    if (!graphRef.current || !optimizerRef.current || !modeManagerRef.current) return;

    setIsOptimizing(true);

    try {
      const zoneCenters = zones.map(zoneId => {
        const zone = graphRef.current!.getZone(zoneId);
        return {
          id: zoneId,
          position: zone ? {
            x: (zone.bounds.min.x + zone.bounds.max.x) / 2,
            y: (zone.bounds.min.y + zone.bounds.max.y) / 2
          } : { x: 0, y: 0 },
          zoneId
        };
      });

      await optimizeFromList(
        zoneCenters.map(z => ({ id: z.id, position: z.position, zoneId: z.zoneId })),
        startPosition,
        endPosition
      );
    } finally {
      setIsOptimizing(false);
    }
  }, [optimizeFromList]);

  const groupItemsByZone = useCallback((
    items: Array<{ id: string; position: Vector2; zoneId?: string }>
  ): Map<string, Array<{ id: string; position: Vector2; zoneId?: string }>> => {
    const groups = new Map<string, Array<{ id: string; position: Vector2; zoneId?: string }>>();

    items.forEach(item => {
      const zoneId = item.zoneId || 'unknown';
      if (!groups.has(zoneId)) {
        groups.set(zoneId, []);
      }
      groups.get(zoneId)!.push(item);
    });

    return groups;
  }, []);

  const selectAlternative = useCallback((index: number) => {
    if (index >= 0 && index < routeAlternatives.length) {
      setSelectedAlternative(index);
      setOptimizedRoute(routeAlternatives[index]);
    }
  }, [routeAlternatives]);

  const getOptimizationMetrics = useCallback(() => {
    return currentMetrics;
  }, [currentMetrics]);

  const reorderWaypoints = useCallback((newOrder: string[]) => {
    if (!optimizedRoute) return;

    const reorderedWaypoints = newOrder
      .map(id => optimizedRoute.waypoints.find(wp => wp.id === id))
      .filter((wp): wp is NonNullable<typeof wp> => wp !== undefined);

    setOptimizedRoute({
      ...optimizedRoute,
      waypoints: reorderedWaypoints
    });
  }, [optimizedRoute]);

  return {
    optimizedRoute,
    isOptimizing,
    zoneGroups,
    routeAlternatives,
    selectedAlternative,
    optimizeFromList,
    optimizeFromZones,
    groupItemsByZone,
    selectAlternative,
    getOptimizationMetrics,
    reorderWaypoints
  };
};

function groupStopsByZone(stops: TSPNode[]): Map<string, TSPNode[]> {
  const groups = new Map<string, TSPNode[]>();

  stops.forEach(stop => {
    if (stop.priority < 0) return;

    const zoneId = stop.zoneId || 'unknown';
    if (!groups.has(zoneId)) {
      groups.set(zoneId, []);
    }
    groups.get(zoneId)!.push(stop);
  });

  return groups;
}

import type { NavigationNode, Vector2 } from '@core/spatial/types';
import type { NavigationGraphEngine } from './NavigationGraphEngine';
import type { 
  TSPNode, 
  OptimizedRoute, 
  RouteWaypoint, 
  RouteSegment, 
  ShoppingMode,
  ModePreferences,
  RouteMetrics,
  RouteOptimizationResult,
  PathAlgorithm
} from './types';

interface DistanceMatrix {
  get(from: string, to: string): number;
  set(from: string, to: string, distance: number): void;
}

export class RouteOptimizer {
  private graph: NavigationGraphEngine;
  private modePreferences: ModePreferences;
  private distanceCache: Map<string, number> = new Map();

  constructor(
    graph: NavigationGraphEngine,
    preferences: Partial<ModePreferences> = {}
  ) {
    this.graph = graph;
    this.modePreferences = {
      'quick-buy': {
        prioritizeSpeed: true,
        avoidCrowds: true,
        maxDetourPercent: 20
      },
      'exploration': {
        enableDiscovery: true,
        showOffers: true,
        browseTimeMinutes: 15
      },
      'accessibility': {
        wheelchairAccessible: false,
        elevatorPreference: true,
        avoidStairs: true,
        widerPaths: true
      },
      'rush-hour': {
        congestionThreshold: 0.7,
        alternativeRouteThreshold: 1.3,
        timeBufferMinutes: 5
      },
      'treasure': {
        showHints: true,
        gamificationEnabled: true,
        collectibles: []
      },
      ...preferences
    };
  }

  optimizeMultiStopRoute(
    stops: TSPNode[],
    mode: ShoppingMode,
    algorithm: PathAlgorithm = 'astar'
  ): RouteOptimizationResult {
    const startTime = performance.now();
    
    if (stops.length < 2) {
      throw new Error('At least 2 stops required');
    }

    const orderedStops = this.orderStopsForMode(stops, mode);
    
    const optimizedOrder = this.optimizeTSP(orderedStops, mode);
    
    const route = this.buildRouteFromStops(optimizedOrder, algorithm, mode);
    
    const alternatives = this.generateAlternatives(optimizedStops, mode, algorithm);
    
    const metrics = this.calculateMetrics(route, mode);
    
    const calculationTime = performance.now() - startTime;

    return {
      route,
      metrics,
      alternatives,
      calculationTime,
      algorithmUsed: algorithm
    };
  }

  private orderStopsForMode(stops: TSPNode[], mode: ShoppingMode): TSPNode[] {
    const ordered = [...stops];
    
    switch (mode) {
      case 'quick-buy':
        return this.orderByPriority(ordered);
      case 'exploration':
        return this.orderForExploration(ordered);
      case 'rush-hour':
        return this.orderToAvoidCongestion(ordered);
      default:
        return ordered;
    }
  }

  private orderByPriority(stops: TSPNode[]): TSPNode[] {
    const start = stops.find(s => s.priority === -1);
    const end = stops.find(s => s.priority === -2);
    const items = stops.filter(s => s.priority >= 0);
    
    items.sort((a, b) => b.priority - a.priority);
    
    const result: TSPNode[] = [];
    if (start) result.push(start);
    result.push(...items);
    if (end) result.push(end);
    
    return result;
  }

  private orderForExploration(stops: TSPNode[]): TSPNode[] {
    const start = stops.find(s => s.priority === -1);
    const end = stops.find(s => s.priority === -2);
    const items = stops.filter(s => s.priority >= 0);
    
    const groups = this.groupByZone(items);
    
    const result: TSPNode[] = [];
    if (start) result.push(start);
    
    groups.forEach(group => {
      result.push(...group);
    });
    
    if (end) result.push(end);
    
    return result;
  }

  private orderToAvoidCongestion(stops: TSPNode[]): TSPNode[] {
    return this.orderByPriority(stops);
  }

  private groupByZone(stops: TSPNode[]): TSPNode[][] {
    const groups = new Map<string, TSPNode[]>();
    
    stops.forEach(stop => {
      const zoneId = stop.zoneId || 'unknown';
      if (!groups.has(zoneId)) {
        groups.set(zoneId, []);
      }
      groups.get(zoneId)!.push(stop);
    });
    
    return Array.from(groups.values());
  }

  private optimizeTSP(stops: TSPNode[], mode: ShoppingMode): TSPNode[] {
    if (stops.length <= 3) return stops;

    let bestRoute = this.nearestNeighbor(stops);
    
    if (mode !== 'quick-buy') {
      bestRoute = this.twoOpt(bestRoute);
    }

    if (mode === 'exploration') {
      bestRoute = this.threeOpt(bestRoute);
    }

    return bestRoute;
  }

  private nearestNeighbor(stops: TSPNode[]): TSPNode[] {
    const unvisited = new Set(stops);
    const route: TSPNode[] = [];
    
    const start = stops.find(s => s.priority === -1) || stops[0];
    route.push(start);
    unvisited.delete(start);
    
    while (unvisited.size > 0) {
      const current = route[route.length - 1];
      let nearest: TSPNode | null = null;
      let minDistance = Infinity;
      
      for (const stop of unvisited) {
        if (stop.priority === -1) continue;
        
        const dist = this.getDistance(current.nodeId, stop.nodeId);
        if (dist < minDistance) {
          minDistance = dist;
          nearest = stop;
        }
      }
      
      if (nearest) {
        route.push(nearest);
        unvisited.delete(nearest);
      } else {
        break;
      }
    }
    
    const end = stops.find(s => s.priority === -2);
    if (end && !route.includes(end)) {
      route.push(end);
    }
    
    return route;
  }

  private twoOpt(route: TSPNode[]): TSPNode[] {
    let improved = true;
    let bestRoute = [...route];
    
    while (improved) {
      improved = false;
      
      for (let i = 1; i < route.length - 2; i++) {
        for (let j = i + 1; j < route.length; j++) {
          if (j === route.length - 1 && route[j].priority === -2) continue;
          
          const newRoute = this.twoOptSwap(bestRoute, i, j);
          
          if (this.calculateRouteDistance(newRoute) < this.calculateRouteDistance(bestRoute)) {
            bestRoute = newRoute;
            improved = true;
          }
        }
      }
    }
    
    return bestRoute;
  }

  private twoOptSwap(route: TSPNode[], i: number, j: number): TSPNode[] {
    const newRoute = route.slice(0, i);
    const reversed = route.slice(i, j + 1).reverse();
    newRoute.push(...reversed);
    newRoute.push(...route.slice(j + 1));
    return newRoute;
  }

  private threeOpt(route: TSPNode[]): TSPNode[] {
    let improved = true;
    let bestRoute = [...route];
    
    while (improved) {
      improved = false;
      
      for (let i = 1; i < route.length - 4; i++) {
        for (let j = i + 2; j < route.length - 2; j++) {
          for (let k = j + 2; k < route.length; k++) {
            if (k === route.length - 1 && route[k].priority === -2) continue;
            
            const candidates = this.threeOptCandidates(bestRoute, i, j, k);
            
            for (const candidate of candidates) {
              if (this.calculateRouteDistance(candidate) < this.calculateRouteDistance(bestRoute)) {
                bestRoute = candidate;
                improved = true;
                break;
              }
            }
          }
        }
      }
    }
    
    return bestRoute;
  }

  private threeOptCandidates(route: TSPNode[], i: number, j: number, k: number): TSPNode[][] {
    const candidates: TSPNode[][] = [];
    
    const a = route.slice(0, i);
    const b = route.slice(i, j + 1);
    const c = route.slice(j + 1, k + 1);
    const d = route.slice(k + 1);
    
    candidates.push([...a, ...b, ...c, ...d]);
    candidates.push([...a, ...b, ...c.reverse(), ...d]);
    candidates.push([...a, ...b.reverse(), ...c, ...d]);
    candidates.push([...a, ...b.reverse(), ...c.reverse(), ...d]);
    candidates.push([...a, ...c, ...b, ...d]);
    candidates.push([...a, ...c.reverse(), ...b, ...d]);
    
    return candidates;
  }

  private buildRouteFromStops(
    stops: TSPNode[], 
    algorithm: PathAlgorithm,
    mode: ShoppingMode
  ): OptimizedRoute {
    const waypoints: RouteWaypoint[] = stops.map((stop, index) => ({
      id: `wp-${index}`,
      nodeId: stop.nodeId,
      position: stop.position,
      zoneId: stop.zoneId,
      type: stop.priority === -1 ? 'start' : stop.priority === -2 ? 'billing' : 'item',
      completed: false,
      skipped: false
    }));

    const segments: RouteSegment[] = [];
    let totalDistance = 0;
    let totalTime = 0;
    const zonesVisited = new Set<string>();

    for (let i = 0; i < stops.length - 1; i++) {
      const fromStop = stops[i];
      const toStop = stops[i + 1];
      
      const constraints = this.getConstraintsForMode(mode);
      const path = this.graph.findPath(fromStop.nodeId, toStop.nodeId, algorithm, constraints);
      
      if (!path) {
        throw new Error(`No path found from ${fromStop.nodeId} to ${toStop.nodeId}`);
      }

      const distance = this.calculatePathDistance(path);
      const time = this.estimateTime(distance, mode);
      const instructions = this.generateInstructions(path);

      segments.push({
        from: waypoints[i],
        to: waypoints[i + 1],
        path,
        distance,
        estimatedTime: time,
        instructions,
        congestionLevel: 'low',
        completed: false
      });

      totalDistance += distance;
      totalTime += time;

      if (fromStop.zoneId) zonesVisited.add(fromStop.zoneId);
      if (toStop.zoneId) zonesVisited.add(toStop.zoneId);
    }

    return {
      id: `route-${Date.now()}`,
      waypoints,
      segments,
      totalDistance,
      totalTime,
      totalSteps: segments.reduce((sum, seg) => sum + seg.instructions.length, 0),
      zonesVisited: Array.from(zonesVisited),
      algorithm,
      mode,
      createdAt: Date.now(),
      score: this.calculateRouteScore(segments, mode)
    };
  }

  private getConstraintsForMode(mode: ShoppingMode): string[] {
    const constraints: string[] = [];
    
    switch (mode) {
      case 'accessibility':
        constraints.push('accessibility', 'wheelchair');
        break;
      case 'rush-hour':
        constraints.push('avoid-crowds');
        break;
    }
    
    return constraints;
  }

  private generateAlternatives(
    stops: TSPNode[],
    mode: ShoppingMode,
    algorithm: PathAlgorithm
  ): OptimizedRoute[] {
    const alternatives: OptimizedRoute[] = [];
    
    if (stops.length > 3) {
      const altAlgorithm = algorithm === 'astar' ? 'dijkstra' : 'astar';
      try {
        const altRoute = this.buildRouteFromStops(stops, altAlgorithm, mode);
        alternatives.push(altRoute);
      } catch {
        // Alternative route failed, skip
      }
    }
    
    return alternatives;
  }

  private calculateRouteDistance(stops: TSPNode[]): number {
    let distance = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      distance += this.getDistance(stops[i].nodeId, stops[i + 1].nodeId);
    }
    return distance;
  }

  private calculatePathDistance(path: NavigationNode[]): number {
    let distance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const dx = path[i + 1].position.x - path[i].position.x;
      const dy = path[i + 1].position.y - path[i].position.y;
      distance += Math.sqrt(dx * dx + dy * dy);
    }
    return distance;
  }

  private estimateTime(distance: number, mode: ShoppingMode): number {
    const baseSpeed = 1.4;
    
    let speed = baseSpeed;
    
    switch (mode) {
      case 'quick-buy':
        speed *= 1.2;
        break;
      case 'accessibility':
        speed *= 0.7;
        break;
      case 'exploration':
        const browseTime = this.modePreferences.exploration.browseTimeMinutes * 60;
        return (distance / speed) + browseTime;
    }
    
    return distance / speed;
  }

  private generateInstructions(path: NavigationNode[]): import('./types').NavigationInstruction[] {
    const instructions: import('./types').NavigationInstruction[] = [];
    
    if (path.length === 0) return instructions;

    instructions.push({
      id: `instr-start`,
      type: 'start',
      text: 'Start navigation',
      distance: 0,
      duration: 0,
      coordinates: path[0].position
    });

    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const curr = path[i];
      
      const dx = curr.position.x - prev.position.x;
      const dy = curr.position.y - prev.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      let type: import('./types').NavigationInstruction['type'] = 'straight';
      let text = 'Continue straight';
      
      if (i < path.length - 1) {
        const next = path[i + 1];
        const nextDx = next.position.x - curr.position.x;
        const nextDy = next.position.y - curr.position.y;
        
        const angle = Math.atan2(nextDy, nextDx) - Math.atan2(dy, dx);
        const degrees = (angle * 180) / Math.PI;
        
        if (Math.abs(degrees) > 30) {
          if (degrees > 0) {
            type = degrees > 90 ? 'turn-right' : 'turn-right';
            text = degrees > 90 ? 'Turn right' : 'Turn slight right';
          } else {
            type = degrees < -90 ? 'turn-left' : 'turn-left';
            text = degrees < -90 ? 'Turn left' : 'Turn slight left';
          }
        }
      }

      instructions.push({
        id: `instr-${i}`,
        type,
        text,
        distance,
        duration: distance / 1.4,
        coordinates: curr.position,
        nextCoordinates: i < path.length - 1 ? path[i + 1].position : undefined,
        zoneId: curr.zoneId
      });
    }

    instructions.push({
      id: `instr-end`,
      type: 'arrival',
      text: 'You have arrived',
      distance: 0,
      duration: 0,
      coordinates: path[path.length - 1].position
    });

    return instructions;
  }

  private calculateRouteScore(segments: RouteSegment[], mode: ShoppingMode): number {
    const totalDistance = segments.reduce((sum, seg) => sum + seg.distance, 0);
    const totalTime = segments.reduce((sum, seg) => sum + seg.estimatedTime, 0);
    
    const distanceScore = Math.max(0, 100 - totalDistance * 0.5);
    const timeScore = Math.max(0, 100 - totalTime * 0.1);
    
    return (distanceScore + timeScore) / 2;
  }

  private calculateMetrics(route: OptimizedRoute, mode: ShoppingMode): RouteMetrics {
    const baselineDistance = route.totalDistance * 1.2;
    const baselineTime = route.totalTime * 1.2;
    
    return {
      distanceEfficiency: Math.min(100, (baselineDistance / route.totalDistance) * 100),
      timeEfficiency: Math.min(100, (baselineTime / route.totalTime) * 100),
      congestionAvoidance: mode === 'rush-hour' ? 80 : 50,
      accessibilityScore: mode === 'accessibility' ? 95 : 70,
      userPreferenceMatch: 85
    };
  }

  private getDistance(fromId: string, toId: string): number {
    const cacheKey = `${fromId}-${toId}`;
    
    if (this.distanceCache.has(cacheKey)) {
      return this.distanceCache.get(cacheKey)!;
    }

    const path = this.graph.findPath(fromId, toId, 'astar');
    if (!path) return Infinity;

    const distance = this.calculatePathDistance(path);
    this.distanceCache.set(cacheKey, distance);
    
    return distance;
  }

  updatePreferences(preferences: Partial<ModePreferences>): void {
    this.modePreferences = { ...this.modePreferences, ...preferences };
  }

  clearCache(): void {
    this.distanceCache.clear();
  }
}

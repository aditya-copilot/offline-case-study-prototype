import type { NavigationNode, NavigationEdge, Vector2, StoreZone } from '@core/spatial/types';
import { PriorityQueue } from './PriorityQueue';
import type { 
  PathAlgorithm, 
  AStarHeuristic, 
  EdgeWeightFactors, 
  GraphCacheEntry,
  ZoneCongestionData,
  PathEngineConfig
} from './types';

interface GraphEdge {
  to: string;
  weight: number;
  edgeId: string;
  edge: NavigationEdge;
}

export class NavigationGraphEngine {
  private nodes: Map<string, NavigationNode> = new Map();
  private edges: Map<string, NavigationEdge> = new Map();
  private zones: Map<string, StoreZone> = new Map();
  private adjacencyList: Map<string, GraphEdge[]> = new Map();
  private reverseAdjacencyList: Map<string, GraphEdge[]> = new Map();
  private cache: Map<string, GraphCacheEntry> = new Map();
  private congestionData: Map<string, ZoneCongestionData> = new Map();
  private config: PathEngineConfig;

  constructor(config: Partial<PathEngineConfig> = {}) {
    this.config = {
      algorithm: 'astar',
      maxCacheSize: 1000,
      cacheTTL: 5 * 60 * 1000,
      enableCongestionModeling: true,
      recalculationThreshold: 5,
      minRecalculationInterval: 1000,
      maxRecalculations: 10,
      ...config
    };
  }

  addNode(node: NavigationNode): void {
    this.nodes.set(node.id, node);
    if (!this.adjacencyList.has(node.id)) {
      this.adjacencyList.set(node.id, []);
    }
    if (!this.reverseAdjacencyList.has(node.id)) {
      this.reverseAdjacencyList.set(node.id, []);
    }
  }

  addEdge(edge: NavigationEdge): void {
    this.edges.set(edge.id, edge);
    
    const fromList = this.adjacencyList.get(edge.fromNodeId) || [];
    fromList.push({ 
      to: edge.toNodeId, 
      weight: edge.weight, 
      edgeId: edge.id,
      edge
    });
    this.adjacencyList.set(edge.fromNodeId, fromList);

    const toList = this.reverseAdjacencyList.get(edge.toNodeId) || [];
    toList.push({ 
      to: edge.fromNodeId, 
      weight: edge.weight, 
      edgeId: edge.id,
      edge
    });
    this.reverseAdjacencyList.set(edge.toNodeId, toList);

    if (edge.bidirectional) {
      const reverseFromList = this.adjacencyList.get(edge.toNodeId) || [];
      reverseFromList.push({ 
        to: edge.fromNodeId, 
        weight: edge.weight, 
        edgeId: edge.id,
        edge
      });
      this.adjacencyList.set(edge.toNodeId, reverseFromList);

      const reverseToList = this.reverseAdjacencyList.get(edge.fromNodeId) || [];
      reverseToList.push({ 
        to: edge.toNodeId, 
        weight: edge.weight, 
        edgeId: edge.id,
        edge
      });
      this.reverseAdjacencyList.set(edge.fromNodeId, reverseToList);
    }
  }

  addZone(zone: StoreZone): void {
    this.zones.set(zone.id, zone);
  }

  findPath(
    startId: string, 
    endId: string, 
    algorithm: PathAlgorithm = this.config.algorithm,
    constraints?: string[]
  ): NavigationNode[] | null {
    if (!this.nodes.has(startId) || !this.nodes.has(endId)) {
      return null;
    }

    const cacheKey = `${startId}-${endId}-${algorithm}-${constraints?.join(',') || ''}`;
    const cached = this.getCachedPath(cacheKey);
    if (cached) {
      return cached;
    }

    const path = algorithm === 'astar' 
      ? this.aStar(startId, endId, constraints)
      : this.dijkstra(startId, endId, constraints);

    if (path) {
      this.cachePath(cacheKey, startId, endId, path);
    }

    return path;
  }

  private aStar(startId: string, endId: string, constraints?: string[]): NavigationNode[] | null {
    const startNode = this.nodes.get(startId)!;
    const endNode = this.nodes.get(endId)!;

    const openSet = new PriorityQueue<string>();
    openSet.enqueue(startId, 0);

    const cameFrom = new Map<string, string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();

    gScore.set(startId, 0);
    fScore.set(startId, this.heuristic(startNode, endNode));

    const closedSet = new Set<string>();

    while (!openSet.isEmpty()) {
      const currentId = openSet.dequeue()!;

      if (currentId === endId) {
        return this.reconstructPath(cameFrom, endId);
      }

      closedSet.add(currentId);

      const neighbors = this.adjacencyList.get(currentId) || [];
      
      for (const neighbor of neighbors) {
        if (closedSet.has(neighbor.to)) continue;

        const neighborNode = this.nodes.get(neighbor.to);
        if (!neighborNode) continue;

        if (constraints && this.violatesConstraints(neighborNode, neighbor.edge, constraints)) {
          continue;
        }

        const tentativeGScore = (gScore.get(currentId) || Infinity) + 
          this.calculateEdgeWeight(neighbor, constraints);

        if (tentativeGScore < (gScore.get(neighbor.to) || Infinity)) {
          cameFrom.set(neighbor.to, currentId);
          gScore.set(neighbor.to, tentativeGScore);
          fScore.set(neighbor.to, tentativeGScore + this.heuristic(neighborNode, endNode));

          if (!openSet.contains(neighbor.to)) {
            openSet.enqueue(neighbor.to, fScore.get(neighbor.to)!);
          } else {
            openSet.updatePriority(neighbor.to, fScore.get(neighbor.to)!);
          }
        }
      }
    }

    return null;
  }

  private dijkstra(startId: string, endId: string, constraints?: string[]): NavigationNode[] | null {
    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const unvisited = new PriorityQueue<string>();

    for (const nodeId of this.nodes.keys()) {
      distances.set(nodeId, nodeId === startId ? 0 : Infinity);
      previous.set(nodeId, null);
      if (nodeId === startId) {
        unvisited.enqueue(nodeId, 0);
      } else {
        unvisited.enqueue(nodeId, Infinity);
      }
    }

    while (!unvisited.isEmpty()) {
      const current = unvisited.dequeue()!;

      if (current === endId) break;
      if ((distances.get(current) || Infinity) === Infinity) break;

      const neighbors = this.adjacencyList.get(current) || [];
      
      for (const neighbor of neighbors) {
        const neighborNode = this.nodes.get(neighbor.to);
        if (!neighborNode) continue;

        if (constraints && this.violatesConstraints(neighborNode, neighbor.edge, constraints)) {
          continue;
        }

        const alt = (distances.get(current) || 0) + this.calculateEdgeWeight(neighbor, constraints);
        
        if (alt < (distances.get(neighbor.to) || Infinity)) {
          distances.set(neighbor.to, alt);
          previous.set(neighbor.to, current);
          unvisited.updatePriority(neighbor.to, alt);
        }
      }
    }

    if (distances.get(endId) === Infinity) {
      return null;
    }

    return this.reconstructPath(previous, endId);
  }

  private heuristic(node: NavigationNode, goal: NavigationNode): number {
    return Math.abs(node.position.x - goal.position.x) + 
           Math.abs(node.position.y - goal.position.y);
  }

  private calculateEdgeWeight(edge: GraphEdge, constraints?: string[]): number {
    let weight = edge.weight;

    if (this.config.enableCongestionModeling) {
      const congestion = this.getCongestionMultiplier(edge);
      weight *= congestion;
    }

    if (constraints?.includes('accessibility')) {
      weight *= this.getAccessibilityMultiplier(edge);
    }

    weight *= this.getTimeOfDayMultiplier();

    return weight;
  }

  private getCongestionMultiplier(edge: GraphEdge): number {
    const fromNode = this.nodes.get(edge.edge.fromNodeId);
    const toNode = this.nodes.get(edge.edge.toNodeId);
    
    if (!fromNode?.zoneId && !toNode?.zoneId) return 1;

    let maxCongestion = 1;
    
    [fromNode?.zoneId, toNode?.zoneId].forEach(zoneId => {
      if (!zoneId) return;
      const data = this.congestionData.get(zoneId);
      if (data) {
        const multiplier = data.level === 'high' ? 2.0 : 
                          data.level === 'medium' ? 1.5 : 1.0;
        maxCongestion = Math.max(maxCongestion, multiplier);
      }
    });

    return maxCongestion;
  }

  private getAccessibilityMultiplier(edge: GraphEdge): number {
    const accessibility = edge.edge.accessibility;
    
    if (!accessibility.wheelchair || !accessibility.stroller) {
      return 5;
    }
    
    if (edge.edge.type === 'elevator') {
      return 0.8;
    }
    
    if (edge.edge.type === 'escalator') {
      return 1.2;
    }

    return 1;
  }

  private getTimeOfDayMultiplier(): number {
    const hour = new Date().getHours();
    
    if (hour >= 12 && hour <= 14) return 1.3;
    if (hour >= 17 && hour <= 19) return 1.5;
    if (hour >= 9 && hour <= 11) return 1.1;
    
    return 1;
  }

  private violatesConstraints(
    node: NavigationNode, 
    edge: NavigationEdge, 
    constraints: string[]
  ): boolean {
    if (constraints.includes('avoid-elevator') && edge.type === 'elevator') return true;
    if (constraints.includes('avoid-escalator') && edge.type === 'escalator') return true;
    if (constraints.includes('wheelchair') && !edge.accessibility.wheelchair) return true;
    
    return false;
  }

  private reconstructPath(
    cameFrom: Map<string, string | null>, 
    endId: string
  ): NavigationNode[] {
    const path: NavigationNode[] = [];
    let current: string | null = endId;

    while (current !== null) {
      const node = this.nodes.get(current);
      if (node) {
        path.unshift(node);
      }
      current = cameFrom.get(current) || null;
    }

    return path;
  }

  updateCongestionData(zoneId: string, data: ZoneCongestionData): void {
    this.congestionData.set(zoneId, data);
    this.clearCache();
  }

  private getCachedPath(key: string): NavigationNode[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.config.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.path;
  }

  private cachePath(
    key: string, 
    startNodeId: string, 
    endNodeId: string, 
    path: NavigationNode[]
  ): void {
    if (this.cache.size >= this.config.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      key,
      startNodeId,
      endNodeId,
      path,
      timestamp: Date.now(),
      hits: 0
    });
  }

  clearCache(): void {
    this.cache.clear();
  }

  getNode(id: string): NavigationNode | undefined {
    return this.nodes.get(id);
  }

  getEdge(id: string): NavigationEdge | undefined {
    return this.edges.get(id);
  }

  getZone(id: string): StoreZone | undefined {
    return this.zones.get(id);
  }

  getNeighbors(nodeId: string): NavigationNode[] {
    const edges = this.adjacencyList.get(nodeId) || [];
    return edges
      .map(edge => this.nodes.get(edge.to))
      .filter((node): node is NavigationNode => node !== undefined);
  }

  findNearestNode(position: Vector2): NavigationNode | null {
    let nearest: NavigationNode | null = null;
    let minDistance = Infinity;

    for (const node of this.nodes.values()) {
      const dist = Math.sqrt(
        Math.pow(position.x - node.position.x, 2) + 
        Math.pow(position.y - node.position.y, 2)
      );
      if (dist < minDistance) {
        minDistance = dist;
        nearest = node;
      }
    }

    return nearest;
  }

  toJSON(): object {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      zones: Array.from(this.zones.values())
    };
  }

  fromJSON(data: {
    nodes: NavigationNode[];
    edges: NavigationEdge[];
    zones: StoreZone[];
  }): void {
    this.clear();
    
    data.zones.forEach(zone => this.addZone(zone));
    data.nodes.forEach(node => this.addNode(node));
    data.edges.forEach(edge => this.addEdge(edge));
  }

  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.zones.clear();
    this.adjacencyList.clear();
    this.reverseAdjacencyList.clear();
    this.cache.clear();
    this.congestionData.clear();
  }

  getCacheStats(): { size: number; hitRate: number } {
    let totalHits = 0;
    this.cache.forEach(entry => {
      totalHits += entry.hits;
    });

    return {
      size: this.cache.size,
      hitRate: this.cache.size > 0 ? totalHits / this.cache.size : 0
    };
  }
}

/**
 * Route Performance Engine
 * Optimized pathfinding with precomputed matrices, memoization, and IndexedDB caching
 */

import type { NavigationNode } from '@core/spatial/types';
import { openDB, type IDBPDatabase } from 'idb';
import type { NavigationGraphEngine } from './NavigationGraphEngine';
import type { 
  ZoneDistanceMatrix, 
  CachedPath, 
  RouteMetrics,
  PerformanceStats,
  PathAlgorithm 
} from './types';

interface PerformanceConfig {
  enablePrecomputation: boolean;
  enableMemoization: boolean;
  enableIndexedDB: boolean;
  cacheMaxSize: number;
  cacheTTL: number;
  precomputeRadius: number;
  dbName: string;
  dbVersion: number;
}

interface ZoneMatrix {
  fromZoneId: string;
  toZoneId: string;
  distance: number;
  time: number;
  path: string[];
  computedAt: number;
}

export class RoutePerformanceEngine {
  private graph: NavigationGraphEngine;
  private config: PerformanceConfig;
  private memoryCache: Map<string, CachedPath> = new Map();
  private zoneMatrices: Map<string, ZoneMatrix> = new Map();
  private nodeToZone: Map<string, string> = new Map();
  private accessOrder: string[] = [];
  private db: IDBPDatabase | null = null;
  private metrics: RouteMetrics;
  private stats: PerformanceStats;

  constructor(
    graph: NavigationGraphEngine,
    config: Partial<PerformanceConfig> = {}
  ) {
    this.graph = graph;
    this.config = {
      enablePrecomputation: true,
      enableMemoization: true,
      enableIndexedDB: true,
      cacheMaxSize: 10000,
      cacheTTL: 30 * 60 * 1000,
      precomputeRadius: 3,
      dbName: 'RouteCacheDB',
      dbVersion: 1,
      ...config
    };

    this.metrics = {
      totalCalculations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageCalculationTime: 0,
      nodesExploredAverage: 0,
      pathQualityScore: 0,
      adaptationAccuracy: 0,
      customerSatisfaction: 0
    };

    this.stats = {
      algorithmTimings: new Map(),
      graphSize: { nodes: 0, edges: 0 },
      cacheStats: { size: 0, hitRate: 0, memoryUsed: 0 },
      congestionAccuracy: 0
    };

    this.initDB();
  }

  private async initDB(): Promise<void> {
    if (!this.config.enableIndexedDB) return;

    try {
      this.db = await openDB(this.config.dbName, this.config.dbVersion, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('paths')) {
            const store = db.createObjectStore('paths', { keyPath: 'id' });
            store.createIndex('fromTo', ['fromNodeId', 'toNodeId']);
            store.createIndex('timestamp', 'computedAt');
          }
          if (!db.objectStoreNames.contains('zoneMatrices')) {
            const store = db.createObjectStore('zoneMatrices', { keyPath: 'key' });
            store.createIndex('timestamp', 'computedAt');
          }
        }
      });
    } catch {
      this.config.enableIndexedDB = false;
    }
  }

  /**
   * Precompute distance matrices for all zones
   */
  async precomputeZoneMatrices(zoneIds: string[]): Promise<void> {
    if (!this.config.enablePrecomputation) return;

    const startTime = performance.now();
    const matrices: ZoneMatrix[] = [];

    for (const fromZoneId of zoneIds) {
      for (const toZoneId of zoneIds) {
        if (fromZoneId === toZoneId) continue;

        const cacheKey = `${fromZoneId}-${toZoneId}`;
        
        if (this.zoneMatrices.has(cacheKey)) {
          continue;
        }

        const matrix = await this.computeZoneMatrix(fromZoneId, toZoneId);
        if (matrix) {
          matrices.push(matrix);
          this.zoneMatrices.set(cacheKey, matrix);
        }
      }
    }

    if (this.db && matrices.length > 0) {
      const tx = this.db.transaction('zoneMatrices', 'readwrite');
      for (const matrix of matrices) {
        await tx.store.put({
          key: `${matrix.fromZoneId}-${matrix.toZoneId}`,
          ...matrix
        });
      }
      await tx.done;
    }

    const duration = performance.now() - startTime;
    this.recordAlgorithmTiming('precompute', duration);
  }

  private async computeZoneMatrix(
    fromZoneId: string,
    toZoneId: string
  ): Promise<ZoneMatrix | null> {
    const fromNode = this.findZoneCenterNode(fromZoneId);
    const toNode = this.findZoneCenterNode(toZoneId);

    if (!fromNode || !toNode) return null;

    const startTime = performance.now();
    const path = this.graph.findPath(fromNode.id, toNode.id, 'astar');
    const duration = performance.now() - startTime;

    if (!path) return null;

    const distance = this.calculatePathDistance(path);
    const time = this.estimateTime(distance);

    return {
      fromZoneId,
      toZoneId,
      distance,
      time,
      path: path.map(n => n.id),
      computedAt: Date.now()
    };
  }

  /**
   * Get cached path or compute and cache
   */
  async getPath(
    fromNodeId: string,
    toNodeId: string,
    algorithm: PathAlgorithm = 'astar'
  ): Promise<NavigationNode[] | null> {
    this.metrics.totalCalculations++;

    const cacheKey = `${fromNodeId}-${toNodeId}-${algorithm}`;

    const cached = await this.getCachedPath(cacheKey);
    if (cached) {
      this.metrics.cacheHits++;
      return cached.path;
    }

    this.metrics.cacheMisses++;

    const startTime = performance.now();
    const path = this.graph.findPath(fromNodeId, toNodeId, algorithm);
    const duration = performance.now() - startTime;

    this.recordAlgorithmTiming(algorithm, duration);
    this.updateAverageCalculationTime(duration);

    if (path) {
      await this.cachePath(cacheKey, fromNodeId, toNodeId, path, algorithm, duration);
    }

    return path;
  }

  private async getCachedPath(cacheKey: string): Promise<CachedPath | null> {
    if (!this.config.enableMemoization) return null;

    const memoryCached = this.memoryCache.get(cacheKey);
    if (memoryCached) {
      if (Date.now() - memoryCached.computedAt < this.config.cacheTTL) {
        memoryCached.accessCount++;
        memoryCached.lastAccessed = Date.now();
        this.updateAccessOrder(cacheKey);
        return memoryCached;
      } else {
        this.memoryCache.delete(cacheKey);
      }
    }

    if (this.db && this.config.enableIndexedDB) {
      try {
        const dbCached = await this.db.get('paths', cacheKey);
        if (dbCached && Date.now() - dbCached.computedAt < this.config.cacheTTL) {
          const reconstructed: CachedPath = {
            ...dbCached,
            path: dbCached.pathIds.map((id: string) => this.graph.getNode(id)).filter(Boolean) as NavigationNode[]
          };
          this.memoryCache.set(cacheKey, reconstructed);
          this.updateAccessOrder(cacheKey);
          return reconstructed;
        }
      } catch {
        // Ignore DB errors
      }
    }

    return null;
  }

  private async cachePath(
    cacheKey: string,
    fromNodeId: string,
    toNodeId: string,
    path: NavigationNode[],
    algorithm: PathAlgorithm,
    calculationTime: number
  ): Promise<void> {
    const cachedPath: CachedPath = {
      id: cacheKey,
      fromNodeId,
      toNodeId,
      path,
      distance: this.calculatePathDistance(path),
      time: this.estimateTime(this.calculatePathDistance(path)),
      algorithm,
      computedAt: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now()
    };

    if (this.memoryCache.size >= this.config.cacheMaxSize) {
      this.evictLRU();
    }

    this.memoryCache.set(cacheKey, cachedPath);
    this.updateAccessOrder(cacheKey);

    if (this.db && this.config.enableIndexedDB) {
      try {
        await this.db.put('paths', {
          id: cacheKey,
          fromNodeId,
          toNodeId,
          pathIds: path.map(n => n.id),
          distance: cachedPath.distance,
          time: cachedPath.time,
          algorithm,
          computedAt: cachedPath.computedAt,
          accessCount: cachedPath.accessCount,
          lastAccessed: cachedPath.lastAccessed
        });
      } catch {
        // Ignore DB errors
      }
    }
  }

  private updateAccessOrder(cacheKey: string): void {
    const index = this.accessOrder.indexOf(cacheKey);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(cacheKey);
  }

  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;

    const oldestKey = this.accessOrder.shift();
    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  /**
   * Get precomputed zone distance
   */
  getZoneDistance(fromZoneId: string, toZoneId: string): number | null {
    const cacheKey = `${fromZoneId}-${toZoneId}`;
    const matrix = this.zoneMatrices.get(cacheKey);
    return matrix?.distance ?? null;
  }

  /**
   * Get precomputed zone path
   */
  getZonePath(fromZoneId: string, toZoneId: string): string[] | null {
    const cacheKey = `${fromZoneId}-${toZoneId}`;
    const matrix = this.zoneMatrices.get(cacheKey);
    return matrix?.path ?? null;
  }

  /**
   * Warm up cache with common paths
   */
  async warmUpCache(commonNodePairs: Array<[string, string]>): Promise<void> {
    const promises = commonNodePairs.map(([from, to]) =>
      this.getPath(from, to, 'astar')
    );

    await Promise.all(promises);
  }

  /**
   * Get performance metrics
   */
  getMetrics(): RouteMetrics {
    return { ...this.metrics };
  }

  /**
   * Get detailed performance stats
   */
  getStats(): PerformanceStats {
    const memoryUsed = this.calculateMemoryUsage();
    const hitRate = this.metrics.totalCalculations > 0
      ? this.metrics.cacheHits / this.metrics.totalCalculations
      : 0;

    return {
      algorithmTimings: new Map(this.stats.algorithmTimings),
      graphSize: { ...this.stats.graphSize },
      cacheStats: {
        size: this.memoryCache.size,
        hitRate,
        memoryUsed
      },
      congestionAccuracy: this.stats.congestionAccuracy
    };
  }

  private calculateMemoryUsage(): number {
    let size = 0;
    for (const [key, value] of this.memoryCache) {
      size += key.length * 2;
      size += value.path.length * 8;
      size += JSON.stringify(value).length * 2;
    }
    return size;
  }

  private recordAlgorithmTiming(algorithm: string, duration: number): void {
    const existing = this.stats.algorithmTimings.get(algorithm as PathAlgorithm);
    
    if (existing) {
      const newCount = existing.count + 1;
      this.stats.algorithmTimings.set(algorithm as PathAlgorithm, {
        avg: (existing.avg * existing.count + duration) / newCount,
        min: Math.min(existing.min, duration),
        max: Math.max(existing.max, duration),
        count: newCount
      });
    } else {
      this.stats.algorithmTimings.set(algorithm as PathAlgorithm, {
        avg: duration,
        min: duration,
        max: duration,
        count: 1
      });
    }
  }

  private updateAverageCalculationTime(duration: number): void {
    const newCount = this.metrics.totalCalculations;
    this.metrics.averageCalculationTime = 
      (this.metrics.averageCalculationTime * (newCount - 1) + duration) / newCount;
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

  private estimateTime(distance: number): number {
    const walkingSpeed = 1.4;
    return distance / walkingSpeed;
  }

  private findZoneCenterNode(zoneId: string): NavigationNode | null {
    const cached = this.nodeToZone.get(zoneId);
    if (cached) {
      return this.graph.getNode(cached) || null;
    }

    // Find a node in the zone
    return null;
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    this.memoryCache.clear();
    this.accessOrder = [];
    this.zoneMatrices.clear();

    if (this.db) {
      try {
        const tx1 = this.db.transaction('paths', 'readwrite');
        await tx1.store.clear();
        await tx1.done;

        const tx2 = this.db.transaction('zoneMatrices', 'readwrite');
        await tx2.store.clear();
        await tx2.done;
      } catch {
        // Ignore DB errors
      }
    }

    this.metrics = {
      totalCalculations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageCalculationTime: 0,
      nodesExploredAverage: 0,
      pathQualityScore: 0,
      adaptationAccuracy: 0,
      customerSatisfaction: 0
    };
  }

  /**
   * Export cache data for backup
   */
  async exportCache(): Promise<object> {
    const data: Record<string, unknown> = {
      memoryCache: Array.from(this.memoryCache.entries()),
      zoneMatrices: Array.from(this.zoneMatrices.entries()),
      metrics: this.metrics,
      exportedAt: Date.now()
    };

    return data;
  }

  /**
   * Import cache data from backup
   */
  async importCache(data: object): Promise<void> {
    const imported = data as {
      memoryCache: Array<[string, CachedPath]>;
      zoneMatrices: Array<[string, ZoneMatrix]>;
      metrics: RouteMetrics;
    };

    if (imported.memoryCache) {
      this.memoryCache = new Map(imported.memoryCache);
    }

    if (imported.zoneMatrices) {
      this.zoneMatrices = new Map(imported.zoneMatrices);
    }

    if (imported.metrics) {
      this.metrics = imported.metrics;
    }
  }
}

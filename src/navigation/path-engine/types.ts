import type { Vector2, NavigationNode, NavigationEdge, StoreZone } from '@core/spatial/types';

export type ShoppingMode = 
  | 'quick-buy' 
  | 'exploration' 
  | 'accessibility' 
  | 'rush-hour' 
  | 'treasure';

export type PathAlgorithm = 'dijkstra' | 'astar';

export interface RouteConstraint {
  type: 'avoid-zone' | 'prefer-zone' | 'max-distance' | 'max-time' | 'accessibility';
  value: string | number | boolean;
  weight: number;
}

export interface RouteWaypoint {
  id: string;
  nodeId: string;
  position: Vector2;
  zoneId?: string;
  type: 'start' | 'item' | 'billing' | 'exit' | 'waypoint' | 'custom';
  name: string;
  completed: boolean;
  skipped: boolean;
  completedAt?: number;
  estimatedArrival: number;
  actualArrival?: number;
  serviceTime: number;
  priority: number;
  metadata?: Record<string, unknown>;
}

export interface RouteSegment {
  from: RouteWaypoint;
  to: RouteWaypoint;
  path: NavigationNode[];
  distance: number;
  estimatedTime: number;
  instructions: NavigationInstruction[];
  congestionLevel: 'low' | 'medium' | 'high';
  completed: boolean;
}

export interface NavigationInstruction {
  id: string;
  type: 'start' | 'straight' | 'turn-left' | 'turn-right' | 'u-turn' | 'arrival' | 'elevator' | 'escalator';
  text: string;
  distance: number;
  duration: number;
  coordinates: Vector2;
  nextCoordinates?: Vector2;
  icon?: string;
  zoneId?: string;
}

export interface OptimizedRoute {
  id: string;
  waypoints: RouteWaypoint[];
  segments: RouteSegment[];
  totalDistance: number;
  totalTime: number;
  totalSteps: number;
  zonesVisited: string[];
  algorithm: PathAlgorithm;
  mode: ShoppingMode;
  createdAt: number;
  expiresAt?: number;
  score: number;
  alternatives?: OptimizedRoute[];
}

export interface ModePreferences {
  'quick-buy': {
    prioritizeSpeed: boolean;
    avoidCrowds: boolean;
    maxDetourPercent: number;
  };
  'exploration': {
    enableDiscovery: boolean;
    showOffers: boolean;
    browseTimeMinutes: number;
  };
  'accessibility': {
    wheelchairAccessible: boolean;
    elevatorPreference: boolean;
    avoidStairs: boolean;
    widerPaths: boolean;
  };
  'rush-hour': {
    congestionThreshold: number;
    alternativeRouteThreshold: number;
    timeBufferMinutes: number;
  };
  'treasure': {
    showHints: boolean;
    gamificationEnabled: boolean;
    collectibles: string[];
  };
}

export interface PathAdaptationState {
  isDeviated: boolean;
  deviationDistance: number;
  deviationAngle: number;
  lastRecalculationTime: number;
  recalculationCount: number;
  suggestedAction: 'continue' | 'recalculate' | 'reroute' | 'pause';
}

export interface ZoneCongestionData {
  zoneId: string;
  level: 'low' | 'medium' | 'high';
  estimatedWaitTime: number;
  timestamp: number;
}

export interface GraphCacheEntry {
  key: string;
  startNodeId: string;
  endNodeId: string;
  path: NavigationNode[];
  distance: number;
  timestamp: number;
  hits: number;
}

export interface TSPNode {
  id: string;
  nodeId: string;
  position: Vector2;
  zoneId?: string;
  priority: number;
  timeWindow?: { start: number; end: number };
}

export interface RouteMetrics {
  distanceEfficiency: number;
  timeEfficiency: number;
  congestionAvoidance: number;
  accessibilityScore: number;
  userPreferenceMatch: number;
  totalCalculations: number;
  cacheHits: number;
  cacheMisses: number;
  averageCalculationTime: number;
  nodesExploredAverage: number;
  pathQualityScore: number;
  adaptationAccuracy: number;
  customerSatisfaction: number;
}

export interface CachedPath {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  path: NavigationNode[];
  distance: number;
  time: number;
  algorithm: PathAlgorithm;
  computedAt: number;
  accessCount: number;
  lastAccessed: number;
}

export interface ZoneDistanceMatrix {
  zoneId: string;
  distances: Map<string, number>;
  times: Map<string, number>;
  paths: Map<string, NavigationNode[]>;
  computedAt: number;
  expiresAt: number;
}

export interface PerformanceStats {
  algorithmTimings: Map<PathAlgorithm, { avg: number; min: number; max: number; count: number }>;
  graphSize: { nodes: number; edges: number };
  cacheStats: { size: number; hitRate: number; memoryUsed: number };
  congestionAccuracy: number;
}

export interface DeviationEvent {
  id: string;
  timestamp: number;
  expectedPosition: Vector2;
  actualPosition: Vector2;
  deviationDistance: number;
  deviationAngle: number;
  routeSegmentIndex: number;
  actionTaken: string;
  recalculationTime?: number;
}

export interface CustomerPosition {
  position: Vector2;
  heading: number;
  velocity: Vector2;
  accuracy: number;
  timestamp: number;
  zoneId?: string;
  nearestNodeId?: string;
  isMoving: boolean;
  speed: number;
}

export interface IntentPrediction {
  intent: 'continue' | 'explore' | 'search' | 'hesitate' | 'exit';
  confidence: number;
  predictedNextZone?: string;
  predictedNextProduct?: string;
  urgency: 'low' | 'medium' | 'high';
  suggestedAction: string;
  factors: string[];
}

export interface CustomerBehavior {
  dwellTimeByZone: Map<string, number>;
  viewTimeByProduct: Map<string, number>;
  pathHistory: CustomerPosition[];
  interactionHistory: InteractionEvent[];
  searchQueries: string[];
  hesitationPoints: Vector2[];
  preferredCategories: string[];
  walkingPattern: 'direct' | 'wandering' | 'browsing' | 'searching';
}

export interface InteractionEvent {
  id: string;
  type: 'view' | 'pickup' | 'scan' | 'search' | 'dwell' | 'hesitate';
  timestamp: number;
  position: Vector2;
  zoneId?: string;
  productId?: string;
  duration: number;
  metadata?: Record<string, unknown>;
}

export interface AdaptiveGuidance {
  type: 'direction' | 'suggestion' | 'alert' | 'encouragement';
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  icon?: string;
  action?: {
    label: string;
    handler: () => void;
  };
  expiresAt?: number;
}

export interface PathEngineConfig {
  algorithm: PathAlgorithm;
  maxCacheSize: number;
  cacheTTL: number;
  enableCongestionModeling: boolean;
  recalculationThreshold: number;
  minRecalculationInterval: number;
  maxRecalculations: number;
}

export interface AStarHeuristic {
  (node: NavigationNode, goal: NavigationNode): number;
}

export interface PriorityQueueItem<T> {
  item: T;
  priority: number;
}

export interface EdgeWeightFactors {
  baseWeight: number;
  congestionMultiplier: number;
  accessibilityMultiplier: number;
  timeOfDayMultiplier: number;
  userPreferenceMultiplier: number;
}

export interface RouteOptimizationResult {
  route: OptimizedRoute;
  metrics: RouteMetrics;
  alternatives: OptimizedRoute[];
  calculationTime: number;
  algorithmUsed: PathAlgorithm;
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 extends Vector2 {
  z: number;
}

export interface BoundingBox {
  min: Vector2;
  max: Vector2;
}

export interface SpatialRect {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export type MapEntityType = 
  | 'zone' 
  | 'shelf' 
  | 'rack' 
  | 'entrance' 
  | 'exit' 
  | 'billing' 
  | 'offer' 
  | 'obstacle'
  | 'path';

export interface MapEntity {
  id: string;
  type: MapEntityType;
  name: string;
  bounds: BoundingBox;
  center: Vector2;
  metadata?: Record<string, unknown>;
}

export interface StoreZone extends MapEntity {
  type: 'zone';
  category: string;
  color: string;
  products: string[];
  beacons: string[];
  capacity: number;
  crowdLevel: 'low' | 'medium' | 'high';
  entryPoints: Vector2[];
}

export interface Shelf extends MapEntity {
  type: 'shelf';
  zoneId: string;
  products: string[];
  height: number;
  facing: 'north' | 'south' | 'east' | 'west';
}

export interface NavigationNode {
  id: string;
  position: Vector2;
  type: 'waypoint' | 'junction' | 'zone-center' | 'shelf-access';
  connectedEdges: string[];
  zoneId?: string;
  metadata?: {
    isAccessible?: boolean;
    isElevator?: boolean;
    isEscalator?: boolean;
    floor?: number;
  };
}

export interface NavigationEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  weight: number;
  type: 'walkway' | 'aisle' | 'zone-boundary' | 'elevator' | 'escalator';
  bidirectional: boolean;
  accessibility: {
    wheelchair: boolean;
    stroller: boolean;
    cart: boolean;
  };
}

export interface StoreGraph {
  nodes: Map<string, NavigationNode>;
  edges: Map<string, NavigationEdge>;
  zones: Map<string, StoreZone>;
  shelves: Map<string, Shelf>;
  
  getNode(id: string): NavigationNode | undefined;
  getEdge(id: string): NavigationEdge | undefined;
  getZone(id: string): StoreZone | undefined;
  getNeighbors(nodeId: string): NavigationNode[];
  getEdgesFrom(nodeId: string): NavigationEdge[];
  getEdgesTo(nodeId: string): NavigationEdge[];
  findPath(start: string, end: string): NavigationNode[] | null;
  findMultiStopPath(stops: string[]): NavigationNode[] | null;
}

export interface PathSegment {
  from: Vector2;
  to: Vector2;
  distance: number;
  direction: number;
  instruction?: string;
}

export interface NavigationPath {
  id: string;
  nodes: NavigationNode[];
  segments: PathSegment[];
  totalDistance: number;
  estimatedTime: number;
  waypoints: Vector2[];
  zones: string[];
}

export interface CustomerPosition {
  id: string;
  position: Vector2;
  heading: number;
  velocity: Vector2;
  accuracy: number;
  timestamp: number;
  zoneId?: string;
  nearestNode?: string;
  isMoving: boolean;
}

export interface MapCamera {
  position: Vector2;
  zoom: number;
  rotation: number;
  target?: Vector2;
  bounds?: BoundingBox;
}

export interface Viewport {
  width: number;
  height: number;
  scale: number;
  offset: Vector2;
}

export interface RenderLayer {
  id: string;
  zIndex: number;
  visible: boolean;
  opacity: number;
  entities: MapEntity[];
}

export interface SpatialGrid {
  cellSize: number;
  bounds: BoundingBox;
  cells: Map<string, Set<string>>;
  
  insert(entity: MapEntity): void;
  remove(entity: MapEntity): void;
  query(bounds: BoundingBox): MapEntity[];
  queryPoint(point: Vector2): MapEntity[];
  queryRadius(center: Vector2, radius: number): MapEntity[];
}

export interface ZoneDetectionResult {
  zone: StoreZone | null;
  distance: number;
  entryPoint: Vector2 | null;
  isInside: boolean;
  confidence: number;
}

export interface MovementState {
  from: Vector2;
  to: Vector2;
  progress: number;
  speed: number;
  easing: (t: number) => number;
  startTime: number;
  duration: number;
}

export type EasingFunction = 
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'spring'
  | 'bounce';

export interface AnimationConfig {
  duration: number;
  easing: EasingFunction;
  delay?: number;
  loop?: boolean;
  yoyo?: boolean;
}

export interface DebugInfo {
  fps: number;
  frameTime: number;
  entityCount: number;
  visibleEntities: number;
  renderTime: number;
  spatialQueryTime: number;
  currentZone: string | null;
  activeNodes: number;
  activeEdges: number;
  memoryUsage: number;
}

export interface MapConfig {
  id: string;
  name: string;
  version: string;
  dimensions: {
    width: number;
    height: number;
    unit: 'meters' | 'feet' | 'pixels';
  };
  grid: {
    enabled: boolean;
    size: number;
    snap: boolean;
  };
  camera: {
    minZoom: number;
    maxZoom: number;
    defaultZoom: number;
    inertia: boolean;
    boundsConstraint: boolean;
  };
  rendering: {
    antialias: boolean;
    pixelRatio: number;
    maxEntities: number;
    cullingEnabled: boolean;
    lodEnabled: boolean;
  };
  zones: StoreZone[];
  shelves: Shelf[];
  nodes: NavigationNode[];
  edges: NavigationEdge[];
}

export interface GestureState {
  isDragging: boolean;
  isPinching: boolean;
  startPosition: Vector2;
  currentPosition: Vector2;
  delta: Vector2;
  velocity: Vector2;
  scale: number;
  rotation: number;
}

export interface MapEvent {
  type: 'click' | 'dblclick' | 'pan' | 'zoom' | 'rotate' | 'hover';
  position: Vector2;
  worldPosition: Vector2;
  entity?: MapEntity;
  button?: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
}

export type MapEventHandler = (event: MapEvent) => void;

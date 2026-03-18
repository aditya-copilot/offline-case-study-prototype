import type { Vector2, NavigationNode } from '@core/spatial/types';
import type { NavigationGraphEngine } from './NavigationGraphEngine';
import type { 
  RouteWaypoint, 
  RouteSegment, 
  OptimizedRoute, 
  PathAdaptationState,
  DeviationEvent,
  ShoppingMode
} from './types';

interface AdaptationConfig {
  deviationThreshold: number;
  angleThreshold: number;
  minRecalculationInterval: number;
  maxRecalculations: number;
  enableAutoRecalculation: boolean;
}

export class PathAdaptationEngine {
  private graph: NavigationGraphEngine;
  private config: AdaptationConfig;
  private state: PathAdaptationState;
  private deviationHistory: DeviationEvent[] = [];
  private lastRecalculationTime = 0;
  private recalculationCount = 0;
  private currentRoute: OptimizedRoute | null = null;
  private currentSegmentIndex = 0;
  private completedWaypoints = new Set<string>();

  constructor(
    graph: NavigationGraphEngine,
    config: Partial<AdaptationConfig> = {}
  ) {
    this.graph = graph;
    this.config = {
      deviationThreshold: 5,
      angleThreshold: 45,
      minRecalculationInterval: 3000,
      maxRecalculations: 5,
      enableAutoRecalculation: true,
      ...config
    };
    
    this.state = {
      isDeviated: false,
      deviationDistance: 0,
      deviationAngle: 0,
      lastRecalculationTime: 0,
      recalculationCount: 0,
      suggestedAction: 'continue'
    };
  }

  setRoute(route: OptimizedRoute): void {
    this.currentRoute = route;
    this.currentSegmentIndex = 0;
    this.completedWaypoints.clear();
    this.recalculationCount = 0;
    this.deviationHistory = [];
    this.resetState();
  }

  updatePosition(position: Vector2, heading: number): PathAdaptationState {
    if (!this.currentRoute) {
      return this.state;
    }

    const expectedPosition = this.getExpectedPosition();
    const deviation = this.calculateDeviation(position, expectedPosition);
    
    this.state.deviationDistance = deviation.distance;
    this.state.deviationAngle = this.calculateAngleDeviation(heading, deviation.expectedHeading);

    const isDeviated = this.isSignificantDeviation(deviation.distance, this.state.deviationAngle);
    
    if (isDeviated && !this.state.isDeviated) {
      this.handleDeviationStart(position, expectedPosition, deviation.distance);
    } else if (!isDeviated && this.state.isDeviated) {
      this.handleDeviationEnd();
    }

    this.state.isDeviated = isDeviated;

    this.checkWaypointArrival(position);
    this.checkSegmentProgress(position);

    this.state.suggestedAction = this.determineSuggestedAction();

    return this.state;
  }

  private calculateDeviation(
    actual: Vector2, 
    expected: Vector2
  ): { distance: number; expectedHeading: number } {
    const dx = actual.x - expected.x;
    const dy = actual.y - expected.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const expectedHeading = Math.atan2(dy, dx) * (180 / Math.PI);
    
    return { distance, expectedHeading };
  }

  private calculateAngleDeviation(actual: number, expected: number): number {
    let diff = Math.abs(actual - expected);
    while (diff > 180) {
      diff = 360 - diff;
    }
    return diff;
  }

  private isSignificantDeviation(distance: number, angle: number): boolean {
    return distance > this.config.deviationThreshold || 
           angle > this.config.angleThreshold;
  }

  private handleDeviationStart(
    actual: Vector2, 
    expected: Vector2, 
    magnitude: number
  ): void {
    this.deviationHistory.push({
      timestamp: Date.now(),
      expectedPosition: expected,
      actualPosition: actual,
      deviationMagnitude: magnitude,
      action: 'notified'
    });

    if (this.shouldRecalculate()) {
      this.state.suggestedAction = 'recalculate';
    }
  }

  private handleDeviationEnd(): void {
    const lastEvent = this.deviationHistory[this.deviationHistory.length - 1];
    if (lastEvent) {
      lastEvent.action = 'ignored';
    }
  }

  private shouldRecalculate(): boolean {
    const now = Date.now();
    const timeSinceLast = now - this.lastRecalculationTime;
    
    if (timeSinceLast < this.config.minRecalculationInterval) {
      return false;
    }

    if (this.recalculationCount >= this.config.maxRecalculations) {
      return false;
    }

    if (!this.config.enableAutoRecalculation) {
      return false;
    }

    return true;
  }

  recalculateRoute(
    currentPosition: Vector2, 
    mode: ShoppingMode
  ): OptimizedRoute | null {
    if (!this.currentRoute) return null;

    this.lastRecalculationTime = Date.now();
    this.recalculationCount++;

    const remainingWaypoints = this.currentRoute.waypoints.filter(
      wp => !this.completedWaypoints.has(wp.id) && !wp.skipped
    );

    if (remainingWaypoints.length === 0) {
      return null;
    }

    const nearestNode = this.graph.findNearestNode(currentPosition);
    if (!nearestNode) return null;

    const updatedWaypoints = [
      { ...remainingWaypoints[0], nodeId: nearestNode.id, position: currentPosition },
      ...remainingWaypoints.slice(1)
    ];

    return null;
  }

  skipCurrentWaypoint(): boolean {
    if (!this.currentRoute || this.currentSegmentIndex >= this.currentRoute.waypoints.length) {
      return false;
    }

    const currentWaypoint = this.currentRoute.waypoints[this.currentSegmentIndex];
    currentWaypoint.skipped = true;
    
    this.moveToNextWaypoint();
    
    return true;
  }

  getNextDestination(): RouteWaypoint | null {
    if (!this.currentRoute) return null;

    for (let i = this.currentSegmentIndex; i < this.currentRoute.waypoints.length; i++) {
      const waypoint = this.currentRoute.waypoints[i];
      if (!waypoint.completed && !waypoint.skipped) {
        return waypoint;
      }
    }

    return null;
  }

  getDistanceToNext(): number {
    if (!this.currentRoute || this.currentSegmentIndex >= this.currentRoute.segments.length) {
      return 0;
    }

    const currentSegment = this.currentRoute.segments[this.currentSegmentIndex];
    return currentSegment.distance;
  }

  getTimeToNext(): number {
    if (!this.currentRoute || this.currentSegmentIndex >= this.currentRoute.segments.length) {
      return 0;
    }

    const currentSegment = this.currentRoute.segments[this.currentSegmentIndex];
    return currentSegment.estimatedTime;
  }

  getRemainingDistance(): number {
    if (!this.currentRoute) return 0;

    let remaining = 0;
    for (let i = this.currentSegmentIndex; i < this.currentRoute.segments.length; i++) {
      const segment = this.currentRoute.segments[i];
      if (!segment.completed) {
        remaining += segment.distance;
      }
    }
    return remaining;
  }

  getRemainingTime(): number {
    if (!this.currentRoute) return 0;

    let remaining = 0;
    for (let i = this.currentSegmentIndex; i < this.currentRoute.segments.length; i++) {
      const segment = this.currentRoute.segments[i];
      if (!segment.completed) {
        remaining += segment.estimatedTime;
      }
    }
    return remaining;
  }

  getProgress(): number {
    if (!this.currentRoute || this.currentRoute.waypoints.length === 0) {
      return 0;
    }

    const completed = Array.from(this.completedWaypoints).size;
    return completed / this.currentRoute.waypoints.length;
  }

  private checkWaypointArrival(position: Vector2): void {
    if (!this.currentRoute || this.currentSegmentIndex >= this.currentRoute.waypoints.length) {
      return;
    }

    const currentWaypoint = this.currentRoute.waypoints[this.currentSegmentIndex];
    const distance = Math.sqrt(
      Math.pow(position.x - currentWaypoint.position.x, 2) +
      Math.pow(position.y - currentWaypoint.position.y, 2)
    );

    if (distance < 3) {
      this.completeCurrentWaypoint();
    }
  }

  private checkSegmentProgress(position: Vector2): void {
    if (!this.currentRoute || this.currentSegmentIndex >= this.currentRoute.segments.length) {
      return;
    }

    const segment = this.currentRoute.segments[this.currentSegmentIndex];
    const progress = this.calculateSegmentProgress(position, segment);

    if (progress >= 0.95) {
      segment.completed = true;
    }
  }

  private calculateSegmentProgress(position: Vector2, segment: RouteSegment): number {
    const pathLength = segment.path.length;
    if (pathLength === 0) return 0;

    let minDistance = Infinity;
    let closestIndex = 0;

    for (let i = 0; i < pathLength; i++) {
      const node = segment.path[i];
      const dist = Math.sqrt(
        Math.pow(position.x - node.position.x, 2) +
        Math.pow(position.y - node.position.y, 2)
      );
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    return closestIndex / (pathLength - 1);
  }

  private completeCurrentWaypoint(): void {
    if (!this.currentRoute) return;

    const currentWaypoint = this.currentRoute.waypoints[this.currentSegmentIndex];
    currentWaypoint.completed = true;
    currentWaypoint.completedAt = Date.now();
    this.completedWaypoints.add(currentWaypoint.id);

    this.moveToNextWaypoint();
  }

  private moveToNextWaypoint(): void {
    if (!this.currentRoute) return;

    this.currentSegmentIndex++;

    while (this.currentSegmentIndex < this.currentRoute.waypoints.length) {
      const waypoint = this.currentRoute.waypoints[this.currentSegmentIndex];
      if (!waypoint.completed && !waypoint.skipped) {
        break;
      }
      this.currentSegmentIndex++;
    }
  }

  private getExpectedPosition(): Vector2 {
    if (!this.currentRoute || this.currentSegmentIndex >= this.currentRoute.segments.length) {
      return { x: 0, y: 0 };
    }

    const segment = this.currentRoute.segments[this.currentSegmentIndex];
    return segment.from.position;
  }

  private determineSuggestedAction(): 'continue' | 'recalculate' | 'turn-around' {
    if (!this.state.isDeviated) {
      return 'continue';
    }

    if (this.state.deviationDistance > this.config.deviationThreshold * 3) {
      return 'turn-around';
    }

    if (this.shouldRecalculate()) {
      return 'recalculate';
    }

    return 'continue';
  }

  getCurrentInstruction(): import('./types').NavigationInstruction | null {
    if (!this.currentRoute || this.currentSegmentIndex >= this.currentRoute.segments.length) {
      return null;
    }

    const segment = this.currentRoute.segments[this.currentSegmentIndex];
    return segment.instructions[0] || null;
  }

  getUpcomingInstructions(count: number = 3): import('./types').NavigationInstruction[] {
    if (!this.currentRoute) return [];

    const instructions: import('./types').NavigationInstruction[] = [];
    
    for (let i = this.currentSegmentIndex; i < this.currentRoute.segments.length; i++) {
      const segment = this.currentRoute.segments[i];
      for (const instruction of segment.instructions) {
        if (instructions.length >= count) break;
        instructions.push(instruction);
      }
      if (instructions.length >= count) break;
    }

    return instructions;
  }

  getDeviationHistory(): DeviationEvent[] {
    return [...this.deviationHistory];
  }

  resetState(): void {
    this.state = {
      isDeviated: false,
      deviationDistance: 0,
      deviationAngle: 0,
      lastRecalculationTime: 0,
      recalculationCount: 0,
      suggestedAction: 'continue'
    };
  }

  reset(): void {
    this.resetState();
    this.currentRoute = null;
    this.currentSegmentIndex = 0;
    this.completedWaypoints.clear();
    this.deviationHistory = [];
    this.lastRecalculationTime = 0;
    this.recalculationCount = 0;
  }
}

/**
 * Customer Intent Model
 * Lightweight AI logic for predicting customer behavior and providing adaptive guidance
 */

import type { Vector2 } from '@core/spatial/types';
import type { RouteWaypoint, OptimizedRoute } from './types';

interface IntentModelConfig {
  hesitationThreshold: number;
  dwellTimeThreshold: number;
  predictionWindow: number;
  learningRate: number;
}

interface ZoneAffinity {
  zoneId: string;
  score: number;
  visitCount: number;
  totalDwellTime: number;
  lastVisit: number;
}

export class CustomerIntentModel {
  private config: IntentModelConfig;
  private behavior: CustomerBehavior;
  private zoneAffinities: Map<string, ZoneAffinity> = new Map();
  private currentPosition: CustomerPosition | null = null;
  private currentRoute: OptimizedRoute | null = null;
  private hesitationPoints: Vector2[] = [];
  private lastPrediction: IntentPrediction | null = null;
  private predictionHistory: IntentPrediction[] = [];

  constructor(config: Partial<IntentModelConfig> = {}) {
    this.config = {
      hesitationThreshold: 3000,
      dwellTimeThreshold: 10000,
      predictionWindow: 60000,
      learningRate: 0.1,
      ...config
    };

    this.behavior = {
      dwellTimeByZone: new Map(),
      viewTimeByProduct: new Map(),
      pathHistory: [],
      interactionHistory: [],
      searchQueries: [],
      hesitationPoints: [],
      preferredCategories: [],
      walkingPattern: 'direct'
    };
  }

  /**
   * Update the model with new position data
   */
  updatePosition(position: CustomerPosition): IntentPrediction {
    this.currentPosition = position;
    this.behavior.pathHistory.push(position);

    // Trim history to keep only recent data
    if (this.behavior.pathHistory.length > 100) {
      this.behavior.pathHistory = this.behavior.pathHistory.slice(-100);
    }

    this.detectHesitation();
    this.updateWalkingPattern();
    
    this.lastPrediction = this.generatePrediction();
    this.predictionHistory.push(this.lastPrediction);

    return this.lastPrediction;
  }

  /**
   * Set the current route for context-aware predictions
   */
  setRoute(route: OptimizedRoute): void {
    this.currentRoute = route;
  }

  /**
   * Record an interaction event
   */
  recordInteraction(event: InteractionEvent): void {
    this.behavior.interactionHistory.push(event);

    if (event.type === 'dwell' && event.zoneId) {
      const currentDwell = this.behavior.dwellTimeByZone.get(event.zoneId) || 0;
      this.behavior.dwellTimeByZone.set(event.zoneId, currentDwell + event.duration);
      
      this.updateZoneAffinity(event.zoneId, event.duration);
    }

    if (event.type === 'view' && event.productId) {
      const currentView = this.behavior.viewTimeByProduct.get(event.productId) || 0;
      this.behavior.viewTimeByProduct.set(event.productId, currentView + event.duration);
    }

    if (event.type === 'search') {
      this.behavior.searchQueries.push(event.metadata?.query as string || '');
    }
  }

  /**
   * Generate adaptive guidance based on current state
   */
  generateGuidance(): AdaptiveGuidance | null {
    if (!this.lastPrediction || !this.currentRoute) return null;

    const { intent, confidence, urgency } = this.lastPrediction;

    // Generate guidance based on intent
    switch (intent) {
      case 'hesitate':
        if (confidence > 0.6) {
          return {
            type: 'suggestion',
            priority: urgency === 'high' ? 'high' : 'medium',
            message: this.getHesitationGuidance(),
            icon: 'help-circle'
          };
        }
        break;

      case 'search':
        return {
          type: 'direction',
          priority: 'medium',
          message: this.getSearchGuidance(),
          icon: 'search'
        };

      case 'explore':
        return {
          type: 'suggestion',
          priority: 'low',
          message: this.getExplorationGuidance(),
          icon: 'compass'
        };

      case 'exit':
        return {
          type: 'alert',
          priority: 'high',
          message: 'You seem to be heading toward the exit. Have you found everything?',
          icon: 'alert-circle'
        };
    }

    return null;
  }

  /**
   * Predict the next likely destination
   */
  predictNextDestination(currentWaypoint: RouteWaypoint): RouteWaypoint | null {
    if (!this.currentRoute) return null;

    const remainingWaypoints = this.currentRoute.waypoints.filter(
      wp => !wp.completed && !wp.skipped && wp.id !== currentWaypoint.id
    );

    if (remainingWaypoints.length === 0) return null;

    // Score each potential next destination
    const scoredDestinations = remainingWaypoints.map(wp => ({
      waypoint: wp,
      score: this.scoreDestination(wp, currentWaypoint)
    }));

    scoredDestinations.sort((a, b) => b.score - a.score);

    return scoredDestinations[0]?.waypoint || null;
  }

  /**
   * Detect if the customer is hesitating at a location
   */
  private detectHesitation(): void {
    if (this.behavior.pathHistory.length < 5) return;

    const recent = this.behavior.pathHistory.slice(-5);
    const variance = this.calculatePositionVariance(recent);

    if (variance < 0.5 && !this.currentPosition?.isMoving) {
      const hesitationPoint = this.currentPosition?.position;
      if (hesitationPoint) {
        this.hesitationPoints.push(hesitationPoint);
        this.behavior.hesitationPoints.push(hesitationPoint);

        // Record hesitation event
        this.recordInteraction({
          id: `hesitation-${Date.now()}`,
          type: 'hesitate',
          timestamp: Date.now(),
          position: hesitationPoint,
          zoneId: this.currentPosition?.zoneId,
          duration: this.config.hesitationThreshold
        });
      }
    }
  }

  /**
   * Generate intent prediction based on current state
   */
  private generatePrediction(): IntentPrediction {
    const factors: string[] = [];
    let intent: IntentPrediction['intent'] = 'continue';
    let confidence = 0.5;
    let urgency: IntentPrediction['urgency'] = 'low';
    let predictedNextZone: string | undefined;
    let predictedNextProduct: string | undefined;

    // Check for hesitation
    if (this.hesitationPoints.length > 0) {
      const lastHesitation = this.hesitationPoints[this.hesitationPoints.length - 1];
      const timeSinceHesitation = Date.now() - (this.behavior.interactionHistory.find(
        e => e.type === 'hesitate' && e.position.x === lastHesitation.x
      )?.timestamp || 0);

      if (timeSinceHesitation < this.config.predictionWindow) {
        intent = 'hesitate';
        confidence = 0.7;
        factors.push('recent hesitation detected');
      }
    }

    // Check for search patterns
    const recentSearches = this.behavior.searchQueries.slice(-3);
    if (recentSearches.length > 0) {
      const lastSearch = recentSearches[recentSearches.length - 1];
      intent = 'search';
      confidence = 0.75;
      factors.push(`recent search: "${lastSearch}"`);
      urgency = 'medium';
    }

    // Check for exploration pattern
    const walkingPattern = this.behavior.walkingPattern;
    if (walkingPattern === 'wandering' || walkingPattern === 'browsing') {
      intent = 'explore';
      confidence = 0.6;
      factors.push(`${walkingPattern} walking pattern`);
    }

    // Check for exit intent
    if (this.detectExitIntent()) {
      intent = 'exit';
      confidence = 0.65;
      factors.push('heading toward exit');
      urgency = 'high';
    }

    // Predict next zone based on affinities
    const topAffinity = this.getTopZoneAffinity();
    if (topAffinity && confidence > 0.5) {
      predictedNextZone = topAffinity.zoneId;
      factors.push(`high affinity for zone ${topAffinity.zoneId}`);
    }

    return {
      intent,
      confidence,
      predictedNextZone,
      predictedNextProduct,
      urgency,
      suggestedAction: this.getSuggestedAction(intent, confidence),
      factors
    };
  }

  /**
   * Detect if customer appears to be heading toward exit
   */
  private detectExitIntent(): boolean {
    if (this.behavior.pathHistory.length < 3) return false;

    const recent = this.behavior.pathHistory.slice(-5);
    const direction = this.calculateOverallDirection(recent);
    
    // Check if moving consistently in one direction away from center
    const variance = this.calculateDirectionVariance(recent);
    
    return variance < 30 && this.isHeadingTowardExit(direction);
  }

  /**
   * Update walking pattern based on path history
   */
  private updateWalkingPattern(): void {
    if (this.behavior.pathHistory.length < 10) return;

    const recent = this.behavior.pathHistory.slice(-10);
    const pathVariance = this.calculatePositionVariance(recent);
    const speedVariance = this.calculateSpeedVariance(recent);

    if (pathVariance < 2 && speedVariance < 0.5) {
      this.behavior.walkingPattern = 'direct';
    } else if (pathVariance > 10 && speedVariance > 0.3) {
      this.behavior.walkingPattern = 'wandering';
    } else if (pathVariance > 5) {
      this.behavior.walkingPattern = 'browsing';
    } else if (speedVariance < 0.2) {
      this.behavior.walkingPattern = 'searching';
    }
  }

  /**
   * Update zone affinity based on dwell time
   */
  private updateZoneAffinity(zoneId: string, dwellTime: number): void {
    const existing = this.zoneAffinities.get(zoneId);
    
    if (existing) {
      existing.visitCount++;
      existing.totalDwellTime += dwellTime;
      existing.lastVisit = Date.now();
      existing.score = this.calculateAffinityScore(existing);
    } else {
      this.zoneAffinities.set(zoneId, {
        zoneId,
        score: dwellTime / 1000,
        visitCount: 1,
        totalDwellTime: dwellTime,
        lastVisit: Date.now()
      });
    }
  }

  /**
   * Calculate affinity score for a zone
   */
  private calculateAffinityScore(affinity: ZoneAffinity): number {
    const recencyWeight = Math.exp(-(Date.now() - affinity.lastVisit) / 3600000);
    const frequencyWeight = Math.log1p(affinity.visitCount);
    const dwellWeight = Math.log1p(affinity.totalDwellTime / 1000);

    return (recencyWeight * 0.4 + frequencyWeight * 0.3 + dwellWeight * 0.3);
  }

  /**
   * Get zone with highest affinity
   */
  private getTopZoneAffinity(): ZoneAffinity | null {
    let top: ZoneAffinity | null = null;
    
    for (const affinity of this.zoneAffinities.values()) {
      if (!top || affinity.score > top.score) {
        top = affinity;
      }
    }

    return top;
  }

  /**
   * Score a potential destination
   */
  private scoreDestination(waypoint: RouteWaypoint, current: RouteWaypoint): number {
    let score = 0;

    // Distance score (closer is better)
    const distance = this.calculateDistance(current.position, waypoint.position);
    score += Math.max(0, 100 - distance);

    // Zone affinity score
    if (waypoint.zoneId) {
      const affinity = this.zoneAffinities.get(waypoint.zoneId);
      if (affinity) {
        score += affinity.score * 10;
      }
    }

    // Priority score
    score += waypoint.priority * 5;

    return score;
  }

  /**
   * Get guidance message for hesitation
   */
  private getHesitationGuidance(): string {
    const messages = [
      'Looking for something specific? Try searching for it.',
      'Need help? Check the store map or ask a staff member.',
      'Can\'t find what you\'re looking for? I can suggest alternatives.',
      'Take your time! Would you like to see related products?'
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Get guidance for search intent
   */
  private getSearchGuidance(): string {
    const recentSearches = this.behavior.searchQueries.slice(-1);
    if (recentSearches.length > 0) {
      return `Looking for "${recentSearches[0]}"? It's in the next zone.`;
    }
    return 'Follow the highlighted path to your next item.';
  }

  /**
   * Get guidance for exploration mode
   */
  private getExplorationGuidance(): string {
    const topZone = this.getTopZoneAffinity();
    if (topZone) {
      return `You seem to enjoy that area! Similar items are nearby.`;
    }
    return 'Discover new products in this section!';
  }

  /**
   * Get suggested action based on intent
   */
  private getSuggestedAction(intent: IntentPrediction['intent'], confidence: number): string {
    if (confidence < 0.5) return 'continue';

    switch (intent) {
      case 'hesitate':
        return 'offer-help';
      case 'search':
        return 'provide-directions';
      case 'explore':
        return 'show-discoveries';
      case 'exit':
        return 'confirm-completion';
      default:
        return 'continue';
    }
  }

  // Utility methods
  private calculatePositionVariance(positions: CustomerPosition[]): number {
    if (positions.length < 2) return 0;

    const meanX = positions.reduce((sum, p) => sum + p.position.x, 0) / positions.length;
    const meanY = positions.reduce((sum, p) => sum + p.position.y, 0) / positions.length;

    const variance = positions.reduce((sum, p) => {
      return sum + Math.pow(p.position.x - meanX, 2) + Math.pow(p.position.y - meanY, 2);
    }, 0) / positions.length;

    return Math.sqrt(variance);
  }

  private calculateSpeedVariance(positions: CustomerPosition[]): number {
    if (positions.length < 2) return 0;

    const speeds = positions.map(p => Math.sqrt(p.velocity.x ** 2 + p.velocity.y ** 2));
    const meanSpeed = speeds.reduce((sum, s) => sum + s, 0) / speeds.length;

    const variance = speeds.reduce((sum, s) => sum + Math.pow(s - meanSpeed, 2), 0) / speeds.length;
    return Math.sqrt(variance);
  }

  private calculateOverallDirection(positions: CustomerPosition[]): number {
    if (positions.length < 2) return 0;

    const start = positions[0];
    const end = positions[positions.length - 1];

    return Math.atan2(end.position.y - start.position.y, end.position.x - start.position.x) * (180 / Math.PI);
  }

  private calculateDirectionVariance(positions: CustomerPosition[]): number {
    if (positions.length < 2) return 360;

    const directions: number[] = [];
    for (let i = 1; i < positions.length; i++) {
      const dir = Math.atan2(
        positions[i].position.y - positions[i - 1].position.y,
        positions[i].position.x - positions[i - 1].position.x
      ) * (180 / Math.PI);
      directions.push(dir);
    }

    const meanDir = directions.reduce((sum, d) => sum + d, 0) / directions.length;
    const variance = directions.reduce((sum, d) => sum + Math.pow(d - meanDir, 2), 0) / directions.length;

    return Math.sqrt(variance);
  }

  private isHeadingTowardExit(direction: number): boolean {
    // Simplified: assume exit is generally toward negative x
    return direction > 90 || direction < -90;
  }

  private calculateDistance(a: Vector2, b: Vector2): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }

  /**
   * Get current behavior analysis
   */
  getBehaviorAnalysis(): CustomerBehavior {
    return { ...this.behavior };
  }

  /**
   * Get prediction history
   */
  getPredictionHistory(): IntentPrediction[] {
    return [...this.predictionHistory];
  }

  /**
   * Reset the model
   */
  reset(): void {
    this.behavior = {
      dwellTimeByZone: new Map(),
      viewTimeByProduct: new Map(),
      pathHistory: [],
      interactionHistory: [],
      searchQueries: [],
      hesitationPoints: [],
      preferredCategories: [],
      walkingPattern: 'direct'
    };
    this.zoneAffinities.clear();
    this.hesitationPoints = [];
    this.lastPrediction = null;
    this.predictionHistory = [];
    this.currentPosition = null;
    this.currentRoute = null;
  }
}

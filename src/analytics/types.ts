import type { Vector2 } from '@core/spatial/types';

export type AnalyticsEventType =
  | 'zone_visit'
  | 'zone_exit'
  | 'product_view'
  | 'product_pickup'
  | 'search'
  | 'recommendation_shown'
  | 'recommendation_clicked'
  | 'route_started'
  | 'route_completed'
  | 'purchase'
  | 'dwell'
  | 'movement';

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  timestamp: number;
  sessionId: string;
  customerId: string;
  zoneId?: string;
  productId?: string;
  position?: Vector2;
  metadata?: Record<string, unknown>;
}

export interface ZoneVisitEvent extends AnalyticsEvent {
  type: 'zone_visit' | 'zone_exit';
  zoneId: string;
  dwellTime?: number;
  entryPosition: Vector2;
  exitPosition?: Vector2;
}

export interface ProductInteractionEvent extends AnalyticsEvent {
  type: 'product_view' | 'product_pickup';
  productId: string;
  zoneId: string;
  duration?: number;
}

export interface SearchEvent extends AnalyticsEvent {
  type: 'search';
  query: string;
  resultsCount: number;
  clickedProductId?: string;
}

export interface RecommendationEvent extends AnalyticsEvent {
  type: 'recommendation_shown' | 'recommendation_clicked';
  recommendationId: string;
  recommendationType: string;
  confidence: number;
}

export interface RouteEvent extends AnalyticsEvent {
  type: 'route_started' | 'route_completed';
  routeId: string;
  waypoints: string[];
  estimatedTime: number;
  actualTime?: number;
  efficiency?: number;
}

export interface PurchaseEvent extends AnalyticsEvent {
  type: 'purchase';
  items: Array<{ productId: string; quantity: number; price: number }>;
  totalAmount: number;
  zonesVisited: string[];
}

export interface DwellEvent extends AnalyticsEvent {
  type: 'dwell';
  zoneId: string;
  duration: number;
  position: Vector2;
}

export interface MovementEvent extends AnalyticsEvent {
  type: 'movement';
  path: Vector2[];
  speed: number;
  distance: number;
}

export interface SessionAnalytics {
  sessionId: string;
  customerId: string;
  startTime: number;
  endTime?: number;
  zonesVisited: string[];
  productsViewed: string[];
  productsPickedUp: string[];
  searchQueries: string[];
  recommendationsShown: number;
  recommendationsClicked: number;
  routeEfficiency: number;
  totalDwellTime: number;
  purchaseAmount?: number;
  completed: boolean;
}

export interface ZoneMetrics {
  zoneId: string;
  visitCount: number;
  uniqueVisitors: number;
  totalDwellTime: number;
  averageDwellTime: number;
  conversionRate: number;
  productsViewed: number;
  productsPickedUp: number;
  heatmapData: HeatmapCell[];
  peakHours: Array<{ hour: number; visits: number }>;
  coldZone: boolean;
}

export interface HeatmapCell {
  x: number;
  y: number;
  intensity: number;
  visitCount: number;
  averageDwellTime: number;
}

export interface BehavioralMetrics {
  totalSessions: number;
  averageSessionDuration: number;
  averageZonesVisited: number;
  searchToPurchaseRate: number;
  recommendationClickRate: number;
  averageRouteEfficiency: number;
  abandonmentRate: number;
  peakShoppingHours: Array<{ hour: number; sessions: number }>;
}

export interface TimeSeriesData {
  timestamp: number;
  value: number;
  label?: string;
}

export interface FunnelStage {
  name: string;
  count: number;
  percentage: number;
  dropOff: number;
}

export interface FunnelAnalytics {
  stages: FunnelStage[];
  totalConversion: number;
  averageTimeToConvert: number;
}

export interface AIRecommendationMetrics {
  totalShown: number;
  totalClicked: number;
  clickThroughRate: number;
  averageConfidence: number;
  conversionRate: number;
  topPerformingTypes: Array<{ type: string; rate: number }>;
  performanceByZone: Array<{ zoneId: string; rate: number }>;
}

export interface PredictiveMetrics {
  nextZonePrediction: {
    zoneId: string;
    probability: number;
  };
  abandonmentProbability: number;
  estimatedTimeToCheckout: number;
  recommendedActions: string[];
}

export interface ExportData {
  sessions: SessionAnalytics[];
  events: AnalyticsEvent[];
  zoneMetrics: ZoneMetrics[];
  behavioralMetrics: BehavioralMetrics;
  generatedAt: number;
}

export interface AnalyticsStreamConfig {
  bufferSize: number;
  flushInterval: number;
  enableRealtime: boolean;
}

export interface AnalyticsSubscriber {
  id: string;
  callback: (events: AnalyticsEvent[]) => void;
  filter?: (event: AnalyticsEvent) => boolean;
}

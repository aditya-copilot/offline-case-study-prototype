import type { Vector2 } from '@core/spatial/types';
import type { StoreZone, ShoppingListItem, Product } from '@core/types';
import type { OptimizedRoute } from '@navigation/path-engine';
import type { AIRecommendation } from '@ai';
import type { PlayerProfile, Mission } from '@gamification';

export type BrainSignalType =
  | 'ble_detected'
  | 'zone_changed'
  | 'position_updated'
  | 'route_calculated'
  | 'recommendation_generated'
  | 'mission_completed'
  | 'product_found'
  | 'search_performed'
  | 'ui_interaction'
  | 'engagement_update'
  | 'system_health';

export interface BrainSignal {
  id: string;
  type: BrainSignalType;
  timestamp: number;
  source: string;
  data: unknown;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

export interface RetailSessionContext {
  sessionId: string;
  customerId: string;
  startedAt: number;
  
  location: {
    currentZone?: StoreZone;
    position: Vector2;
    accuracy: number;
    lastUpdated: number;
  };
  
  navigation: {
    currentRoute?: OptimizedRoute;
    destination?: string;
    progress: number;
    estimatedArrival?: number;
    deviationCount: number;
  };
  
  shopping: {
    list: ShoppingListItem[];
    collected: string[];
    remaining: string[];
    completionRate: number;
  };
  
  ai: {
    activeRecommendations: AIRecommendation[];
    lastRecommendationTime?: number;
    recommendationAcceptanceRate: number;
  };
  
  gamification: {
    profile: PlayerProfile;
    activeMissions: Mission[];
    currentEnergy: number;
    engagementScore: number;
  };
  
  analytics: {
    zonesVisited: string[];
    totalDwellTime: number;
    productsViewed: string[];
    searchQueries: string[];
    interactionCount: number;
  };
  
  ui: {
    currentScreen: string;
    theme: string;
    lastInteraction: number;
    interactionFrequency: number;
  };
}

export interface DecisionContext {
  timestamp: number;
  context: RetailSessionContext;
  signals: BrainSignal[];
  predictions: Predictions;
  memory: MemorySnapshot;
}

export interface Predictions {
  nextZone: {
    zoneId: string;
    probability: number;
    confidence: number;
  };
  abandonmentRisk: {
    level: 'low' | 'medium' | 'high';
    probability: number;
    factors: string[];
  };
  intentEvolution: {
    current: string;
    trend: 'shopping' | 'browsing' | 'searching' | 'exiting';
    confidence: number;
  };
  engagementFatigue: {
    score: number;
    threshold: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  purchaseLikelihood: {
    probability: number;
    estimatedTime?: number;
  };
}

export interface MemorySnapshot {
  session: SessionMemory;
  behavioral: BehavioralMemory;
  zone: ZoneFamiliarity;
  recommendation: RecommendationMemory;
  progression: ProgressionMemory;
}

export interface SessionMemory {
  entryPoint: Vector2;
  pathHistory: Vector2[];
  zoneTransitions: Array<{ from: string; to: string; timestamp: number }>;
  decisions: Array<{ type: string; timestamp: number; reason: string }>;
}

export interface BehavioralMemory {
  typicalPathPatterns: string[];
  preferredZones: Map<string, number>;
  shoppingStyle: 'direct' | 'browsing' | 'research';
  timeOfDayPreference: number;
  dwellTimeAverage: number;
}

export interface ZoneFamiliarity {
  zoneVisits: Map<string, number>;
  masteryLevels: Map<string, number>;
  preferredRoutes: Map<string, string[]>;
  lastVisit: Map<string, number>;
}

export interface RecommendationMemory {
  shownRecommendations: string[];
  clickedRecommendations: string[];
  successRate: number;
  categoryAffinity: Map<string, number>;
}

export interface ProgressionMemory {
  totalSessions: number;
  totalXpEarned: number;
  achievementsUnlocked: string[];
  missionSuccessRate: number;
}

export interface Decision {
  id: string;
  type: 'route_recalculation' | 'recommendation_trigger' | 'gamification_adjustment' | 'ui_adaptation' | 'guidance_escalation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  reason: string;
  action: () => void;
  confidence: number;
  expectedOutcome: string;
}

export interface SystemHealth {
  timestamp: number;
  modules: Map<string, ModuleHealth>;
  overallStatus: 'healthy' | 'degraded' | 'critical';
  signalConfidence: number;
  cycleTime: number;
  memoryUsage: number;
}

export interface ModuleHealth {
  name: string;
  status: 'online' | 'degraded' | 'offline';
  lastPing: number;
  latency: number;
  errorCount: number;
}

export interface Explanation {
  id: string;
  timestamp: number;
  type: 'route' | 'recommendation' | 'mission' | 'adaptation';
  title: string;
  description: string;
  reasoning: string[];
  confidence: number;
  alternatives?: string[];
}

export interface AdaptationState {
  routeDifficulty: 'easy' | 'normal' | 'challenging';
  recommendationAggressiveness: 'passive' | 'balanced' | 'proactive';
  gamificationIntensity: 'subtle' | 'engaging' | 'intense';
  uiComplexity: 'minimal' | 'standard' | 'advanced';
  hintFrequency: 'rare' | 'occasional' | 'frequent';
}

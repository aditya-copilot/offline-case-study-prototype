import type { Product, StoreZone, ShoppingListItem } from '@core/types';
import type { Vector2 } from '@core/spatial/types';

export type AIPersonality = 'budget' | 'health' | 'premium' | 'quick' | 'explorer';

export type RecommendationType = 
  | 'product' 
  | 'bundle' 
  | 'navigation' 
  | 'insight' 
  | 'reminder' 
  | 'discovery';

export interface AIRecommendation {
  id: string;
  type: RecommendationType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  confidence: number;
  title: string;
  description: string;
  products?: Product[];
  bundle?: ProductBundle;
  navigationHint?: NavigationHint;
  insight?: BehavioralInsight;
  reasoning: ReasoningChain;
  expiresAt: number;
  triggeredAt: number;
  context: RecommendationContext;
}

export interface ProductBundle {
  id: string;
  name: string;
  products: Product[];
  totalPrice: number;
  savings: number;
  reasoning: string;
}

export interface NavigationHint {
  type: 'shortcut' | 'detour' | 'alert';
  message: string;
  targetZoneId?: string;
  targetProductId?: string;
  estimatedTime?: number;
}

export interface BehavioralInsight {
  category: 'pattern' | 'trend' | 'anomaly' | 'opportunity';
  observation: string;
  implication: string;
  suggestedAction: string;
}

export interface ReasoningChain {
  steps: ReasoningStep[];
  overallConfidence: number;
  primaryFactors: string[];
  evidence: EvidenceItem[];
}

export interface ReasoningStep {
  id: string;
  description: string;
  input: unknown;
  output: unknown;
  confidence: number;
  timestamp: number;
}

export interface EvidenceItem {
  type: 'behavioral' | 'contextual' | 'seasonal' | 'trend' | 'personal';
  description: string;
  weight: number;
  data: unknown;
}

export interface RecommendationContext {
  currentZoneId?: string;
  shoppingList: ShoppingListItem[];
  searchHistory: string[];
  movementPattern: MovementPattern;
  timeInZones: Map<string, number>;
  sessionDuration: number;
  timeOfDay: string;
  dayOfWeek: string;
  seasonalContext: string;
  behavioralSignals: BehavioralSignal[];
}

export interface MovementPattern {
  path: Vector2[];
  speed: number;
  direction: number;
  hesitationPoints: Vector2[];
  pattern: 'direct' | 'wandering' | 'browsing' | 'searching';
}

export interface BehavioralSignal {
  type: 'dwell' | 'return' | 'skip' | 'search' | 'view' | 'hesitate';
  zoneId?: string;
  productId?: string;
  timestamp: number;
  intensity: number;
  metadata?: Record<string, unknown>;
}

export interface PromptContext {
  customerProfile: CustomerProfile;
  currentSession: SessionContext;
  storeContext: StoreContext;
  productContext: ProductContext;
  temporalContext: TemporalContext;
  behavioralContext: BehavioralContext;
}

export interface CustomerProfile {
  id: string;
  personality: AIPersonality;
  preferences: PreferenceProfile;
  shoppingHistory: ShoppingHistory;
  affinityScores: Map<string, number>;
}

export interface PreferenceProfile {
  priceSensitivity: number;
  brandLoyalty: number;
  qualityPriority: number;
  conveniencePriority: number;
  sustainabilityConcern: number;
  healthConsciousness: number;
  preferredCategories: string[];
  dislikedCategories: string[];
}

export interface ShoppingHistory {
  totalVisits: number;
  averageBasketSize: number;
  favoriteZones: string[];
  frequentProducts: string[];
  lastVisitDate?: number;
  typicalVisitDuration: number;
}

export interface SessionContext {
  sessionId: string;
  startedAt: number;
  currentZone?: string;
  position?: Vector2;
  shoppingList: ShoppingListItem[];
  collectedItems: string[];
  skippedItems: string[];
  searchQueries: string[];
  viewedProducts: string[];
}

export interface StoreContext {
  layout: StoreZone[];
  currentCrowdLevel: 'low' | 'medium' | 'high';
  activePromotions: Promotion[];
  zoneMetadata: ZoneMetadata[];
}

export interface ZoneMetadata {
  zoneId: string;
  crowdLevel: number;
  averageDwellTime: number;
  popularProducts: string[];
  complementaryZones: string[];
}

export interface Promotion {
  id: string;
  type: 'discount' | 'bundle' | 'loyalty' | 'seasonal';
  productIds: string[];
  description: string;
  validUntil: number;
}

export interface ProductContext {
  availableProducts: Product[];
  trendingProducts: string[];
  complementaryProducts: Map<string, string[]>;
  substituteProducts: Map<string, string[]>;
}

export interface TemporalContext {
  timestamp: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
  isWeekend: boolean;
  isHoliday: boolean;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
}

export interface BehavioralContext {
  sessionPatterns: BehavioralSignal[];
  zoneTransitions: ZoneTransition[];
  interestIndicators: InterestIndicator[];
  fatigueScore: number;
  urgencyScore: number;
}

export interface ZoneTransition {
  fromZoneId: string;
  toZoneId: string;
  timestamp: number;
  dwellTime: number;
}

export interface InterestIndicator {
  productId: string;
  signals: BehavioralSignal[];
  combinedScore: number;
}

export interface AIReasoningRequest {
  prompt: string;
  context: PromptContext;
  constraints?: ReasoningConstraints;
}

export interface ReasoningConstraints {
  maxRecommendations: number;
  minConfidence: number;
  preferredTypes: RecommendationType[];
  excludedCategories: string[];
  maxPrice?: number;
}

export interface AIReasoningResponse {
  recommendations: AIRecommendation[];
  reasoningSummary: string;
  confidence: number;
  processingTime: number;
  modelUsed: string;
}

export interface LLMAdapter {
  generateRecommendations(request: AIReasoningRequest): Promise<AIReasoningResponse>;
  generateExplanation(recommendation: AIRecommendation): Promise<string>;
  estimateConfidence(prompt: string): Promise<number>;
}

export interface AICacheEntry {
  key: string;
  recommendations: AIRecommendation[];
  context: PromptContext;
  createdAt: number;
  expiresAt: number;
  hitCount: number;
}

export interface PredictionResult {
  predictedIntent: string;
  confidence: number;
  possibleNextProducts: string[];
  forgottenItems: string[];
  shortcutPath?: string[];
}

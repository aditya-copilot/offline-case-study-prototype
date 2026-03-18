import type {
  PromptContext,
  CustomerProfile,
  SessionContext,
  StoreContext,
  ProductContext,
  TemporalContext,
  BehavioralContext,
  AIPersonality,
  PreferenceProfile,
  ShoppingHistory,
  MovementPattern,
  BehavioralSignal,
  ZoneTransition,
  InterestIndicator
} from '../types';
import type { Product, ShoppingListItem, StoreZone } from '@core/types';
import type { Vector2 } from '@core/spatial/types';

interface ContextBuilderConfig {
  defaultPersonality: AIPersonality;
  signalHistorySize: number;
  sessionTimeout: number;
}

export class ContextBuilder {
  private config: ContextBuilderConfig;
  private sessionSignals: BehavioralSignal[] = [];
  private zoneTransitions: ZoneTransition[] = [];
  private viewedProducts: Set<string> = new Set();
  private searchQueries: string[] = [];

  constructor(config: Partial<ContextBuilderConfig> = {}) {
    this.config = {
      defaultPersonality: 'explorer',
      signalHistorySize: 100,
      sessionTimeout: 30 * 60 * 1000,
      ...config
    };
  }

  async buildContext(
    customerId: string,
    currentZoneId: string | undefined,
    position: Vector2 | undefined,
    shoppingList: ShoppingListItem[],
    storeZones: StoreZone[],
    products: Product[]
  ): Promise<PromptContext> {
    const now = Date.now();

    return {
      customerProfile: await this.buildCustomerProfile(customerId),
      currentSession: this.buildSessionContext(currentZoneId, position, shoppingList, now),
      storeContext: this.buildStoreContext(storeZones),
      productContext: this.buildProductContext(products),
      temporalContext: this.buildTemporalContext(now),
      behavioralContext: this.buildBehavioralContext(now)
    };
  }

  private async buildCustomerProfile(customerId: string): Promise<CustomerProfile> {
    const prefs: PreferenceProfile = {
      priceSensitivity: 0.6,
      brandLoyalty: 0.5,
      qualityPriority: 0.7,
      conveniencePriority: 0.5,
      sustainabilityConcern: 0.6,
      healthConsciousness: 0.7,
      preferredCategories: ['grocery', 'pharmacy'],
      dislikedCategories: []
    };

    const history: ShoppingHistory = {
      totalVisits: 24,
      averageBasketSize: 67.50,
      favoriteZones: ['grocery', 'pharmacy'],
      frequentProducts: ['prod-001', 'prod-002', 'prod-003'],
      lastVisitDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
      typicalVisitDuration: 1800
    };

    const affinities = new Map<string, number>([
      ['grocery', 0.92],
      ['pharmacy', 0.75],
      ['electronics', 0.15],
      ['clothing', 0.30],
      ['home', 0.45]
    ]);

    return {
      id: customerId,
      personality: this.config.defaultPersonality,
      preferences: prefs,
      shoppingHistory: history,
      affinityScores: affinities
    };
  }

  private buildSessionContext(
    currentZoneId: string | undefined,
    position: Vector2 | undefined,
    shoppingList: ShoppingListItem[],
    now: number
  ): SessionContext {
    return {
      sessionId: `sess-${now}`,
      startedAt: now,
      currentZone: currentZoneId,
      position,
      shoppingList,
      collectedItems: [],
      skippedItems: [],
      searchQueries: [...this.searchQueries],
      viewedProducts: Array.from(this.viewedProducts)
    };
  }

  private buildStoreContext(storeZones: StoreZone[]): StoreContext {
    const zoneMetadata = storeZones.map(zone => ({
      zoneId: zone.id,
      crowdLevel: Math.random() * 0.5,
      averageDwellTime: 600 + Math.random() * 1200,
      popularProducts: zone.products?.slice(0, 3).map(p => p.id) || [],
      complementaryZones: this.findComplementaryZones(zone.id, storeZones)
    }));

    return {
      layout: storeZones,
      currentCrowdLevel: 'medium',
      activePromotions: [
        {
          id: 'promo-1',
          type: 'discount',
          productIds: ['prod-002', 'prod-012'],
          description: '15% off organic produce',
          validUntil: Date.now() + 7 * 24 * 60 * 60 * 1000
        }
      ],
      zoneMetadata
    };
  }

  private findComplementaryZones(zoneId: string, allZones: StoreZone[]): string[] {
    const complements: Record<string, string[]> = {
      'grocery': ['pharmacy', 'home'],
      'electronics': ['clothing', 'home'],
      'clothing': ['electronics', 'home'],
      'pharmacy': ['grocery'],
      'home': ['grocery', 'clothing']
    };
    return complements[zoneId] || [];
  }

  private buildProductContext(products: Product[]): ProductContext {
    const trending = products
      .filter(p => p.rating >= 4.5 && p.reviewCount > 50)
      .map(p => p.id)
      .slice(0, 5);

    const complementary = new Map<string, string[]>();
    const substitutes = new Map<string, string[]>();

    for (const product of products) {
      if (product.complementaryProducts) {
        complementary.set(product.id, product.complementaryProducts);
      }
    }

    return {
      availableProducts: products,
      trendingProducts: trending,
      complementaryProducts: complementary,
      substituteProducts: substitutes
    };
  }

  private buildTemporalContext(now: number): TemporalContext {
    const date = new Date(now);
    const hour = date.getHours();
    
    let timeOfDay: TemporalContext['timeOfDay'];
    if (hour < 12) timeOfDay = 'morning';
    else if (hour < 17) timeOfDay = 'afternoon';
    else if (hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';

    const month = date.getMonth();
    let season: TemporalContext['season'];
    if (month < 2 || month > 10) season = 'winter';
    else if (month < 5) season = 'spring';
    else if (month < 8) season = 'summer';
    else season = 'autumn';

    return {
      timestamp: now,
      timeOfDay,
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      isHoliday: false,
      season
    };
  }

  private buildBehavioralContext(now: number): BehavioralContext {
    const recentSignals = this.sessionSignals.slice(-20);
    
    const fatigueScore = this.calculateFatigueScore(recentSignals);
    const urgencyScore = this.calculateUrgencyScore(recentSignals);

    const interestIndicators = this.buildInterestIndicators(recentSignals);

    return {
      sessionPatterns: recentSignals,
      zoneTransitions: this.zoneTransitions.slice(-10),
      interestIndicators,
      fatigueScore,
      urgencyScore
    };
  }

  private calculateFatigueScore(signals: BehavioralSignal[]): number {
    if (signals.length === 0) return 0;
    
    const dwellCount = signals.filter(s => s.type === 'dwell').length;
    const hesitationCount = signals.filter(s => s.type === 'hesitate').length;
    
    return Math.min(1, (dwellCount * 0.1) + (hesitationCount * 0.2));
  }

  private calculateUrgencyScore(signals: BehavioralSignal[]): number {
    const searchCount = signals.filter(s => s.type === 'search').length;
    return Math.min(1, searchCount * 0.15);
  }

  private buildInterestIndicators(signals: BehavioralSignal[]): InterestIndicator[] {
    const productSignals = new Map<string, BehavioralSignal[]>();
    
    for (const signal of signals) {
      if (signal.productId) {
        const existing = productSignals.get(signal.productId) || [];
        existing.push(signal);
        productSignals.set(signal.productId, existing);
      }
    }

    return Array.from(productSignals.entries())
      .map(([productId, sigs]) => ({
        productId,
        signals: sigs,
        combinedScore: Math.min(1, sigs.reduce((sum, s) => sum + s.intensity, 0) / 3)
      }))
      .sort((a, b) => b.combinedScore - a.combinedScore);
  }

  recordSignal(signal: BehavioralSignal): void {
    this.sessionSignals.push(signal);
    
    if (this.sessionSignals.length > this.config.signalHistorySize) {
      this.sessionSignals = this.sessionSignals.slice(-this.config.signalHistorySize);
    }

    if (signal.productId) {
      this.viewedProducts.add(signal.productId);
    }
  }

  recordZoneTransition(fromZoneId: string, toZoneId: string, dwellTime: number): void {
    this.zoneTransitions.push({
      fromZoneId,
      toZoneId,
      timestamp: Date.now(),
      dwellTime
    });
  }

  recordSearch(query: string): void {
    this.searchQueries.push(query);
    if (this.searchQueries.length > 20) {
      this.searchQueries = this.searchQueries.slice(-20);
    }
  }

  reset(): void {
    this.sessionSignals = [];
    this.zoneTransitions = [];
    this.viewedProducts.clear();
    this.searchQueries = [];
  }
}

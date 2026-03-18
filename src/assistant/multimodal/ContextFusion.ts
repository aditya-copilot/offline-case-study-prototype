import type { AssistantContext, MultimodalInput, ReasoningResult } from '../types';

interface LocationContext {
  zoneId?: string;
  zoneName?: string;
  position?: { x: number; y: number };
  confidence: number;
}

interface BrowsingContext {
  currentPage: string;
  viewedVehicles: string[];
  viewedCategories: string[];
  timeOnPage: number;
  scrollDepth: number;
}

interface BehavioralContext {
  searchQueries: string[];
  filterUsage: Record<string, unknown>;
  comparisonActions: string[];
  clickPatterns: string[];
}

interface FusedContext {
  location: LocationContext;
  browsing: BrowsingContext;
  behavioral: BehavioralContext;
  timestamp: number;
  sessionDuration: number;
}

export class ContextFusion {
  private static instance: ContextFusion;
  private currentContext: AssistantContext;
  private browsingHistory: BrowsingContext[] = [];
  private behavioralData: BehavioralContext;
  private sessionStartTime: number;
  private lastUpdateTime: number;

  private constructor() {
    this.sessionStartTime = Date.now();
    this.lastUpdateTime = Date.now();
    this.behavioralData = this.initializeBehavioralContext();
    this.currentContext = this.initializeContext();
  }

  static getInstance(): ContextFusion {
    if (!ContextFusion.instance) {
      ContextFusion.instance = new ContextFusion();
    }
    return ContextFusion.instance;
  }

  private initializeContext(): AssistantContext {
    return {
      viewedVehicles: [],
      searchHistory: [],
      intent: 'general-chat',
      confidence: 1.0,
      sessionDuration: 0,
      userPreferences: {
        preferredBrands: [],
        priorityFeatures: []
      }
    };
  }

  private initializeBehavioralContext(): BehavioralContext {
    return {
      searchQueries: [],
      filterUsage: {},
      comparisonActions: [],
      clickPatterns: []
    };
  }

  updateLocation(zoneId?: string, zoneName?: string, position?: { x: number; y: number }, confidence = 1.0): void {
    this.currentContext.currentZone = zoneId;
    this.lastUpdateTime = Date.now();
  }

  updateBrowsing(page: string, scrollDepth = 0): void {
    const browsingContext: BrowsingContext = {
      currentPage: page,
      viewedVehicles: this.currentContext.viewedVehicles,
      viewedCategories: this.inferCategoriesFromVehicles(this.currentContext.viewedVehicles),
      timeOnPage: Date.now() - this.lastUpdateTime,
      scrollDepth
    };

    this.browsingHistory.push(browsingContext);
    if (this.browsingHistory.length > 50) {
      this.browsingHistory.shift();
    }

    this.lastUpdateTime = Date.now();
  }

  recordVehicleView(vehicleId: string): void {
    if (!this.currentContext.viewedVehicles.includes(vehicleId)) {
      this.currentContext.viewedVehicles.push(vehicleId);
    }
    this.behavioralData.clickPatterns.push(`view:${vehicleId}`);
    this.lastUpdateTime = Date.now();
  }

  recordSearch(query: string): void {
    this.currentContext.searchHistory.push(query);
    this.behavioralData.searchQueries.push(query);

    if (this.currentContext.searchHistory.length > 20) {
      this.currentContext.searchHistory.shift();
    }

    this.analyzeSearchPatterns();
    this.lastUpdateTime = Date.now();
  }

  recordComparison(vehicleIds: string[]): void {
    this.behavioralData.comparisonActions.push(vehicleIds.join(','));
    this.lastUpdateTime = Date.now();
  }

  recordFilterUsage(filterType: string, value: unknown): void {
    if (!this.behavioralData.filterUsage[filterType]) {
      this.behavioralData.filterUsage[filterType] = [];
    }
    (this.behavioralData.filterUsage[filterType] as unknown[]).push(value);
    this.lastUpdateTime = Date.now();
  }

  fuseContext(input?: MultimodalInput): FusedContext {
    const now = Date.now();
    const sessionDuration = now - this.sessionStartTime;

    const locationContext: LocationContext = {
      zoneId: this.currentContext.currentZone,
      confidence: this.currentContext.confidence
    };

    const currentBrowsing = this.browsingHistory[this.browsingHistory.length - 1] ?? {
      currentPage: window.location.pathname,
      viewedVehicles: this.currentContext.viewedVehicles,
      viewedCategories: [],
      timeOnPage: 0,
      scrollDepth: 0
    };

    return {
      location: locationContext,
      browsing: currentBrowsing,
      behavioral: { ...this.behavioralData },
      timestamp: now,
      sessionDuration
    };
  }

  getEnhancedInput(originalInput: MultimodalInput): MultimodalInput {
    const fused = this.fuseContext(originalInput);

    return {
      ...originalInput,
      context: {
        ...this.currentContext,
        ...originalInput.context,
        sessionDuration: fused.sessionDuration
      }
    };
  }

  inferIntentFromContext(query: string): { intent: string; confidence: number } {
    const recentSearches = this.behavioralData.searchQueries.slice(-5);
    const recentViews = this.currentContext.viewedVehicles.slice(-3);

    const hasComparisonTerms = /compare|vs|versus|difference|better/i.test(query);
    const hasPriceTerms = /price|cost|emi|budget|affordable|cheap/i.test(query);
    const hasSpecTerms = /mileage|power|engine|specs|cc|torque/i.test(query);
    const hasLocationTerms = /where|locate|find|nearby|direction/i.test(query);

    if (hasComparisonTerms) {
      return { intent: 'comparison', confidence: 0.9 };
    }

    if (hasPriceTerms) {
      return { intent: 'financing', confidence: 0.85 };
    }

    if (hasSpecTerms) {
      return { intent: 'specs-query', confidence: 0.8 };
    }

    if (hasLocationTerms) {
      return { intent: 'navigation', confidence: 0.85 };
    }

    if (recentViews.length > 0 && /this|that|it/i.test(query)) {
      return { intent: 'feature-explanation', confidence: 0.75 };
    }

    if (recentSearches.length > 0) {
      const similarSearch = recentSearches.find((s) =>
        this.calculateSimilarity(s, query) > 0.6
      );
      if (similarSearch) {
        return { intent: 'follow-up', confidence: 0.7 };
      }
    }

    return { intent: 'general-chat', confidence: 0.5 };
  }

  private calculateSimilarity(a: string, b: string): number {
    const aWords = new Set(a.toLowerCase().split(/\s+/));
    const bWords = new Set(b.toLowerCase().split(/\s+/));

    const intersection = new Set([...aWords].filter((x) => bWords.has(x)));
    const union = new Set([...aWords, ...bWords]);

    return intersection.size / union.size;
  }

  private analyzeSearchPatterns(): void {
    const searches = this.behavioralData.searchQueries;
    const brandMentions: Record<string, number> = {};
    const priceRanges: number[] = [];

    for (const query of searches) {
      const brandMatch = query.match(/\b(hero|honda|tvs|bajaj|royal\s*enfield|yamaha|suzuki|ktm)\b/i);
      if (brandMatch) {
        const brand = brandMatch[1].toLowerCase().replace(/\s/g, '');
        brandMentions[brand] = (brandMentions[brand] ?? 0) + 1;
      }

      const priceMatch = query.match(/(\d+)\s*(k|thousand|lakh)?/i);
      if (priceMatch) {
        let price = parseInt(priceMatch[1]);
        if (priceMatch[2]?.toLowerCase().includes('lakh')) {
          price *= 100000;
        } else if (price < 100) {
          price *= 1000;
        }
        priceRanges.push(price);
      }
    }

    const preferredBrands = Object.entries(brandMentions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([brand]) => brand);

    if (preferredBrands.length > 0) {
      this.currentContext.userPreferences.preferredBrands = preferredBrands;
    }

    if (priceRanges.length > 0) {
      const avgPrice = priceRanges.reduce((a, b) => a + b, 0) / priceRanges.length;
      this.currentContext.userPreferences.budgetRange = {
        min: Math.min(...priceRanges),
        max: Math.max(avgPrice * 1.5, ...priceRanges)
      };
    }
  }

  private inferCategoriesFromVehicles(vehicleIds: string[]): string[] {
    const categories = new Set<string>();

    for (const id of vehicleIds) {
      if (id.includes('activa') || id.includes('jupiter') || id.includes('scooter')) {
        categories.add('scooter');
      }
      if (id.includes('classic') || id.includes('bullet')) {
        categories.add('cruiser');
      }
      if (id.includes('duke') || id.includes('rtr') || id.includes('apache')) {
        categories.add('sports');
      }
      if (id.includes('electric') || id.includes('ola') || id.includes('ather')) {
        categories.add('electric');
      }
    }

    return Array.from(categories);
  }

  getCurrentContext(): AssistantContext {
    return {
      ...this.currentContext,
      sessionDuration: Date.now() - this.sessionStartTime
    };
  }

  getBehavioralInsights(): {
    topBrands: string[];
    avgSessionDuration: number;
    totalInteractions: number;
    favoriteCategory?: string;
  } {
    const brandCount: Record<string, number> = {};
    const categoryCount: Record<string, number> = {};

    for (const vehicleId of this.currentContext.viewedVehicles) {
      const categories = this.inferCategoriesFromVehicles([vehicleId]);
      for (const cat of categories) {
        categoryCount[cat] = (categoryCount[cat] ?? 0) + 1;
      }
    }

    const topBrands = Object.entries(brandCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([brand]) => brand);

    const favoriteCategory = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      topBrands,
      avgSessionDuration: this.sessionStartTime > 0 ? Date.now() - this.sessionStartTime : 0,
      totalInteractions:
        this.behavioralData.searchQueries.length +
        this.currentContext.viewedVehicles.length +
        this.behavioralData.comparisonActions.length,
      favoriteCategory
    };
  }

  reset(): void {
    this.sessionStartTime = Date.now();
    this.lastUpdateTime = Date.now();
    this.browsingHistory = [];
    this.behavioralData = this.initializeBehavioralContext();
    this.currentContext = this.initializeContext();
  }
}

export const contextFusion = ContextFusion.getInstance();

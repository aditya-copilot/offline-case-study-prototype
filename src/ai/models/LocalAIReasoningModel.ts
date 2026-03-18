import type {
  AIReasoningRequest,
  AIReasoningResponse,
  AIRecommendation,
  ReasoningChain,
  EvidenceItem,
  Product,
  RecommendationType,
  PromptContext,
  BehavioralSignal
} from '../types';

interface ProductDataset {
  products: Product[];
  patterns: ShoppingPattern[];
  zoneMetadata: ZoneMetadata[];
}

interface ShoppingPattern {
  id: string;
  triggerProducts: string[];
  associatedProducts: string[];
  confidence: number;
  category: string;
}

interface ZoneMetadata {
  zoneId: string;
  complementaryZones: string[];
  popularProducts: string[];
}

interface SemanticScore {
  product: Product;
  score: number;
  factors: ScoreFactor[];
}

interface ScoreFactor {
  name: string;
  weight: number;
  contribution: number;
  evidence: string;
}

export class LocalAIReasoningModel {
  private productDataset: ProductDataset | null = null;
  private embeddings: Map<string, number[]> = new Map();

  async loadDataset(): Promise<void> {
    try {
      const [productsRes, patternsRes, zoneRes] = await Promise.all([
        fetch('/data/products.json'),
        fetch('/data/shoppingPatterns.json'),
        fetch('/data/zoneMetadata.json')
      ]);

      const products = await productsRes.json();
      const patterns = await patternsRes.json();
      const zones = await zoneRes.json();

      this.productDataset = {
        products: products.products,
        patterns: patterns.patterns,
        zoneMetadata: zones.zones
      };

      this.computeProductEmbeddings();
    } catch {
      this.productDataset = { products: [], patterns: [], zoneMetadata: [] };
    }
  }

  async generateRecommendations(request: AIReasoningRequest): Promise<AIReasoningResponse> {
    const startTime = performance.now();

    if (!this.productDataset) {
      await this.loadDataset();
    }

    const context = request.context;
    const semanticScores = this.calculateSemanticScores(context);
    const recommendations = this.buildRecommendations(semanticScores, context, request.constraints);

    const processingTime = performance.now() - startTime;

    return {
      recommendations,
      reasoningSummary: this.generateReasoningSummary(recommendations),
      confidence: this.calculateOverallConfidence(recommendations),
      processingTime,
      modelUsed: 'LocalAIReasoningModel'
    };
  }

  private calculateSemanticScores(context: PromptContext): SemanticScore[] {
    if (!this.productDataset) return [];

    const scores: SemanticScore[] = [];

    for (const product of this.productDataset.products) {
      const factors: ScoreFactor[] = [];

      factors.push(this.scoreShoppingListRelevance(product, context));
      factors.push(this.scoreBehavioralAffinity(product, context));
      factors.push(this.scorePreferenceAlignment(product, context));
      factors.push(this.scoreTemporalRelevance(product, context));
      factors.push(this.scoreProximity(product, context));
      factors.push(this.scoreComplementaryProducts(product, context));
      factors.push(this.scorePatternAssociation(product, context));
      factors.push(this.scorePersonalityMatch(product, context));

      const totalScore = factors.reduce((sum, f) => sum + f.contribution, 0) / factors.length;

      scores.push({
        product,
        score: Math.min(1, Math.max(0, totalScore)),
        factors: factors.filter(f => f.contribution > 0)
      });
    }

    return scores.sort((a, b) => b.score - a.score);
  }

  private scoreShoppingListRelevance(product: Product, context: PromptContext): ScoreFactor {
    const { shoppingList, collectedItems } = context.currentSession;
    const listProductIds = shoppingList.map(i => i.productId);
    
    const isOnList = listProductIds.includes(product.id);
    const isCollected = collectedItems.includes(product.id);
    
    let score = 0;
    let evidence = '';

    if (isOnList && !isCollected) {
      score = 0.95;
      evidence = 'Product is on shopping list and not yet collected';
    } else if (isCollected) {
      score = 0.1;
      evidence = 'Product already collected';
    } else {
      const categoryMatch = shoppingList.some(item => {
        const listProduct = this.productDataset?.products.find(p => p.id === item.productId);
        return listProduct?.category === product.category;
      });
      
      if (categoryMatch) {
        score = 0.4;
        evidence = 'Same category as items on list';
      } else {
        score = 0.2;
        evidence = 'Not directly related to shopping list';
      }
    }

    return {
      name: 'Shopping List Relevance',
      weight: 0.25,
      contribution: score * 0.25,
      evidence
    };
  }

  private scoreBehavioralAffinity(product: Product, context: PromptContext): ScoreFactor {
    const { behavioralContext } = context;
    const signals = behavioralContext.sessionPatterns;
    
    const productSignals = signals.filter(s => s.productId === product.id);
    const zoneSignals = signals.filter(s => s.zoneId === product.zoneId);
    
    const viewSignals = productSignals.filter(s => s.type === 'view');
    const dwellSignals = zoneSignals.filter(s => s.type === 'dwell');
    
    const viewScore = viewSignals.reduce((sum, s) => sum + s.intensity, 0) * 0.3;
    const dwellScore = dwellSignals.reduce((sum, s) => sum + s.intensity, 0) * 0.2;
    
    const totalScore = Math.min(1, viewScore + dwellScore);
    
    const evidenceParts: string[] = [];
    if (viewSignals.length > 0) evidenceParts.push(`${viewSignals.length} view signals`);
    if (dwellSignals.length > 0) evidenceParts.push(`${dwellSignals.length} dwell signals in zone`);
    
    return {
      name: 'Behavioral Affinity',
      weight: 0.20,
      contribution: totalScore * 0.20,
      evidence: evidenceParts.length > 0 
        ? `Strong behavioral signals: ${evidenceParts.join(', ')}`
        : 'No direct behavioral signals'
    };
  }

  private scorePreferenceAlignment(product: Product, context: PromptContext): ScoreFactor {
    const { preferences } = context.customerProfile;
    let score = 0.5;
    const evidenceParts: string[] = [];

    if (preferences.preferredCategories.includes(product.category)) {
      score += 0.25;
      evidenceParts.push('In preferred category');
    }

    if (product.attributes['organic'] && preferences.healthConsciousness > 0.7) {
      score += 0.15;
      evidenceParts.push('Organic product matches health preference');
    }

    if (product.isOnSale && preferences.priceSensitivity > 0.6) {
      score += 0.10;
      evidenceParts.push('On sale, matching price sensitivity');
    }

    if (product.rating >= 4.5 && preferences.qualityPriority > 0.7) {
      score += 0.10;
      evidenceParts.push('High rating matches quality preference');
    }

    return {
      name: 'Preference Alignment',
      weight: 0.15,
      contribution: Math.min(1, score) * 0.15,
      evidence: evidenceParts.join('; ') || 'Moderate preference alignment'
    };
  }

  private scoreTemporalRelevance(product: Product, context: PromptContext): ScoreFactor {
    const { temporalContext } = context;
    let score = 0.5;
    const evidenceParts: string[] = [];

    const seasonality = product.seasonality || ['year-round'];
    if (seasonality.includes(temporalContext.season) || seasonality.includes('year-round')) {
      score += 0.3;
      evidenceParts.push(`In-season (${temporalContext.season})`);
    }

    if (temporalContext.timeOfDay === 'morning' && product.category === 'grocery') {
      score += 0.1;
      evidenceParts.push('Morning grocery shopping pattern');
    }

    return {
      name: 'Temporal Relevance',
      weight: 0.10,
      contribution: Math.min(1, score) * 0.10,
      evidence: evidenceParts.join('; ') || 'Standard temporal relevance'
    };
  }

  private scoreProximity(product: Product, context: PromptContext): ScoreFactor {
    const { currentZone } = context.currentSession;
    
    let score = 0.3;
    let evidence = 'Product location unknown';

    if (currentZone) {
      if (product.zoneId === currentZone) {
        score = 1.0;
        evidence = 'Product in current zone';
      } else {
        const zoneMeta = this.productDataset?.zoneMetadata.find(z => z.zoneId === currentZone);
        if (zoneMeta?.complementaryZones.includes(product.zoneId)) {
          score = 0.6;
          evidence = `Nearby zone (${product.zoneId})`;
        } else {
          score = 0.3;
          evidence = `Distant zone (${product.zoneId})`;
        }
      }
    }

    return {
      name: 'Proximity',
      weight: 0.15,
      contribution: score * 0.15,
      evidence
    };
  }

  private scoreComplementaryProducts(product: Product, context: PromptContext): ScoreFactor {
    const { collectedItems, viewedProducts } = context.currentSession;
    const interactionHistory = [...collectedItems, ...viewedProducts];
    
    let score = 0.3;
    const evidenceParts: string[] = [];

    const complementary = product.complementaryProducts || [];
    const matches = complementary.filter(id => interactionHistory.includes(id));
    
    if (matches.length > 0) {
      score = 0.5 + (matches.length * 0.15);
      evidenceParts.push(`Complements ${matches.join(', ')}`);
    }

    for (const collectedId of collectedItems) {
      const collectedProduct = this.productDataset?.products.find(p => p.id === collectedId);
      if (collectedProduct?.complementaryProducts?.includes(product.id)) {
        score += 0.2;
        evidenceParts.push(`Frequently bought with ${collectedProduct.name}`);
      }
    }

    return {
      name: 'Complementary Products',
      weight: 0.10,
      contribution: Math.min(1, score) * 0.10,
      evidence: evidenceParts.join('; ') || 'No strong complementary signals'
    };
  }

  private scorePatternAssociation(product: Product, context: PromptContext): ScoreFactor {
    const { collectedItems } = context.currentSession;
    
    let maxScore = 0.3;
    let bestPattern = '';

    for (const pattern of this.productDataset?.patterns || []) {
      const hasTrigger = pattern.triggerProducts.some(id => collectedItems.includes(id));
      const isAssociated = pattern.associatedProducts.includes(product.id);
      
      if (hasTrigger && isAssociated) {
        const score = pattern.confidence;
        if (score > maxScore) {
          maxScore = score;
          bestPattern = pattern.name;
        }
      }
    }

    return {
      name: 'Pattern Association',
      weight: 0.10,
      contribution: maxScore * 0.10,
      evidence: bestPattern 
        ? `Matches '${bestPattern}' shopping pattern`
        : 'No pattern match detected'
    };
  }

  private scorePersonalityMatch(product: Product, context: PromptContext): ScoreFactor {
    const personality = context.customerProfile.personality;
    let score = 0.5;
    let evidence = 'Standard match';

    switch (personality) {
      case 'health':
        if (product.attributes['organic']) {
          score = 0.9;
          evidence = 'Organic product for health-conscious shopper';
        } else if (product.nutritionalInfo) {
          score = 0.7;
          evidence = 'Has nutritional information available';
        }
        break;
      case 'budget':
        if (product.isOnSale) {
          score = 0.9;
          evidence = 'On-sale item for budget-conscious shopper';
        } else if (product.price < 10) {
          score = 0.6;
          evidence = 'Affordable price point';
        }
        break;
      case 'premium':
        if (product.rating >= 4.8 && product.reviewCount > 100) {
          score = 0.9;
          evidence = 'Premium, highly-rated product';
        } else if (product.brand === 'Apple' || product.price > 100) {
          score = 0.7;
          evidence = 'Premium brand or high-value item';
        }
        break;
      case 'quick':
        if (product.category === 'grocery' && product.attributes['preWashed']) {
          score = 0.8;
          evidence = 'Convenient, ready-to-use product';
        }
        break;
      case 'explorer':
        score = 0.6;
        evidence = 'Discovery opportunity for explorer personality';
        break;
    }

    return {
      name: 'Personality Match',
      weight: 0.05,
      contribution: score * 0.05,
      evidence
    };
  }

  private buildRecommendations(
    scores: SemanticScore[],
    context: PromptContext,
    constraints?: { maxRecommendations?: number; minConfidence?: number }
  ): AIRecommendation[] {
    const maxRecs = constraints?.maxRecommendations ?? 5;
    const minConf = constraints?.minConfidence ?? 0.5;

    const recommendations: AIRecommendation[] = [];
    const usedProductIds = new Set<string>();

    for (const score of scores) {
      if (recommendations.length >= maxRecs) break;
      if (score.score < minConf) continue;
      if (usedProductIds.has(score.product.id)) continue;

      usedProductIds.add(score.product.id);

      const reasoning: ReasoningChain = {
        steps: score.factors.map((factor, idx) => ({
          id: `step-${idx}`,
          description: factor.name,
          input: factor.evidence,
          output: `Score: ${(factor.contribution * 100).toFixed(1)}%`,
          confidence: factor.contribution / factor.weight,
          timestamp: Date.now()
        })),
        overallConfidence: score.score,
        primaryFactors: score.factors.slice(0, 3).map(f => f.name),
        evidence: score.factors.map(f => ({
          type: this.factorToEvidenceType(f.name),
          description: f.evidence,
          weight: f.weight,
          data: { contribution: f.contribution }
        }))
      };

      recommendations.push({
        id: `rec-${Date.now()}-${recommendations.length}`,
        type: this.determineRecommendationType(score, context),
        priority: this.scoreToPriority(score.score),
        confidence: score.score,
        title: score.product.name,
        description: this.generateDescription(score, context),
        products: [score.product],
        reasoning,
        expiresAt: Date.now() + 300000,
        triggeredAt: Date.now(),
        context: {
          currentZoneId: context.currentSession.currentZone,
          shoppingList: context.currentSession.shoppingList,
          searchHistory: context.currentSession.searchQueries,
          movementPattern: {
            path: [],
            speed: 0,
            direction: 0,
            hesitationPoints: [],
            pattern: 'browsing'
          },
          timeInZones: new Map(),
          sessionDuration: Date.now() - context.currentSession.startedAt,
          timeOfDay: context.temporalContext.timeOfDay,
          dayOfWeek: context.temporalContext.dayOfWeek,
          seasonalContext: context.temporalContext.season,
          behavioralSignals: context.behavioralContext.sessionPatterns
        }
      });
    }

    return recommendations;
  }

  private factorToEvidenceType(factorName: string): EvidenceItem['type'] {
    if (factorName.includes('Shopping')) return 'personal';
    if (factorName.includes('Behavioral')) return 'behavioral';
    if (factorName.includes('Temporal')) return 'seasonal';
    if (factorName.includes('Preference')) return 'personal';
    return 'contextual';
  }

  private determineRecommendationType(score: SemanticScore, context: PromptContext): RecommendationType {
    const { factors } = score;
    
    const hasListFactor = factors.some(f => f.name.includes('Shopping List'));
    const hasPatternFactor = factors.some(f => f.name.includes('Pattern'));
    const hasComplementaryFactor = factors.some(f => f.name.includes('Complementary'));

    if (hasListFactor && score.product.complementaryProducts?.length) {
      return 'bundle';
    }
    if (hasPatternFactor) {
      return 'insight';
    }
    if (hasComplementaryFactor) {
      return 'product';
    }
    if (context.currentSession.collectedItems.includes(score.product.id)) {
      return 'reminder';
    }
    return 'discovery';
  }

  private scoreToPriority(score: number): AIRecommendation['priority'] {
    if (score >= 0.85) return 'urgent';
    if (score >= 0.70) return 'high';
    if (score >= 0.55) return 'medium';
    return 'low';
  }

  private generateDescription(score: SemanticScore, context: PromptContext): string {
    const product = score.product;
    const topFactors = score.factors.slice(0, 2);
    
    let desc = `${product.description}. `;
    
    if (product.isOnSale) {
      desc += `Currently on sale with ${product.discountPercentage}% off. `;
    }

    desc += `Recommended because: ${topFactors.map(f => f.evidence).join('. ')}.`;

    return desc;
  }

  private generateReasoningSummary(recommendations: AIRecommendation[]): string {
    if (recommendations.length === 0) {
      return 'No recommendations generated based on current context.';
    }

    const types = new Set(recommendations.map(r => r.type));
    const avgConfidence = recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length;

    return `Generated ${recommendations.length} recommendations across ${types.size} types. ` +
           `Average confidence: ${(avgConfidence * 100).toFixed(1)}%. ` +
           `Top factors: ${recommendations[0]?.reasoning.primaryFactors.join(', ')}.`;
  }

  private calculateOverallConfidence(recommendations: AIRecommendation[]): number {
    if (recommendations.length === 0) return 0;
    return recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length;
  }

  private computeProductEmbeddings(): void {
    for (const product of this.productDataset?.products || []) {
      const embedding = this.createProductEmbedding(product);
      this.embeddings.set(product.id, embedding);
    }
  }

  private createProductEmbedding(product: Product): number[] {
    const categoryIndex = this.getCategoryIndex(product.category);
    const priceNorm = Math.min(1, product.price / 100);
    const ratingNorm = product.rating / 5;
    const organic = product.attributes['organic'] ? 1 : 0;
    const onSale = product.isOnSale ? 1 : 0;
    const inStock = product.inStock ? 1 : 0;

    return [categoryIndex / 10, priceNorm, ratingNorm, organic, onSale, inStock];
  }

  private getCategoryIndex(category: string): number {
    const categories = ['grocery', 'electronics', 'clothing', 'home', 'pharmacy', 'sports'];
    return categories.indexOf(category) + 1;
  }
}

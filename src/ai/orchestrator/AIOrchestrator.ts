import type {
  AIRecommendation,
  PromptContext,
  AIPersonality,
  RecommendationType,
  ReasoningConstraints,
  PredictionResult
} from '../types';
import type { Product, ShoppingListItem } from '@core/types';
import type { Vector2 } from '@core/spatial/types';
import { PromptBuilder } from '../prompt-engine/PromptBuilder';
import { LocalAIReasoningModel } from '../models/LocalAIReasoningModel';
import { ContextBuilder } from '../context-builder/ContextBuilder';
import type { BaseLLMAdapter } from '../adapters/LLMAdapter';
import { AICache } from '../cache/AICache';
import { aiService } from '@services/ai/AIService';

interface OrchestratorConfig {
  personality: AIPersonality;
  preferredTypes: RecommendationType[];
  maxRecommendations: number;
  minConfidence: number;
  enableCache: boolean;
  enableRealtime: boolean;
  debounceMs: number;
}

interface RecommendationSubscriber {
  id: string;
  callback: (recommendations: AIRecommendation[]) => void;
  filter?: (rec: AIRecommendation) => boolean;
}

export class AIOrchestrator {
  private config: OrchestratorConfig;
  private promptBuilder: PromptBuilder;
  private reasoningModel: LocalAIReasoningModel;
  private contextBuilder: ContextBuilder;
  private llmAdapter: BaseLLMAdapter | null = null;
  private cache: AICache;
  private subscribers: Map<string, RecommendationSubscriber> = new Map();
  private recomputationTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentContext: PromptContext | null = null;
  private products: Product[] = [];
  private lastRecommendations: AIRecommendation[] = [];
  private isProcessing = false;

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = {
      personality: 'explorer',
      preferredTypes: ['product', 'bundle', 'insight'],
      maxRecommendations: 5,
      minConfidence: 0.6,
      enableCache: true,
      enableRealtime: true,
      debounceMs: 500,
      ...config
    };

    this.promptBuilder = new PromptBuilder(
      this.config.personality,
      this.config.preferredTypes
    );
    this.reasoningModel = new LocalAIReasoningModel();
    this.contextBuilder = new ContextBuilder({
      defaultPersonality: this.config.personality
    });
    this.cache = new AICache();
  }

  async initialize(products: Product[]): Promise<void> {
    this.products = products;
    await this.reasoningModel.loadDataset();
  }

  setLLMAdapter(adapter: BaseLLMAdapter): void {
    this.llmAdapter = adapter;
  }

  setPersonality(personality: AIPersonality): void {
    this.config.personality = personality;
    this.promptBuilder.setPersonality(personality);
    this.contextBuilder = new ContextBuilder({ defaultPersonality: personality });
  }

  async updateContext(
    customerId: string,
    currentZoneId: string | undefined,
    position: Vector2 | undefined,
    shoppingList: ShoppingListItem[]
  ): Promise<void> {
    this.currentContext = await this.contextBuilder.buildContext(
      customerId,
      currentZoneId,
      position,
      shoppingList,
      [],
      this.products
    );

    if (this.config.enableRealtime) {
      this.scheduleRecomputation();
    }
  }

  recordBehavioralSignal(signal: {
    type: 'dwell' | 'view' | 'search' | 'hesitate' | 'skip' | 'pickup';
    zoneId?: string;
    productId?: string;
    intensity?: number;
  }): void {
    this.contextBuilder.recordSignal({
      id: `sig-${Date.now()}`,
      type: signal.type,
      timestamp: Date.now(),
      position: { x: 0, y: 0 },
      zoneId: signal.zoneId,
      productId: signal.productId,
      intensity: signal.intensity ?? 0.5
    });

    if (signal.type === 'search' && signal.productId) {
      this.contextBuilder.recordSearch(signal.productId);
    }

    if (this.config.enableRealtime) {
      this.scheduleRecomputation();
    }
  }

  recordZoneTransition(fromZoneId: string, toZoneId: string, dwellTime: number): void {
    this.contextBuilder.recordZoneTransition(fromZoneId, toZoneId, dwellTime);

    if (this.config.enableRealtime) {
      this.scheduleRecomputation();
    }
  }

  private scheduleRecomputation(): void {
    if (this.recomputationTimeout) {
      clearTimeout(this.recomputationTimeout);
    }

    this.recomputationTimeout = setTimeout(() => {
      this.recomputeRecommendations();
    }, this.config.debounceMs);
  }

  private async recomputeRecommendations(): Promise<void> {
    if (this.isProcessing || !this.currentContext) return;

    this.isProcessing = true;

    try {
      const cacheKey = this.generateCacheKey();

      if (this.config.enableCache) {
        const cached = await this.cache.get(cacheKey);
        if (cached && Date.now() < cached.expiresAt) {
          this.lastRecommendations = cached.recommendations;
          this.notifySubscribers(cached.recommendations);
          this.isProcessing = false;
          return;
        }
      }

      let recommendations: AIRecommendation[];

      try {
        recommendations = await this.generateAIRecommendations();
      } catch (error) {
        console.warn('AI Juspay model failed, falling back to local reasoning:', error);
        const request = this.promptBuilder.buildRecommendationPrompt(
          this.currentContext,
          {
            maxRecommendations: this.config.maxRecommendations,
            minConfidence: this.config.minConfidence
          }
        );
        const response = await this.reasoningModel.generateRecommendations(request);
        recommendations = response.recommendations;
      }

      this.lastRecommendations = recommendations;

      if (this.config.enableCache) {
        await this.cache.set(cacheKey, {
          key: cacheKey,
          recommendations: recommendations,
          context: this.currentContext,
          createdAt: Date.now(),
          expiresAt: Date.now() + 300000,
          hitCount: 0
        });
      }

      this.notifySubscribers(recommendations);
    } finally {
      this.isProcessing = false;
    }
  }

  private async generateAIRecommendations(): Promise<AIRecommendation[]> {
    const ctx = this.currentContext!;

    const messages = [
      {
        role: 'system' as const,
        content: `You are a shopping assistant. Recommend products based on customer context.
Customer: ${ctx.customerProfile.personality}
Zone: ${ctx.currentSession.currentZone || 'unknown'}
Shopping List: ${ctx.currentSession.shoppingList.length} items
Session Patterns: ${ctx.behavioralContext.sessionPatterns.length} signals

Return JSON: { "productIds": ["id1", "id2", "id3"], "reasoning": "explanation" }`
      },
      {
        role: 'user' as const,
        content: 'Recommend products for this customer.'
      }
    ];

    const response = await aiService.chatCompletion<{
      productIds: string[];
      reasoning: string;
    }>(
      messages,
      {
        model: 'claude-sonnet-4-5',
        maxTokens: 2048,
        temperature: 0.7,
        responseFormat: 'json',
        useCache: true
      }
    );

    if (!response.parsedData?.productIds) {
      throw new Error('Invalid AI response');
    }

    const now = Date.now();

    return response.parsedData.productIds.slice(0, this.config.maxRecommendations).map((id: string, idx: number) => {
      const product = this.products.find(p => p.id === id) || this.products[idx % this.products.length];
      const priorities: Array<'low' | 'medium' | 'high' | 'urgent'> = ['high', 'medium', 'low'];
      return {
        id: `ai-rec-${now}-${idx}`,
        type: 'product' as RecommendationType,
        priority: priorities[idx % priorities.length],
        confidence: 0.8 - idx * 0.05,
        title: product.name,
        description: response.parsedData?.reasoning || 'AI recommended',
        products: [product],
        reasoning: {
          steps: [],
          overallConfidence: 0.8 - idx * 0.05,
          primaryFactors: ['AI analysis'],
          evidence: [{
            type: 'contextual' as const,
            description: 'AI Juspay model recommendation',
            weight: 0.8,
            data: { modelUsed: response.modelUsed }
          }]
        },
        expiresAt: now + 300000,
        triggeredAt: now,
        context: {
          shoppingList: this.currentContext?.currentSession.shoppingList || [],
          currentZoneId: this.currentContext?.currentSession.currentZone,
          behavioralSignals: this.currentContext?.behavioralContext.sessionPatterns || [],
          timeOfDay: new Date().getHours()
        }
      };
    });
  }

  private generateCacheKey(): string {
    const ctx = this.currentContext;
    if (!ctx) return `ai-${Date.now()}`;

    const components = [
      ctx.customerProfile.personality,
      ctx.currentSession.currentZone || 'unknown',
      ctx.currentSession.shoppingList.length,
      ctx.behavioralContext.sessionPatterns.length
    ];

    return `ai-${components.join('-')}`;
  }

  subscribe(
    id: string,
    callback: (recommendations: AIRecommendation[]) => void,
    filter?: (rec: AIRecommendation) => boolean
  ): () => void {
    this.subscribers.set(id, { id, callback, filter });

    if (this.lastRecommendations.length > 0) {
      const filtered = filter
        ? this.lastRecommendations.filter(filter)
        : this.lastRecommendations;
      callback(filtered);
    }

    return () => {
      this.subscribers.delete(id);
    };
  }

  private notifySubscribers(recommendations: AIRecommendation[]): void {
    for (const subscriber of this.subscribers.values()) {
      const filtered = subscriber.filter
        ? recommendations.filter(subscriber.filter)
        : recommendations;
      subscriber.callback(filtered);
    }
  }

  async predictIntent(): Promise<PredictionResult> {
    if (!this.currentContext) {
      return {
        predictedIntent: 'unknown',
        confidence: 0,
        possibleNextProducts: [],
        forgottenItems: []
      };
    }

    const { behavioralContext, currentSession } = this.currentContext;
    const signals = behavioralContext.sessionPatterns;

    const searchCount = signals.filter(s => s.type === 'search').length;
    const dwellCount = signals.filter(s => s.type === 'dwell').length;
    const viewCount = signals.filter(s => s.type === 'view').length;

    let predictedIntent = 'browsing';
    let confidence = 0.5;

    if (searchCount > 2) {
      predictedIntent = 'searching';
      confidence = 0.8;
    } else if (dwellCount > 5) {
      predictedIntent = 'evaluating';
      confidence = 0.7;
    } else if (viewCount > 3) {
      predictedIntent = 'exploring';
      confidence = 0.6;
    }

    const listProductIds = currentSession.shoppingList.map(i => i.productId);
    const collected = currentSession.collectedItems;
    const forgotten = listProductIds.filter(id => !collected.includes(id));

    const possibleNext = this.products
      .filter(p => {
        const inZone = p.zoneId === currentSession.currentZone;
        const onList = listProductIds.includes(p.id);
        const notCollected = !collected.includes(p.id);
        return (inZone || onList) && notCollected;
      })
      .slice(0, 5)
      .map(p => p.id);

    return {
      predictedIntent,
      confidence,
      possibleNextProducts: possibleNext,
      forgottenItems: forgotten
    };
  }

  async generateExplanation(recommendationId: string): Promise<string> {
    const recommendation = this.lastRecommendations.find(r => r.id === recommendationId);
    if (!recommendation) {
      return 'Recommendation not found';
    }

    if (this.llmAdapter) {
      return this.llmAdapter.generateExplanation(recommendation);
    }

    const factors = recommendation.reasoning.primaryFactors;
    return `This recommendation was generated based on: ${factors.join(', ')}. ` +
           `Confidence: ${(recommendation.confidence * 100).toFixed(0)}%.`;
  }

  getCurrentRecommendations(): AIRecommendation[] {
    return this.lastRecommendations;
  }

  isRecomputing(): boolean {
    return this.isProcessing;
  }

  reset(): void {
    this.contextBuilder.reset();
    this.currentContext = null;
    this.lastRecommendations = [];
    this.subscribers.clear();
    if (this.recomputationTimeout) {
      clearTimeout(this.recomputationTimeout);
    }
  }
}

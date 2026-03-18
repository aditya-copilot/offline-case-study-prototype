import { aiService, type AIResponse, type AIError } from './AIService';
import { aiPromptBuilder, type PromptContext } from './AIPromptBuilder';
import { vehicleDataLoader } from '@core/data/vehicleDataLoader';
import type { Vehicle } from '@core/types/vehicles';
import type { AssistantIntent, AssistantPersonality } from '@assistant/types';

export interface AIRecommendation {
  vehicleId: string;
  rank: number;
  confidence: number;
  reasoning: string;
  keyHighlights: string[];
  bestFor: string;
}

export interface AIRecommendationResult {
  success: boolean;
  recommendations: AIRecommendation[];
  vehicles: Vehicle[];
  comparisonSummary: string;
  verdict: string;
  suggestedActions: Array<{
    type: string;
    label: string;
    vehicleId: string;
  }>;
  followUpQuestions: string[];
  modelUsed: string;
  processingTime: number;
}

export interface RecommendationCriteria {
  budgetRange?: { min: number; max: number };
  fuelType?: string;
  bodyStyle?: string;
  brands?: string[];
  features?: string[];
  useCase?: string;
  priority?: 'budget' | 'performance' | 'mileage' | 'features' | 'comfort' | 'style';
}

class VehicleAIRecommendationService {
  private isLoading = false;

  async getRecommendations(
    query: string,
    context: PromptContext,
    criteria: RecommendationCriteria = {},
    personality: AssistantPersonality = 'auto'
  ): Promise<AIRecommendationResult> {
    const startTime = performance.now();
    let allVehicles: Vehicle[] = [];

    try {
      await vehicleDataLoader.load();
      allVehicles = vehicleDataLoader.getAllVehicles();

      const filteredVehicles = this.applyCriteriaFilter(allVehicles, criteria);
      const topCandidates = this.getTopCandidates(filteredVehicles, context, 10);

      const prompt = aiPromptBuilder.buildVehicleRecommendationPrompt(
        context,
        filteredVehicles,
        topCandidates
      );

      const messages = [
        { role: 'system' as const, content: prompt.system },
        { role: 'user' as const, content: prompt.user }
      ];

      const response = await aiService.chatCompletion<{
        recommendations: AIRecommendation[];
        comparisonSummary: string;
        verdict: string;
        suggestedActions: Array<{ type: string; label: string; vehicleId: string }>;
        followUpQuestions: string[];
      }>(messages, {
        model: 'claude-sonnet-4-5',
        maxTokens: 4096,
        temperature: 0.7,
        responseFormat: 'json',
        useCache: true
      });

      if (!response.parsedData) {
        throw new Error('Failed to parse AI response');
      }

      const enrichedRecommendations = this.enrichWithVehicleData(
        response.parsedData.recommendations,
        allVehicles
      );

      const recommendedVehicles = enrichedRecommendations
        .map(r => allVehicles.find(v => v.id === r.vehicleId))
        .filter((v): v is Vehicle => v !== undefined);

      return {
        success: true,
        recommendations: enrichedRecommendations,
        vehicles: recommendedVehicles,
        comparisonSummary: response.parsedData.comparisonSummary,
        verdict: response.parsedData.verdict,
        suggestedActions: response.parsedData.suggestedActions,
        followUpQuestions: response.parsedData.followUpQuestions,
        modelUsed: response.modelUsed,
        processingTime: performance.now() - startTime
      };
    } catch (error) {
      console.error('AI Recommendation error:', error);
      return this.getFallbackRecommendations(context, criteria, allVehicles || []);
    }
  }

  async getVoiceResponse(
    transcript: string,
    context: PromptContext,
    personality: AssistantPersonality = 'auto'
  ): Promise<{
    response: string;
    suggestedVehicles: Vehicle[];
    actions: Array<{ type: string; label: string; payload: unknown }>;
    confidence: number;
    followUpQuestion?: string;
  }> {
    let allVehicles: Vehicle[] = [];
    try {
      await vehicleDataLoader.load();
      allVehicles = vehicleDataLoader.getAllVehicles();

      const prompt = aiPromptBuilder.buildVoiceConversationPrompt(
        transcript,
        context,
        allVehicles
      );

      const messages = [
        { role: 'system' as const, content: prompt.system },
        { role: 'user' as const, content: prompt.user }
      ];

      const response = await aiService.chatCompletion<{
        response: string;
        suggestedVehicles: string[];
        actions: Array<{ type: string; label: string; payload: unknown }>;
        confidence: number;
        followUpQuestion?: string;
      }>(messages, {
        model: 'claude-sonnet-4-5',
        maxTokens: 2048,
        temperature: 0.8,
        responseFormat: 'json',
        useCache: false
      });

      if (!response.parsedData) {
        throw new Error('Failed to parse voice response');
      }

      const suggestedVehicles = response.parsedData.suggestedVehicles
        .map(id => allVehicles.find(v => v.id === id))
        .filter((v): v is Vehicle => v !== undefined);

      return {
        response: response.parsedData.response,
        suggestedVehicles,
        actions: response.parsedData.actions,
        confidence: response.parsedData.confidence,
        followUpQuestion: response.parsedData.followUpQuestion
      };
    } catch (error) {
      console.error('Voice AI error:', error);
      return this.getFallbackVoiceResponse(transcript, context, allVehicles || []);
    }
  }

  private applyCriteriaFilter(vehicles: Vehicle[], criteria: RecommendationCriteria): Vehicle[] {
    return vehicles.filter(v => {
      const avgPrice = (v.priceRange.min + v.priceRange.max) / 2;

      if (criteria.budgetRange) {
        if (avgPrice < criteria.budgetRange.min || avgPrice > criteria.budgetRange.max * 1.1) {
          return false;
        }
      }

      if (criteria.fuelType && v.fuelType.toLowerCase() !== criteria.fuelType.toLowerCase()) {
        return false;
      }

      if (criteria.bodyStyle && v.bodyStyle.toLowerCase() !== criteria.bodyStyle.toLowerCase()) {
        return false;
      }

      if (criteria.brands?.length && !criteria.brands.some(b =>
        v.makeName.toLowerCase().includes(b.toLowerCase())
      )) {
        return false;
      }

      return true;
    });
  }

  private getTopCandidates(vehicles: Vehicle[], context: PromptContext, limit: number): Vehicle[] {
    const scored = vehicles.map(v => {
      let score = v.overallRating / 5;

      if (context.viewedVehicles.includes(v.id)) {
        score += 0.1;
      }

      if (context.userPreferences.preferredBrands?.includes(v.makeName)) {
        score += 0.2;
      }

      if (context.userPreferences.preferredFuelType === v.fuelType) {
        score += 0.15;
      }

      return { vehicle: v, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.vehicle);
  }

  private enrichWithVehicleData(
    recommendations: AIRecommendation[],
    vehicles: Vehicle[]
  ): AIRecommendation[] {
    return recommendations.map(rec => {
      const vehicle = vehicles.find(v => v.id === rec.vehicleId);
      if (!vehicle) return rec;

      return {
        ...rec,
        vehicleId: vehicle.id
      };
    });
  }

  private getFallbackRecommendations(
    context: PromptContext,
    criteria: RecommendationCriteria,
    vehicles: Vehicle[]
  ): AIRecommendationResult {
    let filtered = this.applyCriteriaFilter(vehicles, criteria);

    if (filtered.length === 0) {
      filtered = vehicles.slice(0, 10);
    }

    const sorted = filtered
      .sort((a, b) => b.overallRating - a.overallRating)
      .slice(0, 3);

    const recommendations: AIRecommendation[] = sorted.map((v, idx) => ({
      vehicleId: v.id,
      rank: idx + 1,
      confidence: 0.7 - idx * 0.1,
      reasoning: idx === 0
        ? `Top rated ${v.makeName} ${v.modelName} with excellent ${v.tags[0] || 'features'}`
        : `Great alternative with ${v.tags[0] || 'good value'}`,
      keyHighlights: v.tags.slice(0, 3),
      bestFor: idx === 0 ? 'Best overall choice' : 'Value alternative'
    }));

    return {
      success: true,
      recommendations,
      vehicles: sorted,
      comparisonSummary: 'Based on ratings and popularity',
      verdict: `${sorted[0]?.makeName} ${sorted[0]?.modelName} is our top recommendation`,
      suggestedActions: sorted.map(v => ({
        type: 'view-details',
        label: `View ${v.modelName}`,
        vehicleId: v.id
      })),
      followUpQuestions: ['What is your budget range?', 'Any preferred brand?'],
      modelUsed: 'fallback-rules',
      processingTime: 0
    };
  }

  private getFallbackVoiceResponse(
    transcript: string,
    context: PromptContext,
    vehicles: Vehicle[]
  ): {
    response: string;
    suggestedVehicles: Vehicle[];
    actions: Array<{ type: string; label: string; payload: unknown }>;
    confidence: number;
    followUpQuestion?: string;
  } {
    const query = transcript.toLowerCase();

    let matchedVehicles = vehicles.filter(v =>
      query.includes(v.makeName.toLowerCase()) ||
      query.includes(v.modelName.toLowerCase()) ||
      v.tags.some(t => query.includes(t.toLowerCase()))
    );

    if (matchedVehicles.length === 0) {
      matchedVehicles = vehicles.slice(0, 3);
    }

    const topVehicle = matchedVehicles[0];

    return {
      response: `I found ${matchedVehicles.length} vehicles that might interest you. The ${topVehicle?.makeName} ${topVehicle?.modelName} is a popular choice with ${topVehicle?.tags[0] || 'great features'}. Would you like to know more about it?`,
      suggestedVehicles: matchedVehicles.slice(0, 3),
      actions: matchedVehicles.slice(0, 2).map(v => ({
        type: 'view-details',
        label: `View ${v.modelName}`,
        payload: v.id
      })),
      confidence: 0.6,
      followUpQuestion: 'What features are most important to you?'
    };
  }

  getIsLoading(): boolean {
    return this.isLoading;
  }
}

export const vehicleAIRecommendationService = new VehicleAIRecommendationService();
export default vehicleAIRecommendationService;

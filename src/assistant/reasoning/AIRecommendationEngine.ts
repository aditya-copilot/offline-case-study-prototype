import { vehicleDataLoader } from '@core/data/vehicleDataLoader';
import { vehicleAIRecommendationService } from '@services/ai/VehicleAIRecommendationService';
import type { Vehicle } from '@core/types/vehicles';
import type {
  AssistantAction,
  AssistantIntent,
  UserPreferenceContext
} from '../types';

interface RecommendationCriteria {
  budget?: { min: number; max: number };
  fuelType?: string;
  bodyStyle?: string;
  brand?: string;
  features?: string[];
  useCase?: 'commute' | 'highway' | 'offroad' | 'city' | 'performance';
  priority?: 'mileage' | 'performance' | 'comfort' | 'style' | 'budget';
}

interface VehicleRecommendation {
  vehicle: Vehicle;
  matchScore: number;
  matchReasons: string[];
  bestFor: string[];
  pros: string[];
  cons: string[];
  alternativeTo?: string;
}

interface ComparisonResult {
  vehicles: Vehicle[];
  winner?: string;
  comparisonPoints: {
    category: string;
    winner: string;
    details: Record<string, string>;
  }[];
  summary: string;
}

interface AIRecommendationResponse {
  type: 'recommendation' | 'comparison' | 'single';
  message: string;
  recommendations: VehicleRecommendation[];
  comparison?: ComparisonResult;
  criteria: RecommendationCriteria;
  followUpQuestions: string[];
  actions: AssistantAction[];
}

export class AIRecommendationEngine {
  private static instance: AIRecommendationEngine;

  private constructor() {}

  static getInstance(): AIRecommendationEngine {
    if (!AIRecommendationEngine.instance) {
      AIRecommendationEngine.instance = new AIRecommendationEngine();
    }
    return AIRecommendationEngine.instance;
  }

  async processQuery(query: string, context: UserPreferenceContext): Promise<AIRecommendationResponse> {
    await vehicleDataLoader.load();
    const allVehicles = vehicleDataLoader.getAllVehicles();

    const criteria = this.extractCriteria(query, context);
    const intent = this.detectIntent(query);

    const promptContext = {
      userQuery: query,
      intent,
      conversationHistory: [],
      userPreferences: {
        preferredBrands: context.preferredBrands,
        budgetRange: context.budgetRange,
        preferredFuelType: context.preferredFuelType,
        preferredBodyStyle: context.preferredBodyStyle,
        priorityFeatures: context.priorityFeatures
      },
      viewedVehicles: [],
      sessionDuration: 0
    };

    try {
      const aiResult = await vehicleAIRecommendationService.getRecommendations(
        query,
        promptContext,
        {
          budgetRange: criteria.budget,
          fuelType: criteria.fuelType,
          bodyStyle: criteria.bodyStyle,
          brands: criteria.brand ? [criteria.brand] : undefined,
          features: criteria.features,
          useCase: criteria.useCase,
          priority: criteria.priority
        }
      );

      if (aiResult.success && aiResult.vehicles.length > 0) {
        const recommendations: VehicleRecommendation[] = aiResult.recommendations.map((rec, idx) => {
          const vehicle = aiResult.vehicles[idx];
          return {
            vehicle,
            matchScore: rec.confidence,
            matchReasons: rec.keyHighlights.length > 0 ? rec.keyHighlights : [rec.reasoning],
            bestFor: [rec.bestFor],
            pros: rec.keyHighlights,
            cons: []
          };
        });

        const comparison: ComparisonResult | undefined = aiResult.comparisonSummary ? {
          vehicles: aiResult.vehicles,
          winner: aiResult.vehicles[0]?.modelName,
          comparisonPoints: [],
          summary: aiResult.comparisonSummary
        } : undefined;

        return {
          type: aiResult.vehicles.length === 1 ? 'single' : intent === 'comparison' ? 'comparison' : 'recommendation',
          message: aiResult.verdict || this.generateResponseMessage(recommendations, criteria, intent),
          recommendations,
          comparison,
          criteria,
          followUpQuestions: aiResult.followUpQuestions,
          actions: aiResult.suggestedActions.map(action => ({
            type: action.type as AssistantAction['type'],
            label: action.label,
            payload: action.vehicleId
          }))
        };
      }
    } catch (error) {
      console.error('AI recommendation failed, falling back to rules-based:', error);
    }

    return this.fallbackToRulesBased(query, allVehicles, criteria, intent);
  }

  async processVoiceInput(transcript: string, context: UserPreferenceContext): Promise<AIRecommendationResponse> {
    const promptContext = {
      userQuery: transcript,
      intent: this.detectIntent(transcript),
      conversationHistory: [],
      userPreferences: {
        preferredBrands: context.preferredBrands,
        budgetRange: context.budgetRange,
        preferredFuelType: context.preferredFuelType,
        preferredBodyStyle: context.preferredBodyStyle,
        priorityFeatures: context.priorityFeatures
      },
      viewedVehicles: [],
      sessionDuration: 0
    };

    try {
      const voiceResult = await vehicleAIRecommendationService.getVoiceResponse(
        transcript,
        promptContext
      );

      if (voiceResult.suggestedVehicles.length > 0) {
        const recommendations: VehicleRecommendation[] = voiceResult.suggestedVehicles.map(v => ({
          vehicle: v,
          matchScore: voiceResult.confidence,
          matchReasons: ['Matches your voice query'],
          bestFor: ['Your needs'],
          pros: v.tags.slice(0, 3),
          cons: []
        }));

        return {
          type: 'recommendation',
          message: voiceResult.response,
          recommendations,
          criteria: {},
          followUpQuestions: voiceResult.followUpQuestion ? [voiceResult.followUpQuestion] : [],
          actions: voiceResult.actions as AssistantAction[]
        };
      }
    } catch (error) {
      console.error('Voice AI failed, falling back:', error);
    }

    return this.processQuery(transcript, context);
  }

  private fallbackToRulesBased(
    query: string,
    vehicles: Vehicle[],
    criteria: RecommendationCriteria,
    intent: AssistantIntent
  ): AIRecommendationResponse {
    if (intent === 'comparison') {
      const comparison = this.generateComparison(query, vehicles, criteria);
      if (comparison.vehicles.length >= 2) {
        return {
          type: 'comparison',
          message: comparison.summary,
          recommendations: comparison.vehicles.map((v) => this.createRecommendation(v, criteria)),
          comparison,
          criteria,
          followUpQuestions: this.generateFollowUpQuestions(intent, criteria),
          actions: this.generateActions('comparison', comparison.vehicles)
        };
      }
    }

    const recommendations = this.findRecommendations(vehicles, criteria, intent);
    const topRecommendations = recommendations.slice(0, 3);

    return {
      type: recommendations.length === 1 ? 'single' : 'recommendation',
      message: this.generateResponseMessage(topRecommendations, criteria, intent),
      recommendations: topRecommendations,
      criteria,
      followUpQuestions: this.generateFollowUpQuestions(intent, criteria),
      actions: this.generateActions(intent, topRecommendations.map((r) => r.vehicle))
    };
  }

  private extractCriteria(query: string, context: UserPreferenceContext): RecommendationCriteria {
    const criteria: RecommendationCriteria = {};
    const lowerQuery = query.toLowerCase();

    const priceMatch = lowerQuery.match(/(?:under|below|within|up to)\s*(?:Rs\.?\s*)?(\d+(?:\.\d+)?)\s*(k|thousand|lakh)?/i);
    if (priceMatch) {
      let price = parseFloat(priceMatch[1]);
      const unit = priceMatch[2]?.toLowerCase();
      if (unit === 'lakh' || unit === 'lakhs') {
        price *= 100000;
      } else if (unit === 'k' || unit === 'thousand' || price < 100) {
        price *= 1000;
      }
      criteria.budget = { min: 0, max: price };
    }

    const rangeMatch = lowerQuery.match(/(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(k|thousand|lakh)?/i);
    if (rangeMatch) {
      let min = parseFloat(rangeMatch[1]);
      let max = parseFloat(rangeMatch[2]);
      const unit = rangeMatch[3]?.toLowerCase();
      if (unit === 'lakh' || unit === 'lakhs') {
        min *= 100000;
        max *= 100000;
      } else if (unit === 'k' || unit === 'thousand' || max < 100) {
        min *= 1000;
        max *= 1000;
      }
      criteria.budget = { min, max };
    }

    if (/electric|ev|battery/.test(lowerQuery)) {
      criteria.fuelType = 'Electric';
    } else if (/petrol/.test(lowerQuery)) {
      criteria.fuelType = 'Petrol';
    }

    if (/scooter|activa|jupiter|access/.test(lowerQuery)) {
      criteria.bodyStyle = 'Scooter';
    } else if (/sports|bike|racing|performance/.test(lowerQuery)) {
      criteria.bodyStyle = 'Sports';
    } else if (/cruiser|classic|bullet|royal enfield/.test(lowerQuery)) {
      criteria.bodyStyle = 'Cruiser';
    } else if (/commuter|daily|mileage/.test(lowerQuery)) {
      criteria.bodyStyle = 'Commuter';
    }

    const brandMatch = lowerQuery.match(/\b(hero|honda|tvs|bajaj|royal enfield|yamaha|suzuki|ktm|ather|ola)\b/i);
    if (brandMatch) {
      criteria.brand = brandMatch[1];
    }

    if (/daily commute|office|city|urban/.test(lowerQuery)) {
      criteria.useCase = 'city';
    } else if (/highway|touring|long distance/.test(lowerQuery)) {
      criteria.useCase = 'highway';
    } else if (/offroad|adventure|mountain/.test(lowerQuery)) {
      criteria.useCase = 'offroad';
    } else if (/performance|speed|racing/.test(lowerQuery)) {
      criteria.useCase = 'performance';
    }

    if (/mileage|fuel efficiency|economy/.test(lowerQuery)) {
      criteria.priority = 'mileage';
    } else if (/power|performance|speed/.test(lowerQuery)) {
      criteria.priority = 'performance';
    } else if (/comfort|smooth|premium/.test(lowerQuery)) {
      criteria.priority = 'comfort';
    } else if (/budget|affordable|cheap|value/.test(lowerQuery)) {
      criteria.priority = 'budget';
    } else if (/style|look|design/.test(lowerQuery)) {
      criteria.priority = 'style';
    }

    const features: string[] = [];
    if (/abs|braking|safety/.test(lowerQuery)) features.push('ABS');
    if (/disc brake/.test(lowerQuery)) features.push('Disc Brake');
    if (/efi|fuel injection/.test(lowerQuery)) features.push('Fuel Injection');
    if (/bluetooth|connectivity|smart/.test(lowerQuery)) features.push('Bluetooth');
    if (/gps|navigation/.test(lowerQuery)) features.push('GPS');
    if (/led|light/.test(lowerQuery)) features.push('LED Lights');
    if (/tubeless/.test(lowerQuery)) features.push('Tubeless Tyres');

    if (features.length > 0) {
      criteria.features = features;
    }

    return criteria;
  }

  private detectIntent(query: string): AssistantIntent {
    const lowerQuery = query.toLowerCase();

    const comparisonKeywords = /compare|vs|versus|difference|better than|which is better/;
    const multipleModels = /activa.*jupiter|jupiter.*activa|classic.*bullet|bullet.*classic|duke.*rc|rc.*duke|honda.*tvs|tvs.*honda/i;

    if (multipleModels.test(lowerQuery)) {
      return 'comparison';
    }

    if (comparisonKeywords.test(lowerQuery)) {
      const words = lowerQuery.split(/\s+/);
      let modelMentions = 0;

      for (const word of words) {
        if (word.length > 3 && !['compare', 'versus', 'better', 'which', 'between'].includes(word)) {
          modelMentions++;
        }
      }

      if (modelMentions >= 2) {
        return 'comparison';
      }
    }

    if (/recommend|suggest|best|which.*should|help me choose|what.*buy/i.test(lowerQuery)) {
      return 'recommendation';
    }

    if (/specs|specifications|power|engine|cc|torque|mileage|weight/i.test(lowerQuery)) {
      return 'specs-query';
    }

    if (/price|cost|emi|budget|affordable|cheap|how much/i.test(lowerQuery)) {
      return 'financing';
    }

    if (/test ride|book.*ride|schedule.*ride/i.test(lowerQuery)) {
      return 'test-ride';
    }

    return 'vehicle-search';
  }

  private findRecommendations(
    vehicles: Vehicle[],
    criteria: RecommendationCriteria,
    intent: AssistantIntent
  ): VehicleRecommendation[] {
    const scored = vehicles.map((vehicle) => ({
      vehicle,
      score: this.calculateMatchScore(vehicle, criteria, intent)
    }));

    const filtered = scored.filter((item) => item.score > 0.3);
    const sorted = filtered.sort((a, b) => b.score - a.score);

    return sorted.slice(0, 5).map((item) =>
      this.createRecommendation(item.vehicle, criteria, item.score)
    );
  }

  private calculateMatchScore(vehicle: Vehicle, criteria: RecommendationCriteria, intent: AssistantIntent): number {
    let score = 0;
    let factors = 0;

    if (criteria.budget) {
      factors++;
      const avgPrice = (vehicle.priceRange.min + vehicle.priceRange.max) / 2;
      if (avgPrice <= criteria.budget.max && avgPrice >= criteria.budget.min) {
        score += 1;
      } else if (avgPrice <= criteria.budget.max * 1.1) {
        score += 0.7;
      } else if (avgPrice <= criteria.budget.max * 1.2) {
        score += 0.4;
      }
    }

    if (criteria.fuelType) {
      factors++;
      if (vehicle.fuelType.toLowerCase() === criteria.fuelType.toLowerCase()) {
        score += 1;
      }
    }

    if (criteria.bodyStyle) {
      factors++;
      if (vehicle.bodyStyle.toLowerCase() === criteria.bodyStyle.toLowerCase()) {
        score += 1;
      } else if (criteria.bodyStyle === 'Scooter' && vehicle.vehicleType === 'Scooter') {
        score += 0.8;
      }
    }

    if (criteria.brand) {
      factors++;
      if (vehicle.makeName.toLowerCase().includes(criteria.brand.toLowerCase())) {
        score += 1;
      }
    }

    if (criteria.useCase) {
      factors++;
      score += this.calculateUseCaseScore(vehicle, criteria.useCase);
    }

    if (criteria.priority) {
      factors++;
      score += this.calculatePriorityScore(vehicle, criteria.priority);
    }

    if (criteria.features && criteria.features.length > 0) {
      factors++;
      const matchedFeatures = criteria.features.filter((f) =>
        vehicle.tags.some((tag) => tag.toLowerCase().includes(f.toLowerCase())) ||
        vehicle.features.some((feat) => feat.name.toLowerCase().includes(f.toLowerCase()))
      );
      score += matchedFeatures.length / criteria.features.length;
    }

    return factors > 0 ? score / factors : 0.5;
  }

  private calculateUseCaseScore(vehicle: Vehicle, useCase: string): number {
    const specs = vehicle.variants[0]?.specs || {};

    switch (useCase) {
      case 'city':
        if (vehicle.bodyStyle === 'Scooter') return 0.9;
        if (vehicle.tags.includes('fuel-efficient')) return 0.85;
        if (parseInt(specs['Mileage - ARAI'] || '0') > 50) return 0.8;
        return 0.6;

      case 'highway':
        if (vehicle.bodyStyle === 'Cruiser') return 0.9;
        if (vehicle.bodyStyle === 'Sports') return 0.85;
        if (parseInt(specs['Displacement'] || '0') > 150) return 0.75;
        return 0.5;

      case 'offroad':
        if (vehicle.bodyStyle === 'Adventure') return 0.95;
        if (vehicle.tags.includes('offroad')) return 0.9;
        return 0.4;

      case 'performance':
        if (vehicle.bodyStyle === 'Sports') return 0.95;
        if (parseInt(specs['Power'] || '0') > 15) return 0.85;
        if (parseInt(specs['Displacement'] || '0') > 200) return 0.8;
        return 0.5;

      default:
        return 0.5;
    }
  }

  private calculatePriorityScore(vehicle: Vehicle, priority: string): number {
    const specs = vehicle.variants[0]?.specs || {};

    switch (priority) {
      case 'mileage':
        const mileage = parseInt(specs['Mileage - ARAI'] || '0');
        if (mileage > 60) return 1;
        if (mileage > 50) return 0.85;
        if (mileage > 40) return 0.7;
        return 0.5;

      case 'performance':
        const power = parseInt(specs['Power'] || '0');
        if (power > 20) return 1;
        if (power > 15) return 0.85;
        if (power > 10) return 0.7;
        return 0.5;

      case 'comfort':
        if (vehicle.tags.includes('comfortable')) return 0.9;
        if (vehicle.bodyStyle === 'Cruiser') return 0.85;
        return 0.6;

      case 'budget':
        const avgPrice = (vehicle.priceRange.min + vehicle.priceRange.max) / 2;
        if (avgPrice < 80000) return 1;
        if (avgPrice < 100000) return 0.85;
        if (avgPrice < 150000) return 0.7;
        return 0.5;

      case 'style':
        if (vehicle.bodyStyle === 'Sports' || vehicle.bodyStyle === 'Cruiser') return 0.9;
        if (vehicle.tags.includes('stylish')) return 0.85;
        return 0.6;

      default:
        return 0.5;
    }
  }

  private createRecommendation(vehicle: Vehicle, criteria: RecommendationCriteria, score = 0.8): VehicleRecommendation {
    const matchReasons: string[] = [];
    const bestFor: string[] = [];
    const pros: string[] = [];
    const cons: string[] = [];

    if (criteria.budget) {
      const avgPrice = (vehicle.priceRange.min + vehicle.priceRange.max) / 2;
      if (avgPrice <= criteria.budget.max) {
        matchReasons.push(`Within your budget of ₹${criteria.budget.max.toLocaleString('en-IN')}`);
      }
    }

    if (criteria.fuelType && vehicle.fuelType === criteria.fuelType) {
      matchReasons.push(`${criteria.fuelType} vehicle as requested`);
    }

    if (vehicle.tags.includes('high-mileage')) {
      pros.push('Excellent fuel economy');
      bestFor.push('Daily commuters');
    }

    if (vehicle.tags.includes('powerful')) {
      pros.push('Strong performance');
      bestFor.push('Highway riders');
    }

    if (vehicle.tags.includes('abs')) {
      pros.push('Enhanced safety with ABS');
    }

    if (vehicle.isElectric) {
      pros.push('Zero emissions');
      pros.push('Low running costs');
      bestFor.push('Eco-conscious riders');
    }

    if (vehicle.bodyStyle === 'Scooter') {
      pros.push('Easy to ride');
      pros.push('Great for city traffic');
      bestFor.push('City commuters');
    }

    if (vehicle.priceRange.max > 200000) {
      cons.push('Higher price point');
    }

    if (!vehicle.tags.includes('abs') && parseInt(vehicle.variants[0]?.specs['Displacement'] || '0') > 150) {
      cons.push('No ABS on base variant');
    }

    return {
      vehicle,
      matchScore: score,
      matchReasons: matchReasons.length > 0 ? matchReasons : ['Good overall match'],
      bestFor: bestFor.length > 0 ? bestFor : ['General use'],
      pros: pros.length > 0 ? pros : ['Reliable brand', 'Good resale value'],
      cons: cons.length > 0 ? cons : ['None significant']
    };
  }

  private generateComparison(
    query: string,
    vehicles: Vehicle[],
    criteria: RecommendationCriteria
  ): ComparisonResult {
    const lowerQuery = query.toLowerCase();
    const mentionedVehicles: Vehicle[] = [];
    const matchedVehicleIds = new Set<string>();

    const words = lowerQuery.split(/\s+/);

    for (const vehicle of vehicles) {
      const modelNameLower = vehicle.modelName.toLowerCase();
      const makeNameLower = vehicle.makeName.toLowerCase();

      for (const word of words) {
        if (word.length < 3) continue;

        if (modelNameLower.includes(word) || word.includes(modelNameLower)) {
          if (!matchedVehicleIds.has(vehicle.id)) {
            mentionedVehicles.push(vehicle);
            matchedVehicleIds.add(vehicle.id);
          }
          break;
        }
      }
    }

    const activaMentioned = lowerQuery.includes('activa');
    const jupiterMentioned = lowerQuery.includes('jupiter');

    if (activaMentioned && jupiterMentioned) {
      const activa = vehicles.find((v) =>
        v.modelName.toLowerCase().includes('activa')
      );
      const jupiter = vehicles.find((v) =>
        v.modelName.toLowerCase().includes('jupiter')
      );

      if (activa && !matchedVehicleIds.has(activa.id)) {
        mentionedVehicles.push(activa);
        matchedVehicleIds.add(activa.id);
      }
      if (jupiter && !matchedVehicleIds.has(jupiter.id)) {
        mentionedVehicles.push(jupiter);
        matchedVehicleIds.add(jupiter.id);
      }
    }

    const toCompare = mentionedVehicles.slice(0, 3);

    const comparisonPoints: ComparisonResult['comparisonPoints'] = [];

    if (toCompare.length >= 2) {
      const priceWinner = toCompare.reduce((prev, current) => {
        const prevPrice = (prev.priceRange.min + prev.priceRange.max) / 2;
        const currPrice = (current.priceRange.min + current.priceRange.max) / 2;
        return currPrice < prevPrice ? current : prev;
      });

      comparisonPoints.push({
        category: 'Price',
        winner: priceWinner.modelName,
        details: Object.fromEntries(
          toCompare.map((v) => [
            v.modelName,
            `₹${Math.round((v.priceRange.min + v.priceRange.max) / 2).toLocaleString('en-IN')}`
          ])
        )
      });

      const mileageData = toCompare.map((v) => ({
        vehicle: v,
        mileage: parseInt(v.variants[0]?.specs['Mileage - ARAI'] || '0')
      }));
      const mileageWinner = mileageData.reduce((a, b) => (a.mileage > b.mileage ? a : b));

      comparisonPoints.push({
        category: 'Mileage',
        winner: mileageWinner.vehicle.modelName,
        details: Object.fromEntries(
          mileageData.map((d) => [d.vehicle.modelName, `${d.mileage} kmpl`])
        )
      });

      const powerData = toCompare.map((v) => ({
        vehicle: v,
        power: parseInt(v.variants[0]?.specs['Power'] || '0')
      }));
      const powerWinner = powerData.reduce((a, b) => (a.power > b.power ? a : b));

      if (powerWinner.power > 0) {
        comparisonPoints.push({
          category: 'Power',
          winner: powerWinner.vehicle.modelName,
          details: Object.fromEntries(
            powerData.map((d) => [d.vehicle.modelName, `${d.power} PS`])
          )
        });
      }

      const weightData = toCompare.map((v) => ({
        vehicle: v,
        weight: parseInt(v.variants[0]?.specs['Kerb Weight'] || '0')
      }));
      const weightWinner = weightData.reduce((a, b) => (a.weight < b.weight ? a : b));

      if (weightWinner.weight > 0) {
        comparisonPoints.push({
          category: 'Weight',
          winner: weightWinner.vehicle.modelName,
          details: Object.fromEntries(
            weightData.map((d) => [d.vehicle.modelName, `${d.weight} kg`])
          )
        });
      }
    }

    const winner = toCompare.length > 0 ? toCompare[0].modelName : undefined;

    return {
      vehicles: toCompare,
      winner,
      comparisonPoints,
      summary: this.generateComparisonSummary(toCompare, comparisonPoints)
    };
  }

  private generateComparisonSummary(vehicles: Vehicle[], points: ComparisonResult['comparisonPoints']): string {
    if (vehicles.length === 0) return 'No vehicles found to compare.';
    if (vehicles.length === 1) return `${vehicles[0].modelName} is the only matching vehicle.`;

    const vehicleNames = vehicles.map((v) => v.modelName).join(' vs ');
    let summary = `Comparing ${vehicleNames}:\n\n`;

    for (const point of points) {
      summary += `${point.category}: ${point.winner} wins\n`;
    }

    summary += '\nOverall recommendation depends on your priority.';
    return summary;
  }

  private generateResponseMessage(
    recommendations: VehicleRecommendation[],
    criteria: RecommendationCriteria,
    intent: AssistantIntent
  ): string {
    if (recommendations.length === 0) {
      return "I couldn't find any bikes matching your criteria. Try adjusting your budget or requirements.";
    }

    const topPick = recommendations[0];
    const avgPrice = (topPick.vehicle.priceRange.min + topPick.vehicle.priceRange.max) / 2;

    let message = '';

    if (intent === 'recommendation') {
      message = `Based on your ${criteria.priority || 'needs'}, I recommend the **${topPick.vehicle.makeName} ${topPick.vehicle.modelName}**! `;
      message += `Priced at ₹${avgPrice.toLocaleString('en-IN')}, `;
      message += `it offers ${topPick.pros.slice(0, 2).join(' and ')}. `;

      if (recommendations.length > 1) {
        message += `I also found ${recommendations.length - 1} other great option${recommendations.length > 2 ? 's' : ''} for you.`;
      }
    } else if (intent === 'financing') {
      message = `The **${topPick.vehicle.modelName}** fits your budget at ₹${avgPrice.toLocaleString('en-IN')}. `;
      const emi = Math.round(avgPrice / 24);
      message += `Estimated EMI: ₹${emi}/month for 24 months.`;
    } else {
      message = `Found ${recommendations.length} bike${recommendations.length > 1 ? 's' : ''} for you! `;
      message += `Top pick: **${topPick.vehicle.makeName} ${topPick.vehicle.modelName}** at ₹${avgPrice.toLocaleString('en-IN')}.`;
    }

    return message;
  }

  private generateFollowUpQuestions(intent: AssistantIntent, criteria: RecommendationCriteria): string[] {
    const questions: string[] = [];

    if (intent === 'recommendation') {
      questions.push('Want to see detailed specs?');
      questions.push('Compare with similar bikes?');
      questions.push('Check EMI options?');
    } else if (intent === 'comparison') {
      questions.push('View full specifications?');
      questions.push('Book a test ride?');
    } else {
      questions.push('Narrow down by brand?');
      questions.push('Filter by fuel type?');
      questions.push('Set a specific budget?');
    }

    return questions.slice(0, 3);
  }

  private generateActions(intent: AssistantIntent, vehicles: Vehicle[]): AssistantAction[] {
    const actions: AssistantAction[] = [];

    if (vehicles.length > 0) {
      actions.push({
        type: 'view-details',
        label: `View ${vehicles[0].modelName}`,
        payload: `/vehicles/${vehicles[0].id}`
      });
    }

    if (vehicles.length > 1) {
      actions.push({
        type: 'compare',
        label: 'Compare All',
        payload: { vehicles: vehicles.slice(0, 3).map((v) => v.id) }
      });
    }

    if (intent === 'financing' || intent === 'recommendation') {
      actions.push({
        type: 'book-test-ride',
        label: 'Book Test Ride',
        payload: vehicles[0]?.id
      });
    }

    return actions;
  }
}

export const aiRecommendationEngine = AIRecommendationEngine.getInstance();

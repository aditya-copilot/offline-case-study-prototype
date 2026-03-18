import { vehicleDataLoader } from '@core/data/vehicleDataLoader';
import { vehicleAIContext } from '@core/ai/vehicleAIContext';
import { vehicleZoneEngine } from '@core/navigation/vehicleZoneEngine';
import type {
  AssistantMessage,
  AssistantContext,
  ReasoningResult,
  AssistantIntent,
  AssistantPersonality,
  MultimodalInput
} from '../types';
import { generateId } from '@core/utils';

export class AssistantEngine {
  private static instance: AssistantEngine;
  private context: AssistantContext;
  private personality: AssistantPersonality = 'auto';
  private processingQueue: Map<string, Promise<AssistantMessage>> = new Map();

  private constructor() {
    this.context = this.initializeContext();
  }

  static getInstance(): AssistantEngine {
    if (!AssistantEngine.instance) {
      AssistantEngine.instance = new AssistantEngine();
    }
    return AssistantEngine.instance;
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

  async processInput(input: MultimodalInput): Promise<AssistantMessage> {
    const startTime = performance.now();
    const messageId = generateId();

    try {
      this.updateContext(input);

      const reasoning = await this.performReasoning(input);
      const response = await this.generateResponse(reasoning, input);

      return {
        id: messageId,
        role: 'assistant',
        type: this.determineMessageType(reasoning),
        content: response.text,
        metadata: {
          confidence: reasoning.confidence,
          processingTime: performance.now() - startTime,
          sources: ['dataset', 'ai-reasoning'],
          vehicles: reasoning.suggestedVehicles,
          actions: response.actions
        },
        timestamp: Date.now()
      };
    } catch (error) {
      return this.generateErrorResponse(messageId, error);
    }
  }

  private async performReasoning(input: MultimodalInput): Promise<ReasoningResult> {
    const query = input.text || input.voice?.transcript || '';

    await vehicleDataLoader.load();
    await vehicleZoneEngine.initialize();

    const intent = this.detectIntent(query);
    const vehicles = vehicleDataLoader.getAllVehicles();

    const suggestedVehicles = this.findRelevantVehicles(query, intent, vehicles);
    const confidence = this.calculateConfidence(query, suggestedVehicles);

    return {
      intent,
      confidence,
      suggestedVehicles: suggestedVehicles.map(v => v.id),
      reasoning: this.buildReasoningExplanation(intent, suggestedVehicles, query),
      followUpQuestions: this.generateFollowUpQuestions(intent, suggestedVehicles),
      relatedSpecs: this.extractRelatedSpecs(query, suggestedVehicles)
    };
  }

  private detectIntent(query: string): AssistantIntent {
    const lowerQuery = query.toLowerCase();

    const intentPatterns: Record<AssistantIntent, string[]> = {
      'vehicle-search': ['show me', 'find', 'looking for', 'search', 'bike under', 'scooter'],
      'comparison': ['compare', 'difference between', 'vs', 'versus', 'which is better'],
      'feature-explanation': ['what is', 'how does', 'explain', 'feature', 'specs', 'mileage'],
      'financing': ['emi', 'finance', 'loan', 'price', 'cost', 'budget', 'affordable'],
      'navigation': ['where is', 'how to reach', 'directions', 'locate', 'find zone'],
      'test-ride': ['test ride', 'book test', 'ride', 'try', 'experience'],
      'recommendation': ['recommend', 'suggest', 'best bike', 'which bike', 'what should'],
      'specs-query': ['specifications', 'power', 'engine', 'cc', 'torque', 'brakes'],
      'general-chat': []
    };

    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      if (patterns.some(pattern => lowerQuery.includes(pattern))) {
        return intent as AssistantIntent;
      }
    }

    return 'general-chat';
  }

  private findRelevantVehicles(query: string, intent: AssistantIntent, vehicles: any[]) {
    const lowerQuery = query.toLowerCase();

    return vehicles.filter(vehicle => {
      const matchScore = this.calculateMatchScore(vehicle, lowerQuery, intent);
      return matchScore > 0.3;
    }).sort((a, b) => {
      return this.calculateMatchScore(b, lowerQuery, intent) -
             this.calculateMatchScore(a, lowerQuery, intent);
    }).slice(0, 5);
  }

  private calculateMatchScore(vehicle: any, query: string, intent: AssistantIntent): number {
    let score = 0;

    if (query.includes(vehicle.makeName.toLowerCase())) score += 0.3;
    if (query.includes(vehicle.modelName.toLowerCase())) score += 0.4;
    if (query.includes(vehicle.fuelType.toLowerCase())) score += 0.2;
    if (query.includes(vehicle.bodyStyle.toLowerCase())) score += 0.25;

    vehicle.tags.forEach((tag: string) => {
      if (query.includes(tag.toLowerCase())) score += 0.15;
    });

    const avgPrice = (vehicle.priceRange.min + vehicle.priceRange.max) / 2;
    const priceMatch = query.match(/(\d+)/g);
    if (priceMatch && intent === 'financing') {
      const queryPrice = parseInt(priceMatch[0]) * 1000;
      if (avgPrice <= queryPrice * 1.2 && avgPrice >= queryPrice * 0.5) {
        score += 0.3;
      }
    }

    return Math.min(score, 1.0);
  }

  private calculateConfidence(query: string, vehicles: any[]): number {
    if (vehicles.length === 0) return 0.3;
    if (query.length < 5) return 0.5;
    return Math.min(0.6 + (vehicles.length > 0 ? 0.2 : 0) + (query.length > 20 ? 0.2 : 0), 1.0);
  }

  private async generateResponse(reasoning: ReasoningResult, input: MultimodalInput): Promise<{
    text: string;
    actions: any[];
  }> {
    const personality = this.getActivePersonality();
    const vehicles = vehicleDataLoader.getAllVehicles().filter(
      v => reasoning.suggestedVehicles.includes(v.id)
    );

    switch (reasoning.intent) {
      case 'vehicle-search':
        return this.generateSearchResponse(vehicles, personality);
      case 'comparison':
        return this.generateComparisonResponse(vehicles, personality);
      case 'feature-explanation':
        return this.generateFeatureResponse(vehicles, reasoning.relatedSpecs, personality);
      case 'financing':
        return this.generateFinancingResponse(vehicles, personality);
      case 'recommendation':
        return this.generateRecommendationResponse(vehicles, personality);
      default:
        return this.generateGeneralResponse(reasoning, personality);
    }
  }

  private generateSearchResponse(vehicles: any[], personality: AssistantPersonality): {
    text: string;
    actions: any[];
  } {
    if (vehicles.length === 0) {
      return {
        text: "I couldn't find any bikes matching your exact criteria, but don't worry! I'd love to suggest some popular options that might surprise you. Would you like to explore?",
        actions: [{ type: 'navigate', label: 'Browse All Bikes', payload: '/vehicles' }]
      };
    }

    const prefix = this.getPersonalityPrefix(personality);
    const vehicleList = vehicles.slice(0, 3).map(v =>
      `${v.makeName} ${v.modelName} (₹${Math.round((v.priceRange.min + v.priceRange.max) / 2).toLocaleString('en-IN')})`
    ).join(', ');

    const warmPhrases = [
      "Great news! I found some perfect matches for you",
      "Exciting! Here are some bikes you'll love",
      "Perfect! I found these gems for you"
    ];
    const warmPhrase = warmPhrases[Math.floor(Math.random() * warmPhrases.length)];

    return {
      text: `${prefix}${warmPhrase}! ${vehicles.length > 0 ? `Top picks: ${vehicleList}.` : ''} I can show you details, compare them, or even check EMI options. What would you like to explore?`,
      actions: vehicles.map(v => ({
        type: 'view-details',
        label: `View ${v.modelName}`,
        payload: `/vehicles/${v.id}`
      }))
    };
  }

  private generateComparisonResponse(vehicles: any[], personality: AssistantPersonality): {
    text: string;
    actions: any[];
  } {
    if (vehicles.length < 2) {
      return {
        text: "I need at least 2 bikes to compare. Please specify which bikes you'd like to compare.",
        actions: [{ type: 'navigate', label: 'Browse Bikes', payload: '/vehicles' }]
      };
    }

    return {
      text: `I'll compare ${vehicles[0].modelName} vs ${vehicles[1].modelName} for you. Here are the key differences...`,
      actions: [
        { type: 'compare', label: 'Full Comparison', payload: { vehicles: vehicles.slice(0, 2).map(v => v.id) } },
        { type: 'navigate', label: 'View Details', payload: `/vehicles/${vehicles[0].id}` }
      ]
    };
  }

  private generateFeatureResponse(vehicles: any[], specs: string[], personality: AssistantPersonality): {
    text: string;
    actions: any[];
  } {
    const prefix = this.getPersonalityPrefix(personality);

    if (vehicles.length === 0) {
      return {
        text: `${prefix}Let me explain ${specs[0] || 'this feature'}...`,
        actions: []
      };
    }

    return {
      text: `${prefix}${vehicles[0].modelName} features ${specs.join(', ')}. Would you like to know more about specific specifications?`,
      actions: [
        { type: 'view-details', label: 'Full Specs', payload: `/vehicles/${vehicles[0].id}` }
      ]
    };
  }

  private generateFinancingResponse(vehicles: any[], personality: AssistantPersonality): {
    text: string;
    actions: any[];
  } {
    const prefix = this.getPersonalityPrefix(personality);

    if (vehicles.length === 0) {
      return {
        text: `${prefix}I can help you with financing options. What's your budget range?`,
        actions: [{ type: 'navigate', label: 'Browse by Price', payload: '/vehicles' }]
      };
    }

    const avgPrice = (vehicles[0].priceRange.min + vehicles[0].priceRange.max) / 2;
    const emi = Math.round(avgPrice / 24);

    return {
      text: `${prefix}The ${vehicles[0].modelName} is priced at ₹${avgPrice.toLocaleString('en-IN')}. Estimated EMI starts at ₹${emi.toLocaleString('en-IN')}/month for 24 months. Would you like to explore more financing options?`,
      actions: [
        { type: 'view-details', label: 'View Details', payload: `/vehicles/${vehicles[0].id}` },
        { type: 'book-test-ride', label: 'Book Test Ride', payload: vehicles[0].id }
      ]
    };
  }

  private generateRecommendationResponse(vehicles: any[], personality: AssistantPersonality): {
    text: string;
    actions: any[];
  } {
    const prefix = this.getPersonalityPrefix(personality);

    if (vehicles.length === 0) {
      return {
        text: `${prefix}I'd love to help you find the perfect bike! To give you the best recommendations, could you tell me what matters most to you - fuel efficiency, power and performance, or staying within a specific budget?`,
        actions: [{ type: 'navigate', label: 'Browse All', payload: '/vehicles' }]
      };
    }

    const topPick = vehicles[0];
    const warmIntros = [
      "I've found something special for you!",
      "This bike caught my attention for you!",
      "I think you'll love this recommendation!"
    ];
    const warmIntro = warmIntros[Math.floor(Math.random() * warmIntros.length)];

    return {
      text: `${prefix}${warmIntro} The ${topPick.makeName} ${topPick.modelName} would be perfect for you. With its ${topPick.tags.slice(0, 2).join(' and ')}, and priced at ₹${Math.round((topPick.priceRange.min + topPick.priceRange.max) / 2).toLocaleString('en-IN')}, it checks all the boxes. Want to explore it further or see similar options?`,
      actions: [
        { type: 'view-details', label: 'View Details', payload: `/vehicles/${topPick.id}` },
        { type: 'book-test-ride', label: 'Book Test Ride', payload: topPick.id }
      ]
    };
  }

  private generateGeneralResponse(reasoning: ReasoningResult, personality: AssistantPersonality): {
    text: string;
    actions: any[];
  } {
    const prefix = this.getPersonalityPrefix(personality);

    return {
      text: `${prefix}I'm here to help you find the perfect two-wheeler! You can ask me about specific bikes, compare models, check financing options, or get recommendations based on your needs.`,
      actions: [
        { type: 'navigate', label: 'Browse Bikes', payload: '/vehicles' },
        { type: 'navigate', label: 'Compare Bikes', payload: '/compare' }
      ]
    };
  }

  private getActivePersonality(): AssistantPersonality {
    if (this.personality !== 'auto') return this.personality;

    const zone = this.context.currentZone;
    if (zone === 'ev-showroom') return 'ev-expert';
    if (zone === 'budget-zone') return 'budget-advisor';
    if (zone === 'premium-zone' || zone === 'sports-zone') return 'performance-guru';

    return 'friendly-guide';
  }

  private getPersonalityPrefix(personality: AssistantPersonality): string {
    const prefixes: Record<AssistantPersonality, string> = {
      'ev-expert': '🔋 As an EV specialist, ',
      'budget-advisor': '💰 Looking for value? ',
      'performance-guru': '⚡ For performance enthusiasts, ',
      'friendly-guide': '😊 ',
      'auto': ''
    };

    return prefixes[personality] || '';
  }

  private buildReasoningExplanation(intent: AssistantIntent, vehicles: any[], query: string): string {
    return `Detected intent: ${intent}. Found ${vehicles.length} relevant vehicles based on query: "${query}"`;
  }

  private generateFollowUpQuestions(intent: AssistantIntent, vehicles: any[]): string[] {
    const questions: Record<AssistantIntent, string[]> = {
      'vehicle-search': ['What\'s your budget range?', 'Do you prefer petrol or electric?', 'Any specific brand in mind?'],
      'comparison': ['Which features matter most to you?', 'What\'s your primary use case?'],
      'feature-explanation': ['Would you like to see the full specifications?', 'Any other features you\'re curious about?'],
      'financing': ['What\'s your preferred down payment?', 'EMI tenure preference?'],
      'navigation': ['Would you like directions to a specific zone?', 'Need help finding something?'],
      'test-ride': ['When would you like to schedule?', 'Any specific bike in mind?'],
      'recommendation': ['What\'s your daily commute distance?', 'Any must-have features?'],
      'specs-query': ['Would you like a detailed comparison?', 'Interested in similar bikes?'],
      'general-chat': ['How can I help you today?', 'Looking for anything specific?']
    };

    return questions[intent] || questions['general-chat'];
  }

  private extractRelatedSpecs(query: string, vehicles: any[]): string[] {
    const specKeywords = ['mileage', 'power', 'engine', 'brakes', 'suspension', 'weight', 'seat height'];
    return specKeywords.filter(spec => query.toLowerCase().includes(spec));
  }

  private determineMessageType(reasoning: ReasoningResult): any {
    const typeMap: Record<AssistantIntent, any> = {
      'vehicle-search': 'vehicle-card',
      'comparison': 'comparison-table',
      'navigation': 'navigation-cta',
      'feature-explanation': 'feature-list',
      'specs-query': 'spec-highlight',
      'recommendation': 'vehicle-card',
      'financing': 'text',
      'test-ride': 'navigation-cta',
      'general-chat': 'text'
    };

    return typeMap[reasoning.intent] || 'text';
  }

  private updateContext(input: MultimodalInput): void {
    this.context = {
      ...this.context,
      ...input.context,
      sessionDuration: Date.now() - (this.context as any).startTime || 0
    };
  }

  private generateErrorResponse(messageId: string, error: any): AssistantMessage {
    return {
      id: messageId,
      role: 'assistant',
      type: 'text',
      content: "I'm sorry, I encountered an issue processing your request. Please try again or rephrase your question.",
      metadata: {
        confidence: 0,
        sources: ['error']
      },
      timestamp: Date.now()
    };
  }

  setPersonality(personality: AssistantPersonality): void {
    this.personality = personality;
  }

  updateZone(zoneId: string): void {
    this.context.currentZone = zoneId;
  }

  addViewedVehicle(vehicleId: string): void {
    if (!this.context.viewedVehicles.includes(vehicleId)) {
      this.context.viewedVehicles.push(vehicleId);
    }
  }

  getContext(): AssistantContext {
    return { ...this.context };
  }
}

export const assistantEngine = AssistantEngine.getInstance();

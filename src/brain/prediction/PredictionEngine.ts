import type { RetailSessionContext, Predictions, MemorySnapshot } from '../types';

export class PredictionEngine {
  generatePredictions(
    context: RetailSessionContext,
    memory: MemorySnapshot
  ): Predictions {
    const zones = context.analytics.zonesVisited;
    const lastZone = zones[zones.length - 1];
    const nextZone = zones.length > 0 ? zones[0] : 'entrance';
    
    const abandonmentRisk = this.calculateAbandonmentRisk(context, memory);
    const intent = this.inferIntent(context);
    const fatigue = this.calculateFatigue(context);
    const purchaseLikelihood = this.estimatePurchase(context);
    
    return {
      nextZone: {
        zoneId: nextZone,
        probability: 0.7,
        confidence: 0.65
      },
      abandonmentRisk,
      intentEvolution: intent,
      engagementFatigue: fatigue,
      purchaseLikelihood
    };
  }
  
  private calculateAbandonmentRisk(
    context: RetailSessionContext,
    memory: MemorySnapshot
  ): Predictions['abandonmentRisk'] {
    const factors: string[] = [];
    let probability = 0.1;
    
    if (context.navigation.deviationCount > 5) {
      probability += 0.2;
      factors.push('Multiple navigation deviations');
    }
    
    if (context.ui.interactionFrequency < 0.1) {
      probability += 0.15;
      factors.push('Low interaction frequency');
    }
    
    if (context.shopping.completionRate < 0.2 && context.analytics.totalDwellTime > 600000) {
      probability += 0.25;
      factors.push('Low completion after extended time');
    }
    
    return {
      level: probability > 0.6 ? 'high' : probability > 0.3 ? 'medium' : 'low',
      probability: Math.min(probability, 1),
      factors
    };
  }
  
  private inferIntent(context: RetailSessionContext): Predictions['intentEvolution'] {
    const trends = ['shopping', 'browsing', 'searching', 'exiting'] as const;
    
    if (context.shopping.list.length > 0 && context.shopping.completionRate > 0.5) {
      return { current: 'shopping', trend: 'shopping', confidence: 0.8 };
    }
    
    if (context.analytics.productsViewed.length > 5 && context.shopping.collected.length === 0) {
      return { current: 'browsing', trend: 'browsing', confidence: 0.75 };
    }
    
    return { current: 'exploring', trend: 'browsing', confidence: 0.6 };
  }
  
  private calculateFatigue(context: RetailSessionContext): Predictions['engagementFatigue'] {
    const sessionDuration = Date.now() - context.startedAt;
    const interactions = context.analytics.interactionCount;
    const expectedInteractions = sessionDuration / 60000;
    
    const score = Math.max(0, 100 - (interactions / expectedInteractions) * 100);
    
    return {
      score,
      threshold: 30,
      trend: score < 30 ? 'declining' : score < 60 ? 'stable' : 'improving'
    };
  }
  
  private estimatePurchase(context: RetailSessionContext): Predictions['purchaseLikelihood'] {
    const hasItems = context.shopping.collected.length > 0;
    const completionRate = context.shopping.completionRate;
    
    return {
      probability: hasItems ? completionRate * 0.8 + 0.2 : 0.1,
      estimatedTime: hasItems ? 300000 : undefined
    };
  }
}

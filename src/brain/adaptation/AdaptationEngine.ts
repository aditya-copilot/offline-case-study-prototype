import type { RetailSessionContext, Predictions, AdaptationState, MemorySnapshot } from '../types';

export class AdaptationEngine {
  private currentAdaptation: AdaptationState = {
    routeDifficulty: 'normal',
    recommendationAggressiveness: 'balanced',
    gamificationIntensity: 'engaging',
    uiComplexity: 'standard',
    hintFrequency: 'occasional'
  };

  initialize(memory: MemorySnapshot): void {
    if (memory.behavioral.shoppingStyle === 'direct') {
      this.currentAdaptation.routeDifficulty = 'easy';
      this.currentAdaptation.hintFrequency = 'rare';
    } else if (memory.behavioral.shoppingStyle === 'research') {
      this.currentAdaptation.recommendationAggressiveness = 'proactive';
      this.currentAdaptation.uiComplexity = 'advanced';
    }
  }

  adapt(
    context: RetailSessionContext,
    predictions: Predictions
  ): AdaptationState {
    if (predictions.engagementFatigue.score < 30) {
      this.currentAdaptation.gamificationIntensity = 'intense';
      this.currentAdaptation.hintFrequency = 'frequent';
    }

    if (predictions.abandonmentRisk.level === 'high') {
      this.currentAdaptation.routeDifficulty = 'easy';
      this.currentAdaptation.recommendationAggressiveness = 'passive';
    }

    if (context.gamification.engagementScore > 80) {
      this.currentAdaptation.gamificationIntensity = 'subtle';
    }

    if (context.navigation.deviationCount > 5) {
      this.currentAdaptation.routeDifficulty = 'easy';
      this.currentAdaptation.hintFrequency = 'frequent';
    }

    return { ...this.currentAdaptation };
  }

  getCurrentAdaptation(): AdaptationState {
    return { ...this.currentAdaptation };
  }
}

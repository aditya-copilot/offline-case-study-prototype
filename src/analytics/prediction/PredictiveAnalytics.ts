export class PredictiveAnalytics {
  private static instance: PredictiveAnalytics;

  static getInstance(): PredictiveAnalytics {
    if (!PredictiveAnalytics.instance) {
      PredictiveAnalytics.instance = new PredictiveAnalytics();
    }
    return PredictiveAnalytics.instance;
  }

  predictNextZone(_currentZone: string): string | null {
    return null;
  }
}

export const predictiveAnalytics = PredictiveAnalytics.getInstance();

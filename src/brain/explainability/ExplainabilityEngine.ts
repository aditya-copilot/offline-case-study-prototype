import type { Explanation } from '../types';

export class ExplainabilityEngine {
  private explanations: Map<string, Explanation> = new Map();

  addExplanation(explanation: Omit<Explanation, 'id' | 'timestamp'>): Explanation {
    const fullExplanation: Explanation = {
      ...explanation,
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now()
    };

    this.explanations.set(fullExplanation.id, fullExplanation);
    return fullExplanation;
  }

  getExplanation(id: string): Explanation | undefined {
    return this.explanations.get(id);
  }

  getRecentExplanations(limit: number = 10): Explanation[] {
    return Array.from(this.explanations.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  explainRoute(reasoning: string[]): Explanation {
    return this.addExplanation({
      type: 'route',
      title: 'Route Calculation',
      description: 'The system calculated the optimal path based on your preferences and current store conditions.',
      reasoning,
      confidence: 0.85
    });
  }

  explainRecommendation(reasoning: string[]): Explanation {
    return this.addExplanation({
      type: 'recommendation',
      title: 'Product Recommendation',
      description: 'This product was suggested based on your shopping patterns and current context.',
      reasoning,
      confidence: 0.75
    });
  }
}

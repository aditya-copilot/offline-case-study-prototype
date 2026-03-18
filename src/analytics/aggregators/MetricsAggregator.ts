import type { ZoneMetrics, BehavioralMetrics } from '../types';

export class MetricsAggregator {
  private static instance: MetricsAggregator;
  private zoneMetrics: Map<string, ZoneMetrics> = new Map();
  private behavioralMetrics: BehavioralMetrics = {
    totalSessions: 0,
    averageSessionDuration: 0,
    bounceRate: 0,
    conversionRate: 0
  };

  static getInstance(): MetricsAggregator {
    if (!MetricsAggregator.instance) {
      MetricsAggregator.instance = new MetricsAggregator();
    }
    return MetricsAggregator.instance;
  }

  aggregateZoneMetrics(zoneId: string): ZoneMetrics {
    const metrics = this.zoneMetrics.get(zoneId) || {
      zoneId,
      visitCount: 0,
      averageDwellTime: 0,
      uniqueVisitors: 0
    };
    return metrics;
  }

  getBehavioralMetrics(): BehavioralMetrics {
    return { ...this.behavioralMetrics };
  }
}

export const metricsAggregator = MetricsAggregator.getInstance();

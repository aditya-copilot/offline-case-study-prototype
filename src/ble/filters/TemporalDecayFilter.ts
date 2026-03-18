import type { BeaconSignal, FilteredSignal, SignalStatistics } from '../types';

interface DecayConfig {
  decayRate: number;
  maxAge: number;
  minConfidence: number;
}

interface SignalEntry {
  signal: FilteredSignal;
  timestamp: number;
  confidence: number;
}

export class TemporalDecayFilter {
  private config: DecayConfig;
  private signalHistory: Map<string, SignalEntry[]> = new Map();
  private lastUpdateTime: number = Date.now();

  constructor(config: Partial<DecayConfig> = {}) {
    this.config = {
      decayRate: 0.95,
      maxAge: 5000,
      minConfidence: 0.1,
      ...config
    };
  }

  process(signal: FilteredSignal): FilteredSignal {
    const now = Date.now();
    const beaconId = signal.beaconId;

    let history = this.signalHistory.get(beaconId);
    if (!history) {
      history = [];
      this.signalHistory.set(beaconId, history);
    }

    const age = now - signal.timestamp;
    const timeDecay = Math.pow(this.config.decayRate, age / 1000);

    const temporalConfidence = signal.confidence * timeDecay;

    history.push({
      signal,
      timestamp: now,
      confidence: temporalConfidence
    });

    this.cleanupHistory(beaconId, now);

    const weightedConfidence = this.calculateWeightedConfidence(history);

    return {
      ...signal,
      confidence: Math.max(this.config.minConfidence, weightedConfidence),
      sampleCount: history.length
    };
  }

  private cleanupHistory(beaconId: string, now: number): void {
    const history = this.signalHistory.get(beaconId);
    if (!history) return;

    const cutoff = now - this.config.maxAge;
    const filtered = history.filter(entry => entry.timestamp > cutoff);

    if (filtered.length === 0) {
      this.signalHistory.delete(beaconId);
    } else {
      this.signalHistory.set(beaconId, filtered);
    }
  }

  private calculateWeightedConfidence(history: SignalEntry[]): number {
    if (history.length === 0) return 0;

    let totalWeight = 0;
    let weightedSum = 0;

    const now = Date.now();

    history.forEach((entry, index) => {
      const age = now - entry.timestamp;
      const recencyWeight = Math.exp(-age / 2000);
      const indexWeight = (index + 1) / history.length;
      const weight = recencyWeight * indexWeight;

      weightedSum += entry.confidence * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  getSignalAge(beaconId: string): number {
    const history = this.signalHistory.get(beaconId);
    if (!history || history.length === 0) return Infinity;

    const now = Date.now();
    return now - history[history.length - 1].timestamp;
  }

  getSignalStability(beaconId: string): number {
    const history = this.signalHistory.get(beaconId);
    if (!history || history.length < 3) return 0;

    const rssiValues = history.map(e => e.signal.filteredRSSI);
    const mean = rssiValues.reduce((a, b) => a + b, 0) / rssiValues.length;
    const variance = rssiValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / rssiValues.length;

    return Math.max(0, 1 - variance / 100);
  }

  getTrend(beaconId: string): 'improving' | 'degrading' | 'stable' {
    const history = this.signalHistory.get(beaconId);
    if (!history || history.length < 5) return 'stable';

    const recent = history.slice(-3);
    const older = history.slice(0, Math.max(3, history.length - 3));

    const recentAvg = recent.reduce((sum, e) => sum + e.signal.filteredRSSI, 0) / recent.length;
    const olderAvg = older.reduce((sum, e) => sum + e.signal.filteredRSSI, 0) / older.length;

    const diff = recentAvg - olderAvg;
    if (diff > 3) return 'improving';
    if (diff < -3) return 'degrading';
    return 'stable';
  }

  reset(): void {
    this.signalHistory.clear();
    this.lastUpdateTime = Date.now();
  }

  resetBeacon(beaconId: string): void {
    this.signalHistory.delete(beaconId);
  }

  getStatistics(): SignalStatistics {
    const allValues: number[] = [];
    this.signalHistory.forEach(history => {
      history.forEach(entry => allValues.push(entry.signal.filteredRSSI));
    });

    if (allValues.length === 0) {
      return { mean: 0, variance: 0, stdDev: 0, min: 0, max: 0, samples: 0 };
    }

    const mean = allValues.reduce((a, b) => a + b, 0) / allValues.length;
    const variance = allValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / allValues.length;

    return {
      mean: Math.round(mean * 10) / 10,
      variance: Math.round(variance * 10) / 10,
      stdDev: Math.round(Math.sqrt(variance) * 10) / 10,
      min: Math.min(...allValues),
      max: Math.max(...allValues),
      samples: allValues.length
    };
  }

  getActiveBeaconIds(): string[] {
    const now = Date.now();
    const active: string[] = [];

    this.signalHistory.forEach((history, beaconId) => {
      if (history.length > 0) {
        const lastEntry = history[history.length - 1];
        if (now - lastEntry.timestamp < this.config.maxAge) {
          active.push(beaconId);
        }
      }
    });

    return active;
  }
}

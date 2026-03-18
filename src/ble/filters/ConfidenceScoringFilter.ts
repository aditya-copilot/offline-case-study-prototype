import type { BeaconSignal, FilteredSignal, SignalStatistics } from '../types';

interface ConfidenceFactor {
  weight: number;
  score: number;
}

interface ConfidenceConfig {
  rssiWeight: number;
  stabilityWeight: number;
  sampleWeight: number;
  trendWeight: number;
  minSamplesForHighConfidence: number;
  minRSSIForHighConfidence: number;
}

export class ConfidenceScoringFilter {
  private config: ConfidenceConfig;
  private signalHistory: Map<string, number[]> = new Map();
  private stabilityHistory: Map<string, number[]> = new Map();

  constructor(config: Partial<ConfidenceConfig> = {}) {
    this.config = {
      rssiWeight: 0.35,
      stabilityWeight: 0.30,
      sampleWeight: 0.20,
      trendWeight: 0.15,
      minSamplesForHighConfidence: 10,
      minRSSIForHighConfidence: -70,
      ...config
    };
  }

  process(signal: FilteredSignal): FilteredSignal {
    const beaconId = signal.beaconId;

    this.updateHistory(beaconId, signal);

    const factors = this.calculateConfidenceFactors(beaconId, signal);
    const overallConfidence = this.computeWeightedConfidence(factors);

    return {
      ...signal,
      confidence: Math.round(overallConfidence * 100) / 100
    };
  }

  private updateHistory(beaconId: string, signal: FilteredSignal): void {
    let history = this.signalHistory.get(beaconId);
    if (!history) {
      history = [];
      this.signalHistory.set(beaconId, history);
    }

    history.push(signal.filteredRSSI);
    if (history.length > 50) {
      history.shift();
    }

    let stabilityHist = this.stabilityHistory.get(beaconId);
    if (!stabilityHist) {
      stabilityHist = [];
      this.stabilityHistory.set(beaconId, stabilityHist);
    }

    stabilityHist.push(signal.confidence);
    if (stabilityHist.length > 20) {
      stabilityHist.shift();
    }
  }

  private calculateConfidenceFactors(
    beaconId: string,
    signal: FilteredSignal
  ): ConfidenceFactor[] {
    const factors: ConfidenceFactor[] = [];

    factors.push({
      weight: this.config.rssiWeight,
      score: this.calculateRSSIConfidence(signal.filteredRSSI)
    });

    factors.push({
      weight: this.config.stabilityWeight,
      score: this.calculateStabilityConfidence(beaconId)
    });

    factors.push({
      weight: this.config.sampleWeight,
      score: this.calculateSampleConfidence(beaconId)
    });

    factors.push({
      weight: this.config.trendWeight,
      score: this.calculateTrendConfidence(beaconId)
    });

    return factors;
  }

  private calculateRSSIConfidence(rssi: number): number {
    const minRSSI = -90;
    const maxRSSI = -50;
    const normalized = (rssi - minRSSI) / (maxRSSI - minRSSI);
    return Math.max(0.1, Math.min(1.0, normalized));
  }

  private calculateStabilityConfidence(beaconId: string): number {
    const history = this.signalHistory.get(beaconId);
    if (!history || history.length < 3) return 0.2;

    const mean = history.reduce((a, b) => a + b, 0) / history.length;
    const variance = history.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / history.length;

    const maxExpectedVariance = 50;
    return Math.max(0.1, Math.min(1.0, 1 - variance / maxExpectedVariance));
  }

  private calculateSampleConfidence(beaconId: string): number {
    const history = this.signalHistory.get(beaconId);
    if (!history) return 0.1;

    const sampleRatio = history.length / this.config.minSamplesForHighConfidence;
    return Math.min(1.0, sampleRatio);
  }

  private calculateTrendConfidence(beaconId: string): number {
    const history = this.signalHistory.get(beaconId);
    const stabilityHist = this.stabilityHistory.get(beaconId);

    if (!history || history.length < 5 || !stabilityHist || stabilityHist.length < 5) {
      return 0.5;
    }

    const recentStability = stabilityHist.slice(-3);
    const avgRecentStability = recentStability.reduce((a, b) => a + b, 0) / recentStability.length;

    if (avgRecentStability > 0.8) return 0.9;
    if (avgRecentStability > 0.6) return 0.7;
    if (avgRecentStability > 0.4) return 0.5;
    return 0.3;
  }

  private computeWeightedConfidence(factors: ConfidenceFactor[]): number {
    let weightedSum = 0;
    let totalWeight = 0;

    factors.forEach(factor => {
      weightedSum += factor.score * factor.weight;
      totalWeight += factor.weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
  }

  getConfidenceBreakdown(beaconId: string): Record<string, number> {
    const history = this.signalHistory.get(beaconId);
    if (!history || history.length === 0) {
      return {
        rssi: 0,
        stability: 0,
        sample: 0,
        trend: 0,
        overall: 0
      };
    }

    const lastSignal: FilteredSignal = {
      beaconId,
      rssi: history[history.length - 1],
      txPower: -59,
      timestamp: Date.now(),
      filteredRSSI: history[history.length - 1],
      confidence: 0.5,
      sampleCount: history.length
    };

    return {
      rssi: this.calculateRSSIConfidence(lastSignal.filteredRSSI),
      stability: this.calculateStabilityConfidence(beaconId),
      sample: this.calculateSampleConfidence(beaconId),
      trend: this.calculateTrendConfidence(beaconId),
      overall: this.computeWeightedConfidence(
        this.calculateConfidenceFactors(beaconId, lastSignal)
      )
    };
  }

  reset(): void {
    this.signalHistory.clear();
    this.stabilityHistory.clear();
  }

  resetBeacon(beaconId: string): void {
    this.signalHistory.delete(beaconId);
    this.stabilityHistory.delete(beaconId);
  }

  getStatistics(): SignalStatistics {
    const allValues: number[] = [];
    this.signalHistory.forEach(history => allValues.push(...history));

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
}

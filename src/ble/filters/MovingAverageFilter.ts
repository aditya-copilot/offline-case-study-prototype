import type { BeaconSignal, FilteredSignal, SignalStatistics } from '../types';

export class MovingAverageFilter {
  private windowSize: number;
  private history: Map<string, number[]> = new Map();
  private weights: number[];

  constructor(windowSize: number = 10, useExponential: boolean = true) {
    this.windowSize = windowSize;

    if (useExponential) {
      this.weights = [];
      const alpha = 2 / (windowSize + 1);
      for (let i = 0; i < windowSize; i++) {
        this.weights.push(alpha * Math.pow(1 - alpha, i));
      }
      const sum = this.weights.reduce((a, b) => a + b, 0);
      this.weights = this.weights.map(w => w / sum);
    } else {
      this.weights = new Array(windowSize).fill(1 / windowSize);
    }
  }

  process(signal: BeaconSignal): FilteredSignal {
    const beaconId = signal.beaconId;
    let beaconHistory = this.history.get(beaconId);

    if (!beaconHistory) {
      beaconHistory = [];
      this.history.set(beaconId, beaconHistory);
    }

    beaconHistory.push(signal.rssi);

    if (beaconHistory.length > this.windowSize) {
      beaconHistory.shift();
    }

    const weightedSum = beaconHistory.reduce((sum, val, idx) => {
      const weightIndex = this.weights.length - beaconHistory.length + idx;
      return sum + val * this.weights[Math.max(0, weightIndex)];
    }, 0);

    const filteredRSSI = Math.round(weightedSum * 10) / 10;

    const confidence = this.calculateConfidence(beaconHistory);

    return {
      ...signal,
      filteredRSSI,
      confidence,
      sampleCount: beaconHistory.length
    };
  }

  reset(): void {
    this.history.clear();
  }

  resetBeacon(beaconId: string): void {
    this.history.delete(beaconId);
  }

  getStatistics(): SignalStatistics {
    const allValues: number[] = [];
    this.history.forEach(history => {
      allValues.push(...history);
    });

    if (allValues.length === 0) {
      return {
        mean: 0,
        variance: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        samples: 0
      };
    }

    const mean =
      allValues.reduce((sum, val) => sum + val, 0) / allValues.length;
    const variance =
      allValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      allValues.length;

    return {
      mean: Math.round(mean * 10) / 10,
      variance: Math.round(variance * 10) / 10,
      stdDev: Math.round(Math.sqrt(variance) * 10) / 10,
      min: Math.min(...allValues),
      max: Math.max(...allValues),
      samples: allValues.length
    };
  }

  getBeaconStatistics(beaconId: string): SignalStatistics {
    const history = this.history.get(beaconId) || [];

    if (history.length === 0) {
      return {
        mean: 0,
        variance: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        samples: 0
      };
    }

    const mean =
      history.reduce((sum, val) => sum + val, 0) / history.length;
    const variance =
      history.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      history.length;

    return {
      mean: Math.round(mean * 10) / 10,
      variance: Math.round(variance * 10) / 10,
      stdDev: Math.round(Math.sqrt(variance) * 10) / 10,
      min: Math.min(...history),
      max: Math.max(...history),
      samples: history.length
    };
  }

  private calculateConfidence(history: number[]): number {
    if (history.length < 3) return 0.2;

    const mean = history.reduce((sum, val) => sum + val, 0) / history.length;
    const variance =
      history.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      history.length;

    const maxExpectedVariance = 50;
    const varianceScore = Math.max(
      0,
      Math.min(1, 1 - variance / maxExpectedVariance)
    );

    const sampleScore = Math.min(1, history.length / this.windowSize);

    return Math.round((0.6 * varianceScore + 0.4 * sampleScore) * 10) / 10;
  }
}

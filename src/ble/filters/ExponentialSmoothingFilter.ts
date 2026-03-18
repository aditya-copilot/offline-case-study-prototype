import type { BeaconSignal, FilteredSignal, SignalStatistics } from '../types';

interface SmoothingConfig {
  alpha: number;
  beta: number;
  gamma: number;
  useTripleExponential: boolean;
}

interface SmoothingState {
  level: number;
  trend: number;
  season: number;
  lastValue: number;
}

export class ExponentialSmoothingFilter {
  private config: SmoothingConfig;
  private states: Map<string, SmoothingState> = new Map();
  private history: Map<string, number[]> = new Map();

  constructor(config: Partial<SmoothingConfig> = {}) {
    this.config = {
      alpha: 0.3,
      beta: 0.1,
      gamma: 0.1,
      useTripleExponential: false,
      ...config
    };
  }

  process(signal: BeaconSignal): FilteredSignal {
    const beaconId = signal.beaconId;
    const value = signal.rssi;

    this.updateHistory(beaconId, value);

    let state = this.states.get(beaconId);
    if (!state) {
      state = this.initializeState(value);
      this.states.set(beaconId, state);
    }

    const smoothed = this.config.useTripleExponential
      ? this.tripleExponentialSmoothing(state, value)
      : this.doubleExponentialSmoothing(state, value);

    const confidence = this.calculateConfidence(beaconId, state);

    return {
      ...signal,
      filteredRSSI: Math.round(smoothed * 10) / 10,
      confidence,
      sampleCount: this.history.get(beaconId)?.length || 1
    };
  }

  private initializeState(initialValue: number): SmoothingState {
    return {
      level: initialValue,
      trend: 0,
      season: 0,
      lastValue: initialValue
    };
  }

  private doubleExponentialSmoothing(state: SmoothingState, value: number): number {
    const { alpha, beta } = this.config;

    const newLevel = alpha * value + (1 - alpha) * (state.level + state.trend);
    const newTrend = beta * (newLevel - state.level) + (1 - beta) * state.trend;

    state.level = newLevel;
    state.trend = newTrend;
    state.lastValue = value;

    return newLevel + newTrend;
  }

  private tripleExponentialSmoothing(state: SmoothingState, value: number): number {
    const { alpha, beta, gamma } = this.config;

    const newLevel = alpha * (value - state.season) + (1 - alpha) * (state.level + state.trend);
    const newTrend = beta * (newLevel - state.level) + (1 - beta) * state.trend;
    const newSeason = gamma * (value - newLevel) + (1 - gamma) * state.season;

    state.level = newLevel;
    state.trend = newTrend;
    state.season = newSeason;
    state.lastValue = value;

    return newLevel + newTrend + newSeason;
  }

  private calculateConfidence(beaconId: string, state: SmoothingState): number {
    const history = this.history.get(beaconId);
    if (!history || history.length < 3) return 0.3;

    const variance = this.calculateVariance(history);
    const maxExpectedVariance = 100;

    const varianceScore = Math.max(0, Math.min(1, 1 - variance / maxExpectedVariance));
    const sampleScore = Math.min(1, history.length / 20);

    const trendMagnitude = Math.abs(state.trend);
    const trendStability = Math.max(0, 1 - trendMagnitude / 10);

    return Math.round((0.4 * varianceScore + 0.3 * sampleScore + 0.3 * trendStability) * 10) / 10;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  private updateHistory(beaconId: string, value: number): void {
    let history = this.history.get(beaconId);
    if (!history) {
      history = [];
      this.history.set(beaconId, history);
    }

    history.push(value);
    if (history.length > 50) {
      history.shift();
    }
  }

  predict(beaconId: string, steps: number = 1): number | null {
    const state = this.states.get(beaconId);
    if (!state) return null;

    return state.level + steps * state.trend;
  }

  getTrend(beaconId: string): number {
    const state = this.states.get(beaconId);
    return state?.trend || 0;
  }

  getLevel(beaconId: string): number {
    const state = this.states.get(beaconId);
    return state?.level || 0;
  }

  reset(): void {
    this.states.clear();
    this.history.clear();
  }

  resetBeacon(beaconId: string): void {
    this.states.delete(beaconId);
    this.history.delete(beaconId);
  }

  updateConfig(newConfig: Partial<SmoothingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getStatistics(): SignalStatistics {
    const allValues: number[] = [];
    this.history.forEach(history => allValues.push(...history));

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

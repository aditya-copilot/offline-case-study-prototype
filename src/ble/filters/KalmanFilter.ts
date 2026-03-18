import type { BeaconSignal, FilteredSignal, SignalStatistics } from '../types';

interface KalmanState {
  estimate: number;
  errorCovariance: number;
}

export class KalmanFilter {
  private state: KalmanState;
  private processNoise: number;
  private measurementNoise: number;
  private history: number[] = [];
  private maxHistorySize: number = 20;

  constructor(
    processNoise: number = 0.01,
    measurementNoise: number = 0.1,
    initialEstimate: number = -70
  ) {
    this.processNoise = processNoise;
    this.measurementNoise = measurementNoise;
    this.state = {
      estimate: initialEstimate,
      errorCovariance: 1.0
    };
  }

  process(signal: BeaconSignal): FilteredSignal {
    const measurement = signal.rssi;

    const predictedEstimate = this.state.estimate;
    const predictedErrorCovariance = this.state.errorCovariance + this.processNoise;

    const kalmanGain =
      predictedErrorCovariance /
      (predictedErrorCovariance + this.measurementNoise);

    const newEstimate =
      predictedEstimate + kalmanGain * (measurement - predictedEstimate);
    const newErrorCovariance =
      (1 - kalmanGain) * predictedErrorCovariance;

    this.state = {
      estimate: newEstimate,
      errorCovariance: newErrorCovariance
    };

    this.history.push(measurement);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    const confidence = this.calculateConfidence();

    return {
      ...signal,
      filteredRSSI: Math.round(newEstimate * 10) / 10,
      confidence,
      sampleCount: this.history.length
    };
  }

  reset(): void {
    this.state = {
      estimate: -70,
      errorCovariance: 1.0
    };
    this.history = [];
  }

  getStatistics(): SignalStatistics {
    if (this.history.length === 0) {
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
      this.history.reduce((sum, val) => sum + val, 0) / this.history.length;
    const variance =
      this.history.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      this.history.length;

    return {
      mean: Math.round(mean * 10) / 10,
      variance: Math.round(variance * 10) / 10,
      stdDev: Math.round(Math.sqrt(variance) * 10) / 10,
      min: Math.min(...this.history),
      max: Math.max(...this.history),
      samples: this.history.length
    };
  }

  private calculateConfidence(): number {
    if (this.history.length < 5) return 0.3;

    const variance = this.getStatistics().variance;
    const maxExpectedVariance = 100;

    return Math.max(
      0.1,
      Math.min(1.0, 1.0 - variance / maxExpectedVariance)
    );
  }

  setProcessNoise(noise: number): void {
    this.processNoise = noise;
  }

  setMeasurementNoise(noise: number): void {
    this.measurementNoise = noise;
  }
}

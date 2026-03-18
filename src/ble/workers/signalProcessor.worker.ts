import type { BeaconSignal, FilteredSignal, ScanConfig } from '../types';

interface WorkerMessage {
  type: 'INIT' | 'PROCESS' | 'RESET' | 'UPDATE_CONFIG' | 'GET_STATS';
  payload?: unknown;
}

interface KalmanState {
  estimate: number;
  errorCovariance: number;
}

class SignalProcessorWorker {
  private kalmanStates: Map<string, KalmanState> = new Map();
  private signalHistory: Map<string, number[]> = new Map();
  private config: Partial<ScanConfig> = {
    kalmanProcessNoise: 0.01,
    kalmanMeasurementNoise: 0.1,
    outlierThreshold: 10,
    smoothingFactor: 0.3,
    signalBufferSize: 50
  };
  private processedCount: number = 0;
  private droppedCount: number = 0;

  constructor() {
    self.onmessage = this.handleMessage.bind(this);
  }

  private handleMessage(event: MessageEvent<WorkerMessage>): void {
    const { type, payload } = event.data;

    switch (type) {
      case 'INIT':
        this.initialize(payload as Partial<ScanConfig>);
        break;
      case 'PROCESS':
        this.processSignal(payload as BeaconSignal);
        break;
      case 'PROCESS_BATCH':
        this.processBatch(payload as BeaconSignal[]);
        break;
      case 'RESET':
        this.reset();
        break;
      case 'UPDATE_CONFIG':
        this.updateConfig(payload as Partial<ScanConfig>);
        break;
      case 'GET_STATS':
        this.sendStats();
        break;
    }
  }

  private initialize(config: Partial<ScanConfig>): void {
    this.config = { ...this.config, ...config };
    this.postMessage('INIT_COMPLETE', null);
  }

  private processSignal(signal: BeaconSignal): void {
    const filtered = this.applyFilters(signal);
    if (filtered) {
      this.postMessage('SIGNAL_PROCESSED', filtered);
    }
  }

  private processBatch(signals: BeaconSignal[]): void {
    const filtered = signals
      .map(s => this.applyFilters(s))
      .filter((s): s is FilteredSignal => s !== null);

    this.postMessage('BATCH_PROCESSED', filtered);
  }

  private applyFilters(signal: BeaconSignal): FilteredSignal | null {
    if (!this.outlierFilter(signal)) {
      this.droppedCount++;
      return null;
    }

    const kalmanFiltered = this.kalmanFilter(signal);
    const smoothed = this.exponentialSmoothing(kalmanFiltered);

    this.processedCount++;

    return {
      ...signal,
      filteredRSSI: smoothed.filteredRSSI,
      confidence: smoothed.confidence,
      sampleCount: smoothed.sampleCount
    };
  }

  private outlierFilter(signal: BeaconSignal): boolean {
    const beaconId = signal.beaconId;
    const history = this.signalHistory.get(beaconId) || [];

    if (history.length < 3) {
      this.addToHistory(beaconId, signal.rssi);
      return true;
    }

    const median = this.calculateMedian(history);
    const mad = this.calculateMAD(history, median);

    if (mad === 0) {
      this.addToHistory(beaconId, signal.rssi);
      return true;
    }

    const modifiedZScore = 0.6745 * (signal.rssi - median) / mad;
    const isOutlier = Math.abs(modifiedZScore) > (this.config.outlierThreshold || 10);

    if (!isOutlier) {
      this.addToHistory(beaconId, signal.rssi);
    }

    return !isOutlier;
  }

  private kalmanFilter(signal: BeaconSignal): FilteredSignal {
    const beaconId = signal.beaconId;
    let state = this.kalmanStates.get(beaconId);

    if (!state) {
      state = {
        estimate: signal.rssi,
        errorCovariance: 1.0
      };
      this.kalmanStates.set(beaconId, state);
    }

    const processNoise = this.config.kalmanProcessNoise || 0.01;
    const measurementNoise = this.config.kalmanMeasurementNoise || 0.1;

    const predictedEstimate = state.estimate;
    const predictedErrorCovariance = state.errorCovariance + processNoise;

    const kalmanGain = predictedErrorCovariance / (predictedErrorCovariance + measurementNoise);

    const newEstimate = predictedEstimate + kalmanGain * (signal.rssi - predictedEstimate);
    const newErrorCovariance = (1 - kalmanGain) * predictedErrorCovariance;

    state.estimate = newEstimate;
    state.errorCovariance = newErrorCovariance;

    return {
      ...signal,
      filteredRSSI: Math.round(newEstimate * 10) / 10,
      confidence: Math.min(1, Math.max(0.1, 1 - state.errorCovariance)),
      sampleCount: (this.signalHistory.get(beaconId)?.length || 0) + 1
    };
  }

  private exponentialSmoothing(signal: FilteredSignal): FilteredSignal {
    const beaconId = signal.beaconId;
    const history = this.signalHistory.get(beaconId) || [];

    if (history.length === 0) {
      return signal;
    }

    const alpha = this.config.smoothingFactor || 0.3;
    const lastValue = history[history.length - 1];
    const smoothedValue = alpha * signal.filteredRSSI + (1 - alpha) * lastValue;

    return {
      ...signal,
      filteredRSSI: Math.round(smoothedValue * 10) / 10
    };
  }

  private addToHistory(beaconId: string, rssi: number): void {
    let history = this.signalHistory.get(beaconId);
    if (!history) {
      history = [];
      this.signalHistory.set(beaconId, history);
    }

    history.push(rssi);
    const maxSize = this.config.signalBufferSize || 50;

    if (history.length > maxSize) {
      history.shift();
    }
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private calculateMAD(values: number[], median: number): number {
    const absoluteDeviations = values.map(v => Math.abs(v - median));
    return this.calculateMedian(absoluteDeviations);
  }

  private reset(): void {
    this.kalmanStates.clear();
    this.signalHistory.clear();
    this.processedCount = 0;
    this.droppedCount = 0;
    this.postMessage('RESET_COMPLETE', null);
  }

  private updateConfig(newConfig: Partial<ScanConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.postMessage('CONFIG_UPDATED', this.config);
  }

  private sendStats(): void {
    const total = this.processedCount + this.droppedCount;
    const stats = {
      processed: this.processedCount,
      dropped: this.droppedCount,
      dropRate: total > 0 ? this.droppedCount / total : 0,
      activeBeacons: this.signalHistory.size,
      bufferSizes: Array.from(this.signalHistory.entries()).map(([id, hist]) => ({
        beaconId: id,
        size: hist.length
      }))
    };
    this.postMessage('STATS', stats);
  }

  private postMessage(type: string, payload: unknown): void {
    self.postMessage({ type, payload });
  }
}

new SignalProcessorWorker();

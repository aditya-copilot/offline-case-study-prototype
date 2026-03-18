import type { BeaconSignal, FilteredSignal, SignalFilter } from '../types';
import { KalmanFilter } from './KalmanFilter';
import { MovingAverageFilter } from './MovingAverageFilter';
import { OutlierFilter } from './OutlierFilter';

interface PipelineConfig {
  useOutlierFilter: boolean;
  useKalmanFilter: boolean;
  useMovingAverage: boolean;
  outlierThreshold: number;
  kalmanProcessNoise: number;
  kalmanMeasurementNoise: number;
  movingAverageWindow: number;
}

export class SignalPipeline {
  private outlierFilter: OutlierFilter;
  private kalmanFilter: KalmanFilter;
  private movingAverageFilter: MovingAverageFilter;
  private config: PipelineConfig;
  private processedCount: number = 0;
  private droppedCount: number = 0;

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = {
      useOutlierFilter: true,
      useKalmanFilter: true,
      useMovingAverage: true,
      outlierThreshold: 10,
      kalmanProcessNoise: 0.01,
      kalmanMeasurementNoise: 0.1,
      movingAverageWindow: 10,
      ...config
    };

    this.outlierFilter = new OutlierFilter(this.config.outlierThreshold);
    this.kalmanFilter = new KalmanFilter(
      this.config.kalmanProcessNoise,
      this.config.kalmanMeasurementNoise
    );
    this.movingAverageFilter = new MovingAverageFilter(
      this.config.movingAverageWindow,
      true
    );
  }

  process(signal: BeaconSignal): FilteredSignal | null {
    let currentSignal: BeaconSignal | null = signal;

    if (this.config.useOutlierFilter) {
      currentSignal = this.outlierFilter.filter(currentSignal);
      if (!currentSignal) {
        this.droppedCount++;
        return null;
      }
    }

    let filtered: FilteredSignal = {
      ...currentSignal,
      filteredRSSI: currentSignal.rssi,
      confidence: 0.5,
      sampleCount: 1
    };

    if (this.config.useKalmanFilter) {
      filtered = this.kalmanFilter.process(filtered);
    }

    if (this.config.useMovingAverage) {
      filtered = this.movingAverageFilter.process(filtered);
    }

    this.processedCount++;

    return filtered;
  }

  processBatch(signals: BeaconSignal[]): FilteredSignal[] {
    return signals
      .map(signal => this.process(signal))
      .filter((signal): signal is FilteredSignal => signal !== null);
  }

  reset(): void {
    this.outlierFilter.reset();
    this.kalmanFilter.reset();
    this.movingAverageFilter.reset();
    this.processedCount = 0;
    this.droppedCount = 0;
  }

  resetBeacon(beaconId: string): void {
    this.outlierFilter.resetBeacon(beaconId);
    this.movingAverageFilter.resetBeacon(beaconId);
  }

  getStats(): {
    processed: number;
    dropped: number;
    dropRate: number;
  } {
    const total = this.processedCount + this.droppedCount;
    return {
      processed: this.processedCount,
      dropped: this.droppedCount,
      dropRate: total > 0 ? Math.round((this.droppedCount / total) * 1000) / 10 : 0
    };
  }

  updateConfig(newConfig: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.outlierThreshold !== undefined) {
      this.outlierFilter.setThreshold(newConfig.outlierThreshold);
    }

    if (
      newConfig.kalmanProcessNoise !== undefined ||
      newConfig.kalmanMeasurementNoise !== undefined
    ) {
      this.kalmanFilter.setProcessNoise(this.config.kalmanProcessNoise);
      this.kalmanFilter.setMeasurementNoise(this.config.kalmanMeasurementNoise);
    }
  }

  getKalmanFilter(): KalmanFilter {
    return this.kalmanFilter;
  }

  getMovingAverageFilter(): MovingAverageFilter {
    return this.movingAverageFilter;
  }
}

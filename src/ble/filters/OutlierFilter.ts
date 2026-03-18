import type { BeaconSignal } from '../types';

export class OutlierFilter {
  private threshold: number;
  private history: Map<string, number[]> = new Map();
  private maxHistorySize: number = 10;

  constructor(threshold: number = 10) {
    this.threshold = threshold;
  }

  isOutlier(signal: BeaconSignal): boolean {
    const beaconId = signal.beaconId;
    const history = this.history.get(beaconId) || [];

    if (history.length < 3) {
      this.addToHistory(beaconId, signal.rssi);
      return false;
    }

    const median = this.calculateMedian(history);
    const mad = this.calculateMAD(history, median);

    if (mad === 0) {
      this.addToHistory(beaconId, signal.rssi);
      return false;
    }

    const modifiedZScore =
      0.6745 * (signal.rssi - median) / mad;

    const isOutlier = Math.abs(modifiedZScore) > this.threshold;

    if (!isOutlier) {
      this.addToHistory(beaconId, signal.rssi);
    }

    return isOutlier;
  }

  filter(signal: BeaconSignal): BeaconSignal | null {
    if (this.isOutlier(signal)) {
      return null;
    }
    return signal;
  }

  reset(): void {
    this.history.clear();
  }

  resetBeacon(beaconId: string): void {
    this.history.delete(beaconId);
  }

  setThreshold(threshold: number): void {
    this.threshold = threshold;
  }

  private addToHistory(beaconId: string, rssi: number): void {
    let beaconHistory = this.history.get(beaconId);

    if (!beaconHistory) {
      beaconHistory = [];
      this.history.set(beaconId, beaconHistory);
    }

    beaconHistory.push(rssi);

    if (beaconHistory.length > this.maxHistorySize) {
      beaconHistory.shift();
    }
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }

    return sorted[mid];
  }

  private calculateMAD(values: number[], median: number): number {
    const absoluteDeviations = values.map(v => Math.abs(v - median));
    return this.calculateMedian(absoluteDeviations);
  }
}

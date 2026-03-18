import type { BeaconConfig, BeaconSignal, ZoneEstimate } from '../types';
import { EventEmitter } from '@core/utils/events';

interface ZoneScore {
  zoneId: string;
  score: number;
  beacons: Array<{
    beaconId: string;
    rssi: number;
    weight: number;
  }>;
}

export class ZoneDetector extends EventEmitter<{
  zoneEnter: { zoneId: string; confidence: number };
  zoneExit: { zoneId: string; duration: number };
  zoneChange: { from: string | null; to: string; confidence: number };
  estimate: ZoneEstimate;
}> {
  private beaconConfigs: Map<string, BeaconConfig>;
  private zoneBeaconMapping: Map<string, string[]>;
  private currentZone: string | null = null;
  private zoneEntryTime: number = 0;
  private dwellTime: number = 0;
  private confidenceThreshold: number = 0.6;
  private minDwellTime: number = 1000;
  private lastEstimate: ZoneEstimate | null = null;

  constructor(
    beaconConfigs: BeaconConfig[],
    zoneBeaconMapping: Record<string, string[]>,
    confidenceThreshold: number = 0.6
  ) {
    super();
    this.beaconConfigs = new Map(beaconConfigs.map(b => [b.id, b]));
    this.zoneBeaconMapping = new Map(Object.entries(zoneBeaconMapping));
    this.confidenceThreshold = confidenceThreshold;
  }

  estimateZone(signals: BeaconSignal[]): ZoneEstimate | null {
    if (signals.length === 0) return null;

    const zoneScores = this.calculateZoneScores(signals);
    if (zoneScores.length === 0) return null;

    const bestZone = zoneScores[0];
    const now = Date.now();

    const estimate: ZoneEstimate = {
      zoneId: bestZone.zoneId,
      confidence: bestZone.score,
      primaryBeacon: bestZone.beacons[0]?.beaconId || '',
      allBeacons: bestZone.beacons,
      dwellTime: this.currentZone === bestZone.zoneId ? this.dwellTime : 0,
      entryTime: this.currentZone === bestZone.zoneId ? this.zoneEntryTime : now,
      transitionProbability: this.calculateTransitionProbability(bestZone.zoneId)
    };

    this.lastEstimate = estimate;

    this.handleZoneTransition(bestZone.zoneId, bestZone.score, now);

    this.emit('estimate', estimate);

    return estimate;
  }

  private calculateZoneScores(signals: BeaconSignal[]): ZoneScore[] {
    const zoneScores = new Map<string, ZoneScore>();

    signals.forEach(signal => {
      const config = this.beaconConfigs.get(signal.beaconId);
      if (!config) return;

      const zoneId = config.zoneId;
      if (!zoneScores.has(zoneId)) {
        zoneScores.set(zoneId, {
          zoneId,
          score: 0,
          beacons: []
        });
      }

      const zoneScore = zoneScores.get(zoneId)!;
      const weight = this.calculateSignalWeight(signal.rssi);

      zoneScore.score += weight;
      zoneScore.beacons.push({
        beaconId: signal.beaconId,
        rssi: signal.rssi,
        weight
      });
    });

    zoneScores.forEach(score => {
      score.beacons.sort((a, b) => b.weight - a.weight);
      const maxPossibleScore = score.beacons.length;
      score.score = maxPossibleScore > 0 ? score.score / maxPossibleScore : 0;
    });

    return Array.from(zoneScores.values())
      .sort((a, b) => b.score - a.score);
  }

  private calculateSignalWeight(rssi: number): number {
    const minRSSI = -90;
    const maxRSSI = -50;
    const normalized = (rssi - minRSSI) / (maxRSSI - minRSSI);
    return Math.max(0, Math.min(1, normalized));
  }

  private calculateTransitionProbability(newZoneId: string): number {
    if (!this.currentZone) return 1.0;
    if (this.currentZone === newZoneId) return 0.0;

    const currentZoneBeacons = this.zoneBeaconMapping.get(this.currentZone) || [];
    const newZoneBeacons = this.zoneBeaconMapping.get(newZoneId) || [];

    const sharedBeacons = currentZoneBeacons.filter(id =>
      newZoneBeacons.includes(id)
    );

    const maxShared = Math.min(currentZoneBeacons.length, newZoneBeacons.length);
    return maxShared > 0 ? 1 - (sharedBeacons.length / maxShared) : 0.5;
  }

  private handleZoneTransition(newZoneId: string, confidence: number, timestamp: number): void {
    if (this.currentZone === newZoneId) {
      this.dwellTime = timestamp - this.zoneEntryTime;
      return;
    }

    if (confidence < this.confidenceThreshold) return;

    const dwellTime = timestamp - this.zoneEntryTime;

    if (this.currentZone && dwellTime >= this.minDwellTime) {
      this.emit('zoneExit', {
        zoneId: this.currentZone,
        duration: dwellTime
      });
    }

    const previousZone = this.currentZone;
    this.currentZone = newZoneId;
    this.zoneEntryTime = timestamp;
    this.dwellTime = 0;

    this.emit('zoneEnter', { zoneId: newZoneId, confidence });

    if (previousZone) {
      this.emit('zoneChange', {
        from: previousZone,
        to: newZoneId,
        confidence
      });
    }
  }

  getCurrentZone(): string | null {
    return this.currentZone;
  }

  getDwellTime(): number {
    return this.dwellTime;
  }

  getLastEstimate(): ZoneEstimate | null {
    return this.lastEstimate;
  }

  reset(): void {
    this.currentZone = null;
    this.zoneEntryTime = 0;
    this.dwellTime = 0;
    this.lastEstimate = null;
  }

  updateConfidenceThreshold(threshold: number): void {
    this.confidenceThreshold = threshold;
  }
}

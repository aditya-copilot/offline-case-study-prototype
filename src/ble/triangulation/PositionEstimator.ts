import type { BeaconConfig, BeaconSignal, PositionEstimate } from '../types';

interface BeaconPosition {
  x: number;
  y: number;
  z: number;
  distance: number;
  weight: number;
}

export class PositionEstimator {
  private beaconConfigs: Map<string, BeaconConfig>;
  private lastEstimate: PositionEstimate | null = null;
  private smoothingFactor: number = 0.3;

  constructor(beaconConfigs: BeaconConfig[]) {
    this.beaconConfigs = new Map(beaconConfigs.map(b => [b.id, b]));
  }

  estimatePosition(signals: BeaconSignal[]): PositionEstimate | null {
    if (signals.length === 0) return null;

    const beaconPositions = this.prepareBeaconPositions(signals);
    if (beaconPositions.length === 0) return null;

    let estimate: PositionEstimate;

    if (beaconPositions.length >= 3) {
      estimate = this.trilaterate(beaconPositions);
    } else if (beaconPositions.length === 2) {
      estimate = this.bilaterate(beaconPositions);
    } else {
      estimate = this.nearestBeacon(beaconPositions[0]);
    }

    if (this.lastEstimate) {
      estimate.x = this.smooth(this.lastEstimate.x, estimate.x);
      estimate.y = this.smooth(this.lastEstimate.y, estimate.y);
    }

    this.lastEstimate = estimate;
    return estimate;
  }

  private prepareBeaconPositions(signals: BeaconSignal[]): BeaconPosition[] {
    return signals
      .map(signal => {
        const config = this.beaconConfigs.get(signal.beaconId);
        if (!config) return null;

        const distance = this.estimateDistance(
          signal.rssi,
          config.txPower,
          config.environmentFactor
        );

        const weight = this.calculateWeight(signal.rssi, distance);

        return {
          x: config.position.x,
          y: config.position.y,
          z: config.position.z,
          distance,
          weight
        };
      })
      .filter((pos): pos is BeaconPosition => pos !== null)
      .sort((a, b) => a.distance - b.distance);
  }

  private estimateDistance(
    rssi: number,
    txPower: number,
    environmentFactor: number
  ): number {
    if (rssi >= txPower) return 1.0;

    const ratio = (txPower - rssi) / (10 * environmentFactor);
    const distance = Math.pow(10, ratio);

    return Math.max(1.0, Math.min(50, distance));
  }

  private calculateWeight(rssi: number, distance: number): number {
    const signalQuality = Math.max(0, (rssi + 90) / 40);
    const distanceFactor = 1 / Math.max(1, distance);
    return signalQuality * distanceFactor;
  }

  private trilaterate(beacons: BeaconPosition[]): PositionEstimate {
    const [b1, b2, b3] = beacons;

    const A = 2 * (b2.x - b1.x);
    const B = 2 * (b2.y - b1.y);
    const C = Math.pow(b1.distance, 2) - Math.pow(b2.distance, 2) -
              Math.pow(b1.x, 2) + Math.pow(b2.x, 2) -
              Math.pow(b1.y, 2) + Math.pow(b2.y, 2);

    const D = 2 * (b3.x - b2.x);
    const E = 2 * (b3.y - b2.y);
    const F = Math.pow(b2.distance, 2) - Math.pow(b3.distance, 2) -
              Math.pow(b2.x, 2) + Math.pow(b3.x, 2) -
              Math.pow(b2.y, 2) + Math.pow(b3.y, 2);

    const denominator = A * E - B * D;

    if (Math.abs(denominator) < 0.001) {
      return this.weightedAverage(beacons);
    }

    const x = (C * E - F * B) / denominator;
    const y = (A * F - C * D) / denominator;

    const avgZ = (b1.z * b1.weight + b2.z * b2.weight + b3.z * b3.weight) /
                 (b1.weight + b2.weight + b3.weight);

    const accuracy = this.calculateAccuracy(beacons, { x, y, z: avgZ });

    return {
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      z: Math.round(avgZ * 100) / 100,
      accuracy,
      confidence: Math.min(1, beacons.length / 4),
      method: 'trilateration',
      timestamp: Date.now()
    };
  }

  private bilaterate(beacons: BeaconPosition[]): PositionEstimate {
    const [b1, b2] = beacons;

    const d = Math.sqrt(
      Math.pow(b2.x - b1.x, 2) + Math.pow(b2.y - b1.y, 2)
    );

    if (d > b1.distance + b2.distance || d < Math.abs(b1.distance - b2.distance)) {
      return this.weightedAverage(beacons);
    }

    const a = (Math.pow(b1.distance, 2) - Math.pow(b2.distance, 2) + Math.pow(d, 2)) / (2 * d);
    const h = Math.sqrt(Math.max(0, Math.pow(b1.distance, 2) - Math.pow(a, 2)));

    const x2 = b1.x + a * (b2.x - b1.x) / d;
    const y2 = b1.y + a * (b2.y - b1.y) / d;

    const x = x2 + h * (b2.y - b1.y) / d;
    const y = y2 - h * (b2.x - b1.x) / d;

    const avgZ = (b1.z * b1.weight + b2.z * b2.weight) / (b1.weight + b2.weight);

    return {
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      z: Math.round(avgZ * 100) / 100,
      accuracy: d / 2,
      confidence: 0.5,
      method: 'trilateration',
      timestamp: Date.now()
    };
  }

  private nearestBeacon(beacon: BeaconPosition): PositionEstimate {
    return {
      x: beacon.x,
      y: beacon.y,
      z: beacon.z,
      accuracy: beacon.distance,
      confidence: 0.3,
      method: 'nearest-beacon',
      timestamp: Date.now()
    };
  }

  private weightedAverage(beacons: BeaconPosition[]): PositionEstimate {
    const totalWeight = beacons.reduce((sum, b) => sum + b.weight, 0);

    const x = beacons.reduce((sum, b) => sum + b.x * b.weight, 0) / totalWeight;
    const y = beacons.reduce((sum, b) => sum + b.y * b.weight, 0) / totalWeight;
    const z = beacons.reduce((sum, b) => sum + b.z * b.weight, 0) / totalWeight;

    const accuracy = this.calculateAccuracy(beacons, { x, y, z });

    return {
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      z: Math.round(z * 100) / 100,
      accuracy,
      confidence: 0.4,
      method: 'zone-snap',
      timestamp: Date.now()
    };
  }

  private calculateAccuracy(
    beacons: BeaconPosition[],
    estimate: { x: number; y: number; z: number }
  ): number {
    const errors = beacons.map(b => {
      const measuredDist = b.distance;
      const calculatedDist = Math.sqrt(
        Math.pow(b.x - estimate.x, 2) +
        Math.pow(b.y - estimate.y, 2) +
        Math.pow(b.z - estimate.z, 2)
      );
      return Math.abs(measuredDist - calculatedDist);
    });

    return errors.reduce((sum, e) => sum + e, 0) / errors.length;
  }

  private smooth(last: number, current: number): number {
    return last + this.smoothingFactor * (current - last);
  }

  getLastEstimate(): PositionEstimate | null {
    return this.lastEstimate;
  }

  reset(): void {
    this.lastEstimate = null;
  }

  setSmoothingFactor(factor: number): void {
    this.smoothingFactor = Math.max(0, Math.min(1, factor));
  }
}

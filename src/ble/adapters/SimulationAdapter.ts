import type { BLEAdapter, BeaconSignal, BeaconConfig, SimulationConfig } from '../types';
import { EventEmitter } from '@core/utils/events';

interface VirtualBeacon extends BeaconConfig {
  currentRSSI: number;
  baseRSSI: number;
  noiseOffset: number;
}

export class SimulationAdapter extends EventEmitter<{
  signal: BeaconSignal;
  positionUpdate: { x: number; y: number };
}> implements BLEAdapter {
  private isScanning: boolean = false;
  private virtualBeacons: Map<string, VirtualBeacon> = new Map();
  private simulationInterval: number | null = null;
  private positionInterval: number | null = null;
  private callback: ((signal: BeaconSignal) => void) | null = null;
  private config: SimulationConfig;
  private currentPosition: { x: number; y: number } = { x: 50, y: 75 };
  private walkIndex: number = 0;
  private noiseTime: number = 0;

  constructor(config: Partial<SimulationConfig> = {}) {
    super();
    this.config = {
      enabled: true,
      noiseModel: 'gaussian',
      noiseAmplitude: 5,
      driftRate: 0.1,
      updateInterval: 200,
      virtualBeacons: [],
      walkPath: [],
      walkSpeed: 1,
      ...config
    };

    this.initializeVirtualBeacons();
  }

  private initializeVirtualBeacons(): void {
    this.config.virtualBeacons.forEach(beacon => {
      const virtualBeacon: VirtualBeacon = {
        ...beacon,
        currentRSSI: beacon.calibrationRSSI,
        baseRSSI: beacon.calibrationRSSI,
        noiseOffset: Math.random() * 1000
      };
      this.virtualBeacons.set(beacon.id, virtualBeacon);
    });
  }

  isSupported(): boolean {
    return true;
  }

  async requestPermission(): Promise<boolean> {
    return true;
  }

  async startScan(callback: (signal: BeaconSignal) => void): Promise<void> {
    if (this.isScanning) return;

    this.isScanning = true;
    this.callback = callback;

    this.simulationInterval = window.setInterval(() => {
      this.generateSignals();
    }, this.config.updateInterval);

    if (this.config.walkPath.length > 0) {
      this.positionInterval = window.setInterval(() => {
        this.updatePosition();
      }, 100);
    }
  }

  stopScan(): void {
    this.isScanning = false;
    this.callback = null;

    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }

    if (this.positionInterval) {
      clearInterval(this.positionInterval);
      this.positionInterval = null;
    }
  }

  setPosition(x: number, y: number): void {
    this.currentPosition = { x, y };
    this.generateSignals();
  }

  setWalkPath(path: Array<{ x: number; y: number }>): void {
    this.config.walkPath = path;
    this.walkIndex = 0;
  }

  updateConfig(newConfig: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  private generateSignals(): void {
    if (!this.callback) return;

    this.noiseTime += 0.1;

    this.virtualBeacons.forEach((beacon, id) => {
      const distance = this.calculateDistance(
        this.currentPosition.x,
        this.currentPosition.y,
        beacon.position.x,
        beacon.position.y
      );

      const pathLoss = this.calculatePathLoss(distance, beacon.environmentFactor);
      const baseRSSI = beacon.txPower - pathLoss;

      const noise = this.generateNoise();
      const interference = this.generateInterference();

      beacon.currentRSSI = Math.round((baseRSSI + noise + interference) * 10) / 10;

      const signal: BeaconSignal = {
        beaconId: id,
        rssi: beacon.currentRSSI,
        txPower: beacon.txPower,
        timestamp: Date.now(),
        distance: Math.round(distance * 10) / 10,
        accuracy: distance < 3 ? 'high' : distance < 8 ? 'medium' : 'low'
      };

      this.callback(signal);
      this.emit('signal', signal);
    });
  }

  private updatePosition(): void {
    if (this.config.walkPath.length === 0) return;

    const target = this.config.walkPath[this.walkIndex];
    const dx = target.x - this.currentPosition.x;
    const dy = target.y - this.currentPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.config.walkSpeed) {
      this.currentPosition = { ...target };
      this.walkIndex = (this.walkIndex + 1) % this.config.walkPath.length;
    } else {
      const ratio = this.config.walkSpeed / distance;
      this.currentPosition.x += dx * ratio;
      this.currentPosition.y += dy * ratio;
    }

    this.emit('positionUpdate', { ...this.currentPosition });
  }

  private calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  private calculatePathLoss(distance: number, environmentFactor: number): number {
    if (distance <= 1) return 0;
    return 10 * environmentFactor * Math.log10(distance);
  }

  private generateNoise(): number {
    switch (this.config.noiseModel) {
      case 'gaussian':
        return this.gaussianNoise(0, this.config.noiseAmplitude);
      case 'random-walk':
        return Math.sin(this.noiseTime) * this.config.noiseAmplitude;
      case 'interference':
        return (Math.random() - 0.5) * this.config.noiseAmplitude * 3;
      case 'multipath':
        return (
          Math.sin(this.noiseTime * 2) * this.config.noiseAmplitude +
          Math.sin(this.noiseTime * 5) * this.config.noiseAmplitude * 0.5
        );
      default:
        return (Math.random() - 0.5) * this.config.noiseAmplitude;
    }
  }

  private generateInterference(): number {
    return Math.random() < 0.05 ? (Math.random() - 0.5) * 10 : 0;
  }

  private gaussianNoise(mean: number, stdDev: number): number {
    const u1 = 1 - Math.random();
    const u2 = 1 - Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  getCurrentPosition(): { x: number; y: number } {
    return { ...this.currentPosition };
  }

  getVirtualBeacons(): Map<string, VirtualBeacon> {
    return this.virtualBeacons;
  }
}

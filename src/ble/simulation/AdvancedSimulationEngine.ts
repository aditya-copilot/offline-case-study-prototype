import type {
  BeaconConfig,
  BeaconSignal,
  SimulationConfig,
  NoiseModel,
  PositionEstimate
} from '../types';
import { EventEmitter } from '@core/utils/events';

interface VirtualBeacon extends BeaconConfig {
  currentRSSI: number;
  baseRSSI: number;
  noiseOffset: number;
  signalHistory: number[];
  lastUpdate: number;
}

interface WalkPathPoint {
  x: number;
  y: number;
  pause?: number;
}

interface SimulationState {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  heading: number;
  walkIndex: number;
  pathProgress: number;
}

export class AdvancedSimulationEngine extends EventEmitter<{
  signal: BeaconSignal;
  positionUpdate: PositionEstimate;
  beaconUpdate: { beaconId: string; rssi: number; distance: number };
  pathComplete: void;
}> {
  private config: SimulationConfig;
  private virtualBeacons: Map<string, VirtualBeacon> = new Map();
  private simulationState: SimulationState;
  private intervals: Map<string, number> = new Map();
  private callback: ((signal: BeaconSignal) => void) | null = null;
  private isRunning: boolean = false;
  private noiseTime: number = 0;
  private interferenceEvents: Array<{ time: number; duration: number; strength: number }> = [];

  constructor(config: Partial<SimulationConfig> = {}) {
    super();
    this.config = {
      enabled: true,
      noiseModel: 'gaussian',
      noiseAmplitude: 3,
      driftRate: 0.1,
      updateInterval: 100,
      virtualBeacons: [],
      walkPath: [],
      walkSpeed: 1.5,
      ...config
    };

    this.simulationState = {
      position: { x: 50, y: 75 },
      velocity: { x: 0, y: 0 },
      heading: 0,
      walkIndex: 0,
      pathProgress: 0
    };

    this.initializeVirtualBeacons();
    this.generateInterferenceEvents();
  }

  private initializeVirtualBeacons(): void {
    this.config.virtualBeacons.forEach(beacon => {
      const virtualBeacon: VirtualBeacon = {
        ...beacon,
        currentRSSI: beacon.calibrationRSSI,
        baseRSSI: beacon.calibrationRSSI,
        noiseOffset: Math.random() * 1000,
        signalHistory: [],
        lastUpdate: Date.now()
      };
      this.virtualBeacons.set(beacon.id, virtualBeacon);
    });
  }

  private generateInterferenceEvents(): void {
    const now = Date.now();
    for (let i = 0; i < 5; i++) {
      this.interferenceEvents.push({
        time: now + Math.random() * 60000,
        duration: 2000 + Math.random() * 3000,
        strength: 5 + Math.random() * 10
      });
    }
  }

  start(callback: (signal: BeaconSignal) => void): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.callback = callback;

    const signalInterval = window.setInterval(() => {
      this.generateSignals();
    }, this.config.updateInterval);

    this.intervals.set('signal', signalInterval);

    if (this.config.walkPath.length > 0) {
      const positionInterval = window.setInterval(() => {
        this.updatePosition();
      }, 50);
      this.intervals.set('position', positionInterval);
    }

    const interferenceInterval = window.setInterval(() => {
      this.cleanupInterferenceEvents();
    }, 1000);
    this.intervals.set('interference', interferenceInterval);
  }

  stop(): void {
    this.isRunning = false;
    this.callback = null;

    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
  }

  pause(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
  }

  resume(): void {
    if (!this.isRunning) return;

    const signalInterval = window.setInterval(() => {
      this.generateSignals();
    }, this.config.updateInterval);
    this.intervals.set('signal', signalInterval);

    if (this.config.walkPath.length > 0) {
      const positionInterval = window.setInterval(() => {
        this.updatePosition();
      }, 50);
      this.intervals.set('position', positionInterval);
    }
  }

  setPosition(x: number, y: number): void {
    this.simulationState.position = { x, y };
    this.generateSignals();
  }

  setWalkPath(path: WalkPathPoint[]): void {
    this.config.walkPath = path;
    this.simulationState.walkIndex = 0;
    this.simulationState.pathProgress = 0;
  }

  setSpeed(speed: number): void {
    this.config.walkSpeed = speed;
  }

  setNoiseModel(model: NoiseModel): void {
    this.config.noiseModel = model;
  }

  setNoiseAmplitude(amplitude: number): void {
    this.config.noiseAmplitude = amplitude;
  }

  private generateSignals(): void {
    if (!this.callback) return;

    this.noiseTime += 0.1;
    const now = Date.now();

    this.virtualBeacons.forEach((beacon, id) => {
      const distance = this.calculateDistance(
        this.simulationState.position.x,
        this.simulationState.position.y,
        beacon.position.x,
        beacon.position.y
      );

      const pathLoss = this.calculatePathLoss(distance, beacon.environmentFactor);
      const baseRSSI = beacon.txPower - pathLoss;

      const noise = this.generateNoise();
      const interference = this.generateInterference(now);
      const multipath = this.generateMultipath(distance);
      const bodyShadowing = this.generateBodyShadowing();

      const rawRSSI = baseRSSI + noise + interference + multipath + bodyShadowing;
      beacon.currentRSSI = Math.round(rawRSSI * 10) / 10;

      beacon.signalHistory.push(beacon.currentRSSI);
      if (beacon.signalHistory.length > 100) {
        beacon.signalHistory.shift();
      }
      beacon.lastUpdate = now;

      const signal: BeaconSignal = {
        beaconId: id,
        rssi: beacon.currentRSSI,
        txPower: beacon.txPower,
        timestamp: now,
        distance: Math.round(distance * 10) / 10,
        accuracy: this.calculateAccuracy(distance, beacon.currentRSSI)
      };

      this.callback(signal);
      this.emit('signal', signal);
      this.emit('beaconUpdate', { beaconId: id, rssi: beacon.currentRSSI, distance });
    });

    this.emitPositionUpdate();
  }

  private updatePosition(): void {
    if (this.config.walkPath.length === 0) return;

    const currentPoint = this.config.walkPath[this.simulationState.walkIndex];
    const nextIndex = (this.simulationState.walkIndex + 1) % this.config.walkPath.length;
    const nextPoint = this.config.walkPath[nextIndex];

    const dx = nextPoint.x - this.simulationState.position.x;
    const dy = nextPoint.y - this.simulationState.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.config.walkSpeed * 0.05) {
      this.simulationState.position = { ...nextPoint };
      this.simulationState.walkIndex = nextIndex;

      if (nextIndex === 0) {
        this.emit('pathComplete');
      }
    } else {
      const ratio = (this.config.walkSpeed * 0.05) / distance;
      this.simulationState.position.x += dx * ratio;
      this.simulationState.position.y += dy * ratio;
    }

    this.simulationState.heading = Math.atan2(dy, dx) * 180 / Math.PI;
  }

  private calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  private calculatePathLoss(distance: number, environmentFactor: number): number {
    if (distance <= 1) return 0;
    return 10 * environmentFactor * Math.log10(distance);
  }

  private generateNoise(): number {
    const { noiseModel, noiseAmplitude } = this.config;

    switch (noiseModel) {
      case 'gaussian':
        return this.gaussianNoise(0, noiseAmplitude);
      case 'random-walk':
        return Math.sin(this.noiseTime) * noiseAmplitude;
      case 'interference':
        return (Math.random() - 0.5) * noiseAmplitude * 3;
      case 'multipath':
        return (
          Math.sin(this.noiseTime * 2) * noiseAmplitude +
          Math.sin(this.noiseTime * 5) * noiseAmplitude * 0.5 +
          Math.sin(this.noiseTime * 8) * noiseAmplitude * 0.25
        );
      default:
        return (Math.random() - 0.5) * noiseAmplitude;
    }
  }

  private generateInterference(now: number): number {
    const activeInterference = this.interferenceEvents.find(
      event => now >= event.time && now < event.time + event.duration
    );

    if (activeInterference) {
      const progress = (now - activeInterference.time) / activeInterference.duration;
      const envelope = Math.sin(progress * Math.PI);
      return (Math.random() - 0.5) * activeInterference.strength * envelope;
    }

    return Math.random() < 0.02 ? (Math.random() - 0.5) * 8 : 0;
  }

  private generateMultipath(distance: number): number {
    const reflectionStrength = 0.3;
    const pathDiff = distance * 0.1;
    return Math.sin(this.noiseTime * 3 + pathDiff) * reflectionStrength * this.config.noiseAmplitude;
  }

  private generateBodyShadowing(): number {
    return Math.random() < 0.1 ? -3 - Math.random() * 5 : 0;
  }

  private gaussianNoise(mean: number, stdDev: number): number {
    const u1 = 1 - Math.random();
    const u2 = 1 - Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  private calculateAccuracy(distance: number, rssi: number): 'high' | 'medium' | 'low' {
    if (distance < 3 && rssi > -70) return 'high';
    if (distance < 8 && rssi > -80) return 'medium';
    return 'low';
  }

  private cleanupInterferenceEvents(): void {
    const now = Date.now();
    this.interferenceEvents = this.interferenceEvents.filter(
      event => now < event.time + event.duration + 1000
    );

    if (this.interferenceEvents.length < 3) {
      this.generateInterferenceEvents();
    }
  }

  private emitPositionUpdate(): void {
    const estimate: PositionEstimate = {
      x: Math.round(this.simulationState.position.x * 100) / 100,
      y: Math.round(this.simulationState.position.y * 100) / 100,
      z: 1.5,
      accuracy: 1.5,
      confidence: 0.85,
      method: 'trilateration',
      timestamp: Date.now()
    };

    this.emit('positionUpdate', estimate);
  }

  getCurrentPosition(): { x: number; y: number } {
    return { ...this.simulationState.position };
  }

  getCurrentVelocity(): { x: number; y: number } {
    return { ...this.simulationState.velocity };
  }

  getHeading(): number {
    return this.simulationState.heading;
  }

  getVirtualBeacons(): Map<string, VirtualBeacon> {
    return this.virtualBeacons;
  }

  getSignalHistory(beaconId: string): number[] {
    const beacon = this.virtualBeacons.get(beaconId);
    return beacon ? [...beacon.signalHistory] : [];
  }

  getStatistics(): {
    totalBeacons: number;
    activeBeacons: number;
    averageRSSI: number;
    pathProgress: number;
  } {
    const beaconList = Array.from(this.virtualBeacons.values());
    const activeBeacons = beaconList.filter(b =>
      Date.now() - b.lastUpdate < 5000
    );

    const averageRSSI = activeBeacons.length > 0
      ? activeBeacons.reduce((sum, b) => sum + b.currentRSSI, 0) / activeBeacons.length
      : 0;

    return {
      totalBeacons: beaconList.length,
      activeBeacons: activeBeacons.length,
      averageRSSI: Math.round(averageRSSI * 10) / 10,
      pathProgress: this.simulationState.pathProgress
    };
  }

  isActive(): boolean {
    return this.isRunning;
  }

  reset(): void {
    this.stop();
    this.simulationState = {
      position: { x: 50, y: 75 },
      velocity: { x: 0, y: 0 },
      heading: 0,
      walkIndex: 0,
      pathProgress: 0
    };
    this.noiseTime = 0;
    this.initializeVirtualBeacons();
  }
}

import type {
  Vector2,
  CustomerPosition,
  MovementState,
  EasingFunction,
  StoreZone
} from '@core/spatial/types';
import { calculateDistance, generateId } from '@core/utils';
import { EventEmitter } from '@core/utils/events';

interface SimulationConfig {
  updateInterval: number;
  smoothingFactor: number;
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
}

interface ZoneTransition {
  fromZone: string | null;
  toZone: string | null;
  timestamp: number;
  entryPoint: Vector2;
}

export class CustomerSimulationEngine extends EventEmitter<{
  positionUpdate: CustomerPosition;
  zoneEnter: { zone: StoreZone; position: Vector2 };
  zoneExit: { zone: StoreZone; position: Vector2 };
  movementStart: { from: Vector2; to: Vector2 };
  movementEnd: { position: Vector2 };
  pathProgress: { position: CustomerPosition; progress: number };
}> {
  private position: CustomerPosition;
  private config: SimulationConfig;
  private movementState: MovementState | null = null;
  private targetPath: Vector2[] = [];
  private currentPathIndex = 0;
  private isSimulating = false;
  private animationFrame: number | null = null;
  private lastUpdate = 0;
  private zones: Map<string, StoreZone> = new Map();
  private currentZone: string | null = null;
  private zoneHistory: ZoneTransition[] = [];
  private noiseOffset = 0;

  constructor(
    startPosition: Vector2 = { x: 0, y: 0 },
    config: Partial<SimulationConfig> = {}
  ) {
    super();
    this.position = {
      id: generateId(),
      position: { ...startPosition },
      heading: 0,
      velocity: { x: 0, y: 0 },
      accuracy: 1,
      timestamp: Date.now(),
      isMoving: false
    };
    this.config = {
      updateInterval: 16,
      smoothingFactor: 0.3,
      maxSpeed: 2,
      acceleration: 0.1,
      deceleration: 0.05,
      ...config
    };
  }

  setZones(zones: StoreZone[]): void {
    this.zones.clear();
    zones.forEach(zone => this.zones.set(zone.id, zone));
    this.checkZoneTransition();
  }

  start(): void {
    if (this.isSimulating) return;
    this.isSimulating = true;
    this.lastUpdate = performance.now();
    this.loop();
  }

  stop(): void {
    this.isSimulating = false;
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  private loop = (): void => {
    if (!this.isSimulating) return;

    const now = performance.now();
    const deltaTime = (now - this.lastUpdate) / 1000;
    this.lastUpdate = now;

    this.update(deltaTime);
    this.animationFrame = requestAnimationFrame(this.loop);
  };

  private update(deltaTime: number): void {
    if (this.movementState) {
      this.updateMovement(deltaTime);
    }

    this.applyNoise();
    this.checkZoneTransition();
    this.updateHeading();

    this.position.timestamp = Date.now();
    this.emit('positionUpdate', { ...this.position });
  }

  private updateMovement(deltaTime: number): void {
    if (!this.movementState) return;

    const { from, to, startTime, duration, easing } = this.movementState;
    const elapsed = (Date.now() - startTime) / 1000;
    const progress = Math.min(elapsed / duration, 1);

    const easedProgress = this.applyEasing(progress, easing);
    this.movementState.progress = easedProgress;

    this.position.position.x = from.x + (to.x - from.x) * easedProgress;
    this.position.position.y = from.y + (to.y - from.y) * easedProgress;
    this.position.isMoving = true;

    this.emit('pathProgress', {
      position: { ...this.position },
      progress: easedProgress
    });

    if (progress >= 1) {
      this.completeMovement();
    }
  }

  private completeMovement(): void {
    if (!this.movementState) return;

    this.position.isMoving = false;
    this.position.velocity = { x: 0, y: 0 };

    this.emit('movementEnd', { position: { ...this.position.position } });

    this.currentPathIndex++;
    if (this.currentPathIndex < this.targetPath.length) {
      this.moveToPoint(this.targetPath[this.currentPathIndex]);
    } else {
      this.movementState = null;
      this.targetPath = [];
      this.currentPathIndex = 0;
    }
  }

  moveTo(target: Vector2, duration?: number, easing: EasingFunction = 'easeOut'): void {
    this.targetPath = [target];
    this.currentPathIndex = 0;
    this.moveToPoint(target, duration, easing);
    this.emit('movementStart', {
      from: { ...this.position.position },
      to: { ...target }
    });
  }

  followPath(path: Vector2[], speed = 1.5): void {
    if (path.length < 2) return;

    this.targetPath = [...path];
    this.currentPathIndex = 1;

    const firstTarget = this.targetPath[1];
    const distance = calculateDistance(
      this.position.position.x,
      this.position.position.y,
      firstTarget.x,
      firstTarget.y
    );
    const duration = distance / speed;

    this.moveToPoint(firstTarget, duration, 'easeInOut');
    this.emit('movementStart', {
      from: { ...this.position.position },
      to: { ...firstTarget }
    });
  }

  private moveToPoint(target: Vector2, duration?: number, easing: EasingFunction = 'easeOut'): void {
    const distance = calculateDistance(
      this.position.position.x,
      this.position.position.y,
      target.x,
      target.y
    );

    const moveDuration = duration || distance / this.config.maxSpeed;

    this.movementState = {
      from: { ...this.position.position },
      to: { ...target },
      progress: 0,
      speed: this.config.maxSpeed,
      easing,
      startTime: Date.now(),
      duration: moveDuration
    };

    this.position.isMoving = true;
  }

  private applyEasing(t: number, easing: EasingFunction): number {
    switch (easing) {
      case 'linear':
        return t;
      case 'easeIn':
        return t * t;
      case 'easeOut':
        return 1 - (1 - t) * (1 - t);
      case 'easeInOut':
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      case 'spring':
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
      case 'bounce':
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) return n1 * t * t;
        else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
        else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
        else return n1 * (t -= 2.625 / d1) * t + 0.984375;
      default:
        return t;
    }
  }

  private applyNoise(): void {
    this.noiseOffset += 0.01;
    const noiseX = Math.sin(this.noiseOffset) * 0.5;
    const noiseY = Math.cos(this.noiseOffset * 1.3) * 0.5;

    this.position.position.x += noiseX * this.config.smoothingFactor;
    this.position.position.y += noiseY * this.config.smoothingFactor;
  }

  private updateHeading(): void {
    if (this.movementState && this.movementState.progress < 1) {
      const dx = this.movementState.to.x - this.movementState.from.x;
      const dy = this.movementState.to.y - this.movementState.from.y;
      const targetHeading = Math.atan2(dy, dx);

      let diff = targetHeading - this.position.heading;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;

      this.position.heading += diff * 0.1;
    }
  }

  private checkZoneTransition(): void {
    const zone = this.getZoneAtPosition(this.position.position);
    const newZoneId = zone?.id || null;

    if (newZoneId !== this.currentZone) {
      const oldZone = this.currentZone ? this.zones.get(this.currentZone) : null;

      if (oldZone) {
        this.emit('zoneExit', {
          zone: oldZone,
          position: { ...this.position.position }
        });
      }

      if (zone) {
        this.emit('zoneEnter', {
          zone,
          position: { ...this.position.position }
        });
      }

      this.zoneHistory.push({
        fromZone: this.currentZone,
        toZone: newZoneId,
        timestamp: Date.now(),
        entryPoint: { ...this.position.position }
      });

      this.currentZone = newZoneId;
      this.position.zoneId = newZoneId || undefined;
    }
  }

  private getZoneAtPosition(position: Vector2): StoreZone | null {
    for (const zone of this.zones.values()) {
      if (
        position.x >= zone.bounds.min.x &&
        position.x <= zone.bounds.max.x &&
        position.y >= zone.bounds.min.y &&
        position.y <= zone.bounds.max.y
      ) {
        return zone;
      }
    }
    return null;
  }

  getPosition(): CustomerPosition {
    return { ...this.position };
  }

  getCurrentZone(): string | null {
    return this.currentZone;
  }

  getZoneHistory(): ZoneTransition[] {
    return [...this.zoneHistory];
  }

  teleportTo(position: Vector2): void {
    this.position.position = { ...position };
    this.position.velocity = { x: 0, y: 0 };
    this.movementState = null;
    this.targetPath = [];
    this.currentPathIndex = 0;
    this.checkZoneTransition();
    this.emit('positionUpdate', { ...this.position });
  }

  setAccuracy(accuracy: number): void {
    this.position.accuracy = accuracy;
  }

  simulateRSSI(): { [beaconId: string]: number } {
    const rssi: { [beaconId: string]: number } = {};
    const zone = this.currentZone ? this.zones.get(this.currentZone) : null;

    if (zone && zone.beacons) {
      zone.beacons.forEach((beaconId, index) => {
        const distance = Math.random() * 10 + index * 2;
        const baseRSSI = -50;
        const pathLoss = 20 * Math.log10(distance);
        const noise = (Math.random() - 0.5) * 4;
        rssi[beaconId] = Math.round(baseRSSI - pathLoss + noise);
      });
    }

    return rssi;
  }

  isMoving(): boolean {
    return this.position.isMoving;
  }

  getPathProgress(): number {
    if (!this.movementState) return 0;
    if (this.targetPath.length < 2) return this.movementState.progress;

    const totalSegments = this.targetPath.length - 1;
    const completedSegments = this.currentPathIndex - 1;
    const currentProgress = this.movementState.progress;

    return (completedSegments + currentProgress) / totalSegments;
  }

  destroy(): void {
    this.stop();
    this.removeAllListeners();
  }
}

export const createSimulationEngine = (
  startPosition?: Vector2,
  config?: Partial<SimulationConfig>
): CustomerSimulationEngine => {
  return new CustomerSimulationEngine(startPosition, config);
};

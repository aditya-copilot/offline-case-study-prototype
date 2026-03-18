import { brainOrchestrator } from '@brain/orchestrator/BrainOrchestrator';
import { gamificationEngine } from '@gamification/engine/GamificationEngine';
import { analyticsBus } from '@analytics/collectors/AnalyticsEventBus';
import { signalBus } from '@ble/signal-bus/SignalBus';
import { dbManager } from '@services/db';

export interface PlatformConfig {
  enableBrain: boolean;
  enableGamification: boolean;
  enableAnalytics: boolean;
  enableBLE: boolean;
  debugMode: boolean;
}

export class PlatformRuntime {
  private static instance: PlatformRuntime;
  private initialized = false;
  private config: PlatformConfig;
  private subscribers: Array<() => void> = [];

  static getInstance(): PlatformRuntime {
    if (!PlatformRuntime.instance) {
      PlatformRuntime.instance = new PlatformRuntime();
    }
    return PlatformRuntime.instance;
  }

  private constructor() {
    this.config = {
      enableBrain: true,
      enableGamification: true,
      enableAnalytics: true,
      enableBLE: true,
      debugMode: false
    };
  }

  async initialize(customerId: string, config?: Partial<PlatformConfig>): Promise<void> {
    if (this.initialized) return;

    this.config = { ...this.config, ...config };

    await dbManager.initialize();

    if (this.config.enableAnalytics) {
      analyticsBus.subscribe('platform', (events) => {
        events.forEach(event => {
          if (this.config.enableBrain) {
            brainOrchestrator.emitSignal({
              type: 'system_health',
              source: 'analytics',
              data: event,
              priority: 'low',
              confidence: 1
            });
          }
        });
      });
    }

    if (this.config.enableBLE) {
      const unsubBLE = signalBus.subscribe('zone-change', (event) => {
        if (this.config.enableBrain) {
          brainOrchestrator.emitSignal({
            type: 'zone_changed',
            source: 'ble',
            data: event.data,
            priority: 'high',
            confidence: event.data.confidence
          });
        }
      });
      this.subscribers.push(unsubBLE);

      const unsubPosition = signalBus.subscribe('position-estimate', (event) => {
        if (this.config.enableBrain) {
          brainOrchestrator.emitSignal({
            type: 'position_updated',
            source: 'ble',
            data: event.data,
            priority: 'medium',
            confidence: 0.9
          });
        }
      });
      this.subscribers.push(unsubPosition);
    }

    if (this.config.enableBrain) {
      await brainOrchestrator.initialize(customerId);
    }

    if (this.config.enableGamification) {
      await gamificationEngine.initialize(customerId);
    }

    this.initialized = true;

    if (this.config.debugMode) {
      console.log('[Platform] Runtime initialized', this.config);
    }
  }

  getConfig(): PlatformConfig {
    return { ...this.config };
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  destroy(): void {
    this.subscribers.forEach(unsub => unsub());
    this.subscribers = [];
    brainOrchestrator.destroy();
    this.initialized = false;
  }
}

export const platformRuntime = PlatformRuntime.getInstance();

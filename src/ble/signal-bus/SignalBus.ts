import type { BeaconSignal, FilteredSignal, ZoneEstimate, PositionEstimate } from '../types';
import { EventEmitter } from '@core/utils/events';

export type SignalBusEvent =
  | { type: 'raw-signal'; data: BeaconSignal }
  | { type: 'filtered-signal'; data: FilteredSignal }
  | { type: 'zone-estimate'; data: ZoneEstimate }
  | { type: 'position-estimate'; data: PositionEstimate }
  | { type: 'beacon-discovered'; data: { beaconId: string; timestamp: number } }
  | { type: 'beacon-lost'; data: { beaconId: string; timestamp: number } }
  | { type: 'zone-enter'; data: { zoneId: string; confidence: number } }
  | { type: 'zone-exit'; data: { zoneId: string; duration: number } }
  | { type: 'zone-change'; data: { from: string | null; to: string; confidence: number } }
  | { type: 'scan-status'; data: { status: string; timestamp: number } }
  | { type: 'error'; data: Error };

export class SignalBus extends EventEmitter<SignalBusEvent> {
  private static instance: SignalBus;
  private eventHistory: SignalBusEvent[] = [];
  private maxHistorySize: number = 1000;
  private subscribers: Map<string, Set<(event: SignalBusEvent) => void>> = new Map();

  static getInstance(): SignalBus {
    if (!SignalBus.instance) {
      SignalBus.instance = new SignalBus();
    }
    return SignalBus.instance;
  }

  private constructor() {
    super();
  }

  emit<K extends SignalBusEvent['type']>(
    type: K,
    data: Extract<SignalBusEvent, { type: K }>['data']
  ): void {
    const event = { type, data } as SignalBusEvent;

    this.addToHistory(event);
    super.emit(event.type as any, event.data);

    const typeSubscribers = this.subscribers.get(type);
    if (typeSubscribers) {
      typeSubscribers.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in signal bus subscriber:', error);
        }
      });
    }
  }

  subscribe<K extends SignalBusEvent['type']>(
    type: K,
    callback: (event: Extract<SignalBusEvent, { type: K }>) => void
  ): () => void {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }

    const wrappedCallback = (event: SignalBusEvent) => callback(event as Extract<SignalBusEvent, { type: K }>);
    this.subscribers.get(type)!.add(wrappedCallback);

    return () => {
      this.subscribers.get(type)?.delete(wrappedCallback);
    };
  }

  subscribeToMultiple<K extends SignalBusEvent['type']>(
    types: K[],
    callback: (event: Extract<SignalBusEvent, { type: K }>) => void
  ): () => void {
    const unsubscribers = types.map(type => this.subscribe(type, callback));
    return () => unsubscribers.forEach(unsub => unsub());
  }

  private addToHistory(event: SignalBusEvent): void {
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  getHistory(type?: SignalBusEvent['type']): SignalBusEvent[] {
    if (type) {
      return this.eventHistory.filter(e => e.type === type);
    }
    return [...this.eventHistory];
  }

  getRecentHistory(count: number = 100): SignalBusEvent[] {
    return this.eventHistory.slice(-count);
  }

  getHistoryByTimeRange(startTime: number, endTime: number): SignalBusEvent[] {
    return this.eventHistory.filter(e => {
      const timestamp = (e.data as any)?.timestamp || 0;
      return timestamp >= startTime && timestamp <= endTime;
    });
  }

  clearHistory(): void {
    this.eventHistory = [];
  }

  getStats(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    subscriberCount: number;
  } {
    const eventsByType: Record<string, number> = {};

    this.eventHistory.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    });

    let subscriberCount = 0;
    this.subscribers.forEach(subscribers => {
      subscriberCount += subscribers.size;
    });

    return {
      totalEvents: this.eventHistory.length,
      eventsByType,
      subscriberCount
    };
  }

  reset(): void {
    this.clearHistory();
    this.subscribers.clear();
    this.removeAllListeners();
  }
}

export const signalBus = SignalBus.getInstance();

import { EventEmitter } from '@core/utils/events';
import type { 
  AnalyticsEvent, 
  AnalyticsEventType,
  AnalyticsSubscriber 
} from '../types';

interface AnalyticsBusEvent {
  'event-collected': AnalyticsEvent;
  'batch-ready': AnalyticsEvent[];
  'stream-flush': void;
  'session-start': { sessionId: string; customerId: string };
  'session-end': { sessionId: string; duration: number };
}

export class AnalyticsEventBus extends EventEmitter<AnalyticsBusEvent> {
  private static instance: AnalyticsEventBus;
  private eventBuffer: AnalyticsEvent[] = [];
  private subscribers: Map<string, AnalyticsSubscriber> = new Map();
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private maxBufferSize: number;
  private flushIntervalMs: number;
  private currentSession: { sessionId: string; customerId: string } | null = null;

  static getInstance(config?: { bufferSize?: number; flushInterval?: number }): AnalyticsEventBus {
    if (!AnalyticsEventBus.instance) {
      AnalyticsEventBus.instance = new AnalyticsEventBus(config);
    }
    return AnalyticsEventBus.instance;
  }

  private constructor(config?: { bufferSize?: number; flushInterval?: number }) {
    super();
    this.maxBufferSize = config?.bufferSize ?? 100;
    this.flushIntervalMs = config?.flushInterval ?? 5000;
    this.startFlushInterval();
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.flushIntervalMs);
  }

  collect(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): void {
    const fullEvent: AnalyticsEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now()
    };

    this.eventBuffer.push(fullEvent);
    this.emit('event-collected', fullEvent);

    if (this.eventBuffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  collectMany(events: Omit<AnalyticsEvent, 'id' | 'timestamp'>[]): void {
    events.forEach(event => this.collect(event));
  }

  flush(): void {
    if (this.eventBuffer.length === 0) return;

    const batch = [...this.eventBuffer];
    this.eventBuffer = [];

    this.emit('batch-ready', batch);
    this.emit('stream-flush', undefined);

    this.subscribers.forEach(subscriber => {
      const filtered = subscriber.filter 
        ? batch.filter(subscriber.filter)
        : batch;
      
      if (filtered.length > 0) {
        try {
          subscriber.callback(filtered);
        } catch (error) {
          console.error('Error in analytics subscriber:', error);
        }
      }
    });
  }

  subscribe(
    id: string,
    callback: (events: AnalyticsEvent[]) => void,
    filter?: (event: AnalyticsEvent) => boolean
  ): () => void {
    this.subscribers.set(id, { id, callback, filter });

    return () => {
      this.subscribers.delete(id);
    };
  }

  startSession(sessionId: string, customerId: string): void {
    this.currentSession = { sessionId, customerId };
    this.emit('session-start', { sessionId, customerId });
  }

  endSession(duration: number): void {
    if (this.currentSession) {
      this.emit('session-end', { 
        sessionId: this.currentSession.sessionId, 
        duration 
      });
      this.currentSession = null;
    }
  }

  getCurrentSession(): { sessionId: string; customerId: string } | null {
    return this.currentSession;
  }

  getBufferSize(): number {
    return this.eventBuffer.length;
  }

  clearBuffer(): void {
    this.eventBuffer = [];
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush();
    this.subscribers.clear();
    this.removeAllListeners();
  }
}

export const analyticsBus = AnalyticsEventBus.getInstance();

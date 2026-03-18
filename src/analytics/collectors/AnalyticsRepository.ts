import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { 
  AnalyticsEvent, 
  SessionAnalytics, 
  ZoneMetrics 
} from '../types';

interface AnalyticsDB extends DBSchema {
  events: {
    key: string;
    value: AnalyticsEvent;
    indexes: {
      'by-timestamp': number;
      'by-type': string;
      'by-session': string;
      'by-zone': string;
      'by-customer': string;
    };
  };
  sessions: {
    key: string;
    value: SessionAnalytics;
    indexes: {
      'by-start-time': number;
      'by-customer': string;
    };
  };
  zoneMetrics: {
    key: string;
    value: ZoneMetrics;
  };
}

export class AnalyticsRepository {
  private db: IDBPDatabase<AnalyticsDB> | null = null;
  private readonly DB_NAME = 'SmartStoreAnalytics';
  private readonly DB_VERSION = 1;

  async initialize(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<AnalyticsDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('events')) {
          const eventStore = db.createObjectStore('events', { keyPath: 'id' });
          eventStore.createIndex('by-timestamp', 'timestamp');
          eventStore.createIndex('by-type', 'type');
          eventStore.createIndex('by-session', 'sessionId');
          eventStore.createIndex('by-zone', 'zoneId');
          eventStore.createIndex('by-customer', 'customerId');
        }

        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'sessionId' });
          sessionStore.createIndex('by-start-time', 'startTime');
          sessionStore.createIndex('by-customer', 'customerId');
        }

        if (!db.objectStoreNames.contains('zoneMetrics')) {
          db.createObjectStore('zoneMetrics', { keyPath: 'zoneId' });
        }
      }
    });
  }

  async saveEvent(event: AnalyticsEvent): Promise<void> {
    await this.initialize();
    await this.db!.put('events', event);
  }

  async saveEvents(events: AnalyticsEvent[]): Promise<void> {
    await this.initialize();
    const tx = this.db!.transaction('events', 'readwrite');
    for (const event of events) {
      await tx.store.put(event);
    }
    await tx.done;
  }

  async getEventsBySession(sessionId: string): Promise<AnalyticsEvent[]> {
    await this.initialize();
    return this.db!.getAllFromIndex('events', 'by-session', sessionId);
  }

  async getEventsByTimeRange(start: number, end: number): Promise<AnalyticsEvent[]> {
    await this.initialize();
    const tx = this.db!.transaction('events', 'readonly');
    const index = tx.store.index('by-timestamp');
    return index.getAll(IDBKeyRange.bound(start, end));
  }

  async getEventsByType(type: string, limit: number = 100): Promise<AnalyticsEvent[]> {
    await this.initialize();
    return this.db!.getAllFromIndex('events', 'by-type', type, limit);
  }

  async getEventsByZone(zoneId: string): Promise<AnalyticsEvent[]> {
    await this.initialize();
    return this.db!.getAllFromIndex('events', 'by-zone', zoneId);
  }

  async getAllEvents(limit: number = 1000): Promise<AnalyticsEvent[]> {
    await this.initialize();
    return this.db!.getAll('events', undefined, limit);
  }

  async saveSession(session: SessionAnalytics): Promise<void> {
    await this.initialize();
    await this.db!.put('sessions', session);
  }

  async getSession(sessionId: string): Promise<SessionAnalytics | undefined> {
    await this.initialize();
    return this.db!.get('sessions', sessionId);
  }

  async getAllSessions(limit: number = 100): Promise<SessionAnalytics[]> {
    await this.initialize();
    const tx = this.db!.transaction('sessions', 'readonly');
    const index = tx.store.index('by-start-time');
    return index.getAll(undefined, limit);
  }

  async saveZoneMetrics(metrics: ZoneMetrics): Promise<void> {
    await this.initialize();
    await this.db!.put('zoneMetrics', metrics);
  }

  async getZoneMetrics(zoneId: string): Promise<ZoneMetrics | undefined> {
    await this.initialize();
    return this.db!.get('zoneMetrics', zoneId);
  }

  async getAllZoneMetrics(): Promise<ZoneMetrics[]> {
    await this.initialize();
    return this.db!.getAll('zoneMetrics');
  }

  async clearOldEvents(olderThan: number): Promise<void> {
    await this.initialize();
    const tx = this.db!.transaction('events', 'readwrite');
    const index = tx.store.index('by-timestamp');
    const oldEvents = await index.getAll(IDBKeyRange.upperBound(olderThan));
    
    for (const event of oldEvents) {
      await tx.store.delete(event.id);
    }
    await tx.done;
  }

  async getStats(): Promise<{
    totalEvents: number;
    totalSessions: number;
    oldestEvent: number;
    newestEvent: number;
  }> {
    await this.initialize();
    
    const eventCount = await this.db!.count('events');
    const sessionCount = await this.db!.count('sessions');
    
    const tx = this.db!.transaction('events', 'readonly');
    const index = tx.store.index('by-timestamp');
    
    const allEvents = await index.getAll(undefined, 1);
    const newest = allEvents[0]?.timestamp ?? 0;
    
    const cursor = await index.openCursor(undefined, 'prev');
    const oldest = cursor?.value?.timestamp ?? 0;

    return {
      totalEvents: eventCount,
      totalSessions: sessionCount,
      oldestEvent: oldest,
      newestEvent: newest
    };
  }

  async exportAll(): Promise<{
    events: AnalyticsEvent[];
    sessions: SessionAnalytics[];
    zoneMetrics: ZoneMetrics[];
    exportedAt: number;
  }> {
    await this.initialize();
    
    const [events, sessions, zoneMetrics] = await Promise.all([
      this.getAllEvents(10000),
      this.getAllSessions(1000),
      this.getAllZoneMetrics()
    ]);

    return {
      events,
      sessions,
      zoneMetrics,
      exportedAt: Date.now()
    };
  }
}

export const analyticsRepo = new AnalyticsRepository();

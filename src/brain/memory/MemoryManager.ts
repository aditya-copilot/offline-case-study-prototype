import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { RetailSessionContext, MemorySnapshot } from '../types';

interface BrainMemoryDB extends DBSchema {
  sessions: {
    key: string;
    value: {
      customerId: string;
      session: RetailSessionContext;
      updatedAt: number;
    };
  };
  behavioral: {
    key: string;
    value: {
      customerId: string;
      patterns: string[];
      preferences: Record<string, number>;
    };
  };
}

export class MemoryManager {
  private db: IDBPDatabase<BrainMemoryDB> | null = null;
  private readonly DB_NAME = 'BrainMemory';
  private readonly DB_VERSION = 1;
  
  private memoryCache: Map<string, MemorySnapshot> = new Map();

  async initialize(): Promise<void> {
    this.db = await openDB<BrainMemoryDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'customerId' });
        }
        if (!db.objectStoreNames.contains('behavioral')) {
          db.createObjectStore('behavioral', { keyPath: 'customerId' });
        }
      }
    });
  }

  async loadMemory(customerId: string): Promise<MemorySnapshot> {
    if (this.memoryCache.has(customerId)) {
      return this.memoryCache.get(customerId)!;
    }

    const defaultMemory: MemorySnapshot = {
      session: {
        entryPoint: { x: 0, y: 0 },
        pathHistory: [],
        zoneTransitions: [],
        decisions: []
      },
      behavioral: {
        typicalPathPatterns: [],
        preferredZones: new Map(),
        shoppingStyle: 'browsing',
        timeOfDayPreference: 12,
        dwellTimeAverage: 0
      },
      zone: {
        zoneVisits: new Map(),
        masteryLevels: new Map(),
        preferredRoutes: new Map(),
        lastVisit: new Map()
      },
      recommendation: {
        shownRecommendations: [],
        clickedRecommendations: [],
        successRate: 0,
        categoryAffinity: new Map()
      },
      progression: {
        totalSessions: 0,
        totalXpEarned: 0,
        achievementsUnlocked: [],
        missionSuccessRate: 0
      }
    };

    this.memoryCache.set(customerId, defaultMemory);
    return defaultMemory;
  }

  async updateSessionMemory(
    customerId: string,
    context: RetailSessionContext
  ): Promise<void> {
    if (!this.db) return;

    await this.db.put('sessions', {
      customerId,
      session: context,
      updatedAt: Date.now()
    });
  }

  getMemorySnapshot(): MemorySnapshot {
    return {
      session: {
        entryPoint: { x: 0, y: 0 },
        pathHistory: [],
        zoneTransitions: [],
        decisions: []
      },
      behavioral: {
        typicalPathPatterns: [],
        preferredZones: new Map(),
        shoppingStyle: 'browsing',
        timeOfDayPreference: 12,
        dwellTimeAverage: 0
      },
      zone: {
        zoneVisits: new Map(),
        masteryLevels: new Map(),
        preferredRoutes: new Map(),
        lastVisit: new Map()
      },
      recommendation: {
        shownRecommendations: [],
        clickedRecommendations: [],
        successRate: 0,
        categoryAffinity: new Map()
      },
      progression: {
        totalSessions: 1,
        totalXpEarned: 0,
        achievementsUnlocked: [],
        missionSuccessRate: 0
      }
    };
  }
}

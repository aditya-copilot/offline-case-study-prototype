import { openDB, type IDBPDatabase } from 'idb';
import type { AICacheEntry, PromptContext, AIRecommendation } from '../types';

interface CacheConfig {
  dbName: string;
  storeName: string;
  maxEntries: number;
  defaultTTL: number;
}

export class AICache {
  private db: IDBPDatabase | null = null;
  private config: CacheConfig;
  private memoryCache: Map<string, AICacheEntry> = new Map();

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      dbName: 'AIRecommendationCache',
      storeName: 'recommendations',
      maxEntries: 100,
      defaultTTL: 5 * 60 * 1000,
      ...config
    };
    this.initDB();
  }

  private async initDB(): Promise<void> {
    try {
      this.db = await openDB(this.config.dbName, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('recommendations')) {
            const store = db.createObjectStore('recommendations', { keyPath: 'key' });
            store.createIndex('timestamp', 'expiresAt');
          }
        }
      });
    } catch {
      console.warn('IndexedDB not available, using memory cache only');
    }
  }

  async get(key: string): Promise<AICacheEntry | null> {
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && Date.now() < memoryEntry.expiresAt) {
      memoryEntry.hitCount++;
      return memoryEntry;
    }

    if (this.db) {
      try {
        const entry = await this.db.get(this.config.storeName, key);
        if (entry && Date.now() < entry.expiresAt) {
          this.memoryCache.set(key, entry);
          return entry;
        }
        if (entry) {
          await this.db.delete(this.config.storeName, key);
        }
      } catch {
        // Ignore DB errors
      }
    }

    return null;
  }

  async set(key: string, entry: Omit<AICacheEntry, 'hitCount'>): Promise<void> {
    const fullEntry: AICacheEntry = { ...entry, hitCount: 0 };

    this.memoryCache.set(key, fullEntry);

    if (this.db) {
      try {
        await this.db.put(this.config.storeName, fullEntry);
        await this.cleanup();
      } catch {
        // Ignore DB errors
      }
    }
  }

  private async cleanup(): Promise<void> {
    if (!this.db) return;

    try {
      const tx = this.db.transaction(this.config.storeName, 'readwrite');
      const index = tx.store.index('timestamp');
      const now = Date.now();
      
      let cursor = await index.openCursor();
      let count = 0;

      while (cursor) {
        if (cursor.value.expiresAt < now || count >= this.config.maxEntries) {
          await cursor.delete();
        }
        count++;
        cursor = await cursor.continue();
      }

      await tx.done;
    } catch {
      // Ignore cleanup errors
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    if (this.db) {
      try {
        const tx = this.db.transaction(this.config.storeName, 'readwrite');
        await tx.store.clear();
        await tx.done;
      } catch {
        // Ignore clear errors
      }
    }
  }

  async getStats(): Promise<{ memorySize: number; dbSize: number }> {
    let dbSize = 0;
    
    if (this.db) {
      try {
        const tx = this.db.transaction(this.config.storeName, 'readonly');
        dbSize = await tx.store.count();
      } catch {
        // Ignore stats errors
      }
    }

    return {
      memorySize: this.memoryCache.size,
      dbSize
    };
  }
}

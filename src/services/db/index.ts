import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  Product,
  StoreZone,
  ShoppingList,
  UserProfile,
  SyncQueueItem,
  BeaconSignal,
  NavigationRoute,
  AnalyticsEvent
} from '@core/types';
import { DB_NAME, DB_VERSION, STORE_NAMES } from '@core/constants';

interface StoreNavigatorDB extends DBSchema {
  [STORE_NAMES.PRODUCTS]: {
    key: string;
    value: Product;
    indexes: {
      'by-zone': string;
      'by-category': string;
      'by-sku': string;
    };
  };
  [STORE_NAMES.ZONES]: {
    key: string;
    value: StoreZone;
    indexes: {
      'by-type': string;
    };
  };
  [STORE_NAMES.SHOPPING_LISTS]: {
    key: string;
    value: ShoppingList;
    indexes: {
      'by-updated': number;
    };
  };
  [STORE_NAMES.USER_PROFILE]: {
    key: string;
    value: UserProfile;
  };
  [STORE_NAMES.PREFERENCES]: {
    key: string;
    value: { key: string; value: unknown };
  };
  [STORE_NAMES.SYNC_QUEUE]: {
    key: string;
    value: SyncQueueItem;
    indexes: {
      'by-timestamp': number;
      'by-type': string;
    };
  };
  [STORE_NAMES.ANALYTICS]: {
    key: string;
    value: AnalyticsEvent;
    indexes: {
      'by-timestamp': number;
      'by-category': string;
    };
  };
  [STORE_NAMES.CACHE]: {
    key: string;
    value: { key: string; value: unknown; expiresAt: number };
    indexes: {
      'by-expires': number;
    };
  };
  [STORE_NAMES.ROUTES]: {
    key: string;
    value: NavigationRoute;
    indexes: {
      'by-created': number;
    };
  };
  [STORE_NAMES.BEACON_HISTORY]: {
    key: string;
    value: BeaconSignal;
    indexes: {
      'by-timestamp': number;
      'by-zone': string;
    };
  };
}

class DatabaseManager {
  private db: IDBPDatabase<StoreNavigatorDB> | null = null;
  private initPromise: Promise<IDBPDatabase<StoreNavigatorDB>> | null = null;

  async initialize(): Promise<IDBPDatabase<StoreNavigatorDB>> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = openDB<StoreNavigatorDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAMES.PRODUCTS)) {
          const productStore = db.createObjectStore(STORE_NAMES.PRODUCTS, {
            keyPath: 'id'
          });
          productStore.createIndex('by-zone', 'zoneId');
          productStore.createIndex('by-category', 'category');
          productStore.createIndex('by-sku', 'sku');
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.ZONES)) {
          const zoneStore = db.createObjectStore(STORE_NAMES.ZONES, {
            keyPath: 'id'
          });
          zoneStore.createIndex('by-type', 'type');
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.SHOPPING_LISTS)) {
          const listStore = db.createObjectStore(STORE_NAMES.SHOPPING_LISTS, {
            keyPath: 'id'
          });
          listStore.createIndex('by-updated', 'updatedAt');
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.USER_PROFILE)) {
          db.createObjectStore(STORE_NAMES.USER_PROFILE, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.PREFERENCES)) {
          db.createObjectStore(STORE_NAMES.PREFERENCES, { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORE_NAMES.SYNC_QUEUE, {
            keyPath: 'id'
          });
          syncStore.createIndex('by-timestamp', 'timestamp');
          syncStore.createIndex('by-type', 'entityType');
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.ANALYTICS)) {
          const analyticsStore = db.createObjectStore(STORE_NAMES.ANALYTICS, {
            keyPath: 'id'
          });
          analyticsStore.createIndex('by-timestamp', 'timestamp');
          analyticsStore.createIndex('by-category', 'category');
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.CACHE)) {
          const cacheStore = db.createObjectStore(STORE_NAMES.CACHE, {
            keyPath: 'key'
          });
          cacheStore.createIndex('by-expires', 'expiresAt');
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.ROUTES)) {
          const routeStore = db.createObjectStore(STORE_NAMES.ROUTES, {
            keyPath: 'id'
          });
          routeStore.createIndex('by-created', 'createdAt');
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.BEACON_HISTORY)) {
          const beaconStore = db.createObjectStore(STORE_NAMES.BEACON_HISTORY, {
            keyPath: 'id'
          });
          beaconStore.createIndex('by-timestamp', 'timestamp');
          beaconStore.createIndex('by-zone', 'zoneId');
        }
      }
    });

    this.db = await this.initPromise;
    return this.db;
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }

  async getDB(): Promise<IDBPDatabase<StoreNavigatorDB>> {
    return this.initialize();
  }

  async clearStore(storeName: keyof StoreNavigatorDB): Promise<void> {
    const db = await this.getDB();
    await db.clear(storeName);
  }

  async getStorageUsage(): Promise<{ usage: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage ?? 0,
        quota: estimate.quota ?? 0
      };
    }
    return { usage: 0, quota: 0 };
  }

  async cleanup(): Promise<void> {
    const db = await this.getDB();
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const tx = db.transaction(STORE_NAMES.ANALYTICS, 'readwrite');
    const index = tx.store.index('by-timestamp');
    const oldEvents = await index.getAll(IDBKeyRange.upperBound(thirtyDaysAgo));
    for (const event of oldEvents) {
      await tx.store.delete(event.id);
    }
    await tx.done;

    const cacheTx = db.transaction(STORE_NAMES.CACHE, 'readwrite');
    const cacheIndex = cacheTx.store.index('by-expires');
    const expiredCache = await cacheIndex.getAll(IDBKeyRange.upperBound(now));
    for (const item of expiredCache) {
      await cacheTx.store.delete(item.key);
    }
    await cacheTx.done;

    const beaconTx = db.transaction(STORE_NAMES.BEACON_HISTORY, 'readwrite');
    const beaconIndex = beaconTx.store.index('by-timestamp');
    const oldBeacons = await beaconIndex.getAll(IDBKeyRange.upperBound(thirtyDaysAgo));
    for (const beacon of oldBeacons) {
      await beaconTx.store.delete(beacon.id);
    }
    await beaconTx.done;
  }
}

export const dbManager = new DatabaseManager();

export class ProductRepository {
  async getAll(): Promise<Product[]> {
    const db = await dbManager.getDB();
    return db.getAll(STORE_NAMES.PRODUCTS);
  }

  async getById(id: string): Promise<Product | undefined> {
    const db = await dbManager.getDB();
    return db.get(STORE_NAMES.PRODUCTS, id);
  }

  async getByZone(zoneId: string): Promise<Product[]> {
    const db = await dbManager.getDB();
    return db.getAllFromIndex(STORE_NAMES.PRODUCTS, 'by-zone', zoneId);
  }

  async getByCategory(category: string): Promise<Product[]> {
    const db = await dbManager.getDB();
    return db.getAllFromIndex(STORE_NAMES.PRODUCTS, 'by-category', category);
  }

  async getBySku(sku: string): Promise<Product | undefined> {
    const db = await dbManager.getDB();
    return db.getFromIndex(STORE_NAMES.PRODUCTS, 'by-sku', sku);
  }

  async search(query: string): Promise<Product[]> {
    const all = await this.getAll();
    const lowerQuery = query.toLowerCase();
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.brand.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery)
    );
  }

  async save(product: Product): Promise<void> {
    const db = await dbManager.getDB();
    await db.put(STORE_NAMES.PRODUCTS, product);
  }

  async saveMany(products: Product[]): Promise<void> {
    const db = await dbManager.getDB();
    const tx = db.transaction(STORE_NAMES.PRODUCTS, 'readwrite');
    for (const product of products) {
      await tx.store.put(product);
    }
    await tx.done;
  }

  async delete(id: string): Promise<void> {
    const db = await dbManager.getDB();
    await db.delete(STORE_NAMES.PRODUCTS, id);
  }
}

export class ZoneRepository {
  async getAll(): Promise<StoreZone[]> {
    const db = await dbManager.getDB();
    return db.getAll(STORE_NAMES.ZONES);
  }

  async getById(id: string): Promise<StoreZone | undefined> {
    const db = await dbManager.getDB();
    return db.get(STORE_NAMES.ZONES, id);
  }

  async getByType(type: string): Promise<StoreZone[]> {
    const db = await dbManager.getDB();
    return db.getAllFromIndex(STORE_NAMES.ZONES, 'by-type', type);
  }

  async save(zone: StoreZone): Promise<void> {
    const db = await dbManager.getDB();
    await db.put(STORE_NAMES.ZONES, zone);
  }

  async saveMany(zones: StoreZone[]): Promise<void> {
    const db = await dbManager.getDB();
    const tx = db.transaction(STORE_NAMES.ZONES, 'readwrite');
    for (const zone of zones) {
      await tx.store.put(zone);
    }
    await tx.done;
  }
}

export class ShoppingListRepository {
  async getAll(): Promise<ShoppingList[]> {
    const db = await dbManager.getDB();
    return db.getAllFromIndex(
      STORE_NAMES.SHOPPING_LISTS,
      'by-updated',
      null,
      'prev'
    );
  }

  async getById(id: string): Promise<ShoppingList | undefined> {
    const db = await dbManager.getDB();
    return db.get(STORE_NAMES.SHOPPING_LISTS, id);
  }

  async getDefault(): Promise<ShoppingList | undefined> {
    const all = await this.getAll();
    return all.find((l) => l.isDefault);
  }

  async save(list: ShoppingList): Promise<void> {
    const db = await dbManager.getDB();
    list.updatedAt = Date.now();
    await db.put(STORE_NAMES.SHOPPING_LISTS, list);
  }

  async delete(id: string): Promise<void> {
    const db = await dbManager.getDB();
    await db.delete(STORE_NAMES.SHOPPING_LISTS, id);
  }
}

export class UserRepository {
  async getProfile(): Promise<UserProfile | undefined> {
    const db = await dbManager.getDB();
    const all = await db.getAll(STORE_NAMES.USER_PROFILE);
    return all[0];
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    const db = await dbManager.getDB();
    await db.put(STORE_NAMES.USER_PROFILE, profile);
  }
}

export class SyncQueueRepository {
  async getAll(): Promise<SyncQueueItem[]> {
    const db = await dbManager.getDB();
    return db.getAllFromIndex(STORE_NAMES.SYNC_QUEUE, 'by-timestamp');
  }

  async enqueue(item: Omit<SyncQueueItem, 'id' | 'timestamp'>): Promise<void> {
    const db = await dbManager.getDB();
    const queueItem: SyncQueueItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now()
    };
    await db.put(STORE_NAMES.SYNC_QUEUE, queueItem);
  }

  async remove(id: string): Promise<void> {
    const db = await dbManager.getDB();
    await db.delete(STORE_NAMES.SYNC_QUEUE, id);
  }

  async clear(): Promise<void> {
    await dbManager.clearStore(STORE_NAMES.SYNC_QUEUE);
  }
}

export class CacheRepository {
  async get<T>(key: string): Promise<T | undefined> {
    const db = await dbManager.getDB();
    const item = await db.get(STORE_NAMES.CACHE, key);
    if (!item) return undefined;
    if (item.expiresAt < Date.now()) {
      await db.delete(STORE_NAMES.CACHE, key);
      return undefined;
    }
    return item.value as T;
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    const db = await dbManager.getDB();
    await db.put(STORE_NAMES.CACHE, {
      key,
      value,
      expiresAt: Date.now() + ttlMs
    });
  }

  async delete(key: string): Promise<void> {
    const db = await dbManager.getDB();
    await db.delete(STORE_NAMES.CACHE, key);
  }
}

export const productRepo = new ProductRepository();
export const zoneRepo = new ZoneRepository();
export const shoppingListRepo = new ShoppingListRepository();
export const userRepo = new UserRepository();
export const syncQueueRepo = new SyncQueueRepository();
export const cacheRepo = new CacheRepository();

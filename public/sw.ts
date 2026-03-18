/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope;

interface SyncEvent extends Event {
  tag: string;
  waitUntil(promise: Promise<unknown>): void;
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

interface NotificationData {
  body?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
  title?: string;
}

const CACHE_VERSION = 'v1';

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/offline.html'
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  void clientsClaim();
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_VERSION)
          .map((name) => caches.delete(name))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline.html').then(r => r || caches.match('/')).then(r => r!);
      })
    );
    return;
  }

  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then(r => r!);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((response) => {
      return (
        response ||
        fetch(request).then((fetchResponse) => {
          if (
            !fetchResponse ||
            fetchResponse.status !== 200 ||
            fetchResponse.type !== 'basic'
          ) {
            return fetchResponse;
          }
          const clone = fetchResponse.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(request, clone);
          });
          return fetchResponse;
        })
      );
    })
  );
});

self.addEventListener('sync', (event) => {
  const syncEvent = event as SyncEvent;
  if (syncEvent.tag === 'sync-shopping-list') {
    syncEvent.waitUntil(syncShoppingList());
  }
});

self.addEventListener('push', (event) => {
  const pushEvent = event as PushEvent;
  const data = pushEvent.data?.json() as NotificationData ?? {};
  const options: NotificationOptions = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction ?? false
  };

  if (data.actions && data.actions.length > 0) {
    (options as NotificationOptions & { actions: NotificationAction[] }).actions = data.actions;
  }

  pushEvent.waitUntil(
    self.registration.showNotification(
      data.title || 'Store Navigator',
      options
    )
  );
});

self.addEventListener('notificationclick', (event) => {
  const notificationEvent = event as NotificationEvent;
  notificationEvent.notification.close();
  notificationEvent.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      const client = clientList.find((c) => c.focused) || clientList[0];
      if (client) {
        client.navigate(notificationEvent.notification.data?.url || '/');
        client.focus();
      } else {
        self.clients.openWindow(notificationEvent.notification.data?.url || '/');
      }
    })
  );
});

async function syncShoppingList(): Promise<void> {
  const db = await openDB('store-navigator-db', 1);
  const tx = db.transaction('sync-queue', 'readonly');
  const store = tx.objectStore('sync-queue');
  const request = store.getAll();
  
  const items: Array<Record<string, unknown>> = await new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  const writeTx = db.transaction('sync-queue', 'readwrite');
  const writeStore = writeTx.objectStore('sync-queue');

  for (const item of items) {
    try {
      await fetch('/api/shopping-list/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      await new Promise<void>((resolve, reject) => {
        const deleteRequest = writeStore.delete(item.id as IDBValidKey);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });
    } catch {
      break;
    }
  }
}

function openDB(name: string, version: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('sync-queue')) {
        db.createObjectStore('sync-queue', { keyPath: 'id' });
      }
    };
  });
}

export {};

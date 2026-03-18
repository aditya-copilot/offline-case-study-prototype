import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  pendingActions: number;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [pendingActions, setPendingActions] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for pending actions in localStorage
    const checkPendingActions = () => {
      const pending = localStorage.getItem('pendingActions');
      if (pending) {
        setPendingActions(JSON.parse(pending).length);
      }
    };

    checkPendingActions();
    const interval = setInterval(checkPendingActions, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const triggerSync = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear pending actions after successful sync
      localStorage.removeItem('pendingActions');
      setPendingActions(0);
      setLastSyncedAt(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingActions > 0) {
      triggerSync();
    }
  }, [isOnline, pendingActions, triggerSync]);

  return {
    isOnline,
    isSyncing,
    lastSyncedAt,
    pendingActions
  };
}

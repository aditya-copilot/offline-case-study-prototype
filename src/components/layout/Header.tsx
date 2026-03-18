import { useState } from 'react';
import { Menu, MapPin, Bluetooth, Bell, Search, X, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useTheme, useBLE, useUI, useUIActions } from '@store';
import { useNetworkStatus } from '@hooks/useNetworkStatus';
import { cn } from '@core/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function Header() {
  const { isDark } = useTheme();
  const { isScanning, detectedBeacons } = useBLE();
  const { sidebarOpen, searchQuery } = useUI();
  const { toggleSidebar, setSearchQuery } = useUIActions();
  const { isOnline, isSyncing, pendingActions } = useNetworkStatus();

  const [showSearch, setShowSearch] = useState(false);

  const beaconCount = detectedBeacons.length;
  const strongestSignal = detectedBeacons[0]?.rssi ?? -100;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="lg:hidden"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          <div className="flex items-center gap-2">
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              'bg-gradient-to-br from-primary-500 to-accent-500'
            )}>
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg hidden sm:inline">
              StoreNav
            </span>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setShowSearch(!showSearch)}
            aria-label="Search"
          >
            {showSearch ? (
              <X className="h-5 w-5" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </Button>

          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm',
            'transition-colors duration-200',
            isScanning
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
              : 'bg-muted text-muted-foreground'
          )}>
            <Bluetooth className={cn(
              'w-4 h-4',
              isScanning && 'animate-pulse'
            )} />
            <span className="hidden sm:inline">
              {isScanning ? `${beaconCount} beacons` : 'BLE Ready'}
            </span>
            {isScanning && beaconCount > 0 && (
              <span className={cn(
                'w-2 h-2 rounded-full',
                strongestSignal > -65 ? 'bg-success' :
                strongestSignal > -80 ? 'bg-warning' : 'bg-error'
              )} />
            )}
          </div>

          <AnimatePresence>
            {!isOnline && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-destructive/10 text-destructive text-xs"
              >
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Offline</span>
              </motion.div>
            )}
            {isOnline && isSyncing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Syncing...</span>
              </motion.div>
            )}
            {isOnline && pendingActions > 0 && !isSyncing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-warning/10 text-warning text-xs"
              >
                <Wifi className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{pendingActions} pending</span>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
          </Button>

          <div className={cn(
            'w-8 h-8 rounded-full',
            'bg-gradient-to-br from-primary-400 to-accent-400',
            'flex items-center justify-center text-white font-medium text-sm'
          )}>
            JD
          </div>
        </div>
      </div>

      {showSearch && (
        <div className="md:hidden px-4 pb-3 border-t border-border">
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
}

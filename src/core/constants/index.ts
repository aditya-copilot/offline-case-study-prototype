export const APP_NAME = 'Offline Smart Store Navigator';
export const APP_SHORT_NAME = 'StoreNav';
export const APP_VERSION = '1.0.0';

export const DB_NAME = 'store-navigator-db';
export const DB_VERSION = 1;

export const STORE_NAMES = {
  PRODUCTS: 'products',
  ZONES: 'zones',
  SHOPPING_LISTS: 'shoppingLists',
  USER_PROFILE: 'userProfile',
  PREFERENCES: 'preferences',
  SYNC_QUEUE: 'syncQueue',
  ANALYTICS: 'analytics',
  CACHE: 'cache',
  ROUTES: 'routes',
  BEACON_HISTORY: 'beaconHistory'
} as const;

export const BLE_CONSTANTS = {
  SCAN_INTERVAL: 1000,
  SCAN_DURATION: 5000,
  SIGNAL_THRESHOLD: -85,
  RSSI_TO_DISTANCE_COEFFICIENT: 1.5,
  TX_POWER_AT_1M: -59,
  ENVIRONMENTAL_FACTOR: 2.0,
  MAX_BEACONS: 50,
  HISTORY_WINDOW_MS: 30000,
  SMOOTHING_FACTOR: 0.3
} as const;

export const NAVIGATION_CONSTANTS = {
  WAYPOINT_THRESHOLD: 2,
  ARRIVAL_THRESHOLD: 1.5,
  RE_ROUTE_THRESHOLD: 5,
  INSTRUCTION_LOOKAHEAD: 3,
  MIN_INSTRUCTION_DISTANCE: 3,
  MAX_ROUTE_TIME_MINUTES: 60
} as const;

export const GAMIFICATION_CONSTANTS = {
  XP_PER_PRODUCT_FOUND: 10,
  XP_PER_LIST_COMPLETED: 50,
  XP_PER_METER_WALKED: 0.01,
  XP_PER_ACHIEVEMENT: 100,
  LEVEL_BASE_XP: 100,
  LEVEL_MULTIPLIER: 1.5,
  STREAK_BONUS_MULTIPLIER: 0.1,
  MAX_STREAK_DAYS: 30
} as const;

export const THEME_COLORS = {
  light: {
    background: '#ffffff',
    foreground: '#0f172a',
    primary: '#3b82f6',
    secondary: '#64748b',
    accent: '#8b5cf6',
    muted: '#f1f5f9',
    border: '#e2e8f0'
  },
  dark: {
    background: '#0f172a',
    foreground: '#f8fafc',
    primary: '#60a5fa',
    secondary: '#94a3b8',
    accent: '#a78bfa',
    muted: '#1e293b',
    border: '#334155'
  }
} as const;

export const ZONE_COLORS: Record<import('../types').ZoneType, string> = {
  electronics: '#6366f1',
  grocery: '#10b981',
  clothing: '#f59e0b',
  home: '#ec4899',
  sports: '#3b82f6',
  pharmacy: '#ef4444',
  checkout: '#8b5cf6',
  entrance: '#14b8a6',
  exit: '#f97316'
};

export const ROUTES = {
  HOME: '/',
  MAP: '/map',
  VEHICLES: '/vehicles',
  SHOPPING_LIST: '/list',
  SCAN: '/scan',
  NAVIGATE: '/navigate',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  ACHIEVEMENTS: '/achievements',
  HELP: '/help',
  ABOUT: '/about'
} as const;

export const ANIMATION_DURATIONS = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 700
} as const;

export const STORAGE_KEYS = {
  THEME: 'sn:theme',
  USER: 'sn:user',
  PREFERENCES: 'sn:preferences',
  LAST_SYNC: 'sn:lastSync',
  SESSION_ID: 'sn:sessionId',
  ONBOARDING_COMPLETE: 'sn:onboarding'
} as const;

export const ERROR_MESSAGES = {
  NETWORK_OFFLINE: 'You appear to be offline. Some features may be limited.',
  BLE_NOT_SUPPORTED: 'Bluetooth is not supported on this device.',
  BLE_PERMISSION_DENIED: 'Please enable Bluetooth permissions to use location features.',
  STORAGE_FULL: 'Storage is full. Please clear some data and try again.',
  LOCATION_UNAVAILABLE: 'Unable to determine your location. Please check your settings.',
  PRODUCT_NOT_FOUND: 'Product not found.',
  INVALID_BARCODE: 'Invalid barcode. Please try again.',
  ROUTE_CALCULATION_FAILED: 'Unable to calculate route. Please try again.'
} as const;

export const BREAKPOINTS = {
  xs: 375,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1400
} as const;

export const DEFAULT_USER_PREFERENCES: import('../types').UserPreferences = {
  theme: {
    mode: 'system',
    isDark: false,
    primaryColor: '#3b82f6',
    accentColor: '#8b5cf6',
    fontScale: 1,
    reduceMotion: false,
    highContrast: false
  },
  notifications: true,
  soundEffects: true,
  hapticFeedback: true,
  autoOptimizeRoute: true,
  accessibility: {
    screenReader: false,
    largeText: false,
    highContrast: false,
    reduceMotion: false
  }
};

export const SYNC_INTERVALS = {
  ONLINE: 30000,
  OFFLINE: 300000,
  BACKGROUND: 600000
} as const;

export const CACHE_DURATIONS = {
  PRODUCTS: 86400000,
  ZONES: 86400000,
  ROUTES: 3600000,
  USER: 86400000
} as const;

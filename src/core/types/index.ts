export interface Coordinates {
  x: number;
  y: number;
  z?: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export type ZoneType =
  | 'electronics'
  | 'grocery'
  | 'clothing'
  | 'home'
  | 'sports'
  | 'pharmacy'
  | 'checkout'
  | 'entrance'
  | 'exit';

export interface StoreZone {
  id: string;
  name: string;
  type: ZoneType;
  color: string;
  bounds: BoundingBox;
  beaconIds: string[];
  products: Product[];
  metadata?: Record<string, unknown>;
}

export interface BeaconSignal {
  id: string;
  uuid: string;
  major: number;
  minor: number;
  rssi: number;
  txPower: number;
  distance: number;
  accuracy: 'high' | 'medium' | 'low';
  timestamp: number;
  zoneId?: string;
}

export interface UserLocation {
  coordinates: Coordinates;
  accuracy: number;
  zoneId?: string;
  timestamp: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  subcategory: string;
  brand: string;
  imageUrl: string;
  coordinates: Coordinates;
  zoneId: string;
  shelfLocation: string;
  inStock: boolean;
  stockCount: number;
  attributes: Record<string, string | number | boolean>;
  rating: number;
  reviewCount: number;
  isOnSale: boolean;
  discountPercentage?: number;
  complementaryProducts?: string[];
}

export interface ShoppingListItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  isChecked: boolean;
  addedAt: number;
  checkedAt?: number;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingListItem[];
  createdAt: number;
  updatedAt: number;
  isDefault: boolean;
  totalEstimatedCost: number;
  optimizedRoute?: NavigationRoute;
}

export interface NavigationRoute {
  id: string;
  waypoints: Coordinates[];
  estimatedTime: number;
  estimatedDistance: number;
  zones: string[];
  instructions: NavigationInstruction[];
  createdAt: number;
}

export interface NavigationInstruction {
  id: string;
  type: 'start' | 'turn' | 'straight' | 'arrival' | 'elevator' | 'escalator';
  text: string;
  distance: number;
  coordinates: Coordinates;
  nextCoordinates?: Coordinates;
  icon?: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppTheme {
  mode: ThemeMode;
  isDark: boolean;
  primaryColor: string;
  accentColor: string;
  fontScale: number;
  reduceMotion: boolean;
  highContrast: boolean;
}

export interface UserPreferences {
  theme: AppTheme;
  notifications: boolean;
  soundEffects: boolean;
  hapticFeedback: boolean;
  autoOptimizeRoute: boolean;
  defaultListId?: string;
  preferredStoreId?: string;
  accessibility: {
    screenReader: boolean;
    largeText: boolean;
    highContrast: boolean;
    reduceMotion: boolean;
  };
}

export interface UserProfile {
  id: string;
  anonymous: boolean;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  preferences: UserPreferences;
  gamification: UserGamification;
  createdAt: number;
  lastActiveAt: number;
}

export interface UserGamification {
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalDistanceWalked: number;
  productsFound: number;
  listsCompleted: number;
  achievements: Achievement[];
  badges: Badge[];
  streakDays: number;
  lastVisitDate?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: number;
  progress: number;
  maxProgress: number;
  reward: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: number;
}

export interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'shoppingList' | 'product' | 'preference';
  entityId: string;
  data: unknown;
  timestamp: number;
  retryCount: number;
}

export interface OfflineState {
  isOnline: boolean;
  lastSyncAt?: number;
  syncPending: boolean;
  pendingChanges: number;
  storageUsage: number;
  storageQuota: number;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  state: LoadingState;
  error: Error | null;
}

export type AppError =
  | { type: 'network'; message: string; retryable: boolean }
  | { type: 'storage'; message: string; retryable: boolean }
  | { type: 'ble'; message: string; retryable: boolean }
  | { type: 'validation'; message: string; retryable: false }
  | { type: 'unknown'; message: string; retryable: boolean };

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export type BottomSheetSize = 'sm' | 'md' | 'lg' | 'full';

export interface AnalyticsEvent {
  id: string;
  name: string;
  category: string;
  properties: Record<string, unknown>;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

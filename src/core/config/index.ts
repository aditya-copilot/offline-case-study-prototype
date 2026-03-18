import type { UserPreferences } from '../types';
import { DEFAULT_USER_PREFERENCES } from '../constants';

interface AppConfig {
  environment: 'development' | 'staging' | 'production';
  apiBaseUrl: string;
  wsBaseUrl: string;
  features: {
    ble: boolean;
    analytics: boolean;
    pushNotifications: boolean;
    backgroundSync: boolean;
    gamification: boolean;
    aiRecommendations: boolean;
  };
  limits: {
    maxShoppingListItems: number;
    maxSavedLists: number;
    maxRecentProducts: number;
    maxBeaconHistory: number;
    maxOfflineStorageMB: number;
  };
  defaults: {
    preferences: UserPreferences;
    mapZoom: number;
    searchDebounceMs: number;
    toastDurationMs: number;
  };
}

const config: AppConfig = {
  environment: (import.meta.env.VITE_APP_ENV as AppConfig['environment']) || 'development',
  apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  wsBaseUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws',
  features: {
    ble: import.meta.env.VITE_FEATURE_BLE !== 'false',
    analytics: import.meta.env.VITE_FEATURE_ANALYTICS !== 'false',
    pushNotifications: import.meta.env.VITE_FEATURE_PUSH === 'true',
    backgroundSync: import.meta.env.VITE_FEATURE_SYNC !== 'false',
    gamification: import.meta.env.VITE_FEATURE_GAMIFICATION !== 'false',
    aiRecommendations: import.meta.env.VITE_FEATURE_AI === 'true'
  },
  limits: {
    maxShoppingListItems: 100,
    maxSavedLists: 10,
    maxRecentProducts: 50,
    maxBeaconHistory: 1000,
    maxOfflineStorageMB: 100
  },
  defaults: {
    preferences: DEFAULT_USER_PREFERENCES,
    mapZoom: 1,
    searchDebounceMs: 300,
    toastDurationMs: 4000
  }
};

export const isDev = config.environment === 'development';
export const isProd = config.environment === 'production';
export const isStaging = config.environment === 'staging';

export const getConfig = (): AppConfig => config;

export const getFeatureFlag = (feature: keyof AppConfig['features']): boolean => {
  return config.features[feature];
};

export const getLimit = (limit: keyof AppConfig['limits']): number => {
  return config.limits[limit];
};

export const getDefault = <K extends keyof AppConfig['defaults']>(
  key: K
): AppConfig['defaults'][K] => {
  return config.defaults[key];
};

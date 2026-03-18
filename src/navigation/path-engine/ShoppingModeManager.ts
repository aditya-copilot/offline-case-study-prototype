import type { ShoppingMode, ModePreferences, RouteConstraint } from './types';

type ModeChangeListener = (mode: ShoppingMode, preferences: ModePreferences[ShoppingMode]) => void;

export class ShoppingModeManager {
  private currentMode: ShoppingMode = 'quick-buy';
  private preferences: ModePreferences;
  private listeners: Set<ModeChangeListener> = new Set();
  private modeHistory: Array<{ mode: ShoppingMode; timestamp: number }> = [];

  constructor(preferences: Partial<ModePreferences> = {}) {
    this.preferences = {
      'quick-buy': {
        prioritizeSpeed: true,
        avoidCrowds: true,
        maxDetourPercent: 20
      },
      'exploration': {
        enableDiscovery: true,
        showOffers: true,
        browseTimeMinutes: 15
      },
      'accessibility': {
        wheelchairAccessible: false,
        elevatorPreference: true,
        avoidStairs: true,
        widerPaths: true
      },
      'rush-hour': {
        congestionThreshold: 0.7,
        alternativeRouteThreshold: 1.3,
        timeBufferMinutes: 5
      },
      'treasure': {
        showHints: true,
        gamificationEnabled: true,
        collectibles: []
      },
      ...preferences
    };
  }

  setMode(mode: ShoppingMode): void {
    if (this.currentMode === mode) return;

    this.modeHistory.push({
      mode: this.currentMode,
      timestamp: Date.now()
    });

    this.currentMode = mode;
    this.notifyListeners();
  }

  getMode(): ShoppingMode {
    return this.currentMode;
  }

  getPreferences(): ModePreferences[ShoppingMode] {
    return this.preferences[this.currentMode];
  }

  updatePreferences(mode: ShoppingMode, prefs: Partial<ModePreferences[ShoppingMode]>): void {
    this.preferences[mode] = { ...this.preferences[mode], ...prefs };
    
    if (mode === this.currentMode) {
      this.notifyListeners();
    }
  }

  getConstraints(): RouteConstraint[] {
    const constraints: RouteConstraint[] = [];
    const prefs = this.preferences[this.currentMode];

    switch (this.currentMode) {
      case 'quick-buy':
        if (prefs.prioritizeSpeed) {
          constraints.push({
            type: 'max-time',
            value: 900,
            weight: 0.8
          });
        }
        if (prefs.avoidCrowds) {
          constraints.push({
            type: 'accessibility',
            value: 'avoid-congestion',
            weight: 0.6
          });
        }
        break;

      case 'accessibility':
        if (prefs.wheelchairAccessible || prefs.avoidStairs) {
          constraints.push({
            type: 'accessibility',
            value: 'wheelchair',
            weight: 1.0
          });
        }
        if (prefs.elevatorPreference) {
          constraints.push({
            type: 'prefer-zone',
            value: 'elevator',
            weight: 0.7
          });
        }
        break;

      case 'rush-hour':
        constraints.push({
          type: 'accessibility',
          value: 'avoid-congestion',
          weight: 0.9
        });
        break;
    }

    return constraints;
  }

  getAlgorithm(): 'astar' | 'dijkstra' {
    switch (this.currentMode) {
      case 'quick-buy':
      case 'rush-hour':
        return 'astar';
      case 'exploration':
      case 'treasure':
        return 'dijkstra';
      case 'accessibility':
        return 'dijkstra';
      default:
        return 'astar';
    }
  }

  getSpeedMultiplier(): number {
    switch (this.currentMode) {
      case 'quick-buy':
        return 1.3;
      case 'rush-hour':
        return 1.1;
      case 'accessibility':
        return 0.7;
      case 'exploration':
        return 0.5;
      case 'treasure':
        return 0.6;
      default:
        return 1.0;
    }
  }

  getRouteOptimizationStrategy(): 'nearest-neighbor' | 'two-opt' | 'three-opt' {
    switch (this.currentMode) {
      case 'quick-buy':
        return 'nearest-neighbor';
      case 'exploration':
      case 'treasure':
        return 'three-opt';
      default:
        return 'two-opt';
    }
  }

  shouldAvoidCongestion(): boolean {
    return this.currentMode === 'rush-hour' || 
           (this.currentMode === 'quick-buy' && this.preferences['quick-buy'].avoidCrowds);
  }

  shouldGroupByZone(): boolean {
    return this.currentMode === 'exploration' || this.currentMode === 'treasure';
  }

  getMaxDetourPercent(): number {
    return this.preferences['quick-buy'].maxDetourPercent || 20;
  }

  onModeChange(listener: ModeChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const prefs = this.preferences[this.currentMode];
    this.listeners.forEach(listener => listener(this.currentMode, prefs));
  }

  getModeDescription(): { title: string; description: string; icon: string } {
    const descriptions: Record<ShoppingMode, { title: string; description: string; icon: string }> = {
      'quick-buy': {
        title: 'Quick Buy',
        description: 'Fastest route to get your items and checkout',
        icon: 'zap'
      },
      'exploration': {
        title: 'Exploration',
        description: 'Take your time to browse and discover',
        icon: 'compass'
      },
      'accessibility': {
        title: 'Accessibility',
        description: 'Wheelchair-friendly paths with elevator access',
        icon: 'accessibility'
      },
      'rush-hour': {
        title: 'Rush Hour',
        description: 'Avoid crowds and busy areas',
        icon: 'users'
      },
      'treasure': {
        title: 'Treasure Hunt',
        description: 'Gamified shopping with discovery hints',
        icon: 'gem'
      }
    };

    return descriptions[this.currentMode];
  }

  getModeColor(): string {
    const colors: Record<ShoppingMode, string> = {
      'quick-buy': '#10b981',
      'exploration': '#f59e0b',
      'accessibility': '#3b82f6',
      'rush-hour': '#ef4444',
      'treasure': '#8b5cf6'
    };

    return colors[this.currentMode];
  }

  getModeHistory(): Array<{ mode: ShoppingMode; timestamp: number; duration?: number }> {
    const history = [...this.modeHistory];
    
    if (history.length === 0) return [];

    const result = history.map((entry, index) => {
      const nextEntry = history[index + 1];
      return {
        mode: entry.mode,
        timestamp: entry.timestamp,
        duration: nextEntry ? nextEntry.timestamp - entry.timestamp : undefined
      };
    });

    return result;
  }

  getAllModes(): ShoppingMode[] {
    return ['quick-buy', 'exploration', 'accessibility', 'rush-hour', 'treasure'];
  }

  reset(): void {
    this.currentMode = 'quick-buy';
    this.modeHistory = [];
    this.listeners.clear();
  }
}

import { useState, useCallback, useRef, useEffect } from 'react';
import { ShoppingModeManager } from '@navigation/path-engine';
import type { ShoppingMode, ModePreferences } from '@navigation/path-engine';

interface UseShoppingModeReturn {
  mode: ShoppingMode;
  preferences: ModePreferences[ShoppingMode];
  modeDescription: { title: string; description: string; icon: string };
  modeColor: string;
  availableModes: ShoppingMode[];
  
  setMode: (mode: ShoppingMode) => void;
  updatePreferences: (prefs: Partial<ModePreferences[ShoppingMode]>) => void;
  getConstraints: () => import('@navigation/path-engine').RouteConstraint[];
  getSpeedMultiplier: () => number;
  shouldAvoidCongestion: () => boolean;
  shouldGroupByZone: () => boolean;
}

export const useShoppingMode = (): UseShoppingModeReturn => {
  const managerRef = useRef<ShoppingModeManager | null>(null);
  
  const [mode, setModeState] = useState<ShoppingMode>('quick-buy');
  const [preferences, setPreferences] = useState<ModePreferences[ShoppingMode]>({
    prioritizeSpeed: true,
    avoidCrowds: true,
    maxDetourPercent: 20
  });

  useEffect(() => {
    managerRef.current = new ShoppingModeManager();
    
    const unsubscribe = managerRef.current.onModeChange((newMode, newPrefs) => {
      setModeState(newMode);
      setPreferences(newPrefs as ModePreferences[ShoppingMode]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const setMode = useCallback((newMode: ShoppingMode) => {
    managerRef.current?.setMode(newMode);
  }, []);

  const updatePreferences = useCallback((prefs: Partial<ModePreferences[ShoppingMode]>) => {
    managerRef.current?.updatePreferences(mode, prefs);
  }, [mode]);

  const getConstraints = useCallback(() => {
    return managerRef.current?.getConstraints() || [];
  }, []);

  const getSpeedMultiplier = useCallback(() => {
    return managerRef.current?.getSpeedMultiplier() || 1.0;
  }, []);

  const shouldAvoidCongestion = useCallback(() => {
    return managerRef.current?.shouldAvoidCongestion() || false;
  }, []);

  const shouldGroupByZone = useCallback(() => {
    return managerRef.current?.shouldGroupByZone() || false;
  }, []);

  const modeDescription = managerRef.current?.getModeDescription() || {
    title: 'Quick Buy',
    description: 'Fastest route to get your items',
    icon: 'zap'
  };

  const modeColor = managerRef.current?.getModeColor() || '#10b981';
  const availableModes = managerRef.current?.getAllModes() || [
    'quick-buy', 'exploration', 'accessibility', 'rush-hour', 'treasure'
  ];

  return {
    mode,
    preferences,
    modeDescription,
    modeColor,
    availableModes,
    setMode,
    updatePreferences,
    getConstraints,
    getSpeedMultiplier,
    shouldAvoidCongestion,
    shouldGroupByZone
  };
};

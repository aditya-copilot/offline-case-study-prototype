import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

export function useHaptic() {
  const vibrate = useCallback((type: HapticType) => {
    if (!navigator.vibrate) return;

    const patterns: Record<HapticType, number[]> = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      error: [30, 50, 30, 50, 30],
      warning: [20, 100, 20],
    };

    navigator.vibrate(patterns[type]);
  }, []);

  return { vibrate };
}

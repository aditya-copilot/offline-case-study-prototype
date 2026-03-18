import type { StateCreator } from 'zustand';
import type { AppTheme, ThemeMode } from '@core/types';
import { DEFAULT_USER_PREFERENCES } from '@core/constants';

export interface ThemeSlice {
  theme: AppTheme;
  setThemeMode: (mode: ThemeMode) => void;
  setPrimaryColor: (color: string) => void;
  setAccentColor: (color: string) => void;
  setFontScale: (scale: number) => void;
  toggleReduceMotion: () => void;
  toggleHighContrast: () => void;
  initializeTheme: () => void;
}

const getSystemTheme = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const applyTheme = (isDark: boolean): void => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  root.style.setProperty(
    '--background',
    isDark ? '222.2 84% 4.9%' : '0 0% 100%'
  );
  root.style.setProperty(
    '--foreground',
    isDark ? '210 40% 98%' : '222.2 84% 4.9%'
  );
  root.style.setProperty(
    '--card',
    isDark ? '222.2 84% 4.9%' : '0 0% 100%'
  );
  root.style.setProperty(
    '--card-foreground',
    isDark ? '210 40% 98%' : '222.2 84% 4.9%'
  );
  root.style.setProperty(
    '--popover',
    isDark ? '222.2 84% 4.9%' : '0 0% 100%'
  );
  root.style.setProperty(
    '--popover-foreground',
    isDark ? '210 40% 98%' : '222.2 84% 4.9%'
  );
  root.style.setProperty(
    '--primary',
    isDark ? '217.2 91.2% 59.8%' : '222.2 47.4% 11.2%'
  );
  root.style.setProperty(
    '--primary-foreground',
    isDark ? '222.2 47.4% 11.2%' : '210 40% 98%'
  );
  root.style.setProperty(
    '--secondary',
    isDark ? '217.2 32.6% 17.5%' : '210 40% 96.1%'
  );
  root.style.setProperty(
    '--secondary-foreground',
    isDark ? '210 40% 98%' : '222.2 47.4% 11.2%'
  );
  root.style.setProperty(
    '--muted',
    isDark ? '217.2 32.6% 17.5%' : '210 40% 96.1%'
  );
  root.style.setProperty(
    '--muted-foreground',
    isDark ? '215 20.2% 65.1%' : '215.4 16.3% 46.9%'
  );
  root.style.setProperty(
    '--accent',
    isDark ? '217.2 32.6% 17.5%' : '210 40% 96.1%'
  );
  root.style.setProperty(
    '--accent-foreground',
    isDark ? '210 40% 98%' : '222.2 47.4% 11.2%'
  );
  root.style.setProperty(
    '--destructive',
    isDark ? '0 62.8% 30.6%' : '0 84.2% 60.2%'
  );
  root.style.setProperty(
    '--destructive-foreground',
    isDark ? '210 40% 98%' : '210 40% 98%'
  );
  root.style.setProperty('--border', isDark ? '217.2 32.6% 17.5%' : '214.3 31.8% 91.4%');
  root.style.setProperty('--input', isDark ? '217.2 32.6% 17.5%' : '214.3 31.8% 91.4%');
  root.style.setProperty('--ring', isDark ? '212.7 26.8% 83.9%' : '222.2 84% 4.9%');
  root.style.setProperty('--radius', '0.5rem');
};

export const createThemeSlice: StateCreator<ThemeSlice> = (set, get) => ({
  theme: DEFAULT_USER_PREFERENCES.theme,

  setThemeMode: (mode) => {
    const isDark = mode === 'system' ? getSystemTheme() : mode === 'dark';

    set((state) => ({
      theme: {
        ...state.theme,
        mode,
        isDark
      }
    }));

    applyTheme(isDark);
  },

  setPrimaryColor: (color) => {
    set((state) => ({
      theme: {
        ...state.theme,
        primaryColor: color
      }
    }));
  },

  setAccentColor: (color) => {
    set((state) => ({
      theme: {
        ...state.theme,
        accentColor: color
      }
    }));
  },

  setFontScale: (scale) => {
    const clampedScale = Math.max(0.8, Math.min(1.5, scale));

    set((state) => ({
      theme: {
        ...state.theme,
        fontScale: clampedScale
      }
    }));

    if (typeof document !== 'undefined') {
      document.documentElement.style.fontSize = `${clampedScale * 100}%`;
    }
  },

  toggleReduceMotion: () => {
    set((state) => ({
      theme: {
        ...state.theme,
        reduceMotion: !state.theme.reduceMotion
      }
    }));
  },

  toggleHighContrast: () => {
    set((state) => ({
      theme: {
        ...state.theme,
        highContrast: !state.theme.highContrast
      }
    }));

    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('high-contrast');
    }
  },

  initializeTheme: () => {
    const { theme } = get();
    const isDark =
      theme.mode === 'system' ? getSystemTheme() : theme.mode === 'dark';

    set((state) => ({
      theme: {
        ...state.theme,
        isDark
      }
    }));

    applyTheme(isDark);

    if (typeof window !== 'undefined') {
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', (e) => {
          const { theme: currentTheme } = get();
          if (currentTheme.mode === 'system') {
            set((state) => ({
              theme: {
                ...state.theme,
                isDark: e.matches
              }
            }));
            applyTheme(e.matches);
          }
        });
    }
  }
});

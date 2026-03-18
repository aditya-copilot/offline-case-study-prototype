import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ThemeMode = 'light' | 'dark' | 'night' | 'accessibility' | 'gamified';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
  themeColors: Record<string, string>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themeColors: Record<ThemeMode, Record<string, string>> = {
  light: {
    background: '#ffffff',
    surface: '#f8fafc',
    surfaceElevated: '#ffffff',
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0',
    glass: 'rgba(255, 255, 255, 0.8)',
  },
  dark: {
    background: '#0f172a',
    surface: '#1e293b',
    surfaceElevated: '#334155',
    primary: '#60a5fa',
    secondary: '#a78bfa',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    border: '#334155',
    glass: 'rgba(30, 41, 59, 0.8)',
  },
  night: {
    background: '#020617',
    surface: '#0f172a',
    surfaceElevated: '#1e1b4b',
    primary: '#818cf8',
    secondary: '#c084fc',
    text: '#e0e7ff',
    textMuted: '#6366f1',
    border: '#1e1b4b',
    glass: 'rgba(15, 23, 42, 0.9)',
  },
  accessibility: {
    background: '#ffffff',
    surface: '#ffffff',
    surfaceElevated: '#f8fafc',
    primary: '#000000',
    secondary: '#1d4ed8',
    text: '#000000',
    textMuted: '#374151',
    border: '#000000',
    glass: '#ffffff',
  },
  gamified: {
    background: '#0f172a',
    surface: '#1e1b4b',
    surfaceElevated: '#312e81',
    primary: '#06b6d4',
    secondary: '#ec4899',
    text: '#ffffff',
    textMuted: '#a5b4fc',
    border: '#4c1d95',
    glass: 'rgba(49, 46, 129, 0.8)',
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('theme') as ThemeMode;
    if (saved && themeColors[saved]) {
      setThemeState(saved);
    }
  }, []);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const modes: ThemeMode[] = ['light', 'dark', 'night', 'gamified'];
    const currentIndex = modes.indexOf(theme);
    const nextTheme = modes[(currentIndex + 1) % modes.length];
    setTheme(nextTheme);
  }, [theme, setTheme]);

  const isDark = theme === 'dark' || theme === 'night' || theme === 'gamified';
  const colors = themeColors[theme];

  useEffect(() => {
    Object.entries(colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--color-${key}`, value);
    });
  }, [colors]);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark, themeColors: colors }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`theme-${theme} min-h-screen`}
        style={{
          backgroundColor: colors.background,
          color: colors.text,
        }}
      >
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </motion.div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

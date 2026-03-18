export const colorPalette = {
  brand: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  accent: {
    cyan: '#06b6d4',
    teal: '#14b8a6',
    emerald: '#10b981',
    lime: '#84cc16',
    amber: '#f59e0b',
    orange: '#f97316',
    rose: '#f43f5e',
    pink: '#ec4899',
    violet: '#8b5cf6',
    indigo: '#6366f1',
  },

  neutral: {
    0: '#ffffff',
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  success: {
    light: '#86efac',
    DEFAULT: '#22c55e',
    dark: '#15803d',
  },
  warning: {
    light: '#fde047',
    DEFAULT: '#eab308',
    dark: '#a16207',
  },
  error: {
    light: '#fca5a5',
    DEFAULT: '#ef4444',
    dark: '#b91c1c',
  },
  info: {
    light: '#93c5fd',
    DEFAULT: '#3b82f6',
    dark: '#1d4ed8',
  },

  gamification: {
    xp: '#fbbf24',
    points: '#f472b6',
    badge: '#a78bfa',
    streak: '#f97316',
    level: '#10b981',
    energy: '#06b6d4',
  },

  zones: {
    electronics: '#6366f1',
    grocery: '#10b981',
    clothing: '#f59e0b',
    home: '#ec4899',
    sports: '#3b82f6',
    pharmacy: '#ef4444',
    checkout: '#8b5cf6',
    entrance: '#14b8a6',
  },

  glass: {
    light: 'rgba(255, 255, 255, 0.1)',
    DEFAULT: 'rgba(255, 255, 255, 0.08)',
    dark: 'rgba(0, 0, 0, 0.2)',
    border: 'rgba(255, 255, 255, 0.1)',
  },

  gradients: {
    primary: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    success: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    dark: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    cosmic: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
    neon: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)',
  },
} as const;

export type ColorPalette = typeof colorPalette;

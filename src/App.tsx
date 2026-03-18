import { useEffect, useState, Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, MapPin } from 'lucide-react';

import { router } from './navigation';
import { initializeStore, useTheme } from '@store';
import { dbManager } from '@services/db';
import { cn } from '@core/utils';
import './styles/globals.css';

function AppInitializer({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await dbManager.initialize();
        await initializeStore();
        setIsReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize app');
      }
    };

    init();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-error/10 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-error" />
          </div>
          <h1 className="text-xl font-semibold">Initialization Error</h1>
          <p className="text-muted-foreground max-w-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          <div className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/30" />
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-white" />
          </div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-muted-foreground text-sm"
        >
          Loading Store Navigator...
        </motion.p>
      </div>
    );
  }

  return <>{children}</>;
}

function AppContent() {
  const { isDark } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div
      className={cn(
        'min-h-screen bg-background text-foreground antialiased',
        isDark ? 'dark' : ''
      )}
    >
      <RouterProvider router={router} />
    </div>
  );
}

export default function App() {
  return (
    <AppInitializer>
      <AppContent />
    </AppInitializer>
  );
}

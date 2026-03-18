import { useEffect, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { useTheme, useUI, useUIActions } from '@store';
import { cn } from '@core/utils';
import { FloatingAssistant } from '@assistant';

import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { CompareBar } from '../vehicles/CompareBar';
import { ToastContainer } from '../feedback/ToastContainer';
import { LoadingOverlay } from '../feedback/LoadingOverlay';

interface RootLayoutProps {
  children?: ReactNode;
}

export function RootLayout({ children }: RootLayoutProps) {
  const { isDark, reduceMotion } = useTheme();
  const { isLoading, loadingMessage, sidebarOpen } = useUI();
  const { setSidebarOpen } = useUIActions();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  return (
    <div
      className={cn(
        'min-h-screen-safe bg-background text-foreground',
        'transition-colors duration-300',
        isDark ? 'dark' : ''
      )}
    >
      <div className="flex h-screen-safe overflow-hidden">
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.aside
              initial={reduceMotion ? {} : { x: -280, opacity: 0 }}
              animate={reduceMotion ? {} : { x: 0, opacity: 1 }}
              exit={reduceMotion ? {} : { x: -280, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] }}
              className={cn(
                'fixed inset-y-0 left-0 z-40 w-[280px]',
                'bg-card border-r border-border',
                'lg:relative lg:block',
                'flex flex-col'
              )}
            >
              <Sidebar />
            </motion.aside>
          )}
        </AnimatePresence>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <Header />

          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="container mx-auto px-4 py-4 lg:py-6 max-w-7xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={reduceMotion ? {} : { opacity: 0, y: 10 }}
                  animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                  exit={reduceMotion ? {} : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {children ?? <Outlet />}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          <BottomNav />
        </div>
      </div>

      <CompareBar />

      <ToastContainer />

      {isLoading && <LoadingOverlay message={loadingMessage} />}

      <FloatingAssistant />
    </div>
  );
}

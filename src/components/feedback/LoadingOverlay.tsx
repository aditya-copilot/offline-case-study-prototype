import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

import { cn } from '@core/utils';

interface LoadingOverlayProps {
  message?: string;
  className?: string;
}

export function LoadingOverlay({ message, className }: LoadingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center',
        'bg-background/80 backdrop-blur-sm',
        className
      )}
    >
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-card shadow-xl">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/30" />
          <div className="relative w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        </div>
        {message && (
          <p className="text-sm text-muted-foreground font-medium">{message}</p>
        )}
      </div>
    </motion.div>
  );
}

import { motion } from 'framer-motion';
import { cn } from '@core/utils';

interface GlassSurfaceProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
  border?: boolean;
  glow?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

export function GlassSurface({
  children,
  className,
  intensity = 'medium',
  border = true,
  glow = false,
  hover = false,
}: GlassSurfaceProps) {
  const intensityStyles = {
    low: 'bg-white/5 backdrop-blur-sm',
    medium: 'bg-white/10 backdrop-blur-md',
    high: 'bg-white/20 backdrop-blur-xl',
  };

  return (
    <motion.div
      className={cn(
        'relative rounded-2xl',
        intensityStyles[intensity],
        border && 'border border-white/10',
        glow && 'shadow-glow',
        className
      )}
      whileHover={hover ? { scale: 1.02 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}

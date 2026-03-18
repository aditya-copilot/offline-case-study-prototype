import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUp, 
  CornerUpRight, 
  CornerUpLeft, 
  RotateCcw,
  MapPin,
  Flag
} from 'lucide-react';
import { cn } from '@core/utils';

interface DirectionIndicatorProps {
  type: 'start' | 'straight' | 'turn-left' | 'turn-right' | 'u-turn' | 'arrival';
  text: string;
  distance: number;
  className?: string;
  showAnimation?: boolean;
}

const directionIcons = {
  'start': MapPin,
  'straight': ArrowUp,
  'turn-left': CornerUpLeft,
  'turn-right': CornerUpRight,
  'u-turn': RotateCcw,
  'arrival': Flag
};

const directionColors = {
  'start': 'text-blue-400',
  'straight': 'text-green-400',
  'turn-left': 'text-yellow-400',
  'turn-right': 'text-orange-400',
  'u-turn': 'text-red-400',
  'arrival': 'text-purple-400'
};

export const DirectionIndicator: React.FC<DirectionIndicatorProps> = ({
  type,
  text,
  distance,
  className,
  showAnimation = true
}) => {
  const Icon = directionIcons[type];
  const colorClass = directionColors[type];

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${type}-${text}`}
        initial={showAnimation ? { opacity: 0, y: 20 } : false}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'bg-slate-900 border border-slate-800 rounded-2xl p-6',
          'flex items-center gap-6',
          className
        )}
      >
        <div className={cn(
          'w-20 h-20 rounded-full flex items-center justify-center',
          'bg-slate-800 border-2',
          colorClass.replace('text-', 'border-')
        )}>
          <motion.div
            animate={type === 'straight' ? {
              y: [0, -4, 0],
            } : {}}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Icon className={cn('w-10 h-10', colorClass)} />
          </motion.div>
        </div>

        <div className="flex-1">
          <motion.h3 
            className="text-xl font-semibold text-white mb-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {text}
          </motion.h3>
          <motion.p 
            className="text-slate-400 text-sm"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {formatDistance(distance)} remaining
          </motion.p>
        </div>

        <motion.div
          className={cn(
            'text-3xl font-bold',
            colorClass
          )}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: "spring" }}
        >
          {formatDistance(distance)}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

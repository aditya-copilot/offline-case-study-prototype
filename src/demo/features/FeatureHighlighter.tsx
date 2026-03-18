import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { KillerFeature } from '../types';
import { Sparkles, WifiOff, MapPin, Route, BarChart3, Trophy } from 'lucide-react';

const featureConfigs: Record<KillerFeature, { icon: React.ElementType; color: string }> = {
  'ai-intelligence': { icon: Sparkles, color: '#8b5cf6' },
  'offline-autonomy': { icon: WifiOff, color: '#10b981' },
  'ble-spatial': { icon: MapPin, color: '#3b82f6' },
  'smart-routing': { icon: Route, color: '#f59e0b' },
  'behavioral-analytics': { icon: BarChart3, color: '#ec4899' },
  'gamification': { icon: Trophy, color: '#f97316' }
};

interface FeatureHighlighterProps {
  feature: KillerFeature;
  isActive: boolean;
  onComplete?: () => void;
}

export function FeatureHighlighter({ feature, isActive, onComplete }: FeatureHighlighterProps) {
  const [showDetails, setShowDetails] = useState(false);
  const config = featureConfigs[feature];
  const Icon = config.icon;

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => setShowDetails(true), 500);
      const completeTimer = setTimeout(() => {
        setShowDetails(false);
        onComplete?.();
      }, 4000);
      return () => {
        clearTimeout(timer);
        clearTimeout(completeTimer);
      };
    }
  }, [isActive, onComplete]);

  return (
    <AnimatePresence>
      {isActive && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${config.color}20 0%, transparent 50%)`
            }}
          />
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-2 border-dashed"
                style={{ borderColor: config.color }}
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${config.color}30`, border: `2px solid ${config.color}` }}
              >
                <Icon className="w-12 h-12" style={{ color: config.color }} />
              </motion.div>
            </div>
            
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="absolute top-full mt-4 left-1/2 -translate-x-1/2 text-center"
                >
                  <h3 className="text-2xl font-bold text-white mb-2">{feature.replace('-', ' ').toUpperCase()}</h3>
                  <p className="text-slate-300 text-sm max-w-xs">Next-generation retail intelligence</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

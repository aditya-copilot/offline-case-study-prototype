import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface BrainPulseProps {
  isActive: boolean;
  cycleCount: number;
  intensity?: 'low' | 'medium' | 'high';
}

export function BrainPulse({ isActive, cycleCount, intensity = 'medium' }: BrainPulseProps) {
  const [pulses, setPulses] = useState<number[]>([]);

  useEffect(() => {
    if (isActive) {
      setPulses(prev => [...prev, Date.now()].slice(-5));
    }
  }, [cycleCount, isActive]);

  const colorIntensity = {
    low: 'rgba(59, 130, 246, 0.3)',
    medium: 'rgba(139, 92, 246, 0.5)',
    high: 'rgba(236, 72, 153, 0.7)'
  };

  const sizeIntensity = {
    low: 100,
    medium: 150,
    high: 200
  };

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <motion.div
        className="absolute rounded-full"
        style={{
          background: `radial-gradient(circle, ${colorIntensity[intensity]} 0%, transparent 70%)`,
          width: sizeIntensity[intensity],
          height: sizeIntensity[intensity]
        }}
        animate={{
          scale: isActive ? [1, 1.2, 1] : 1,
          opacity: isActive ? [0.5, 1, 0.5] : 0.3
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      
      {pulses.map((pulse) => (
        <motion.div
          key={pulse}
          className="absolute rounded-full border-2"
          style={{
            borderColor: colorIntensity[intensity],
            width: 60,
            height: 60
          }}
          initial={{ scale: 0.5, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 2, ease: 'easeOut' }}
          onAnimationComplete={() => {
            setPulses(prev => prev.filter(p => p !== pulse));
          }}
        />
      ))}

      <div className="relative z-10 text-center">
        <motion.div
          className="text-2xl font-bold text-white"
          animate={{ opacity: isActive ? [0.7, 1, 0.7] : 0.5 }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          {cycleCount}
        </motion.div>
        <div className="text-xs text-slate-400 uppercase tracking-wider">Cycles</div>
      </div>
    </div>
  );
}

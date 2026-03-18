import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

interface AIThinkingAnimationProps {
  progress?: number;
  message?: string;
}

export const AIThinkingAnimation: React.FC<AIThinkingAnimationProps> = ({
  progress = 0,
  message = 'Calculating optimal route...'
}) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <motion.div
          className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Brain className="w-8 h-8 text-indigo-400" />
        </motion.div>
        
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-indigo-500/30"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
        
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-purple-500/30"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut",
            delay: 0.3
          }}
        />
      </div>

      <div className="text-center space-y-2">
        <motion.p 
          className="text-indigo-300 font-medium"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {message}
        </motion.p>
        
        <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, progress)}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        
        <p className="text-slate-500 text-sm">{Math.round(progress)}%</p>
      </div>
    </div>
  );
};

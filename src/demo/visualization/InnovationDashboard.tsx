import { motion } from 'framer-motion';
import { Brain, Users, TrendingUp, Zap } from 'lucide-react';
import type { InnovationScore } from '../types';

interface InnovationDashboardProps {
  scores: InnovationScore;
}

export function InnovationDashboard({ scores }: InnovationDashboardProps) {
  const metrics = [
    { label: 'AI Intelligence', value: scores.intelligence, icon: Brain, color: '#8b5cf6' },
    { label: 'Engagement', value: scores.engagement, icon: Users, color: '#3b82f6' },
    { label: 'Efficiency', value: scores.efficiency, icon: TrendingUp, color: '#10b981' },
    { label: 'Overall', value: scores.overall, icon: Zap, color: '#f59e0b' }
  ];

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700">
      <h2 className="text-xl font-bold text-white mb-6">Innovation Score</h2>
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-800/50 rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${metric.color}20` }}
              >
                <metric.icon className="w-5 h-5" style={{ color: metric.color }} />
              </div>
              <span className="text-slate-400 text-sm">{metric.label}</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-white">{metric.value}</span>
              <span className="text-slate-500 text-sm mb-1">/100</span>
            </div>
            <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metric.value}%` }}
                transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                className="h-full rounded-full"
                style={{ backgroundColor: metric.color }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

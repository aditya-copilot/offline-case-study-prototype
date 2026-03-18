import { motion } from 'framer-motion';
import { Glasses, Cpu, Building2, Rocket } from 'lucide-react';
import type { WowFeature } from '../types';

const wowFeatures: WowFeature[] = [
  {
    id: 'ar-ready',
    title: 'AR Navigation Ready',
    description: 'Architecture designed for seamless AR glasses integration. Spatial anchors mapped to physical store layout.',
    icon: 'glasses',
    readiness: 'beta',
    impact: 'Transform shopping into immersive experience'
  },
  {
    id: 'edge-ai',
    title: 'Edge AI Intelligence',
    description: 'On-device ML models run inference locally. Zero latency, complete privacy, offline autonomy.',
    icon: 'cpu',
    readiness: 'ready',
    impact: 'Real-time intelligence without cloud dependency'
  },
  {
    id: 'smart-city',
    title: 'Smart City Integration',
    description: 'API-first architecture enables city-wide retail networks. Multi-store coordination and urban analytics.',
    icon: 'building',
    readiness: 'roadmap',
    impact: 'Scale from single store to entire cities'
  },
  {
    id: 'future-retail',
    title: 'Autonomous Retail 2.0',
    description: 'AI-driven store operations. Predictive inventory, dynamic pricing, personalized layouts.',
    icon: 'rocket',
    readiness: 'roadmap',
    impact: 'The future of retail automation'
  }
];

const readinessColors = {
  ready: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  beta: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  roadmap: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
};

const iconMap = {
  glasses: Glasses,
  cpu: Cpu,
  building: Building2,
  rocket: Rocket
};

export function WowFeatures() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white mb-4">Future Vision</h2>
      {wowFeatures.map((feature, index) => {
        const Icon = iconMap[feature.icon as keyof typeof iconMap];
        return (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${readinessColors[feature.readiness]}`}>
                    {feature.readiness}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mb-2">{feature.description}</p>
                <p className="text-indigo-400 text-xs">{feature.impact}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

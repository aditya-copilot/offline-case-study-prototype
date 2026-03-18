import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Sparkles } from 'lucide-react';
import { useDemo } from '../demo/hooks/useDemo';
import { InnovationDashboard } from '../demo/visualization/InnovationDashboard';
import { FeatureHighlighter } from '../demo/features/FeatureHighlighter';
import { WowFeatures } from '../demo/wow/WowFeatures';
import { GlassSurface } from '../design-system/components/GlassSurface';
import type { KillerFeature, DemoPhase } from '../demo/types';

const phases: { id: DemoPhase; title: string; subtitle: string }[] = [
  { id: 'intro', title: 'The Future of Retail', subtitle: 'Autonomous indoor navigation powered by AI' },
  { id: 'problem', title: 'The Challenge', subtitle: 'Shopping should be seamless, not stressful' },
  { id: 'solution', title: 'Our Solution', subtitle: 'AI-powered spatial intelligence for every shopper' },
  { id: 'demo', title: 'See It In Action', subtitle: 'Real-time navigation, recommendations, and engagement' },
  { id: 'tech', title: 'The Technology', subtitle: 'Offline-first, AI-driven, enterprise-ready' },
  { id: 'impact', title: 'Business Impact', subtitle: 'Measurable results for retailers worldwide' },
  { id: 'future', title: 'Vision', subtitle: 'AR-ready, Edge AI, Smart City integration' },
  { id: 'close', title: 'Join the Revolution', subtitle: 'The future of retail starts now' }
];

export const PitchLabPage: React.FC = () => {
  const { state, currentPhase, narrative, progress, isPlaying, startDemo, pauseDemo } = useDemo();
  const [activeFeature, setActiveFeature] = useState<KillerFeature | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const currentPhaseData = phases.find(p => p.id === currentPhase);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-indigo-500 border-t-transparent"
              />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Smart Store Navigator
              </h1>
              <p className="text-slate-400 mt-2">Next-Gen Retail Intelligence</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-8">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-indigo-400" />
            <div>
              <h1 className="text-2xl font-bold">Pitch Lab</h1>
              <p className="text-slate-400 text-sm">Startup Demo Center</p>
            </div>
          </div>
          <button
            onClick={() => isPlaying ? pauseDemo() : startDemo()}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            {isPlaying ? 'Pause Demo' : 'Start Demo'}
          </button>
        </header>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPhase}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-96 flex flex-col items-center justify-center text-center"
              >
                <h2 className="text-6xl font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  {currentPhaseData?.title}
                </h2>
                <p className="text-2xl text-slate-400">{currentPhaseData?.subtitle}</p>
              </motion.div>
            </AnimatePresence>

            <GlassSurface className="mt-8 p-4" intensity="low">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-400">Demo Progress</span>
                <span className="text-sm font-mono">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </GlassSurface>

            {narrative.length > 0 && (
              <GlassSurface className="mt-4 p-4" intensity="low">
                <h3 className="text-sm font-semibold text-slate-400 mb-3">Narrative</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {narrative.slice(-5).map((moment) => (
                    <div key={moment.id} className="flex items-start gap-3 text-sm">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${
                        moment.emotion === 'wow' ? 'bg-purple-400' :
                        moment.emotion === 'excitement' ? 'bg-yellow-400' :
                        'bg-blue-400'
                      }`} />
                      <div>
                        <span className="text-white font-medium">{moment.title}</span>
                        <p className="text-slate-500 text-xs">{moment.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassSurface>
            )}
          </div>

          <div className="col-span-4 space-y-6">
            <InnovationDashboard scores={state.scores} />
            <WowFeatures />
          </div>
        </div>
      </div>

      <FeatureHighlighter
        feature={activeFeature || 'ai-intelligence'}
        isActive={isPlaying}
        onComplete={() => setActiveFeature(null)}
      />
    </div>
  );
};

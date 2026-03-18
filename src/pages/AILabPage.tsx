import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Sparkles, 
  Target, 
  Zap, 
  TrendingUp, 
  Activity,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Lightbulb,
  ShoppingCart,
  MapPin,
  Clock
} from 'lucide-react';
import { AIOrchestrator } from '../ai/orchestrator/AIOrchestrator';
import { ExplainabilityPanel } from '../ai/explainability/ExplainabilityPanel';
import type { AIRecommendation, AIPersonality } from '../ai/types';
import type { Product } from '../core/types';

export const AILabPage: React.FC = () => {
  const [orchestrator] = useState(() => new AIOrchestrator({ personality: 'health' }));
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [selectedRec, setSelectedRec] = useState<AIRecommendation | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [personality, setPersonality] = useState<AIPersonality>('health');
  const [showPanel, setShowPanel] = useState(false);
  const [stats, setStats] = useState({
    totalRecs: 0,
    avgConfidence: 0,
    processingTime: 0
  });

  const productsRef = useRef<Product[]>([]);

  useEffect(() => {
    const loadProducts = async () => {
      const res = await fetch('/data/products.json');
      const data = await res.json();
      productsRef.current = data.products;
      await orchestrator.initialize(data.products);
    };
    loadProducts();
  }, [orchestrator]);

  useEffect(() => {
    const unsubscribe = orchestrator.subscribe('lab', (recs) => {
      setRecommendations(recs);
      setIsThinking(false);
      setStats({
        totalRecs: recs.length,
        avgConfidence: recs.reduce((sum, r) => sum + r.confidence, 0) / (recs.length || 1),
        processingTime: 150
      });
    });
    return unsubscribe;
  }, [orchestrator]);

  const handleSimulate = useCallback(async () => {
    setIsThinking(true);
    await orchestrator.updateContext(
      'cust-demo',
      'grocery',
      { x: 43, y: 14 },
      [
        { productId: 'prod-001', quantity: 1, isChecked: false },
        { productId: 'prod-002', quantity: 1, isChecked: true },
        { productId: 'prod-003', quantity: 1, isChecked: false }
      ]
    );
    orchestrator.recordBehavioralSignal({
      type: 'view',
      zoneId: 'grocery',
      productId: 'prod-001',
      intensity: 0.8
    });
  }, [orchestrator]);

  const handlePersonalityChange = (p: AIPersonality) => {
    setPersonality(p);
    orchestrator.setPersonality(p);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto p-6">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                AI Lab
              </h1>
              <p className="text-slate-400">Retail Intelligence Control Center</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-indigo-400" />
                <h2 className="font-semibold">Configuration</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Personality Mode</label>
                  <div className="grid grid-cols-1 gap-2">
                    {(['budget', 'health', 'premium', 'quick', 'explorer'] as AIPersonality[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => handlePersonalityChange(p)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                          personality === p
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h2 className="font-semibold">System Stats</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Recommendations</span>
                  <span className="font-mono text-white">{stats.totalRecs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Confidence</span>
                  <span className="font-mono text-emerald-400">
                    {(stats.avgConfidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Process Time</span>
                  <span className="font-mono text-white">{stats.processingTime}ms</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSimulate}
              disabled={isThinking}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isThinking ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                  AI Thinking...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Generate Recommendations
                </>
              )}
            </button>
          </div>

          <div className="col-span-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 min-h-[600px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  <h2 className="font-semibold">Recommendations</h2>
                </div>
                <span className="text-sm text-slate-400">
                  {recommendations.length} generated
                </span>
              </div>

              <AnimatePresence mode="popLayout">
                {recommendations.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 text-slate-500"
                  >
                    <Brain className="w-16 h-16 mb-4 opacity-30" />
                    <p>Click "Generate" to see AI recommendations</p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {recommendations.map((rec, index) => (
                      <motion.div
                        key={rec.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => {
                          setSelectedRec(rec);
                          setShowPanel(true);
                        }}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedRec?.id === rec.id
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                rec.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                                rec.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-slate-500/20 text-slate-400'
                              }`}>
                                {rec.priority}
                              </span>
                              <span className="text-xs text-slate-500 capitalize">{rec.type}</span>
                            </div>
                            <h3 className="font-medium text-white mb-1">{rec.title}</h3>
                            <p className="text-sm text-slate-400 line-clamp-2">{rec.description}</p>
                          </div>
                          <div className="ml-4 text-right">
                            <div className={`text-lg font-bold ${
                              rec.confidence >= 0.8 ? 'text-emerald-400' :
                              rec.confidence >= 0.6 ? 'text-yellow-400' :
                              'text-orange-400'
                            }`}>
                              {(rec.confidence * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-slate-500">confidence</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {rec.reasoning.primaryFactors[0]}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(rec.triggeredAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="col-span-3 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <h2 className="font-semibold">Active Context</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin className="w-4 h-4" />
                  <span>Zone: Grocery</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <ShoppingCart className="w-4 h-4" />
                  <span>3 items in list</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Zap className="w-4 h-4" />
                  <span>Personality: {personality}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h2 className="font-semibold mb-4">AI Status</h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Model: LocalAIReasoning
                </div>
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  Cache: Active
                </div>
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  Real-time: Enabled
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ExplainabilityPanel
        recommendation={selectedRec}
        isOpen={showPanel}
        onClose={() => setShowPanel(false)}
      />
    </div>
  );
};

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  X, 
  Lightbulb, 
  Target, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import type { AIRecommendation } from '../types';

interface ExplainabilityPanelProps {
  recommendation: AIRecommendation | null;
  isOpen: boolean;
  onClose: () => void;
  detailedExplanation?: string;
}

export const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({
  recommendation,
  isOpen,
  onClose,
  detailedExplanation
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reasoning' | 'evidence'>('overview');

  if (!recommendation) return null;

  const confidenceColor = recommendation.confidence >= 0.8 
    ? 'text-emerald-400' 
    : recommendation.confidence >= 0.6 
    ? 'text-yellow-400' 
    : 'text-orange-400';

  const confidenceBg = recommendation.confidence >= 0.8 
    ? 'bg-emerald-500/20' 
    : recommendation.confidence >= 0.6 
    ? 'bg-yellow-500/20' 
    : 'bg-orange-500/20';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 right-4 w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-white" />
                <h3 className="text-white font-semibold">AI Reasoning</h3>
              </div>
              <button onClick={onClose} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="flex gap-1 mb-4">
              {(['overview', 'reasoning', 'evidence'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg capitalize transition-colors ${
                    activeTab === tab
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className={`p-3 rounded-lg ${confidenceBg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300 text-sm">Confidence Score</span>
                    <span className={`text-lg font-bold ${confidenceColor}`}>
                      {(recommendation.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        recommendation.confidence >= 0.8 
                          ? 'bg-emerald-400' 
                          : recommendation.confidence >= 0.6 
                          ? 'bg-yellow-400' 
                          : 'bg-orange-400'
                      }`}
                      style={{ width: `${recommendation.confidence * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                  <Target className="w-5 h-5 text-indigo-400" />
                  <div>
                    <div className="text-xs text-slate-400">Recommendation Type</div>
                    <div className="text-white font-medium capitalize">{recommendation.type}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="text-xs text-slate-400">Generated</div>
                    <div className="text-white font-medium">
                      {new Date(recommendation.triggeredAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {detailedExplanation && (
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-yellow-400" />
                      <span className="text-slate-300 text-sm">Detailed Explanation</span>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">{detailedExplanation}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reasoning' && (
              <div className="space-y-3">
                <h4 className="text-slate-300 font-medium mb-3">Reasoning Chain</h4>
                {recommendation.reasoning.steps.map((step, index) => (
                  <div key={step.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </div>
                      {index < recommendation.reasoning.steps.length - 1 && (
                        <div className="w-0.5 h-full bg-slate-700 my-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="text-white text-sm font-medium">{step.description}</div>
                      <div className="text-slate-400 text-xs mt-1">{step.input as string}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className={`text-xs px-2 py-1 rounded ${
                          step.confidence >= 0.8 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {(step.confidence * 100).toFixed(0)}% confidence
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'evidence' && (
              <div className="space-y-3">
                <h4 className="text-slate-300 font-medium mb-3">Evidence & Factors</h4>
                
                <div className="space-y-2">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Primary Factors</div>
                  {recommendation.reasoning.primaryFactors.map((factor, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-slate-800 rounded">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-white text-sm">{factor}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 mt-4">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Supporting Evidence</div>
                  {recommendation.reasoning.evidence.map((evidence, index) => (
                    <div key={index} className="p-3 bg-slate-800 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-indigo-400 text-xs font-medium capitalize">
                          {evidence.type}
                        </span>
                        <span className="text-slate-500 text-xs">
                          Weight: {(evidence.weight * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm">{evidence.description}</p>
                    </div>
                  ))}
                </div>

                {recommendation.reasoning.evidence.length === 0 && (
                  <div className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <span className="text-slate-400 text-sm">No additional evidence recorded</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-950 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <TrendingUp className="w-4 h-4" />
              <span>AI-powered recommendation</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

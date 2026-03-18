import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Activity, 
  Signal, 
  GitBranch, 
  Zap,
  Radio
} from 'lucide-react';
import { useBrainEngine } from '@hooks/brain/useBrainEngine';
import { BrainPulse } from '@brain/visualization/BrainPulse';
import { GlassSurface } from '@design-system/components/GlassSurface';
import { platformRuntime } from '@platform/PlatformRuntime';

export const BrainLabPage: React.FC = () => {
  const { 
    sessionContext, 
    predictions, 
    health, 
    recentDecisions, 
    cycleCount, 
    isRunning 
  } = useBrainEngine();
  
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      platformRuntime.initialize('demo-user', { debugMode: true });
      setInitialized(true);
    }
  }, [initialized]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-indigo-400" />
          <div>
            <h1 className="text-3xl font-bold">Brain Lab</h1>
            <p className="text-slate-400">AI Intelligence Control Center</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3">
          <GlassSurface className="p-4" intensity="high">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h2 className="font-semibold">System Status</h2>
            </div>
            <BrainPulse isActive={isRunning} cycleCount={cycleCount} intensity="high" />
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Status</span>
                <span className={isRunning ? 'text-emerald-400' : 'text-red-400'}>
                  {isRunning ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Health</span>
                <span className="text-emerald-400">{health?.overallStatus.toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Confidence</span>
                <span className="text-blue-400">{((health?.signalConfidence || 0) * 100).toFixed(0)}%</span>
              </div>
            </div>
          </GlassSurface>
        </div>

        <div className="col-span-6">
          <GlassSurface className="p-4 h-96" intensity="medium">
            <div className="flex items-center gap-2 mb-4">
              <Signal className="w-5 h-5 text-blue-400" />
              <h2 className="font-semibold">Real-time Context</h2>
            </div>
            {sessionContext && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 p-3 rounded">
                    <div className="text-xs text-slate-500 mb-1">Current Zone</div>
                    <div className="text-lg font-mono">{sessionContext.location.currentZone?.id || 'Unknown'}</div>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded">
                    <div className="text-xs text-slate-500 mb-1">Position</div>
                    <div className="text-lg font-mono">
                      ({sessionContext.location.position.x.toFixed(1)}, {sessionContext.location.position.y.toFixed(1)})
                    </div>
                  </div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded">
                  <div className="text-xs text-slate-500 mb-2">Shopping Progress</div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${sessionContext.shopping.completionRate * 100}%` }}
                    />
                  </div>
                  <div className="text-right text-xs mt-1 text-slate-400">
                    {sessionContext.shopping.collected.length} / {sessionContext.shopping.list.length} items
                  </div>
                </div>
              </div>
            )}
          </GlassSurface>
        </div>

        <div className="col-span-3">
          <GlassSurface className="p-4" intensity="medium">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h2 className="font-semibold">Predictions</h2>
            </div>
            {predictions && (
              <div className="space-y-3">
                <div className="bg-slate-800/50 p-3 rounded">
                  <div className="text-xs text-slate-500">Abandonment Risk</div>
                  <div className={`text-lg font-bold ${
                    predictions.abandonmentRisk.level === 'high' ? 'text-red-400' : 
                    predictions.abandonmentRisk.level === 'medium' ? 'text-yellow-400' : 'text-emerald-400'
                  }`}>
                    {predictions.abandonmentRisk.level.toUpperCase()}
                  </div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded">
                  <div className="text-xs text-slate-500">Intent</div>
                  <div className="text-lg font-bold text-blue-400">
                    {predictions.intentEvolution.trend}
                  </div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded">
                  <div className="text-xs text-slate-500">Purchase Likelihood</div>
                  <div className="text-lg font-bold text-purple-400">
                    {(predictions.purchaseLikelihood.probability * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            )}
          </GlassSurface>
        </div>

        <div className="col-span-6">
          <GlassSurface className="p-4 h-64" intensity="low">
            <div className="flex items-center gap-2 mb-4">
              <GitBranch className="w-5 h-5 text-purple-400" />
              <h2 className="font-semibold">Recent Decisions</h2>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentDecisions.map((decision) => (
                <motion.div
                  key={decision.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-slate-800/50 p-3 rounded flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-medium">{decision.type}</div>
                    <div className="text-xs text-slate-400">{decision.reason}</div>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    decision.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                    decision.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {decision.priority}
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassSurface>
        </div>

        <div className="col-span-6">
          <GlassSurface className="p-4 h-64" intensity="low">
            <div className="flex items-center gap-2 mb-4">
              <Radio className="w-5 h-5 text-cyan-400" />
              <h2 className="font-semibold">Module Health</h2>
            </div>
            {health && (
              <div className="space-y-2">
                {Array.from(health.modules.entries()).map(([name, module]) => (
                  <div key={name} className="bg-slate-800/50 p-3 rounded flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        module.status === 'online' ? 'bg-emerald-400' :
                        module.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
                      }`} />
                      <span className="text-sm">{name}</span>
                    </div>
                    <span className="text-xs text-slate-400">{module.latency}ms</span>
                  </div>
                ))}
              </div>
            )}
          </GlassSurface>
        </div>
      </div>
    </div>
  );
};

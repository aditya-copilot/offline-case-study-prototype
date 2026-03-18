import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  MapPin,
  Footprints,
  Settings,
  Activity,
  Navigation,
  Zap
} from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/Card';
import type { NoiseModel } from '@ble/types';
import { cn } from '@core/utils';

interface DemoControlPanelProps {
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSetPosition: (x: number, y: number) => void;
  onSetSpeed: (speed: number) => void;
  onSetNoiseModel: (model: NoiseModel) => void;
  onSetNoiseAmplitude: (amplitude: number) => void;
  onSetWalkPath: (pathType: string) => void;
  currentSpeed: number;
  currentNoiseModel: NoiseModel;
  currentNoiseAmplitude: number;
}

type PathType = 'random' | 'perimeter' | 'figure8' | 'spiral' | 'zone-tour';

export function DemoControlPanel({
  isRunning,
  onStart,
  onStop,
  onReset,
  onSetPosition,
  onSetSpeed,
  onSetNoiseModel,
  onSetNoiseAmplitude,
  onSetWalkPath,
  currentSpeed,
  currentNoiseModel,
  currentNoiseAmplitude
}: DemoControlPanelProps) {
  const [activeTab, setActiveTab] = useState<'movement' | 'signal' | 'position'>('movement');
  const [selectedPath, setSelectedPath] = useState<PathType>('random');

  const noiseModels: { value: NoiseModel; label: string; description: string }[] = [
    { value: 'gaussian', label: 'Gaussian', description: 'Random white noise' },
    { value: 'random-walk', label: 'Random Walk', description: 'Continuous drift' },
    { value: 'interference', label: 'Interference', description: 'Burst noise events' },
    { value: 'multipath', label: 'Multipath', description: 'Signal reflections' }
  ];

  const pathTypes: { value: PathType; label: string; icon: typeof Play }[] = [
    { value: 'random', label: 'Random Walk', icon: Footprints },
    { value: 'perimeter', label: 'Perimeter', icon: Navigation },
    { value: 'figure8', label: 'Figure 8', icon: Activity },
    { value: 'spiral', label: 'Spiral', icon: Zap },
    { value: 'zone-tour', label: 'Zone Tour', icon: MapPin }
  ];

  const presetPositions = [
    { x: 50, y: 75, label: 'Entrance' },
    { x: 12, y: 10, label: 'Electronics' },
    { x: 55, y: 25, label: 'Grocery' },
    { x: 88, y: 35, label: 'Clothing' },
    { x: 80, y: 52, label: 'Pharmacy' },
    { x: 45, y: 68, label: 'Checkout' }
  ];

  const handlePathSelect = (pathType: PathType) => {
    setSelectedPath(pathType);
    onSetWalkPath(pathType);
  };

  return (
    <Card className="bg-slate-950 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2 text-slate-200">
            <Settings className="w-4 h-4" />
            Demo Control Panel
          </CardTitle>
          <div className="flex items-center gap-1">
            {(['movement', 'signal', 'position'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-2 py-1 text-xs rounded-md transition-colors capitalize',
                  activeTab === tab
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-slate-500 hover:text-slate-300'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <Button
              size="sm"
              onClick={onStart}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Play className="w-4 h-4 mr-1" />
              Start Simulation
            </Button>
          ) : (
            <Button
              size="sm"
              variant="destructive"
              onClick={onStop}
              className="flex-1"
            >
              <Pause className="w-4 h-4 mr-1" />
              Pause
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={onReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'movement' && (
            <motion.div
              key="movement"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Walk Path</label>
                <div className="grid grid-cols-2 gap-2">
                  {pathTypes.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => handlePathSelect(value)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all',
                        selectedPath === value
                          ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-2 block">
                  Walk Speed: {currentSpeed.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={currentSpeed}
                  onChange={(e) => onSetSpeed(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Slow</span>
                  <span>Fast</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'signal' && (
            <motion.div
              key="signal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Noise Model</label>
                <div className="space-y-1">
                  {noiseModels.map(({ value, label, description }) => (
                    <button
                      key={value}
                      onClick={() => onSetNoiseModel(value)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all text-left',
                        currentNoiseModel === value
                          ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700'
                      )}
                    >
                      <span className="font-medium">{label}</span>
                      <span className="text-[10px] opacity-70">{description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-2 block">
                  Noise Amplitude: {currentNoiseAmplitude.toFixed(1)} dB
                </label>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={currentNoiseAmplitude}
                  onChange={(e) => onSetNoiseAmplitude(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Clean</span>
                  <span>Noisy</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'position' && (
            <motion.div
              key="position"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Quick Position</label>
                <div className="grid grid-cols-2 gap-2">
                  {presetPositions.map((pos) => (
                    <button
                      key={pos.label}
                      onClick={() => onSetPosition(pos.x, pos.y)}
                      className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400 hover:border-slate-700 hover:text-slate-300 transition-all text-left"
                    >
                      <div className="font-medium">{pos.label}</div>
                      <div className="text-[10px] opacity-60 font-mono">
                        ({pos.x}, {pos.y})
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

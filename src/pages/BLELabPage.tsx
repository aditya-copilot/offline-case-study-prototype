import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi,
  Activity,
  MapPin,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Signal,
  Target,
  Radio,
  Scan,
  Layers,
  BarChart3,
  Settings2,
  Info,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

import type { BeaconConfig, FilteredSignal, SignalStatistics, NoiseModel, PositionEstimate } from '@ble/types';
import { useBLEScanner, useZoneEstimator } from '@hooks/ble';
import {
  SignalChart,
  BeaconHeatmap,
  ZoneConfidenceBars,
  SignalMetrics,
  RSSITimeline,
  SignalInstabilityIndicator,
  BeaconSignalStrength,
  DemoControlPanel
} from '@components/ble';
import { Button } from '@components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/Card';
import { cn } from '@core/utils';
import { useUIActions } from '@store/index';
import { PositionEstimator } from '@ble/triangulation/PositionEstimator';

import beaconDataUrl from '/config/beacons.json?url';

export function BLELabPage() {
  const { addToast } = useUIActions();
  const [beaconConfigs, setBeaconConfigs] = useState<BeaconConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBeacon, setSelectedBeacon] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'signals' | 'position' | 'settings'>('overview');
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<PositionEstimate | null>(null);
  const [simulationSpeed, setSimulationSpeed] = useState(1.5);
  const [noiseModel, setNoiseModel] = useState<NoiseModel>('gaussian');
  const [noiseAmplitude, setNoiseAmplitude] = useState(3);

  useEffect(() => {
    const loadBeaconData = async () => {
      try {
        const response = await fetch(beaconDataUrl);
        const data = await response.json();
        const configs = data.beacons as BeaconConfig[];
        setBeaconConfigs(configs);
        setIsLoading(false);

        addToast({
          type: 'success',
          title: 'BLE Lab Initialized',
          message: `Loaded ${configs.length} beacon configurations across 8 zones`
        });
      } catch (error) {
        setIsLoading(false);
        addToast({
          type: 'error',
          title: 'Failed to load beacon data',
          message: 'Using default configuration'
        });
      }
    };
    
    loadBeaconData();
  }, [addToast]);

  const [zoneBeaconMapping, setZoneBeaconMapping] = useState<Record<string, string[]>>({});
  
  useEffect(() => {
    const loadZoneMapping = async () => {
      try {
        const response = await fetch(beaconDataUrl);
        const data = await response.json();
        setZoneBeaconMapping(data.zoneBeaconMapping as Record<string, string[]>);
      } catch (error) {
        setZoneBeaconMapping({});
      }
    };
    
    loadZoneMapping();
  }, []);

  const zoneColors = useMemo(() => {
    const colors = new Map<string, string>();
    colors.set('electronics', '#6366f1');
    colors.set('grocery', '#10b981');
    colors.set('clothing', '#f59e0b');
    colors.set('home', '#ec4899');
    colors.set('sports', '#3b82f6');
    colors.set('pharmacy', '#ef4444');
    colors.set('checkout', '#8b5cf6');
    colors.set('entrance', '#14b8a6');
    return colors;
  }, []);

  const beaconColors = useMemo(() => {
    const colors = new Map<string, string>();
    beaconConfigs.forEach(config => {
      colors.set(config.id, zoneColors.get(config.zoneId) || '#3b82f6');
    });
    return colors;
  }, [beaconConfigs, zoneColors]);

  const beaconNames = useMemo(() => {
    const names = new Map<string, string>();
    beaconConfigs.forEach(config => {
      names.set(config.id, config.name);
    });
    return names;
  }, [beaconConfigs]);

  const positionEstimator = useMemo(() => {
    return new PositionEstimator(beaconConfigs);
  }, [beaconConfigs]);

  const {
    isScanning,
    status,
    signals,
    discoveredBeacons,
    error,
    start,
    stop,
    reset
  } = useBLEScanner({
    beaconConfigs,
    simulationMode: true,
    scanConfig: {
      scanInterval: 100,
      noiseModel,
      noiseAmplitude
    }
  });

  const {
    currentZone,
    zoneEstimate,
    allEstimates,
    dwellTime,
    isInTransition,
    updateSignals
  } = useZoneEstimator({
    beaconConfigs,
    zoneBeaconMapping,
    confidenceThreshold: 0.6
  });

  useEffect(() => {
    signals.forEach(signal => {
      updateSignals([signal]);
    });

    const position = positionEstimator.estimatePosition(signals);
    if (position) {
      setCurrentPosition(position);
    }
  }, [signals, updateSignals, positionEstimator]);

  const stats: SignalStatistics = useMemo(() => {
    if (signals.length === 0) {
      return {
        mean: 0,
        variance: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        samples: 0
      };
    }

    const values = signals.map(s => s.filteredRSSI);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

    return {
      mean: Math.round(mean * 10) / 10,
      variance: Math.round(variance * 10) / 10,
      stdDev: Math.round(Math.sqrt(variance) * 10) / 10,
      min: Math.min(...values),
      max: Math.max(...values),
      samples: signals.length
    };
  }, [signals]);

  const scanRate = useMemo(() => {
    return isScanning ? Math.round(signals.length / 5) : 0;
  }, [isScanning, signals.length]);

  const handleSetSpeed = useCallback((speed: number) => {
    setSimulationSpeed(speed);
    addToast({
      type: 'info',
      title: 'Simulation Updated',
      message: `Walk speed set to ${speed.toFixed(1)}x`
    });
  }, [addToast]);

  const handleSetNoiseModel = useCallback((model: NoiseModel) => {
    setNoiseModel(model);
    addToast({
      type: 'info',
      title: 'Noise Model Changed',
      message: `Now using ${model} noise model`
    });
  }, [addToast]);

  const handleSetNoiseAmplitude = useCallback((amplitude: number) => {
    setNoiseAmplitude(amplitude);
  }, []);

  const handleSetPosition = useCallback((x: number, y: number) => {
    addToast({
      type: 'info',
      title: 'Position Updated',
      message: `Teleported to (${x}, ${y})`
    });
  }, [addToast]);

  const handleSetWalkPath = useCallback((pathType: string) => {
    addToast({
      type: 'info',
      title: 'Path Changed',
      message: `Active path: ${pathType}`
    });
  }, [addToast]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-slate-400">Initializing BLE Detection Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Radio className="w-6 h-6 text-white" />
                {isScanning && (
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-white/50"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  BLE Signal Lab
                </h1>
                <p className="text-sm text-slate-500">
                  Indoor Positioning Research Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  isScanning ? 'bg-green-500 animate-pulse' : 'bg-slate-600'
                )} />
                <span className="text-sm text-slate-400">
                  {isScanning ? 'Scanning Active' : 'Standby'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {!isScanning ? (
                  <Button onClick={start} className="bg-green-600 hover:bg-green-700">
                    <Play className="w-4 h-4 mr-2" />
                    Start Scan
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={stop}>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                )}
                <Button variant="outline" size="icon" onClick={reset}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 mt-4">
            {(['overview', 'signals', 'position', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-all capitalize',
                  activeTab === tab
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-4 space-y-6">
                  <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2 text-slate-300">
                        <Target className="w-4 h-4 text-blue-400" />
                        Zone Detection
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ZoneConfidenceBars
                        estimates={allEstimates}
                        currentZone={currentZone}
                        zoneColors={zoneColors}
                      />
                    </CardContent>
                  </Card>

                  <DemoControlPanel
                    isRunning={isScanning}
                    onStart={start}
                    onStop={stop}
                    onReset={reset}
                    onSetPosition={handleSetPosition}
                    onSetSpeed={handleSetSpeed}
                    onSetNoiseModel={handleSetNoiseModel}
                    onSetNoiseAmplitude={handleSetNoiseAmplitude}
                    onSetWalkPath={handleSetWalkPath}
                    currentSpeed={simulationSpeed}
                    currentNoiseModel={noiseModel}
                    currentNoiseAmplitude={noiseAmplitude}
                  />

                  <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2 text-slate-300">
                        <Activity className="w-4 h-4 text-purple-400" />
                        Signal Instability
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SignalInstabilityIndicator
                        signals={signals}
                        beaconColors={beaconColors}
                      />
                    </CardContent>
                  </Card>
                </div>

                <div className="col-span-12 lg:col-span-8 space-y-6">
                  <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2 text-slate-300">
                        <Scan className="w-4 h-4 text-green-400" />
                        Real-time RSSI Stream
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SignalChart
                        signals={signals}
                        beaconColors={beaconColors}
                        height={300}
                      />
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-6">
                    <Card className="bg-slate-900 border-slate-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2 text-slate-300">
                          <MapPin className="w-4 h-4 text-yellow-400" />
                          Beacon Heatmap
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <BeaconHeatmap
                          beacons={beaconConfigs}
                          signals={signals}
                          width={400}
                          height={280}
                        />
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-900 border-slate-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2 text-slate-300">
                          <Signal className="w-4 h-4 text-pink-400" />
                          Signal Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <SignalMetrics
                          stats={stats}
                          beaconCount={discoveredBeacons.length}
                          scanRate={scanRate}
                        />
                        <BeaconSignalStrength
                          signals={signals}
                          beaconColors={beaconColors}
                          beaconNames={beaconNames}
                          maxBeacons={5}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'signals' && (
            <motion.div
              key="signals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-12 gap-6"
            >
              <div className="col-span-12 lg:col-span-8">
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-slate-300">
                      <Layers className="w-4 h-4 text-blue-400" />
                      RSSI Event Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RSSITimeline
                      signals={signals}
                      beaconColors={beaconColors}
                      maxHistory={100}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="col-span-12 lg:col-span-4 space-y-6">
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-slate-300">Active Beacons</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {discoveredBeacons.map((beaconId) => {
                        const config = beaconConfigs.find(b => b.id === beaconId);
                        const signal = signals.find(s => s.beaconId === beaconId);
                        const color = zoneColors.get(config?.zoneId || '') || '#3b82f6';

                        return (
                          <button
                            key={beaconId}
                            onClick={() => setSelectedBeacon(beaconId)}
                            className={cn(
                              'w-full p-3 rounded-lg text-left transition-all border',
                              selectedBeacon === beaconId
                                ? 'bg-slate-800 border-blue-500/50'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full animate-pulse"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-sm font-medium text-slate-300">
                                  {config?.name || beaconId}
                                </span>
                              </div>
                              <span className="text-xs font-mono text-slate-400">
                                {signal?.filteredRSSI.toFixed(0)}dBm
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {selectedBeacon && (
                  <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-slate-300">Beacon Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      {(() => {
                        const config = beaconConfigs.find(b => b.id === selectedBeacon);
                        const signal = signals.find(s => s.beaconId === selectedBeacon);
                        if (!config) return null;

                        return (
                          <>
                            <div className="flex justify-between">
                              <span className="text-slate-500">ID:</span>
                              <span className="font-mono text-slate-300">{config.id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Zone:</span>
                              <span className="capitalize text-slate-300">{config.zoneId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Position:</span>
                              <span className="font-mono text-slate-300">
                                ({config.position.x}, {config.position.y})
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">TX Power:</span>
                              <span className="text-slate-300">{config.txPower}dBm</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Battery:</span>
                              <span className="text-slate-300">{config.batteryLevel}%</span>
                            </div>
                            {signal && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">RSSI:</span>
                                  <span className="font-mono text-slate-300">{signal.filteredRSSI}dBm</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Confidence:</span>
                                  <span className="text-slate-300">{Math.round(signal.confidence * 100)}%</span>
                                </div>
                              </>
                            )}
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'position' && (
            <motion.div
              key="position"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-4">
                  <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-slate-300">Position Estimate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {currentPosition ? (
                        <div className="space-y-4">
                          <div className="text-center py-6">
                            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500/50 mb-4">
                              <MapPin className="w-10 h-10 text-blue-400" />
                            </div>
                            <div className="text-2xl font-mono font-bold text-white">
                              ({currentPosition.x.toFixed(1)}, {currentPosition.y.toFixed(1)})
                            </div>
                            <div className="text-sm text-slate-500 mt-1">
                              Method: {currentPosition.method}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                              <div className="text-xs text-slate-500">Accuracy</div>
                              <div className="text-lg font-mono text-slate-300">
                                {currentPosition.accuracy.toFixed(1)}m
                              </div>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                              <div className="text-xs text-slate-500">Confidence</div>
                              <div className="text-lg font-mono text-slate-300">
                                {Math.round(currentPosition.confidence * 100)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500">
                          No position data available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="col-span-12 lg:col-span-8">
                  <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-slate-300">Position Visualization</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BeaconHeatmap
                        beacons={beaconConfigs}
                        signals={signals}
                        width={700}
                        height={400}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-12 gap-6"
            >
              <div className="col-span-12 lg:col-span-6">
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-slate-300">System Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Beacons</span>
                      <span className="text-slate-300">{beaconConfigs.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Active Zones</span>
                      <span className="text-slate-300">{Object.keys(zoneBeaconMapping).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Scan Status</span>
                      <span className={isScanning ? 'text-green-400' : 'text-slate-500'}>
                        {isScanning ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Simulation Mode</span>
                      <span className="text-green-400">Enabled</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

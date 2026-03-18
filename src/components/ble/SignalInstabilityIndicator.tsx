import { motion } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import type { FilteredSignal } from '@ble/types';

interface SignalInstabilityIndicatorProps {
  signals: FilteredSignal[];
  beaconColors: Map<string, string>;
  className?: string;
}

interface InstabilityMetrics {
  variance: number;
  volatility: number;
  trend: 'stable' | 'fluctuating' | 'degrading' | 'improving';
  severity: 'low' | 'medium' | 'high';
}

export function SignalInstabilityIndicator({
  signals,
  beaconColors,
  className
}: SignalInstabilityIndicatorProps) {
  const [metrics, setMetrics] = useState<Map<string, InstabilityMetrics>>(new Map());

  useEffect(() => {
    const newMetrics = new Map<string, InstabilityMetrics>();
    const beaconSignals = new Map<string, FilteredSignal[]>();

    signals.forEach(signal => {
      const existing = beaconSignals.get(signal.beaconId) || [];
      existing.push(signal);
      beaconSignals.set(signal.beaconId, existing.slice(-20));
    });

    beaconSignals.forEach((history, beaconId) => {
      if (history.length < 3) {
        newMetrics.set(beaconId, {
          variance: 0,
          volatility: 0,
          trend: 'stable',
          severity: 'low'
        });
        return;
      }

      const rssiValues = history.map(h => h.filteredRSSI);
      const mean = rssiValues.reduce((a, b) => a + b, 0) / rssiValues.length;
      const variance = rssiValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / rssiValues.length;

      const changes = rssiValues.slice(1).map((val, i) => Math.abs(val - rssiValues[i]));
      const volatility = changes.reduce((a, b) => a + b, 0) / changes.length;

      const firstHalf = rssiValues.slice(0, Math.floor(rssiValues.length / 2));
      const secondHalf = rssiValues.slice(Math.floor(rssiValues.length / 2));
      const firstMean = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondMean = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      const trendDiff = secondMean - firstMean;

      let trend: InstabilityMetrics['trend'];
      if (variance > 25) {
        trend = 'fluctuating';
      } else if (trendDiff > 3) {
        trend = 'improving';
      } else if (trendDiff < -3) {
        trend = 'degrading';
      } else {
        trend = 'stable';
      }

      let severity: InstabilityMetrics['severity'];
      if (variance > 50 || volatility > 8) {
        severity = 'high';
      } else if (variance > 20 || volatility > 4) {
        severity = 'medium';
      } else {
        severity = 'low';
      }

      newMetrics.set(beaconId, {
        variance: Math.round(variance * 10) / 10,
        volatility: Math.round(volatility * 10) / 10,
        trend,
        severity
      });
    });

    setMetrics(newMetrics);
  }, [signals]);

  const getTrendIcon = (trend: InstabilityMetrics['trend']) => {
    switch (trend) {
      case 'stable':
        return '—';
      case 'improving':
        return '↑';
      case 'degrading':
        return '↓';
      case 'fluctuating':
        return '↕';
    }
  };

  const getSeverityColor = (severity: InstabilityMetrics['severity']) => {
    switch (severity) {
      case 'low':
        return { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' };
      case 'medium':
        return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' };
      case 'high':
        return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' };
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
        Signal Instability Monitor
      </div>

      {Array.from(metrics.entries()).map(([beaconId, metric]) => {
        const color = beaconColors.get(beaconId) || '#3b82f6';
        const severityColors = getSeverityColor(metric.severity);

        return (
          <motion.div
            key={beaconId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
              relative p-3 rounded-lg border ${severityColors.bg} ${severityColors.border}
              overflow-hidden
            `}
          >
            {metric.severity === 'high' && (
              <motion.div
                className="absolute inset-0 bg-red-500/5"
                animate={{
                  opacity: [0.05, 0.15, 0.05],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            )}

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs font-mono text-slate-300">
                  {beaconId.slice(-10)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-500">σ²</span>
                  <span className={`font-mono ${severityColors.text}`}>
                    {metric.variance.toFixed(1)}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-500">Δ</span>
                  <span className="font-mono text-slate-300">
                    {metric.volatility.toFixed(1)}dB
                  </span>
                </div>

                <motion.div
                  className={`text-xs font-bold ${severityColors.text}`}
                  animate={metric.severity === 'high' ? {
                    scale: [1, 1.1, 1],
                  } : {}}
                  transition={{
                    duration: 0.5,
                    repeat: metric.severity === 'high' ? Infinity : 0,
                  }}
                >
                  {getTrendIcon(metric.trend)}
                </motion.div>
              </div>
            </div>

            {metric.severity !== 'low' && (
              <div className="relative mt-2">
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, (metric.variance / 100) * 100)}%`,
                      opacity: metric.severity === 'high' ? [1, 0.5, 1] : 1
                    }}
                    transition={{
                      width: { duration: 0.5 },
                      opacity: metric.severity === 'high' ? {
                        duration: 0.8,
                        repeat: Infinity
                      } : {}
                    }}
                  />
                </div>

                {metric.severity === 'high' && (
                  <motion.div
                    className="absolute inset-0 h-1 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
                    }}
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                  />
                )}
              </div>
            )}
          </motion.div>
        );
      })}

      {metrics.size === 0 && (
        <div className="text-center py-4 text-slate-500 text-sm">
          No signal data available
        </div>
      )}
    </div>
  );
}

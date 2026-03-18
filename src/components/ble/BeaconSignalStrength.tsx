import { motion } from 'framer-motion';
import { Wifi, Zap, Activity } from 'lucide-react';
import type { FilteredSignal } from '@ble/types';

interface BeaconSignalStrengthProps {
  signals: FilteredSignal[];
  beaconColors: Map<string, string>;
  beaconNames?: Map<string, string>;
  maxBeacons?: number;
}

export function BeaconSignalStrength({
  signals,
  beaconColors,
  beaconNames,
  maxBeacons = 10
}: BeaconSignalStrengthProps) {
  const sortedSignals = [...signals]
    .sort((a, b) => b.filteredRSSI - a.filteredRSSI)
    .slice(0, maxBeacons);

  const getSignalIcon = (rssi: number) => {
    if (rssi > -60) return <Zap className="w-4 h-4 text-green-400" />;
    if (rssi > -75) return <Wifi className="w-4 h-4 text-blue-400" />;
    return <Activity className="w-4 h-4 text-yellow-400" />;
  };

  const getStrengthLabel = (rssi: number): string => {
    if (rssi > -60) return 'Excellent';
    if (rssi > -70) return 'Good';
    if (rssi > -80) return 'Fair';
    return 'Weak';
  };

  const getBarCount = (rssi: number): number => {
    if (rssi > -60) return 4;
    if (rssi > -70) return 3;
    if (rssi > -80) return 2;
    return 1;
  };

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
        Signal Strength
      </div>

      {sortedSignals.map((signal, index) => {
        const color = beaconColors.get(signal.beaconId) || '#3b82f6';
        const name = beaconNames?.get(signal.beaconId) || signal.beaconId.slice(-10);
        const barCount = getBarCount(signal.filteredRSSI);
        const strengthLabel = getStrengthLabel(signal.filteredRSSI);

        return (
          <motion.div
            key={signal.beaconId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/50 border border-slate-800/50"
          >
            <div className="flex-shrink-0">
              {getSignalIcon(signal.filteredRSSI)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-slate-300 truncate">
                  {name}
                </span>
              </div>

              <div className="flex items-end gap-0.5 h-4">
                {[1, 2, 3, 4].map((bar) => (
                  <motion.div
                    key={bar}
                    className="w-1.5 rounded-sm"
                    style={{
                      backgroundColor: bar <= barCount ? color : 'rgba(71, 85, 105, 0.5)',
                      height: `${bar * 25}%`
                    }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{
                      delay: index * 0.05 + bar * 0.05,
                      duration: 0.2
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-mono font-medium text-slate-200">
                {signal.filteredRSSI.toFixed(0)} dBm
              </div>
              <div
                className="text-[10px]"
                style={{
                  color: barCount >= 3 ? '#10b981' : barCount >= 2 ? '#3b82f6' : '#f59e0b'
                }}
              >
                {strengthLabel}
              </div>
            </div>
          </motion.div>
        );
      })}

      {sortedSignals.length === 0 && (
        <div className="text-center py-4 text-slate-500 text-sm">
          No active beacons
        </div>
      )}
    </div>
  );
}

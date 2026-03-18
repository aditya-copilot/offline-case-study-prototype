import { Activity, Wifi, Target, Clock } from 'lucide-react';
import type { SignalStatistics } from '@ble/types';

interface SignalMetricsProps {
  stats: SignalStatistics;
  beaconCount: number;
  scanRate: number;
}

export function SignalMetrics({ stats, beaconCount, scanRate }: SignalMetricsProps) {
  const metrics = [
    {
      icon: Wifi,
      label: 'Mean RSSI',
      value: `${stats.mean.toFixed(1)} dBm`,
      color: 'text-blue-500'
    },
    {
      icon: Activity,
      label: 'Std Dev',
      value: `±${stats.stdDev.toFixed(1)} dB`,
      color: 'text-purple-500'
    },
    {
      icon: Target,
      label: 'Range',
      value: `${stats.min} to ${stats.max}`,
      color: 'text-green-500'
    },
    {
      icon: Clock,
      label: 'Scan Rate',
      value: `${scanRate.toFixed(0)}/s`,
      color: 'text-orange-500'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="bg-muted rounded-lg p-3 flex items-center gap-3"
        >
          <metric.icon className={`w-5 h-5 ${metric.color}`} />
          <div>
            <div className="text-lg font-bold font-mono">{metric.value}</div>
            <div className="text-xs text-muted-foreground">{metric.label}</div>
          </div>
        </div>
      ))}

      <div className="col-span-2 bg-muted rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Active Beacons</span>
          <span className="text-2xl font-bold">{beaconCount}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {stats.samples} total samples
        </div>
      </div>
    </div>
  );
}

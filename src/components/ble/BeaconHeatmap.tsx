import { useMemo } from 'react';
import type { BeaconConfig, FilteredSignal } from '@ble/types';

interface BeaconHeatmapProps {
  beacons: BeaconConfig[];
  signals: FilteredSignal[];
  width?: number;
  height?: number;
  mapWidth?: number;
  mapHeight?: number;
}

export function BeaconHeatmap({
  beacons,
  signals,
  width = 400,
  height = 320,
  mapWidth = 100,
  mapHeight = 80
}: BeaconHeatmapProps) {
  const signalMap = useMemo(() => {
    const map = new Map<string, FilteredSignal>();
    signals.forEach(s => map.set(s.beaconId, s));
    return map;
  }, [signals]);

  const scaleX = width / mapWidth;
  const scaleY = height / mapHeight;

  const getSignalStrength = (rssi: number): { color: string; opacity: number } => {
    if (rssi > -60) return { color: '#10b981', opacity: 0.8 };
    if (rssi > -70) return { color: '#f59e0b', opacity: 0.6 };
    return { color: '#ef4444', opacity: 0.4 };
  };

  return (
    <svg width={width} height={height} className="bg-slate-900 rounded-lg">
      <defs>
        {beacons.map(beacon => {
          const signal = signalMap.get(beacon.id);
          const strength = signal
            ? getSignalStrength(signal.filteredRSSI)
            : { color: '#64748b', opacity: 0.2 };

          return (
            <radialGradient
              key={beacon.id}
              id={`gradient-${beacon.id}`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop
                offset="0%"
                stopColor={strength.color}
                stopOpacity={strength.opacity}
              />
              <stop
                offset="100%"
                stopColor={strength.color}
                stopOpacity={0}
              />
            </radialGradient>
          );
        })}
      </defs>

      {beacons.map(beacon => {
        const x = beacon.position.x * scaleX;
        const y = beacon.position.y * scaleY;
        const signal = signalMap.get(beacon.id);
        const radius = signal
          ? Math.max(20, (signal.filteredRSSI + 90) * 3)
          : 30;

        return (
          <g key={beacon.id}>
            <circle
              cx={x}
              cy={y}
              r={radius}
              fill={`url(#gradient-${beacon.id})`}
            />
            <circle
              cx={x}
              cy={y}
              r={6}
              fill={signal ? '#fff' : '#64748b'}
              stroke="#1e293b"
              strokeWidth={2}
            />
            {signal && (
              <text
                x={x}
                y={y - radius - 8}
                textAnchor="middle"
                fill="#fff"
                fontSize="10"
                fontFamily="monospace"
              >
                {Math.round(signal.filteredRSSI)}dBm
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

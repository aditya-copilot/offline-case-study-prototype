import { motion } from 'framer-motion';
import { Signal, Battery, MapPin, Activity } from 'lucide-react';
import type { BeaconConfig, BeaconSignal } from '@ble/types';
import { cn } from '@core/utils';

interface BeaconCardProps {
  config: BeaconConfig;
  signal?: BeaconSignal;
  isActive?: boolean;
  className?: string;
}

export function BeaconCard({ config, signal, isActive = false, className }: BeaconCardProps) {
  const rssi = signal?.rssi ?? config.calibrationRSSI;
  const distance = signal?.distance ?? 0;
  
  const signalStrength = rssi > -65 ? 'strong' : rssi > -80 ? 'medium' : 'weak';
  const signalColors = {
    strong: 'text-green-500 bg-green-500/10',
    medium: 'text-yellow-500 bg-yellow-500/10',
    weak: 'text-red-500 bg-red-500/10'
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'bg-card rounded-lg border p-4 transition-all',
        isActive && 'border-primary ring-1 ring-primary',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-sm">{config.name}</h4>
          <p className="text-xs text-muted-foreground">{config.id}</p>
        </div>
        <div className={cn(
          'px-2 py-1 rounded-full text-xs font-medium',
          signalColors[signalStrength]
        )}>
          {rssi} dBm
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Signal className="w-3.5 h-3.5" />
          <span>Tx: {config.txPower}dBm</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Battery className="w-3.5 h-3.5" />
          <span>{config.batteryLevel}%</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          <span>Zone: {config.zoneId}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Activity className="w-3.5 h-3.5" />
          <span>{distance > 0 ? `${distance.toFixed(1)}m` : 'Unknown'}</span>
        </div>
      </div>

      {signal?.accuracy && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Accuracy</span>
            <span className={cn(
              'font-medium',
              signal.accuracy === 'high' ? 'text-green-500' :
              signal.accuracy === 'medium' ? 'text-yellow-500' : 'text-red-500'
            )}>
              {signal.accuracy}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

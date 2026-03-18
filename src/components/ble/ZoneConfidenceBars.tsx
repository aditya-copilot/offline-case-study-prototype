import { motion } from 'framer-motion';
import type { ZoneEstimate } from '@ble/types';

interface ZoneConfidenceBarsProps {
  estimates: ZoneEstimate[];
  currentZone: string | null;
  zoneColors: Map<string, string>;
}

export function ZoneConfidenceBars({
  estimates,
  currentZone,
  zoneColors
}: ZoneConfidenceBarsProps) {
  const sortedEstimates = [...estimates].sort((a, b) => b.confidence - a.confidence);

  return (
    <div className="space-y-2">
      {sortedEstimates.map((estimate, index) => {
        const isCurrent = estimate.zoneId === currentZone;
        const color = zoneColors.get(estimate.zoneId) || '#3b82f6';

        return (
          <div
            key={estimate.zoneId}
            className={`relative p-3 rounded-lg border ${
              isCurrent
                ? 'bg-primary/10 border-primary'
                : 'bg-muted/50 border-transparent'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{estimate.zoneId}</span>
              <span className="text-xs font-mono">
                {Math.round(estimate.confidence * 100)}%
              </span>
            </div>

            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: `${estimate.confidence * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{estimate.allBeacons.length} beacons</span>
              {estimate.dwellTime > 0 && (
                <span>• {Math.round(estimate.dwellTime / 1000)}s</span>
              )}
              {isCurrent && (
                <span className="text-primary font-medium">• Current</span>
              )}
            </div>
          </div>
        );
      })}

      {estimates.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No zone data available
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { FilteredSignal } from '@ble/types';

interface RSSITimelineProps {
  signals: FilteredSignal[];
  beaconColors: Map<string, string>;
  maxHistory?: number;
  rowHeight?: number;
}

interface TimelineEvent {
  beaconId: string;
  rssi: number;
  confidence: number;
  timestamp: number;
  isNew: boolean;
}

export function RSSITimeline({
  signals,
  beaconColors,
  maxHistory = 50,
  rowHeight = 32
}: RSSITimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const eventHistory = useRef<TimelineEvent[]>([]);
  const lastUpdate = useRef<number>(Date.now());

  const processedEvents = useMemo(() => {
    const now = Date.now();
    const newEvents: TimelineEvent[] = [];

    signals.forEach(signal => {
      const existingIndex = eventHistory.current.findIndex(
        e => e.beaconId === signal.beaconId && now - e.timestamp < 500
      );

      if (existingIndex === -1) {
        newEvents.push({
          beaconId: signal.beaconId,
          rssi: signal.filteredRSSI,
          confidence: signal.confidence,
          timestamp: signal.timestamp,
          isNew: true
        });
      } else {
        eventHistory.current[existingIndex] = {
          ...eventHistory.current[existingIndex],
          rssi: signal.filteredRSSI,
          confidence: signal.confidence,
          isNew: false
        };
      }
    });

    eventHistory.current = [...eventHistory.current, ...newEvents]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, maxHistory);

    lastUpdate.current = now;

    return eventHistory.current;
  }, [signals, maxHistory]);

  const getSignalQuality = (rssi: number): { label: string; color: string } => {
    if (rssi > -60) return { label: 'Strong', color: '#10b981' };
    if (rssi > -75) return { label: 'Good', color: '#3b82f6' };
    if (rssi > -85) return { label: 'Weak', color: '#f59e0b' };
    return { label: 'Poor', color: '#ef4444' };
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  return (
    <div
      ref={containerRef}
      className="bg-slate-950 rounded-lg overflow-hidden border border-slate-800"
    >
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          RSSI Event Timeline
        </span>
        <span className="text-xs text-slate-500">
          {processedEvents.length} events
        </span>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {processedEvents.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-slate-500 text-sm">
            No signal events recorded
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {processedEvents.map((event, index) => {
              const quality = getSignalQuality(event.rssi);
              const color = beaconColors.get(event.beaconId) || '#3b82f6';
              const isRecent = Date.now() - event.timestamp < 1000;

              return (
                <motion.div
                  key={`${event.beaconId}-${event.timestamp}`}
                  initial={event.isNew ? { opacity: 0, x: -20 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`
                    flex items-center gap-3 px-3 py-2
                    ${isRecent ? 'bg-slate-900/50' : ''}
                    hover:bg-slate-900 transition-colors
                  `}
                  style={{ height: rowHeight }}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: color,
                      boxShadow: isRecent ? `0 0 8px ${color}` : 'none'
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-300 truncate">
                        {event.beaconId.slice(-12)}
                      </span>
                      {isRecent && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                          NEW
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden"
                        title={`Confidence: ${Math.round(event.confidence * 100)}%`}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${event.confidence * 100}%`,
                            backgroundColor: color
                          }}
                        />
                      </div>
                    </div>

                    <div
                      className="text-xs font-mono font-medium w-14 text-right"
                      style={{ color: quality.color }}
                    >
                      {event.rssi.toFixed(0)}dBm
                    </div>

                    <div
                      className="text-[10px] px-2 py-0.5 rounded border"
                      style={{
                        color: quality.color,
                        borderColor: `${quality.color}40`,
                        backgroundColor: `${quality.color}10`
                      }}
                    >
                      {quality.label}
                    </div>

                    <div className="text-xs font-mono text-slate-500 w-20 text-right">
                      {formatTime(event.timestamp)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

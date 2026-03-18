import { useState, useEffect, useRef } from 'react';
import type { FilteredSignal, SignalStatistics } from '@ble/types';
import { SignalPipeline } from '@ble/filters/SignalPipeline';

interface UseSignalStrengthOptions {
  beaconId: string;
  maxHistory?: number;
}

interface UseSignalStrengthReturn {
  rssi: number | null;
  filteredRSSI: number | null;
  confidence: number;
  history: FilteredSignal[];
  statistics: SignalStatistics;
  isStrong: boolean;
  isMedium: boolean;
  isWeak: boolean;
}

export const useSignalStrength = (options: UseSignalStrengthOptions): UseSignalStrengthReturn => {
  const { beaconId, maxHistory = 20 } = options;

  const pipelineRef = useRef(new SignalPipeline());
  const [currentSignal, setCurrentSignal] = useState<FilteredSignal | null>(null);
  const [history, setHistory] = useState<FilteredSignal[]>([]);

  useEffect(() => {
    return () => {
      pipelineRef.current.reset();
    };
  }, [beaconId]);

  const updateSignal = (signal: FilteredSignal) => {
    if (signal.beaconId !== beaconId) return;

    setCurrentSignal(signal);
    setHistory(prev => {
      const newHistory = [...prev, signal].slice(-maxHistory);
      return newHistory;
    });
  };

  const statistics: SignalStatistics = history.length > 0
    ? {
        mean: history.reduce((sum, s) => sum + s.filteredRSSI, 0) / history.length,
        variance: history.reduce((sum, s) => {
          const mean = history.reduce((a, b) => a + b.filteredRSSI, 0) / history.length;
          return sum + Math.pow(s.filteredRSSI - mean, 2);
        }, 0) / history.length,
        stdDev: Math.sqrt(
          history.reduce((sum, s) => {
            const mean = history.reduce((a, b) => a + b.filteredRSSI, 0) / history.length;
            return sum + Math.pow(s.filteredRSSI - mean, 2);
          }, 0) / history.length
        ),
        min: Math.min(...history.map(s => s.filteredRSSI)),
        max: Math.max(...history.map(s => s.filteredRSSI)),
        samples: history.length
      }
    : {
        mean: 0,
        variance: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        samples: 0
      };

  const rssi = currentSignal?.rssi ?? null;
  const filteredRSSI = currentSignal?.filteredRSSI ?? null;
  const confidence = currentSignal?.confidence ?? 0;

  return {
    rssi,
    filteredRSSI,
    confidence,
    history,
    statistics,
    isStrong: filteredRSSI !== null && filteredRSSI > -65,
    isMedium: filteredRSSI !== null && filteredRSSI > -75 && filteredRSSI <= -65,
    isWeak: filteredRSSI !== null && filteredRSSI <= -75,
    updateSignal
  } as UseSignalStrengthReturn & { updateSignal: (signal: FilteredSignal) => void };
};

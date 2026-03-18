import { useState, useEffect, useRef, useCallback } from 'react';
import type { BeaconSignal, FilteredSignal, BeaconConfig } from '@ble/types';
import { SignalPipeline } from '@ble/filters/SignalPipeline';

interface BeaconStreamState {
  [beaconId: string]: {
    latest: FilteredSignal | null;
    history: FilteredSignal[];
    isActive: boolean;
    lastSeen: number;
  };
}

interface UseBeaconStreamOptions {
  beaconConfigs: BeaconConfig[];
  maxHistoryPerBeacon?: number;
  activityTimeout?: number;
}

interface UseBeaconStreamReturn {
  beaconStates: BeaconStreamState;
  activeBeacons: string[];
  inactiveBeacons: string[];
  allSignals: FilteredSignal[];
  reset: () => void;
  processSignal: (signal: BeaconSignal) => void;
}

export const useBeaconStream = (options: UseBeaconStreamOptions): UseBeaconStreamReturn => {
  const { beaconConfigs, maxHistoryPerBeacon = 30, activityTimeout = 5000 } = options;

  const pipelineRef = useRef(new SignalPipeline());
  const [beaconStates, setBeaconStates] = useState<BeaconStreamState>(() => {
    const initial: BeaconStreamState = {};
    beaconConfigs.forEach(config => {
      initial[config.id] = {
        latest: null,
        history: [],
        isActive: false,
        lastSeen: 0
      };
    });
    return initial;
  });

  const processSignal = useCallback((signal: BeaconSignal) => {
    const filtered = pipelineRef.current.process(signal);
    if (!filtered) return;

    setBeaconStates(prev => {
      const current = prev[signal.beaconId] || {
        latest: null,
        history: [],
        isActive: false,
        lastSeen: 0
      };

      return {
        ...prev,
        [signal.beaconId]: {
          latest: filtered,
          history: [...current.history, filtered].slice(-maxHistoryPerBeacon),
          isActive: true,
          lastSeen: Date.now()
        }
      };
    });
  }, [maxHistoryPerBeacon]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setBeaconStates(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(beaconId => {
          if (updated[beaconId].isActive &&
              now - updated[beaconId].lastSeen > activityTimeout) {
            updated[beaconId] = {
              ...updated[beaconId],
              isActive: false
            };
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activityTimeout]);

  const reset = useCallback(() => {
    pipelineRef.current.reset();
    setBeaconStates(() => {
      const initial: BeaconStreamState = {};
      beaconConfigs.forEach(config => {
        initial[config.id] = {
          latest: null,
          history: [],
          isActive: false,
          lastSeen: 0
        };
      });
      return initial;
    });
  }, [beaconConfigs]);

  const activeBeacons = Object.entries(beaconStates)
    .filter(([, state]) => state.isActive)
    .map(([id]) => id);

  const inactiveBeacons = Object.entries(beaconStates)
    .filter(([, state]) => !state.isActive)
    .map(([id]) => id);

  const allSignals = Object.values(beaconStates)
    .map(state => state.latest)
    .filter((s): s is FilteredSignal => s !== null);

  return {
    beaconStates,
    activeBeacons,
    inactiveBeacons,
    allSignals,
    reset,
    processSignal
  };
};

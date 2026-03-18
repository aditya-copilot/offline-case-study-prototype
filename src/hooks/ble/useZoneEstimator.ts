import { useState, useEffect, useRef, useCallback } from 'react';
import type { BeaconConfig, FilteredSignal, ZoneEstimate } from '@ble/types';
import { ZoneDetector } from '@ble/triangulation/ZoneDetector';

interface UseZoneEstimatorOptions {
  beaconConfigs: BeaconConfig[];
  zoneBeaconMapping: Record<string, string[]>;
  confidenceThreshold?: number;
}

interface UseZoneEstimatorReturn {
  currentZone: string | null;
  zoneEstimate: ZoneEstimate | null;
  allEstimates: ZoneEstimate[];
  dwellTime: number;
  isInTransition: boolean;
}

export const useZoneEstimator = (options: UseZoneEstimatorOptions): UseZoneEstimatorReturn => {
  const { beaconConfigs, zoneBeaconMapping, confidenceThreshold = 0.6 } = options;

  const detectorRef = useRef<ZoneDetector | null>(null);
  const [currentZone, setCurrentZone] = useState<string | null>(null);
  const [zoneEstimate, setZoneEstimate] = useState<ZoneEstimate | null>(null);
  const [allEstimates, setAllEstimates] = useState<ZoneEstimate[]>([]);
  const [dwellTime, setDwellTime] = useState(0);
  const [isInTransition, setIsInTransition] = useState(false);

  useEffect(() => {
    detectorRef.current = new ZoneDetector(
      beaconConfigs,
      zoneBeaconMapping,
      confidenceThreshold
    );

    detectorRef.current.on('zoneEnter', ({ zoneId }: { zoneId: string }) => {
      setCurrentZone(zoneId);
      setIsInTransition(false);
    });

    detectorRef.current.on('zoneExit', () => {
      setIsInTransition(true);
    });

    detectorRef.current.on('zoneChange', () => {
      setIsInTransition(true);
    });

    detectorRef.current.on('estimate', (estimate: ZoneEstimate) => {
      setZoneEstimate(estimate);
      setDwellTime(estimate.dwellTime);
    });

    return () => {
      detectorRef.current?.removeAllListeners();
    };
  }, [beaconConfigs, zoneBeaconMapping, confidenceThreshold]);

  const updateSignals = useCallback((newSignals: FilteredSignal[]) => {
    if (!detectorRef.current) return;

    const estimate = detectorRef.current.estimateZone(newSignals);
    if (estimate) {
      setZoneEstimate(estimate);
      setDwellTime(estimate.dwellTime);
    }

    const estimates: ZoneEstimate[] = [];
    const zoneScores = new Map<string, { score: number; beacons: FilteredSignal[] }>();

    newSignals.forEach(signal => {
      const config = beaconConfigs.find(b => b.id === signal.beaconId);
      if (!config) return;

      const zoneId = config.zoneId;
      if (!zoneScores.has(zoneId)) {
        zoneScores.set(zoneId, { score: 0, beacons: [] });
      }

      const zoneScore = zoneScores.get(zoneId)!;
      const weight = Math.max(0, (signal.filteredRSSI + 90) / 40);
      zoneScore.score += weight;
      zoneScore.beacons.push(signal);
    });

    zoneScores.forEach((data, zoneId) => {
      const maxScore = data.beacons.length;
      const normalizedScore = maxScore > 0 ? data.score / maxScore : 0;

      estimates.push({
        zoneId,
        confidence: normalizedScore,
        primaryBeacon: data.beacons[0]?.beaconId || '',
        allBeacons: data.beacons.map(b => ({
          beaconId: b.beaconId,
          rssi: b.filteredRSSI,
          weight: Math.max(0, (b.filteredRSSI + 90) / 40)
        })),
        dwellTime: zoneId === currentZone ? dwellTime : 0,
        entryTime: Date.now(),
        transitionProbability: 0
      });
    });

    setAllEstimates(estimates.sort((a, b) => b.confidence - a.confidence));
  }, [beaconConfigs, currentZone, dwellTime]);

  useEffect(() => {
    return () => {
      detectorRef.current?.reset();
    };
  }, []);

  return {
    currentZone,
    zoneEstimate,
    allEstimates,
    dwellTime,
    isInTransition,
    updateSignals
  } as UseZoneEstimatorReturn & { updateSignals: (signals: FilteredSignal[]) => void };
};

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  BeaconSignal,
  FilteredSignal,
  BeaconConfig,
  ScanConfig,
  ScanStatus
} from '@ble/types';
import { BLEScanner } from '@ble/scanner/BLEScanner';
import { SimulationAdapter } from '@ble/adapters/SimulationAdapter';

interface UseBLEScannerOptions {
  beaconConfigs: BeaconConfig[];
  simulationMode?: boolean;
  scanConfig?: Partial<ScanConfig>;
}

interface UseBLEScannerReturn {
  isScanning: boolean;
  status: ScanStatus;
  signals: FilteredSignal[];
  discoveredBeacons: string[];
  error: Error | null;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}

export const useBLEScanner = (options: UseBLEScannerOptions): UseBLEScannerReturn => {
  const { beaconConfigs, simulationMode = true, scanConfig } = options;

  const scannerRef = useRef<BLEScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [signals, setSignals] = useState<FilteredSignal[]>([]);
  const [discoveredBeacons, setDiscoveredBeacons] = useState<string[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let adapter: SimulationAdapter | WebBluetoothAdapter;
    
    if (simulationMode) {
      adapter = new SimulationAdapter({
        enabled: true,
        noiseModel: 'gaussian',
        noiseAmplitude: 3,
        updateInterval: 200,
        virtualBeacons: beaconConfigs,
        walkPath: [
          { x: 50, y: 75 },
          { x: 50, y: 60 },
          { x: 50, y: 45 },
          { x: 35, y: 35 },
          { x: 20, y: 20 },
          { x: 35, y: 35 },
          { x: 50, y: 45 },
          { x: 65, y: 35 },
          { x: 80, y: 25 },
          { x: 65, y: 35 },
          { x: 50, y: 45 },
          { x: 50, y: 60 },
          { x: 50, y: 75 }
        ],
        walkSpeed: 0.5
      });
    } else {
      adapter = new WebBluetoothAdapter();
    }

    const scanner = new BLEScanner(adapter, scanConfig, beaconConfigs);

    scanner.on('filteredSignal', (signal: FilteredSignal) => {
      setSignals(prev => {
        const filtered = prev.filter(s => s.beaconId !== signal.beaconId);
        return [...filtered, signal].slice(-50);
      });
    });

    scanner.on('beaconDiscovered', ({ beaconId }: { beaconId: string }) => {
      setDiscoveredBeacons(prev =>
        prev.includes(beaconId) ? prev : [...prev, beaconId]
      );
    });

    scanner.on('statusChange', ({ current }: { current: ScanStatus }) => {
      setStatus(current);
    });

    scanner.on('error', (err: Error) => {
      setError(err);
    });

    scannerRef.current = scanner;

    return () => {
      scanner.stop();
    };
  }, [beaconConfigs, simulationMode, scanConfig]);

  const start = useCallback(async () => {
    if (!scannerRef.current) return;

    setError(null);
    try {
      await scannerRef.current.start();
      setIsScanning(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to start scanning'));
    }
  }, []);

  const stop = useCallback(() => {
    scannerRef.current?.stop();
    setIsScanning(false);
  }, []);

  const reset = useCallback(() => {
    scannerRef.current?.reset();
    setSignals([]);
    setDiscoveredBeacons([]);
    setError(null);
  }, []);

  return {
    isScanning,
    status,
    signals,
    discoveredBeacons,
    error,
    start,
    stop,
    reset
  };
};

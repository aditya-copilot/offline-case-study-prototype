export interface BeaconConfig {
  id: string;
  name: string;
  zoneId: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  major: number;
  minor: number;
  uuid: string;
  txPower: number;
  calibrationRSSI: number;
  environmentFactor: number;
  frequency: number;
  batteryLevel: number;
  installDate: string;
  firmware: string;
  type: 'ibeacon' | 'eddystone' | 'altbeacon';
}

export interface BeaconSignal {
  beaconId: string;
  rssi: number;
  txPower: number;
  timestamp: number;
  distance?: number;
  accuracy?: 'high' | 'medium' | 'low';
  rawData?: Uint8Array;
}

export interface FilteredSignal extends BeaconSignal {
  filteredRSSI: number;
  confidence: number;
  sampleCount: number;
}

export interface ZoneEstimate {
  zoneId: string;
  confidence: number;
  primaryBeacon: string;
  allBeacons: Array<{
    beaconId: string;
    rssi: number;
    weight: number;
  }>;
  dwellTime: number;
  entryTime: number;
  transitionProbability: number;
}

export interface PositionEstimate {
  x: number;
  y: number;
  z: number;
  accuracy: number;
  confidence: number;
  method: 'trilateration' | 'zone-snap' | 'nearest-beacon';
  timestamp: number;
}

export interface SignalStatistics {
  mean: number;
  variance: number;
  stdDev: number;
  min: number;
  max: number;
  samples: number;
}

export interface ScanConfig {
  scanInterval: number;
  scanDuration: number;
  signalBufferSize: number;
  rssiThreshold: number;
  kalmanProcessNoise: number;
  kalmanMeasurementNoise: number;
  outlierThreshold: number;
  smoothingFactor: number;
}

export type ScanStatus = 'idle' | 'scanning' | 'error' | 'unsupported';

export interface BLEAdapter {
  isSupported(): boolean;
  requestPermission(): Promise<boolean>;
  startScan(callback: (signal: BeaconSignal) => void): Promise<void>;
  stopScan(): void;
}

export interface SignalFilter {
  process(signal: BeaconSignal): FilteredSignal;
  reset(): void;
  getStatistics(): SignalStatistics;
}

export type NoiseModel = 'gaussian' | 'random-walk' | 'interference' | 'multipath';

export interface SimulationConfig {
  enabled: boolean;
  noiseModel: NoiseModel;
  noiseAmplitude: number;
  driftRate: number;
  updateInterval: number;
  virtualBeacons: BeaconConfig[];
  walkPath: Array<{ x: number; y: number }>;
  walkSpeed: number;
}

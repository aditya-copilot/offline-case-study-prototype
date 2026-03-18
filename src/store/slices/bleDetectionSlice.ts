import type { StateCreator } from 'zustand';
import type {
  BeaconConfig,
  BeaconSignal,
  FilteredSignal,
  ZoneEstimate,
  ScanStatus
} from '@ble/types';

export interface BLEDetectionSlice {
  // Beacon Configuration
  beaconConfigs: BeaconConfig[];
  zoneBeaconMapping: Record<string, string[]>;
  
  // Scan State
  isScanning: boolean;
  scanStatus: ScanStatus;
  scanError: string | null;
  
  // Signal Data
  rawSignals: BeaconSignal[];
  filteredSignals: FilteredSignal[];
  signalHistory: Map<string, FilteredSignal[]>;
  
  // Zone Detection
  currentZone: string | null;
  zoneEstimates: ZoneEstimate[];
  zoneConfidence: number;
  dwellTime: number;
  
  // Simulation
  isSimulationMode: boolean;
  simulationPosition: { x: number; y: number };
  
  // Stats
  scanRate: number;
  activeBeaconCount: number;
  
  // Actions
  setBeaconConfigs: (configs: BeaconConfig[], mapping: Record<string, string[]>) => void;
  
  startScan: () => void;
  stopScan: () => void;
  setScanError: (error: string | null) => void;
  
  addRawSignal: (signal: BeaconSignal) => void;
  addFilteredSignal: (signal: FilteredSignal) => void;
  clearSignals: () => void;
  
  setCurrentZone: (zoneId: string | null) => void;
  setZoneEstimates: (estimates: ZoneEstimate[]) => void;
  updateZoneConfidence: (confidence: number) => void;
  
  setSimulationMode: (enabled: boolean) => void;
  setSimulationPosition: (position: { x: number; y: number }) => void;
  
  updateScanRate: (rate: number) => void;
  updateActiveBeaconCount: (count: number) => void;
  
  reset: () => void;
}

const initialState = {
  beaconConfigs: [],
  zoneBeaconMapping: {},
  isScanning: false,
  scanStatus: 'idle' as ScanStatus,
  scanError: null,
  rawSignals: [],
  filteredSignals: [],
  signalHistory: new Map(),
  currentZone: null,
  zoneEstimates: [],
  zoneConfidence: 0,
  dwellTime: 0,
  isSimulationMode: true,
  simulationPosition: { x: 50, y: 75 },
  scanRate: 0,
  activeBeaconCount: 0
};

export const createBLEDetectionSlice: StateCreator<BLEDetectionSlice> = (set, get) => ({
  ...initialState,
  
  setBeaconConfigs: (configs, mapping) => {
    set({
      beaconConfigs: configs,
      zoneBeaconMapping: mapping
    });
  },
  
  startScan: () => {
    set({
      isScanning: true,
      scanStatus: 'scanning',
      scanError: null
    });
  },
  
  stopScan: () => {
    set({
      isScanning: false,
      scanStatus: 'idle'
    });
  },
  
  setScanError: (error) => {
    set({
      scanError: error,
      scanStatus: error ? 'error' : get().scanStatus
    });
  },
  
  addRawSignal: (signal) => {
    set(state => ({
      rawSignals: [...state.rawSignals.slice(-100), signal]
    }));
  },
  
  addFilteredSignal: (signal) => {
    set(state => {
      const filtered = [...state.filteredSignals.slice(-50).filter(
        s => s.beaconId !== signal.beaconId
      ), signal];
      
      const history = new Map(state.signalHistory);
      const beaconHistory = history.get(signal.beaconId) || [];
      history.set(signal.beaconId, [...beaconHistory.slice(-30), signal]);
      
      return {
        filteredSignals: filtered,
        signalHistory: history
      };
    });
  },
  
  clearSignals: () => {
    set({
      rawSignals: [],
      filteredSignals: [],
      signalHistory: new Map()
    });
  },
  
  setCurrentZone: (zoneId) => {
    set({ currentZone: zoneId });
  },
  
  setZoneEstimates: (estimates) => {
    set({ zoneEstimates: estimates });
  },
  
  updateZoneConfidence: (confidence) => {
    set({ zoneConfidence: confidence });
  },
  
  setSimulationMode: (enabled) => {
    set({ isSimulationMode: enabled });
  },
  
  setSimulationPosition: (position) => {
    set({ simulationPosition: position });
  },
  
  updateScanRate: (rate) => {
    set({ scanRate: rate });
  },
  
  updateActiveBeaconCount: (count) => {
    set({ activeBeaconCount: count });
  },
  
  reset: () => {
    set({
      ...initialState,
      beaconConfigs: get().beaconConfigs,
      zoneBeaconMapping: get().zoneBeaconMapping
    });
  }
});

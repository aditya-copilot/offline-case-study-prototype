import type { StateCreator } from 'zustand';
import type { BeaconSignal, UserLocation } from '@core/types';
import { BLE_CONSTANTS } from '@core/constants';
import { calculateDistance } from '@core/utils';

export interface BLESlice {
  isScanning: boolean;
  isSupported: boolean;
  hasPermission: boolean;
  detectedBeacons: BeaconSignal[];
  userLocation: UserLocation | null;
  currentZone: string | null;
  rssiHistory: Map<string, number[]>;
  scanStartTime: number | null;
  error: string | null;

  startScan: () => void;
  stopScan: () => void;
  requestPermission: () => Promise<boolean>;
  updateBeacons: (beacons: BeaconSignal[]) => void;
  calculateLocation: () => UserLocation | null;
  simulateBeacons: (count?: number) => void;
  clearError: () => void;
}

const smoothRSSI = (history: number[], newValue: number): number => {
  if (history.length === 0) return newValue;

  const smoothed =
    BLE_CONSTANTS.SMOOTHING_FACTOR * newValue +
    (1 - BLE_CONSTANTS.SMOOTHING_FACTOR) * history[history.length - 1];

  return Math.round(smoothed * 10) / 10;
};

const rssiToDistance = (rssi: number, txPower: number): number => {
  if (rssi === 0) return -1;

  const ratio = (txPower - rssi) / (10 * BLE_CONSTANTS.ENVIRONMENTAL_FACTOR);
  const distance = Math.pow(10, ratio);

  return Math.round(distance * 100) / 100;
};

const trilaterate = (
  beacons: Array<{ x: number; y: number; distance: number }>
): { x: number; y: number; accuracy: number } | null => {
  if (beacons.length < 3) return null;

  const validBeacons = beacons.filter((b) => b.distance > 0 && b.distance < 50);
  if (validBeacons.length < 3) return null;

  const sorted = validBeacons
    .slice()
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 4);

  let sumX = 0;
  let sumY = 0;
  let totalWeight = 0;

  for (const beacon of sorted) {
    const weight = 1 / Math.max(beacon.distance, 0.1);
    sumX += beacon.x * weight;
    sumY += beacon.y * weight;
    totalWeight += weight;
  }

  const x = sumX / totalWeight;
  const y = sumY / totalWeight;

  let totalError = 0;
  for (const beacon of sorted) {
    const calculated = calculateDistance(x, y, beacon.x, beacon.y);
    totalError += Math.abs(calculated - beacon.distance);
  }

  const accuracy = totalError / sorted.length;

  return { x, y, accuracy };
};

export const createBLESlice: StateCreator<BLESlice> = (set, get) => ({
  isScanning: false,
  isSupported: false,
  hasPermission: false,
  detectedBeacons: [],
  userLocation: null,
  currentZone: null,
  rssiHistory: new Map(),
  scanStartTime: null,
  error: null,

  startScan: () => {
    const { isSupported, hasPermission } = get();

    if (!isSupported) {
      set({ error: 'Bluetooth is not supported on this device' });
      return;
    }

    if (!hasPermission) {
      set({ error: 'Bluetooth permission not granted' });
      return;
    }

    set({
      isScanning: true,
      scanStartTime: Date.now(),
      error: null
    });
  },

  stopScan: () => {
    set({
      isScanning: false,
      scanStartTime: null
    });
  },

  requestPermission: async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.bluetooth) {
        set({ isSupported: false });
        return false;
      }

      set({ isSupported: true });

      await navigator.bluetooth.requestLEScan({
        acceptAllAdvertisements: true
      });

      set({ hasPermission: true });
      return true;
    } catch {
      set({ hasPermission: false });
      return false;
    }
  },

  updateBeacons: (beacons) => {
    const { rssiHistory, isScanning } = get();

    if (!isScanning) return;

    const now = Date.now();
    const validBeacons = beacons.filter(
      (b) => b.rssi >= BLE_CONSTANTS.SIGNAL_THRESHOLD
    );

    const processedBeacons: BeaconSignal[] = [];

    for (const beacon of validBeacons) {
      const history = rssiHistory.get(beacon.id) ?? [];
      const smoothedRSSI = smoothRSSI(history, beacon.rssi);
      const distance = rssiToDistance(smoothedRSSI, beacon.txPower);

      history.push(smoothedRSSI);
      if (history.length > 10) history.shift();

      rssiHistory.set(beacon.id, history);

      processedBeacons.push({
        ...beacon,
        rssi: smoothedRSSI,
        distance,
        timestamp: now,
        accuracy:
          distance < 2 ? 'high' : distance < 5 ? 'medium' : 'low'
      });
    }

    processedBeacons.sort((a, b) => b.rssi - a.rssi);

    set({
      detectedBeacons: processedBeacons.slice(0, BLE_CONSTANTS.MAX_BEACONS)
    });

    const location = get().calculateLocation();
    if (location) {
      set({ userLocation: location });
    }
  },

  calculateLocation: () => {
    const { detectedBeacons } = get();

    const beaconPositions = detectedBeacons
      .filter((b) => b.distance > 0 && b.zoneId)
      .map((b) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        distance: b.distance
      }));

    const result = trilaterate(beaconPositions);

    if (!result) return null;

    return {
      coordinates: { x: result.x, y: result.y },
      accuracy: result.accuracy,
      timestamp: Date.now()
    };
  },

  simulateBeacons: (count = 5) => {
    const zones = [
      { id: 'z1', name: 'Electronics', x: 20, y: 30 },
      { id: 'z2', name: 'Grocery', x: 60, y: 40 },
      { id: 'z3', name: 'Clothing', x: 40, y: 70 },
      { id: 'z4', name: 'Home', x: 80, y: 60 }
    ];

    const simulated: BeaconSignal[] = [];

    for (let i = 0; i < count; i++) {
      const zone = zones[i % zones.length];
      const rssi = -80 + Math.random() * 40;
      const txPower = -59;

      simulated.push({
        id: `beacon-${i}`,
        uuid: `550e8400-e29b-41d4-a716-44665544000${i}`,
        major: i + 1,
        minor: i * 10,
        rssi,
        txPower,
        distance: rssiToDistance(rssi, txPower),
        accuracy: rssi > -65 ? 'high' : rssi > -75 ? 'medium' : 'low',
        timestamp: Date.now(),
        zoneId: zone.id
      });
    }

    get().updateBeacons(simulated);
  },

  clearError: () => {
    set({ error: null });
  }
});

import type { BLEAdapter, BeaconSignal, ScanConfig, ScanStatus, BeaconConfig } from '../types';
import { SignalPipeline } from '../filters/SignalPipeline';
import { EventEmitter } from '@core/utils/events';

interface ScannerState {
  status: ScanStatus;
  isScanning: boolean;
  lastScanTime: number;
  discoveredBeacons: Set<string>;
  signalHistory: Map<string, BeaconSignal[]>;
}

export class BLEScanner extends EventEmitter<{
  signal: BeaconSignal;
  filteredSignal: import('../types').FilteredSignal;
  beaconDiscovered: { beaconId: string; firstSeen: number };
  beaconLost: { beaconId: string; lastSeen: number };
  statusChange: { previous: ScanStatus; current: ScanStatus };
  error: Error;
}> {
  private adapter: BLEAdapter;
  private config: ScanConfig;
  private pipeline: SignalPipeline;
  private state: ScannerState;
  private beaconConfigs: Map<string, BeaconConfig> = new Map();
  private signalBuffer: Map<string, BeaconSignal> = new Map();
  private cleanupInterval: number | null = null;

  constructor(
    adapter: BLEAdapter,
    config: Partial<ScanConfig> = {},
    beaconConfigs: BeaconConfig[] = []
  ) {
    super();
    this.adapter = adapter;
    this.config = {
      scanInterval: 200,
      scanDuration: 1000,
      signalBufferSize: 50,
      rssiThreshold: -85,
      kalmanProcessNoise: 0.01,
      kalmanMeasurementNoise: 0.1,
      outlierThreshold: 10,
      smoothingFactor: 0.3,
      ...config
    };

    this.pipeline = new SignalPipeline({
      useOutlierFilter: true,
      useKalmanFilter: true,
      useMovingAverage: true,
      outlierThreshold: this.config.outlierThreshold,
      kalmanProcessNoise: this.config.kalmanProcessNoise,
      kalmanMeasurementNoise: this.config.kalmanMeasurementNoise
    });

    this.state = {
      status: 'idle',
      isScanning: false,
      lastScanTime: 0,
      discoveredBeacons: new Set(),
      signalHistory: new Map()
    };

    beaconConfigs.forEach(config => {
      this.beaconConfigs.set(config.id, config);
    });
  }

  async start(): Promise<void> {
    if (this.state.isScanning) return;

    if (!this.adapter.isSupported()) {
      this.updateStatus('unsupported');
      throw new Error('BLE is not supported on this device');
    }

    const hasPermission = await this.adapter.requestPermission();
    if (!hasPermission) {
      this.updateStatus('error');
      throw new Error('BLE permission denied');
    }

    this.updateStatus('scanning');
    this.state.isScanning = true;

    try {
      await this.adapter.startScan(this.handleSignal.bind(this));

      this.cleanupInterval = window.setInterval(() => {
        this.cleanupOldSignals();
      }, 5000);
    } catch (error) {
      this.updateStatus('error');
      this.state.isScanning = false;
      this.emit('error', error as Error);
      throw error;
    }
  }

  stop(): void {
    if (!this.state.isScanning) return;

    this.adapter.stopScan();
    this.state.isScanning = false;
    this.updateStatus('idle');

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private handleSignal(signal: BeaconSignal): void {
    if (signal.rssi < this.config.rssiThreshold) return;

    const config = this.beaconConfigs.get(signal.beaconId);
    if (config) {
      signal.txPower = config.txPower;
    }

    this.state.lastScanTime = Date.now();
    this.bufferSignal(signal);

    if (!this.state.discoveredBeacons.has(signal.beaconId)) {
      this.state.discoveredBeacons.add(signal.beaconId);
      this.emit('beaconDiscovered', {
        beaconId: signal.beaconId,
        firstSeen: signal.timestamp
      });
    }

    this.emit('signal', signal);

    const filtered = this.pipeline.process(signal);
    if (filtered) {
      this.emit('filteredSignal', filtered);
      this.addToHistory(filtered);
    }
  }

  private bufferSignal(signal: BeaconSignal): void {
    this.signalBuffer.set(signal.beaconId, signal);

    if (this.signalBuffer.size > this.config.signalBufferSize) {
      const oldestKey = this.signalBuffer.keys().next().value;
      this.signalBuffer.delete(oldestKey);
    }
  }

  private addToHistory(signal: import('../types').FilteredSignal): void {
    let history = this.state.signalHistory.get(signal.beaconId);
    if (!history) {
      history = [];
      this.state.signalHistory.set(signal.beaconId, history);
    }

    history.push(signal);

    const maxHistory = 100;
    if (history.length > maxHistory) {
      history.shift();
    }
  }

  private cleanupOldSignals(): void {
    const now = Date.now();
    const timeout = 10000;

    this.state.discoveredBeacons.forEach(beaconId => {
      const history = this.state.signalHistory.get(beaconId);
      if (history && history.length > 0) {
        const lastSignal = history[history.length - 1];
        if (now - lastSignal.timestamp > timeout) {
          this.state.discoveredBeacons.delete(beaconId);
          this.emit('beaconLost', {
            beaconId,
            lastSeen: lastSignal.timestamp
          });
        }
      }
    });
  }

  private updateStatus(newStatus: ScanStatus): void {
    const previous = this.state.status;
    this.state.status = newStatus;

    if (previous !== newStatus) {
      this.emit('statusChange', { previous, current: newStatus });
    }
  }

  getStatus(): ScanStatus {
    return this.state.status;
  }

  isScanning(): boolean {
    return this.state.isScanning;
  }

  getDiscoveredBeacons(): string[] {
    return Array.from(this.state.discoveredBeacons);
  }

  getLatestSignal(beaconId: string): BeaconSignal | undefined {
    return this.signalBuffer.get(beaconId);
  }

  getSignalHistory(beaconId: string): BeaconSignal[] {
    return this.state.signalHistory.get(beaconId) || [];
  }

  getAllLatestSignals(): BeaconSignal[] {
    return Array.from(this.signalBuffer.values());
  }

  getPipeline(): SignalPipeline {
    return this.pipeline;
  }

  reset(): void {
    this.stop();
    this.pipeline.reset();
    this.state.discoveredBeacons.clear();
    this.state.signalHistory.clear();
    this.signalBuffer.clear();
  }

  updateConfig(newConfig: Partial<ScanConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.pipeline.updateConfig({
      outlierThreshold: this.config.outlierThreshold,
      kalmanProcessNoise: this.config.kalmanProcessNoise,
      kalmanMeasurementNoise: this.config.kalmanMeasurementNoise
    });
  }
}

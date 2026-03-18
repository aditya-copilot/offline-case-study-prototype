// BLE Detection Engine - Main Export File
// Comprehensive Indoor Positioning System

// Types
export type {
  BeaconConfig,
  BeaconSignal,
  FilteredSignal,
  ZoneEstimate,
  PositionEstimate,
  SignalStatistics,
  ScanConfig,
  ScanStatus,
  BLEAdapter,
  SignalFilter,
  NoiseModel,
  SimulationConfig
} from './types';

// Adapters
export { WebBluetoothAdapter } from './adapters/WebBluetoothAdapter';
export { SimulationAdapter } from './adapters/SimulationAdapter';
export { NativeAdapterPlaceholder } from './adapters/NativeAdapterPlaceholder';

// Scanner
export { BLEScanner } from './scanner/BLEScanner';

// Filters
export { KalmanFilter } from './filters/KalmanFilter';
export { MovingAverageFilter } from './filters/MovingAverageFilter';
export { OutlierFilter } from './filters/OutlierFilter';
export { SignalPipeline } from './filters/SignalPipeline';
export { TemporalDecayFilter } from './filters/TemporalDecayFilter';
export { ConfidenceScoringFilter } from './filters/ConfidenceScoringFilter';
export { ExponentialSmoothingFilter } from './filters/ExponentialSmoothingFilter';

// Triangulation
export { ZoneDetector } from './triangulation/ZoneDetector';
export { PositionEstimator } from './triangulation/PositionEstimator';

// Simulation
export { AdvancedSimulationEngine } from './simulation/AdvancedSimulationEngine';
export { WalkPathGenerator } from './simulation/WalkPathGenerator';

// Signal Bus
export { SignalBus, signalBus } from './signal-bus/SignalBus';
export type { SignalBusEvent } from './signal-bus/SignalBus';

// Workers
export { SignalProcessorWorker } from './workers';
export type { WorkerMessage, WorkerStats } from './workers';

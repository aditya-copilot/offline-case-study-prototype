export { default as SignalProcessorWorker } from './signalProcessor.worker?worker';

export interface WorkerMessage {
  type: string;
  payload?: unknown;
}

export interface WorkerStats {
  processed: number;
  dropped: number;
  dropRate: number;
  activeBeacons: number;
  bufferSizes: Array<{ beaconId: string; size: number }>;
}

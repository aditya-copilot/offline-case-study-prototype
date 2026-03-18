import { vehicleDataLoader } from '@core/data/vehicleDataLoader';
import { vehicleImageResolver } from '@core/assets/vehicleImageResolver';
import type { ScanConfig, ScanState, ScanTarget } from '../types';

interface ScanResult {
  success: boolean;
  vehicleId?: string;
  confidence: number;
  features?: string[];
  message: string;
}

export class ScanEngine {
  private static instance: ScanEngine;
  private config: ScanConfig;
  private state: ScanState = 'idle';
  private stream: MediaStream | null = null;
  private onStateChange: ((state: ScanState) => void) | null = null;
  private onResult: ((result: ScanResult) => void) | null = null;
  private scanInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.config = {
      target: 'vehicle',
      autoCapture: true,
      showOverlay: true,
      confidenceThreshold: 0.7,
      simulationMode: true
    };
  }

  static getInstance(): ScanEngine {
    if (!ScanEngine.instance) {
      ScanEngine.instance = new ScanEngine();
    }
    return ScanEngine.instance;
  }

  async startScan(
    videoElement: HTMLVideoElement,
    onStateChange: (state: ScanState) => void,
    onResult: (result: ScanResult) => void
  ): Promise<void> {
    this.onStateChange = onStateChange;
    this.onResult = onResult;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });

      videoElement.srcObject = this.stream;
      videoElement.play();

      this.setState('scanning');

      if (this.config.simulationMode) {
        this.startSimulationScan();
      } else {
        this.startRealScan(videoElement);
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      this.setState('error');
      onResult({
        success: false,
        confidence: 0,
        message: 'Camera access denied. Please allow camera permissions.'
      });
    }
  }

  stopScan(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }

    this.setState('idle');
  }

  captureFrame(videoElement: HTMLVideoElement): string | null {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    ctx.drawImage(videoElement, 0, 0);
    return canvas.toDataURL('image/jpeg');
  }

  private startSimulationScan(): void {
    let scanAttempts = 0;
    const maxAttempts = 20;

    this.scanInterval = setInterval(async () => {
      scanAttempts++;

      if (scanAttempts >= 3 && scanAttempts < 6) {
        this.setState('recognizing');
      }

      if (scanAttempts >= 6) {
        clearInterval(this.scanInterval!);
        await this.simulateRecognition();
      }
    }, 500);
  }

  private async simulateRecognition(): Promise<void> {
    await vehicleDataLoader.load();
    const vehicles = vehicleDataLoader.getAllVehicles();

    if (vehicles.length === 0) {
      this.onResult?.({
        success: false,
        confidence: 0,
        message: 'No vehicles found in database.'
      });
      return;
    }

    const randomVehicle = vehicles[Math.floor(Math.random() * Math.min(5, vehicles.length))];
    const confidence = 0.75 + Math.random() * 0.2;

    this.setState('success');

    setTimeout(() => {
      this.onResult?.({
        success: true,
        vehicleId: randomVehicle.id,
        confidence,
        features: randomVehicle.tags.slice(0, 3),
        message: `Found ${randomVehicle.makeName} ${randomVehicle.modelName} with ${(confidence * 100).toFixed(0)}% confidence`
      });
    }, 500);
  }

  private startRealScan(videoElement: HTMLVideoElement): void {
    this.scanInterval = setInterval(async () => {
      const frame = this.captureFrame(videoElement);
      if (frame) {
        await this.processFrame(frame);
      }
    }, 1000);
  }

  private async processFrame(imageData: string): Promise<void> {
    console.log('Processing frame for vehicle recognition...');
  }

  private setState(state: ScanState): void {
    this.state = state;
    this.onStateChange?.(state);
  }

  setConfig(config: Partial<ScanConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getState(): ScanState {
    return this.state;
  }

  isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  setTarget(target: ScanTarget): void {
    this.config.target = target;
  }
}

export const scanEngine = ScanEngine.getInstance();

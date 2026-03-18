import type { BLEAdapter, BeaconSignal } from '../types';

export class WebBluetoothAdapter implements BLEAdapter {
  private isScanning: boolean = false;
  private callback: ((signal: BeaconSignal) => void) | null = null;
  private scanInterval: number | null = null;

  isSupported(): boolean {
    return 'bluetooth' in navigator;
  }

  async requestPermission(): Promise<boolean> {
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service']
      });
      return !!device;
    } catch {
      return false;
    }
  }

  async startScan(callback: (signal: BeaconSignal) => void): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser');
    }

    if (this.isScanning) {
      return;
    }

    this.callback = callback;
    this.isScanning = true;

    try {
      const scan = await (navigator as any).bluetooth.requestLEScan({
        acceptAllAdvertisements: true
      });

      (navigator as any).bluetooth.addEventListener(
        'advertisementreceived',
        (event: any) => {
          if (!this.isScanning || !this.callback) return;

          const signal: BeaconSignal = {
            beaconId: event.device.id || 'unknown',
            rssi: event.rssi,
            txPower: event.txPower || -59,
            timestamp: Date.now(),
            rawData: event.manufacturerData
              ? new Uint8Array(event.manufacturerData)
              : undefined
          };

          this.callback(signal);
        }
      );

      this.scanInterval = window.setInterval(() => {
        if (!scan.active) {
          this.stopScan();
        }
      }, 1000);
    } catch (error) {
      this.isScanning = false;
      throw error;
    }
  }

  stopScan(): void {
    this.isScanning = false;
    this.callback = null;

    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }

    if ('bluetooth' in navigator) {
      (navigator as any).bluetooth?.stopLEScan?.();
    }
  }
}

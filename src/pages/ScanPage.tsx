import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, Scan, X, Flashlight, Image as ImageIcon } from 'lucide-react';

import { cn } from '@core/utils';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';

export function ScanPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startScanning = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsScanning(true);
    } catch {
      setScanResult('Camera access denied. Please enable camera permissions.');
    }
  }, []);

  const stopScanning = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  const simulateScan = useCallback(() => {
    setScanResult('BARCODE: 123456789012');
    stopScanning();
  }, [stopScanning]);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col -mx-4 -my-4 lg:-mx-6 lg:-my-6">
      <div className="px-4 py-3 border-b border-border bg-background/95 backdrop-blur">
        <h1 className="text-lg font-semibold">Scan Product</h1>
        <p className="text-sm text-muted-foreground">
          Scan barcodes to quickly add products
        </p>
      </div>

      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {isScanning ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />

            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-black/30" />

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-48">
                <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-white" />
                <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-white" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-white" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-white" />

                <motion.div
                  className="absolute left-0 right-0 h-0.5 bg-primary"
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
              </div>

              <p className="absolute bottom-32 left-0 right-0 text-center text-white/80 text-sm">
                Position barcode within the frame
              </p>
            </div>

            <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="w-12 h-12 rounded-full bg-white/10 border-white/30 text-white"
                onClick={() => setFlashEnabled(!flashEnabled)}
              >
                <Flashlight
                  className={cn('w-5 h-5', flashEnabled && 'text-yellow-400')}
                />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="w-14 h-14 rounded-full bg-white border-4 border-white/30"
                onClick={simulateScan}
              >
                <div className="w-10 h-10 rounded-full bg-primary" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="w-12 h-12 rounded-full bg-white/10 border-white/30 text-white"
                onClick={stopScanning}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center space-y-6">
            <div className="w-32 h-32 mx-auto rounded-2xl bg-muted flex items-center justify-center">
              <Scan className="w-16 h-16 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Ready to Scan</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Point your camera at a product barcode to quickly find and add it to your list
              </p>
            </div>

            <div className="flex flex-col gap-3 px-4">
              <Button onClick={startScanning} className="w-full sm:w-auto">
                <Camera className="w-4 h-4 mr-2" />
                Start Scanning
              </Button>
              <Button variant="outline" className="w-full sm:w-auto">
                <ImageIcon className="w-4 h-4 mr-2" />
                Choose from Gallery
              </Button>
            </div>
          </div>
        )}

        {scanResult && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border"
          >
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Scanned Code</p>
                  <p className="font-mono font-medium">{scanResult}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setScanResult(null)}>
                    Cancel
                  </Button>
                  <Button size="sm">Add to List</Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

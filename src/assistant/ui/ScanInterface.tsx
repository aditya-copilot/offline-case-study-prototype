import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, Scan, CheckCircle, AlertCircle, RefreshCw, Zap } from 'lucide-react';
import { cn } from '@core/utils';
import { Button } from '@components/ui/Button';
import type { ScanState } from '../types';

interface ScanResult {
  success: boolean;
  vehicleId?: string;
  vehicleName?: string;
  confidence: number;
  features?: string[];
  message: string;
}

interface ScanInterfaceProps {
  onScanComplete?: (result: ScanResult) => void;
}

export function ScanInterface({ onScanComplete }: ScanInterfaceProps) {
  const [state, setState] = useState<ScanState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsSupported(!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState('scanning');
      startSimulation();
    } catch {
      setError('Camera access denied. Please allow camera permissions in your browser settings.');
      setState('error');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setState('idle');
    setScanProgress(0);
  }, []);

  const startSimulation = useCallback(() => {
    let progress = 0;
    setScanProgress(0);

    scanIntervalRef.current = setInterval(() => {
      progress += 5;
      setScanProgress(progress);

      if (progress >= 30 && progress < 35) {
        setState('recognizing');
      }

      if (progress >= 100) {
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
        }
        completeSimulation();
      }
    }, 100);
  }, []);

  const completeSimulation = useCallback(() => {
    const mockResults: ScanResult[] = [
      {
        success: true,
        vehicleId: 'royal-enfield-classic-350',
        vehicleName: 'Royal Enfield Classic 350',
        confidence: 0.92,
        features: ['Retro Design', '349cc Engine', 'ABS'],
        message: 'Royal Enfield Classic 350 detected with 92% confidence'
      },
      {
        success: true,
        vehicleId: 'honda-activa-6g',
        vehicleName: 'Honda Activa 6G',
        confidence: 0.88,
        features: ['BS6 Compliant', 'Silent Start', 'LED Headlamp'],
        message: 'Honda Activa 6G detected with 88% confidence'
      },
      {
        success: true,
        vehicleId: 'tvs-apache-rtr-160-4v',
        vehicleName: 'TVS Apache RTR 160 4V',
        confidence: 0.85,
        features: ['Race Dynamics', '4 Valve Engine', 'Dual Disc Brakes'],
        message: 'TVS Apache RTR 160 4V detected with 85% confidence'
      }
    ];

    const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];

    setTimeout(() => {
      setResult(randomResult);
      setState('success');
      onScanComplete?.(randomResult);
    }, 500);
  }, [onScanComplete]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setScanProgress(0);
    setState('idle');
  }, []);

  if (!isSupported) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <CameraOff className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="font-semibold mb-2">Camera Not Supported</h3>
        <p className="text-sm text-muted-foreground">
          Camera access is not available in your browser or device.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 relative overflow-hidden bg-black">
        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-muted"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Scan className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Scan Vehicle</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                Point your camera at a bike or scooter to identify it and get instant information.
              </p>
              <Button onClick={startCamera} size="lg">
                <Camera className="w-5 h-5 mr-2" />
                Start Scanning
              </Button>
              <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 rounded-full bg-card">Works offline</span>
                <span className="px-2 py-1 rounded-full bg-card">AI-powered</span>
              </div>
            </motion.div>
          )}

          {(state === 'scanning' || state === 'recognizing') && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />

              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />

                <div className="absolute inset-8 border-2 border-white/30 rounded-2xl">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />

                  <motion.div
                    className="absolute left-0 right-0 h-0.5 bg-primary shadow-lg shadow-primary/50"
                    animate={{
                      top: ['0%', '100%', '0%']
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                  />
                </div>

                <div className="absolute bottom-8 left-0 right-0 px-8">
                  <div className="bg-black/60 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm font-medium">
                        {state === 'scanning' ? 'Scanning...' : 'Analyzing...'}
                      </span>
                      <span className="text-white/80 text-sm">{scanProgress}%</span>
                    </div>
                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${scanProgress}%` }}
                        layoutId="progress"
                      />
                    </div>
                    {state === 'recognizing' && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-white/70">
                        <Zap className="w-3 h-3" />
                        <span>AI analyzing vehicle features...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button
                variant="destructive"
                size="icon"
                className="absolute top-4 right-4"
                onClick={stopCamera}
              >
                <CameraOff className="w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {state === 'success' && result && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-muted"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>

              <h3 className="font-semibold text-xl mb-1">{result.vehicleName}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {Math.round(result.confidence * 100)}% match confidence
              </p>

              {result.features && result.features.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {result.features.map((feature, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={reset}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Scan Again
                </Button>
                <Button
                  onClick={() => {
                    if (result.vehicleId) {
                      window.location.href = `/vehicles/${result.vehicleId}`;
                    }
                  }}
                >
                  View Details
                </Button>
              </div>
            </motion.div>
          )}

          {state === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-muted"
            >
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertCircle className="w-10 h-10 text-destructive" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Scan Failed</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">
                {error || 'Unable to scan. Please try again.'}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={reset}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 border-t bg-card">
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Scan className="w-4 h-4" />
            <span>AI Recognition</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>Works Offline</span>
          </div>
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            <span>Camera Required</span>
          </div>
        </div>
      </div>
    </div>
  );
}

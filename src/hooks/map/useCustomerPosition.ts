import { useState, useEffect, useCallback, useRef } from 'react';
import type { Vector2, CustomerPosition, StoreZone } from '@core/spatial/types';
import { CustomerSimulationEngine } from '@core/map-engine/SimulationEngine';

interface UseCustomerPositionOptions {
  startPosition?: Vector2;
  autoStart?: boolean;
  zones?: StoreZone[];
}

interface UseCustomerPositionReturn {
  position: CustomerPosition | null;
  currentZone: string | null;
  isMoving: boolean;
  pathProgress: number;
  
  moveTo: (target: Vector2, duration?: number) => void;
  followPath: (path: Vector2[], speed?: number) => void;
  teleportTo: (position: Vector2) => void;
  setAccuracy: (accuracy: number) => void;
  
  start: () => void;
  stop: () => void;
  
  simulateRSSI: () => { [beaconId: string]: number };
  getZoneHistory: () => Array<{
    fromZone: string | null;
    toZone: string | null;
    timestamp: number;
    entryPoint: Vector2;
  }>;
}

export const useCustomerPosition = (options: UseCustomerPositionOptions = {}): UseCustomerPositionReturn => {
  const { startPosition = { x: 0, y: 0 }, autoStart = true, zones = [] } = options;
  
  const engineRef = useRef<CustomerSimulationEngine | null>(null);
  const [position, setPosition] = useState<CustomerPosition | null>(null);
  const [currentZone, setCurrentZone] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [pathProgress, setPathProgress] = useState(0);

  if (!engineRef.current) {
    engineRef.current = new CustomerSimulationEngine(startPosition);
    engineRef.current.setZones(zones);
  }

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const unsubscribePosition = engine.on('positionUpdate', (pos) => {
      setPosition(pos);
      setIsMoving(pos.isMoving);
      setPathProgress(engine.getPathProgress());
    });

    const unsubscribeZoneEnter = engine.on('zoneEnter', ({ zone }) => {
      setCurrentZone(zone.id);
    });

    const unsubscribeZoneExit = engine.on('zoneExit', () => {
      setCurrentZone(null);
    });

    const unsubscribeMovementStart = engine.on('movementStart', () => {
      setIsMoving(true);
    });

    const unsubscribeMovementEnd = engine.on('movementEnd', () => {
      setIsMoving(false);
    });

    if (autoStart) {
      engine.start();
    }

    return () => {
      unsubscribePosition();
      unsubscribeZoneEnter();
      unsubscribeZoneExit();
      unsubscribeMovementStart();
      unsubscribeMovementEnd();
      engine.stop();
    };
  }, [autoStart]);

  useEffect(() => {
    engineRef.current?.setZones(zones);
  }, [zones]);

  const moveTo = useCallback((target: Vector2, duration?: number) => {
    engineRef.current?.moveTo(target, duration);
  }, []);

  const followPath = useCallback((path: Vector2[], speed?: number) => {
    engineRef.current?.followPath(path, speed);
  }, []);

  const teleportTo = useCallback((position: Vector2) => {
    engineRef.current?.teleportTo(position);
  }, []);

  const setAccuracy = useCallback((accuracy: number) => {
    engineRef.current?.setAccuracy(accuracy);
  }, []);

  const start = useCallback(() => {
    engineRef.current?.start();
  }, []);

  const stop = useCallback(() => {
    engineRef.current?.stop();
  }, []);

  const simulateRSSI = useCallback(() => {
    return engineRef.current?.simulateRSSI() || {};
  }, []);

  const getZoneHistory = useCallback(() => {
    return engineRef.current?.getZoneHistory() || [];
  }, []);

  return {
    position,
    currentZone,
    isMoving,
    pathProgress,
    moveTo,
    followPath,
    teleportTo,
    setAccuracy,
    start,
    stop,
    simulateRSSI,
    getZoneHistory
  };
};

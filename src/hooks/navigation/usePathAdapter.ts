import { useState, useCallback, useRef, useEffect } from 'react';
import type { Vector2 } from '@core/spatial/types';
import { PathAdaptationEngine, NavigationGraphEngine } from '@navigation/path-engine';
import type { 
  OptimizedRoute, 
  PathAdaptationState,
  RouteWaypoint,
  DeviationEvent
} from '@navigation/path-engine';

interface UsePathAdapterOptions {
  enableAutoRecalculation?: boolean;
  deviationThreshold?: number;
  maxRecalculations?: number;
}

interface UsePathAdapterReturn {
  adaptationState: PathAdaptationState;
  currentWaypoint: RouteWaypoint | null;
  remainingDistance: number;
  remainingTime: number;
  progress: number;
  deviationHistory: DeviationEvent[];
  
  setRoute: (route: OptimizedRoute) => void;
  updatePosition: (position: Vector2, heading: number) => void;
  skipWaypoint: () => boolean;
  getNextDestination: () => RouteWaypoint | null;
  getDistanceToNext: () => number;
  getTimeToNext: () => number;
  getCurrentInstruction: () => import('@navigation/path-engine').NavigationInstruction | null;
  getUpcomingInstructions: (count?: number) => import('@navigation/path-engine').NavigationInstruction[];
  recalculate: (position: Vector2) => void;
  reset: () => void;
}

export const usePathAdapter = (
  options: UsePathAdapterOptions = {}
): UsePathAdapterReturn => {
  const { 
    enableAutoRecalculation = true, 
    deviationThreshold = 5,
    maxRecalculations = 5
  } = options;

  const graphRef = useRef<NavigationGraphEngine | null>(null);
  const adapterRef = useRef<PathAdaptationEngine | null>(null);

  const [adaptationState, setAdaptationState] = useState<PathAdaptationState>({
    isDeviated: false,
    deviationDistance: 0,
    deviationAngle: 0,
    lastRecalculationTime: 0,
    recalculationCount: 0,
    suggestedAction: 'continue'
  });

  const [currentWaypoint, setCurrentWaypoint] = useState<RouteWaypoint | null>(null);
  const [remainingDistance, setRemainingDistance] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [deviationHistory, setDeviationHistory] = useState<DeviationEvent[]>([]);

  useEffect(() => {
    graphRef.current = new NavigationGraphEngine();
    adapterRef.current = new PathAdaptationEngine(graphRef.current, {
      deviationThreshold,
      maxRecalculations,
      enableAutoRecalculation
    });

    return () => {
      adapterRef.current?.reset();
    };
  }, [deviationThreshold, maxRecalculations, enableAutoRecalculation]);

  const setRoute = useCallback((route: OptimizedRoute) => {
    adapterRef.current?.setRoute(route);
    updateStateFromAdapter();
  }, []);

  const updatePosition = useCallback((position: Vector2, heading: number) => {
    const state = adapterRef.current?.updatePosition(position, heading);
    if (state) {
      setAdaptationState(state);
      updateStateFromAdapter();
    }
  }, []);

  const updateStateFromAdapter = useCallback(() => {
    if (!adapterRef.current) return;

    setCurrentWaypoint(adapterRef.current.getNextDestination());
    setRemainingDistance(adapterRef.current.getRemainingDistance());
    setRemainingTime(adapterRef.current.getRemainingTime());
    setProgress(adapterRef.current.getProgress());
    setDeviationHistory(adapterRef.current.getDeviationHistory());
  }, []);

  const skipWaypoint = useCallback(() => {
    const result = adapterRef.current?.skipCurrentWaypoint() || false;
    updateStateFromAdapter();
    return result;
  }, [updateStateFromAdapter]);

  const getNextDestination = useCallback(() => {
    return adapterRef.current?.getNextDestination() || null;
  }, []);

  const getDistanceToNext = useCallback(() => {
    return adapterRef.current?.getDistanceToNext() || 0;
  }, []);

  const getTimeToNext = useCallback(() => {
    return adapterRef.current?.getTimeToNext() || 0;
  }, []);

  const getCurrentInstruction = useCallback(() => {
    return adapterRef.current?.getCurrentInstruction() || null;
  }, []);

  const getUpcomingInstructions = useCallback((count = 3) => {
    return adapterRef.current?.getUpcomingInstructions(count) || [];
  }, []);

  const recalculate = useCallback((position: Vector2) => {
    updateStateFromAdapter();
  }, [updateStateFromAdapter]);

  const reset = useCallback(() => {
    adapterRef.current?.reset();
    setAdaptationState({
      isDeviated: false,
      deviationDistance: 0,
      deviationAngle: 0,
      lastRecalculationTime: 0,
      recalculationCount: 0,
      suggestedAction: 'continue'
    });
    setCurrentWaypoint(null);
    setRemainingDistance(0);
    setRemainingTime(0);
    setProgress(0);
    setDeviationHistory([]);
  }, []);

  return {
    adaptationState,
    currentWaypoint,
    remainingDistance,
    remainingTime,
    progress,
    deviationHistory,
    setRoute,
    updatePosition,
    skipWaypoint,
    getNextDestination,
    getDistanceToNext,
    getTimeToNext,
    getCurrentInstruction,
    getUpcomingInstructions,
    recalculate,
    reset
  };
};

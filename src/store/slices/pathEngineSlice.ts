import type { StateCreator } from 'zustand';
import type {
  OptimizedRoute,
  RouteWaypoint,
  RouteSegment,
  ShoppingMode,
  PathAlgorithm,
  PathAdaptationState,
  RouteMetrics,
  DeviationEvent
} from '@navigation/path-engine';

export interface PathEngineSlice {
  route: OptimizedRoute | null;
  isCalculating: boolean;
  calculationProgress: number;
  routeAlternatives: OptimizedRoute[];
  selectedRouteIndex: number;
  
  waypoints: RouteWaypoint[];
  completedWaypoints: string[];
  currentWaypointIndex: number;
  
  segments: RouteSegment[];
  currentSegmentIndex: number;
  
  totalDistance: number;
  remainingDistance: number;
  estimatedTime: number;
  remainingTime: number;
  
  shoppingMode: ShoppingMode;
  algorithm: PathAlgorithm;
  
  adaptationState: PathAdaptationState;
  deviationHistory: DeviationEvent[];
  
  recalculationCount: number;
  lastRecalculationTime: number;
  
  metrics: RouteMetrics | null;
  
  setRoute: (route: OptimizedRoute | null) => void;
  setRouteAlternatives: (alternatives: OptimizedRoute[]) => void;
  selectAlternativeRoute: (index: number) => void;
  
  startCalculation: () => void;
  updateCalculationProgress: (progress: number) => void;
  finishCalculation: () => void;
  setCalculationError: (error: string | null) => void;
  
  setShoppingMode: (mode: ShoppingMode) => void;
  setAlgorithm: (algorithm: PathAlgorithm) => void;
  
  completeWaypoint: (waypointId: string) => void;
  skipWaypoint: (waypointId: string) => void;
  setCurrentWaypointIndex: (index: number) => void;
  
  updateSegmentProgress: (segmentIndex: number, progress: number) => void;
  completeSegment: (segmentIndex: number) => void;
  
  updateAdaptationState: (state: PathAdaptationState) => void;
  addDeviationEvent: (event: DeviationEvent) => void;
  
  recordRecalculation: () => void;
  
  updateMetrics: (metrics: RouteMetrics) => void;
  
  updateRemainingDistance: (distance: number) => void;
  updateRemainingTime: (time: number) => void;
  
  exportRoute: () => string | null;
  importRoute: (data: string) => boolean;
  
  resetRoute: () => void;
  clearRoute: () => void;
}

const initialAdaptationState: PathAdaptationState = {
  isDeviated: false,
  deviationDistance: 0,
  deviationAngle: 0,
  lastRecalculationTime: 0,
  recalculationCount: 0,
  suggestedAction: 'continue'
};

const initialState = {
  route: null as OptimizedRoute | null,
  isCalculating: false,
  calculationProgress: 0,
  routeAlternatives: [] as OptimizedRoute[],
  selectedRouteIndex: 0,
  
  waypoints: [] as RouteWaypoint[],
  completedWaypoints: [] as string[],
  currentWaypointIndex: 0,
  
  segments: [] as RouteSegment[],
  currentSegmentIndex: 0,
  
  totalDistance: 0,
  remainingDistance: 0,
  estimatedTime: 0,
  remainingTime: 0,
  
  shoppingMode: 'quick-buy' as ShoppingMode,
  algorithm: 'astar' as PathAlgorithm,
  
  adaptationState: initialAdaptationState,
  deviationHistory: [] as DeviationEvent[],
  
  recalculationCount: 0,
  lastRecalculationTime: 0,
  
  metrics: null as RouteMetrics | null
};

export const createPathEngineSlice: StateCreator<PathEngineSlice> = (set, get) => ({
  ...initialState,
  
  setRoute: (route) => {
    set({
      route,
      waypoints: route?.waypoints || [],
      segments: route?.segments || [],
      totalDistance: route?.totalDistance || 0,
      estimatedTime: route?.totalTime || 0,
      remainingDistance: route?.totalDistance || 0,
      remainingTime: route?.totalTime || 0,
      currentWaypointIndex: 0,
      currentSegmentIndex: 0,
      completedWaypoints: []
    });
  },
  
  setRouteAlternatives: (alternatives) => {
    set({ routeAlternatives: alternatives });
  },
  
  selectAlternativeRoute: (index) => {
    const { routeAlternatives } = get();
    if (index >= 0 && index < routeAlternatives.length) {
      set({
        selectedRouteIndex: index,
        route: routeAlternatives[index]
      });
    }
  },
  
  startCalculation: () => {
    set({
      isCalculating: true,
      calculationProgress: 0
    });
  },
  
  updateCalculationProgress: (progress) => {
    set({ calculationProgress: Math.min(100, progress) });
  },
  
  finishCalculation: () => {
    set({
      isCalculating: false,
      calculationProgress: 100
    });
  },
  
  setCalculationError: (error) => {
    set({
      isCalculating: false,
      calculationProgress: 0
    });
  },
  
  setShoppingMode: (mode) => {
    set({ shoppingMode: mode });
  },
  
  setAlgorithm: (algorithm) => {
    set({ algorithm });
  },
  
  completeWaypoint: (waypointId) => {
    set(state => ({
      completedWaypoints: [...state.completedWaypoints, waypointId]
    }));
  },
  
  skipWaypoint: (waypointId) => {
    set(state => ({
      waypoints: state.waypoints.map(wp =>
        wp.id === waypointId ? { ...wp, skipped: true } : wp
      )
    }));
  },
  
  setCurrentWaypointIndex: (index) => {
    set({ currentWaypointIndex: index });
  },
  
  updateSegmentProgress: (segmentIndex, progress) => {
    set(state => ({
      segments: state.segments.map((seg, idx) =>
        idx === segmentIndex ? { ...seg, progress } : seg
      )
    }));
  },
  
  completeSegment: (segmentIndex) => {
    set(state => ({
      segments: state.segments.map((seg, idx) =>
        idx === segmentIndex ? { ...seg, completed: true } : seg
      )
    }));
  },
  
  updateAdaptationState: (adaptationState) => {
    set({ adaptationState });
  },
  
  addDeviationEvent: (event) => {
    set(state => ({
      deviationHistory: [...state.deviationHistory, event]
    }));
  },
  
  recordRecalculation: () => {
    set(state => ({
      recalculationCount: state.recalculationCount + 1,
      lastRecalculationTime: Date.now()
    }));
  },
  
  updateMetrics: (metrics) => {
    set({ metrics });
  },
  
  updateRemainingDistance: (distance) => {
    set({ remainingDistance: distance });
  },
  
  updateRemainingTime: (time) => {
    set({ remainingTime: time });
  },
  
  exportRoute: () => {
    const { route } = get();
    if (!route) return null;
    return JSON.stringify(route);
  },
  
  importRoute: (data) => {
    try {
      const importedRoute: OptimizedRoute = JSON.parse(data);
      get().setRoute(importedRoute);
      return true;
    } catch {
      return false;
    }
  },
  
  resetRoute: () => {
    set({
      currentWaypointIndex: 0,
      currentSegmentIndex: 0,
      completedWaypoints: [],
      remainingDistance: get().totalDistance,
      remainingTime: get().estimatedTime,
      adaptationState: initialAdaptationState,
      deviationHistory: [],
      recalculationCount: 0,
      lastRecalculationTime: 0
    });
  },
  
  clearRoute: () => {
    set({
      ...initialState,
      shoppingMode: get().shoppingMode,
      algorithm: get().algorithm
    });
  }
});

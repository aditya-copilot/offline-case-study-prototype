import { useState, useCallback, useEffect, useRef } from 'react';
import type { Vector2 } from '@core/spatial/types';
import type { OptimizedRoute, PathAdaptationState, DeviationEvent } from '@navigation/path-engine';

interface UseRouteDeviationOptions {
  route: OptimizedRoute | null;
  currentPosition: Vector2 | null;
  heading: number;
  onDeviation?: (state: PathAdaptationState) => void;
  onRecalculationNeeded?: () => void;
  deviationThreshold?: number;
  angleThreshold?: number;
}

interface UseRouteDeviationReturn {
  adaptationState: PathAdaptationState;
  deviationHistory: DeviationEvent[];
  isDeviated: boolean;
  suggestedAction: string;
  distanceOffRoute: number;
  angleDeviation: number;
  resetDeviation: () => void;
  forceRecalculation: () => void;
}

export const useRouteDeviation = (options: UseRouteDeviationOptions): UseRouteDeviationReturn => {
  const {
    route,
    currentPosition,
    heading,
    onDeviation,
    onRecalculationNeeded,
    deviationThreshold = 5,
    angleThreshold = 45
  } = options;

  const [adaptationState, setAdaptationState] = useState<PathAdaptationState>({
    isDeviated: false,
    deviationDistance: 0,
    deviationAngle: 0,
    lastRecalculationTime: 0,
    recalculationCount: 0,
    suggestedAction: 'continue'
  });

  const [deviationHistory, setDeviationHistory] = useState<DeviationEvent[]>([]);
  const lastRecalculationTime = useRef(0);
  const recalculationCount = useRef(0);

  useEffect(() => {
    if (!currentPosition || !route || route.segments.length === 0) return;

    const currentSegment = route.segments[0];
    const path = currentSegment.path;
    
    if (path.length < 2) return;

    const nearestPoint = findNearestPointOnPath(currentPosition, path);
    const distanceOffRoute = Math.sqrt(
      Math.pow(currentPosition.x - nearestPoint.x, 2) +
      Math.pow(currentPosition.y - nearestPoint.y, 2)
    );

    const expectedHeading = calculateExpectedHeading(nearestPoint, path);
    const angleDeviation = Math.abs(heading - expectedHeading);
    const normalizedAngleDeviation = angleDeviation > 180 ? 360 - angleDeviation : angleDeviation;

    const isDeviated = distanceOffRoute > deviationThreshold || normalizedAngleDeviation > angleThreshold;

    const newState: PathAdaptationState = {
      isDeviated,
      deviationDistance: distanceOffRoute,
      deviationAngle: normalizedAngleDeviation,
      lastRecalculationTime: lastRecalculationTime.current,
      recalculationCount: recalculationCount.current,
      suggestedAction: determineAction(isDeviated, distanceOffRoute, normalizedAngleDeviation)
    };

    setAdaptationState(newState);

    if (isDeviated && !adaptationState.isDeviated) {
      const event: DeviationEvent = {
        id: `dev-${Date.now()}`,
        timestamp: Date.now(),
        expectedPosition: nearestPoint,
        actualPosition: currentPosition,
        deviationDistance: distanceOffRoute,
        deviationAngle: normalizedAngleDeviation,
        routeSegmentIndex: 0,
        actionTaken: 'detected'
      };
      
      setDeviationHistory(prev => [...prev, event]);
      onDeviation?.(newState);

      if (shouldAutoRecalculate(distanceOffRoute, normalizedAngleDeviation)) {
        onRecalculationNeeded?.();
      }
    }
  }, [currentPosition, route, heading, deviationThreshold, angleThreshold]);

  const findNearestPointOnPath = (position: Vector2, path: Array<{ position: Vector2 }>): Vector2 => {
    let minDistance = Infinity;
    let nearestPoint = path[0].position;

    for (let i = 0; i < path.length - 1; i++) {
      const start = path[i].position;
      const end = path[i + 1].position;
      const point = projectPointOnSegment(position, start, end);
      const distance = Math.sqrt(
        Math.pow(position.x - point.x, 2) +
        Math.pow(position.y - point.y, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    }

    return nearestPoint;
  };

  const projectPointOnSegment = (point: Vector2, start: Vector2, end: Vector2): Vector2 => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) return start;

    let t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));

    return {
      x: start.x + t * dx,
      y: start.y + t * dy
    };
  };

  const calculateExpectedHeading = (position: Vector2, path: Array<{ position: Vector2 }>): number => {
    let minDistance = Infinity;
    let nearestIndex = 0;

    for (let i = 0; i < path.length; i++) {
      const distance = Math.sqrt(
        Math.pow(position.x - path[i].position.x, 2) +
        Math.pow(position.y - path[i].position.y, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }

    if (nearestIndex >= path.length - 1) {
      const last = path[path.length - 1].position;
      const prev = path[path.length - 2].position;
      return Math.atan2(last.y - prev.y, last.x - prev.x) * (180 / Math.PI);
    }

    const current = path[nearestIndex].position;
    const next = path[nearestIndex + 1].position;
    return Math.atan2(next.y - current.y, next.x - current.x) * (180 / Math.PI);
  };

  const determineAction = (
    isDeviated: boolean,
    distance: number,
    angle: number
  ): PathAdaptationState['suggestedAction'] => {
    if (!isDeviated) return 'continue';
    if (distance > deviationThreshold * 3) return 'reroute';
    if (distance > deviationThreshold * 1.5 || angle > angleThreshold * 1.5) return 'recalculate';
    return 'continue';
  };

  const shouldAutoRecalculate = (distance: number, angle: number): boolean => {
    const now = Date.now();
    const timeSinceLastRecalculation = now - lastRecalculationTime.current;
    
    if (timeSinceLastRecalculation < 5000) return false;
    if (recalculationCount.current >= 5) return false;
    
    return distance > deviationThreshold * 2 || angle > angleThreshold * 2;
  };

  const resetDeviation = useCallback(() => {
    setAdaptationState({
      isDeviated: false,
      deviationDistance: 0,
      deviationAngle: 0,
      lastRecalculationTime: 0,
      recalculationCount: 0,
      suggestedAction: 'continue'
    });
    setDeviationHistory([]);
    lastRecalculationTime.current = 0;
    recalculationCount.current = 0;
  }, []);

  const forceRecalculation = useCallback(() => {
    lastRecalculationTime.current = Date.now();
    recalculationCount.current++;
    onRecalculationNeeded?.();
  }, [onRecalculationNeeded]);

  return {
    adaptationState,
    deviationHistory,
    isDeviated: adaptationState.isDeviated,
    suggestedAction: adaptationState.suggestedAction,
    distanceOffRoute: adaptationState.deviationDistance,
    angleDeviation: adaptationState.deviationAngle,
    resetDeviation,
    forceRecalculation
  };
};

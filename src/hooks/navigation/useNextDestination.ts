import { useState, useCallback, useEffect } from 'react';
import type { Vector2 } from '@core/spatial/types';
import type { RouteWaypoint, OptimizedRoute } from '@navigation/path-engine';

interface UseNextDestinationOptions {
  route: OptimizedRoute | null;
  currentPosition: Vector2 | null;
  autoAdvance?: boolean;
  arrivalThreshold?: number;
}

interface UseNextDestinationReturn {
  nextDestination: RouteWaypoint | null;
  remainingDistance: number;
  estimatedTime: number;
  direction: number;
  isAtDestination: boolean;
  markReached: () => void;
  skipDestination: () => void;
  getDirectionToNext: () => string;
}

export const useNextDestination = (options: UseNextDestinationOptions): UseNextDestinationReturn => {
  const { 
    route, 
    currentPosition, 
    autoAdvance = true, 
    arrivalThreshold = 3 
  } = options;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingDistance, setRemainingDistance] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isAtDestination, setIsAtDestination] = useState(false);

  const nextDestination = route && currentIndex < route.waypoints.length
    ? route.waypoints[currentIndex]
    : null;

  useEffect(() => {
    if (!currentPosition || !nextDestination) {
      setRemainingDistance(0);
      setEstimatedTime(0);
      return;
    }

    const dx = nextDestination.position.x - currentPosition.x;
    const dy = nextDestination.position.y - currentPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    setRemainingDistance(distance);
    setEstimatedTime(distance / 1.4);
    setDirection(Math.atan2(dy, dx) * (180 / Math.PI));

    const atDestination = distance < arrivalThreshold;
    setIsAtDestination(atDestination);

    if (atDestination && autoAdvance) {
      markReached();
    }
  }, [currentPosition, nextDestination, arrivalThreshold, autoAdvance]);

  const markReached = useCallback(() => {
    if (!route || currentIndex >= route.waypoints.length) return;

    route.waypoints[currentIndex].completed = true;
    route.waypoints[currentIndex].completedAt = Date.now();
    
    setCurrentIndex(prev => prev + 1);
    setIsAtDestination(false);
  }, [route, currentIndex]);

  const skipDestination = useCallback(() => {
    if (!route || currentIndex >= route.waypoints.length) return;

    route.waypoints[currentIndex].skipped = true;
    setCurrentIndex(prev => prev + 1);
    setIsAtDestination(false);
  }, [route, currentIndex]);

  const getDirectionToNext = useCallback((): string => {
    if (!currentPosition || !nextDestination) return 'Unknown';

    const dx = nextDestination.position.x - currentPosition.x;
    const dy = nextDestination.position.y - currentPosition.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    if (angle > -22.5 && angle <= 22.5) return 'East';
    if (angle > 22.5 && angle <= 67.5) return 'Northeast';
    if (angle > 67.5 && angle <= 112.5) return 'North';
    if (angle > 112.5 && angle <= 157.5) return 'Northwest';
    if (angle > 157.5 || angle <= -157.5) return 'West';
    if (angle > -157.5 && angle <= -112.5) return 'Southwest';
    if (angle > -112.5 && angle <= -67.5) return 'South';
    return 'Southeast';
  }, [currentPosition, nextDestination]);

  return {
    nextDestination,
    remainingDistance,
    estimatedTime,
    direction,
    isAtDestination,
    markReached,
    skipDestination,
    getDirectionToNext
  };
};

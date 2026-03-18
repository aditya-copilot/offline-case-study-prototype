import { useState, useCallback, useEffect } from 'react';
import type { NavigationPath, NavigationNode, Vector2 } from '@core/spatial/types';
import { useStoreGraph } from './useStoreGraph';

interface UseNavigationPathOptions {
  autoCalculate?: boolean;
  startNodeId?: string;
  endNodeId?: string;
  waypoints?: string[];
}

interface UseNavigationPathReturn {
  path: NavigationPath | null;
  isCalculating: boolean;
  error: Error | null;
  progress: number;
  currentSegment: number;
  
  calculatePath: (start: string, end: string) => void;
  calculateMultiStop: (stops: string[]) => void;
  calculateFromPosition: (position: Vector2, destination: string) => void;
  clearPath: () => void;
  
  updateProgress: (position: Vector2) => void;
  getNextInstruction: () => string | null;
  getDistanceRemaining: () => number;
  getTimeRemaining: () => number;
}

export const useNavigationPath = (options: UseNavigationPathOptions = {}): UseNavigationPathReturn => {
  const { autoCalculate = false, startNodeId, endNodeId, waypoints } = options;
  const { findPath, findMultiStopPath, findNearestNode, graph } = useStoreGraph({ autoLoad: false });
  
  const [path, setPath] = useState<NavigationPath | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentSegment, setCurrentSegment] = useState(0);

  useEffect(() => {
    if (autoCalculate) {
      if (waypoints && waypoints.length > 1) {
        calculateMultiStop(waypoints);
      } else if (startNodeId && endNodeId) {
        calculatePath(startNodeId, endNodeId);
      }
    }
  }, [autoCalculate, startNodeId, endNodeId, waypoints]);

  const calculatePath = useCallback((start: string, end: string) => {
    setIsCalculating(true);
    setError(null);
    
    try {
      const newPath = findPath(start, end);
      setPath(newPath);
      setProgress(0);
      setCurrentSegment(0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to calculate path'));
    } finally {
      setIsCalculating(false);
    }
  }, [findPath]);

  const calculateMultiStop = useCallback((stops: string[]) => {
    setIsCalculating(true);
    setError(null);
    
    try {
      const newPath = findMultiStopPath(stops);
      setPath(newPath);
      setProgress(0);
      setCurrentSegment(0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to calculate multi-stop path'));
    } finally {
      setIsCalculating(false);
    }
  }, [findMultiStopPath]);

  const calculateFromPosition = useCallback((position: Vector2, destination: string) => {
    setIsCalculating(true);
    setError(null);
    
    try {
      const nearestNode = findNearestNode(position);
      if (!nearestNode) {
        setError(new Error('Could not find nearest node'));
        return;
      }
      
      const newPath = findPath(nearestNode.id, destination);
      setPath(newPath);
      setProgress(0);
      setCurrentSegment(0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to calculate path from position'));
    } finally {
      setIsCalculating(false);
    }
  }, [findNearestNode, findPath]);

  const clearPath = useCallback(() => {
    setPath(null);
    setProgress(0);
    setCurrentSegment(0);
    setError(null);
  }, []);

  const updateProgress = useCallback((position: Vector2) => {
    if (!path) return;

    let minDistance = Infinity;
    let closestSegment = 0;
    let segmentProgress = 0;

    for (let i = 0; i < path.segments.length; i++) {
      const segment = path.segments[i];
      const distance = distanceToSegment(position, segment.from, segment.to);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestSegment = i;
        
        const totalDist = Math.sqrt(
          Math.pow(segment.to.x - segment.from.x, 2) +
          Math.pow(segment.to.y - segment.from.y, 2)
        );
        const distToFrom = Math.sqrt(
          Math.pow(position.x - segment.from.x, 2) +
          Math.pow(position.y - segment.from.y, 2)
        );
        segmentProgress = totalDist > 0 ? distToFrom / totalDist : 0;
      }
    }

    setCurrentSegment(closestSegment);
    const totalProgress = (closestSegment + segmentProgress) / path.segments.length;
    setProgress(Math.min(1, totalProgress));
  }, [path]);

  const getNextInstruction = useCallback(() => {
    if (!path || currentSegment >= path.segments.length) return null;
    return path.segments[currentSegment].instruction || null;
  }, [path, currentSegment]);

  const getDistanceRemaining = useCallback(() => {
    if (!path) return 0;
    
    let remaining = 0;
    for (let i = currentSegment; i < path.segments.length; i++) {
      remaining += path.segments[i].distance;
    }
    return remaining;
  }, [path, currentSegment]);

  const getTimeRemaining = useCallback(() => {
    const distance = getDistanceRemaining();
    const walkingSpeed = 1.4;
    return distance / walkingSpeed;
  }, [getDistanceRemaining]);

  return {
    path,
    isCalculating,
    error,
    progress,
    currentSegment,
    calculatePath,
    calculateMultiStop,
    calculateFromPosition,
    clearPath,
    updateProgress,
    getNextInstruction,
    getDistanceRemaining,
    getTimeRemaining
  };
};

function distanceToSegment(point: Vector2, lineStart: Vector2, lineEnd: Vector2): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSq = dx * dx + dy * dy;
  
  if (lengthSq === 0) {
    return Math.sqrt(Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2));
  }
  
  let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  
  const projection = {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy
  };
  
  return Math.sqrt(Math.pow(point.x - projection.x, 2) + Math.pow(point.y - projection.y, 2));
}

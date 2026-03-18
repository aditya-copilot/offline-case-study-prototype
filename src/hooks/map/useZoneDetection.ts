import { useState, useEffect, useCallback } from 'react';
import type { Vector2, StoreZone, ZoneDetectionResult } from '@core/spatial/types';
import { calculateDistance } from '@core/utils';

interface UseZoneDetectionOptions {
  zones: StoreZone[];
  position: Vector2 | null;
  detectionRadius?: number;
}

interface UseZoneDetectionReturn {
  currentZone: StoreZone | null;
  isInsideZone: boolean;
  distanceToNearestZone: number;
  nearestEntryPoint: Vector2 | null;
  nearbyZones: Array<{ zone: StoreZone; distance: number }>;
  
  detectZone: (position: Vector2) => ZoneDetectionResult;
  getZonesInRadius: (position: Vector2, radius: number) => StoreZone[];
  getDistanceToZone: (position: Vector2, zoneId: string) => number | null;
}

export const useZoneDetection = (options: UseZoneDetectionOptions): UseZoneDetectionReturn => {
  const { zones, position, detectionRadius = 50 } = options;
  
  const [currentZone, setCurrentZone] = useState<StoreZone | null>(null);
  const [isInsideZone, setIsInsideZone] = useState(false);
  const [distanceToNearestZone, setDistanceToNearestZone] = useState(Infinity);
  const [nearestEntryPoint, setNearestEntryPoint] = useState<Vector2 | null>(null);
  const [nearbyZones, setNearbyZones] = useState<Array<{ zone: StoreZone; distance: number }>>([]);

  useEffect(() => {
    if (position) {
      const result = detectZone(position);
      setCurrentZone(result.zone);
      setIsInsideZone(result.isInside);
      setDistanceToNearestZone(result.distance);
      setNearestEntryPoint(result.entryPoint);
      
      const nearby = getZonesInRadius(position, detectionRadius).map(zone => ({
        zone,
        distance: getDistanceToZoneBoundary(position, zone)
      }));
      setNearbyZones(nearby.sort((a, b) => a.distance - b.distance));
    }
  }, [position, zones, detectionRadius]);

  const detectZone = useCallback((position: Vector2): ZoneDetectionResult => {
    for (const zone of zones) {
      const isInside =
        position.x >= zone.bounds.min.x &&
        position.x <= zone.bounds.max.x &&
        position.y >= zone.bounds.min.y &&
        position.y <= zone.bounds.max.y;

      if (isInside) {
        return {
          zone,
          distance: 0,
          entryPoint: getNearestEntryPoint(position, zone),
          isInside: true,
          confidence: 1
        };
      }
    }

    let nearestZone: StoreZone | null = null;
    let minDistance = Infinity;
    let bestEntryPoint: Vector2 | null = null;

    for (const zone of zones) {
      const distance = getDistanceToZoneBoundary(position, zone);
      const entryPoint = getNearestEntryPoint(position, zone);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestZone = zone;
        bestEntryPoint = entryPoint;
      }
    }

    return {
      zone: nearestZone,
      distance: minDistance,
      entryPoint: bestEntryPoint,
      isInside: false,
      confidence: Math.max(0, 1 - minDistance / detectionRadius)
    };
  }, [zones, detectionRadius]);

  const getZonesInRadius = useCallback((position: Vector2, radius: number): StoreZone[] => {
    return zones.filter(zone => {
      const distance = getDistanceToZoneBoundary(position, zone);
      return distance <= radius;
    });
  }, [zones]);

  const getDistanceToZone = useCallback((position: Vector2, zoneId: string): number | null => {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return null;
    return getDistanceToZoneBoundary(position, zone);
  }, [zones]);

  return {
    currentZone,
    isInsideZone,
    distanceToNearestZone,
    nearestEntryPoint,
    nearbyZones,
    detectZone,
    getZonesInRadius,
    getDistanceToZone
  };
};

function getDistanceToZoneBoundary(position: Vector2, zone: StoreZone): number {
  const centerX = (zone.bounds.min.x + zone.bounds.max.x) / 2;
  const centerY = (zone.bounds.min.y + zone.bounds.max.y) / 2;
  
  const dx = Math.max(
    zone.bounds.min.x - position.x,
    0,
    position.x - zone.bounds.max.x
  );
  const dy = Math.max(
    zone.bounds.min.y - position.y,
    0,
    position.y - zone.bounds.max.y
  );
  
  if (dx === 0 && dy === 0) {
    const distToCenter = calculateDistance(position.x, position.y, centerX, centerY);
    const halfWidth = (zone.bounds.max.x - zone.bounds.min.x) / 2;
    const halfHeight = (zone.bounds.max.y - zone.bounds.min.y) / 2;
    const radius = Math.min(halfWidth, halfHeight);
    return Math.max(0, radius - distToCenter);
  }
  
  return Math.sqrt(dx * dx + dy * dy);
}

function getNearestEntryPoint(position: Vector2, zone: StoreZone): Vector2 | null {
  if (zone.entryPoints && zone.entryPoints.length > 0) {
    let nearest = zone.entryPoints[0];
    let minDist = Infinity;
    
    for (const entry of zone.entryPoints) {
      const dist = calculateDistance(position.x, position.y, entry.x, entry.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = entry;
      }
    }
    
    return nearest;
  }
  
  const centerX = (zone.bounds.min.x + zone.bounds.max.x) / 2;
  const centerY = (zone.bounds.min.y + zone.bounds.max.y) / 2;
  
  let nearestX = centerX;
  let nearestY = centerY;
  
  if (position.x < zone.bounds.min.x) nearestX = zone.bounds.min.x;
  else if (position.x > zone.bounds.max.x) nearestX = zone.bounds.max.x;
  else nearestX = position.x;
  
  if (position.y < zone.bounds.min.y) nearestY = zone.bounds.min.y;
  else if (position.y > zone.bounds.max.y) nearestY = zone.bounds.max.y;
  else nearestY = position.y;
  
  return { x: nearestX, y: nearestY };
}

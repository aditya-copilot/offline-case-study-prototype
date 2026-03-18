import { useState, useCallback, useRef, useEffect } from 'react';
import type { Vector2, BoundingBox, MapCamera, EasingFunction } from '@core/spatial/types';
import { MapCameraController } from '@core/map-engine/MapCamera';

interface UseMapCameraOptions {
  initialPosition?: Vector2;
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  bounds?: BoundingBox;
  inertia?: boolean;
}

interface UseMapCameraReturn {
  camera: MapCamera;
  position: Vector2;
  zoom: number;
  isDragging: boolean;
  
  worldToScreen: (worldPos: Vector2) => Vector2;
  screenToWorld: (screenPos: Vector2) => Vector2;
  
  pan: (delta: Vector2) => void;
  zoom: (factor: number, center?: Vector2) => void;
  zoomTo: (targetZoom: number, duration?: number, easing?: EasingFunction) => void;
  moveTo: (target: Vector2, duration?: number, easing?: EasingFunction) => void;
  fitToBounds: (bounds: BoundingBox, viewportWidth: number, viewportHeight: number, padding?: number) => void;
  
  startDrag: (pointerPosition: Vector2) => void;
  drag: (pointerPosition: Vector2) => void;
  endDrag: () => void;
  
  reset: () => void;
  
  getVisibleBounds: (viewportWidth: number, viewportHeight: number) => BoundingBox;
}

export const useMapCamera = (options: UseMapCameraOptions = {}): UseMapCameraReturn => {
  const {
    initialPosition = { x: 0, y: 0 },
    initialZoom = 1,
    minZoom = 0.1,
    maxZoom = 5,
    bounds,
    inertia = true
  } = options;

  const controllerRef = useRef<MapCameraController | null>(null);
  const [camera, setCamera] = useState<MapCamera>({
    position: initialPosition,
    zoom: initialZoom,
    rotation: 0
  });
  const [isDragging, setIsDragging] = useState(false);
  const animationFrameRef = useRef<number | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = new MapCameraController(initialPosition, initialZoom);
    controllerRef.current.setZoomLimits(minZoom, maxZoom);
    controllerRef.current.setInertia(inertia);
    if (bounds) {
      controllerRef.current.setBounds(bounds);
    }
  }

  useEffect(() => {
    const update = () => {
      controllerRef.current?.update(16);
      setCamera(controllerRef.current!.getState());
      animationFrameRef.current = requestAnimationFrame(update);
    };

    animationFrameRef.current = requestAnimationFrame(update);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const worldToScreen = useCallback((worldPos: Vector2): Vector2 => {
    return controllerRef.current!.worldToScreen(worldPos, window.innerWidth, window.innerHeight);
  }, []);

  const screenToWorld = useCallback((screenPos: Vector2): Vector2 => {
    return controllerRef.current!.screenToWorld(screenPos, window.innerWidth, window.innerHeight);
  }, []);

  const handlePan = useCallback((delta: Vector2) => {
    controllerRef.current!.pan(delta);
  }, []);

  const handleZoom = useCallback((factor: number, center?: Vector2) => {
    controllerRef.current!.zoom(factor, center);
  }, []);

  const zoomTo = useCallback((targetZoom: number, duration = 300, easing: EasingFunction = 'easeOut') => {
    controllerRef.current!.zoomTo(targetZoom, duration, easing);
  }, []);

  const moveTo = useCallback((target: Vector2, duration = 500, easing: EasingFunction = 'easeOut') => {
    controllerRef.current!.moveTo(target, duration, easing);
  }, []);

  const fitToBounds = useCallback((bounds: BoundingBox, viewportWidth: number, viewportHeight: number, padding = 50) => {
    controllerRef.current!.fitToBounds(bounds, viewportWidth, viewportHeight, padding);
  }, []);

  const startDrag = useCallback((pointerPosition: Vector2) => {
    controllerRef.current!.startDrag(pointerPosition);
    setIsDragging(true);
  }, []);

  const drag = useCallback((pointerPosition: Vector2) => {
    controllerRef.current!.drag(pointerPosition);
  }, []);

  const endDrag = useCallback(() => {
    controllerRef.current!.endDrag();
    setIsDragging(false);
  }, []);

  const reset = useCallback(() => {
    controllerRef.current!.reset();
  }, []);

  const getVisibleBounds = useCallback((viewportWidth: number, viewportHeight: number): BoundingBox => {
    return controllerRef.current!.getVisibleBounds(viewportWidth, viewportHeight);
  }, []);

  return {
    camera,
    position: camera.position,
    zoom: camera.zoom,
    isDragging,
    worldToScreen,
    screenToWorld,
    pan: handlePan,
    zoom: handleZoom,
    zoomTo,
    moveTo,
    fitToBounds,
    startDrag,
    drag,
    endDrag,
    reset,
    getVisibleBounds
  };
};

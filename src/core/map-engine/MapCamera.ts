import type { Vector2, BoundingBox, MapCamera, EasingFunction } from '@core/spatial/types';
import { lerp, clamp } from '@core/utils';

interface CameraAnimation {
  targetPosition: Vector2;
  targetZoom: number;
  duration: number;
  easing: EasingFunction;
  startTime: number;
  startPosition: Vector2;
  startZoom: number;
}

const easingFunctions: Record<EasingFunction, (t: number) => number> = {
  linear: t => t,
  easeIn: t => t * t,
  easeOut: t => 1 - (1 - t) * (1 - t),
  easeInOut: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  spring: t => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  bounce: t => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }
};

export class MapCameraController {
  private camera: MapCamera;
  private bounds: BoundingBox | null = null;
  private minZoom: number = 0.1;
  private maxZoom: number = 5;
  private animation: CameraAnimation | null = null;
  private velocity: Vector2 = { x: 0, y: 0 };
  private isDragging = false;
  private lastPointerPosition: Vector2 | null = null;
  private inertiaEnabled = true;
  private friction = 0.9;

  constructor(
    initialPosition: Vector2 = { x: 0, y: 0 },
    initialZoom: number = 1
  ) {
    this.camera = {
      position: { ...initialPosition },
      zoom: initialZoom,
      rotation: 0
    };
  }

  getState(): MapCamera {
    return { ...this.camera };
  }

  setBounds(bounds: BoundingBox): void {
    this.bounds = bounds;
    this.constrainToBounds();
  }

  setZoomLimits(min: number, max: number): void {
    this.minZoom = min;
    this.maxZoom = max;
    this.camera.zoom = clamp(this.camera.zoom, min, max);
  }

  setInertia(enabled: boolean): void {
    this.inertiaEnabled = enabled;
  }

  worldToScreen(worldPos: Vector2, viewportWidth: number, viewportHeight: number): Vector2 {
    return {
      x: (worldPos.x - this.camera.position.x) * this.camera.zoom + viewportWidth / 2,
      y: (worldPos.y - this.camera.position.y) * this.camera.zoom + viewportHeight / 2
    };
  }

  screenToWorld(screenPos: Vector2, viewportWidth: number, viewportHeight: number): Vector2 {
    return {
      x: (screenPos.x - viewportWidth / 2) / this.camera.zoom + this.camera.position.x,
      y: (screenPos.y - viewportHeight / 2) / this.camera.zoom + this.camera.position.y
    };
  }

  pan(delta: Vector2): void {
    this.camera.position.x -= delta.x / this.camera.zoom;
    this.camera.position.y -= delta.y / this.camera.zoom;
    
    if (this.inertiaEnabled) {
      this.velocity = {
        x: -delta.x * 0.1,
        y: -delta.y * 0.1
      };
    }
    
    this.constrainToBounds();
  }

  zoom(factor: number, center?: Vector2): void {
    const oldZoom = this.camera.zoom;
    const newZoom = clamp(oldZoom * factor, this.minZoom, this.maxZoom);
    
    if (center && newZoom !== oldZoom) {
      const zoomRatio = newZoom / oldZoom;
      this.camera.position.x = center.x - (center.x - this.camera.position.x) / zoomRatio;
      this.camera.position.y = center.y - (center.y - this.camera.position.y) / zoomRatio;
    }
    
    this.camera.zoom = newZoom;
    this.constrainToBounds();
  }

  zoomTo(targetZoom: number, duration = 300, easing: EasingFunction = 'easeOut'): void {
    this.animateTo(this.camera.position, targetZoom, duration, easing);
  }

  moveTo(target: Vector2, duration = 500, easing: EasingFunction = 'easeOut'): void {
    this.animateTo(target, this.camera.zoom, duration, easing);
  }

  fitToBounds(bounds: BoundingBox, viewportWidth: number, viewportHeight: number, padding = 50): void {
    const contentWidth = bounds.max.x - bounds.min.x;
    const contentHeight = bounds.max.y - bounds.min.y;
    
    const scaleX = (viewportWidth - padding * 2) / contentWidth;
    const scaleY = (viewportHeight - padding * 2) / contentHeight;
    
    const targetZoom = Math.min(scaleX, scaleY, this.maxZoom);
    const targetX = (bounds.min.x + bounds.max.x) / 2;
    const targetY = (bounds.min.y + bounds.max.y) / 2;
    
    this.animateTo({ x: targetX, y: targetY }, targetZoom, 500, 'easeOut');
  }

  private animateTo(
    targetPosition: Vector2,
    targetZoom: number,
    duration: number,
    easing: EasingFunction
  ): void {
    this.animation = {
      targetPosition: { ...targetPosition },
      targetZoom,
      duration,
      easing,
      startTime: Date.now(),
      startPosition: { ...this.camera.position },
      startZoom: this.camera.zoom
    };
  }

  startDrag(pointerPosition: Vector2): void {
    this.isDragging = true;
    this.lastPointerPosition = { ...pointerPosition };
    this.velocity = { x: 0, y: 0 };
    this.animation = null;
  }

  drag(pointerPosition: Vector2): void {
    if (!this.isDragging || !this.lastPointerPosition) return;

    const delta = {
      x: pointerPosition.x - this.lastPointerPosition.x,
      y: pointerPosition.y - this.lastPointerPosition.y
    };

    this.pan(delta);
    this.lastPointerPosition = { ...pointerPosition };
  }

  endDrag(): void {
    this.isDragging = false;
    this.lastPointerPosition = null;
  }

  update(deltaTime: number): void {
    if (this.animation) {
      const elapsed = Date.now() - this.animation.startTime;
      const progress = Math.min(elapsed / this.animation.duration, 1);
      const eased = easingFunctions[this.animation.easing](progress);

      this.camera.position.x = lerp(
        this.animation.startPosition.x,
        this.animation.targetPosition.x,
        eased
      );
      this.camera.position.y = lerp(
        this.animation.startPosition.y,
        this.animation.targetPosition.y,
        eased
      );
      this.camera.zoom = lerp(
        this.animation.startZoom,
        this.animation.targetZoom,
        eased
      );

      if (progress >= 1) {
        this.animation = null;
      }
      
      this.constrainToBounds();
    } else if (this.inertiaEnabled && !this.isDragging) {
      if (Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.y) > 0.1) {
        this.camera.position.x += this.velocity.x / this.camera.zoom;
        this.camera.position.y += this.velocity.y / this.camera.zoom;
        
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        
        this.constrainToBounds();
      } else {
        this.velocity = { x: 0, y: 0 };
      }
    }
  }

  private constrainToBounds(): void {
    if (!this.bounds) return;

    const visibleWidth = window.innerWidth / this.camera.zoom;
    const visibleHeight = window.innerHeight / this.camera.zoom;

    const minX = this.bounds.min.x + visibleWidth / 2;
    const maxX = this.bounds.max.x - visibleWidth / 2;
    const minY = this.bounds.min.y + visibleHeight / 2;
    const maxY = this.bounds.max.y - visibleHeight / 2;

    if (minX < maxX) {
      this.camera.position.x = clamp(this.camera.position.x, minX, maxX);
    } else {
      this.camera.position.x = (this.bounds.min.x + this.bounds.max.x) / 2;
    }

    if (minY < maxY) {
      this.camera.position.y = clamp(this.camera.position.y, minY, maxY);
    } else {
      this.camera.position.y = (this.bounds.min.y + this.bounds.max.y) / 2;
    }
  }

  getVisibleBounds(viewportWidth: number, viewportHeight: number): BoundingBox {
    const halfWidth = viewportWidth / 2 / this.camera.zoom;
    const halfHeight = viewportHeight / 2 / this.camera.zoom;

    return {
      min: {
        x: this.camera.position.x - halfWidth,
        y: this.camera.position.y - halfHeight
      },
      max: {
        x: this.camera.position.x + halfWidth,
        y: this.camera.position.y + halfHeight
      }
    };
  }

  reset(): void {
    this.camera = {
      position: { x: 0, y: 0 },
      zoom: 1,
      rotation: 0
    };
    this.velocity = { x: 0, y: 0 };
    this.animation = null;
  }
}

export const createMapCamera = (
  initialPosition?: Vector2,
  initialZoom?: number
): MapCameraController => {
  return new MapCameraController(initialPosition, initialZoom);
};

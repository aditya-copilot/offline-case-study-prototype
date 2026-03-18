import { useRef, useEffect } from 'react';
import type {
  StoreZone,
  NavigationPath,
  CustomerPosition,
  Vector2
} from '@core/spatial/types';
import { cn } from '@core/utils';

interface MiniMapProps {
  zones: StoreZone[];
  path?: NavigationPath | null;
  customerPosition?: CustomerPosition | null;
  viewportBounds?: { min: Vector2; max: Vector2 };
  width?: number;
  height?: number;
  className?: string;
  onViewportChange?: (center: Vector2) => void;
}

export function MiniMap({
  zones,
  path,
  customerPosition,
  viewportBounds,
  width = 200,
  height = 160,
  className,
  onViewportChange
}: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const mapBounds = {
    min: { x: 0, y: 0 },
    max: { x: 100, y: 80 }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);

    const scaleX = width / (mapBounds.max.x - mapBounds.min.x);
    const scaleY = height / (mapBounds.max.y - mapBounds.min.y);
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (width - (mapBounds.max.x - mapBounds.min.x) * scale) / 2;
    const offsetY = (height - (mapBounds.max.y - mapBounds.min.y) * scale) / 2;

    const worldToMini = (pos: Vector2) => ({
      x: offsetX + (pos.x - mapBounds.min.x) * scale,
      y: offsetY + (pos.y - mapBounds.min.y) * scale
    });

    zones.forEach(zone => {
      const min = worldToMini(zone.bounds.min);
      const max = worldToMini(zone.bounds.max);

      ctx.fillStyle = zone.color + '40';
      ctx.fillRect(min.x, min.y, max.x - min.x, max.y - min.y);

      ctx.strokeStyle = zone.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(min.x, min.y, max.x - min.x, max.y - min.y);
    });

    if (path && path.waypoints.length > 1) {
      ctx.beginPath();
      const start = worldToMini(path.waypoints[0]);
      ctx.moveTo(start.x, start.y);

      for (let i = 1; i < path.waypoints.length; i++) {
        const point = worldToMini(path.waypoints[i]);
        ctx.lineTo(point.x, point.y);
      }

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (customerPosition) {
      const pos = worldToMini(customerPosition.position);

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      const headingX = pos.x + Math.cos(customerPosition.heading) * 10;
      const headingY = pos.y + Math.sin(customerPosition.heading) * 10;

      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(headingX, headingY);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (viewportBounds) {
      const min = worldToMini(viewportBounds.min);
      const max = worldToMini(viewportBounds.max);

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(min.x, min.y, max.x - min.x, max.y - min.y);
      ctx.setLineDash([]);
    }
  }, [zones, path, customerPosition, viewportBounds, width, height]);

  const handleClick = (e: React.MouseEvent) => {
    if (!onViewportChange) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = width / (mapBounds.max.x - mapBounds.min.x);
    const scaleY = height / (mapBounds.max.y - mapBounds.min.y);
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (width - (mapBounds.max.x - mapBounds.min.x) * scale) / 2;
    const offsetY = (height - (mapBounds.max.y - mapBounds.min.y) * scale) / 2;

    const worldX = mapBounds.min.x + (x - offsetX) / scale;
    const worldY = mapBounds.min.y + (y - offsetY) / scale;

    onViewportChange({ x: worldX, y: worldY });
  };

  return (
    <div
      className={cn(
        'rounded-lg overflow-hidden border border-border bg-slate-900 shadow-lg',
        className
      )}
      style={{ width, height }}
    >
      <canvas
        ref={canvasRef}
        className={cn(
          'w-full h-full',
          onViewportChange && 'cursor-pointer'
        )}
        style={{ width, height }}
        onClick={handleClick}
      />
    </div>
  );
}

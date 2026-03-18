import type {
  Vector2,
  BoundingBox,
  MapCamera,
  MapEntity,
  StoreZone,
  Shelf,
  NavigationNode,
  NavigationEdge,
  NavigationPath,
  CustomerPosition,
  DebugInfo
} from '@core/spatial/types';
import { calculateDistance } from '@core/utils';

interface RenderContext {
  ctx: CanvasRenderingContext2D;
  camera: MapCamera;
  viewport: { width: number; height: number };
  scale: number;
  offset: Vector2;
}

interface RenderOptions {
  showGrid: boolean;
  showZones: boolean;
  showShelves: boolean;
  showNodes: boolean;
  showEdges: boolean;
  showPath: boolean;
  showAvatar: boolean;
  showDebug: boolean;
  nightMode: boolean;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr: number;
  private animationFrame: number | null = null;
  private lastFrameTime = 0;
  private frameCount = 0;
  private fps = 60;
  private renderTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;
    this.dpr = window.devicePixelRatio || 1;
  }

  resize(width: number, height: number): void {
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(this.dpr, this.dpr);
  }

  render(
    camera: MapCamera,
    options: RenderOptions,
    data: {
      zones?: StoreZone[];
      shelves?: Shelf[];
      nodes?: NavigationNode[];
      edges?: NavigationEdge[];
      path?: NavigationPath | null;
      customerPosition?: CustomerPosition | null;
    }
  ): DebugInfo {
    const startTime = performance.now();
    const viewport = {
      width: this.canvas.width / this.dpr,
      height: this.canvas.height / this.dpr
    };

    this.ctx.clearRect(0, 0, viewport.width, viewport.height);

    const scale = camera.zoom;
    const offset = {
      x: viewport.width / 2 - camera.position.x * scale,
      y: viewport.height / 2 - camera.position.y * scale
    };

    const context: RenderContext = {
      ctx: this.ctx,
      camera,
      viewport,
      scale,
      offset
    };

    if (options.nightMode) {
      this.ctx.fillStyle = '#0a0a0f';
      this.ctx.fillRect(0, 0, viewport.width, viewport.height);
    }

    if (options.showGrid) {
      this.renderGrid(context);
    }

    if (options.showZones && data.zones) {
      this.renderZones(context, data.zones, options.nightMode);
    }

    if (options.showShelves && data.shelves) {
      this.renderShelves(context, data.shelves);
    }

    if (options.showEdges && data.edges) {
      this.renderEdges(context, data.edges, data.nodes || []);
    }

    if (options.showPath && data.path) {
      this.renderPath(context, data.path);
    }

    if (options.showNodes && data.nodes) {
      this.renderNodes(context, data.nodes);
    }

    if (options.showAvatar && data.customerPosition) {
      this.renderAvatar(context, data.customerPosition);
    }

    if (options.showDebug) {
      this.renderDebugOverlay(context, {
        fps: this.fps,
        entityCount: this.countEntities(data),
        visibleEntities: this.countEntities(data),
        renderTime: this.renderTime,
        spatialQueryTime: 0,
        currentZone: data.customerPosition?.zoneId || null,
        activeNodes: data.nodes?.length || 0,
        activeEdges: data.edges?.length || 0,
        memoryUsage: performance.memory?.usedJSHeapSize || 0
      });
    }

    this.renderTime = performance.now() - startTime;
    this.updateFPS();

    return {
      fps: this.fps,
      frameTime: this.renderTime,
      entityCount: this.countEntities(data),
      visibleEntities: this.countEntities(data),
      renderTime: this.renderTime,
      spatialQueryTime: 0,
      currentZone: data.customerPosition?.zoneId || null,
      activeNodes: data.nodes?.length || 0,
      activeEdges: data.edges?.length || 0,
      memoryUsage: performance.memory?.usedJSHeapSize || 0
    };
  }

  private renderGrid(context: RenderContext): void {
    const { ctx, viewport, scale, offset } = context;
    const gridSize = 50 * scale;
    const gridAlpha = Math.min(0.3, scale * 0.1);

    ctx.strokeStyle = `rgba(100, 100, 100, ${gridAlpha})`;
    ctx.lineWidth = 1;

    const startX = Math.floor(-offset.x / gridSize) * gridSize + offset.x;
    const startY = Math.floor(-offset.y / gridSize) * gridSize + offset.y;

    ctx.beginPath();
    for (let x = startX; x < viewport.width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, viewport.height);
    }
    for (let y = startY; y < viewport.height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(viewport.width, y);
    }
    ctx.stroke();

    ctx.fillStyle = `rgba(100, 100, 100, ${gridAlpha * 0.5})`;
    ctx.font = '10px sans-serif';
    for (let x = startX; x < viewport.width; x += gridSize * 5) {
      for (let y = startY; y < viewport.height; y += gridSize * 5) {
        const worldX = Math.round((x - offset.x) / scale);
        const worldY = Math.round((y - offset.y) / scale);
        if (worldX % 250 === 0 && worldY % 250 === 0) {
          ctx.fillText(`${worldX},${worldY}`, x + 2, y - 2);
        }
      }
    }
  }

  private renderZones(context: RenderContext, zones: StoreZone[], nightMode: boolean): void {
    const { ctx, scale, offset } = context;

    zones.forEach(zone => {
      const x = zone.bounds.min.x * scale + offset.x;
      const y = zone.bounds.min.y * scale + offset.y;
      const width = (zone.bounds.max.x - zone.bounds.min.x) * scale;
      const height = (zone.bounds.max.y - zone.bounds.min.y) * scale;

      const alpha = nightMode ? 0.15 : 0.2;
      ctx.fillStyle = zone.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.fillRect(x, y, width, height);

      ctx.strokeStyle = zone.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      if (scale > 0.3) {
        ctx.fillStyle = nightMode ? '#fff' : '#333';
        ctx.font = `${Math.max(10, 14 * scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(zone.name, x + width / 2, y + height / 2);
      }
    });
  }

  private renderShelves(context: RenderContext, shelves: Shelf[]): void {
    const { ctx, scale, offset } = context;

    shelves.forEach(shelf => {
      const x = shelf.bounds.min.x * scale + offset.x;
      const y = shelf.bounds.min.y * scale + offset.y;
      const width = (shelf.bounds.max.x - shelf.bounds.min.x) * scale;
      const height = (shelf.bounds.max.y - shelf.bounds.min.y) * scale;

      const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
      gradient.addColorStop(0, '#e5e7eb');
      gradient.addColorStop(1, '#d1d5db');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, width, height);

      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, width, height);

      if (scale > 0.8) {
        ctx.fillStyle = '#6b7280';
        ctx.font = `${Math.max(8, 10 * scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Shelf', x + width / 2, y + height / 2);
      }
    });
  }

  private renderNodes(context: RenderContext, nodes: NavigationNode[]): void {
    const { ctx, scale, offset } = context;

    nodes.forEach(node => {
      const x = node.position.x * scale + offset.x;
      const y = node.position.y * scale + offset.y;
      const radius = Math.max(3, 5 * scale);

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = node.type === 'zone-center' ? '#3b82f6' : '#6b7280';
      ctx.fill();

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (scale > 0.5) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.id.slice(-4), x, y - radius - 2);
      }
    });
  }

  private renderEdges(context: RenderContext, edges: NavigationEdge[], nodes: NavigationNode[]): void {
    const { ctx, scale, offset } = context;

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    edges.forEach(edge => {
      const from = nodeMap.get(edge.fromNodeId);
      const to = nodeMap.get(edge.toNodeId);
      if (!from || !to) return;

      const x1 = from.position.x * scale + offset.x;
      const y1 = from.position.y * scale + offset.y;
      const x2 = to.position.x * scale + offset.x;
      const y2 = to.position.y * scale + offset.y;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = edge.type === 'walkway' ? '#d1d5db' : '#9ca3af';
      ctx.lineWidth = edge.type === 'walkway' ? 3 : 2;
      ctx.stroke();
    });
  }

  private renderPath(context: RenderContext, path: NavigationPath): void {
    const { ctx, scale, offset } = context;

    if (path.waypoints.length < 2) return;

    ctx.beginPath();
    const start = path.waypoints[0];
    ctx.moveTo(start.x * scale + offset.x, start.y * scale + offset.y);

    for (let i = 1; i < path.waypoints.length; i++) {
      const point = path.waypoints[i];
      ctx.lineTo(point.x * scale + offset.x, point.y * scale + offset.y);
    }

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = Math.max(3, 5 * scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    path.waypoints.forEach((point, i) => {
      const x = point.x * scale + offset.x;
      const y = point.y * scale + offset.y;
      const radius = i === 0 || i === path.waypoints.length - 1 ? 6 : 4;

      ctx.beginPath();
      ctx.arc(x, y, radius * scale, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? '#10b981' : i === path.waypoints.length - 1 ? '#ef4444' : '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    path.segments.forEach((segment, i) => {
      const midX = ((segment.from.x + segment.to.x) / 2) * scale + offset.x;
      const midY = ((segment.from.y + segment.to.y) / 2) * scale + offset.y;

      ctx.save();
      ctx.translate(midX, midY);
      ctx.rotate(segment.direction);

      ctx.beginPath();
      ctx.moveTo(-6 * scale, -4 * scale);
      ctx.lineTo(0, 0);
      ctx.lineTo(-6 * scale, 4 * scale);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    });
  }

  private renderAvatar(context: RenderContext, position: CustomerPosition): void {
    const { ctx, scale, offset } = context;
    const x = position.position.x * scale + offset.x;
    const y = position.position.y * scale + offset.y;
    const radius = Math.max(8, 12 * scale);

    const time = Date.now() / 1000;
    const pulseRadius = radius + Math.sin(time * 3) * 4;

    ctx.beginPath();
    ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, '#60a5fa');
    gradient.addColorStop(1, '#3b82f6');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    const headingX = x + Math.cos(position.heading) * radius * 1.5;
    const headingY = y + Math.sin(position.heading) * radius * 1.5;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(headingX, headingY);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(headingX, headingY, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();
  }

  private renderDebugOverlay(context: RenderContext, info: DebugInfo): void {
    const { ctx, viewport } = context;
    const padding = 10;
    const lineHeight = 16;
    const width = 200;
    const height = 140;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(padding, padding, width, height);

    ctx.fillStyle = '#00ff00';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    let y = padding + 5;
    ctx.fillText(`FPS: ${Math.round(info.fps)}`, padding + 5, y);
    y += lineHeight;
    ctx.fillText(`Frame: ${info.renderTime.toFixed(2)}ms`, padding + 5, y);
    y += lineHeight;
    ctx.fillText(`Entities: ${info.entityCount}`, padding + 5, y);
    y += lineHeight;
    ctx.fillText(`Nodes: ${info.activeNodes} | Edges: ${info.activeEdges}`, padding + 5, y);
    y += lineHeight;
    ctx.fillText(`Zone: ${info.currentZone || 'None'}`, padding + 5, y);
    y += lineHeight;
    ctx.fillText(`Memory: ${(info.memoryUsage / 1024 / 1024).toFixed(1)}MB`, padding + 5, y);
  }

  private updateFPS(): void {
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFrameTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime));
      this.frameCount = 0;
      this.lastFrameTime = now;
    }
  }

  private countEntities(data: {
    zones?: StoreZone[];
    shelves?: Shelf[];
    nodes?: NavigationNode[];
    edges?: NavigationEdge[];
  }): number {
    return (data.zones?.length || 0) +
           (data.shelves?.length || 0) +
           (data.nodes?.length || 0) +
           (data.edges?.length || 0);
  }

  destroy(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}

export const createCanvasRenderer = (canvas: HTMLCanvasElement): CanvasRenderer => {
  return new CanvasRenderer(canvas);
};

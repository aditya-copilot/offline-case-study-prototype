import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ZoomIn,
  ZoomOut,
  Crosshair,
  Layers,
  Maximize2,
  Map as MapIcon
} from 'lucide-react';

import type {
  StoreZone,
  Shelf,
  NavigationNode,
  NavigationEdge,
  NavigationPath,
  CustomerPosition,
  Vector2
} from '@core/spatial/types';
import { CanvasRenderer } from '@core/map-engine/CanvasRenderer';
import { useMapCamera } from '@hooks/map/useMapCamera';
import { cn } from '@core/utils';
import { Button } from '@components/ui/Button';

interface StoreMapProps {
  zones: StoreZone[];
  shelves: Shelf[];
  nodes: NavigationNode[];
  edges: NavigationEdge[];
  path?: NavigationPath | null;
  customerPosition?: CustomerPosition | null;
  width?: number;
  height?: number;
  showGrid?: boolean;
  showZones?: boolean;
  showShelves?: boolean;
  showNodes?: boolean;
  showEdges?: boolean;
  showPath?: boolean;
  showAvatar?: boolean;
  showDebug?: boolean;
  nightMode?: boolean;
  className?: string;
  onZoneClick?: (zone: StoreZone) => void;
  onNodeClick?: (node: NavigationNode) => void;
  onMapClick?: (position: Vector2) => void;
}

export function StoreMap({
  zones,
  shelves,
  nodes,
  edges,
  path,
  customerPosition,
  width = 800,
  height = 600,
  showGrid = true,
  showZones = true,
  showShelves = true,
  showNodes = false,
  showEdges = false,
  showPath = true,
  showAvatar = true,
  showDebug = false,
  nightMode = false,
  className,
  onZoneClick,
  onNodeClick,
  onMapClick
}: StoreMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    fps: 60,
    entityCount: 0,
    renderTime: 0,
    currentZone: null as string | null
  });

  const bounds = {
    min: { x: 0, y: 0 },
    max: { x: 100, y: 80 }
  };

  const {
    camera,
    zoom: handleZoom,
    pan,
    fitToBounds,
    startDrag,
    drag,
    endDrag,
    isDragging,
    reset
  } = useMapCamera({
    initialPosition: { x: 50, y: 40 },
    initialZoom: 0.8,
    minZoom: 0.1,
    maxZoom: 3,
    bounds,
    inertia: true
  });

  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new CanvasRenderer(canvasRef.current);
      rendererRef.current.resize(width, height);
      setIsInitialized(true);
    }

    return () => {
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
  }, [width, height]);

  useEffect(() => {
    if (!isInitialized || !rendererRef.current) return;

    const debugData = rendererRef.current.render(
      camera,
      {
        showGrid,
        showZones,
        showShelves,
        showNodes,
        showEdges,
        showPath: showPath && !!path,
        showAvatar: showAvatar && !!customerPosition,
        showDebug,
        nightMode
      },
      {
        zones,
        shelves,
        nodes,
        edges,
        path: path || null,
        customerPosition: customerPosition || null
      }
    );

    setDebugInfo({
      fps: debugData.fps,
      entityCount: debugData.entityCount,
      renderTime: debugData.renderTime,
      currentZone: debugData.currentZone
    });
  }, [
    isInitialized,
    camera,
    zones,
    shelves,
    nodes,
    edges,
    path,
    customerPosition,
    showGrid,
    showZones,
    showShelves,
    showNodes,
    showEdges,
    showPath,
    showAvatar,
    showDebug,
    nightMode
  ]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    startDrag({ x, y });
  }, [startDrag]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    drag({ x, y });
  }, [isDragging, drag]);

  const handleMouseUp = useCallback(() => {
    endDrag();
  }, [endDrag]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    handleZoom(delta);
  }, [handleZoom]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || isDragging) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const worldX = (screenX - width / 2) / camera.zoom + camera.position.x;
    const worldY = (screenY - height / 2) / camera.zoom + camera.position.y;

    const clickedZone = zones.find(zone =>
      worldX >= zone.bounds.min.x &&
      worldX <= zone.bounds.max.x &&
      worldY >= zone.bounds.min.y &&
      worldY <= zone.bounds.max.y
    );

    const clickedNode = nodes.find(node => {
      const dx = worldX - node.position.x;
      const dy = worldY - node.position.y;
      return Math.sqrt(dx * dx + dy * dy) < 5 / camera.zoom;
    });

    if (clickedZone && onZoneClick) {
      onZoneClick(clickedZone);
    } else if (clickedNode && onNodeClick) {
      onNodeClick(clickedNode);
    } else if (onMapClick) {
      onMapClick({ x: worldX, y: worldY });
    }
  }, [camera, zones, nodes, isDragging, onZoneClick, onNodeClick, onMapClick, width, height]);

  const handleZoomIn = () => handleZoom(1.2);
  const handleZoomOut = () => handleZoom(0.8);
  const handleFitToBounds = () => fitToBounds(bounds, width, height, 20);
  const handleReset = () => reset();

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden rounded-lg bg-muted',
        nightMode && 'bg-slate-950',
        className
      )}
      style={{ width, height }}
    >
      <canvas
        ref={canvasRef}
        className={cn(
          'cursor-grab active:cursor-grabbing',
          isDragging && 'cursor-grabbing'
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
        style={{ width, height }}
      />

      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomIn}
          className="shadow-lg"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomOut}
          className="shadow-lg"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleFitToBounds}
          className="shadow-lg"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleReset}
          className="shadow-lg"
        >
          <Crosshair className="w-4 h-4" />
        </Button>
      </div>

      {showDebug && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-4 bg-black/80 text-green-400 px-4 py-2 rounded-lg font-mono text-xs"
        >
          <div>FPS: {Math.round(debugInfo.fps)}</div>
          <div>Entities: {debugInfo.entityCount}</div>
          <div>Render: {debugInfo.renderTime.toFixed(2)}ms</div>
          <div>Zone: {debugInfo.currentZone || 'None'}</div>
          <div>Zoom: {camera.zoom.toFixed(2)}x</div>
        </motion.div>
      )}

      <div className="absolute bottom-4 left-4 flex items-center gap-2">
        <div className="bg-background/90 backdrop-blur px-3 py-2 rounded-lg text-xs text-muted-foreground">
          <MapIcon className="w-3 h-3 inline mr-1" />
          SmartStore Layout
        </div>
      </div>
    </div>
  );
}

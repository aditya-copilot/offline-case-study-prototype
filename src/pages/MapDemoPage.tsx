import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map,
  Navigation,
  Layers,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Target,
  Zap,
  Moon,
  Sun,
  Info,
  ChevronRight,
  ShoppingCart
} from 'lucide-react';

import type {
  StoreZone,
  Shelf,
  NavigationNode,
  NavigationEdge,
  NavigationPath,
  Vector2
} from '@core/spatial/types';
import { StoreMap, MiniMap, DebugOverlay } from '@components/map';
import { useStoreGraph, useCustomerPosition, useNavigationPath, useZoneDetection } from '@hooks/map';
import { Button } from '@components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/Card';
import { cn } from '@core/utils';
import { useUIActions } from '@store/index';

import storeLayoutDataUrl from '/config/storeLayout.json?url';

interface StoreLayoutData {
  zones: StoreZone[];
  shelves: Shelf[];
  nodes: NavigationNode[];
  edges: NavigationEdge[];
}

export function MapDemoPage() {
  const { addToast } = useUIActions();
  const [layoutData, setLayoutData] = useState<StoreLayoutData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nightMode, setNightMode] = useState(false);
  const [showDebug, setShowDebug] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedZone, setSelectedZone] = useState<StoreZone | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [rssiData, setRssiData] = useState<{ [beaconId: string]: number }>({});
  const [fps, setFps] = useState(60);
  const [renderTime, setRenderTime] = useState(0);

  const { graph, loadFromData, nodeCount, edgeCount, zoneCount } = useStoreGraph({ autoLoad: false });
  
  const {
    position: customerPosition,
    currentZone,
    isMoving,
    moveTo,
    followPath,
    teleportTo,
    simulateRSSI
  } = useCustomerPosition({
    startPosition: { x: 50, y: 75 },
    autoStart: true,
    zones: layoutData?.zones || []
  });

  const { path, calculatePath, calculateFromPosition, clearPath } = useNavigationPath();

  const { nearbyZones, detectZone } = useZoneDetection({
    zones: layoutData?.zones || [],
    position: customerPosition?.position || null,
    detectionRadius: 30
  });

  useEffect(() => {
    const loadLayout = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const response = await fetch(storeLayoutDataUrl);
        const data = await response.json() as StoreLayoutData;
        setLayoutData(data);
        loadFromData(data);
        setIsLoading(false);
        
        addToast({
          type: 'success',
          title: 'Map Loaded',
          message: `Loaded ${data.zones.length} zones, ${data.nodes.length} nodes`
        });
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Failed to load map',
          message: 'Using default layout'
        });
        setIsLoading(false);
      }
    };

    loadLayout();
  }, [loadFromData, addToast]);

  useEffect(() => {
    if (!isSimulating || !customerPosition) return;

    const interval = setInterval(() => {
      const rssi = simulateRSSI();
      setRssiData(rssi);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSimulating, customerPosition, simulateRSSI]);

  const handleZoneClick = useCallback((zone: StoreZone) => {
    setSelectedZone(zone);
    
    const entranceNode = layoutData?.nodes.find(n => n.zoneId === zone.id);
    if (entranceNode && customerPosition) {
      calculateFromPosition(customerPosition.position, entranceNode.id);
    }

    addToast({
      type: 'info',
      title: zone.name,
      message: `Navigating to ${zone.category} section`
    });
  }, [layoutData, customerPosition, calculateFromPosition, addToast]);

  const handleStartSimulation = () => {
    setIsSimulating(true);
    
    if (layoutData && customerPosition) {
      const randomNodes = layoutData.nodes
        .filter(n => n.type === 'zone-center')
        .slice(0, 3);
      
      if (randomNodes.length > 0) {
        const path = randomNodes.map(n => n.position);
        followPath(path, 2);
      }
    }

    addToast({
      type: 'success',
      title: 'Simulation Started',
      message: 'Customer navigation simulation running'
    });
  };

  const handleStopSimulation = () => {
    setIsSimulating(false);
    teleportTo({ x: 50, y: 75 });
    clearPath();
  };

  const handleTeleportToZone = (zone: StoreZone) => {
    teleportTo(zone.center);
    setSelectedZone(zone);
    
    addToast({
      type: 'info',
      title: 'Teleported',
      message: `Moved to ${zone.name}`
    });
  };

  const handleRenderStats = useCallback((stats: { fps: number; renderTime: number }) => {
    setFps(stats.fps);
    setRenderTime(stats.renderTime);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading store map...</p>
        </div>
      </div>
    );
  }

  if (!layoutData) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load map data</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'h-[calc(100vh-4rem)] flex flex-col -mx-4 -my-4 lg:-mx-6 lg:-my-6',
      nightMode && 'dark'
    )}>
      <div className="px-4 py-3 border-b border-border bg-background/95 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Map className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Store Map Engine</h1>
            <p className="text-sm text-muted-foreground">
              Interactive Navigation Demo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNightMode(!nightMode)}
          >
            {nightMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDebug(!showDebug)}
          >
            <Zap className="w-4 h-4 mr-1" />
            Debug
          </Button>
          {!isSimulating ? (
            <Button size="sm" onClick={handleStartSimulation}>
              <Play className="w-4 h-4 mr-1" />
              Start
            </Button>
          ) : (
            <Button size="sm" variant="destructive" onClick={handleStopSimulation}>
              <Pause className="w-4 h-4 mr-1" />
              Stop
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          <StoreMap
            zones={layoutData.zones}
            shelves={layoutData.shelves}
            nodes={layoutData.nodes}
            edges={layoutData.edges}
            path={path}
            customerPosition={customerPosition}
            width={window.innerWidth - 320}
            height={window.innerHeight - 150}
            showGrid={true}
            showZones={true}
            showShelves={true}
            showNodes={showDebug}
            showEdges={showDebug}
            showPath={true}
            showAvatar={true}
            showDebug={showDebug}
            nightMode={nightMode}
            onZoneClick={handleZoneClick}
            onRenderStats={handleRenderStats}
          />

          <DebugOverlay
            isVisible={showDebug}
            zones={layoutData.zones}
            nodes={layoutData.nodes}
            edges={layoutData.edges}
            position={customerPosition}
            path={path}
            rssiData={rssiData}
            fps={fps}
            renderTime={renderTime}
            entityCount={nodeCount + edgeCount + zoneCount + layoutData.shelves.length}
          />
        </div>

        <div className="w-80 border-l border-border bg-card overflow-y-auto">
          <div className="p-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Navigation className="w-4 h-4" />
                  Navigation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {path ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Distance</span>
                      <span className="font-medium">{path.totalDistance.toFixed(1)}m</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Time</span>
                      <span className="font-medium">{Math.round(path.estimatedTime)}s</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${(customerPosition ? 0.5 : 0) * 100}%` }}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={clearPath}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Clear Path
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Navigation className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Click on a zone to navigate</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Quick Teleport
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {layoutData.zones.slice(0, 6).map(zone => (
                    <Button
                      key={zone.id}
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs h-auto py-2"
                      onClick={() => handleTeleportToZone(zone)}
                    >
                      <div
                        className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                        style={{ backgroundColor: zone.color }}
                      />
                      <span className="truncate">{zone.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Map Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-muted rounded p-2 text-center">
                    <div className="text-lg font-bold text-primary">{zoneCount}</div>
                    <div className="text-xs text-muted-foreground">Zones</div>
                  </div>
                  <div className="bg-muted rounded p-2 text-center">
                    <div className="text-lg font-bold text-primary">{nodeCount}</div>
                    <div className="text-xs text-muted-foreground">Nodes</div>
                  </div>
                  <div className="bg-muted rounded p-2 text-center">
                    <div className="text-lg font-bold text-primary">{edgeCount}</div>
                    <div className="text-xs text-muted-foreground">Edges</div>
                  </div>
                  <div className="bg-muted rounded p-2 text-center">
                    <div className="text-lg font-bold text-primary">{layoutData.shelves.length}</div>
                    <div className="text-xs text-muted-foreground">Shelves</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {currentZone && (
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Current Zone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: currentZone.color }}
                    />
                    <span className="font-medium">{currentZone.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currentZone.products.length} product categories available
                  </p>
                </CardContent>
              </Card>
            )}

            <MiniMap
              zones={layoutData.zones}
              path={path}
              customerPosition={customerPosition}
              width={280}
              height={200}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

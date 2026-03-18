import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Navigation,
  Maximize2,
  Minimize2,
  Bluetooth,
  Zap,
  Bike,
  Fuel,
  Trophy,
  Crown,
  Map,
  Mountain,
  ArrowRight,
  X
} from 'lucide-react';

import { useBLE, useBLEActions, useUIActions } from '@store';
import { vehicleDataLoader } from '@core/data/vehicleDataLoader';
import { cn } from '@core/utils';
import { Button } from '@components/ui/Button';
import { Card, CardContent } from '@components/ui/Card';
import type { VehicleZone } from '@core/types/vehicles';

interface MapZone extends VehicleZone {
  vehicleCount: number;
}

const getZoneIcon = (iconName: string) => {
  switch (iconName) {
    case 'zap': return Zap;
    case 'circle-dot': return Bike;
    case 'bike': return Fuel;
    case 'trophy': return Trophy;
    case 'crown': return Crown;
    case 'map': return Map;
    case 'mountain': return Mountain;
    default: return Bike;
  }
};

export function MapPage() {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const { isScanning, detectedBeacons } = useBLE();
  const { startScan, stopScan } = useBLEActions();
  const { addToast } = useUIActions();
  const [zoom, setZoom] = useState(1);
  const [selectedZone, setSelectedZone] = useState<MapZone | null>(null);
  const [zones, setZones] = useState<MapZone[]>([]);
  const [totalVehicles, setTotalVehicles] = useState(0);

  useEffect(() => {
    startScan();
    return () => stopScan();
  }, [startScan, stopScan]);

  useEffect(() => {
    const loadZones = async () => {
      await vehicleDataLoader.load();
      const vehicleZones = vehicleDataLoader.getZones();
      const stats = vehicleDataLoader.getStats();
      
      const mapZones = vehicleZones.map((zone) => ({
        ...zone,
        vehicleCount: vehicleDataLoader.getVehiclesByZone(zone.id).length
      })).filter(z => z.vehicleCount > 0);
      
      setZones(mapZones);
      setTotalVehicles(stats?.totalVehicles || 0);
    };

    loadZones();
  }, []);

  const currentZoneId = detectedBeacons[0]?.zoneId;

  const getZoneGridPosition = (index: number, total: number) => {
    if (total <= 2) {
      return {
        x: 5 + (index * 50),
        y: 20,
        w: 40,
        h: 50
      };
    }
    
    if (total <= 4) {
      const row = Math.floor(index / 2);
      const col = index % 2;
      return {
        x: 5 + (col * 48),
        y: 5 + (row * 45),
        w: 42,
        h: 38
      };
    }
    
    const row = Math.floor(index / 3);
    const col = index % 3;
    return {
      x: 3 + (col * 33),
      y: 5 + (row * 35),
      w: 30,
      h: 30
    };
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col -mx-4 -my-4 lg:-mx-6 lg:-my-6">
      <div className="px-4 py-3 border-b border-border bg-background/95 backdrop-blur flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Two-Wheeler Showroom</h1>
          <p className="text-sm text-muted-foreground">
            {currentZoneId ? `Currently in: ${currentZoneId.replace('-', ' ')}` : 'Explore zones to find your bike'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
            isScanning ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          )}>
            <Bluetooth className={cn('w-3 h-3', isScanning && 'animate-pulse')} />
            {isScanning ? 'BLE Active' : 'Standby'}
          </div>
          <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(z + 0.2, 2))} disabled={zoom >= 2}>
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} disabled={zoom <= 0.5}>
            <Minimize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div ref={mapRef} className="flex-1 relative overflow-hidden bg-muted">
        <motion.div 
          className="absolute inset-0 flex items-center justify-center p-4" 
          style={{ scale: zoom }}
        >
          <svg 
            viewBox="0 0 100 90" 
            className="w-full h-full max-w-3xl"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
                <path d="M 5 0 L 0 0 0 5" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-border" />
              </pattern>
            </defs>
            
            <rect width="100" height="90" fill="url(#grid)" rx="2" />
            
            {zones.map((zone, index) => {
              const pos = getZoneGridPosition(index, zones.length);
              const Icon = getZoneIcon(zone.icon);
              const isCurrentZone = currentZoneId === zone.id;
              
              return (
                <g key={zone.id}>
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={pos.w}
                    height={pos.h}
                    fill={zone.color}
                    fillOpacity={isCurrentZone ? 0.3 : 0.15}
                    stroke={zone.color}
                    strokeWidth={isCurrentZone ? 1 : 0.4}
                    rx="2"
                    className="cursor-pointer transition-all duration-300"
                    onClick={() => setSelectedZone(zone)}
                  />
                  
                  <foreignObject x={pos.x + pos.w/2 - 5} y={pos.y + 6} width="10" height="10">
                    <div className="flex items-center justify-center w-full h-full" style={{ color: zone.color }}>
                      <Icon className="w-7 h-7" />
                    </div>
                  </foreignObject>
                  
                  <text
                    x={pos.x + pos.w / 2}
                    y={pos.y + pos.h / 2 + 6}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="4"
                    fontWeight="600"
                    fill={zone.color}
                    className="pointer-events-none"
                  >
                    {zone.name}
                  </text>
                  
                  <text
                    x={pos.x + pos.w / 2}
                    y={pos.y + pos.h / 2 + 11}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="3"
                    fill={zone.color}
                    fillOpacity="0.8"
                    className="pointer-events-none"
                  >
                    {zone.vehicleCount} bikes
                  </text>
                </g>
              );
            })}
            
            {currentZoneId && (
              <g>
                <circle cx="50" cy="86" r="2" fill="#10b981" className="animate-pulse" />
                <text x="54" y="86" fontSize="3" fill="#10b981" dominantBaseline="middle">
                  You are here
                </text>
              </g>
            )}
          </svg>
        </motion.div>

        {selectedZone && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-80"
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${selectedZone.color}20` }}>
                      {(() => {
                        const Icon = getZoneIcon(selectedZone.icon);
                        return <Icon className="w-5 h-5" style={{ color: selectedZone.color }} />;
                      })()}
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedZone.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedZone.vehicleCount} bikes available</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedZone(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <p className="mt-3 text-sm text-muted-foreground">{selectedZone.description}</p>
                
                <div className="flex gap-2 mt-4">
                  <Button 
                    className="flex-1" 
                    onClick={() => navigate('/vehicles')}
                  >
                    Browse Bikes
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/navigate')}>
                    <Navigation className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="absolute top-4 left-4">
          <Card className="p-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bike className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Bikes</p>
                <p className="text-lg font-bold">{totalVehicles}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  MapPin,
  Navigation,
  Wifi,
  Target,
  Layers,
  Clock,
  Zap
} from 'lucide-react';

import type {
  StoreZone,
  NavigationNode,
  NavigationEdge,
  CustomerPosition,
  NavigationPath
} from '@core/spatial/types';
import { cn } from '@core/utils';

interface DebugOverlayProps {
  isVisible: boolean;
  zones: StoreZone[];
  nodes: NavigationNode[];
  edges: NavigationEdge[];
  position: CustomerPosition | null;
  path: NavigationPath | null;
  rssiData: { [beaconId: string]: number };
  fps: number;
  renderTime: number;
  entityCount: number;
  className?: string;
}

export function DebugOverlay({
  isVisible,
  zones,
  nodes,
  edges,
  position,
  path,
  rssiData,
  fps,
  renderTime,
  entityCount,
  className
}: DebugOverlayProps) {
  if (!isVisible) return null;

  const currentZone = position?.zoneId
    ? zones.find(z => z.id === position.zoneId)
    : null;

  const nearestNode = position
    ? nodes.reduce((nearest, node) => {
        const dist = Math.sqrt(
          Math.pow(node.position.x - position.position.x, 2) +
          Math.pow(node.position.y - position.position.y, 2)
        );
        const nearestDist = nearest
          ? Math.sqrt(
              Math.pow(nearest.position.x - position.position.x, 2) +
              Math.pow(nearest.position.y - position.position.y, 2)
            )
          : Infinity;
        return dist < nearestDist ? node : nearest;
      }, null as NavigationNode | null)
    : null;

  const rssiEntries = Object.entries(rssiData).slice(0, 5);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className={cn(
          'absolute top-4 right-4 w-80 bg-slate-950/95 backdrop-blur-xl',
          'border border-slate-800 rounded-xl overflow-hidden shadow-2xl',
          className
        )}
      >
        <div className="bg-gradient-to-r from-primary-600 to-accent-600 px-4 py-3">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Activity className="w-4 h-4" />
            Debug Monitor
          </div>
        </div>

        <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <DebugSection title="Performance" icon={Zap}>
            <div className="grid grid-cols-3 gap-2 text-center">
              <MetricBox label="FPS" value={Math.round(fps)} color="text-green-400" />
              <MetricBox label="Frame" value={`${renderTime.toFixed(1)}ms`} color="text-blue-400" />
              <MetricBox label="Entities" value={entityCount} color="text-purple-400" />
            </div>
          </DebugSection>

          <DebugSection title="Position" icon={MapPin}>
            {position ? (
              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">X:</span>
                  <span className="text-slate-200">{position.position.x.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Y:</span>
                  <span className="text-slate-200">{position.position.y.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Heading:</span>
                  <span className="text-slate-200">{((position.heading * 180) / Math.PI).toFixed(0)}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Moving:</span>
                  <span className={position.isMoving ? 'text-green-400' : 'text-slate-400'}>
                    {position.isMoving ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Accuracy:</span>
                  <span className="text-slate-200">±{position.accuracy.toFixed(1)}m</span>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-xs">No position data</div>
            )}
          </DebugSection>

          <DebugSection title="Zone Detection" icon={Target}>
            {currentZone ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: currentZone.color }}
                  />
                  <span className="text-sm font-medium text-slate-200">
                    {currentZone.name}
                  </span>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <div>Category: {currentZone.category}</div>
                  <div>Capacity: {currentZone.capacity}</div>
                  <div>Crowd: {currentZone.crowdLevel}</div>
                  <div>Beacons: {currentZone.beacons.length}</div>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-xs">Not in any zone</div>
            )}
          </DebugSection>

          <DebugSection title="Navigation Graph" icon={Navigation}>
            <div className="grid grid-cols-2 gap-2">
              <MetricBox label="Nodes" value={nodes.length} color="text-cyan-400" />
              <MetricBox label="Edges" value={edges.length} color="text-cyan-400" />
            </div>
            {nearestNode && (
              <div className="mt-2 text-xs">
                <div className="text-slate-400">Nearest Node:</div>
                <div className="text-slate-200 font-mono">{nearestNode.id}</div>
                <div className="text-slate-400">
                  Type: <span className="text-slate-300">{nearestNode.type}</span>
                </div>
              </div>
            )}
          </DebugSection>

          <DebugSection title="Active Path" icon={Layers}>
            {path ? (
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Distance:</span>
                  <span className="text-slate-200">{path.totalDistance.toFixed(1)}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Time:</span>
                  <span className="text-slate-200">{Math.round(path.estimatedTime)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Waypoints:</span>
                  <span className="text-slate-200">{path.waypoints.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Zones:</span>
                  <span className="text-slate-200">{path.zones.length}</span>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-xs">No active path</div>
            )}
          </DebugSection>

          <DebugSection title="BLE Simulation (RSSI)" icon={Wifi}>
            {rssiEntries.length > 0 ? (
              <div className="space-y-1">
                {rssiEntries.map(([beaconId, rssi]) => (
                  <div key={beaconId} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">{beaconId.slice(-8)}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            rssi > -65 ? 'bg-green-500' :
                            rssi > -80 ? 'bg-yellow-500' : 'bg-red-500'
                          )}
                          style={{ width: `${Math.max(0, Math.min(100, (rssi + 100) / 50 * 100))}%` }}
                        />
                      </div>
                      <span className={cn(
                        'w-10 text-right font-mono',
                        rssi > -65 ? 'text-green-400' :
                        rssi > -80 ? 'text-yellow-400' : 'text-red-400'
                      )}>
                        {rssi}dBm
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 text-xs">No beacon data</div>
            )}
          </DebugSection>
        </div>

        <div className="bg-slate-900 px-4 py-2 text-xs text-slate-500 border-t border-slate-800">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

interface DebugSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function DebugSection({ title, icon: Icon, children }: DebugSectionProps) {
  return (
    <div className="border-b border-slate-800 pb-3 last:border-0">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

interface MetricBoxProps {
  label: string;
  value: string | number;
  color: string;
}

function MetricBox({ label, value, color }: MetricBoxProps) {
  return (
    <div className="bg-slate-900 rounded p-2">
      <div className={cn('text-lg font-bold font-mono', color)}>{value}</div>
      <div className="text-[10px] text-slate-500 uppercase">{label}</div>
    </div>
  );
}

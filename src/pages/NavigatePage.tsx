import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation,
  MapPin,
  Clock,
  Footprints,
  X,
  ChevronRight,
  ChevronLeft,
  SkipForward,
  Volume2,
  VolumeX
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { useNavigation, useNavigationActions, useBLE, useUIActions } from '@store';
import { cn, formatDistance, formatDuration } from '@core/utils';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';

export function NavigatePage() {
  const {
    isNavigating,
    currentRoute,
    currentInstruction,
    remainingDistance,
    remainingTime
  } = useNavigation();

  const {
    stopNavigation,
    nextInstruction,
    previousInstruction,
    skipToNextZone
  } = useNavigationActions();

  const { userLocation } = useBLE();
  const { addToast } = useUIActions();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNavigating) {
      addToast({
        type: 'info',
        title: 'No Active Navigation',
        message: 'Start navigation from your shopping list'
      });
    }
  }, [isNavigating, addToast]);

  if (!isNavigating || !currentRoute || !currentInstruction) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col items-center justify-center -mx-4 -my-4 lg:-mx-6 lg:-my-6">
        <Navigation className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Active Navigation</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-xs">
          Go to your shopping list and start navigation to see turn-by-turn directions
        </p>
        <Button onClick={() => navigate('/list')}>Go to Shopping List</Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col -mx-4 -my-4 lg:-mx-6 lg:-my-6">
      <div className="px-4 py-3 border-b border-border bg-background/95 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-primary" />
          <span className="font-semibold">Navigation</span>
        </div>
        <Button variant="ghost" size="icon" onClick={stopNavigation}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 relative bg-muted">
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full max-w-lg">
            <defs>
              <pattern id="nav-grid" width="5" height="5" patternUnits="userSpaceOnUse">
                <path d="M 5 0 L 0 0 0 5" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-border" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#nav-grid)" />
            
            {currentRoute.waypoints.map((wp, i) => (
              <circle
                key={i}
                cx={wp.x}
                cy={wp.y}
                r="2"
                className={cn(
                  'fill-primary',
                  i === 0 && 'fill-success',
                  i === currentRoute.waypoints.length - 1 && 'fill-accent-amber-500'
                )}
              />
            ))}
            
            {userLocation && (
              <g>
                <circle
                  cx={userLocation.coordinates.x}
                  cy={userLocation.coordinates.y}
                  r="3"
                  className="fill-primary animate-pulse"
                />
                <circle
                  cx={userLocation.coordinates.x}
                  cy={userLocation.coordinates.y}
                  r="6"
                  fill="none"
                  className="stroke-primary"
                  strokeWidth="0.5"
                  opacity="0.5"
                >
                  <animate
                    attributeName="r"
                    values="6;10;6"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.5;0;0.5"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            )}
          </svg>
        </div>

        <div className="absolute top-4 left-4 right-4">
          <Card className="p-3 bg-background/95 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{formatDuration(remainingTime)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Footprints className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{formatDistance(remainingDistance)}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <Volume2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <div className="bg-background border-t border-border p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentInstruction.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Navigation className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{currentInstruction.text}</h2>
                {currentInstruction.distance > 0 && (
                  <p className="text-muted-foreground">
                    In {formatDistance(currentInstruction.distance)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={previousInstruction}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                variant="outline"
                onClick={skipToNextZone}
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Skip Zone
              </Button>
              <Button
                className="flex-1"
                onClick={nextInstruction}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ChevronLeft, Trophy, AlertCircle } from 'lucide-react';
import { cn } from '@core/utils';
import { Button } from '@components/ui/Button';
import { Card, CardContent, CardHeader } from '@components/ui/Card';
import { vehicleDataLoader } from '@core/data/vehicleDataLoader';
import type { Vehicle } from '@core/types/vehicles';

interface CompareViewProps {
  vehicleIds: string[];
  onClose: () => void;
  onViewDetails?: (vehicleId: string) => void;
}

interface ComparisonPoint {
  label: string;
  key: string;
  format?: (value: string) => string;
  highlight?: 'higher' | 'lower' | 'boolean';
}

const COMPARISON_POINTS: ComparisonPoint[] = [
  { label: 'Price', key: 'price', highlight: 'lower' },
  { label: 'Engine', key: 'Displacement' },
  { label: 'Power', key: 'Power', highlight: 'higher' },
  { label: 'Torque', key: 'Torque', highlight: 'higher' },
  { label: 'Mileage', key: 'Mileage - ARAI', highlight: 'higher' },
  { label: 'Weight', key: 'Kerb Weight' },
  { label: 'Fuel Tank', key: 'Fuel Tank Capacity' },
  { label: 'Seat Height', key: 'Seat Height' },
  { label: 'ABS', key: 'Antilock Braking System', highlight: 'boolean' }
];

export function CompareView({ vehicleIds, onClose, onViewDetails }: CompareViewProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    return vehicleIds
      .map((id) => vehicleDataLoader.getVehicleById(id))
      .filter((v): v is Vehicle => v !== undefined);
  });

  const [winner, setWinner] = useState<string | null>(() => {
    if (vehicles.length === 0) return null;
    const scores = vehicles.map((v) => ({
      id: v.id,
      score: calculateScore(v)
    }));
    return scores.reduce((a, b) => (a.score > b.score ? a : b)).id;
  });

  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No vehicles to compare</p>
        <Button variant="outline" onClick={onClose} className="mt-4">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  const getSpecValue = (vehicle: Vehicle, key: string): string => {
    const specs = vehicle.variants[0]?.specs || {};
    return specs[key] || '-';
  };

  const getPrice = (vehicle: Vehicle): number => {
    return (vehicle.priceRange.min + vehicle.priceRange.max) / 2;
  };

  const getNumericValue = (value: string): number => {
    const match = value.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const isWinner = (vehicle: Vehicle, point: ComparisonPoint): boolean => {
    if (vehicles.length < 2) return false;

    const values = vehicles.map((v) => ({
      vehicle: v,
      value: point.key === 'price' ? getPrice(v) : getNumericValue(getSpecValue(v, point.key))
    }));

    if (point.highlight === 'higher') {
      const max = Math.max(...values.map((v) => v.value));
      return values.find((v) => v.vehicle.id === vehicle.id)?.value === max && max > 0;
    } else if (point.highlight === 'lower') {
      const min = Math.min(...values.map((v) => v.value));
      return values.find((v) => v.vehicle.id === vehicle.id)?.value === min && min > 0;
    } else if (point.highlight === 'boolean') {
      const val = getSpecValue(vehicle, point.key);
      return val === '1' || val.toLowerCase().includes('dual') || val.toLowerCase().includes('yes');
    }

    return false;
  };

  const removeVehicle = (id: string) => {
    const newVehicles = vehicles.filter((v) => v.id !== id);
    setVehicles(newVehicles);
    if (newVehicles.length === 0) {
      onClose();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h3 className="font-semibold">Compare Vehicles</h3>
            <p className="text-xs text-muted-foreground">{vehicles.length} bikes selected</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `120px repeat(${vehicles.length}, minmax(180px, 1fr))` }}
        >
          <div className="space-y-2">
            <div className="h-32" />
            {COMPARISON_POINTS.map((point) => (
              <div
                key={point.key}
                className="h-12 flex items-center text-sm font-medium text-muted-foreground px-2"
              >
                {point.label}
              </div>
            ))}
          </div>

          {vehicles.map((vehicle) => (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <Card className={cn('relative overflow-hidden', winner === vehicle.id && 'border-primary')}>
                {winner === vehicle.id && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-2 py-0.5 text-xs flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    Winner
                  </div>
                )}
                <CardHeader className="p-3 pb-0">
                  <button
                    onClick={() => removeVehicle(vehicle.id)}
                    className="absolute top-2 right-2 p-1 hover:bg-muted rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="aspect-video bg-muted rounded-lg mb-2 flex items-center justify-center">
                    {vehicle.imagePath ? (
                      <img
                        src={vehicle.imagePath}
                        alt={vehicle.modelName}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-4xl">🏍️</div>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm line-clamp-1">{vehicle.modelName}</h4>
                  <p className="text-xs text-muted-foreground">{vehicle.makeName}</p>
                </CardContent>
              </Card>

              {COMPARISON_POINTS.map((point) => {
                const value = point.key === 'price'
                  ? `₹${getPrice(vehicle).toLocaleString('en-IN')}`
                  : getSpecValue(vehicle, point.key);
                const isWinning = isWinner(vehicle, point);

                return (
                  <div
                    key={point.key}
                    className={cn(
                      'h-12 flex items-center justify-center text-sm px-2 rounded',
                      isWinning && 'bg-emerald-500/10 text-emerald-600 font-medium',
                      !isWinning && 'bg-muted/50'
                    )}
                  >
                    {point.highlight === 'boolean' && (value === '1' || value.toLowerCase().includes('dual')) ? (
                      <Check className="w-5 h-5 text-emerald-500" />
                    ) : (
                      value
                    )}
                  </div>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onViewDetails?.(vehicle.id)}
              >
                View Details
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      {vehicles.length < 3 && (
        <div className="p-4 border-t bg-muted/50">
          <p className="text-xs text-muted-foreground text-center">
            Add up to {3 - vehicles.length} more vehicle{vehicles.length < 2 ? 's' : ''} to compare
          </p>
        </div>
      )}
    </div>
  );
}

function calculateScore(vehicle: Vehicle): number {
  let score = 0;
  const specs = vehicle.variants[0]?.specs || {};

  const mileage = parseInt(specs['Mileage - ARAI'] || '0');
  if (mileage > 50) score += 2;
  else if (mileage > 40) score += 1;

  const power = parseInt(specs['Power'] || '0');
  if (power > 15) score += 2;
  else if (power > 10) score += 1;

  if (vehicle.tags.includes('abs')) score += 1;
  if (vehicle.isElectric) score += 1.5;

  const rating = vehicle.overallRating;
  if (rating > 4) score += 2;
  else if (rating > 3) score += 1;

  return score;
}

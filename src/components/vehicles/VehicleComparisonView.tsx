import { useState } from 'react';
import { X, Plus, Trash2, ArrowRightLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { vehicleImageResolver } from '@core/assets/vehicleImageResolver';
import { GlassSurface } from '@design-system/components/GlassSurface';
import type { Vehicle, VehicleComparisonViewProps } from '@core/types/vehicles';

const getSpecValue = (vehicle: Vehicle, specName: string): string => {
  for (const category of vehicle.specifications) {
    const spec = category.specs.find(s => s.name === specName);
    if (spec) {
      return `${spec.values.join(', ')} ${spec.unit}`.trim();
    }
  }

  const variantSpec = vehicle.variants[0]?.specs[specName];
  if (variantSpec) return variantSpec;

  return '-';
};

const COMPARISON_ATTRIBUTES = [
  { key: 'price', label: 'Price', getValue: (v: Vehicle) => `₹${v.priceRange.min.toLocaleString()}` },
  { key: 'rating', label: 'Rating', getValue: (v: Vehicle) => `${v.overallRating.toFixed(1)}/5` },
  { key: 'fuelType', label: 'Fuel Type', getValue: (v: Vehicle) => v.fuelType },
  { key: 'bodyStyle', label: 'Body Style', getValue: (v: Vehicle) => v.bodyStyle },
  { key: 'displacement', label: 'Engine', getValue: (v: Vehicle) => getSpecValue(v, 'Displacement') || '-' },
  { key: 'power', label: 'Power', getValue: (v: Vehicle) => getSpecValue(v, 'Max Power') || '-' },
  { key: 'mileage', label: 'Mileage', getValue: (v: Vehicle) => getSpecValue(v, 'Mileage - ARAI') || getSpecValue(v, 'Mileage - Owner Reported') || '-' },
  { key: 'transmission', label: 'Transmission', getValue: (v: Vehicle) => getSpecValue(v, 'Transmission') || '-' },
  { key: 'weight', label: 'Kerb Weight', getValue: (v: Vehicle) => getSpecValue(v, 'Kerb Weight') || '-' },
  { key: 'brakes', label: 'Braking System', getValue: (v: Vehicle) => getSpecValue(v, 'Braking System') || '-' },
];

export function VehicleComparisonView({
  vehicles,
  onRemove,
  onClearAll,
  maxComparisons = 4
}: VehicleComparisonViewProps) {
  const [highlightedAttr, setHighlightedAttr] = useState<string | null>(null);

  const getHighlightColor = (attr: string, vehicles: Vehicle[]): string => {
    if (attr === 'price') {
      const minPrice = Math.min(...vehicles.map(v => v.priceRange.min));
      return 'bg-emerald-500/20 text-emerald-400';
    }
    if (attr === 'rating') {
      const maxRating = Math.max(...vehicles.map(v => v.overallRating));
      return 'bg-amber-500/20 text-amber-400';
    }
    if (attr === 'mileage') {
      const mileages = vehicles.map(v => {
        const mileage = v.variants[0]?.specs['Mileage - ARAI'] || v.variants[0]?.specs['Mileage - Owner Reported'];
        return mileage ? parseFloat(mileage.replace(/[^\d.]/g, '')) : 0;
      });
      const maxMileage = Math.max(...mileages);
      return 'bg-emerald-500/20 text-emerald-400';
    }
    return '';
  };

  const getBestValue = (attr: string, vehicles: Vehicle[]): number | null => {
    if (attr === 'price') {
      return Math.min(...vehicles.map(v => v.priceRange.min));
    }
    if (attr === 'rating') {
      return Math.max(...vehicles.map(v => v.overallRating));
    }
    return null;
  };

  if (vehicles.length === 0) {
    return (
      <GlassSurface className="p-8 text-center">
        <ArrowRightLeft className="mx-auto h-12 w-12 text-slate-600" />
        <h3 className="mt-4 text-lg font-semibold text-white">No vehicles to compare</h3>
        <p className="mt-2 text-slate-400">Add vehicles to start comparing</p>
      </GlassSurface>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">
          Comparing {vehicles.length} Vehicle{vehicles.length !== 1 ? 's' : ''}
        </h2>
        <div className="flex gap-2">
          {vehicles.length < maxComparisons && (
            <button className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">
              <Plus className="h-4 w-4" />
              Add Vehicle
            </button>
          )}
          <button
            onClick={onClearAll}
            className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${vehicles.length}, 1fr)` }}>
            <div className="space-y-4">
              <div className="h-48" />
              {COMPARISON_ATTRIBUTES.map((attr) => (
                <button
                  key={attr.key}
                  onClick={() => setHighlightedAttr(highlightedAttr === attr.key ? null : attr.key)}
                  className={`flex h-12 w-full items-center rounded-lg px-4 text-left text-sm font-medium transition-colors ${
                    highlightedAttr === attr.key
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {attr.label}
                </button>
              ))}
            </div>

            {vehicles.map((vehicle) => {
              const imageConfig = vehicleImageResolver.resolveImage(vehicle, { variant: 'thumbnail' });
              return (
                <div key={vehicle.id} className="space-y-4">
                  <GlassSurface className="relative overflow-hidden p-4">
                    <button
                      onClick={() => onRemove?.(vehicle.id)}
                      className="absolute right-2 top-2 rounded-full bg-slate-700 p-1 text-slate-400 hover:bg-slate-600 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    <div className="aspect-[4/3] overflow-hidden rounded-lg bg-slate-800">
                      <img
                        src={imageConfig.src}
                        alt={imageConfig.alt}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="mt-3">
                      <p className="text-xs text-slate-400">{vehicle.makeName}</p>
                      <h3 className="font-semibold text-white">{vehicle.modelName}</h3>
                    </div>
                  </GlassSurface>

                  {COMPARISON_ATTRIBUTES.map((attr) => {
                    const value = attr.getValue(vehicle);
                    const bestValue = getBestValue(attr.key, vehicles);
                    const isBest = bestValue !== null && (
                      attr.key === 'price'
                        ? vehicle.priceRange.min === bestValue
                        : attr.key === 'rating'
                          ? vehicle.overallRating === bestValue
                          : false
                    );

                    return (
                      <div
                        key={attr.key}
                        className={`flex h-12 items-center justify-center rounded-lg px-4 text-center text-sm ${
                          highlightedAttr === attr.key
                            ? getHighlightColor(attr.key, vehicles)
                            : isBest
                              ? getHighlightColor(attr.key, vehicles)
                              : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {value}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-slate-800/50 p-4">
        <h4 className="font-medium text-white">Comparison Summary</h4>
        <p className="mt-2 text-sm text-slate-400">
          {vehicles.length > 1 ? (
            <>
              <span className="text-emerald-400">Best Value: </span>
              {vehicles.reduce((min, v) => v.priceRange.min < min.priceRange.min ? v : min).name}
              {' | '}
              <span className="text-amber-400">Best Rated: </span>
              {vehicles.reduce((max, v) => v.overallRating > max.overallRating ? v : max).name}
            </>
          ) : (
            'Add more vehicles to see comparison insights'
          )}
        </p>
      </div>
    </div>
  );
}

export default VehicleComparisonView;

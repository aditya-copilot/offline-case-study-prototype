import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Trophy,
  Check,
  ChevronDown,
  ChevronUp,
  IndianRupee,
  Star,
  Bike,
  Zap,
  Fuel,
  Gauge,
  Scale,
  Crown,
  AlertCircle,
  Info
} from 'lucide-react';

import { vehicleImageResolver } from '@core/assets/vehicleImageResolver';
import { useCompare, useCompareActions, useUIActions } from '@store';
import { cn } from '@core/utils';
import { Button } from '@components/ui/Button';
import { Card, CardContent } from '@components/ui/Card';
import type { Vehicle } from '@core/types/vehicles';

interface SpecDefinition {
  name: string;
  label: string;
  type: 'higher' | 'lower' | 'exact';
}

interface SpecCategory {
  id: string;
  label: string;
  icon: typeof Bike;
  specs: SpecDefinition[];
}

const SPEC_CATEGORIES: SpecCategory[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: Info,
    specs: [
      { name: 'price', label: 'Ex-Showroom Price', type: 'lower' },
      { name: 'rating', label: 'User Rating', type: 'higher' },
      { name: 'reviews', label: 'Total Reviews', type: 'higher' },
      { name: 'variants', label: 'Variants Available', type: 'higher' }
    ]
  },
  {
    id: 'engine',
    label: 'Engine & Performance',
    icon: Zap,
    specs: [
      { name: 'Displacement', label: 'Engine Displacement', type: 'higher' },
      { name: 'Max Power', label: 'Max Power', type: 'higher' },
      { name: 'Max Torque', label: 'Max Torque', type: 'higher' },
      { name: 'Top Speed', label: 'Top Speed', type: 'higher' },
      { name: 'Acceleration', label: 'Acceleration', type: 'lower' }
    ]
  },
  {
    id: 'fuel',
    label: 'Fuel Efficiency & Range',
    icon: Fuel,
    specs: [
      { name: 'Mileage - ARAI', label: 'ARAI Mileage', type: 'higher' },
      { name: 'Mileage - Owner Reported', label: 'User Reported Mileage', type: 'higher' },
      { name: 'Fuel Tank Capacity', label: 'Fuel Tank Capacity', type: 'higher' },
      { name: 'Riding Range', label: 'Riding Range', type: 'higher' }
    ]
  },
  {
    id: 'braking',
    label: 'Braking System',
    icon: Scale,
    specs: [
      { name: 'Braking System', label: 'Braking System', type: 'exact' },
      { name: 'Front Brake', label: 'Front Brake', type: 'exact' },
      { name: 'Rear Brake', label: 'Rear Brake', type: 'exact' },
      { name: 'ABS', label: 'ABS Type', type: 'exact' }
    ]
  },
  {
    id: 'suspension',
    label: 'Suspension & Chassis',
    icon: Gauge,
    specs: [
      { name: 'Front Suspension', label: 'Front Suspension', type: 'exact' },
      { name: 'Rear Suspension', label: 'Rear Suspension', type: 'exact' },
      { name: 'Chassis Type', label: 'Chassis Type', type: 'exact' }
    ]
  },
  {
    id: 'wheels',
    label: 'Wheels & Tyres',
    icon: Bike,
    specs: [
      { name: 'Wheel Type', label: 'Wheel Type', type: 'exact' },
      { name: 'Front Tyre', label: 'Front Tyre', type: 'exact' },
      { name: 'Rear Tyre', label: 'Rear Tyre', type: 'exact' },
      { name: 'Tyre Type', label: 'Tyre Type', type: 'exact' }
    ]
  },
  {
    id: 'dimensions',
    label: 'Dimensions & Capacity',
    icon: Scale,
    specs: [
      { name: 'Kerb Weight', label: 'Kerb Weight', type: 'lower' },
      { name: 'Seat Height', label: 'Seat Height', type: 'exact' },
      { name: 'Ground Clearance', label: 'Ground Clearance', type: 'higher' },
      { name: 'Wheelbase', label: 'Wheelbase', type: 'higher' }
    ]
  },
  {
    id: 'electrical',
    label: 'Electrical & Features',
    icon: Zap,
    specs: [
      { name: 'Battery Type', label: 'Battery Type', type: 'exact' },
      { name: 'Headlight', label: 'Headlight', type: 'exact' },
      { name: 'Taillight', label: 'Taillight', type: 'exact' },
      { name: 'Turn Signals', label: 'Turn Signals', type: 'exact' },
      { name: 'Mobile Connectivity', label: 'Connectivity', type: 'exact' }
    ]
  }
];

export function ComparePage() {
  const navigate = useNavigate();
  const { compareList } = useCompare();
  const { removeFromCompare, clearCompareList } = useCompareActions();
  const { addToast } = useUIActions();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['overview']);

  useEffect(() => {
    if (compareList.length < 2) {
      addToast({
        type: 'info',
        title: 'Add more bikes',
        message: 'Please add at least 2 bikes to compare'
      });
    }
  }, [compareList.length, addToast]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const getSpecValue = (vehicle: Vehicle, specName: string): string => {
    if (specName === 'price') {
      const avg = (vehicle.priceRange.min + vehicle.priceRange.max) / 2;
      return `₹${avg.toLocaleString()}`;
    }
    if (specName === 'rating') {
      return `${vehicle.overallRating.toFixed(1)}`;
    }
    if (specName === 'reviews') {
      return `${vehicle.totalReviews}`;
    }
    if (specName === 'variants') {
      return `${vehicle.variants.length}`;
    }

    for (const category of vehicle.specifications) {
      const spec = category.specs.find((s) => s.name === specName);
      if (spec && spec.values.length > 0) {
        return spec.values.join(', ');
      }
    }

    const variantSpec = vehicle.variants[0]?.specs[specName];
    if (variantSpec) return variantSpec;

    return '-';
  };

  const extractNumericValue = (value: string): number => {
    const match = value.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const findBestValue = (
    vehicles: Vehicle[],
    specName: string,
    type: 'higher' | 'lower' | 'exact'
  ): string | undefined => {
    if (vehicles.length < 2 || type === 'exact') return undefined;

    const values = vehicles.map((v) => ({
      id: v.id,
      numeric: extractNumericValue(getSpecValue(v, specName))
    }));

    if (type === 'lower') {
      const minValue = Math.min(...values.map((v) => v.numeric));
      const best = values.find((v) => v.numeric === minValue && v.numeric > 0);
      return best?.id;
    }

    const maxValue = Math.max(...values.map((v) => v.numeric));
    const best = values.find((v) => v.numeric === maxValue && v.numeric > 0);
    return best?.id;
  };

  const calculateWins = (vehicle: Vehicle): number => {
    let wins = 0;

    SPEC_CATEGORIES.forEach((category) => {
      category.specs.forEach((spec) => {
        const best = findBestValue(compareList, spec.name, spec.type);
        if (best === vehicle.id) wins++;
      });
    });

    return wins;
  };

  const getRecommendedBike = (): Vehicle | null => {
    if (compareList.length < 2) return null;

    const scored = compareList.map((v: Vehicle) => ({
      vehicle: v,
      score: calculateWins(v) * 10 + v.overallRating * 5 + Math.min(v.totalReviews / 50, 10)
    }));

    scored.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
    return scored[0].vehicle;
  };

  const recommended = getRecommendedBike();

  if (compareList.length === 0) {
    return (
      <div className="text-center py-12 pb-24">
        <Scale className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No bikes to compare</h2>
        <p className="text-muted-foreground mb-4">Add bikes to your comparison list to see detailed comparisons</p>
        <Button onClick={() => navigate('/vehicles')}>Browse Bikes</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compare Bikes</h1>
          <p className="text-muted-foreground">
            Side-by-side detailed comparison of {compareList.length} bike{compareList.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/vehicles')}>Add More</Button>
          <Button variant="outline" onClick={clearCompareList}>Clear All</Button>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <div style={{ minWidth: `${200 + compareList.length * 180}px` }}>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3 bg-card border-b-2 border-border w-[200px]">
                  <span className="text-sm font-medium text-muted-foreground">Bike Details</span>
                </th>
                {compareList.map((vehicle: Vehicle) => {
                  const imageConfig = vehicleImageResolver.resolveImage(vehicle, { variant: 'thumbnail' });
                  const wins = calculateWins(vehicle);
                  const isRecommended = recommended?.id === vehicle.id;

                  return (
                    <th key={vehicle.id} className="p-3 bg-card border-b-2 border-border border-l w-[180px]">
                      <div className="relative text-center">
                        <button
                          onClick={() => removeFromCompare(vehicle.id)}
                          className="absolute -top-1 -right-1 z-10 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>

                        <div className="space-y-2">
                          <div className="w-16 h-16 mx-auto rounded-lg overflow-hidden bg-slate-800">
                            <img src={imageConfig.src} alt={imageConfig.alt} className="w-full h-full object-cover" />
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground truncate">{vehicle.makeName}</p>
                            <h3 className="font-semibold text-sm">{vehicle.modelName}</h3>
                          </div>

                          <div className="flex items-center justify-center gap-1">
                            <IndianRupee className="h-3 w-3 text-emerald-400" />
                            <span className="text-base font-bold text-emerald-400">
                              ₹{Math.round((vehicle.priceRange.min + vehicle.priceRange.max) / 2).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center justify-center gap-1">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-medium">{vehicle.overallRating.toFixed(1)}</span>
                          </div>

                          {wins > 0 && (
                            <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs">
                              <Trophy className="h-3 w-3" />
                              <span>{wins} wins</span>
                            </div>
                          )}

                          {isRecommended && (
                            <div className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-xs font-medium inline-flex items-center gap-1">
                              <Crown className="h-3 w-3" />
                              Best
                            </div>
                          )}
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
          </table>
        </div>
      </div>

      {recommended && (
        <Card className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500/30">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Crown className="h-8 w-8 text-emerald-400" />
                <div>
                  <h3 className="font-semibold">Our Recommendation</h3>
                  <p className="text-sm text-muted-foreground">
                    {recommended.makeName} {recommended.modelName} is the best overall choice with{' '}
                    {calculateWins(recommended)} top specifications
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-2xl font-bold text-emerald-400">
                  ₹{Math.round((recommended.priceRange.min + recommended.priceRange.max) / 2).toLocaleString()}
                </p>
                <Button size="sm" onClick={() => navigate(`/vehicles/${recommended.id}`)}>View Details</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4 overflow-x-auto -mx-4 px-4">
        <div style={{ minWidth: `${200 + compareList.length * 180}px` }}>
          {SPEC_CATEGORIES.map((category) => {
            const isExpanded = expandedCategories.includes(category.id);
            const Icon = category.icon;

            return (
              <Card key={category.id} className="mb-4">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{category.label}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <table className="w-full border-collapse">
                        <tbody>
                          {category.specs.map((spec) => {
                            const bestValue = findBestValue(compareList, spec.name, spec.type);

                            return (
                              <tr key={spec.name} className="border-t">
                                <td className="p-3 bg-muted/30 text-sm font-medium text-muted-foreground w-[200px]">
                                  <div className="flex items-center">
                                    {spec.label}
                                    {spec.type !== 'exact' && bestValue && <Trophy className="h-3 w-3 ml-1 text-emerald-400" />}
                                  </div>
                                </td>
                                {compareList.map((vehicle: Vehicle) => {
                                  const value = getSpecValue(vehicle, spec.name);
                                  const isBest = bestValue === vehicle.id;

                                  return (
                                    <td
                                      key={vehicle.id}
                                      className={cn(
                                        'p-3 text-sm border-l w-[180px]',
                                        isBest && 'bg-emerald-500/10 text-emerald-400 font-medium'
                                      )}
                                    >
                                      <div className="flex items-center gap-1">
                                        {isBest && <Check className="h-4 w-4 flex-shrink-0" />}
                                        <span className="break-words">{value}</span>
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {compareList.map((vehicle: Vehicle) => {
          const wins = calculateWins(vehicle);

          if (wins === 0) {
            return (
              <Card key={vehicle.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">{vehicle.makeName} {vehicle.modelName}</h3>
                      <p className="text-sm text-muted-foreground">No top specifications in this comparison.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }

          const winningSpecs: Array<{ category: string; spec: string }> = [];
          SPEC_CATEGORIES.forEach((category) => {
            category.specs.forEach((spec) => {
              const best = findBestValue(compareList, spec.name, spec.type);
              if (best === vehicle.id) {
                winningSpecs.push({ category: category.label, spec: spec.label });
              }
            });
          });

          return (
            <Card key={vehicle.id}>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">{vehicle.makeName} {vehicle.modelName}</h3>
                <p className="text-emerald-400 font-medium mb-2">{wins} wins</p>
                <ul className="space-y-1">
                  {winningSpecs.slice(0, 6).map((win, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                      <Check className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                      <span className="truncate">{win.spec}: Best in category</span>
                    </li>
                  ))}
                  {winningSpecs.length > 6 && <li className="text-sm text-muted-foreground pl-5">+{winningSpecs.length - 6} more</li>}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

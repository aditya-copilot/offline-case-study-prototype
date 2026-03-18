import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Grid3X3,
  List,
  Bike,
  Zap,
  Fuel,
  Star,
  IndianRupee,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Scale,
  Check
} from 'lucide-react';

import { vehicleDataLoader } from '@core/data/vehicleDataLoader';
import { vehicleImageResolver } from '@core/assets/vehicleImageResolver';
import { vehicleZoneEngine } from '@core/navigation/vehicleZoneEngine';
import { useUIActions, useCompare, useCompareActions } from '@store';
import { cn } from '@core/utils';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Card, CardContent } from '@components/ui/Card';
import { Skeleton } from '@components/feedback/Skeleton';
import type { Vehicle, VehicleZoneType } from '@core/types/vehicles';

const categories: Array<{ id: VehicleZoneType | 'all'; label: string; icon: typeof Bike; count?: number }> = [
  { id: 'all', label: 'All Bikes', icon: Bike },
  { id: 'ev-showroom', label: 'Electric', icon: Zap },
  { id: 'scooter-zone', label: 'Scooters', icon: Bike },
  { id: 'commuter-zone', label: 'Commuter', icon: Bike },
  { id: 'premium-zone', label: 'Premium', icon: Bike }
];

const priceRanges = [
  { id: 'all', label: 'All Prices', min: 0, max: Infinity },
  { id: 'under70k', label: 'Under ₹70K', min: 0, max: 70000 },
  { id: '70k-1l', label: '₹70K - ₹1L', min: 70000, max: 100000 },
  { id: '1l-1.5l', label: '₹1L - ₹1.5L', min: 100000, max: 150000 },
  { id: '1.5l-2.5l', label: '₹1.5L - ₹2.5L', min: 150000, max: 250000 },
  { id: 'above-2.5l', label: 'Above ₹2.5L', min: 250000, max: Infinity }
];

const SORT_OPTIONS = [
  { id: 'popular', name: 'Most Popular', icon: TrendingUp },
  { id: 'price-low', name: 'Price: Low to High', icon: TrendingUp },
  { id: 'price-high', name: 'Price: High to Low', icon: TrendingDown },
  { id: 'rating', name: 'Highest Rated', icon: Star },
  { id: 'mileage', name: 'Best Mileage', icon: Fuel }
];

export function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<VehicleZoneType | 'all'>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { addToast } = useUIActions();
  const { compareList, maxCompareCount } = useCompare();
  const { addToCompare, removeFromCompare, isInCompareList, canAddMore } = useCompareActions();
  const navigate = useNavigate();

  useEffect(() => {
    const loadVehicles = async () => {
      setIsLoading(true);
      try {
        await vehicleDataLoader.load();
        await vehicleZoneEngine.initialize();
        const allVehicles = vehicleDataLoader.getAllVehicles();
        setVehicles(allVehicles);
        setFilteredVehicles(allVehicles);
      } catch (error) {
        console.error('Failed to load vehicles:', error);
        addToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load vehicles. Please try again.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadVehicles();
  }, [addToast]);

  useEffect(() => {
    let result = [...vehicles];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        v =>
          v.name.toLowerCase().includes(query) ||
          v.makeName.toLowerCase().includes(query) ||
          v.modelName.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(v => v.zoneId === selectedCategory);
    }

    const priceRange = priceRanges.find(p => p.id === selectedPriceRange);
    if (priceRange && priceRange.id !== 'all') {
      result = result.filter(v => {
        const avgPrice = (v.priceRange.min + v.priceRange.max) / 2;
        return avgPrice >= priceRange.min && avgPrice <= priceRange.max;
      });
    }

    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.priceRange.min - b.priceRange.min);
        break;
      case 'price-high':
        result.sort((a, b) => b.priceRange.max - a.priceRange.max);
        break;
      case 'rating':
        result.sort((a, b) => b.overallRating - a.overallRating);
        break;
      case 'mileage':
        result.sort((a, b) => {
          const getMileage = (v: Vehicle) => {
            const mileage = v.variants[0]?.specs['Mileage - ARAI'] || v.variants[0]?.specs['Mileage - Owner Reported'];
            return mileage ? parseFloat(mileage.replace(/[^\d.]/g, '')) : 0;
          };
          return getMileage(b) - getMileage(a);
        });
        break;
      case 'popular':
      default:
        result.sort((a, b) => (b.totalReviews * b.overallRating) - (a.totalReviews * a.overallRating));
        break;
    }

    setFilteredVehicles(result);
  }, [vehicles, searchQuery, selectedCategory, selectedPriceRange, sortBy]);

  const handleVehicleClick = (vehicle: Vehicle) => {
    navigate(`/vehicles/${vehicle.id}`);
  };

  const getFuelIcon = (fuelType: string) => {
    switch (fuelType) {
      case 'Electric':
        return <Zap className="h-3 w-3" />;
      case 'Petrol':
        return <Fuel className="h-3 w-3" />;
      default:
        return <Bike className="h-3 w-3" />;
    }
  };

  const getZoneBadgeColor = (zoneId: string): string => {
    const colors: Record<string, string> = {
      'ev-showroom': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'scooter-zone': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'commuter-zone': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      'sports-zone': 'bg-red-500/20 text-red-400 border-red-500/30',
      'premium-zone': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
      'cruiser-zone': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      'adventure-zone': 'bg-teal-500/20 text-teal-400 border-teal-500/30'
    };
    return colors[zoneId] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" lines={2} />
        <div className="flex gap-2 overflow-x-auto">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 flex-shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Two-Wheelers</h1>
          <p className="text-muted-foreground">
            {filteredVehicles.length} bikes available
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bikes..."
              className="pl-10 w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="rounded-none"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="rounded-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="whitespace-nowrap flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              {category.label}
            </Button>
          );
        })}
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Filter by Price</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {priceRanges.map((range) => (
            <Button
              key={range.id}
              variant={selectedPriceRange === range.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPriceRange(range.id)}
              className="whitespace-nowrap flex items-center gap-1.5"
            >
              <IndianRupee className="h-3 w-3" />
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-background border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-3'
          )}
        >
          {filteredVehicles.map((vehicle, index) => {
            const imageConfig = vehicleImageResolver.resolveImage(vehicle, { variant: 'main' });
            const avgPrice = (vehicle.priceRange.min + vehicle.priceRange.max) / 2;

            return (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={cn(
                    'overflow-hidden group hover:shadow-lg transition-all cursor-pointer',
                    viewMode === 'list' && 'flex'
                  )}
                  onClick={() => handleVehicleClick(vehicle)}
                >
                  <div
                    className={cn(
                      'relative bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center overflow-hidden',
                      viewMode === 'grid' ? 'aspect-[4/3]' : 'w-48 h-32'
                    )}
                  >
                    <img
                      src={imageConfig.src}
                      alt={imageConfig.alt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-2 left-2">
                      <span
                        className={cn(
                          'px-2 py-0.5 text-xs font-medium rounded-full border',
                          getZoneBadgeColor(vehicle.zoneId)
                        )}
                      >
                        {vehicle.zoneId.replace('-', ' ')}
                      </span>
                    </div>
                    {vehicle.isNewlyLaunched && (
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500 text-white">
                          New
                        </span>
                      </div>
                    )}
                  </div>

                  <CardContent
                    className={cn('p-4', viewMode === 'list' && 'flex-1 flex flex-col justify-between')}
                  >
                    <div>
                      <p className="text-sm text-muted-foreground">{vehicle.makeName}</p>
                      <h3 className="font-semibold line-clamp-1">{vehicle.modelName}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-warning text-warning" />
                          <span className="text-xs">{vehicle.overallRating.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {getFuelIcon(vehicle.fuelType)}
                          <span>{vehicle.fuelType}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <p className="text-lg font-bold text-emerald-400">
                          ₹{avgPrice.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          On-road price
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {isInCompareList(vehicle.id) ? (
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-emerald-500 hover:bg-emerald-600"
                            onClick={(e) => { e.stopPropagation(); removeFromCompare(vehicle.id); }}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Added
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!canAddMore()}
                            onClick={(e) => { e.stopPropagation(); addToCompare(vehicle); }}
                          >
                            <Scale className="h-3 w-3 mr-1" />
                            Compare
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleVehicleClick(vehicle); }}>
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {filteredVehicles.length === 0 && (
        <div className="text-center py-12">
          <Bike className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No bikes found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedPriceRange('all');
              setSortBy('popular');
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}

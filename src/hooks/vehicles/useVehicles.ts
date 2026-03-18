import { useState, useEffect, useCallback, useMemo } from 'react';
import { vehicleDataLoader } from '@core/data/vehicleDataLoader';
import { vehicleImageResolver } from '@core/assets/vehicleImageResolver';
import type {
  Vehicle,
  VehicleZone,
  FuelType,
  BodyStyle,
  AsyncData,
  VehicleFilter
} from '@core/types/vehicles';

export function useVehicles() {
  const [state, setState] = useState<AsyncData<Vehicle[]>>({
    data: null,
    state: 'idle',
    error: null
  });

  const load = useCallback(async () => {
    setState(prev => ({ ...prev, state: 'loading' }));

    try {
      const result = await vehicleDataLoader.load();

      if (result.success) {
        setState({
          data: vehicleDataLoader.getAllVehicles(),
          state: 'success',
          error: null,
          lastUpdated: Date.now()
        });
      } else {
        setState({
          data: null,
          state: 'error',
          error: new Error(result.errors[0]?.message || 'Failed to load vehicles')
        });
      }
    } catch (error) {
      setState({
        data: null,
        state: 'error',
        error: error instanceof Error ? error : new Error('Unknown error')
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, state: 'refreshing' }));
    await vehicleDataLoader.clearCache();
    await load();
  }, [load]);

  return {
    vehicles: state.data,
    loading: state.state === 'loading',
    refreshing: state.state === 'refreshing',
    error: state.error,
    load,
    refresh
  };
}

export function useVehicle(vehicleId: string | undefined) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vehicleId) {
      setLoading(false);
      return;
    }

    const loadVehicle = async () => {
      setLoading(true);
      await vehicleDataLoader.load();
      const found = vehicleDataLoader.getVehicleById(vehicleId);
      setVehicle(found || null);
      setLoading(false);
    };

    loadVehicle();
  }, [vehicleId]);

  return { vehicle, loading };
}

export function useVehicleSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    setLoading(true);

    const searchResults = vehicleDataLoader.searchVehicles(searchQuery);
    setResults(searchResults);
    setLoading(false);
  }, []);

  return { query, results, loading, search, setQuery };
}

export function useVehicleFilter() {
  const [filters, setFilters] = useState<VehicleFilter>({});
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);

  const applyFilters = useCallback((newFilters: VehicleFilter) => {
    setFilters(newFilters);
    const results = vehicleDataLoader.filterVehicles({
      fuelTypes: newFilters.fuelTypes,
      brands: newFilters.brands,
      priceRange: newFilters.priceRange,
      bodyStyles: newFilters.bodyStyles
    });
    setFilteredVehicles(results);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setFilteredVehicles([]);
  }, []);

  return {
    filters,
    filteredVehicles,
    applyFilters,
    clearFilters
  };
}

export function useVehiclesByZone(zoneId: string) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await vehicleDataLoader.load();
      const zoneVehicles = vehicleDataLoader.getVehiclesByZone(zoneId);
      setVehicles(zoneVehicles);
      setLoading(false);
    };

    load();
  }, [zoneId]);

  return { vehicles, loading };
}

export function useVehicleZones() {
  const [zones, setZones] = useState<VehicleZone[]>([]);

  useEffect(() => {
    const loadZones = async () => {
      await vehicleDataLoader.load();
      setZones(vehicleDataLoader.getZones());
    };

    loadZones();
  }, []);

  return zones;
}

export function useVehicleImage(vehicle: Vehicle | null, options?: {
  variant?: 'main' | 'thumbnail' | 'hero' | 'detail';
  colorId?: number;
  lazy?: boolean;
}) {
  const [imageState, setImageState] = useState<{
    src: string;
    loaded: boolean;
    error: boolean;
  }>({ src: '', loaded: false, error: false });

  useEffect(() => {
    if (!vehicle) return;

    setImageState(prev => ({ ...prev, loaded: false, error: false }));

    const config = options?.colorId
      ? vehicleImageResolver.resolveColorImage(vehicle, options.colorId)
      : vehicleImageResolver.resolveImage(vehicle, { variant: options?.variant || 'main' });

    setImageState(prev => ({ ...prev, src: config.src }));

    const img = new Image();
    img.onload = () => setImageState(prev => ({ ...prev, loaded: true }));
    img.onerror = () => setImageState(prev => ({ ...prev, error: true }));
    img.src = config.src;
  }, [vehicle, options?.variant, options?.colorId]);

  return imageState;
}

export function useVehicleStats() {
  const [stats, setStats] = useState<{
    total: number;
    brands: number;
    fuelTypes: Record<FuelType, number>;
    loading: boolean;
  }>({ total: 0, brands: 0, fuelTypes: { Petrol: 0, Electric: 0, CNG: 0, Hybrid: 0 }, loading: true });

  useEffect(() => {
    const loadStats = async () => {
      await vehicleDataLoader.load();
      const dataStats = vehicleDataLoader.getStats();
      if (dataStats) {
        setStats({
          total: dataStats.totalVehicles,
          brands: dataStats.totalBrands,
          fuelTypes: dataStats.fuelTypeDistribution,
          loading: false
        });
      }
    };

    loadStats();
  }, []);

  return stats;
}

export function useVehiclePreload() {
  const preloadHeroVehicles = useCallback(async (vehicles: Vehicle[]) => {
    await vehicleImageResolver.preloadHeroVehicles(vehicles);
  }, []);

  const preloadImage = useCallback(async (src: string) => {
    try {
      await vehicleImageResolver.preloadImage(src);
      return true;
    } catch {
      return false;
    }
  }, []);

  return { preloadHeroVehicles, preloadImage };
}

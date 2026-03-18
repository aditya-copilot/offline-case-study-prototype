import rawVehicleData from '../../data/vehicles/twowheelerProducts.json';
import { cacheRepo } from '@services/db';
import type {
  Vehicle,
  VehicleDataIndex,
  VehicleDatasetStats,
  VehicleZone,
  VehicleZoneType,
  FuelType,
  BodyStyle,
  DataLoadResult,
  ValidationError,
  VehicleDataLoaderConfig
} from '@core/types/vehicles';

const DEFAULT_CONFIG: VehicleDataLoaderConfig = {
  dataSource: '@data/vehicles/twowheelerProducts.json',
  validationEnabled: true,
  normalizationEnabled: true,
  indexingEnabled: true,
  cacheEnabled: true,
  cacheKey: 'vehicle-data-v1',
  cacheTTL: 24 * 60 * 60 * 1000
};

const VEHICLE_ZONES: VehicleZone[] = [
  {
    id: 'ev-showroom',
    name: 'EV Showroom',
    description: 'Electric vehicles and scooters',
    color: '#10b981',
    icon: 'zap',
    filterCriteria: { fuelTypes: ['Electric'] },
    beaconIds: ['ev-001', 'ev-002', 'ev-003'],
    position: { x: 100, y: 100 },
    bounds: { width: 200, height: 150 }
  },
  {
    id: 'scooter-zone',
    name: 'Scooter Zone',
    description: 'Scooters and mopeds',
    color: '#3b82f6',
    icon: 'circle-dot',
    filterCriteria: { bodyStyles: ['Scooter'] },
    beaconIds: ['sc-001', 'sc-002', 'sc-003'],
    position: { x: 350, y: 100 },
    bounds: { width: 200, height: 150 }
  },
  {
    id: 'commuter-zone',
    name: 'Commuter Zone',
    description: 'Daily commuter bikes',
    color: '#f59e0b',
    icon: 'bike',
    filterCriteria: { bodyStyles: ['Commuter', 'Street'] },
    beaconIds: ['cm-001', 'cm-002', 'cm-003'],
    position: { x: 100, y: 300 },
    bounds: { width: 200, height: 150 }
  },
  {
    id: 'sports-zone',
    name: 'Sports Zone',
    description: 'Sports bikes and performance models',
    color: '#ef4444',
    icon: 'trophy',
    filterCriteria: { bodyStyles: ['Sports'] },
    beaconIds: ['sp-001', 'sp-002', 'sp-003'],
    position: { x: 350, y: 300 },
    bounds: { width: 200, height: 150 }
  },
  {
    id: 'premium-zone',
    name: 'Premium Zone',
    description: 'Premium and luxury bikes',
    color: '#8b5cf6',
    icon: 'crown',
    filterCriteria: { priceRange: { min: 150000, max: Infinity } },
    beaconIds: ['pr-001', 'pr-002', 'pr-003'],
    position: { x: 600, y: 100 },
    bounds: { width: 200, height: 150 }
  },
  {
    id: 'cruiser-zone',
    name: 'Cruiser Zone',
    description: 'Cruiser and touring bikes',
    color: '#ec4899',
    icon: 'map',
    filterCriteria: { bodyStyles: ['Cruiser'] },
    beaconIds: ['cr-001', 'cr-002', 'cr-003'],
    position: { x: 600, y: 300 },
    bounds: { width: 200, height: 150 }
  },
  {
    id: 'adventure-zone',
    name: 'Adventure Zone',
    description: 'Adventure and off-road bikes',
    color: '#14b8a6',
    icon: 'mountain',
    filterCriteria: { bodyStyles: ['Adventure'] },
    beaconIds: ['ad-001', 'ad-002', 'ad-003'],
    position: { x: 100, y: 500 },
    bounds: { width: 200, height: 150 }
  }
];

function generateVehicleId(makeName: string, modelName: string): string {
  return `${makeName.toLowerCase().replace(/\s+/g, '-')}-${modelName.toLowerCase().replace(/\s+/g, '-')}`;
}

function normalizeVehicle(rawData: Record<string, unknown>): Vehicle {
  const modelDetails = (rawData.model_details as Record<string, unknown>) || {};
  const variants = (rawData.variants as Record<string, unknown>[]) || [];
  const specifications = (rawData.specifications as Record<string, Record<string, unknown>[]>) || {};
  const keySpecs = (rawData.key_specs as Record<string, string>) || {};
  const mileageInfo = (rawData.mileage_info as Record<string, unknown>) || {};
  const reviewSummary = (rawData.review_summary as Record<string, unknown>) || {};
  const additionalInfo = (rawData.additional_info as Record<string, unknown>) || {};

  const prices = variants.map((v) => (v.ex_showroom_price as number) || 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  const normalizedVariants = variants.map((v) => ({
    id: (v.variant_id as number) || 0,
    name: (v.variant_name as string) || '',
    maskingName: (v.variant_masking_name as string) || '',
    price: (v.ex_showroom_price as number) || 0,
    formattedPrice: (v.formatted_price as string) || '',
    priceLabel: (v.price_label as string) || '',
    specs: (v.specs as Record<string, string>) || {},
    colors: ((v.color_options as Record<string, unknown>[]) || []).map((c) => ({
      id: (c.color_id as number) || 0,
      name: (c.color_name as string) || '',
      hexCode: (c.hex_code as string) || '',
      imagePath: (c.image_path as string) || ''
    })),
    isJustLaunched: (v.is_just_launched as boolean) || false,
    isSpecialVersion: (v.is_special_version as boolean) || false
  }));

  const normalizedSpecs: { category: string; specs: Array<{
    name: string;
    values: string[];
    unit: string;
    description: string;
    dataTypeId: number;
    isDistinct: boolean;
  }> }[] = [];

  for (const [category, specs] of Object.entries(specifications)) {
    if (Array.isArray(specs)) {
      normalizedSpecs.push({
        category,
        specs: specs.map((s) => ({
          name: (s.name as string) || '',
          values: (s.values as string[]) || [],
          unit: (s.unit as string) || '',
          description: (s.description as string) || '',
          dataTypeId: (s.data_type_id as number) || 0,
          isDistinct: (s.is_distinct as boolean) || false
        }))
      });
    }
  }

  const normalizedReviews = ((rawData.reviews as Record<string, unknown>[]) || []).map((r) => ({
    id: (r.review_id as number) || 0,
    title: (r.title as string) || '',
    description: (r.description as string) || '',
    rating: (r.rating as number) || 0,
    username: (r.username as string) || '',
    customerId: (r.customer_id as number) || 0,
    entryDate: (r.entry_date as string) || '',
    upvotes: (r.upvotes as number) || 0,
    downvotes: (r.downvotes as number) || 0,
    reportedMileage: (r.reported_mileage as number) || undefined,
    isWinner: (r.is_winner as boolean) || false,
    ratingBreakdown: ((r.rating_breakdown as Record<string, unknown>[]) || []).map((rb) => ({
      questionId: (rb.question_id as number) || 0,
      question: (rb.question as string) || '',
      rating: (rb.rating as string) || ''
    })),
    qa: ((r.qa as Record<string, unknown>[]) || []).map((q) => ({
      questionId: (q.question_id as number) || 0,
      question: (q.question as string) || '',
      answer: (q.answer as string) || ''
    })),
    userImages: ((r.user_images as Record<string, unknown>[]) || []).map((ui) => ({
      imageId: (ui.image_id as number) || 0,
      imagePath: (ui.image_path as string) || '',
      thumbPath: (ui.thumb_path as string) || ''
    }))
  }));

  const vehicleType = (rawData.vehicle_type as string) || 'Bike';
  const fuelType = (rawData.fuel_type as FuelType) || 'Petrol';

  const zoneId = determineZoneId(fuelType, vehicleType, minPrice, normalizedVariants[0]?.specs);

  const tags = generateTags(normalizedVariants[0]?.specs || {}, fuelType, vehicleType);

  return {
    id: generateVehicleId(
      (modelDetails.make_name as string) || '',
      (modelDetails.model_name as string) || ''
    ),
    name: (rawData.bike_name as string) || '',
    url: (rawData.url as string) || '',
    vehicleType: vehicleType as 'Bike' | 'Scooter' | 'Moped',
    fuelType,
    bodyStyle: determineBodyStyle(normalizedVariants[0]?.specs || {}),
    makeId: (modelDetails.make_id as number) || 0,
    makeName: (modelDetails.make_name as string) || '',
    makeMaskingName: (modelDetails.make_masking_name as string) || '',
    modelId: (modelDetails.model_id as number) || 0,
    modelName: (modelDetails.model_name as string) || '',
    modelMaskingName: (modelDetails.model_masking_name as string) || '',
    seoName: (modelDetails.seo_name as string) || '',
    isElectric: (modelDetails.is_electric as boolean) || false,
    isNewlyLaunched: (modelDetails.is_newly_launched as boolean) || false,
    isBS6Phase2: (modelDetails.is_bs6_phase2 as boolean) || false,
    status: (modelDetails.status as number) || 0,
    launchedOn: (modelDetails.launched_on as string) || '',
    discontinuedOn: (modelDetails.discontinued_on as string) || '',
    overallRating: (modelDetails.overall_rating as number) || 0,
    totalReviews: (modelDetails.total_reviews as number) || 0,
    totalRatings: (modelDetails.total_ratings as number) || 0,
    imagePath: (modelDetails.image_path as string) || '',
    brochurePath: (modelDetails.brochure_path as string) || '',
    has360View: (additionalInfo.has_360_view as boolean) || false,
    variants: normalizedVariants,
    priceRange: {
      min: minPrice,
      max: maxPrice,
      formatted: formatPriceRange(minPrice, maxPrice)
    },
    cityPrices: ((rawData.price_in_cities as Record<string, unknown>[]) || []).map((c) => ({
      cityId: (c.city_id as number) || 0,
      cityName: (c.city_name as string) || '',
      maskingName: (c.city_masking_name as string) || '',
      minPrice: (c.min_price as number) || 0,
      maxPrice: (c.max_price as number) || 0,
      formattedPrice: (c.formatted_price as string) || '',
      imagePath: (c.image_path as string) || ''
    })),
    specifications: normalizedSpecs,
    keySpecs,
    features: ((rawData.features as Record<string, unknown>[]) || []).map((f) => ({
      name: (f.name as string) || '',
      id: (f.id as number) || 0,
      category: (f.category as string) || ''
    })),
    reviews: normalizedReviews,
    reviewSummary: {
      totalReviews: (reviewSummary.total_reviews as number) || 0,
      totalRatings: (reviewSummary.total_ratings as number) || 0,
      overallRating: String(reviewSummary.overall_rating || '0'),
      positiveReviewsCount: (reviewSummary.positive_reviews_count as number) || 0,
      criticalReviewsCount: (reviewSummary.critical_reviews_count as number) || 0
    },
    expertReviews: ((rawData.expert_reviews as Record<string, unknown>[]) || []).map((er) => ({
      title: (er.title as string) || '',
      description: (er.description as string) || '',
      videoUrl: (er.video_url as string) || '',
      imagePath: (er.image_path as string) || '',
      publishedDate: (er.published_date as string) || ''
    })),
    faqs: ((rawData.faqs as Record<string, unknown>[]) || []).map((f) => ({
      question: (f.question as string) || '',
      answer: (f.answer as string) || '',
      category: (f.category as string) || ''
    })),
    colors: ((rawData.colors as Record<string, unknown>[]) || []).map((c) => ({
      id: (c.color_id as number) || 0,
      name: (c.color_name as string) || '',
      hexCode: (c.hex_code as string) || '',
      imagePath: (c.image_path as string) || ''
    })),
    mileageInfo: {
      araiMileage: (mileageInfo.arai_mileage as number) || 0,
      userReportedMileage: (mileageInfo.user_reported_mileage as number) || 0,
      modelName: (mileageInfo.model_name as string) || ''
    },
    zoneId,
    category: determineCategory(vehicleType, fuelType),
    tags
  };
}

function determineZoneId(
  fuelType: string,
  vehicleType: string,
  minPrice: number,
  specs: Record<string, string>
): VehicleZoneType {
  if (fuelType === 'Electric') return 'ev-showroom';
  if (vehicleType === 'Scooter') return 'scooter-zone';
  if (minPrice >= 150000) return 'premium-zone';

  const bodyStyle = specs['Body Style']?.toLowerCase() || '';
  if (bodyStyle.includes('sports')) return 'sports-zone';
  if (bodyStyle.includes('cruiser')) return 'cruiser-zone';
  if (bodyStyle.includes('adventure') || bodyStyle.includes('touring')) return 'adventure-zone';

  return 'commuter-zone';
}

function determineBodyStyle(specs: Record<string, string>): BodyStyle {
  const bodyStyle = specs['Body Style']?.toLowerCase() || '';
  if (bodyStyle.includes('sports')) return 'Sports';
  if (bodyStyle.includes('cruiser')) return 'Cruiser';
  if (bodyStyle.includes('adventure')) return 'Adventure';
  if (bodyStyle.includes('street') || bodyStyle.includes('naked')) return 'Street';
  if (bodyStyle.includes('scooter')) return 'Scooter';
  return 'Commuter';
}

function determineCategory(vehicleType: string, fuelType: string): string {
  if (fuelType === 'Electric') return 'Electric';
  if (vehicleType === 'Scooter') return 'Scooter';
  return 'Motorcycle';
}

function generateTags(specs: Record<string, string>, fuelType: string, vehicleType: string): string[] {
  const tags: string[] = [];

  if (fuelType === 'Electric') tags.push('eco-friendly', 'zero-emission', 'electric');
  if (vehicleType === 'Scooter') tags.push('easy-ride', 'city-friendly');

  const abs = specs['Antilock Braking System'];
  if (abs === '1' || abs === 'Dual Channel') tags.push('abs', 'safety');

  const displacement = specs['Displacement'];
  if (displacement) {
    const cc = parseInt(displacement.replace(/\D/g, ''));
    if (cc >= 200) tags.push('powerful');
    if (cc <= 125) tags.push('fuel-efficient', 'beginner-friendly');
  }

  const mileage = specs['Mileage - ARAI'] || specs['Mileage - Owner Reported'];
  if (mileage) {
    const kmpl = parseInt(mileage.replace(/\D/g, ''));
    if (kmpl >= 50) tags.push('high-mileage');
  }

  if (specs['Start Type']?.includes('Self')) tags.push('self-start');
  if (specs['GPS & Navigation']?.includes('Yes')) tags.push('navigation');
  if (specs['Mobile Phone Connectivity']?.includes('Bluetooth')) tags.push('connected');

  return tags;
}

function formatPriceRange(min: number, max: number): string {
  if (min === max) return `₹ ${min.toLocaleString()}`;
  return `₹ ${min.toLocaleString()} - ${max.toLocaleString()}`;
}

function validateVehicle(vehicle: Vehicle, index: number): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!vehicle.id) {
    errors.push({
      path: `[${index}].id`,
      message: 'Vehicle ID is required',
      value: vehicle.id,
      code: 'MISSING_ID'
    });
  }

  if (!vehicle.name) {
    errors.push({
      path: `[${index}].name`,
      message: 'Vehicle name is required',
      value: vehicle.name,
      code: 'MISSING_NAME'
    });
  }

  if (!vehicle.makeName) {
    errors.push({
      path: `[${index}].makeName`,
      message: 'Make name is required',
      value: vehicle.makeName,
      code: 'MISSING_MAKE'
    });
  }

  if (vehicle.variants.length === 0) {
    errors.push({
      path: `[${index}].variants`,
      message: 'At least one variant is required',
      value: vehicle.variants,
      code: 'NO_VARIANTS'
    });
  }

  if (vehicle.priceRange.min < 0 || vehicle.priceRange.max < 0) {
    errors.push({
      path: `[${index}].priceRange`,
      message: 'Price cannot be negative',
      value: vehicle.priceRange,
      code: 'INVALID_PRICE'
    });
  }

  return errors;
}

function createDataIndex(vehicles: Vehicle[]): VehicleDataIndex {
  const byId = new Map<string, Vehicle>();
  const byZone = new Map<string, Vehicle[]>();
  const byCategory = new Map<string, Vehicle[]>();
  const byFuelType = new Map<string, Vehicle[]>();
  const byBrand = new Map<string, Vehicle[]>();
  const byBodyStyle = new Map<string, Vehicle[]>();

  const priceBands = {
    budget: [] as Vehicle[],
    mid: [] as Vehicle[],
    premium: [] as Vehicle[],
    luxury: [] as Vehicle[]
  };

  for (const vehicle of vehicles) {
    byId.set(vehicle.id, vehicle);

    const zoneList = byZone.get(vehicle.zoneId) || [];
    zoneList.push(vehicle);
    byZone.set(vehicle.zoneId, zoneList);

    const categoryList = byCategory.get(vehicle.category) || [];
    categoryList.push(vehicle);
    byCategory.set(vehicle.category, categoryList);

    const fuelList = byFuelType.get(vehicle.fuelType) || [];
    fuelList.push(vehicle);
    byFuelType.set(vehicle.fuelType, fuelList);

    const brandList = byBrand.get(vehicle.makeName) || [];
    brandList.push(vehicle);
    byBrand.set(vehicle.makeName, brandList);

    const styleList = byBodyStyle.get(vehicle.bodyStyle) || [];
    styleList.push(vehicle);
    byBodyStyle.set(vehicle.bodyStyle, styleList);

    const avgPrice = (vehicle.priceRange.min + vehicle.priceRange.max) / 2;
    if (avgPrice < 80000) {
      priceBands.budget.push(vehicle);
    } else if (avgPrice < 150000) {
      priceBands.mid.push(vehicle);
    } else if (avgPrice < 300000) {
      priceBands.premium.push(vehicle);
    } else {
      priceBands.luxury.push(vehicle);
    }
  }

  const prices = vehicles.flatMap((v) => [v.priceRange.min, v.priceRange.max]).filter((p) => p > 0);
  const totalVariants = vehicles.reduce((sum, v) => sum + v.variants.length, 0);

  const stats: VehicleDatasetStats = {
    totalVehicles: vehicles.length,
    totalVariants,
    totalBrands: byBrand.size,
    fuelTypeDistribution: {
      Petrol: byFuelType.get('Petrol')?.length || 0,
      Electric: byFuelType.get('Electric')?.length || 0,
      CNG: byFuelType.get('CNG')?.length || 0,
      Hybrid: byFuelType.get('Hybrid')?.length || 0
    },
    bodyStyleDistribution: {
      Sports: byBodyStyle.get('Sports')?.length || 0,
      Street: byBodyStyle.get('Street')?.length || 0,
      Cruiser: byBodyStyle.get('Cruiser')?.length || 0,
      Commuter: byBodyStyle.get('Commuter')?.length || 0,
      Scooter: byBodyStyle.get('Scooter')?.length || 0,
      Adventure: byBodyStyle.get('Adventure')?.length || 0,
      Naked: byBodyStyle.get('Naked')?.length || 0
    },
    priceRange: {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0,
      avg: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
    },
    brandDistribution: Object.fromEntries(
      Array.from(byBrand.entries()).map(([brand, list]) => [brand, list.length])
    ),
    zoneDistribution: Object.fromEntries(
      Array.from(byZone.entries()).map(([zone, list]) => [zone, list.length])
    )
  };

  return {
    byId,
    byZone,
    byCategory,
    byFuelType,
    byBrand,
    byBodyStyle,
    priceBands,
    stats
  };
}

class VehicleDataLoader {
  private config: VehicleDataLoaderConfig;
  private data: VehicleDataIndex | null = null;
  private loadPromise: Promise<DataLoadResult<VehicleDataIndex>> | null = null;

  constructor(config: Partial<VehicleDataLoaderConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async load(): Promise<DataLoadResult<VehicleDataIndex>> {
    if (this.data) {
      return {
        data: this.data,
        success: true,
        errors: [],
        warnings: [],
        metadata: {
          loadTime: 0,
          recordCount: this.data.stats.totalVehicles,
          source: 'cache',
          version: '1.0.0'
        }
      };
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.performLoad();
    return this.loadPromise;
  }

  private async performLoad(): Promise<DataLoadResult<VehicleDataIndex>> {
    const startTime = performance.now();
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    try {
      if (this.config.cacheEnabled) {
        const cached = await cacheRepo.get<VehicleDataIndex>(this.config.cacheKey);
        if (cached) {
          this.data = cached;
          return {
            data: cached,
            success: true,
            errors: [],
            warnings: ['Loaded from cache'],
            metadata: {
              loadTime: performance.now() - startTime,
              recordCount: cached.stats.totalVehicles,
              source: 'cache',
              version: '1.0.0'
            }
          };
        }
      }

      const rawData = rawVehicleData as Record<string, unknown>[];

      if (!Array.isArray(rawData)) {
        throw new Error('Invalid data format: expected array');
      }

      const vehicles: Vehicle[] = [];

      for (let i = 0; i < rawData.length; i++) {
        try {
          const normalized = normalizeVehicle(rawData[i]);

          if (this.config.validationEnabled) {
            const validationErrors = validateVehicle(normalized, i);
            errors.push(...validationErrors);

            if (validationErrors.some((e) => e.code === 'MISSING_ID' || e.code === 'MISSING_NAME')) {
              warnings.push(`Skipped invalid vehicle at index ${i}`);
              continue;
            }
          }

          vehicles.push(normalized);
        } catch (error) {
          errors.push({
            path: `[${i}]`,
            message: error instanceof Error ? error.message : 'Unknown error',
            value: rawData[i],
            code: 'NORMALIZATION_ERROR'
          });
        }
      }

      if (this.config.indexingEnabled) {
        this.data = createDataIndex(vehicles);
      } else {
        const emptyMap = new Map();
        this.data = {
          byId: new Map(vehicles.map((v) => [v.id, v])),
          byZone: emptyMap,
          byCategory: emptyMap,
          byFuelType: emptyMap,
          byBrand: emptyMap,
          byBodyStyle: emptyMap,
          priceBands: { budget: [], mid: [], premium: [], luxury: [] },
          stats: {
            totalVehicles: vehicles.length,
            totalVariants: vehicles.reduce((sum, v) => sum + v.variants.length, 0),
            totalBrands: 0,
            fuelTypeDistribution: { Petrol: 0, Electric: 0, CNG: 0, Hybrid: 0 },
            bodyStyleDistribution: { Sports: 0, Street: 0, Cruiser: 0, Commuter: 0, Scooter: 0, Adventure: 0, Naked: 0 },
            priceRange: { min: 0, max: 0, avg: 0 },
            brandDistribution: {},
            zoneDistribution: {}
          }
        };
      }

      if (this.config.cacheEnabled) {
        await cacheRepo.set(this.config.cacheKey, this.data, this.config.cacheTTL);
      }

      const loadTime = performance.now() - startTime;

      return {
        data: this.data,
        success: errors.length === 0 || vehicles.length > 0,
        errors,
        warnings,
        metadata: {
          loadTime,
          recordCount: vehicles.length,
          source: 'json',
          version: '1.0.0'
        }
      };
    } catch (error) {
      return {
        data: null as unknown as VehicleDataIndex,
        success: false,
        errors: [
          {
            path: 'root',
            message: error instanceof Error ? error.message : 'Unknown error',
            value: error,
            code: 'LOAD_ERROR'
          }
        ],
        warnings,
        metadata: {
          loadTime: performance.now() - startTime,
          recordCount: 0,
          source: 'error',
          version: '1.0.0'
        }
      };
    } finally {
      this.loadPromise = null;
    }
  }

  getData(): VehicleDataIndex | null {
    return this.data;
  }

  getVehicleById(id: string): Vehicle | undefined {
    return this.data?.byId.get(id);
  }

  getVehiclesByZone(zoneId: string): Vehicle[] {
    return this.data?.byZone.get(zoneId) || [];
  }

  getVehiclesByFuelType(fuelType: FuelType): Vehicle[] {
    return this.data?.byFuelType.get(fuelType) || [];
  }

  getVehiclesByBrand(brand: string): Vehicle[] {
    return this.data?.byBrand.get(brand) || [];
  }

  getVehiclesByCategory(category: string): Vehicle[] {
    return this.data?.byCategory.get(category) || [];
  }

  getAllVehicles(): Vehicle[] {
    return Array.from(this.data?.byId.values() || []);
  }

  getStats(): VehicleDatasetStats | null {
    return this.data?.stats || null;
  }

  getZones(): VehicleZone[] {
    return VEHICLE_ZONES;
  }

  getZoneById(zoneId: string): VehicleZone | undefined {
    return VEHICLE_ZONES.find((z) => z.id === zoneId);
  }

  async clearCache(): Promise<void> {
    if (this.config.cacheEnabled) {
      await cacheRepo.delete(this.config.cacheKey);
    }
    this.data = null;
  }

  searchVehicles(query: string): Vehicle[] {
    if (!this.data) return [];

    const lowerQuery = query.toLowerCase();
    return this.getAllVehicles().filter(
      (v) =>
        v.name.toLowerCase().includes(lowerQuery) ||
        v.makeName.toLowerCase().includes(lowerQuery) ||
        v.modelName.toLowerCase().includes(lowerQuery) ||
        v.tags.some((t) => t.toLowerCase().includes(lowerQuery))
    );
  }

  filterVehicles(filter: {
    fuelTypes?: FuelType[];
    brands?: string[];
    priceRange?: { min: number; max: number };
    bodyStyles?: BodyStyle[];
  }): Vehicle[] {
    return this.getAllVehicles().filter((v) => {
      if (filter.fuelTypes?.length && !filter.fuelTypes.includes(v.fuelType)) {
        return false;
      }
      if (filter.brands?.length && !filter.brands.includes(v.makeName)) {
        return false;
      }
      if (filter.priceRange) {
        const avgPrice = (v.priceRange.min + v.priceRange.max) / 2;
        if (avgPrice < filter.priceRange.min || avgPrice > filter.priceRange.max) {
          return false;
        }
      }
      if (filter.bodyStyles?.length && !filter.bodyStyles.includes(v.bodyStyle)) {
        return false;
      }
      return true;
    });
  }
}

export const vehicleDataLoader = new VehicleDataLoader();
export { VehicleDataLoader, VEHICLE_ZONES };

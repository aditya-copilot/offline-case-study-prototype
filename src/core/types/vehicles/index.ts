/**
 * Vehicle Domain Models
 * Strongly-typed domain models for the two-wheeler experience store
 */

// ============================================================================
// BASE VEHICLE TYPES
// ============================================================================

export type FuelType = 'Petrol' | 'Electric' | 'CNG' | 'Hybrid';
export type VehicleType = 'Bike' | 'Scooter' | 'Moped';
export type BodyStyle = 'Sports' | 'Street' | 'Cruiser' | 'Commuter' | 'Scooter' | 'Adventure' | 'Naked';
export type TransmissionType = 'Manual' | 'Automatic' | 'CVT' | 'DCT';

export interface VehicleColor {
  id: number;
  name: string;
  hexCode: string;
  imagePath: string;
}

export interface VehicleVariant {
  id: number;
  name: string;
  maskingName: string;
  price: number;
  formattedPrice: string;
  priceLabel: string;
  specs: Record<string, string>;
  colors: VehicleColor[];
  isJustLaunched: boolean;
  isSpecialVersion: boolean;
}

export interface VehicleSpecification {
  name: string;
  values: string[];
  unit: string;
  description: string;
  dataTypeId: number;
  isDistinct: boolean;
}

export interface VehicleSpecCategory {
  category: string;
  specs: VehicleSpecification[];
}

export interface VehicleReviewQA {
  questionId: number;
  question: string;
  answer: string;
}

export interface VehicleReview {
  id: number;
  title: string;
  description: string;
  rating: number;
  username: string;
  customerId: number;
  entryDate: string;
  upvotes: number;
  downvotes: number;
  reportedMileage?: number;
  isWinner: boolean;
  ratingBreakdown: Array<{
    questionId: number;
    question: string;
    rating: string;
  }>;
  qa: VehicleReviewQA[];
  userImages: Array<{
    imageId: number;
    imagePath: string;
    thumbPath: string;
  }>;
}

export interface CityPrice {
  cityId: number;
  cityName: string;
  maskingName: string;
  minPrice: number;
  maxPrice: number;
  formattedPrice: string;
  imagePath: string;
}

export interface VehicleFAQ {
  question: string;
  answer: string;
  category: string;
}

export interface ExpertReview {
  title: string;
  description: string;
  videoUrl: string;
  imagePath: string;
  publishedDate: string;
}

// ============================================================================
// CORE VEHICLE INTERFACE
// ============================================================================

export interface Vehicle {
  // Identity
  id: string;
  name: string;
  url: string;

  // Classification
  vehicleType: VehicleType;
  fuelType: FuelType;
  bodyStyle: BodyStyle;

  // Manufacturer Details
  makeId: number;
  makeName: string;
  makeMaskingName: string;
  modelId: number;
  modelName: string;
  modelMaskingName: string;
  seoName: string;

  // Status & Availability
  isElectric: boolean;
  isNewlyLaunched: boolean;
  isBS6Phase2: boolean;
  status: number;
  launchedOn: string;
  discontinuedOn: string;

  // Ratings
  overallRating: number;
  totalReviews: number;
  totalRatings: number;

  // Media
  imagePath: string;
  brochurePath: string;
  has360View: boolean;

  // Variants & Pricing
  variants: VehicleVariant[];
  priceRange: {
    min: number;
    max: number;
    formatted: string;
  };
  cityPrices: CityPrice[];

  // Specifications
  specifications: VehicleSpecCategory[];
  keySpecs: Record<string, string>;

  // Features
  features: Array<{
    name: string;
    id: number;
    category: string;
  }>;

  // Reviews & Content
  reviews: VehicleReview[];
  reviewSummary: {
    totalReviews: number;
    totalRatings: number;
    overallRating: string;
    positiveReviewsCount: number;
    criticalReviewsCount: number;
  };
  expertReviews: ExpertReview[];
  faqs: VehicleFAQ[];

  // Additional Info
  colors: VehicleColor[];
  mileageInfo: {
    araiMileage: number;
    userReportedMileage: number;
    modelName: string;
  };

  // Derived fields for UI/AI
  zoneId: string;
  category: string;
  tags: string[];
  embedding?: number[];
}

// ============================================================================
// SPECIALIZED VEHICLE TYPES
// ============================================================================

export interface EVVehicle extends Vehicle {
  fuelType: 'Electric';
  evSpecifics: {
    batteryCapacity: string;
    chargingTime: string;
    range: number;
    motorPower: string;
    chargingPort: string;
    regenerativeBraking: boolean;
    batteryWarranty?: string;
  };
}

export interface PetrolBike extends Vehicle {
  fuelType: 'Petrol';
  engineSpecifics: {
    displacement: string;
    cylinders: number;
    cooling: string;
    fuelInjection: string;
    transmission: string;
    clutch: string;
    emissionStandard: string;
  };
}

export interface Scooter extends Vehicle {
  vehicleType: 'Scooter';
  scooterSpecifics: {
    underSeatStorage: boolean;
    storageCapacity?: string;
    footboardType: string;
    mobileConnectivity: boolean;
    navigation: boolean;
    bootLight: boolean;
    externalFuelFiller: boolean;
  };
}

export interface PremiumBike extends Vehicle {
  // Premium bikes have price > 150000
  priceRange: {
    min: number; // >= 150000
    max: number;
    formatted: string;
  };
  premiumFeatures: {
    hasQuickShifter: boolean;
    hasTractionControl: boolean;
    hasRidingModes: boolean;
    hasUSDForks: boolean;
    hasDualChannelABS: boolean;
    hasSlipperClutch: boolean;
    hasBluetooth: boolean;
    hasNavigation: boolean;
  };
}

// ============================================================================
// VEHICLE FILTERS & QUERIES
// ============================================================================

export interface VehicleFilter {
  fuelTypes?: FuelType[];
  bodyStyles?: BodyStyle[];
  priceRange?: { min: number; max: number };
  brands?: string[];
  displacementRange?: { min: number; max: number };
  mileageRange?: { min: number; max: number };
  features?: string[];
  zones?: string[];
}

export interface VehicleSortOption {
  field: 'price' | 'rating' | 'mileage' | 'displacement' | 'power' | 'name';
  direction: 'asc' | 'desc';
}

export interface VehicleSearchQuery {
  query: string;
  filters?: VehicleFilter;
  sort?: VehicleSortOption;
  limit?: number;
  offset?: number;
}

// ============================================================================
// VEHICLE DATA INDEX
// ============================================================================

export interface VehicleDataIndex {
  // Primary index
  byId: Map<string, Vehicle>;

  // Grouped indices
  byZone: Map<string, Vehicle[]>;
  byCategory: Map<string, Vehicle[]>;
  byFuelType: Map<string, Vehicle[]>;
  byBrand: Map<string, Vehicle[]>;
  byBodyStyle: Map<string, Vehicle[]>;

  // Price ranges
  priceBands: {
    budget: Vehicle[];      // < 80k
    mid: Vehicle[];         // 80k - 150k
    premium: Vehicle[];     // 150k - 300k
    luxury: Vehicle[];      // > 300k
  };

  // Derived analytics
  stats: VehicleDatasetStats;
}

export interface VehicleDatasetStats {
  totalVehicles: number;
  totalVariants: number;
  totalBrands: number;
  fuelTypeDistribution: Record<FuelType, number>;
  bodyStyleDistribution: Record<BodyStyle, number>;
  priceRange: { min: number; max: number; avg: number };
  brandDistribution: Record<string, number>;
  zoneDistribution: Record<string, number>;
}

// ============================================================================
// ZONE DEFINITIONS
// ============================================================================

export type VehicleZoneType =
  | 'ev-showroom'      // Electric vehicles
  | 'scooter-zone'     // Scooters & mopeds
  | 'commuter-zone'    // Commuter bikes
  | 'sports-zone'      // Sports bikes
  | 'premium-zone'     // Premium bikes
  | 'cruiser-zone'     // Cruiser bikes
  | 'adventure-zone'   // Adventure/touring bikes
  | 'service-center'   // Service area
  | 'accessories'      // Accessories & gear
  | 'test-ride';       // Test ride area

export interface VehicleZone {
  id: VehicleZoneType;
  name: string;
  description: string;
  color: string;
  icon: string;
  filterCriteria: {
    fuelTypes?: FuelType[];
    bodyStyles?: BodyStyle[];
    priceRange?: { min: number; max: number };
    features?: string[];
  };
  beaconIds: string[];
  position: { x: number; y: number };
  bounds: { width: number; height: number };
}

// ============================================================================
// AI CONTEXT TYPES
// ============================================================================

export interface VehicleAIContext {
  // Product context
  vehicles: Vehicle[];
  availableBrands: string[];
  priceDistribution: {
    bands: Array<{ min: number; max: number; count: number; label: string }>;
    median: number;
  };

  // Feature clusters
  featureTags: Array<{
    tag: string;
    count: number;
    vehicles: string[];
  }>;

  // Brand clusters
  brandClusters: Array<{
    brand: string;
    count: number;
    avgPrice: number;
    topModels: string[];
  }>;

  // Zone layout
  zones: VehicleZone[];
  zoneVehicleCounts: Record<string, number>;

  // Recommendation data
  popularVehicles: string[];
  trendingVehicles: string[];
  comparablePairs: Array<[string, string]>;
}

export interface VehicleRecommendationContext {
  userPreferences?: {
    preferredFuelType?: FuelType;
    preferredBodyStyle?: BodyStyle;
    budgetRange?: { min: number; max: number };
    preferredBrands?: string[];
    priorityFeatures?: string[];
  };
  currentZone?: string;
  viewedVehicles: string[];
  sessionDuration: number;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface VehicleAnalyticsEvent {
  type: 'vehicle_view' | 'vehicle_compare' | 'variant_select' | 'color_change' | 'price_check' | 'spec_expand';
  vehicleId: string;
  variantId?: number;
  colorId?: number;
  cityId?: number;
  timestamp: number;
  sessionId: string;
  dwellTime?: number;
  metadata?: Record<string, unknown>;
}

export interface VehicleAnalyticsMetrics {
  mostViewedVehicles: Array<{ vehicleId: string; count: number }>;
  zoneHeatmap: Record<string, number>;
  priceInterestBands: Record<string, number>;
  fuelPreferenceTrends: Record<FuelType, number>;
  brandInterestDistribution: Record<string, number>;
  featureInterestTags: Array<{ tag: string; count: number }>;
  averageSessionDuration: number;
  conversionFunnel: {
    view: number;
    compare: number;
    detail: number;
    intent: number;
  };
}

// ============================================================================
// GAMIFICATION TYPES
// ============================================================================

export type VehicleMissionType =
  | 'explore_zone'
  | 'find_vehicle'
  | 'compare_vehicles'
  | 'discover_feature'
  | 'test_ride_booking'
  | 'price_check'
  | 'variant_explore'
  | 'brand_exploration';

export interface VehicleMission {
  id: string;
  type: VehicleMissionType;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  targetVehicleId?: string;
  targetZoneId?: string;
  targetFeature?: string;
  targetBrand?: string;
  requirements: Array<{
    type: string;
    target: number;
    current: number;
  }>;
  rewards: {
    xp: number;
    points: number;
    badgeId?: string;
  };
  completed: boolean;
  expiresAt?: number;
}

export interface VehicleDiscoveryChallenge {
  id: string;
  name: string;
  description: string;
  criteria: {
    type: 'highest_range' | 'lowest_price' | 'highest_mileage' | 'most_powerful' | 'newest';
    fuelType?: FuelType;
    bodyStyle?: BodyStyle;
  };
  targetVehicleId: string;
  reward: {
    xp: number;
    badgeName: string;
    badgeIcon: string;
  };
  completed: boolean;
  completedAt?: number;
}

// ============================================================================
// UI COMPONENT TYPES
// ============================================================================

export interface VehicleCardProps {
  vehicle: Vehicle;
  variant?: 'compact' | 'standard' | 'featured' | 'detailed';
  showPrice?: boolean;
  showSpecs?: boolean;
  showRating?: boolean;
  onClick?: (vehicle: Vehicle) => void;
  onCompare?: (vehicle: Vehicle) => void;
  isComparing?: boolean;
  isFavorite?: boolean;
  lazyLoadImage?: boolean;
  priority?: boolean;
}

export interface VehicleDetailPanelProps {
  vehicle: Vehicle;
  initialVariantId?: number;
  initialColorId?: number;
  onVariantChange?: (variant: VehicleVariant) => void;
  onColorChange?: (color: VehicleColor) => void;
  onClose?: () => void;
  onCompare?: () => void;
  onBookTestRide?: () => void;
  showSpecs?: boolean;
  showReviews?: boolean;
  showVariants?: boolean;
}

export interface VehicleComparisonViewProps {
  vehicles: Vehicle[];
  onRemove?: (vehicleId: string) => void;
  onClearAll?: () => void;
  maxComparisons?: number;
}

// ============================================================================
// DATA LOADER TYPES
// ============================================================================

export interface DataLoadResult<T> {
  data: T;
  success: boolean;
  errors: ValidationError[];
  warnings: string[];
  metadata: {
    loadTime: number;
    recordCount: number;
    source: string;
    version: string;
  };
}

export interface ValidationError {
  path: string;
  message: string;
  value: unknown;
  code: string;
}

export interface VehicleDataLoaderConfig {
  dataSource: string | (() => Promise<unknown[]>);
  validationEnabled: boolean;
  normalizationEnabled: boolean;
  indexingEnabled: boolean;
  cacheEnabled: boolean;
  cacheKey: string;
  cacheTTL: number;
}

// ============================================================================
// IMAGE RESOLVER TYPES
// ============================================================================

export interface ImageResolverConfig {
  basePath: string;
  fallbackImage: string;
  supportedFormats: string[];
  lazyLoadThreshold: number;
  preloadHeroCount: number;
}

export interface ResolvedImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  isFallback: boolean;
  loading: 'eager' | 'lazy';
}

export interface ImagePreloadQueue {
  vehicleIds: string[];
  priority: 'high' | 'medium' | 'low';
  onProgress?: (loaded: number, total: number) => void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error' | 'refreshing';

export interface AsyncData<T> {
  data: T | null;
  state: LoadingState;
  error: Error | null;
  lastUpdated?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export type VehicleEventCallback = (event: VehicleAnalyticsEvent) => void;

export interface VehicleEventEmitter {
  on(event: string, callback: VehicleEventCallback): void;
  off(event: string, callback: VehicleEventCallback): void;
  emit(event: string, data: VehicleAnalyticsEvent): void;
}

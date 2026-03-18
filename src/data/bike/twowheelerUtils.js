// 2-Wheeler Recommendation Engine & Data Utilities
// Provides intelligent filtering, searching, and recommendation capabilities

import { twowheelers as rawTwowheelers } from './twowheelerProducts';

const twowheelers = rawTwowheelers.map(v => ({
  ...v,
  model_slug: v.model_details?.model_masking_name || v.model_slug,
  make_slug: v.model_details?.make_masking_name || v.make_slug,
  display_name: v.bike_name || v.model_details?.model_name || v.display_name,
  rating: v.model_details?.overall_rating || v.rating || 4.0,
  model_image: v.model_details?.image_path || v.model_image,
  ex_showroom_price: v.model_details?.price || v.ex_showroom_price || 
    (v.variants && v.variants[0]?.ex_showroom_price) || 0,
  vehicle_type_slug: v.model_details?.body_style_id === 13 ? 'scooters' : 
    v.model_details?.is_electric ? 'electric+vehicles' : 'bikes'
})).filter(v => v.model_slug);

// ============================================
// SHOWROOM CONFIGURATION
// ============================================
export const showroomConfig = {
  name: "HyperCredit 2-Wheeler Showroom",
  location: "Bangalore, Karnataka",
  openingHours: "10:00 AM - 8:00 PM",
  contactNumber: "+91 1800-123-4567",
  
  // Availability & Delivery Configuration
  availability: {
    inStockThreshold: 5, // vehicles available immediately
    fastDeliveryDays: 3, // available within 3 days
    standardDeliveryDays: 14, // standard delivery timeline
    customColorDays: 21, // custom color availability
  },
  
  // EMI & Finance Options
  financeOptions: {
    minDownPayment: 0, // 0 down payment available
    maxTenure: 36, // months
    interestRate: 8.5, // starting interest rate
    processingFee: 999,
  }
};

// ============================================
// VEHICLE TYPE CLASSIFICATION
// ============================================
export const VEHICLE_TYPES = {
  ICE_BIKE: 'bikes',
  ICE_SCOOTER: 'scooters',
  ELECTRIC: 'electric+vehicles'
};

export const VEHICLE_TYPE_LABELS = {
  [VEHICLE_TYPES.ICE_BIKE]: 'Motorcycle (Petrol)',
  [VEHICLE_TYPES.ICE_SCOOTER]: 'Scooter (Petrol)',
  [VEHICLE_TYPES.ELECTRIC]: 'Electric Vehicle'
};

// ============================================
// PURPOSE TAGS FOR RECOMMENDATIONS
// ============================================
export const PURPOSE_TAGS = {
  DAILY_COMMUTE: {
    id: 'daily_commute',
    label: 'Daily Commute',
    description: 'For office/college daily travel',
    priorityFeatures: ['mileage', 'comfort', 'low_maintenance'],
    idealCcRange: { min: 100, max: 160 }
  },
  LONG_RIDES: {
    id: 'long_rides',
    label: 'Long Rides & Touring',
    description: 'For highway trips and weekend rides',
    priorityFeatures: ['power', 'comfort', 'stability', 'fuel_tank'],
    idealCcRange: { min: 160, max: 400 }
  },
  SPORTS_RIDING: {
    id: 'sports',
    label: 'Sports & Performance',
    description: 'For speed enthusiasts and track lovers',
    priorityFeatures: ['power', 'acceleration', 'handling', 'braking'],
    idealCcRange: { min: 180, max: 400 }
  },
  FAMILY_USE: {
    id: 'family',
    label: 'Family Use',
    description: 'Safe and comfortable for family members',
    priorityFeatures: ['safety', 'comfort', 'storage', 'ease_of_use'],
    idealCcRange: { min: 100, max: 150 }
  },
  OFF_ROAD: {
    id: 'off_road',
    label: 'Off-Road & Adventure',
    description: 'For rough terrains and adventure riding',
    priorityFeatures: ['ground_clearance', 'suspension', 'durability'],
    idealCcRange: { min: 150, max: 300 }
  },
  ECO_FRIENDLY: {
    id: 'eco',
    label: 'Eco-Friendly',
    description: 'Zero emissions, sustainable choice',
    priorityFeatures: ['range', 'charging_time', 'zero_emissions'],
    idealCcRange: { min: 0, max: 0 } // Electric only
  }
};

// ============================================
// PRICE SEGMENTS
// ============================================
export const PRICE_SEGMENTS = {
  BUDGET: { min: 0, max: 70000, label: 'Budget Friendly', badge: '💰' },
  MID_RANGE: { min: 70000, max: 120000, label: 'Mid Range', badge: '⚡' },
  PREMIUM: { min: 120000, max: 200000, label: 'Premium', badge: '✨' },
  LUXURY: { min: 200000, max: Infinity, label: 'Luxury', badge: '👑' }
};

// ============================================
// AVAILABILITY STATUS
// ============================================
export const AVAILABILITY_STATUS = {
  IN_STOCK: { 
    code: 'in_stock', 
    label: 'In Stock - Ready', 
    badge: '✅',
    deliveryTime: 'Same Day',
    color: '#10b981'
  },
  FAST_DELIVERY: { 
    code: 'fast', 
    label: 'Fast Delivery', 
    badge: '🚀',
    deliveryTime: '2-3 Days',
    color: '#3b82f6'
  },
  STANDARD: { 
    code: 'standard', 
    label: 'Standard Delivery', 
    badge: '📦',
    deliveryTime: '7-14 Days',
    color: '#f59e0b'
  },
  PRE_ORDER: { 
    code: 'pre_order', 
    label: 'Pre-Order', 
    badge: '🔔',
    deliveryTime: '15-30 Days',
    color: '#8b5cf6'
  }
};

// ============================================
// CORE UTILITY FUNCTIONS
// ============================================

/**
 * Get all unique brands from the catalog
 */
export const getAllBrands = () => {
  const brands = new Set(twowheelers.map(v => v.make_slug));
  return Array.from(brands).sort();
};

/**
 * Get all unique vehicle types
 */
export const getAllVehicleTypes = () => {
  const types = new Set(twowheelers.map(v => v.vehicle_type_slug));
  return Array.from(types).map(type => ({
    slug: type,
    label: VEHICLE_TYPE_LABELS[type] || type
  }));
};

/**
 * Get price range statistics
 */
export const getPriceRangeStats = () => {
  const prices = twowheelers.map(v => v.ex_showroom_price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    median: prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)]
  };
};

/**
 * Get vehicle type (ICE vs EV)
 */
export const getVehicleType = (vehicle) => {
  if (vehicle.vehicle_type_slug === VEHICLE_TYPES.ELECTRIC) {
    return 'EV';
  }
  return 'ICE';
};

/**
 * Get power/CC display value
 */
export const getPowerDisplay = (vehicle) => {
  if (getVehicleType(vehicle) === 'EV') {
    return `${vehicle.cc.value}W`;
  }
  return `${vehicle.cc.value}cc`;
};

/**
 * Get mileage/efficiency display
 */
export const getEfficiencyDisplay = (vehicle) => {
  if (getVehicleType(vehicle) === 'EV') {
    return vehicle.range || 'N/A';
  }
  return `${vehicle.mileage?.value || 'N/A'} kmpl`;
};

// ============================================
// FILTERING FUNCTIONS
// ============================================

/**
 * Filter by price range
 */
export const filterByPriceRange = (minPrice = 0, maxPrice = Infinity) => {
  return twowheelers.filter(v => 
    v.ex_showroom_price >= minPrice && v.ex_showroom_price <= maxPrice
  );
};

/**
 * Filter by vehicle type (ICE/EV)
 */
export const filterByVehicleType = (type) => {
  if (type === 'EV') {
    return twowheelers.filter(v => getVehicleType(v) === 'EV');
  } else if (type === 'ICE') {
    return twowheelers.filter(v => getVehicleType(v) === 'ICE');
  }
  return twowheelers.filter(v => v.vehicle_type_slug === type);
};

/**
 * Filter by brand
 */
export const filterByBrand = (brand) => {
  return twowheelers.filter(v => 
    v.make_slug.toLowerCase() === brand.toLowerCase()
  );
};

/**
 * Filter by purpose/tag
 */
export const filterByPurpose = (purposeId) => {
  const purpose = PURPOSE_TAGS[purposeId];
  if (!purpose) return twowheelers;
  
  return twowheelers.filter(v => {
    const cc = v.cc.value;
    const isEv = getVehicleType(v) === 'EV';
    
    // For eco-friendly, only return EVs
    if (purposeId === 'ECO_FRIENDLY') return isEv;
    
    // Check CC range for ICE vehicles
    if (!isEv) {
      return cc >= purpose.idealCcRange.min && cc <= purpose.idealCcRange.max;
    }
    
    // For EVs, check if they match the purpose (commute/family are good for EVs)
    if (isEv && (purposeId === 'DAILY_COMMUTE' || purposeId === 'FAMILY_USE' || purposeId === 'ECO_FRIENDLY')) {
      return true;
    }
    
    return false;
  });
};

/**
 * Filter by availability status
 */
export const filterByAvailability = (status) => {
  // Simulate availability logic based on vehicle popularity
  // In real implementation, this would come from inventory API
  const vehicleAvailability = getVehicleAvailability();
  
  return twowheelers.filter(v => {
    const avail = vehicleAvailability[v.model_slug] || AVAILABILITY_STATUS.STANDARD;
    return avail.code === status;
  });
};

// ============================================
// SEARCH FUNCTION
// ============================================

/**
 * Search vehicles by text query
 */
export const searchVehicles = (query) => {
  if (!query || query.trim() === '') return [];
  
  const searchTerm = query.toLowerCase().trim();
  const results = twowheelers.filter(v => {
    const searchFields = [
      v.display_name,
      v.make_slug,
      v.model_slug,
      v.variant_slug,
      v.vehicle_type_slug
    ].map(f => (f || '').toLowerCase());
    
    return searchFields.some(field => field.includes(searchTerm));
  });
  
  return results;
};

/**
 * Extract price constraint from query
 */
export const extractPriceConstraint = (query) => {
  const query_lower = query.toLowerCase();
  
  const underPattern = /(?:under|below|less than|within|below rs\.?|under rs\.?)\s*(\d+(?:\.\d+)?)\s*(lakh|lac|k|thousand)?/i;
  const aroundPattern = /(?:around|about|near|approximately)\s*(?:rs\.?\s*)?(\d+(?:\.\d+)?)\s*(lakh|lac|k|thousand)?/i;
  const rangePattern = /(\d+(?:\.\d+)?)\s*(lakh|lac|k|thousand)?\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*(lakh|lac|k|thousand)?/i;
  const exactPattern = /(?:rs\.?|₹)\s*(\d+(?:\.\d+)?)\s*(lakh|lac|k|thousand)?/i;
  
  let min = 0;
  let max = Infinity;
  
  const convertToPrice = (amount, unit) => {
    if (unit === 'lakh' || unit === 'lac') return amount * 100000;
    if (unit === 'k' || unit === 'thousand') return amount * 1000;
    return amount;
  };
  
  const underMatch = query_lower.match(underPattern);
  if (underMatch) {
    const amount = parseFloat(underMatch[1]);
    const unit = (underMatch[2] || '').toLowerCase();
    max = convertToPrice(amount, unit);
  }
  
  const aroundMatch = query_lower.match(aroundPattern);
  if (aroundMatch) {
    const amount = parseFloat(aroundMatch[1]);
    const unit = (aroundMatch[2] || '').toLowerCase();
    const basePrice = convertToPrice(amount, unit);
    min = basePrice * 0.8;
    max = basePrice * 1.2;
  }
  
  const rangeMatch = query_lower.match(rangePattern);
  if (rangeMatch) {
    const amount1 = parseFloat(rangeMatch[1]);
    const unit1 = (rangeMatch[2] || '').toLowerCase();
    min = convertToPrice(amount1, unit1);
    
    const amount2 = parseFloat(rangeMatch[3]);
    const unit2 = (rangeMatch[4] || '').toLowerCase();
    max = convertToPrice(amount2, unit2);
  }
  
  if (min === 0 && max === Infinity) {
    const exactMatch = query_lower.match(exactPattern);
    if (exactMatch) {
      const amount = parseFloat(exactMatch[1]);
      const unit = (exactMatch[2] || '').toLowerCase();
      const basePrice = convertToPrice(amount, unit);
      min = basePrice * 0.8;
      max = basePrice * 1.2;
    }
  }
  
  return { min, max };
};

// ============================================
// RECOMMENDATION ENGINE
// ============================================

/**
 * Get smart recommendations based on user preferences
 */
export const getRecommendations = (preferences = {}) => {
  let results = [...twowheelers];
  
  if (preferences.priceRange) {
    const { min, max } = preferences.priceRange;
    if (min !== undefined && max !== undefined) {
      results = results.filter(v => v.ex_showroom_price >= min && v.ex_showroom_price <= max);
    }
  }
  
  if (preferences.vehicleType) {
    if (preferences.vehicleType === 'EV') {
      results = results.filter(v => getVehicleType(v) === 'EV');
    } else if (preferences.vehicleType === 'ICE') {
      results = results.filter(v => getVehicleType(v) === 'ICE');
    }
  }
  
  if (preferences.vehicleCategory) {
    results = results.filter(v => v.vehicle_type_slug === preferences.vehicleCategory);
  }
  
  if (preferences.brand) {
    results = results.filter(v => 
      v.make_slug.toLowerCase() === preferences.brand.toLowerCase()
    );
  }
  
  if (preferences.purpose) {
    const purposeFilter = filterByPurpose(preferences.purpose);
    const purposeSlugs = new Set(purposeFilter.map(v => v.model_slug));
    results = results.filter(v => purposeSlugs.has(v.model_slug));
  }
  
  results.sort((a, b) => {
    const availA = getVehicleAvailability(a.model_slug);
    const availB = getVehicleAvailability(b.model_slug);
    
    if (availA.code === 'in_stock' && availB.code !== 'in_stock') return -1;
    if (availB.code === 'in_stock' && availA.code !== 'in_stock') return 1;
    
    return (b.rating || 0) - (a.rating || 0);
  });
  
  return results;
};

/**
 * Get similar vehicles
 */
export const getSimilarVehicles = (vehicleSlug, limit = 3) => {
  const targetVehicle = twowheelers.find(v => v.model_slug === vehicleSlug);
  if (!targetVehicle) return [];
  
  const targetType = getVehicleType(targetVehicle);
  const targetPrice = targetVehicle.ex_showroom_price;
  
  return twowheelers
    .filter(v => 
      v.model_slug !== vehicleSlug && 
      getVehicleType(v) === targetType
    )
    .map(v => ({
      ...v,
      priceDiff: Math.abs(v.ex_showroom_price - targetPrice),
      similarity: calculateSimilarity(targetVehicle, v)
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
};

/**
 * Calculate similarity score between two vehicles
 */
const calculateSimilarity = (v1, v2) => {
  let score = 0;
  
  // Same brand
  if (v1.make_slug === v2.make_slug) score += 30;
  
  // Similar price (within 20%)
  const priceDiff = Math.abs(v1.ex_showroom_price - v2.ex_showroom_price);
  const priceDiffPercent = priceDiff / v1.ex_showroom_price;
  score += Math.max(0, 25 - priceDiffPercent * 100);
  
  // Similar CC/Power
  const ccDiff = Math.abs(v1.cc.value - v2.cc.value);
  const ccDiffPercent = ccDiff / v1.cc.value;
  score += Math.max(0, 25 - ccDiffPercent * 100);
  
  // Same vehicle type
  if (v1.vehicle_type_slug === v2.vehicle_type_slug) score += 20;
  
  return score;
};

// ============================================
// AVAILABILITY SIMULATION
// ============================================

/**
 * Get availability status for a vehicle
 * In real implementation, this would fetch from inventory API
 */
export const getVehicleAvailability = (vehicleSlug) => {
  // Simulate availability based on vehicle characteristics
  // Popular models (high rating + preferred) are more likely in stock
  
  if (!vehicleSlug) {
    // Return map of all vehicles
    const availabilityMap = {};
    twowheelers.forEach(v => {
      availabilityMap[v.model_slug] = generateAvailability(v);
    });
    return availabilityMap;
  }
  
  const vehicle = twowheelers.find(v => v.model_slug === vehicleSlug);
  if (!vehicle) return AVAILABILITY_STATUS.STANDARD;
  
  return generateAvailability(vehicle);
};

const generateAvailability = (vehicle) => {
  const seed = vehicle.model_slug.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const random = (seed % 100) / 100;
  
  if (random < 0.35) {
    return AVAILABILITY_STATUS.IN_STOCK;
  } else if (random < 0.55) {
    return AVAILABILITY_STATUS.FAST_DELIVERY;
  } else if (random < 0.80) {
    return AVAILABILITY_STATUS.STANDARD;
  } else {
    return AVAILABILITY_STATUS.PRE_ORDER;
  }
};

// ============================================
// EMI CALCULATOR
// ============================================

/**
 * Calculate EMI details
 */
export const calculateEMI = (principal, downPayment = 0, tenureMonths = 36, interestRate = 8.5) => {
  const loanAmount = principal - downPayment;
  const monthlyRate = interestRate / 12 / 100;
  
  const emi = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / 
              (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  
  const totalPayment = emi * tenureMonths;
  const totalInterest = totalPayment - loanAmount;
  
  return {
    emi: Math.round(emi),
    loanAmount,
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.round(totalInterest),
    downPayment,
    tenureMonths,
    interestRate
  };
};

// ============================================
// OFFERS & PROMOTIONS
// ============================================

/**
 * Get applicable offers for a vehicle
 */
export const getVehicleOffers = (vehicle) => {
  const offers = [];
  const price = vehicle.ex_showroom_price;
  
  // Cashback offers based on price segment
  if (price >= 100000) {
    offers.push({
      type: 'cashback',
      title: 'Instant Cashback',
      value: 5000,
      description: '₹5,000 instant cashback on booking'
    });
  }
  
  // Exchange bonus
  offers.push({
    type: 'exchange',
    title: 'Exchange Bonus',
    value: 10000,
    description: 'Up to ₹10,000 exchange bonus on old vehicle'
  });
  
  // No Cost EMI for premium bikes
  if (price >= 80000) {
    offers.push({
      type: 'emi',
      title: 'No Cost EMI',
      value: 0,
      description: 'No cost EMI for 6 months'
    });
  }
  
  // Special EV subsidy
  if (getVehicleType(vehicle) === 'EV') {
    offers.push({
      type: 'subsidy',
      title: 'FAME II Subsidy',
      value: 15000,
      description: '₹15,000 FAME II subsidy applicable'
    });
  }
  
  return offers;
};

// ============================================
// CONVERSATION HELPERS
// ============================================

/**
 * Generate conversation context for AI
 */
export const generateAIContext = (userPreferences = {}) => {
  const stats = getPriceRangeStats();
  const brands = getAllBrands();
  const types = getAllVehicleTypes();
  
  return `
You are a knowledgeable 2-wheeler showroom assistant at ${showroomConfig.name}.

AVAILABLE INVENTORY:
- Total vehicles: ${twowheelers.length}
- Price range: ₹${stats.min.toLocaleString()} - ₹${stats.max.toLocaleString()}
- Average price: ₹${stats.average.toLocaleString()}
- Brands: ${brands.join(', ')}
- Vehicle types: ${types.map(t => t.label).join(', ')}

USER PREFERENCES:
${Object.entries(userPreferences).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

VEHICLE TYPES:
- EV (Electric): Zero emissions, lower running cost, instant torque
- ICE (Petrol): Traditional engine, quick refueling, established infrastructure

FINANCING OPTIONS:
- Down payment: Starting from 0%
- Interest rate: Starting from 8.5%
- Maximum tenure: 36 months
- Processing fee: ₹999

DELIVERY TIMELINES:
- In Stock: Same day delivery
- Fast Delivery: 2-3 days
- Standard: 7-14 days
- Pre-order: 15-30 days

Respond in a friendly, helpful manner. Ask follow-up questions to narrow down preferences.
`;
};

/**
 * Parse user intent from message
 */
export const parseUserIntent = (message) => {
  const msg = message.toLowerCase().trim();
  const intent = {
    action: null,
    filters: {},
    entity: null
  };
  
  const simpleAffirmative = ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'correct', 'right'];
  const isSimpleAffirmative = simpleAffirmative.some(word => msg === word);
  
  if (isSimpleAffirmative) {
    intent.action = 'recommendation';
    return intent;
  }
  
  const hasPriceIndicators = msg.includes('price') || msg.includes('cost') || msg.includes('budget') || 
                             msg.includes('₹') || msg.includes('rs') || msg.includes('lakh') ||
                             msg.includes('under') || msg.includes('below') || msg.includes('less than');
  
  if (hasPriceIndicators) {
    const priceConstraint = extractPriceConstraint(message);
    if (priceConstraint.max < Infinity || priceConstraint.min > 0) {
      intent.filters.priceRange = priceConstraint;
    }
  }
  
  if (msg.includes('electric') || msg.includes('ev ') || msg.includes(' ev') || msg.includes('battery')) {
    intent.filters.vehicleType = 'EV';
  } else if (msg.includes('petrol') || msg.includes('fuel') || msg.includes('gas') || msg.includes('ice')) {
    intent.filters.vehicleType = 'ICE';
  }
  
  if (msg.includes('scooter') || msg.includes('scooty')) {
    intent.filters.vehicleCategory = 'scooters';
  } else if (msg.includes('bike') || msg.includes('motorcycle')) {
    intent.filters.vehicleCategory = 'bikes';
  }
  
  const brands = getAllBrands();
  const mentionedBrand = brands.find(b => {
    const brandLower = b.toLowerCase();
    return msg.includes(brandLower) || msg.includes(brandLower.replace(/-/g, ' '));
  });
  if (mentionedBrand) {
    intent.filters.brand = mentionedBrand;
    intent.entity = mentionedBrand;
  }
  
  const purposes = Object.entries(PURPOSE_TAGS);
  const mentionedPurpose = purposes.find(([key, p]) => {
    const labelLower = p.label.toLowerCase();
    const idLower = p.id.toLowerCase();
    return msg.includes(labelLower) || msg.includes(idLower) || 
           (msg.includes('commute') && key === 'DAILY_COMMUTE') ||
           (msg.includes('family') && key === 'FAMILY_USE') ||
           (msg.includes('tour') && key === 'LONG_RIDES') ||
           (msg.includes('sport') && key === 'SPORTS_RIDING');
  });
  if (mentionedPurpose) {
    intent.filters.purpose = mentionedPurpose[0];
  }
  
  if (msg.includes('emi') || msg.includes('finance') || msg.includes('loan') || msg.includes('installment')) {
    intent.action = 'emi_query';
  }
  
  if (msg.includes('available') || msg.includes('stock') || msg.includes('delivery') || msg.includes('ready')) {
    intent.action = 'availability_query';
  }
  
  const hasFilters = Object.keys(intent.filters).length > 0;
  if (hasFilters && !intent.action) {
    intent.action = 'recommendation';
  }
  
  if (!intent.action && !hasFilters) {
    intent.action = 'general';
  }
  
  return intent;
};

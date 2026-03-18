import { twowheelers } from './twowheelerProducts';

const BRAND_SYNONYMS = {
  'honda': ['honda', 'honda motorcycle', 'honda bike', 'Honda'],
  'bajaj': ['bajaj', 'bajaj auto', 'pulsar', 'Bajaj'],
  'tvs': ['tvs', 'tvs motor', 'tvs bike', 'TVS'],
  'yamaha': ['yamaha', 'yamaha motor', 'yamaha bike', 'Yamaha'],
  'royal-enfield': ['royal enfield', 're', 'royalenfield', 'enfield', 'bullet', 'Royal Enfield'],
  'suzuki': ['suzuki', 'suzuki motor', 'suzuki bike', 'Suzuki'],
  'hero': ['hero', 'hero motocorp', 'hero honda', 'Hero'],
  'ktm': ['ktm', 'ktm duke', 'KTM'],
  'ather': ['ather', 'ather energy', 'ather 450', 'Ather'],
  'ola': ['ola', 'ola electric', 'ola s1', 'Ola'],
  'revolt': ['revolt', 'revolt motors', 'Revolt'],
  'bounce': ['bounce', 'bounce infinity', 'Bounce'],
  'hero-electric': ['hero electric', 'heroelectric', 'Hero Electric'],
  'okinawa': ['okinawa', 'Okinawa'],
  'ampere': ['ampere', 'Ampere']
};

const MODEL_PATTERNS = {
  'pulsar': ['pulsar', 'pulsar 150', 'pulsar 180', 'pulsar 200', 'pulsar 220', 'pulsar ns', 'ns 200', 'ns 160'],
  'apache': ['apache', 'rtr 160', 'rtr 180', 'rtr 200', 'rr310', 'apache rtr'],
  'fz': ['fz', 'fz16', 'fz25', 'fz v3', 'fzs', 'fazer'],
  'bullet': ['bullet', 'bullet 350', 'bullet 500'],
  'classic': ['classic', 'classic 350', 'classic 500', 're classic'],
  'hunter': ['hunter', 'hunter 350'],
  'meteor': ['meteor', 'meteor 350'],
  'himalayan': ['himalayan', 'himalayan 411'],
  'activa': ['activa', 'activa 6g', 'activa 5g', 'activa 125'],
  'access': ['access', 'access 125'],
  'jupiter': ['jupiter', 'jupiter zx'],
  'ntorq': ['ntorq', 'ntorq 125'],
  'splendor': ['splendor', 'splendor plus', 'splendor ismart'],
  'pleasure': ['pleasure', 'pleasure plus'],
  'destini': ['destini', 'destini 125'],
  'raider': ['raider', 'raider 125'],
  'scooty': ['scooty', 'scooty pep', 'scooty zest'],
  'xl': ['xl', 'xl 100'],
  'ather 450': ['ather 450x', 'ather 450 plus', 'ather 450s', '450x', '450s'],
  'ola s1': ['ola s1', 'ola s1 pro', 'ola s1 air', 's1 pro', 's1 air'],
  'chetak': ['chetak', 'chetak electric']
};

const PURPOSE_KEYWORDS = {
  DAILY_COMMUTE: {
    keywords: ['commute', 'office', 'college', 'daily', 'regular', 'everyday', 'work', 'mileage', 'economical', 'fuel efficient', 'petrol saving'],
    preferSpecs: { 'Mileage - ARAI': { min: 50 } },
    preferScooters: false
  },
  LONG_RIDES: {
    keywords: ['touring', 'long ride', 'highway', 'trip', 'travel', 'adventure', 'weekend', 'tour', 'cruising'],
    preferSpecs: { 'Fuel Tank Capacity': { min: 10 }, 'Riding Range': { min: 400 } },
    preferScooters: false
  },
  SPORTS_RIDING: {
    keywords: ['sports', 'racing', 'speed', 'performance', 'fast', 'powerful', 'sporty', 'track', 'race'],
    preferSpecs: { 'Max Power': { min: 15 }, 'Top Speed': { min: 120 } },
    preferScooters: false
  },
  FAMILY_USE: {
    keywords: ['family', 'ladies', 'women', 'safe', 'comfortable', 'easy', 'storage', 'kids', 'parents'],
    preferSpecs: { 'Seat Height': { max: 780 } },
    preferScooters: true
  },
  BEGINNER: {
    keywords: ['beginner', 'first bike', 'learning', 'new rider', 'starter', 'lightweight', 'easy to ride'],
    preferSpecs: { 'Displacement': { max: 160 }, 'Kerb Weight': { max: 140 } },
    preferScooters: false
  },
  ECO_FRIENDLY: {
    keywords: ['eco', 'electric', 'green', 'environment', 'zero emission', 'battery', 'ev', 'sustainable', 'save fuel'],
    evOnly: true
  },
  OFF_ROAD: {
    keywords: ['offroad', 'off-road', 'adventure', 'dirt', 'trail', 'mountain', 'village', 'rough road'],
    preferSpecs: { 'Ground Clearance': { min: 180 } },
    preferScooters: false
  }
};

const PRICE_INDICATORS = {
  'cheapest': { min: 0, max: 60000 },
  'cheap': { min: 0, max: 70000 },
  'budget': { min: 0, max: 80000 },
  'affordable': { min: 0, max: 100000 },
  'mid': { min: 80000, max: 150000 },
  'premium': { min: 150000, max: 300000 },
  'expensive': { min: 200000, max: 500000 },
  'luxury': { min: 300000, max: Infinity }
};

const VEHICLE_TYPE_KEYWORDS = {
  'EV': ['electric', 'ev', 'battery', 'charging', 'green', 'ather', 'ola', 'revolt'],
  'SCOOTER': ['scooter', 'scooty', 'activa', 'jupiter', 'access', 'ntorq', 'pleasure'],
  'BIKE': ['bike', 'motorcycle', 'pulsar', 'apache', 'bullet', 'fz', 'hunter']
};

const SPECIFICATION_KEYWORDS = {
  'mileage': ['mileage', 'kmpl', 'fuel efficiency', 'petrol average'],
  'power': ['power', 'bhp', 'hp', 'horsepower'],
  'displacement': ['cc', 'engine', 'displacement'],
  'weight': ['weight', 'lightweight', 'heavy'],
  'seat': ['seat height', 'tall', 'short rider'],
  'ground': ['ground clearance', 'speed breaker', 'pothole']
};

const fuzzyMatch = (str1, str2, threshold = 0.8) => {
  if (!str1 || !str2) return false;
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  if (s1 === s2) return true;
  if (s1.includes(s2) || s2.includes(s1)) return true;
  const distance = levenshteinDistance(s1, s2);
  const similarity = 1 - distance / Math.max(s1.length, s2.length);
  return similarity >= threshold;
};

const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
  for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      matrix[i][j] = str2.charAt(i - 1) === str1.charAt(j - 1)
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
    }
  }
  return matrix[str2.length][str1.length];
};

export const extractPriceConstraint = (message) => {
  const queryLower = message.toLowerCase();
  let min = 0, max = Infinity;

  for (const [indicator, range] of Object.entries(PRICE_INDICATORS)) {
    if (queryLower.includes(indicator)) return range;
  }

  const lakhPattern = /(\d+(?:\.\d+)?)\s*(lakh|lac)/gi;
  let lakhMatch;
  while ((lakhMatch = lakhPattern.exec(message)) !== null) {
    const lakhAmount = parseFloat(lakhMatch[1]) * 100000;
    const hasUnder = queryLower.includes('under') || queryLower.includes('below') || queryLower.includes('less than');
    const hasAbove = queryLower.includes('above') || queryLower.includes('over') || queryLower.includes('more than');

    if (hasUnder) return { min: 0, max: Math.round(lakhAmount) };
    else if (hasAbove) return { min: Math.round(lakhAmount), max: Infinity };
    else return { min: Math.round(lakhAmount * 0.7), max: Math.round(lakhAmount * 1.3) };
  }

  const betweenPattern = /(?:between|from)\s*(?:rs\.?\s*|₹\s*)?(\d+(?:\.\d+)?)\s*(lakh|lac|k|thousand)?\s*(?:to|and|-|–)\s*(?:rs\.?\s*|₹\s*)?(\d+(?:\.\d+)?)\s*(lakh|lac|k|thousand)?/i;
  const underPattern = /(?:under|below|less than|within|upto|up to|maximum|max)\s*(?:rs\.?\s*|₹\s*)?(\d+(?:\.\d+)?)\s*(lakh|lac|k|thousand)?/i;
  const abovePattern = /(?:above|over|more than|minimum|min|from)\s*(?:rs\.?\s*|₹\s*)?(\d+(?:\.\d+)?)\s*(lakh|lac|k|thousand)?/i;

  const betweenMatch = message.match(betweenPattern);
  if (betweenMatch) {
    const convert = (val, unit) => {
      const num = parseFloat(val);
      if (!unit) return num;
      if (unit.toLowerCase().includes('lakh') || unit.toLowerCase().includes('lac')) return num * 100000;
      if (unit.toLowerCase().includes('k') || unit.toLowerCase().includes('thousand')) return num * 1000;
      return num;
    };
    return { min: Math.round(convert(betweenMatch[1], betweenMatch[2])), max: Math.round(convert(betweenMatch[3], betweenMatch[4])) };
  }

  const underMatch = queryLower.match(underPattern);
  if (underMatch) {
    const num = parseFloat(underMatch[1]);
    const unit = underMatch[2] || '';
    max = unit.toLowerCase().includes('lakh') ? num * 100000 : (unit.toLowerCase().includes('k') ? num * 1000 : num);
  }

  const aboveMatch = queryLower.match(abovePattern);
  if (aboveMatch) {
    const num = parseFloat(aboveMatch[1]);
    const unit = aboveMatch[2] || '';
    min = unit.toLowerCase().includes('lakh') ? num * 100000 : (unit.toLowerCase().includes('k') ? num * 1000 : num);
  }

  return { min: Math.round(min), max: Math.round(max) };
};

const getSpecValue = (vehicle, specName) => {
  for (const category of Object.values(vehicle.specifications || {})) {
    const spec = category.find(s => s.name === specName);
    if (spec) {
      const val = spec.values?.[0];
      const numMatch = val?.match(/[\d.]+/);
      return numMatch ? parseFloat(numMatch[0]) : null;
    }
  }
  const variantSpecs = vehicle.variants?.[0]?.specs;
  if (variantSpecs) {
    const val = variantSpecs[specName];
    if (val) {
      const numMatch = val?.match(/[\d.]+/);
      return numMatch ? parseFloat(numMatch[0]) : null;
    }
  }
  return null;
};

export const detectBrand = (query) => {
  const queryLower = query.toLowerCase();
  for (const [brand, synonyms] of Object.entries(BRAND_SYNONYMS)) {
    for (const synonym of synonyms) {
      if (queryLower.includes(synonym.toLowerCase())) return brand;
    }
  }
  return null;
};

export const detectModel = (query) => {
  const queryLower = query.toLowerCase();
  for (const [model, variants] of Object.entries(MODEL_PATTERNS)) {
    for (const variant of variants) {
      if (queryLower.includes(variant.toLowerCase())) return { model, variant };
    }
  }
  return null;
};

export const detectVehicleType = (query) => {
  const queryLower = query.toLowerCase();
  const detected = [];
  for (const [type, keywords] of Object.entries(VEHICLE_TYPE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (queryLower.includes(keyword.toLowerCase())) { detected.push(type); break; }
    }
  }
  return [...new Set(detected)];
};

export const detectPurpose = (query) => {
  const queryLower = query.toLowerCase();
  const purposes = [];
  for (const [purpose, config] of Object.entries(PURPOSE_KEYWORDS)) {
    let score = 0;
    for (const keyword of config.keywords) {
      if (queryLower.includes(keyword.toLowerCase())) score += 1;
    }
    if (score > 0) purposes.push({ purpose, score, config });
  }
  return purposes.sort((a, b) => b.score - a.score);
};

export const detectSpecificationQuery = (query) => {
  const queryLower = query.toLowerCase();
  const specs = {};
  
  for (const [specType, keywords] of Object.entries(SPECIFICATION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (queryLower.includes(keyword)) {
        const morePattern = new RegExp(`(more than|above|over|minimum|min|at least)\\s+(\\d+)\\s*(kmpl|bhp|cc|mm)?`, 'i');
        const lessPattern = new RegExp(`(less than|below|under|maximum|max|at most)\\s+(\\d+)\\s*(kmpl|bhp|cc|mm)?`, 'i');
        const aroundPattern = new RegExp(`(around|about|approximately)\\s+(\\d+)\\s*(kmpl|bhp|cc|mm)?`, 'i');
        
        const moreMatch = query.match(morePattern);
        const lessMatch = query.match(lessPattern);
        const aroundMatch = query.match(aroundPattern);
        
        if (moreMatch) {
          specs[specType] = { min: parseFloat(moreMatch[2]), type: specType };
        } else if (lessMatch) {
          specs[specType] = { max: parseFloat(lessMatch[2]), type: specType };
        } else if (aroundMatch) {
          const val = parseFloat(aroundMatch[2]);
          specs[specType] = { min: val * 0.9, max: val * 1.1, type: specType };
        }
        break;
      }
    }
  }
  
  return specs;
};

export const parseUserIntent = (message) => {
  const msg = message.toLowerCase().trim();
  const intent = { action: null, filters: {}, confidence: 0, entities: {} };
  
  if (['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'correct', 'right', 'proceed'].includes(msg)) {
    intent.action = 'affirmative';
    intent.confidence = 1.0;
    return intent;
  }
  
  const priceConstraint = extractPriceConstraint(message);
  if (priceConstraint.max < Infinity || priceConstraint.min > 0) {
    intent.filters.priceRange = priceConstraint;
    intent.confidence += 0.25;
  }
  
  const brand = detectBrand(message);
  if (brand) { intent.filters.brand = brand; intent.entities.brand = brand; intent.confidence += 0.3; }
  
  const modelInfo = detectModel(message);
  if (modelInfo) { intent.filters.model = modelInfo.model; intent.entities.model = modelInfo; intent.confidence += 0.35; }
  
  const vehicleTypes = detectVehicleType(message);
  if (vehicleTypes.includes('EV')) { intent.filters.vehicleType = 'EV'; intent.confidence += 0.25; }
  if (vehicleTypes.includes('SCOOTER')) { intent.filters.vehicleCategory = 'scooters'; intent.confidence += 0.2; }
  else if (vehicleTypes.includes('BIKE')) { intent.filters.vehicleCategory = 'bikes'; intent.confidence += 0.2; }
  
  const purposes = detectPurpose(message);
  if (purposes.length > 0) { 
    intent.filters.purpose = purposes[0].purpose; 
    intent.entities.purposeConfig = purposes[0].config; 
    intent.confidence += 0.25; 
  }
  
  const specQueries = detectSpecificationQuery(message);
  if (Object.keys(specQueries).length > 0) {
    intent.filters.specifications = specQueries;
    intent.confidence += 0.3;
  }
  
  if (msg.includes('emi') || msg.includes('finance') || msg.includes('loan')) { intent.action = 'emi_query'; intent.confidence = 0.85; }
  if (msg.includes('available') || msg.includes('stock') || msg.includes('delivery')) { intent.action = 'availability_query'; intent.confidence = 0.85; }
  if (msg.includes('compare') || msg.includes('difference') || msg.includes('vs')) { intent.action = 'compare_query'; intent.confidence = 0.9; }
  if (msg.includes('specification') || msg.includes('specs') || msg.includes('features')) { intent.action = 'specs_query'; intent.confidence = 0.8; }
  
  if (Object.keys(intent.filters).length > 0 && !intent.action) intent.action = 'recommendation';
  if (!intent.action && msg.length > 0) { intent.action = 'general'; intent.confidence = 0.3; }
  
  intent.confidence = Math.min(1.0, intent.confidence);
  return intent;
};

export const getVehicleType = (vehicle) => vehicle.vehicle_type_slug === 'electric+vehicles' ? 'EV' : 'ICE';

export const getVehicleAvailability = (vehicleSlug) => {
  if (!vehicleSlug) return { code: 'standard', label: 'Standard Delivery', deliveryTime: '7-14 days', color: '#f59e0b', badge: '📦' };
  const seed = vehicleSlug.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const random = (seed % 100) / 100;
  if (random < 0.30) return { code: 'in_stock', label: 'In Stock', deliveryTime: 'Same Day', color: '#10b981', badge: '✅' };
  if (random < 0.50) return { code: 'fast', label: 'Fast Delivery', deliveryTime: '2-3 Days', color: '#3b82f6', badge: '🚀' };
  if (random < 0.75) return { code: 'standard', label: 'Standard', deliveryTime: '7-14 Days', color: '#f59e0b', badge: '📦' };
  return { code: 'pre_order', label: 'Pre-Order', deliveryTime: '15-30 Days', color: '#8b5cf6', badge: '🔔' };
};

const getVehiclePrice = (v) => {
  if (v.ex_showroom_price) return v.ex_showroom_price;
  if (v.variants && v.variants[0]?.ex_showroom_price) return v.variants[0].ex_showroom_price;
  return 0;
};

const getVehicleModelSlug = (v) => v.model_details?.model_masking_name || v.model_slug || '';
const getVehicleDisplayName = (v) => v.bike_name || v.model_details?.model_name || v.display_name || '';
const getVehicleMakeSlug = (v) => v.model_details?.make_masking_name || v.make_slug || '';
const getVehicleRating = (v) => v.model_details?.overall_rating || v.rating || 4.0;

export const getRecommendations = (preferences = {}) => {
  let results = [...twowheelers];
  const purposeConfig = preferences.purposeConfig || PURPOSE_KEYWORDS[preferences.purpose];

  if (preferences.model) {
    const modelLower = preferences.model.toLowerCase();
    const modelMatch = results.filter(v => {
      const slug = getVehicleModelSlug(v).toLowerCase();
      const name = getVehicleDisplayName(v).toLowerCase();
      return slug.includes(modelLower) || name.includes(modelLower);
    });
    if (modelMatch.length > 0) {
      return { vehicles: modelMatch.sort((a, b) => getVehicleRating(b) - getVehicleRating(a)), matchedFilters: ['model'], totalMatched: modelMatch.length };
    }
  }
  
  if (preferences.priceRange) {
    const { min = 0, max = Infinity } = preferences.priceRange;
    results = results.filter(v => {
      const price = getVehiclePrice(v);
      return price >= min && price <= max;
    });
  }
  
  if (preferences.vehicleType === 'EV') results = results.filter(v => getVehicleType(v) === 'EV');
  else if (preferences.vehicleType === 'ICE') results = results.filter(v => getVehicleType(v) === 'ICE');
  
  if (preferences.vehicleCategory) {
    results = results.filter(v => {
      const typeSlug = v.vehicle_type_slug || v.vehicle_type?.toLowerCase();
      if (preferences.vehicleCategory === 'bikes') {
        return typeSlug === 'bikes' || typeSlug === 'bike' || typeSlug === 'motorcycle';
      }
      if (preferences.vehicleCategory === 'scooters') {
        return typeSlug === 'scooters' || typeSlug === 'scooter';
      }
      if (preferences.vehicleCategory === 'electric+vehicles') {
        return typeSlug === 'electric+vehicles' || typeSlug === 'ev' || v.fuel_type === 'Electric' || v.model_details?.is_electric;
      }
      return typeSlug === preferences.vehicleCategory;
    });
  }
  if (preferences.brand) {
    const brandLower = preferences.brand.toLowerCase();
    results = results.filter(v => getVehicleMakeSlug(v).toLowerCase() === brandLower);
  }
  
  if (preferences.purpose && purposeConfig) {
    if (purposeConfig.evOnly) results = results.filter(v => getVehicleType(v) === 'EV');
    
    if (purposeConfig.preferSpecs) {
      results = results.map(v => {
        let matchScore = 0;
        for (const [specName, constraint] of Object.entries(purposeConfig.preferSpecs)) {
          const val = getSpecValue(v, specName);
          if (val !== null) {
            if (constraint.min && val >= constraint.min) matchScore += 10;
            if (constraint.max && val <= constraint.max) matchScore += 10;
          }
        }
        return { ...v, _matchScore: matchScore };
      });
    }
  }
  
  if (preferences.specifications) {
    results = results.filter(v => {
      for (const [specType, constraint] of Object.entries(preferences.specifications)) {
        let specValue = null;
        
        if (specType === 'mileage') specValue = getSpecValue(v, 'Mileage - ARAI') || v.mileage_info?.arai_mileage;
        else if (specType === 'power') specValue = getSpecValue(v, 'Max Power');
        else if (specType === 'displacement') specValue = getSpecValue(v, 'Displacement');
        else if (specType === 'weight') specValue = getSpecValue(v, 'Kerb Weight');
        else if (specType === 'seat') specValue = getSpecValue(v, 'Seat Height');
        else if (specType === 'ground') specValue = getSpecValue(v, 'Ground Clearance');
        
        if (specValue === null) return true;
        if (constraint.min && specValue < constraint.min) return false;
        if (constraint.max && specValue > constraint.max) return false;
      }
      return true;
    });
  }
  
  results = results.map(v => {
    let score = getVehicleRating(v) * 20;
    const avail = getVehicleAvailability(getVehicleModelSlug(v));
    if (avail.code === 'in_stock') score += 30;
    else if (avail.code === 'fast') score += 15;
    
    const mileage = getSpecValue(v, 'Mileage - ARAI') || v.mileage_info?.arai_mileage || v.model_details?.arai_mileage;
    if (mileage && mileage > 50) score += 10;
    
    const power = getSpecValue(v, 'Max Power');
    if (power && power > 15) score += 10;
    
    if (v._matchScore) score += v._matchScore;
    
    return { ...v, _score: score };
  });
  
  results.sort((a, b) => b._score - a._score);
  
  return { 
    vehicles: results.slice(0, 10), 
    matchedFilters: Object.keys(preferences).filter(k => k !== 'purposeConfig'),
    totalMatched: results.length 
  };
};

export const calculateEMI = (principal, downPayment, months, interestRate) => {
  const loanAmount = principal - downPayment;
  const monthlyRate = interestRate / 1200;
  const emi = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
  const totalPayment = emi * months;
  const totalInterest = totalPayment - loanAmount;
  return { emi: Math.round(emi), loanAmount, totalPayment: Math.round(totalPayment), totalInterest: Math.round(totalInterest) };
};

export const getPowerDisplay = (vehicle) => {
  if (getVehicleType(vehicle) === 'EV') return `${vehicle.cc?.value || 0}W`;
  const power = getSpecValue(vehicle, 'Max Power') || vehicle.cc?.value || 0;
  return `${Math.round(power)} bhp`;
};

export const getEfficiencyDisplay = (vehicle) => {
  if (getVehicleType(vehicle) === 'EV') return `${vehicle.range || 'N/A'} km/charge`;
  const mileage = getSpecValue(vehicle, 'Mileage - ARAI') || vehicle.mileage_info?.arai_mileage || vehicle.mileage?.value;
  return `${mileage || 'N/A'} kmpl`;
};

export const getVehicleOffers = (vehicle) => {
  const offers = [];
  const type = getVehicleType(vehicle);
  
  if (type === 'EV') {
    offers.push({ type: 'subsidy', title: 'FAME II Subsidy', description: 'Up to ₹15,000 subsidy available', value: 15000 });
  }
  
  if (vehicle.ex_showroom_price > 100000) {
    offers.push({ type: 'exchange', title: 'Exchange Bonus', description: 'Extra ₹5,000 on old vehicle exchange', value: 5000 });
  }
  
  offers.push({ type: 'emi', title: 'Low EMI', description: 'EMI starting at 0% down payment', value: 0 });
  
  if (vehicle.is_oto_preferred) {
    offers.push({ type: 'cashback', title: 'Special Cashback', description: 'Additional ₹2,000 cashback', value: 2000 });
  }
  
  return offers;
};

export const getAllBrands = () => [...new Set(twowheelers.map(v => getVehicleMakeSlug(v)))].filter(Boolean).sort();

export const getAllModels = () => [...new Set(twowheelers.map(v => getVehicleDisplayName(v)))].filter(Boolean).sort();

export const generateVehicleContext = (vehicle) => {
  const powerSpecs = vehicle.specifications?.['Power & Performance'] || [];
  const brakeSpecs = vehicle.specifications?.['Brakes & Wheels'] || [];
  const dimSpecs = vehicle.specifications?.['Dimensions'] || [];
  
  const getSpec = (specs, name) => specs.find(s => s.name === name)?.values?.[0] || 'N/A';
  
  return `
Vehicle: ${vehicle.display_name}
Brand: ${vehicle.make_slug}
Price: ₹${vehicle.ex_showroom_price?.toLocaleString()}
Type: ${getVehicleType(vehicle)}

Key Specs:
- Engine: ${getSpec(powerSpecs, 'Displacement')}
- Power: ${getSpec(powerSpecs, 'Max Power')}
- Torque: ${getSpec(powerSpecs, 'Max Torque')}
- Mileage: ${getSpec(powerSpecs, 'Mileage - ARAI')}
- Brakes: ${getSpec(brakeSpecs, 'Front Brake')} front, ${getSpec(brakeSpecs, 'Rear Brake')} rear
- Weight: ${getSpec(dimSpecs, 'Kerb Weight')}
- Seat Height: ${getSpec(dimSpecs, 'Seat Height')}

Rating: ${vehicle.rating}/5
Reviews: ${vehicle.model_details?.total_reviews || 0}
Variants: ${vehicle.variants?.length || 1}
`;
};

export const showroomConfig = {
  name: "HyperCredit 2-Wheeler Showroom",
  location: "Bangalore, Karnataka",
  openingHours: "10:00 AM - 8:00 PM",
  contactNumber: "+91 1800-123-4567",
  availability: {
    inStockThreshold: 5,
    fastDeliveryDays: 3,
    standardDeliveryDays: 14,
    customColorDays: 21,
  },
  financeOptions: {
    minDownPayment: 0,
    maxTenure: 36,
    interestRate: 8.5,
    processingFee: 999,
  }
};

export const PURPOSE_TAGS = {
  DAILY_COMMUTE: { label: 'Daily Commute', icon: '🏢' },
  LONG_RIDES: { label: 'Long Rides', icon: '🛣️' },
  SPORTS_RIDING: { label: 'Sports Riding', icon: '🏁' },
  FAMILY_USE: { label: 'Family Use', icon: '👨‍👩‍👧‍👦' },
  BEGINNER: { label: 'Beginner', icon: '🎯' },
  ECO_FRIENDLY: { label: 'Eco Friendly', icon: '🌱' },
  OFF_ROAD: { label: 'Off Road', icon: '⛰️' }
};

export default {
  parseUserIntent,
  getRecommendations,
  getVehicleType,
  getVehicleAvailability,
  calculateEMI,
  getPowerDisplay,
  getEfficiencyDisplay,
  getVehicleOffers,
  getAllBrands,
  getAllModels,
  detectBrand,
  detectModel,
  detectPurpose,
  detectSpecificationQuery,
  generateVehicleContext,
  showroomConfig,
  PURPOSE_TAGS
};

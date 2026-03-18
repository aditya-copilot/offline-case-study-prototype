import { getVehicleType } from './recommendationEngine';

const parseNumber = (value) => {
  if (!value || value === 'N/A') return null;
  const match = value.toString().match(/[\d.]+/);
  return match ? parseFloat(match[0]) : null;
};

const findSpec = (specs, name) => {
  if (!specs) return null;
  const spec = specs.find(s => s.name === name);
  return spec?.values?.[0] || null;
};

export const COMPARISON_CATEGORIES = [
  {
    id: 'overview',
    title: 'Overview',
    icon: '📋',
    specs: [
      { key: 'price', label: 'Ex-Showroom Price', unit: '₹', higherIsBetter: false },
      { key: 'rating', label: 'User Rating', unit: '⭐', higherIsBetter: true },
      { key: 'reviews', label: 'Total Reviews', unit: '', higherIsBetter: true },
      { key: 'variants', label: 'Variants Available', unit: '', higherIsBetter: null },
    ]
  },
  {
    id: 'engine',
    title: 'Engine & Performance',
    icon: '⚙️',
    specs: [
      { key: 'displacement', label: 'Displacement', unit: 'cc', higherIsBetter: true },
      { key: 'maxPower', label: 'Max Power', unit: 'bhp', higherIsBetter: true },
      { key: 'maxTorque', label: 'Max Torque', unit: 'Nm', higherIsBetter: true },
      { key: 'topSpeed', label: 'Top Speed', unit: 'kmph', higherIsBetter: true },
      { key: 'bore', label: 'Bore', unit: 'mm', higherIsBetter: null },
      { key: 'stroke', label: 'Stroke', unit: 'mm', higherIsBetter: null },
      { key: 'compressionRatio', label: 'Compression Ratio', unit: '', higherIsBetter: null },
      { key: 'fuelSystem', label: 'Fuel System', unit: '', higherIsBetter: null },
      { key: 'transmission', label: 'Transmission', unit: '', higherIsBetter: null },
      { key: 'gearShiftingPattern', label: 'Gear Pattern', unit: '', higherIsBetter: null },
      { key: 'clutch', label: 'Clutch', unit: '', higherIsBetter: null },
      { key: 'engineType', label: 'Engine Type', unit: '', higherIsBetter: null },
    ]
  },
  {
    id: 'mileage',
    title: 'Fuel Efficiency & Range',
    icon: '⛽',
    specs: [
      { key: 'araiMileage', label: 'ARAI Mileage', unit: 'kmpl', higherIsBetter: true },
      { key: 'userMileage', label: 'User Reported Mileage', unit: 'kmpl', higherIsBetter: true },
      { key: 'fuelCapacity', label: 'Fuel Tank Capacity', unit: 'litres', higherIsBetter: true },
      { key: 'ridingRange', label: 'Riding Range', unit: 'km', higherIsBetter: true },
      { key: 'emissionStandard', label: 'Emission Standard', unit: '', higherIsBetter: null },
    ]
  },
  {
    id: 'brakes',
    title: 'Braking System',
    icon: '🛑',
    specs: [
      { key: 'brakingSystem', label: 'Braking System', unit: '', higherIsBetter: null },
      { key: 'frontBrake', label: 'Front Brake Type', unit: '', higherIsBetter: null },
      { key: 'rearBrake', label: 'Rear Brake Type', unit: '', higherIsBetter: null },
    ]
  },
  {
    id: 'suspension',
    title: 'Suspension & Chassis',
    icon: '🔧',
    specs: [
      { key: 'frontSuspension', label: 'Front Suspension', unit: '', higherIsBetter: null },
      { key: 'rearSuspension', label: 'Rear Suspension', unit: '', higherIsBetter: null },
      { key: 'chassisType', label: 'Chassis Type', unit: '', higherIsBetter: null },
    ]
  },
  {
    id: 'tyres',
    title: 'Wheels & Tyres',
    icon: '🛞',
    specs: [
      { key: 'wheelType', label: 'Wheel Type', unit: '', higherIsBetter: null },
      { key: 'wheelSize', label: 'Wheel Size', unit: '', higherIsBetter: null },
      { key: 'frontTyre', label: 'Front Tyre', unit: '', higherIsBetter: null },
      { key: 'rearTyre', label: 'Rear Tyre', unit: '', higherIsBetter: null },
      { key: 'tyreType', label: 'Tyre Type', unit: '', higherIsBetter: null },
    ]
  },
  {
    id: 'dimensions',
    title: 'Dimensions & Capacity',
    icon: '📏',
    specs: [
      { key: 'kerbWeight', label: 'Kerb Weight', unit: 'kg', higherIsBetter: false },
      { key: 'seatHeight', label: 'Seat Height', unit: 'mm', higherIsBetter: null },
      { key: 'seatLength', label: 'Seat Length', unit: 'mm', higherIsBetter: null },
      { key: 'groundClearance', label: 'Ground Clearance', unit: 'mm', higherIsBetter: true },
      { key: 'wheelbase', label: 'Wheelbase', unit: 'mm', higherIsBetter: null },
      { key: 'overallLength', label: 'Overall Length', unit: 'mm', higherIsBetter: null },
      { key: 'overallWidth', label: 'Overall Width', unit: 'mm', higherIsBetter: null },
      { key: 'overallHeight', label: 'Overall Height', unit: 'mm', higherIsBetter: null },
    ]
  },
  {
    id: 'electrical',
    title: 'Electrical & Features',
    icon: '⚡',
    specs: [
      { key: 'battery', label: 'Battery', unit: '', higherIsBetter: null },
      { key: 'headlight', label: 'Headlight Type', unit: '', higherIsBetter: null },
      { key: 'taillight', label: 'Taillight Type', unit: '', higherIsBetter: null },
      { key: 'turnSignal', label: 'Turn Signal', unit: '', higherIsBetter: null },
      { key: 'startType', label: 'Start Type', unit: '', higherIsBetter: null },
      { key: 'passengerFootrest', label: 'Passenger Footrest', unit: '', higherIsBetter: null },
    ]
  },
  {
    id: 'warranty',
    title: 'Warranty & Service',
    icon: '🛡️',
    specs: [
      { key: 'warranty', label: 'Vehicle Warranty', unit: '', higherIsBetter: true },
      { key: 'service1', label: '1st Service', unit: '', higherIsBetter: null },
      { key: 'service2', label: '2nd Service', unit: '', higherIsBetter: null },
      { key: 'service3', label: '3rd Service', unit: '', higherIsBetter: null },
    ]
  }
];

export const extractComparisonData = (vehicle) => {
  const powerSpecs = vehicle.specifications?.['Power & Performance'] || [];
  const brakeSpecs = vehicle.specifications?.['Brakes & Wheels'] || [];
  const suspensionSpecs = vehicle.specifications?.['Suspensions & Chassis'] || [];
  const dimSpecs = vehicle.specifications?.['Dimensions'] || [];
  const elecSpecs = vehicle.specifications?.['Features'] || vehicle.specifications?.['Electricals'] || [];
  const warrantySpecs = vehicle.specifications?.['Manufacturer Warranty'] || [];
  const serviceSpecs = vehicle.specifications?.['Service & Maintenance Schedule'] || [];
  
  const mileageInfo = vehicle.mileage_info || {};
  
  return {
    overview: {
      price: vehicle.ex_showroom_price,
      rating: vehicle.model_details?.overall_rating || vehicle.rating || 0,
      reviews: vehicle.model_details?.total_reviews || 0,
      variants: vehicle.variants?.length || 0,
    },
    engine: {
      displacement: parseNumber(findSpec(powerSpecs, 'Displacement')),
      maxPower: parseNumber(findSpec(powerSpecs, 'Max Power')),
      maxTorque: parseNumber(findSpec(powerSpecs, 'Max Torque')),
      topSpeed: parseNumber(findSpec(powerSpecs, 'Top Speed')),
      bore: parseNumber(findSpec(powerSpecs, 'Bore')),
      stroke: parseNumber(findSpec(powerSpecs, 'Stroke')),
      compressionRatio: findSpec(powerSpecs, 'Compression Ratio'),
      fuelSystem: findSpec(powerSpecs, 'Fuel System'),
      transmission: findSpec(powerSpecs, 'Transmission'),
      gearShiftingPattern: findSpec(powerSpecs, 'Gear Shifting Pattern'),
      clutch: findSpec(powerSpecs, 'Clutch'),
      engineType: findSpec(powerSpecs, 'Engine Type'),
    },
    mileage: {
      araiMileage: mileageInfo.arai_mileage || parseNumber(findSpec(powerSpecs, 'Mileage - ARAI')),
      userMileage: mileageInfo.user_reported_mileage || parseNumber(findSpec(powerSpecs, 'Mileage - Owner Reported')),
      fuelCapacity: parseNumber(findSpec(powerSpecs, 'Fuel Tank Capacity')),
      ridingRange: parseNumber(findSpec(powerSpecs, 'Riding Range')),
      emissionStandard: findSpec(powerSpecs, 'Emission Standard'),
    },
    brakes: {
      brakingSystem: findSpec(brakeSpecs, 'Braking System'),
      frontBrake: findSpec(brakeSpecs, 'Front Brake'),
      rearBrake: findSpec(brakeSpecs, 'Rear Brake'),
    },
    suspension: {
      frontSuspension: findSpec(suspensionSpecs, 'Front Suspension'),
      rearSuspension: findSpec(suspensionSpecs, 'Rear Suspension'),
      chassisType: findSpec(suspensionSpecs, 'Chassis Type'),
    },
    tyres: {
      wheelType: findSpec(brakeSpecs, 'Wheel Type'),
      wheelSize: findSpec(brakeSpecs, 'Wheel Size'),
      frontTyre: findSpec(brakeSpecs, 'Front Tyre'),
      rearTyre: findSpec(brakeSpecs, 'Rear Tyre'),
      tyreType: findSpec(brakeSpecs, 'Tyre Type'),
    },
    dimensions: {
      kerbWeight: parseNumber(findSpec(dimSpecs, 'Kerb Weight')),
      seatHeight: parseNumber(findSpec(dimSpecs, 'Seat Height')),
      seatLength: parseNumber(findSpec(dimSpecs, 'Seat Length')),
      groundClearance: parseNumber(findSpec(dimSpecs, 'Ground Clearance')),
      wheelbase: parseNumber(findSpec(dimSpecs, 'Wheelbase')),
      overallLength: parseNumber(findSpec(dimSpecs, 'Overall Length')),
      overallWidth: parseNumber(findSpec(dimSpecs, 'Overall Width')),
      overallHeight: parseNumber(findSpec(dimSpecs, 'Overall Height')),
    },
    electrical: {
      battery: findSpec(elecSpecs, 'Battery'),
      headlight: findSpec(elecSpecs, 'Headlight'),
      taillight: findSpec(elecSpecs, 'Taillight'),
      turnSignal: findSpec(elecSpecs, 'Turn Signal'),
      startType: findSpec(powerSpecs, 'Start Type'),
      passengerFootrest: findSpec(elecSpecs, 'Passenger Footrest'),
    },
    warranty: {
      warranty: warrantySpecs[0]?.values?.[0] || findSpec(warrantySpecs, 'Vehicle Warranty'),
      service1: findSpec(serviceSpecs, '1st Service'),
      service2: findSpec(serviceSpecs, '2nd Service'),
      service3: findSpec(serviceSpecs, '3rd Service'),
    }
  };
};

export const compareVehicles = (vehicles) => {
  const data = vehicles.map(v => ({
    vehicle: v,
    data: extractComparisonData(v)
  }));
  
  const winners = {};
  
  COMPARISON_CATEGORIES.forEach(category => {
    winners[category.id] = {};
    
    category.specs.forEach(spec => {
      if (spec.higherIsBetter === null) return;
      
      const values = data.map(d => ({
        vehicle: d.vehicle,
        value: d.data[category.id]?.[spec.key]
      })).filter(v => v.value !== null && !isNaN(v.value));
      
      if (values.length < 2) return;
      
      const bestValue = spec.higherIsBetter 
        ? Math.max(...values.map(v => v.value))
        : Math.min(...values.map(v => v.value));
        
      winners[category.id][spec.key] = values
        .filter(v => v.value === bestValue)
        .map(v => v.vehicle.model_slug);
    });
  });
  
  return { data, winners };
};

export const getDifferences = (vehicles, categoryId, specKey) => {
  const data = vehicles.map(v => extractComparisonData(v));
  const values = data.map(d => d[categoryId]?.[specKey]).filter(v => v !== null && !isNaN(v));
  
  if (values.length < 2) return null;
  
  const max = Math.max(...values);
  const min = Math.min(...values);
  const diff = max - min;
  const percent = min > 0 ? ((diff / min) * 100).toFixed(0) : 0;
  
  return { max, min, diff, percent };
};

export const formatSpecValue = (value, unit) => {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'number') {
    return unit === '₹' ? `₹${value.toLocaleString()}` : `${value} ${unit}`;
  }
  return value;
};

export const generateInsights = (vehicles) => {
  const { data, winners } = compareVehicles(vehicles);
  const insights = [];
  
  vehicles.forEach((vehicle, idx) => {
    const vehicleInsights = {
      vehicle,
      wins: 0,
      advantages: [],
      disadvantages: []
    };
    
    COMPARISON_CATEGORIES.forEach(category => {
      category.specs.forEach(spec => {
        const winnerSlugs = winners[category.id]?.[spec.key] || [];
        if (winnerSlugs.includes(vehicle.model_slug)) {
          vehicleInsights.wins++;
          vehicleInsights.advantages.push(`${spec.label}: Best in category`);
        }
      });
    });
    
    const vData = data[idx].data;
    const otherData = data.filter((_, i) => i !== idx).map(d => d.data);
    
    if (vData.overview.price < Math.min(...otherData.map(d => d.overview.price))) {
      vehicleInsights.advantages.push('Most affordable option');
    }
    if (vData.overview.rating > Math.max(...otherData.map(d => d.overview.rating))) {
      vehicleInsights.advantages.push('Highest user rating');
    }
    if (vData.mileage.araiMileage > Math.max(...otherData.map(d => d.mileage.araiMileage || 0))) {
      vehicleInsights.advantages.push('Best fuel efficiency');
    }
    if (vData.engine.maxPower > Math.max(...otherData.map(d => d.engine.maxPower || 0))) {
      vehicleInsights.advantages.push('Most powerful engine');
    }
    if (vData.dimensions.groundClearance > Math.max(...otherData.map(d => d.dimensions.groundClearance || 0))) {
      vehicleInsights.advantages.push('Best ground clearance');
    }
    
    insights.push(vehicleInsights);
  });
  
  return insights;
};

export default {
  COMPARISON_CATEGORIES,
  extractComparisonData,
  compareVehicles,
  getDifferences,
  formatSpecValue,
  generateInsights
};

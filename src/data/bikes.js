import heroBikes from './hero.json'

const bikeCategories = [
  { id: 'popular', name: 'Popular Bikes', color: '#f59e0b' },
  { id: 'new', name: 'New Launches', color: '#10b981' },
  { id: 'electric', name: 'Electric', color: '#3b82f6' },
  { id: 'budget', name: 'Budget Range', color: '#8b5cf6' },
  { id: 'sport', name: 'Sport', color: '#ef4444' },
  { id: 'commuter', name: 'Commuter', color: '#14b8a6' },
  { id: 'scooter', name: 'Scooters', color: '#ec4899' }
]

const showroomData = {
  id: 'hero-showroom-001',
  name: 'Hero MotoCorp Showroom',
  address: '123 Main Road, Bangalore',
  phone: '+91 98765 43210',
  hours: '9:00 AM - 8:00 PM',
  zones: [
    { id: 'A', name: 'Premium Zone', floor: 'Ground Floor', location: 'Left Wing' },
    { id: 'B', name: 'Commuter Zone', floor: 'Ground Floor', location: 'Center' },
    { id: 'C', name: 'Electric Zone', floor: 'Ground Floor', location: 'Right Wing' },
    { id: 'D', name: 'Accessories', floor: 'First Floor', location: 'Front' }
  ]
}

const processBikeData = (rawBikes) => {
  return rawBikes.map(bike => {
    const modelDetails = bike.model_details || {}
    const firstVariant = bike.variants?.[0] || {}
    const keySpecs = bike.key_specs || {}
    
    return {
      id: modelDetails.model_id || Math.random().toString(36),
      name: bike.bike_name || modelDetails.model_name,
      make: modelDetails.make_name || 'Hero',
      model: modelDetails.model_name,
      type: bike.vehicle_type || 'Motorcycle',
      fuelType: bike.fuel_type || 'Petrol',
      isElectric: modelDetails.is_electric || false,
      price: firstVariant.ex_showroom_price || 75000,
      formattedPrice: firstVariant.formatted_price || '₹ 75,000',
      onRoadPrice: bike.price_in_cities?.find(p => p.city_name === 'Bangalore')?.min_price || 
                   (firstVariant.ex_showroom_price || 75000) * 1.2,
      mileage: keySpecs.Mileage || firstVariant.specs?.['Mileage - Owner Reported'] || '60 kmpl',
      engine: keySpecs['Engine Capacity'] || firstVariant.specs?.Displacement || '100 cc',
      power: bike.specifications?.['Power & Performance']?.find(s => s.name === 'Max Power')?.values?.[0] || '8 bhp',
      weight: keySpecs['Kerb Weight'] || firstVariant.specs?.['Kerb Weight'] || '110 kg',
      seatHeight: keySpecs['Seat Height'] || firstVariant.specs?.['Seat Height'] || '785 mm',
      tankCapacity: keySpecs['Fuel Tank Capacity'] || firstVariant.specs?.['Fuel Tank Capacity'] || '9.8 litres',
      topSpeed: bike.specifications?.['Power & Performance']?.find(s => s.name === 'Top Speed')?.values?.[0] || '85 kmph',
      rating: modelDetails.overall_rating || 4.5,
      totalReviews: modelDetails.total_reviews || 1000,
      totalRatings: modelDetails.total_ratings || 5000,
      image: modelDetails.image_path ? `https://imgd.aeplcdn.com/0x0/n${modelDetails.image_path}` : null,
      variants: bike.variants || [],
      colors: bike.colors || [],
      specifications: bike.specifications || {},
      reviews: (bike.reviews || []).slice(0, 5),
      faqs: bike.faqs || [],
      location: {
        zone: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
        floor: 'Ground Floor',
        spot: `Spot ${Math.floor(Math.random() * 10) + 1}`
      },
      isNew: modelDetails.is_newly_launched || false,
      launchedOn: modelDetails.launched_on
    }
  })
}

const bikes = processBikeData(heroBikes)

const featuredBikes = bikes.slice(0, 4)
const newLaunches = bikes.filter(b => b.isNew).slice(0, 4)
const electricBikes = bikes.filter(b => b.isElectric).slice(0, 4)
const budgetBikes = bikes.filter(b => b.price < 80000).slice(0, 4)
const sportBikes = bikes.filter(b => b.name.toLowerCase().includes('xtec') || b.name.toLowerCase().includes('xtreme')).slice(0, 4)
const commuterBikes = bikes.filter(b => b.name.toLowerCase().includes('splendor') || b.name.toLowerCase().includes('passion')).slice(0, 4)
const scooters = bikes.filter(b => b.type.toLowerCase().includes('scooter')).slice(0, 4)

export const getAllBikes = () => bikes

export const getBikeById = (id) => bikes.find(b => b.id.toString() === id.toString())

export const getBikesByCategory = (category) => {
  switch(category) {
    case 'popular': return featuredBikes
    case 'new': return newLaunches
    case 'electric': return electricBikes
    case 'budget': return budgetBikes
    case 'sport': return sportBikes
    case 'commuter': return commuterBikes
    case 'scooter': return scooters
    default: return bikes
  }
}

export const searchBikes = (query) => {
  const lowerQuery = query.toLowerCase()
  return bikes.filter(bike => 
    bike.name.toLowerCase().includes(lowerQuery) ||
    bike.make.toLowerCase().includes(lowerQuery) ||
    bike.type.toLowerCase().includes(lowerQuery) ||
    bike.fuelType.toLowerCase().includes(lowerQuery) ||
    bike.engine.toLowerCase().includes(lowerQuery)
  )
}

export const getShowroomData = () => showroomData

export const getCategories = () => bikeCategories

export const getBikeRecommendations = (preferences) => {
  const { budget, mileage, useCase } = preferences
  return bikes.filter(bike => {
    const budgetMatch = !budget || bike.price <= budget
    const mileageMatch = !mileage || parseInt(bike.mileage) >= parseInt(mileage)
    return budgetMatch && mileageMatch
  }).slice(0, 4)
}

export { bikes, bikeCategories, showroomData }

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOffer } from '../../context/OfferContext'
import { useToast } from '../../context/ToastContext'
import { SkeletonVehicleGrid } from '../../Components/Skeleton'
import { twowheelers as rawTwowheelers } from '../../data/bike/twowheelerProducts'
import { 
  parseUserIntent, 
  getVehicleType,
  calculateEMI,
  getVehicleOffers,
  getAllBrands
} from '../../data/bike/recommendationEngine'
import { bikeAIRecommendationService } from '../../services/BikeAIRecommendationService'

const getVehicleTypeSlug = (v) => {
  const bodyStyle = v.model_details?.body_style_id;
  const isElectric = v.model_details?.is_electric;
  const vehicleType = v.vehicle_type;
  const fuelType = v.fuel_type;
  
  if (isElectric || fuelType === 'Electric') {
    return 'electric+vehicles';
  }
  
  const scooterBodyStyles = [5, 9, 13];
  if (scooterBodyStyles.includes(bodyStyle) || vehicleType === 'Scooter') {
    return 'scooters';
  }
  
  return 'bikes';
};

const getDisplacement = (v) => {
  const powerSpecs = v.specifications?.['Power & Performance'] || [];
  const displacementSpec = powerSpecs.find(s => s.name === 'Displacement');
  return displacementSpec ? parseInt(displacementSpec.values?.[0]) || 0 : 0;
};

const getMileage = (v) => {
  const mileageInfo = v.mileage_info;
  const keySpecMileage = v.key_specs?.['Mileage - ARAI'];
  
  if (mileageInfo?.arai_mileage) {
    return { value: mileageInfo.arai_mileage, unit: 'kmpl' };
  }
  if (keySpecMileage) {
    const parsed = parseFloat(keySpecMileage);
    if (!isNaN(parsed)) {
      return { value: parsed, unit: 'kmpl' };
    }
  }
  return { value: null, unit: 'kmpl' };
};

const twowheelers = rawTwowheelers.map((v, index) => ({
  ...v,
  model_slug: v.model_details?.model_masking_name || v.model_slug || `vehicle-${index}`,
  make_slug: v.model_details?.make_masking_name || v.make_slug,
  display_name: v.bike_name || v.model_details?.model_name || v.display_name,
  rating: v.model_details?.overall_rating || v.rating || 4.0,
  model_image: v.model_details?.image_path || v.model_image,
  ex_showroom_price: v.ex_showroom_price || 
    (v.variants && v.variants[0]?.ex_showroom_price) || 0,
  vehicle_type_slug: getVehicleTypeSlug(v),
  cc: { value: getDisplacement(v), unit: 'cc' },
  mileage: getMileage(v)
})).filter((v, index, self) => 
  v.model_slug && self.findIndex(t => t.model_slug === v.model_slug) === index
)
import VehicleCard from '../../Components/bike/VehicleCard'
import VehicleDetailModal from '../../Components/bike/VehicleDetailModal'
import AISalesAssistant from '../../Components/bike/AISalesAssistant'
import VehicleComparison from '../../Components/bike/VehicleComparison'
import VoiceInput from '../../Components/bike/VoiceInput'
import Onboarding from '../../Components/Onboarding'
import './BikeShowroom.css'

const CATEGORIES = [
  { id: 'all', name: 'All Bikes', icon: '🏍️', count: null },
  { id: 'electric', name: 'Electric', icon: '⚡', filter: v => v.vehicle_type_slug === 'electric+vehicles' },
  { id: 'scooters', name: 'Scooters', icon: '🛵', filter: v => v.vehicle_type_slug === 'scooters' },
  { id: 'bikes', name: 'Motorcycles', icon: '🏍️', filter: v => v.vehicle_type_slug === 'bikes' },
  { id: 'commuter', name: 'Commuter', icon: '🎯', filter: v => v.cc?.value <= 160 },
  { id: 'premium', name: 'Premium', icon: '💎', filter: v => v.ex_showroom_price >= 150000 },
  { id: 'family', name: 'Family', icon: '👨‍👩‍👧‍👦', filter: v => v.vehicle_type_slug === 'scooters' || v.cc?.value <= 125 }
]

const SORT_OPTIONS = [
  { id: 'popular', name: 'Most Popular' },
  { id: 'price-low', name: 'Price: Low to High' },
  { id: 'price-high', name: 'Price: High to Low' },
  { id: 'rating', name: 'Highest Rated' },
  { id: 'mileage', name: 'Best Mileage' }
]

const PRICE_RANGES = [
  { id: 'all', name: 'All Prices', min: 0, max: Infinity },
  { id: 'under70k', name: 'Under ₹70,000', min: 0, max: 70000 },
  { id: '70k-1l', name: '₹70K - ₹1L', min: 70000, max: 100000 },
  { id: '1l-1.5l', name: '₹1L - ₹1.5L', min: 100000, max: 150000 },
  { id: 'above1.5l', name: 'Above ₹1.5L', min: 150000, max: Infinity }
]

export default function BikeShowroom() {
  const navigate = useNavigate()
  const { selectProduct } = useOffer()
  const { showToast } = useToast()
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedPriceRange, setSelectedPriceRange] = useState('all')
  const [sortBy, setSortBy] = useState('popular')
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredVehicles, setFilteredVehicles] = useState(twowheelers)
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [compareList, setCompareList] = useState([])
  const [showComparison, setShowComparison] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [showVoiceInput, setShowVoiceInput] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState([])
  const [isAILoading, setIsAILoading] = useState(false)
  const [recentlyViewed, setRecentlyViewed] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const searchInputRef = useRef(null)
  const searchDebounceRef = useRef(null)

  useEffect(() => {
    const stored = localStorage.getItem('hypercredit_recently_viewed')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validVehicles = parsed
            .map(slug => twowheelers.find(v => v.model_slug === slug))
            .filter(Boolean)
            .slice(0, 4)
          setRecentlyViewed(validVehicles)
        }
      } catch (e) {
        console.warn('Failed to parse recently viewed:', e)
      }
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    document.body.style.overflow = selectedVehicle ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedVehicle])

  useEffect(() => {
    console.log("Start plling")
    const BASE_URL = import.meta.env.VITE_BASE_URL
    const pollInterval = 1000
    let lastNearestReceiver = null
    let intervalId = null

    const pollBeacon = async () => {
      try {
        const response = await fetch(`http://localhost:8080/beacon/nearest`)
        console.log(response);
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        
        const data = await response.json()
        
        if (data.nearestReceiver && data.nearestReceiver !== lastNearestReceiver) {
          lastNearestReceiver = data.nearestReceiver
          
          const vehicle = twowheelers.find(v => 
            v.display_name === data.nearestReceiver || 
            v.model_slug === data.nearestReceiver ||
            v.bike_name === data.nearestReceiver
          )
          
          if (vehicle) {
            handleVehicleClick(vehicle)
            showToast(`Showing ${vehicle.display_name}`, 'info')
          }
        }
      } catch (error) {
        console.error('Beacon polling error:', error)
      }
    }

    intervalId = setInterval(pollBeacon, pollInterval)
    pollBeacon()
    
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [])

  

  useEffect(() => {
    setIsSearching(true)
    
    const timer = setTimeout(() => {
      let result = [...twowheelers]
      
      if (activeCategory !== 'all') {
        const category = CATEGORIES.find(c => c.id === activeCategory)
        if (category?.filter) {
          result = result.filter(category.filter)
        }
      }
      
      if (selectedPriceRange !== 'all') {
        const priceRange = PRICE_RANGES.find(p => p.id === selectedPriceRange)
        if (priceRange) {
          result = result.filter(v => 
            v.ex_showroom_price >= priceRange.min && 
            v.ex_showroom_price < priceRange.max
          )
        }
      }
      
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(v => {
        const nameMatch = (v.display_name || '').toLowerCase().includes(query)
        const brandMatch = (v.make_slug || '').toLowerCase().includes(query)
        const typeMatch = (v.vehicle_type_slug || '').toLowerCase().includes(query)
        const ccMatch = v.cc?.value?.toString().includes(query.replace(/[^0-9]/g, ''))
        const variantMatch = (v.variant_slug || '').toLowerCase().includes(query)
        
        return nameMatch || brandMatch || typeMatch || ccMatch || variantMatch
      })
    }
      
      switch (sortBy) {
        case 'price-low':
          result.sort((a, b) => a.ex_showroom_price - b.ex_showroom_price)
          break
        case 'price-high':
          result.sort((a, b) => b.ex_showroom_price - a.ex_showroom_price)
          break
        case 'rating':
          result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
          break
        case 'mileage':
          result.sort((a, b) => (b.mileage?.value || 0) - (a.mileage?.value || 0))
          break
        default:
          result.sort((a, b) => (b.is_oto_preferred ? 1 : 0) - (a.is_oto_preferred ? 1 : 0))
      }
      
      setFilteredVehicles(result)
      setIsSearching(false)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [activeCategory, selectedPriceRange, sortBy, searchQuery])

  const handleVehicleClick = useCallback((vehicle) => {
    setSelectedVehicle(vehicle)
    
    const stored = localStorage.getItem('hypercredit_recently_viewed')
    let recent = []
    if (stored) {
      try {
        recent = JSON.parse(stored)
      } catch (e) {
        recent = []
      }
    }
    
    recent = recent.filter(slug => slug !== vehicle.model_slug)
    recent.unshift(vehicle.model_slug)
    recent = recent.slice(0, 6)
    
    localStorage.setItem('hypercredit_recently_viewed', JSON.stringify(recent))
    
    const validVehicles = recent
      .map(slug => twowheelers.find(v => v.model_slug === slug))
      .filter(Boolean)
      .slice(0, 4)
    setRecentlyViewed(validVehicles)
  }, [])

  const handleBuyNow = useCallback((vehicle) => {
    if (!vehicle?.model_slug) {
      console.error('Invalid vehicle data for buy now:', vehicle)
      showToast('Unable to proceed. Please try again.', 'error')
      return
    }
    
    selectProduct({
      id: vehicle.model_slug,
      name: vehicle.display_name || 'Unknown Vehicle',
      brand: vehicle.make_slug || 'Unknown Brand',
      price: vehicle.ex_showroom_price || 0,
      image: vehicle.model_image || '',
      category: getVehicleType(vehicle) === 'EV' ? 'Electric Vehicle' : 'Two Wheeler',
      rating: vehicle.rating || 4,
      specs: {
        power: vehicle.cc?.value ? `${vehicle.cc.value} ${vehicle.cc.unit || ''}` : 'N/A',
        mileage: vehicle.mileage?.value ? `${vehicle.mileage.value} ${vehicle.mileage.unit || ''}` : 'N/A',
        range: vehicle.range || null,
        topSpeed: vehicle.top_speed || null
      }
    }, 'bike')
    navigate('/checkout/user-input')
  }, [selectProduct, navigate, showToast])

  const toggleCompare = useCallback((vehicle) => {
    setCompareList(prev => {
      const exists = prev.find(v => v.model_slug === vehicle.model_slug)
      if (exists) {
        showToast(`${vehicle.display_name} removed from comparison`, 'info')
        return prev.filter(v => v.model_slug !== vehicle.model_slug)
      }
      if (prev.length >= 3) {
        showToast('You can compare up to 3 vehicles at a time', 'warning')
        return prev
      }
      showToast(`${vehicle.display_name} added to comparison. Add ${3 - prev.length - 1} more to compare.`, 'success')
      return [...prev, vehicle]
    })
  }, [showToast])

  const removeFromCompare = useCallback((vehicle) => {
    setCompareList(prev => prev.filter(v => v.model_slug !== vehicle.model_slug))
    showToast(`${vehicle.display_name} removed from comparison`, 'info')
  }, [showToast])

  const handleVoiceSearch = useCallback(async (transcript) => {
    setSearchQuery(transcript)
    setShowVoiceInput(false)
    setIsAILoading(true)
    
    const intent = parseUserIntent(transcript)
    if (Object.keys(intent.filters).length > 0) {
      const prefs = {
        purpose: intent.filters.purpose || intent.action || 'General search',
        budget: intent.filters.priceRange ? 
          `₹${intent.filters.priceRange.min || 0} - ₹${intent.filters.priceRange.max === Infinity ? '+' : intent.filters.priceRange.max}` : 
          'Not specified',
        type: intent.filters.vehicleType === 'EV' ? 'Electric' : 
              intent.filters.vehicleCategory === 'scooters' ? 'Scooter' : 
              intent.filters.vehicleCategory === 'bikes' ? 'Motorcycle' : 'Any'
      }
      
      try {
        const result = await bikeAIRecommendationService.getRecommendations(prefs)
        if (result.success && result.vehicles.length > 0) {
          setAiSuggestions(result.vehicles.map(v => v.vehicleData).filter(Boolean))
        }
      } catch (error) {
        console.error('AI recommendation error:', error)
      } finally {
        setIsAILoading(false)
      }
    } else {
      setIsAILoading(false)
    }
  }, [])

  const formatPrice = useCallback((price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }, [])

  return (
    <div className="bike-showroom">
      <Onboarding />
      {!showAIAssistant ? (
        <>
          <header className="showroom-header">
            <div className="showroom-header-content">
              <div className="showroom-brand">
                <div className="brand-logo">
                  <span>🏍️</span>
                </div>
                <div className="brand-info">
                  <h1>Pick Your Motors</h1>
                  <p>Premium 2-Wheeler Showroom</p>
                </div>
              </div>
              
              <div className="showroom-actions">
              </div>
            </div>
          </header>

          <section className="showroom-hero">
            <div className="hero-content">
              <h2>Find Your Perfect Ride</h2>
              <p>Explore {twowheelers.length}+ bikes & scooters with AI-powered recommendations</p>
              
              <div className="hero-search">
                <form 
                  className="search-box" 
                  onSubmit={(e) => {
                    e.preventDefault()
                    setIsSearching(true)
                    setTimeout(() => setIsSearching(false), 300)
                  }}
                >
                  <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search bikes, brands, or try 'electric under 1 lakh'..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {isSearching && searchQuery.trim() && (
                    <div className="search-spinner" />
                  )}
                  <button 
                    className="voice-search-btn"
                    onClick={() => setShowVoiceInput(true)}
                    title="Voice Search"
                    type="button"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  </button>
                  {searchQuery && (
                    <button 
                      className="clear-search"
                      onClick={() => setSearchQuery('')}
                      type="button"
                    >
                      ×
                    </button>
                  )}
                </form>
                {searchQuery && (
                  <div className="search-results-info">
                    {isSearching ? (
                      <span className="searching-text">Searching...</span>
                    ) : (
                      <span className="results-count">{filteredVehicles.length} results found</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="showroom-filters">
            <div className="filters-container">
              <div className="category-tabs">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    <span className="cat-icon">{cat.icon}</span>
                    <span className="cat-name">{cat.name}</span>
                  </button>
                ))}
              </div>

              <div className="filter-row">
                <div className="price-filters">
                  {PRICE_RANGES.map(range => (
                    <button
                      key={range.id}
                      className={`price-chip ${selectedPriceRange === range.id ? 'active' : ''}`}
                      onClick={() => setSelectedPriceRange(range.id)}
                    >
                      {range.name}
                    </button>
                  ))}
                </div>

                <div className="sort-dropdown">
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {aiSuggestions.length > 0 && (
            <section className="ai-suggestions">
              <div className="suggestions-header">
                <span className="suggestions-icon">✨</span>
                <h3>AI Recommended for You</h3>
                <button onClick={() => setAiSuggestions([])}>Clear</button>
              </div>
              <div className="suggestions-grid">
                {aiSuggestions.map(vehicle => (
                  <VehicleCard
                    key={vehicle.model_slug}
                    vehicle={vehicle}
                    onClick={() => handleVehicleClick(vehicle)}
                    onBuyNow={() => handleBuyNow(vehicle)}
                    onCompare={() => toggleCompare(vehicle)}
                    isComparing={compareList.some(v => v.model_slug === vehicle.model_slug)}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>
            </section>
          )}

          {recentlyViewed.length > 0 && (
            <section className="recently-viewed-section">
              <div className="section-header">
                <h3>
                  <span className="section-icon">👁</span>
                  Recently Viewed
                </h3>
              </div>
              <div className="recently-viewed-grid">
                {recentlyViewed.map(vehicle => (
                  <VehicleCard
                    key={vehicle.model_slug}
                    vehicle={vehicle}
                    onClick={() => handleVehicleClick(vehicle)}
                    onBuyNow={() => handleBuyNow(vehicle)}
                    onCompare={() => toggleCompare(vehicle)}
                    isComparing={compareList.some(v => v.model_slug === vehicle.model_slug)}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="vehicles-section">
            <div className="section-header">
              <h3>
                {activeCategory === 'all' ? 'All Vehicles' : CATEGORIES.find(c => c.id === activeCategory)?.name}
                <span className="count">({filteredVehicles.length})</span>
              </h3>
              
              {compareList.length > 0 && (
                <button 
                  className="compare-btn"
                  onClick={() => setShowComparison(true)}
                >
                  Compare ({compareList.length})
                </button>
              )}
            </div>

            {isLoading ? (
              <SkeletonVehicleGrid count={8} />
            ) : (
              <div className="vehicles-grid">
                {filteredVehicles.map((vehicle, index) => (
                  <VehicleCard
                    key={vehicle.model_slug}
                    vehicle={vehicle}
                    onClick={() => handleVehicleClick(vehicle)}
                    onBuyNow={() => handleBuyNow(vehicle)}
                    onCompare={() => toggleCompare(vehicle)}
                    isComparing={compareList.some(v => v.model_slug === vehicle.model_slug)}
                    formatPrice={formatPrice}
                    index={index}
                  />
                ))}
              </div>
            )}

            {filteredVehicles.length === 0 && (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h4>No vehicles found</h4>
                <p>Try adjusting your filters or search query</p>
                <button 
                  className="clear-filters-btn"
                  onClick={() => {
                    setActiveCategory('all')
                    setSelectedPriceRange('all')
                    setSearchQuery('')
                  }}
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </section>

          <button 
            className="floating-ai-btn"
            onClick={() => setShowAIAssistant(true)}
          >
            <span className="ai-avatar">🤖</span>
            <span className="ai-label">Ask AI</span>
          </button>
        </>
      ) : (
        <AISalesAssistant 
          onClose={() => setShowAIAssistant(false)}
          onVehicleSelect={handleVehicleClick}
          onBuyNow={handleBuyNow}
        />
      )}

      {selectedVehicle && (
        <VehicleDetailModal
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          onBuyNow={() => handleBuyNow(selectedVehicle)}
          onCompare={() => toggleCompare(selectedVehicle)}
          isComparing={compareList.some(v => v.model_slug === selectedVehicle.model_slug)}
          formatPrice={formatPrice}
        />
      )}

      {showComparison && compareList.length > 0 && (
        <VehicleComparison
          vehicles={compareList}
          onClose={() => setShowComparison(false)}
          onRemove={removeFromCompare}
          formatPrice={formatPrice}
        />
      )}

      {showVoiceInput && (
        <VoiceInput
          onResult={handleVoiceSearch}
          onClose={() => setShowVoiceInput(false)}
        />
      )}
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { getAllBikes, getCategories, getBikesByCategory, searchBikes, getShowroomData } from '../data/bikes'
import BikeDetailModal from './BikeDetailModal'
import ComparisonDrawer from './ComparisonDrawer'
import EMICalculator from './EMICalculator'
import TestRideModal from './TestRideModal'
import StoreMap from './StoreMap'
import AIAssistant from './AIAssistant'
import './ShowroomHome.css'

const offers = [
  { color: '#3b82f6', bg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', icon: 'card', tag: 'Bank Offer', desc: '10% off on HDFC Credit Cards', link: 'T&C' },
  { color: '#f59e0b', bg: 'linear-gradient(135deg, #f59e0b, #d97706)', icon: 'star', tag: 'Special Price', desc: 'Exchange bonus up to ₹10,000', link: 'T&C' },
  { color: '#10b981', bg: 'linear-gradient(135deg, #10b981, #059669)', icon: 'rupee', tag: 'No Cost EMI', desc: 'Starting from ₹2,499/month', link: 'View Plans' },
  { color: '#8b5cf6', bg: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', icon: 'user', tag: 'Free Insurance', desc: '1 year free comprehensive insurance', link: 'Know More' }
]

export default function ShowroomHome() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('popular')
  const [selectedBike, setSelectedBike] = useState(null)
  const [compareList, setCompareList] = useState([])
  const [showComparison, setShowComparison] = useState(false)
  const [showEMI, setShowEMI] = useState(false)
  const [emiBike, setEmiBike] = useState(null)
  const [showTestRide, setShowTestRide] = useState(false)
  const [testRideBike, setTestRideBike] = useState(null)
  const [showMap, setShowMap] = useState(false)
  const [mapBike, setMapBike] = useState(null)
  const [shortlist, setShortlist] = useState([])
  const [showAI, setShowAI] = useState(false)
  const [aiContext, setAiContext] = useState(null)

  const bikes = getAllBikes()
  const categories = getCategories()
  const showroom = getShowroomData()

  const filteredBikes = searchQuery ? searchBikes(searchQuery) : getBikesByCategory(activeCategory)

  const handleBikeClick = (bike) => {
    setSelectedBike(bike)
  }

  const handleCompareToggle = (bike) => {
    if (compareList.find(b => b.id === bike.id)) {
      setCompareList(compareList.filter(b => b.id !== bike.id))
    } else if (compareList.length < 3) {
      setCompareList([...compareList, bike])
    }
  }

  const handleBookTestRide = (bike) => {
    setTestRideBike(bike)
    setShowTestRide(true)
  }

  const handleCheckEMI = (bike) => {
    setEmiBike(bike)
    setShowEMI(true)
  }

  const handleLocateInStore = (bike) => {
    setMapBike(bike)
    setShowMap(true)
  }

  const handleAddToShortlist = (bike) => {
    if (!shortlist.find(b => b.id === bike.id)) {
      setShortlist([...shortlist, bike])
    }
  }

  const handleAskAI = (context) => {
    setAiContext(context)
    setShowAI(true)
  }

  return (
    <div className="showroom-container">
      {/* Header */}
      <header className="showroom-header">
        <div className="showroom-header-top">
          <div className="showroom-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 12h8M12 8v8"/>
            </svg>
            <span>{showroom.name}</span>
          </div>
          <div className="showroom-actions">
            <button className="showroom-icon-btn" onClick={() => handleAskAI({ type: 'general' })}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </button>
            <button className="showroom-icon-btn" onClick={() => setShortlist([])}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {shortlist.length > 0 && <span className="showroom-badge">{shortlist.length}</span>}
            </button>
          </div>
        </div>
        
        <div className="showroom-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search bikes by name, engine, type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="showroom-clear-search" onClick={() => setSearchQuery('')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Welcome Section */}
      <section className="showroom-welcome">
        <h1>Welcome to {showroom.name}</h1>
        <p>Explore our collection of Hero bikes. Book a test ride, compare models, or get personalized recommendations.</p>
        <button className="showroom-ai-btn" onClick={() => handleAskAI({ type: 'recommendation' })}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          Get AI Recommendations
        </button>
      </section>

      {/* Categories */}
      <section className="showroom-categories">
        <div className="showroom-categories-scroll">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`showroom-category ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => {setActiveCategory(cat.id); setSearchQuery('')}}
              style={{'--cat-color': cat.color}}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Offers Carousel */}
      <section className="showroom-offers">
        <div className="showroom-offers-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
          <h3>Exclusive Offers</h3>
        </div>
        <div className="showroom-offers-scroll">
          {offers.map((offer, idx) => (
            <div key={idx} className="showroom-offer-card" style={{'--offer-bg': offer.bg}}>
              <div className="showroom-offer-icon">
                {offer.icon === 'card' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                )}
                {offer.icon === 'star' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                )}
                {offer.icon === 'rupee' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                )}
                {offer.icon === 'user' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  </svg>
                )}
              </div>
              <span className="showroom-offer-tag">{offer.tag}</span>
              <p className="showroom-offer-desc">{offer.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bikes Grid */}
      <section className="showroom-bikes">
        <div className="showroom-bikes-header">
          <h2>{searchQuery ? `Search Results (${filteredBikes.length})` : categories.find(c => c.id === activeCategory)?.name}</h2>
          {compareList.length > 0 && (
            <button className="showroom-compare-btn" onClick={() => setShowComparison(true)}>
              Compare ({compareList.length})
            </button>
          )}
        </div>
        
        <div className="showroom-bikes-grid">
          {filteredBikes.map(bike => (
            <div key={bike.id} className="showroom-bike-card" onClick={() => handleBikeClick(bike)}>
              <div className="showroom-bike-image">
                {bike.image ? (
                  <img src={bike.image} alt={bike.name} />
                ) : (
                  <div className="showroom-bike-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="5.5" cy="17.5" r="3.5"/>
                      <circle cx="18.5" cy="17.5" r="3.5"/>
                      <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/>
                    </svg>
                  </div>
                )}
                {bike.isNew && <span className="showroom-new-badge">NEW</span>}
                <div className="showroom-bike-rating">
                  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <span>{bike.rating}</span>
                </div>
              </div>
              <div className="showroom-bike-info">
                <h3 className="showroom-bike-name">{bike.name}</h3>
                <p className="showroom-bike-price">{bike.formattedPrice}</p>
                <div className="showroom-bike-specs">
                  <span>{bike.mileage}</span>
                  <span className="showroom-spec-divider">•</span>
                  <span>{bike.engine}</span>
                </div>
                <div className="showroom-bike-actions">
                  <button 
                    className={`showroom-compare-toggle ${compareList.find(b => b.id === bike.id) ? 'active' : ''}`}
                    onClick={(e) => {e.stopPropagation(); handleCompareToggle(bike)}}
                  >
                    {compareList.find(b => b.id === bike.id) ? 'Added' : 'Compare'}
                  </button>
                  <button 
                    className="showroom-shortlist-btn"
                    onClick={(e) => {e.stopPropagation(); handleAddToShortlist(bike)}}
                  >
                    <svg viewBox="0 0 24 24" fill={shortlist.find(b => b.id === bike.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Floating AI Button */}
      <button className="showroom-fab-ai" onClick={() => handleAskAI({ type: 'general' })}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Ask AI
      </button>

      {/* Modals */}
      {selectedBike && (
        <BikeDetailModal 
          bike={selectedBike}
          onClose={() => setSelectedBike(null)}
          onCompare={() => handleCompareToggle(selectedBike)}
          onBookTestRide={() => handleBookTestRide(selectedBike)}
          onCheckEMI={() => handleCheckEMI(selectedBike)}
          onLocate={() => handleLocateInStore(selectedBike)}
          onShortlist={() => handleAddToShortlist(selectedBike)}
          onAskAI={(context) => handleAskAI({...context, bike: selectedBike})}
          isCompared={!!compareList.find(b => b.id === selectedBike.id)}
          isShortlisted={!!shortlist.find(b => b.id === selectedBike.id)}
        />
      )}

      {showComparison && (
        <ComparisonDrawer 
          bikes={compareList}
          onClose={() => setShowComparison(false)}
          onRemove={(bike) => handleCompareToggle(bike)}
        />
      )}

      {showEMI && emiBike && (
        <EMICalculator 
          bike={emiBike}
          onClose={() => {setShowEMI(false); setEmiBike(null)}}
        />
      )}

      {showTestRide && (
        <TestRideModal 
          bike={testRideBike}
          showroom={showroom}
          onClose={() => {setShowTestRide(false); setTestRideBike(null)}}
        />
      )}

      {showMap && (
        <StoreMap 
          bike={mapBike}
          showroom={showroom}
          onClose={() => {setShowMap(false); setMapBike(null)}}
        />
      )}

      {showAI && (
        <AIAssistant 
          context={aiContext}
          bikes={bikes}
          onClose={() => setShowAI(false)}
          onBikeSelect={(bike) => {setShowAI(false); handleBikeClick(bike)}}
        />
      )}
    </div>
  )
}

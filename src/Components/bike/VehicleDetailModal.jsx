import { useState, useEffect } from 'react'
import { getVehicleType, getPowerDisplay, getEfficiencyDisplay, getVehicleAvailability, calculateEMI, getVehicleOffers } from '../../data/bike/recommendationEngine'
import { getVehicleImageUrl, FALLBACK_VEHICLE_IMAGE } from '../../utils/imageUtils'
import { useToast } from '../../context/ToastContext'
import './VehicleDetailModal.css'

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📋' },
  { id: 'specs', label: 'Specifications', icon: '⚙️' },
  { id: 'reviews', label: 'Reviews', icon: '⭐' },
  { id: 'pricing', label: 'City Pricing', icon: '💰' },
  { id: 'faq', label: 'FAQ', icon: '❓' }
]

const REVIEW_FILTERS = [
  { id: 'all', label: 'All Reviews' },
  { id: 'positive', label: 'Positive' },
  { id: 'critical', label: 'Critical' },
  { id: 'withImages', label: 'With Images' }
]

const getColorStyle = (hexCode) => {
  if (!hexCode) return '#cccccc'
  const colors = hexCode.split(',').map(c => c.trim())
  if (colors.length === 1) {
    return `#${colors[0]}`
  }
  return `linear-gradient(135deg, #${colors[0]} 50%, #${colors[1]} 50%)`
}

const getVehicleImage = (vehicle) => {
  const imagePath = vehicle.model_details?.image_path || vehicle.model_image
  return getVehicleImageUrl(imagePath) || FALLBACK_VEHICLE_IMAGE
}

export default function VehicleDetailModal({ 
  vehicle, 
  onClose, 
  onBuyNow, 
  onCompare,
  isComparing,
  formatPrice 
}) {
  const [emiDetails, setEmiDetails] = useState(null)
  const [tenureMonths, setTenureMonths] = useState(36)
  const [downPayment, setDownPayment] = useState(0)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [reviewFilter, setReviewFilter] = useState('all')
  const [expandedFAQ, setExpandedFAQ] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const type = getVehicleType(vehicle)
  const availability = getVehicleAvailability(vehicle.model_slug)
  const offers = getVehicleOffers(vehicle)
  const { showToast } = useToast()

  const specifications = vehicle.specifications || {}
  const warrantyInfo = vehicle.specifications?.['Manufacturer Warranty'] || []
  const serviceSchedule = vehicle.specifications?.['Service & Maintenance Schedule'] || []
  const variants = vehicle.variants || []
  const colors = vehicle.colors || []
  const cityPricing = vehicle.price_in_cities || []
  const reviewSummary = vehicle.review_summary || {
    total_reviews: vehicle.model_details?.total_reviews || 0,
    total_ratings: vehicle.model_details?.total_ratings || 0,
    overall_rating: vehicle.model_details?.overall_rating || 0,
    positive_reviews_count: 0,
    critical_reviews_count: 0
  }
  const reviews = vehicle.reviews || []
  const faqs = vehicle.faqs || []
  const expertReviews = vehicle.expert_reviews || []

  const filteredReviews = (() => {
    let result = [...reviews]
    
    if (reviewFilter === 'positive') {
      result = result.filter(r => r.rating >= 4)
    } else if (reviewFilter === 'critical') {
      result = result.filter(r => r.rating <= 2)
    } else if (reviewFilter === 'withImages') {
      result = result.filter(r => r.user_images && r.user_images.length > 0)
    }
    
    return result.slice(0, 5)
  })()

  const warranty = warrantyInfo.length > 0 ? warrantyInfo[0].values?.[0] : null

  useEffect(() => {
    const emi = calculateEMI(vehicle.ex_showroom_price, downPayment, tenureMonths, 8.5)
    setEmiDetails(emi)
  }, [vehicle, tenureMonths, downPayment])

  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0])
    }
  }, [variants, selectedVariant])

  useEffect(() => {
    if (colors.length > 0 && !selectedColor) {
      setSelectedColor(colors[0])
    }
  }, [colors, selectedColor])

  const getSpecs = () => [
    { icon: type === 'EV' ? '🔋' : '⚙️', label: 'Power', value: getPowerDisplay(vehicle) },
    { icon: type === 'EV' ? '🔌' : '⛽', label: type === 'EV' ? 'Range' : 'Mileage', value: getEfficiencyDisplay(vehicle) },
    { icon: '🚀', label: 'Top Speed', value: vehicle.top_speed || 'N/A' },
    { icon: '⚡', label: type === 'EV' ? 'Charging Time' : 'Fuel Tank', value: vehicle.charging_time || 'N/A' },
    { icon: '📏', label: 'Category', value: vehicle.vehicle_type_slug?.replace('+', ' ')?.toUpperCase() || 'BIKE' },
    { icon: '🏭', label: 'Brand', value: vehicle.make_slug?.toUpperCase() || 'UNKNOWN' }
  ]

  const handleTenureChange = (e) => setTenureMonths(Number(e.target.value))

  const handleDownPaymentChange = (e) => {
    const value = Number(e.target.value)
    setDownPayment(Math.min(value, vehicle.ex_showroom_price * 0.5))
  }

  const handleAddToCompare = () => {
    if (!isComparing) showToast('Added to comparison', 'success')
    onCompare()
  }

  const toggleFAQ = (index) => setExpandedFAQ(expandedFAQ === index ? null : index)

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    return (
      <span className="star-rating">
        {'★'.repeat(fullStars)}
        {hasHalfStar && '½'}
        <span className="empty-stars">{'★'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0))}</span>
      </span>
    )
  }

  const renderSidebar = () => (
    <div className="detail-sidebar">
      <div className="emi-calculator">
        <h4>💰 EMI Calculator</h4>
        <div className="emi-controls">
          <div className="control-group">
            <label>
              <span>Down Payment</span>
              <span className="control-value">{formatPrice(downPayment)}</span>
            </label>
            <input
              type="range"
              min="0"
              max={vehicle.ex_showroom_price * 0.5}
              step="1000"
              value={downPayment}
              onChange={handleDownPaymentChange}
              className="slider"
            />
            <div className="slider-labels">
              <span>₹0</span>
              <span>Max: {formatPrice(vehicle.ex_showroom_price * 0.5)}</span>
            </div>
          </div>

          <div className="control-group">
            <label>
              <span>Loan Tenure</span>
              <span className="control-value">{tenureMonths} months</span>
            </label>
            <input
              type="range"
              min="12"
              max="60"
              step="6"
              value={tenureMonths}
              onChange={handleTenureChange}
              className="slider"
            />
            <div className="slider-labels">
              <span>12m</span>
              <span>36m</span>
              <span>60m</span>
            </div>
          </div>
        </div>

        {emiDetails && (
          <div className="emi-result">
            <div className="emi-highlight">
              <span className="emi-label">Monthly EMI</span>
              <span className="emi-amount">{formatPrice(emiDetails.emi)}</span>
              <span className="emi-rate">@ 8.5% interest</span>
            </div>
            <div className="emi-breakdown">
              <div className="breakdown-item">
                <span>Loan Amount</span>
                <span>{formatPrice(emiDetails.loanAmount)}</span>
              </div>
              <div className="breakdown-item">
                <span>Total Interest</span>
                <span>{formatPrice(emiDetails.totalInterest)}</span>
              </div>
              <div className="breakdown-item total">
                <span>Total Payable</span>
                <span>{formatPrice(emiDetails.totalPayment + downPayment)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {offers.length > 0 && (
        <div className="detail-offers">
          <h4>Available Offers</h4>
          <div className="offers-list">
            {offers.map((offer, idx) => (
              <div key={idx} className="offer-item">
                <span className="offer-icon">
                  {offer.type === 'cashback' && '💰'}
                  {offer.type === 'exchange' && '🔄'}
                  {offer.type === 'emi' && '📊'}
                  {offer.type === 'subsidy' && '⚡'}
                </span>
                <div className="offer-details">
                  <span className="offer-title">{offer.title}</span>
                  <span className="offer-desc">{offer.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="detail-delivery">
        <span className="delivery-icon">🚚</span>
        <div>
          <span className="delivery-label">Delivery Timeline</span>
          <span className="delivery-value">{availability.deliveryTime}</span>
        </div>
      </div>
    </div>
  )

  const renderOverviewTab = () => (
    <>
      {variants.length > 0 && (
        <div className="variant-selector-section">
          <h4>Choose Variant</h4>
          <div className="variant-list">
            {variants.map(variant => (
              <button
                key={variant.variant_id}
                className={`variant-btn ${selectedVariant?.variant_id === variant.variant_id ? 'active' : ''}`}
                onClick={() => setSelectedVariant(variant)}
              >
                <span className="variant-name">{variant.variant_name}</span>
                <span className="variant-price">{variant.formatted_price}</span>
              </button>
            ))}
          </div>
          {selectedVariant && (
            <div className="variant-specs-preview">
              {Object.entries(selectedVariant.specs || {}).slice(0, 6).map(([key, value]) => (
                <div key={key} className="variant-spec-item">
                  <span className="spec-key">{key}</span>
                  <span className="spec-val">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {colors.length > 0 && (
        <div className="color-selector-section">
          <h4>Available Colors</h4>
          <div className="color-list">
            {colors.map(color => (
              <button
                key={color.color_id}
                className={`color-btn ${selectedColor?.color_id === color.color_id ? 'active' : ''}`}
                onClick={() => setSelectedColor(color)}
                title={color.color_name}
              >
                <span 
                  className="color-swatch" 
                  style={{ background: getColorStyle(color.hex_code) }}
                />
                <span className="color-name">{color.color_name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="key-specs-section">
        <h4>Key Specifications</h4>
        <div className="specs-grid">
          {getSpecs().map((spec, idx) => (
            <div key={idx} className="spec-box">
              <span className="spec-icon">{spec.icon}</span>
              <span className="spec-label">{spec.label}</span>
              <span className="spec-value">{spec.value}</span>
            </div>
          ))}
        </div>
      </div>

      {warranty && (
        <div className="warranty-section">
          <h4>🛡️ Warranty Information</h4>
          <p className="warranty-text">{warranty}</p>
        </div>
      )}

      {serviceSchedule.length > 0 && (
        <div className="service-section">
          <h4>🔧 Service Schedule</h4>
          <div className="service-list">
            {serviceSchedule.slice(0, 4).map((service, idx) => (
              <div key={idx} className="service-item">
                <span className="service-name">{service.name}</span>
                <span className="service-interval">{service.values?.[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {expertReviews.length > 0 && (
        <div className="expert-reviews-section">
          <h4>🎬 Expert Reviews</h4>
          {expertReviews.slice(0, 2).map((review, idx) => (
            <div key={idx} className="expert-review-card">
              {review.image_path && (
                <img 
                  src={getVehicleImageUrl(review.image_path)} 
                  alt={review.title} 
                  className="expert-review-img" 
                />
              )}
              <div className="expert-review-content">
                <h5>{review.title}</h5>
                <p>{review.description?.substring(0, 150)}{review.description?.length > 150 ? '...' : ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {renderSidebar()}
    </>
  )

  const renderSpecsTab = () => (
    <div className="tab-content specs-tab">
      {Object.entries(specifications).length > 0 ? (
        <>
          {Object.entries(specifications).map(([category, items]) => (
            <div key={category} className="spec-category">
              <h4>{category}</h4>
              <div className="spec-table">
                {(items || []).map((spec, idx) => (
                  <div key={idx} className="spec-row">
                    <span className="spec-name">{spec.name}</span>
                    <span className="spec-value">
                      {spec.values?.join(', ')}{spec.unit ? ` ${spec.unit}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="no-data">No detailed specifications available</div>
      )}
    </div>
  )

  const renderReviewsTab = () => (
    <div className="tab-content reviews-tab">
      <div className="reviews-summary">
        <div className="rating-overview">
          <div className="big-rating">
            <span className="rating-number">{reviewSummary.overall_rating || vehicle.rating}</span>
            {renderStars(reviewSummary.overall_rating || vehicle.rating)}
            <span className="rating-count">{reviewSummary.total_reviews} reviews</span>
          </div>
          <div className="rating-breakdown">
            <div className="breakdown-row">
              <span className="breakdown-label">👍 Positive</span>
              <div className="breakdown-bar">
                <div 
                  className="breakdown-fill positive" 
                  style={{ width: `${reviewSummary.total_reviews > 0 ? (reviewSummary.positive_reviews_count / reviewSummary.total_reviews) * 100 : 0}%` }}
                />
              </div>
              <span className="breakdown-count">{reviewSummary.positive_reviews_count}</span>
            </div>
            <div className="breakdown-row">
              <span className="breakdown-label">👎 Critical</span>
              <div className="breakdown-bar">
                <div 
                  className="breakdown-fill critical" 
                  style={{ width: `${reviewSummary.total_reviews > 0 ? (reviewSummary.critical_reviews_count / reviewSummary.total_reviews) * 100 : 0}%` }}
                />
              </div>
              <span className="breakdown-count">{reviewSummary.critical_reviews_count}</span>
            </div>
          </div>
        </div>
        
        <div className="review-filters">
          {REVIEW_FILTERS.map(filter => (
            <button
              key={filter.id}
              className={`filter-btn ${reviewFilter === filter.id ? 'active' : ''}`}
              onClick={() => setReviewFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="reviews-list">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review, idx) => (
            <div key={review.review_id || idx} className="review-card">
              <div className="review-header">
                <div className="reviewer-info">
                  <span className="reviewer-name">{review.username}</span>
                  <span className="review-date">{new Date(review.entry_date).toLocaleDateString()}</span>
                </div>
                <div className="review-rating">
                  {renderStars(review.rating)}
                  {review.reported_mileage > 0 && (
                    <span className="reported-mileage">{review.reported_mileage} kmpl</span>
                  )}
                </div>
              </div>
              <h5 className="review-title">{review.title}</h5>
              <p 
                className="review-text"
                dangerouslySetInnerHTML={{ __html: review.description }}
              />
              {review.user_images && review.user_images.length > 0 && (
                <div className="review-images">
                  {review.user_images.map((img, imgIdx) => (
                    <img 
                      key={imgIdx} 
                      src={getVehicleImageUrl(img.image_path)} 
                      alt={`Review ${imgIdx + 1}`} 
                    />
                  ))}
                </div>
              )}
              <div className="review-footer">
                <span className="helpful-count">👍 {review.upvotes} helpful</span>
                {review.is_winner && <span className="winner-badge">🏆 Winner</span>}
              </div>
            </div>
          ))
        ) : (
          <div className="no-data">No reviews found for the selected filter</div>
        )}
      </div>
    </div>
  )

  const renderPricingTab = () => (
    <div className="tab-content pricing-tab">
      <div className="pricing-header">
        <h4>On-Road Prices Across Cities</h4>
        <p className="pricing-note">Prices include RTO and insurance charges</p>
      </div>
      
      {cityPricing.length > 0 ? (
        <div className="city-pricing-list">
          {cityPricing.map((city, idx) => (
            <div key={city.city_id || idx} className="city-price-item">
              <div className="city-info">
                {city.image_path && <img src={city.image_path} alt={city.city_name} className="city-icon" />}
                <span className="city-name">{city.city_name}</span>
              </div>
              <div className="city-price">
                <span className="price-amount">₹ {city.formatted_price}</span>
                {city.min_price > 0 && city.max_price > 0 && city.min_price !== city.max_price && (
                  <span className="price-range">
                    ₹{city.min_price?.toLocaleString()} - ₹{city.max_price?.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-data">City-wise pricing not available</div>
      )}

      <div className="emi-highlight-section">
        <h4>💳 EMI Starting from</h4>
        <div className="emi-starting-price">
          <span className="emi-amount">{formatPrice(Math.round(vehicle.ex_showroom_price * 0.03))}</span>
          <span className="emi-period">/month</span>
        </div>
        <p className="emi-terms">* Based on 10% down payment and 36 months tenure at 8.5% interest</p>
      </div>
    </div>
  )

  const renderFAQTab = () => (
    <div className="tab-content faq-tab">
      <h4>Frequently Asked Questions</h4>
      {faqs.length > 0 ? (
        <div className="faq-list">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className={`faq-item ${expandedFAQ === idx ? 'expanded' : ''}`}
            >
              <button 
                className="faq-question"
                onClick={() => toggleFAQ(idx)}
              >
                <span>{faq.question}</span>
                <span className="faq-toggle">{expandedFAQ === idx ? '−' : '+'}</span>
              </button>
              {expandedFAQ === idx && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="no-data">No FAQs available</div>
      )}
    </div>
  )

  const imageUrl = getVehicleImage(vehicle)

  return (
    <div className="vehicle-detail-overlay" onClick={onClose}>
      <div className="vehicle-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-detail-btn" onClick={onClose}>×</button>
        
        <div className="detail-scroll-container">
          <div className="detail-header-banner">
            <div className="detail-image-section">
              <img 
                src={imageUrl} 
                alt={vehicle.display_name}
                onError={(e) => { e.target.src = FALLBACK_VEHICLE_IMAGE }}
              />
              <div className="detail-badges">
                {type === 'EV' && <span className="badge ev">⚡ Electric</span>}
                <span className="badge rating">⭐ {vehicle.rating}</span>
                <span className="badge availability" style={{ background: availability.color }}>
                  {availability.badge} {availability.label}
                </span>
              </div>
            </div>

            <div className="detail-header-info">
              <h2>{vehicle.display_name}</h2>
              <p className="detail-brand">{vehicle.make_slug?.toUpperCase()}</p>
              <div className="detail-price">
                <span className="price-label">Ex-Showroom Price</span>
                <span className="price-value">{formatPrice(vehicle.ex_showroom_price)}</span>
              </div>
              <div className="detail-actions">
                <button className="btn-buy-now" onClick={onBuyNow}>
                  Apply for Loan
                </button>
                <button 
                  className={`btn-compare ${isComparing ? 'active' : ''}`}
                  onClick={handleAddToCompare}
                >
                  {isComparing ? '✓ Added' : '+ Compare'}
                </button>
              </div>
            </div>
          </div>

          <div className="detail-tabs">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="detail-content">
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'specs' && renderSpecsTab()}
            {activeTab === 'reviews' && renderReviewsTab()}
            {activeTab === 'pricing' && renderPricingTab()}
            {activeTab === 'faq' && renderFAQTab()}
          </div>
        </div>
      </div>
    </div>
  )
}

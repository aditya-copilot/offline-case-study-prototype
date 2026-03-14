import { useState } from 'react'
import './BikeDetailModal.css'

export default function BikeDetailModal({ 
  bike, 
  onClose, 
  onCompare, 
  onBookTestRide, 
  onCheckEMI, 
  onLocate, 
  onShortlist,
  onAskAI,
  isCompared,
  isShortlisted 
}) {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedVariant, setSelectedVariant] = useState(bike.variants?.[0])
  const [selectedColor, setSelectedColor] = useState(bike.colors?.[0])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  const onRoadPrice = bike.onRoadPrice || bike.price * 1.2

  return (
    <div className="bike-modal-overlay" onClick={onClose}>
      <div className="bike-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="bike-modal-header">
          <button className="bike-modal-back" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h2>{bike.name}</h2>
          <button className="bike-modal-share">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </button>
        </div>

        {/* Bike Image */}
        <div className="bike-modal-image">
          {bike.image ? (
            <img src={bike.image} alt={bike.name} />
          ) : (
            <div className="bike-modal-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="5.5" cy="17.5" r="3.5"/>
                <circle cx="18.5" cy="17.5" r="3.5"/>
                <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/>
              </svg>
            </div>
          )}
          <div className="bike-modal-rating">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span>{bike.rating}</span>
            <small>({bike.totalReviews} reviews)</small>
          </div>
        </div>

        {/* Price Section */}
        <div className="bike-modal-price-section">
          <div className="bike-modal-price">
            <span className="bike-modal-price-label">On-Road Price in Bangalore</span>
            <span className="bike-modal-price-value">{formatPrice(onRoadPrice)}</span>
          </div>
          <button className="bike-modal-price-breakup">View Price Breakup</button>
        </div>

        {/* Variant Selector */}
        {bike.variants?.length > 0 && (
          <div className="bike-modal-variants">
            <h3>Select Variant</h3>
            <div className="bike-variants-list">
              {bike.variants.map((variant, idx) => (
                <button
                  key={idx}
                  className={`bike-variant-btn ${selectedVariant?.variant_id === variant.variant_id ? 'active' : ''}`}
                  onClick={() => setSelectedVariant(variant)}
                >
                  <span className="bike-variant-name">{variant.variant_name}</span>
                  <span className="bike-variant-price">{variant.formatted_price}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color Selector */}
        {bike.colors?.length > 0 && (
          <div className="bike-modal-colors">
            <h3>Available Colors ({bike.colors.length})</h3>
            <div className="bike-colors-list">
              {bike.colors.map((color, idx) => (
                <button
                  key={idx}
                  className={`bike-color-btn ${selectedColor?.color_id === color.color_id ? 'active' : ''}`}
                  onClick={() => setSelectedColor(color)}
                  title={color.color_name}
                >
                  <div 
                    className="bike-color-swatch"
                    style={{ background: `#${color.hex_code?.split(',')[0] || 'ccc'}` }}
                  />
                </button>
              ))}
            </div>
            {selectedColor && <p className="bike-selected-color">{selectedColor.color_name}</p>}
          </div>
        )}

        {/* Tabs */}
        <div className="bike-modal-tabs">
          {['overview', 'specs', 'features', 'reviews'].map(tab => (
            <button
              key={tab}
              className={`bike-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bike-modal-content">
          {activeTab === 'overview' && (
            <div className="bike-overview">
              <div className="bike-key-specs">
                <div className="bike-spec-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                  <span className="bike-spec-value">{bike.mileage}</span>
                  <span className="bike-spec-label">Mileage</span>
                </div>
                <div className="bike-spec-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  <span className="bike-spec-value">{bike.engine}</span>
                  <span className="bike-spec-label">Engine</span>
                </div>
                <div className="bike-spec-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  <span className="bike-spec-value">{bike.power}</span>
                  <span className="bike-spec-label">Power</span>
                </div>
                <div className="bike-spec-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 12h8M12 8v8"/>
                  </svg>
                  <span className="bike-spec-value">{bike.weight}</span>
                  <span className="bike-spec-label">Weight</span>
                </div>
              </div>

              <div className="bike-location">
                <h3>Location in Showroom</h3>
                <div className="bike-location-info">
                  <div className="bike-location-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <div>
                      <span className="bike-location-label">Floor</span>
                      <span className="bike-location-value">{bike.location?.floor}</span>
                    </div>
                  </div>
                  <div className="bike-location-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <line x1="9" y1="3" x2="9" y2="21"/>
                    </svg>
                    <div>
                      <span className="bike-location-label">Zone</span>
                      <span className="bike-location-value">Zone {bike.location?.zone}</span>
                    </div>
                  </div>
                  <div className="bike-location-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                    <div>
                      <span className="bike-location-label">Spot</span>
                      <span className="bike-location-value">{bike.location?.spot}</span>
                    </div>
                  </div>
                </div>
                <button className="bike-view-map-btn" onClick={onLocate}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="1 6 1 22 8 18 16 22 21 18 21 6 16 10 8 6 1 6"/>
                    <line x1="8" y1="6" x2="8" y2="18"/>
                    <line x1="16" y1="10" x2="16" y2="22"/>
                  </svg>
                  View on Store Map
                </button>
              </div>

              {bike.faqs?.length > 0 && (
                <div className="bike-faqs">
                  <h3>Frequently Asked Questions</h3>
                  {bike.faqs.slice(0, 2).map((faq, idx) => (
                    <div key={idx} className="bike-faq-item">
                      <p className="bike-faq-q">{faq.question}</p>
                      <p className="bike-faq-a">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="bike-specs-list">
              {Object.entries(bike.specifications || {}).map(([category, specs]) => (
                <div key={category} className="bike-spec-category">
                  <h3>{category}</h3>
                  <div className="bike-specs-table">
                    {specs.map((spec, idx) => (
                      <div key={idx} className="bike-spec-row">
                        <span className="bike-spec-name">{spec.name}</span>
                        <span className="bike-spec-value">{spec.values?.join(', ')} {spec.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="bike-reviews">
              <div className="bike-rating-summary">
                <div className="bike-big-rating">
                  <span>{bike.rating}</span>
                  <div className="bike-rating-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <svg key={star} viewBox="0 0 24 24" fill={star <= Math.floor(bike.rating) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    ))}
                  </div>
                  <small>{bike.totalRatings} Ratings & {bike.totalReviews} Reviews</small>
                </div>
              </div>
              {bike.reviews?.map((review, idx) => (
                <div key={idx} className="bike-review-item">
                  <div className="bike-review-header">
                    <div className="bike-review-rating">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      <span>{review.rating}</span>
                    </div>
                    <span className="bike-review-user">{review.username}</span>
                  </div>
                  <h4>{review.title}</h4>
                  <p dangerouslySetInnerHTML={{ __html: review.description }} />
                  {review.reported_mileage && (
                    <span className="bike-review-mileage">Mileage: {review.reported_mileage} kmpl</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'features' && (
            <div className="bike-features">
              <div className="bike-features-list">
                {bike.features?.map((feature, idx) => (
                  <div key={idx} className="bike-feature-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>{feature.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bike-modal-actions">
          <button className="bike-action-btn secondary" onClick={() => onAskAI({ type: 'bike', bike })}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Ask AI
          </button>
          <button className="bike-action-btn secondary" onClick={onCompare}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            {isCompared ? 'Added' : 'Compare'}
          </button>
          <button className="bike-action-btn secondary" onClick={onShortlist}>
            <svg viewBox="0 0 24 24" fill={isShortlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {isShortlisted ? 'Saved' : 'Save'}
          </button>
          <button className="bike-action-btn secondary" onClick={onCheckEMI}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            EMI
          </button>
        </div>

        {/* Bottom CTA */}
        <div className="bike-modal-cta">
          <button className="bike-cta-btn secondary" onClick={onBookTestRide}>
            Book Test Ride
          </button>
          <button className="bike-cta-btn primary" onClick={() => onAskAI({ type: 'checkout', bike })}>
            Check Offers
          </button>
        </div>
      </div>
    </div>
  )
}

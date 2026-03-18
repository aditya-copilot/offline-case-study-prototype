import { memo, useState } from 'react'
import { getVehicleType, getVehicleAvailability, getPowerDisplay, getEfficiencyDisplay } from '../../data/bike/recommendationEngine'
import { FALLBACK_VEHICLE_IMAGE, getVehicleImageUrl } from '../../utils/imageUtils'
import './VehicleCard.css'

const VehicleCard = memo(function VehicleCard({ 
  vehicle, 
  onClick, 
  onBuyNow, 
  onCompare,
  isComparing,
  formatPrice,
  index = 0
}) {
  const [imageError, setImageError] = useState(false)
  const type = getVehicleType(vehicle)
  const availability = getVehicleAvailability(vehicle.model_slug)
  
  const totalReviews = vehicle.model_details?.total_reviews || vehicle.review_summary?.total_reviews || 0
  const variantCount = vehicle.variants?.length || 0
  
  const getBadges = () => {
    const badges = []

    if (type === 'EV') {
      badges.push({ text: 'Electric', color: '#10b981', icon: '⚡' })
    }

    if (vehicle.rating >= 4.5) {
      badges.push({ text: 'Top Rated', color: '#f59e0b', icon: '⭐' })
    }

    if (vehicle.is_oto_preferred) {
      badges.push({ text: 'Preferred', color: '#3b82f6', icon: '✓' })
    }

    if (totalReviews >= 100) {
      badges.push({ text: `${totalReviews}+ Reviews`, color: '#8b5cf6', icon: '📝' })
    }

    if (variantCount > 1) {
      badges.push({ text: `${variantCount} Variants`, color: '#06b6d4', icon: '🎨' })
    }

    return badges
  }

  const badges = getBadges()
  const powerDisplay = getPowerDisplay(vehicle)
  const efficiencyDisplay = getEfficiencyDisplay(vehicle)
  const imageUrl = getVehicleImageUrl(vehicle.model_details?.image_path || vehicle.model_image || vehicle.image_path)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  const handleCompareKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      onCompare()
    }
  }

  const handleBuyNowKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      onBuyNow()
    }
  }

  return (
    <div 
      className="vehicle-card"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      style={{ animationDelay: `${index * 0.05}s` }}
      role="button"
      tabIndex={0}
      aria-label={`${vehicle.display_name} by ${vehicle.make_slug}. Price ${formatPrice(vehicle.ex_showroom_price)}`}
    >
      <div className="vehicle-image-container">
        <img 
          src={imageError ? FALLBACK_VEHICLE_IMAGE : (imageUrl || FALLBACK_VEHICLE_IMAGE)} 
          alt={vehicle.display_name || 'Vehicle'}
          loading="lazy"
          onError={() => setImageError(true)}
        />
        
        <div className="vehicle-badges" aria-label="Vehicle badges">
          {badges.map((badge, i) => (
            <span 
              key={i} 
              className="vehicle-badge"
              style={{ backgroundColor: badge.color }}
            >
              {badge.icon} {badge.text}
            </span>
          ))}
        </div>

        <div
          className="availability-badge"
          style={{ backgroundColor: availability.color }}
          aria-label={`Availability: ${availability.label}`}
        >
          {availability.badge} {availability.label}
        </div>

        <button 
          className={`compare-toggle ${isComparing ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            onCompare()
          }}
          onKeyDown={handleCompareKeyDown}
          aria-label={isComparing ? 'Remove from comparison' : 'Add to comparison'}
          aria-pressed={isComparing}
        >
          {isComparing ? '✓ Added' : '+ Compare'}
        </button>
      </div>

      <div className="vehicle-info">
        <div className="vehicle-brand">{(vehicle.make_slug || 'Unknown').toUpperCase()}</div>
        <h4 className="vehicle-name">{vehicle.display_name}</h4>
        
        <div className="vehicle-rating" aria-label={`Rating: ${vehicle.rating || 4.0} out of 5 stars`}>
          <span className="stars" aria-hidden="true">
            {'★'.repeat(Math.floor(vehicle.rating || 4))}
            <span className="empty-stars">
              {'★'.repeat(5 - Math.floor(vehicle.rating || 4))}
            </span>
          </span>
          <span className="rating-value">{vehicle.rating || 4.0}</span>
          {totalReviews > 0 && (
            <span className="review-count">({totalReviews} reviews)</span>
          )}
        </div>

        <div className="vehicle-specs" aria-label="Vehicle specifications">
          <div className="spec-item">
            <span className="spec-icon" aria-hidden="true">{type === 'EV' ? '🔋' : '⚙️'}</span>
            <span className="spec-value">{powerDisplay}</span>
          </div>
          <div className="spec-item">
            <span className="spec-icon" aria-hidden="true">{type === 'EV' ? '🔌' : '⛽'}</span>
            <span className="spec-value">{efficiencyDisplay}</span>
          </div>
          {vehicle.top_speed && (
            <div className="spec-item">
              <span className="spec-icon" aria-hidden="true">🚀</span>
              <span className="spec-value">{vehicle.top_speed}</span>
            </div>
          )}
        </div>

        <div className="vehicle-price-section">
          <div className="price-main">
            <span className="price-label">Ex-Showroom</span>
            <span className="price-value">{formatPrice(vehicle.ex_showroom_price)}</span>
          </div>
          
          <div className="emi-info">
            EMI from {formatPrice(Math.round(vehicle.ex_showroom_price * 0.03))}/month
          </div>
        </div>

        <div className="vehicle-actions">
          <button 
            className="btn-primary"
            onClick={(e) => {
              e.stopPropagation()
              onBuyNow()
            }}
            onKeyDown={handleBuyNowKeyDown}
            aria-label={`Apply for loan for ${vehicle.display_name}`}
          >
            Apply for Loan
          </button>
          <button 
            className="btn-secondary"
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
            onKeyDown={handleKeyDown}
            aria-label={`View details of ${vehicle.display_name}`}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  )
})

export default VehicleCard

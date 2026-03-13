import { useState } from 'react'
import './ProductDetail.css'
import InstantEMIForm from './InstantEMIForm'

const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)

const ShoppingCartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
)

const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)

const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
)

export default function ProductDetail({ product, onBack }) {
  const [showEMIForm, setShowEMIForm] = useState(false)
  
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100)
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  const handleBuyNow = () => {
    setShowEMIForm(true)
  }

  const handleCloseEMIForm = () => {
    setShowEMIForm(false)
  }

    useEffect(() => {
      if(showEMIForm){
        window.location.href = "/checkout/user-input"
        return;
      }
    }, [showEMIForm])

  return (
    <div className="product-detail-overlay">
      <div className="product-detail-container">
        <button className="product-detail-back" onClick={onBack}>
          <ArrowLeftIcon />
          <span>Back to Chat</span>
        </button>

        <div className="product-detail-content">
          <div className="product-detail-image-section">
            <div className="product-detail-image-wrapper">
              <img 
                src={product.image} 
                alt={product.name}
                className="product-detail-image"
              />
              {discount > 0 && (
                <span className="product-detail-discount">{discount}% OFF</span>
              )}
            </div>
            
            <div className="product-detail-actions">
              <button className="action-btn wishlist-btn">
                <HeartIcon />
              </button>
              <button className="action-btn share-btn">
                <ShareIcon />
              </button>
            </div>
          </div>

          <div className="product-detail-info">
            <div className="product-detail-header">
              <span className="product-detail-brand">{product.brand}</span>
              <h1 className="product-detail-name">{product.name}</h1>
              
              <div className="product-detail-meta">
                <div className="product-detail-rating">
                  <span className="rating-value">{product.rating}</span>
                  <div className="rating-stars">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} />
                    ))}
                  </div>
                  <span className="rating-count">1,234 ratings</span>
                </div>
                
                <span className="product-detail-category">{product.category}</span>
              </div>
            </div>

            <div className="product-detail-price-section">
              <div className="product-detail-price">
                <span className="detail-current-price">{formatPrice(product.price)}</span>
                {product.mrp > product.price && (
                  <>
                    <span className="detail-original-price">{formatPrice(product.mrp)}</span>
                    <span className="detail-discount-percent">{discount}% off</span>
                  </>
                )}
              </div>
              <p className="tax-info">Inclusive of all taxes</p>
            </div>

            <div className="product-detail-offers">
              <h3 className="offers-title">Available Offers</h3>
              <div className="offers-list">
                {product.offers.map((offer, idx) => (
                  <div key={idx} className="offer-item">
                    <CheckIcon />
                    <span>{offer}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="product-detail-description">
              <h3 className="description-title">About this product</h3>
              <p className="description-text">{product.description}</p>
            </div>

            <div className="product-detail-features">
              <h3 className="features-title">Key Highlights</h3>
              <div className="features-grid">
                <div className="feature-item">
                  <span className="feature-label">Brand</span>
                  <span className="feature-value">{product.brand}</span>
                </div>
                <div className="feature-item">
                  <span className="feature-label">Category</span>
                  <span className="feature-value">{product.category}</span>
                </div>
                <div className="feature-item">
                  <span className="feature-label">Rating</span>
                  <span className="feature-value">{product.rating}/5</span>
                </div>
                <div className="feature-item">
                  <span className="feature-label">Product ID</span>
                  <span className="feature-value">{product.id}</span>
                </div>
              </div>
            </div>

            <div className="product-detail-buy-section">
              <button className="buy-now-btn" onClick={handleBuyNow}>
                <ShoppingCartIcon />
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Instant EMI Form Modal */}
      {showEMIForm && (
        <div className="emi-modal-overlay" onClick={handleCloseEMIForm}>
          <div className="emi-modal-content" onClick={(e) => e.stopPropagation()}>
            <InstantEMIForm onClose={handleCloseEMIForm} />
          </div>
        </div>
      )}
    </div>
  )
}

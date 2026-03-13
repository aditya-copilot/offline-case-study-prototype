import { useEffect, useState } from 'react'
import './ProductGallery.css'
import InstantEMIForm from './InstantEMIForm'

const ChevronLeftIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

const ChevronRightIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const ShoppingBagIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
)

const HeartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)

const ShareIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
)

export default function ProductGallery({ product, onBack }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [liked, setLiked] = useState(false)
  const [showEMIForm, setShowEMIForm] = useState(false)

  useEffect(() => {
    if(showEMIForm){
      window.location.href = "/checkout/user-input"
      return;
    }
  }, [showEMIForm])

  const getProductImages = (product) => {
    const baseImage = product.image
    return [
      baseImage,
      baseImage.replace('?w=400&h=400&fit=crop', '?w=1200&h=1200&fit=crop&sat=-100'),
      baseImage.replace('?w=400&h=400&fit=crop', '?w=1200&h=1200&fit=crop&auto=format'),
      baseImage.replace('?w=400&h=400&fit=crop', '?w=1200&h=1200&fit=crop&con=1.2'),
    ]
  }

  const images = getProductImages(product)
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100)

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleBuyNow = () => {
    setShowEMIForm(true)
  }

  const handleCloseEMIForm = () => {
    setShowEMIForm(false)
  }

  return (
    <div className="visual-gallery-overlay" onClick={onBack}>
      <div className="visual-gallery-container" onClick={(e) => e.stopPropagation()}>
        {/* Top Bar */}
        <div className="visual-gallery-topbar">
          <button className="visual-close-btn" onClick={onBack}>
            <CloseIcon />
          </button>
          <div className="visual-topbar-actions">
            <button className={`visual-action-btn ${liked ? 'liked' : ''}`} onClick={() => setLiked(!liked)}>
              <HeartIcon />
            </button>
            <button className="visual-action-btn">
              <ShareIcon />
            </button>
          </div>
        </div>

        {/* Main Image Area */}
        <div className="visual-main-image-area">
          <button className="visual-nav-btn prev" onClick={handlePrevImage}>
            <ChevronLeftIcon />
          </button>

          <div className="visual-image-wrapper">
            {discount > 0 && (
              <div className="visual-big-discount">
                <span className="big-discount-value">{discount}%</span>
                <span className="big-discount-text">OFF</span>
              </div>
            )}
            
            <img 
              src={images[currentImageIndex]} 
              alt={product.name}
              className="visual-big-image"
            />
            
            <div className="visual-image-dots">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  className={`visual-dot ${currentImageIndex === idx ? 'active' : ''}`}
                  onClick={() => setCurrentImageIndex(idx)}
                />
              ))}
            </div>
          </div>

          <button className="visual-nav-btn next" onClick={handleNextImage}>
            <ChevronRightIcon />
          </button>
        </div>

        {/* Bottom Info Bar */}
        <div className="visual-bottom-bar">
          <div className="visual-product-mini-info">
            <span className="visual-mini-brand">{product.brand}</span>
            <h2 className="visual-mini-name">{product.name}</h2>
          </div>

          <div className="visual-price-block">
            <span className="visual-big-price">{formatPrice(product.price)}</span>
            {product.mrp > product.price && (
              <span className="visual-big-mrp">{formatPrice(product.mrp)}</span>
            )}
          </div>

          <button className="visual-buy-btn" onClick={handleBuyNow}>
            <ShoppingBagIcon />
            Buy
          </button>
        </div>

        {/* Thumbnails */}
        <div className="visual-thumbnails-bar">
          {images.map((img, idx) => (
            <button
              key={idx}
              className={`visual-thumb ${currentImageIndex === idx ? 'active' : ''}`}
              onClick={() => setCurrentImageIndex(idx)}
            >
              <img src={img} alt="" />
            </button>
          ))}
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
    </div>
  )
}

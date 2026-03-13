import './ProductCard.css'

export default function ProductCard({ product, onClick }) {
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100)

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  return (
    <div className="visual-product-card" onClick={() => onClick(product)}>
      <div className="visual-product-image-container">
        <img 
          src={product.image} 
          alt={product.name}
          className="visual-product-image"
          loading="lazy"
        />
        {discount > 0 && (
          <div className="visual-discount-badge">
            <span className="discount-value">{discount}%</span>
            <span className="discount-label">OFF</span>
          </div>
        )}
        <div className="visual-rating-overlay">
          <span className="star-icon">★</span>
          <span>{product.rating}</span>
        </div>
      </div>
      
      <div className="visual-product-info">
        <div className="visual-brand">{product.brand}</div>
        <h3 className="visual-name">{product.name}</h3>
        
        <div className="visual-price-row">
          <span className="visual-price">{formatPrice(product.price)}</span>
          {product.mrp > product.price && (
            <span className="visual-mrp">{formatPrice(product.mrp)}</span>
          )}
        </div>

        <div className="visual-offers-row">
          {product.offers.slice(0, 2).map((offer, idx) => (
            <span key={idx} className="visual-offer-pill">{offer}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

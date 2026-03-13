import './ProductGrid.css'

export default function ProductGrid({ products, onProductClick }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  const getDiscount = (mrp, price) => {
    return Math.round(((mrp - price) / mrp) * 100)
  }

  return (
    <div className="product-visual-grid">
      {products.map((product, index) => {
        const discount = getDiscount(product.mrp, product.price)
        return (
          <div 
            key={product.id} 
            className={`grid-item item-${index % 5}`}
            onClick={() => onProductClick(product)}
          >
            <div className="grid-image-container">
              <img 
                src={product.image} 
                alt={product.name}
                className="grid-image"
                loading="lazy"
              />
              
              {discount > 0 && (
                <div className="grid-discount-tag">
                  -{discount}%
                </div>
              )}
              
              <div className="grid-rating">
                <span className="grid-star">★</span>
                <span>{product.rating}</span>
              </div>
              
              <div className="grid-overlay">
                <div className="grid-overlay-content">
                  <span className="grid-brand">{product.brand}</span>
                  <h4 className="grid-product-name">{product.name}</h4>
                  <div className="grid-price-row">
                    <span className="grid-price">{formatPrice(product.price)}</span>
                    {product.mrp > product.price && (
                      <span className="grid-mrp">{formatPrice(product.mrp)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

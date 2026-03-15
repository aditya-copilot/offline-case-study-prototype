import { useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { products } from '../data/products'
import './ProductPage.css'

const ArrowLeftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)

const FilterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
)

const SortIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <polyline points="19 12 12 19 5 12"/>
  </svg>
)

const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

export default function ProductPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [filteredProducts, setFilteredProducts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)

  const query = searchParams.get('q') || ''
  const brand = searchParams.get('brand') || ''
  const category = searchParams.get('category') || ''

  useEffect(() => {
    let filtered = products

    if (brand) {
      filtered = filtered.filter(p => p.brand.toLowerCase() === brand.toLowerCase())
    }

    if (category) {
      filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase())
    }

    if (query) {
      const q = query.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      )
    }

    setFilteredProducts(filtered)
    setSearchQuery(query || brand || category)
  }, [query, brand, category])

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

  const handleProductClick = (product) => {
    setSelectedProduct(product)
  }

  const handleBuyNow = (product) => {
    navigate('/checkout/user-input')
  }

  return (
    <div className="product-page">
      {/* Header */}
      <header className="product-page-header">
        <div className="header-content">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeftIcon />
          </button>
          
          <div className="search-info">
            <h1 className="search-title">
              {brand ? `${brand} Products` : category ? `${category}` : query}
            </h1>
            <span className="result-count">{filteredProducts.length} results found</span>
          </div>

          <div className="header-actions">
            <button className="header-icon-btn">
              <FilterIcon />
            </button>
            <button className="header-icon-btn">
              <SortIcon />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="product-page-content">
        {filteredProducts.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h2>No products found</h2>
            <p>Try searching with different keywords</p>
            <button className="back-to-chat-btn" onClick={() => navigate(-1)}>
              Go Back
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => {
              const discount = getDiscount(product.mrp, product.price)
              return (
                <div key={product.id} className="product-detail-card">
                  <div className="product-image-section" onClick={() => handleProductClick(product)}>
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="product-detail-image"
                    />
                    {discount > 0 && (
                      <div className="discount-badge-large">
                        <span className="discount-value">{discount}%</span>
                        <span className="discount-label">OFF</span>
                      </div>
                    )}
                    <div className="rating-overlay">
                      <StarIcon />
                      <span>{product.rating}</span>
                    </div>
                  </div>

                  <div className="product-info-section">
                    <div className="product-meta">
                      <span className="product-brand">{product.brand}</span>
                      <span className="product-category">{product.category}</span>
                    </div>
                    
                    <h3 className="product-title">{product.name}</h3>
                    
                    <p className="product-description">{product.description}</p>
                    
                    <div className="product-offers">
                      {product.offers.slice(0, 3).map((offer, idx) => (
                        <span key={idx} className="offer-badge">{offer}</span>
                      ))}
                    </div>

                    <div className="product-price-section">
                      <div className="price-block">
                        <span className="current-price">{formatPrice(product.price)}</span>
                        {product.mrp > product.price && (
                          <span className="original-price">{formatPrice(product.mrp)}</span>
                        )}
                      </div>
                      <button className="buy-now-btn" onClick={() => handleBuyNow(product)}>
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="product-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedProduct(null)}>×</button>
            <div className="modal-image-section">
              <img src={selectedProduct.image} alt={selectedProduct.name} />
              <div className="modal-discount">
                {getDiscount(selectedProduct.mrp, selectedProduct.price)}% OFF
              </div>
            </div>
            <div className="modal-info">
              <span className="modal-brand">{selectedProduct.brand}</span>
              <h2>{selectedProduct.name}</h2>
              <p className="modal-description">{selectedProduct.description}</p>
              <div className="modal-offers">
                {selectedProduct.offers.map((offer, idx) => (
                  <span key={idx} className="modal-offer">{offer}</span>
                ))}
              </div>
              <div className="modal-price">
                <span className="modal-current">{formatPrice(selectedProduct.price)}</span>
                <span className="modal-mrp">{formatPrice(selectedProduct.mrp)}</span>
              </div>
              <button className="modal-buy-btn" onClick={() => handleBuyNow(selectedProduct)}>
                Buy Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

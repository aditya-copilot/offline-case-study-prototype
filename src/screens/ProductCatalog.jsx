import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOffer } from '../context/OfferContext'
import { products } from '../data/products'
import { SearchBar } from '../Components/SearchBar'
import './ProductCatalog.css'

const categories = [
  { id: 'all', name: 'All Products', icon: '🏪' },
  { id: 'smartphones', name: 'Smartphones', icon: '📱' },
  { id: 'laptops', name: 'Laptops', icon: '💻' },
  { id: 'audio', name: 'Audio', icon: '🎧' },
  { id: 'wearables', name: 'Wearables', icon: '⌚' },
  { id: 'home', name: 'Home Appliances', icon: '🏠' },
  { id: 'gaming', name: 'Gaming', icon: '🎮' }
]

const sortOptions = [
  { id: 'popular', name: 'Most Popular' },
  { id: 'price-low', name: 'Price: Low to High' },
  { id: 'price-high', name: 'Price: High to Low' },
  { id: 'newest', name: 'Newest First' }
]

function ProductCatalog() {
  const navigate = useNavigate()
  const { selectProduct } = useOffer()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('popular')
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredProducts, setFilteredProducts] = useState(products)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    let result = [...products]

    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category?.toLowerCase().includes(selectedCategory) || 
        p.name.toLowerCase().includes(selectedCategory))
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.brand?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
      )
    }

    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        result.sort((a, b) => b.price - a.price)
        break
      case 'newest':
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
        break
      default:
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    }

    setFilteredProducts(result)
  }, [selectedCategory, searchQuery, sortBy])

  const handleProductClick = (product) => {
    selectProduct({
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: product.image,
      category: product.category,
      rating: product.rating
    }, 'electronics')
    navigate('/checkout/user-input')
  }

  const startAIRecommendation = () => {
    navigate('/chat')
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  return (
    <div className="product-catalog">
      {/* Header */}
      <header className="catalog-header">
        <div className="catalog-header-content">
          <div className="catalog-brand">
            <span className="brand-icon">🏪</span>
            <div>
              <h1>HyperCredit Store</h1>
              <p>Electronics & Gadgets</p>
            </div>
          </div>
          <div className="catalog-actions">
            <button className="ai-assistant-btn" onClick={startAIRecommendation}>
              <span className="ai-icon">🤖</span>
              <span>AI Assistant</span>
            </button>
          </div>
        </div>
      </header>

      {/* Search & Filter Bar */}
      <div className="catalog-toolbar">
        <SearchBar 
          placeholder="Search products, brands..."
          onSearch={setSearchQuery}
          showFilters={true}
          filters={{}}
          onFilterChange={() => {}}
          filterOptions={{
            price: { label: 'Price Range', values: ['Under ₹20k', '₹20k-50k', '₹50k-1L', 'Above ₹1L'] },
            brand: { label: 'Brand', values: ['Apple', 'Samsung', 'Sony', 'OnePlus'] }
          }}
        />
        
        <div className="sort-dropdown">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {sortOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="category-pills">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="results-info">
        <p>Showing {filteredProducts.length} products</p>
      </div>

      {/* Product Grid */}
      <div className="products-grid">
        {filteredProducts.map((product, index) => (
          <div key={product.id} className="product-card" style={{ animationDelay: `${index * 0.05}s` }}>
            <div className="product-image-container">
              <img 
                src={product.image} 
                alt={product.name}
                loading="lazy"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x300?text=Product'
                }}
              />
              {product.discount > 0 && (
                <span className="discount-badge">-{product.discount}%</span>
              )}
              {product.isNew && (
                <span className="new-badge">NEW</span>
              )}
              <button className="wishlist-btn">♡</button>
            </div>
            
            <div className="product-details">
              <div className="product-brand">{product.brand}</div>
              <h3 className="product-name">{product.name}</h3>
              
              <div className="product-rating">
                <span className="stars">{'⭐'.repeat(Math.floor(product.rating || 4))}</span>
                <span className="rating-count">({product.reviews || 0})</span>
              </div>

              <div className="product-price-row">
                <span className="current-price">{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <span className="original-price">{formatPrice(product.originalPrice)}</span>
                )}
              </div>

              {product.emi && (
                <div className="emi-info">
                  No Cost EMI from {formatPrice(product.emi)}/month
                </div>
              )}

              <div className="product-actions">
                <button 
                  className="buy-now-btn"
                  onClick={() => handleProductClick(product)}
                >
                  Apply for Loan
                </button>
                <button className="add-cart-btn">
                  🛒
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating AI Button */}
      <button className="floating-ai-btn" onClick={startAIRecommendation} title="Ask AI Assistant">
        <span className="ai-avatar">🤖</span>
        <span className="ai-text">Ask AI</span>
      </button>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No products found</h3>
          <p>Try adjusting your search or filters</p>
          <button className="clear-filters-btn" onClick={() => {
            setSearchQuery('')
            setSelectedCategory('all')
          }}>
            Clear Filters
          </button>
        </div>
      )}
    </div>
  )
}

export default ProductCatalog

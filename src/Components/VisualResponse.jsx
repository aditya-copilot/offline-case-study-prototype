import './VisualResponse.css'

const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const SparklesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/>
    <path d="M19 17v4"/>
    <path d="M3 5h4"/>
    <path d="M17 19h4"/>
  </svg>
)

export default function VisualResponse({ query, count, brand, category, priceConstraint }) {
  const getBrandImage = (brandName) => {
    const brandImages = {
      'Apple': 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=800&h=400&fit=crop',
      'Samsung': 'https://images.unsplash.com/photo-1610945265078-3858a0828671?w=800&h=400&fit=crop',
      'Sony': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=400&fit=crop',
      'OnePlus': 'https://images.unsplash.com/photo-1598327105666-5b89351aff23?w=800&h=400&fit=crop',
      'Xiaomi': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=400&fit=crop',
      'Google': 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=800&h=400&fit=crop',
      'HP': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=400&fit=crop',
      'Dell': 'https://images.unsplash.com/photo-1593642632823-8f78536788c6?w=800&h=400&fit=crop',
      'LG': 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&h=400&fit=crop',
    }
    return brandImages[brandName] || 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&h=400&fit=crop'
  }

  const getCategoryImage = (catName) => {
    const categoryImages = {
      'Smartphone': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=400&fit=crop',
      'Laptop': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=400&fit=crop',
      'Television': 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&h=400&fit=crop',
      'Earbuds': 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=800&h=400&fit=crop',
      'Smartwatch': 'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=800&h=400&fit=crop',
      'Refrigerator': 'https://images.unsplash.com/photo-1571175443880-49e1d58b794a?w=800&h=400&fit=crop',
      'WashingMachine': 'https://images.unsplash.com/photo-1626806775351-538068a21838?w=800&h=400&fit=crop',
      'Tablet': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=400&fit=crop',
      'Speaker': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&h=400&fit=crop',
      'GamingConsole': 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=400&fit=crop',
      'AirConditioner': 'https://images.unsplash.com/photo-1617103893393-277579601d36?w=800&h=400&fit=crop',
    }
    return categoryImages[catName] || 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&h=400&fit=crop'
  }

  const backgroundImage = brand ? getBrandImage(brand) : category ? getCategoryImage(category) : 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&h=400&fit=crop'
  
  const displayTitle = brand ? `${brand} Products` : category ? `${category}` : query
  const displaySubtitle = count === 1 ? '1 product found' : `${count} products found`

  return (
    <div className="visual-response-card">
      <div className="visual-response-image" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="visual-response-overlay">
          <div className="visual-response-content">
            <div className="visual-response-badge">
              <SearchIcon />
              <span>Search Results</span>
            </div>
            
            <h2 className="visual-response-title">{displayTitle}</h2>
            
            <div className="visual-response-count">
              <div className="count-icon-wrapper">
                <CheckIcon />
              </div>
              <span className="count-text">{displaySubtitle}</span>
            </div>

            {brand && (
              <div className="visual-response-brand-tag">
                <SparklesIcon />
                <span>Premium {brand} Collection</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

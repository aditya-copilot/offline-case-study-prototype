import './ComparisonDrawer.css'

export default function ComparisonDrawer({ bikes, onClose, onRemove }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  const specs = [
    { key: 'price', label: 'Price', getValue: b => formatPrice(b.onRoadPrice || b.price * 1.2) },
    { key: 'mileage', label: 'Mileage', getValue: b => b.mileage },
    { key: 'engine', label: 'Engine', getValue: b => b.engine },
    { key: 'power', label: 'Max Power', getValue: b => b.power },
    { key: 'weight', label: 'Kerb Weight', getValue: b => b.weight },
    { key: 'seatHeight', label: 'Seat Height', getValue: b => b.seatHeight },
    { key: 'tankCapacity', label: 'Fuel Tank', getValue: b => b.tankCapacity },
    { key: 'topSpeed', label: 'Top Speed', getValue: b => b.topSpeed },
    { key: 'rating', label: 'Rating', getValue: b => `${b.rating}/5` }
  ]

  return (
    <div className="comparison-overlay" onClick={onClose}>
      <div className="comparison-drawer" onClick={e => e.stopPropagation()}>
        <div className="comparison-header">
          <h2>Compare Bikes</h2>
          <button className="comparison-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="comparison-content">
          {/* Bike Headers */}
          <div className="comparison-bikes-row">
            <div className="comparison-label-header">Features</div>
            {bikes.map(bike => (
              <div key={bike.id} className="comparison-bike-header">
                <button 
                  className="comparison-remove-btn"
                  onClick={() => onRemove(bike)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
                <div className="comparison-bike-image">
                  {bike.image ? (
                    <img src={bike.image} alt={bike.name} />
                  ) : (
                    <div className="comparison-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="5.5" cy="17.5" r="3.5"/>
                        <circle cx="18.5" cy="17.5" r="3.5"/>
                        <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/>
                      </svg>
                    </div>
                  )}
                </div>
                <h3>{bike.name}</h3>
                <p className="comparison-bike-price">{formatPrice(bike.price)}</p>
              </div>
            ))}
          </div>

          {/* Specs Comparison */}
          <div className="comparison-specs">
            {specs.map(spec => (
              <div key={spec.key} className="comparison-spec-row">
                <div className="comparison-spec-label">{spec.label}</div>
                {bikes.map(bike => (
                  <div key={bike.id} className="comparison-spec-value">
                    {spec.getValue(bike)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="comparison-footer">
          <button className="comparison-cta" onClick={onClose}>
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  )
}

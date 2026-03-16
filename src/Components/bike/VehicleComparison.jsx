import { useState } from 'react';
import { 
  COMPARISON_CATEGORIES, 
  compareVehicles, 
  formatSpecValue,
  generateInsights,
  getDifferences
} from '../../data/bike/comparisonUtils';
import { getVehicleImageUrl, FALLBACK_VEHICLE_IMAGE } from '../../utils/imageUtils';
import './VehicleComparison.css';

export default function VehicleComparison({ vehicles, onClose, onRemove, formatPrice }) {
  const [activeCategory, setActiveCategory] = useState('overview');
  const [highlightDifferences, setHighlightDifferences] = useState(true);
  
  const { data, winners } = compareVehicles(vehicles);
  const insights = generateInsights(vehicles);
  
  const currentCategory = COMPARISON_CATEGORIES.find(c => c.id === activeCategory);
  
  const isWinner = (vehicleSlug, categoryId, specKey) => {
    const categoryWinners = winners[categoryId]?.[specKey] || [];
    return categoryWinners.includes(vehicleSlug);
  };
  
  const getValueClass = (vehicleSlug, categoryId, specKey, specConfig) => {
    if (!highlightDifferences || specConfig.higherIsBetter === null) return '';
    if (isWinner(vehicleSlug, categoryId, specKey)) return 'value-winner';
    return 'value-normal';
  };
  
  const getVehicleImage = (vehicle) => {
    const imagePath = vehicle.model_details?.image_path || vehicle.model_image;
    return getVehicleImageUrl(imagePath) || FALLBACK_VEHICLE_IMAGE;
  };
  
  if (vehicles.length < 2) {
    return (
      <div className="comparison-overlay" onClick={onClose}>
        <div className="comparison-modal" onClick={e => e.stopPropagation()}>
          <div className="comparison-header">
            <h2>Compare Bikes</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="comparison-empty">
            <div className="empty-icon">⚖️</div>
            <p>Add at least 2 bikes to compare</p>
            <button className="btn-primary" onClick={onClose}>Browse Bikes</button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="comparison-overlay" onClick={onClose}>
      <div className="comparison-modal" onClick={e => e.stopPropagation()}>
        <div className="comparison-header">
          <div className="header-title">
            <span className="header-icon">⚖️</span>
            <div>
              <h2>Compare Bikes</h2>
              <p>Side-by-side detailed comparison</p>
            </div>
          </div>
          <div className="header-actions">
            <label className="toggle-diff">
              <input 
                type="checkbox" 
                checked={highlightDifferences}
                onChange={(e) => setHighlightDifferences(e.target.checked)}
              />
              <span>Highlight differences</span>
            </label>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="comparison-scrollable">
          {/* Vehicle Cards */}
          <div className="vehicle-comparison-cards">
            {vehicles.map((vehicle, idx) => {
              const vehicleData = data[idx].data;
              const insight = insights[idx];
              
              return (
                <div key={vehicle.model_slug} className="comparison-vehicle-card">
                  <button 
                    className="remove-vehicle-btn"
                    onClick={() => onRemove(vehicle)}
                    title="Remove"
                  >
                    ×
                  </button>
                  
                  <div className="comparison-vehicle-image">
                    <img 
                      src={getVehicleImage(vehicle)}
                      alt={vehicle.display_name}
                      onError={(e) => { e.target.src = FALLBACK_VEHICLE_IMAGE; }}
                    />
                  </div>
                  
                  <div className="comparison-vehicle-info">
                    <h3 className="vehicle-title">{vehicle.display_name}</h3>
                    <span className="vehicle-brand">{vehicle.make_slug?.toUpperCase()}</span>
                    <span className="vehicle-price">{formatPrice(vehicle.ex_showroom_price)}</span>
                    
                    <div className="vehicle-rating-row">
                      <span className="rating-stars">
                        {'★'.repeat(Math.floor(vehicleData.overview.rating))}
                        <span className="empty-stars">{'★'.repeat(5 - Math.floor(vehicleData.overview.rating))}</span>
                      </span>
                      <span className="rating-text">{vehicleData.overview.rating}</span>
                      <span className="reviews-count">({vehicleData.overview.reviews})</span>
                    </div>
                  </div>
                  
                  {insight.wins > 0 && (
                    <div className="wins-badge">
                      🏆 {insight.wins} best specs
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Category Tabs */}
          <div className="comparison-tabs-wrapper">
            <div className="comparison-tabs">
              {COMPARISON_CATEGORIES.map(category => (
                <button
                  key={category.id}
                  className={`comp-tab ${activeCategory === category.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <span className="tab-icon">{category.icon}</span>
                  <span className="tab-name">{category.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Comparison Table */}
          <div className="specs-comparison">
            <div className="specs-table">
              <div className="specs-header">
                <div className="spec-name-col">Specification</div>
                {vehicles.map(vehicle => (
                  <div key={vehicle.model_slug} className="spec-value-col">
                    {vehicle.display_name}
                  </div>
                ))}
              </div>
              
              <div className="specs-body">
                {currentCategory?.specs.map(spec => {
                  const differences = getDifferences(vehicles, activeCategory, spec.key);
                  
                  return (
                    <div key={spec.key} className="spec-row">
                      <div className="spec-label-cell">
                        <span className="spec-name">{spec.label}</span>
                        {differences && highlightDifferences && differences.percent > 0 && (
                          <span className="diff-badge">±{differences.percent}%</span>
                        )}
                      </div>
                      
                      {vehicles.map((vehicle, idx) => {
                        const vehicleData = data[idx].data;
                        const value = vehicleData[activeCategory]?.[spec.key];
                        const isWin = isWinner(vehicle.model_slug, activeCategory, spec.key);
                        
                        return (
                          <div 
                            key={vehicle.model_slug} 
                            className={`spec-value-cell ${getValueClass(vehicle.model_slug, activeCategory, spec.key, spec)}`}
                          >
                            <span className="the-value">
                              {formatSpecValue(value, spec.unit)}
                            </span>
                            {isWin && spec.higherIsBetter !== null && (
                              <span className="best-badge">Best</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="comparison-insights">
            <h3 className="insights-title">💡 Quick Insights</h3>
            <div className="insights-grid">
              {insights.map(({ vehicle, advantages, wins }) => (
                <div key={vehicle.model_slug} className="insight-card">
                  <div className="insight-header">
                    <img 
                      src={getVehicleImage(vehicle)}
                      alt={vehicle.display_name}
                      className="insight-thumb"
                      onError={(e) => { e.target.src = FALLBACK_VEHICLE_IMAGE; }}
                    />
                    <div className="insight-title">
                      <h4>{vehicle.display_name}</h4>
                      {wins > 0 && <span className="win-count">{wins} wins</span>}
                    </div>
                  </div>
                  
                  {advantages.length > 0 ? (
                    <ul className="advantages">
                      {advantages.slice(0, 4).map((adv, idx) => (
                        <li key={idx}>
                          <span className="adv-check">✓</span>
                          {adv}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-adv">Standard specs across all bikes</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Verdict */}
          {(() => {
            const sortedByWins = [...insights].sort((a, b) => b.wins - a.wins);
            const winner = sortedByWins[0];
            
            if (!winner || winner.wins === 0) return null;
            
            return (
              <div className="comparison-verdict">
                <h3 className="verdict-title">🏆 Our Recommendation</h3>
                <div className="verdict-card">
                  <div className="verdict-content">
                    <img 
                      src={getVehicleImage(winner.vehicle)}
                      alt={winner.vehicle.display_name}
                      className="verdict-image"
                      onError={(e) => { e.target.src = FALLBACK_VEHICLE_IMAGE; }}
                    />
                    <div className="verdict-details">
                      <h4>{winner.vehicle.display_name}</h4>
                      <p className="verdict-reason">
                        Best overall choice with {winner.wins} top specifications
                      </p>
                      <span className="verdict-price">
                        {formatPrice(winner.vehicle.ex_showroom_price)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Footer */}
          <div className="comparison-footer">
            <span className="compare-stats">Comparing {vehicles.length} bikes</span>
            <button className="btn-done" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    </div>
  );
}

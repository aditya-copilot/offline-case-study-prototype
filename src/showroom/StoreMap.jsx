import './StoreMap.css'

export default function StoreMap({ bike, showroom, onClose }) {
  const zones = showroom?.zones || []
  const bikeZone = zones.find(z => z.id === bike?.location?.zone) || zones[0]

  return (
    <div className="map-overlay" onClick={onClose}>
      <div className="map-modal" onClick={e => e.stopPropagation()}>
        <div className="map-header">
          <h2>Store Location Map</h2>
          <button className="map-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="map-bike-info">
          <h3>{bike?.name}</h3>
          <div className="map-location-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>Zone {bike?.location?.zone} • {bike?.location?.spot}</span>
          </div>
        </div>

        <div className="map-container">
          {/* Simple Store Layout */}
          <div className="store-layout">
            {/* Ground Floor */}
            <div className="store-floor">
              <div className="floor-label">Ground Floor</div>
              <div className="floor-grid">
                {zones.filter(z => z.floor === 'Ground Floor').map(zone => (
                  <div 
                    key={zone.id}
                    className={`store-zone ${zone.id === bike?.location?.zone ? 'active' : ''}`}
                  >
                    <div className="zone-label">Zone {zone.id}</div>
                    <div className="zone-name">{zone.name}</div>
                    <div className="zone-location">{zone.location}</div>
                    {zone.id === bike?.location?.zone && (
                      <div className="zone-marker">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        <span>Your Bike</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* First Floor */}
            <div className="store-floor">
              <div className="floor-label">First Floor</div>
              <div className="floor-grid">
                {zones.filter(z => z.floor === 'First Floor').map(zone => (
                  <div key={zone.id} className="store-zone">
                    <div className="zone-label">Zone {zone.id}</div>
                    <div className="zone-name">{zone.name}</div>
                    <div className="zone-location">{zone.location}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Directions */}
          <div className="map-directions">
            <h4>Directions</h4>
            <div className="direction-steps">
              <div className="direction-step">
                <div className="step-number">1</div>
                <p>Enter through the main entrance</p>
              </div>
              <div className="direction-step">
                <div className="step-number">2</div>
                <p>Walk straight to the {bikeZone?.location}</p>
              </div>
              <div className="direction-step">
                <div className="step-number">3</div>
                <p>Look for Zone {bike?.location?.zone} - {bikeZone?.name}</p>
              </div>
              <div className="direction-step">
                <div className="step-number">4</div>
                <p>Find the bike at {bike?.location?.spot}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="map-footer">
          <button className="map-navigate-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
            Get Directions
          </button>
        </div>
      </div>
    </div>
  )
}

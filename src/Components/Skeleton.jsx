import './Skeleton.css';

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-image"></div>
      <div className="skeleton-content">
        <div className="skeleton-title"></div>
        <div className="skeleton-text"></div>
        <div className="skeleton-price"></div>
      </div>
    </div>
  );
}

export function SkeletonVehicleCard() {
  return (
    <div className="skeleton-vehicle-card">
      <div className="skeleton-vehicle-image"></div>
      <div className="skeleton-vehicle-content">
        <div className="skeleton-vehicle-brand"></div>
        <div className="skeleton-vehicle-title"></div>
        <div className="skeleton-vehicle-specs">
          <div className="skeleton-spec"></div>
          <div className="skeleton-spec"></div>
        </div>
        <div className="skeleton-vehicle-price"></div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonVehicleGrid({ count = 8 }) {
  return (
    <div className="skeleton-vehicle-grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonVehicleCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="skeleton-text-block">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton-line" style={{ width: `${100 - (i * 10)}%` }}></div>
      ))}
    </div>
  );
}

export function SkeletonOfferCard() {
  return (
    <div className="skeleton-offer-card">
      <div className="skeleton-offer-header">
        <div className="skeleton-offer-logo"></div>
        <div className="skeleton-offer-info">
          <div className="skeleton-offer-name"></div>
          <div className="skeleton-offer-type"></div>
        </div>
      </div>
      <div className="skeleton-offer-stats">
        <div className="skeleton-stat"></div>
        <div className="skeleton-stat"></div>
        <div className="skeleton-stat"></div>
      </div>
    </div>
  );
}

import { useState, useCallback } from 'react';
import { Zap, Trophy, Star, Heart, Gauge, Fuel } from 'lucide-react';
import { cn } from '@core/utils';
import { vehicleImageResolver } from '@core/assets/vehicleImageResolver';
import { GlassSurface } from '@design-system/components/GlassSurface';
import type { Vehicle, VehicleCardProps } from '@core/types/vehicles';

const getFuelIcon = (fuelType: string) => {
  switch (fuelType) {
    case 'Electric': return <Zap className="h-3 w-3" />;
    case 'Petrol': return <Fuel className="h-3 w-3" />;
    default: return <Gauge className="h-3 w-3" />;
  }
};

const getZoneBadgeColor = (zoneId: string): string => {
  const colors: Record<string, string> = {
    'ev-showroom': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'scooter-zone': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'commuter-zone': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'sports-zone': 'bg-red-500/20 text-red-400 border-red-500/30',
    'premium-zone': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    'cruiser-zone': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'adventure-zone': 'bg-teal-500/20 text-teal-400 border-teal-500/30'
  };
  return colors[zoneId] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
};

export function VehicleCard({
  vehicle,
  variant = 'standard',
  showPrice = true,
  showSpecs = true,
  showRating = true,
  onClick,
  onCompare,
  isComparing = false,
  isFavorite = false,
  lazyLoadImage = true,
  priority = false
}: VehicleCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [favorite, setFavorite] = useState(isFavorite);
  const [imageError, setImageError] = useState(false);

  const imageConfig = vehicleImageResolver.resolveImage(vehicle, {
    variant: variant === 'featured' ? 'hero' : 'main'
  });

  const handleClick = useCallback(() => {
    onClick?.(vehicle);
  }, [onClick, vehicle]);

  const handleCompareClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onCompare?.(vehicle);
  }, [onCompare, vehicle]);

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorite(!favorite);
  }, [favorite]);

  const minPrice = vehicle.priceRange.min;
  const formattedPrice = minPrice > 0
    ? `₹${minPrice.toLocaleString()}`
    : 'Price on request';

  const displacement = vehicle.variants[0]?.specs['Displacement'] || '';

  if (variant === 'compact') {
    return (
      <GlassSurface
        className={cn(
          'group cursor-pointer overflow-hidden rounded-xl transition-all duration-300',
          'hover:scale-[1.02] hover:shadow-lg'
        )}
        onClick={handleClick}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-800">
          <img
            src={imageError ? '/fallback-bike.png' : imageConfig.src}
            alt={imageConfig.alt}
            loading={priority ? 'eager' : lazyLoadImage ? 'lazy' : 'eager'}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={cn(
              'h-full w-full object-cover transition-opacity duration-300',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" />
            </div>
          )}
          <button
            onClick={handleFavoriteClick}
            className={cn(
              'absolute right-2 top-2 rounded-full p-1.5 transition-colors',
              favorite ? 'bg-red-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'
            )}
          >
            <Heart className={cn('h-3.5 w-3.5', favorite && 'fill-current')} />
          </button>
        </div>

        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-slate-400">{vehicle.makeName}</p>
              <h3 className="truncate text-sm font-semibold text-slate-100">{vehicle.modelName}</h3>
            </div>
            {showRating && vehicle.overallRating > 0 && (
              <div className="flex items-center gap-0.5 text-amber-400">
                <Star className="h-3 w-3 fill-current" />
                <span className="text-xs font-medium">{vehicle.overallRating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {showPrice && (
            <p className="mt-2 text-sm font-bold text-emerald-400">{formattedPrice}</p>
          )}
        </div>
      </GlassSurface>
    );
  }

  return (
    <GlassSurface
      className={cn(
        'group cursor-pointer overflow-hidden rounded-2xl transition-all duration-300',
        variant === 'featured' ? 'hover:scale-[1.02]' : 'hover:scale-[1.01]',
        'hover:shadow-xl hover:shadow-blue-500/10'
      )}
      onClick={handleClick}
    >
      <div className={cn(
        'relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900',
        variant === 'featured' ? 'aspect-[16/10]' : 'aspect-[4/3]'
      )}>
        <img
          src={imageError ? '/fallback-bike.png' : imageConfig.src}
          alt={imageConfig.alt}
          loading={priority ? 'eager' : lazyLoadImage ? 'lazy' : 'eager'}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={cn(
            'h-full w-full object-cover transition-all duration-500',
            imageLoaded ? 'opacity-100' : 'opacity-0',
            'group-hover:scale-105'
          )}
        />

        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />

        <div className="absolute left-3 top-3 flex gap-2">
          <span className={cn(
            'rounded-full border px-2 py-0.5 text-xs font-medium backdrop-blur-sm',
            getZoneBadgeColor(vehicle.zoneId)
          )}>
            {vehicle.zoneId.replace('-', ' ')}
          </span>
          {vehicle.isNewlyLaunched && (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400 backdrop-blur-sm">
              New
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3 flex gap-2">
          <button
            onClick={handleFavoriteClick}
            className={cn(
              'rounded-full p-2 transition-all',
              favorite
                ? 'bg-red-500 text-white'
                : 'bg-black/30 text-white backdrop-blur-sm hover:bg-black/50'
            )}
          >
            <Heart className={cn('h-4 w-4', favorite && 'fill-current')} />
          </button>
          {onCompare && (
            <button
              onClick={handleCompareClick}
              className={cn(
                'rounded-full p-2 transition-all backdrop-blur-sm',
                isComparing
                  ? 'bg-blue-500 text-white'
                  : 'bg-black/30 text-white hover:bg-black/50'
              )}
            >
              <Trophy className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-slate-300">{vehicle.makeName}</p>
              <h3 className={cn(
                'font-bold text-white',
                variant === 'featured' ? 'text-xl' : 'text-lg'
              )}>
                {vehicle.modelName}
              </h3>
            </div>
            {showRating && vehicle.overallRating > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-black/30 px-2 py-1 backdrop-blur-sm">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-white">{vehicle.overallRating.toFixed(1)}</span>
                <span className="text-xs text-slate-400">({vehicle.totalReviews})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between">
          {showPrice && (
            <div>
              <p className="text-xs text-slate-400">Starting from</p>
              <p className="text-lg font-bold text-emerald-400">
                ₹{vehicle.priceRange.min.toLocaleString()}
              </p>
            </div>
          )}

          {showSpecs && (
            <div className="flex gap-3">
              {displacement && (
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Gauge className="h-3.5 w-3.5" />
                  <span>{displacement}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-slate-400">
                {getFuelIcon(vehicle.fuelType)}
                <span>{vehicle.fuelType}</span>
              </div>
            </div>
          )}
        </div>

        {vehicle.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {vehicle.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-700/50 px-2 py-0.5 text-xs text-slate-300"
              >
                {tag}
              </span>
            ))}
            {vehicle.tags.length > 3 && (
              <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-xs text-slate-300">
                +{vehicle.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </GlassSurface>
  );
}

export default VehicleCard;

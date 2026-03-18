import { useState, useEffect } from 'react';
import { X, Heart, Share2, Scale, MapPin, ChevronRight, Star, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { vehicleImageResolver } from '@core/assets/vehicleImageResolver';
import { GlassSurface } from '@design-system/components/GlassSurface';
import type { Vehicle, VehicleVariant, VehicleColor, VehicleDetailPanelProps } from '@core/types/vehicles';

const getFuelBadgeColor = (fuelType: string): string => {
  switch (fuelType) {
    case 'Electric': return 'bg-emerald-500 text-white';
    case 'Petrol': return 'bg-blue-500 text-white';
    case 'CNG': return 'bg-amber-500 text-white';
    default: return 'bg-slate-500 text-white';
  }
};

export function VehicleDetailPanel({
  vehicle,
  initialVariantId,
  initialColorId,
  onVariantChange,
  onColorChange,
  onClose,
  onCompare,
  onBookTestRide,
  showSpecs = true,
  showReviews = true,
  showVariants = true
}: VehicleDetailPanelProps) {
  const [selectedVariant, setSelectedVariant] = useState<VehicleVariant>(
    vehicle.variants.find(v => v.id === initialVariantId) || vehicle.variants[0]
  );
  const [selectedColor, setSelectedColor] = useState<VehicleColor | null>(
    vehicle.colors.find(c => c.id === initialColorId) || null
  );
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'reviews'>('overview');

  const imageConfig = selectedColor
    ? vehicleImageResolver.resolveColorImage(vehicle, selectedColor.id)
    : vehicleImageResolver.resolveImage(vehicle, { variant: 'detail' });

  useEffect(() => {
    if (initialVariantId) {
      const variant = vehicle.variants.find(v => v.id === initialVariantId);
      if (variant) setSelectedVariant(variant);
    }
  }, [initialVariantId, vehicle.variants]);

  const handleVariantSelect = (variant: VehicleVariant) => {
    setSelectedVariant(variant);
    onVariantChange?.(variant);
  };

  const handleColorSelect = (color: VehicleColor) => {
    setSelectedColor(color);
    onColorChange?.(color);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm"
    >
      <div className="mx-auto h-full max-w-4xl overflow-hidden">
        <div className="relative h-full overflow-y-auto">
          <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
            <motion.img
              key={imageConfig.src}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={imageConfig.src}
              alt={imageConfig.alt}
              className="h-full w-full object-contain"
            />

            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="absolute left-4 top-4 flex gap-2">
              <span className={getFuelBadgeColor(vehicle.fuelType) + ' rounded-full px-3 py-1 text-xs font-semibold'}>
                {vehicle.fuelType}
              </span>
              {vehicle.isNewlyLaunched && (
                <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
                  New Launch
                </span>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">{vehicle.makeName}</p>
                <h1 className="text-2xl font-bold text-white">{vehicle.modelName}</h1>
                <div className="mt-2 flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-white">{vehicle.overallRating.toFixed(1)}</span>
                    <span className="text-sm text-slate-400">({vehicle.totalReviews} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-slate-400">
                    <MapPin className="h-4 w-4" />
                    <span>{vehicle.zoneId.replace('-', ' ')}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="rounded-full bg-slate-700 p-2 text-white hover:bg-slate-600">
                  <Heart className="h-5 w-5" />
                </button>
                <button className="rounded-full bg-slate-700 p-2 text-white hover:bg-slate-600">
                  <Share2 className="h-5 w-5" />
                </button>
                <button onClick={onCompare} className="rounded-full bg-slate-700 p-2 text-white hover:bg-slate-600">
                  <Scale className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs text-slate-400">Starting Price</p>
              <p className="text-3xl font-bold text-emerald-400">
                ₹{selectedVariant?.formattedPrice || vehicle.priceRange.formatted}
              </p>
            </div>

            {showVariants && vehicle.variants.length > 1 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-white">Select Variant</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {vehicle.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => handleVariantSelect(variant)}
                      className={`rounded-lg border px-4 py-2 text-left transition-all ${
                        selectedVariant?.id === variant.id
                          ? 'border-blue-500 bg-blue-500/20 text-white'
                          : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <p className="font-medium">{variant.name}</p>
                      <p className="text-sm text-emerald-400">{variant.formattedPrice}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {vehicle.colors.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-white">Available Colors</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {vehicle.colors.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => handleColorSelect(color)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 transition-all ${
                        selectedColor?.id === color.id
                          ? 'border-blue-500 bg-blue-500/20 text-white'
                          : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <span
                        className="h-4 w-4 rounded-full border border-slate-500"
                        style={{ backgroundColor: `#${color.hexCode.split(',')[0]}` }}
                      />
                      <span className="text-sm">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-4">
              <button
                onClick={onBookTestRide}
                className="flex-1 rounded-lg bg-blue-500 py-3 font-semibold text-white transition-colors hover:bg-blue-600"
              >
                Book Test Ride
              </button>
              <button className="flex-1 rounded-lg bg-slate-700 py-3 font-semibold text-white transition-colors hover:bg-slate-600">
                Get Best Offers
              </button>
            </div>

            <div className="mt-8 border-b border-slate-700">
              <div className="flex gap-6">
                {['overview', 'specs', 'reviews'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`border-b-2 px-2 pb-3 text-sm font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <GlassSurface className="p-4">
                    <h3 className="font-semibold text-white">Key Specifications</h3>
                    <div className="mt-3 grid grid-cols-2 gap-4">
                      {Object.entries(vehicle.keySpecs).slice(0, 6).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-xs text-slate-400">{key}</p>
                          <p className="font-medium text-slate-200">{value}</p>
                        </div>
                      ))}
                    </div>
                  </GlassSurface>

                  {vehicle.tags.length > 0 && (
                    <GlassSurface className="p-4">
                      <h3 className="font-semibold text-white">Features</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {vehicle.tags.map((tag) => (
                          <span
                            key={tag}
                            className="flex items-center gap-1 rounded-full bg-slate-700/50 px-3 py-1 text-sm text-slate-300"
                          >
                            <Zap className="h-3 w-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </GlassSurface>
                  )}
                </div>
              )}

              {activeTab === 'specs' && showSpecs && (
                <div className="space-y-4">
                  {vehicle.specifications.map((specCategory) => (
                    <GlassSurface key={specCategory.category} className="p-4">
                      <h3 className="font-semibold text-white">{specCategory.category}</h3>
                      <div className="mt-3 space-y-2">
                        {specCategory.specs.map((spec) => (
                          <div key={spec.name} className="flex justify-between py-1">
                            <span className="text-sm text-slate-400">{spec.name}</span>
                            <span className="text-sm text-slate-200">
                              {spec.values.join(', ')} {spec.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </GlassSurface>
                  ))}
                </div>
              )}

              {activeTab === 'reviews' && showReviews && (
                <div className="space-y-4">
                  <GlassSurface className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-white">{vehicle.overallRating}</p>
                        <div className="flex justify-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(vehicle.overallRating)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="mt-1 text-sm text-slate-400">{vehicle.totalReviews} reviews</p>
                      </div>
                      <div className="flex-1">
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <div key={rating} className="flex items-center gap-2">
                            <span className="w-4 text-sm text-slate-400">{rating}</span>
                            <div className="flex-1 rounded-full bg-slate-700">
                              <div
                                className="h-2 rounded-full bg-amber-400"
                                style={{
                                  width: `${(vehicle.reviews.filter(r => r.rating === rating).length / vehicle.totalReviews) * 100}%`
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </GlassSurface>

                  {vehicle.reviews.slice(0, 3).map((review) => (
                    <GlassSurface key={review.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-white">{review.title}</p>
                          <p className="text-sm text-slate-400">by {review.username}</p>
                        </div>
                        <div className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-semibold text-amber-400">{review.rating}</span>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-slate-300 line-clamp-3">{review.description}</p>
                    </GlassSurface>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default VehicleDetailPanel;

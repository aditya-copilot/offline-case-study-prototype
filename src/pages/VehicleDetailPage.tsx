import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  Share2,
  Scale,
  MapPin,
  Star,
  Zap,
  Fuel,
  Gauge,
  Plus,
  Minus,
  Navigation,
  Bike,
  Wallet,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Check
} from 'lucide-react';

import { vehicleDataLoader } from '@core/data/vehicleDataLoader';
import { vehicleImageResolver } from '@core/assets/vehicleImageResolver';
import { useShoppingList, useUIActions } from '@store/index';
import { cn, formatCurrency } from '@core/utils';
import { Button } from '@components/ui/Button';
import { Card, CardContent } from '@components/ui/Card';
import { Skeleton } from '@components/feedback/Skeleton';
import { useLoanActions } from '@features/loan';
import type { Vehicle } from '@core/types/vehicles';

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<number>(0);
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [showEMIDetails, setShowEMIDetails] = useState(false);
  const [selectedTenure, setSelectedTenure] = useState<number>(36);

  const shoppingList = useShoppingList();
  const { addToast } = useUIActions();
  const { selectProduct } = useLoanActions();

  useEffect(() => {
    const loadVehicle = async () => {
      if (!id) return;

      setIsLoading(true);
      await vehicleDataLoader.load();
      const found = vehicleDataLoader.getVehicleById(id);
      setVehicle(found || null);
      setIsLoading(false);
    };

    loadVehicle();
  }, [id]);

  const handleAddToList = async () => {
    if (!vehicle) return;

    // @ts-ignore - Shopping list functionality
    await shoppingList.addItem?.(vehicle as any, quantity);
    addToast({
      type: 'success',
      title: 'Added to list',
      message: `${quantity} × ${vehicle.name} added to your list`
    });
  };

  const handleApplyForLoan = () => {
    if (!vehicle) return;
    
    selectProduct({
      id: vehicle.id,
      name: `${vehicle.makeName} ${vehicle.modelName}`,
      price: avgPrice,
      image: imageConfig.src,
      brand: vehicle.makeName,
      category: vehicle.category
    });
    
    addToast({
      type: 'success',
      title: 'Loan Application Started',
      message: `Please provide your details to view offers for ${vehicle.modelName}`
    });
    
    navigate('/loan/user-input');
  };

  const getFuelIcon = (fuelType: string) => {
    switch (fuelType) {
      case 'Electric':
        return <Zap className="h-4 w-4" />;
      case 'Petrol':
        return <Fuel className="h-4 w-4" />;
      default:
        return <Bike className="h-4 w-4" />;
    }
  };

  const getZoneBadgeColor = (zoneId: string): string => {
    const colors: Record<string, string> = {
      'ev-showroom': 'bg-emerald-500 text-white',
      'scooter-zone': 'bg-blue-500 text-white',
      'commuter-zone': 'bg-amber-500 text-white',
      'sports-zone': 'bg-red-500 text-white',
      'premium-zone': 'bg-violet-500 text-white',
      'cruiser-zone': 'bg-pink-500 text-white',
      'adventure-zone': 'bg-teal-500 text-white'
    };
    return colors[zoneId] || 'bg-slate-500 text-white';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton variant="text" lines={3} />
        <div className="flex gap-2">
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 w-24" />
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <Bike className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Vehicle not found</h2>
        <p className="text-muted-foreground mb-4">
          The vehicle you are looking for does not exist.
        </p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const variant = vehicle.variants[selectedVariant];
  const avgPrice = (vehicle.priceRange.min + vehicle.priceRange.max) / 2;
  
  const imageConfig = selectedColor
    ? vehicleImageResolver.resolveColorImage(vehicle, selectedColor)
    : vehicleImageResolver.resolveVariantImage(vehicle, variant.id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <Button variant="ghost" onClick={() => navigate(-1)} className="-ml-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <div className="aspect-square bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative">
            <img
              src={imageConfig.src}
              alt={imageConfig.alt}
              className="w-full h-full object-contain p-8"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Bike className="w-32 h-32 text-slate-700 opacity-50" />
            </div>
            <div className="absolute top-4 left-4">
              <span className={cn('px-3 py-1 rounded-full text-sm font-medium', getZoneBadgeColor(vehicle.zoneId))}>
                {vehicle.zoneId.replace('-', ' ')}
              </span>
            </div>
            {vehicle.isNewlyLaunched && (
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-sm font-medium">
                  New Launch
                </span>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{vehicle.makeName}</p>
                <h1 className="text-2xl font-bold">{vehicle.modelName}</h1>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsFavorite(!isFavorite)}
                >
                  <Heart
                    className={cn(
                      'w-4 h-4',
                      isFavorite && 'fill-red-500 text-red-500'
                    )}
                  />
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="font-semibold">{vehicle.overallRating.toFixed(1)}</span>
                <span className="text-muted-foreground">
                  ({vehicle.totalReviews} reviews)
                </span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                {getFuelIcon(vehicle.fuelType)}
                <span>{vehicle.fuelType}</span>
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-emerald-400">
              ₹{avgPrice.toLocaleString('en-IN')}
            </span>
            <span className="text-sm text-muted-foreground">On-road price</span>
          </div>

          {vehicle.variants.length > 1 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Select Variant</h3>
                <div className="grid grid-cols-1 gap-3">
                  {vehicle.variants.map((v, idx) => {
                    const variantImage = vehicleImageResolver.resolveVariantImage(vehicle, v.id);
                    const isSelected = selectedVariant === idx;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(idx)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-input hover:border-primary/50"
                        )}
                      >
                        <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          <img
                            src={variantImage.src}
                            alt={v.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <div className="w-full h-full flex items-center justify-center">
                            <Bike className="w-6 h-6 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{v.name}</div>
                          <div className="text-sm text-primary font-semibold">
                            {v.formattedPrice}
                          </div>
                          {v.specs['Displacement'] && (
                            <div className="text-xs text-muted-foreground">
                              {v.specs['Displacement']}
                            </div>
                          )}
                        </div>
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                          isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                        )}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {vehicle.colors.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Available Colors</h3>
                <div className="flex flex-wrap gap-2">
                  {vehicle.colors.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setSelectedColor(color.id)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
                        selectedColor === color.id
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'border-slate-600 hover:border-slate-500'
                      )}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-slate-500"
                        style={{ backgroundColor: `#${color.hexCode.split(',')[0]}` }}
                      />
                      <span className="text-sm">{color.name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Body Style</span>
                <span className="font-medium">{vehicle.bodyStyle}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Category</span>
                <span className="font-medium">{vehicle.category}</span>
              </div>
              {variant?.specs['Displacement'] && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Engine</span>
                  <span className="font-medium">{variant.specs['Displacement']}</span>
                </div>
              )}
              {variant?.specs['Mileage - ARAI'] && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Mileage</span>
                  <span className="font-medium">{variant.specs['Mileage - ARAI']}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center gap-4">
            <div className="flex items-center border rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <Button className="flex-1" onClick={handleAddToList}>
              <Bike className="w-4 h-4 mr-2" />
              Add to List
            </Button>
          </div>

          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Finance Available</span>
                </div>
                <button 
                  onClick={() => setShowEMIDetails(!showEMIDetails)}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  {showEMIDetails ? 'Hide Details' : 'View EMI Options'}
                  {showEMIDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
              
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary">
                    ₹{Math.round(avgPrice * 0.03).toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Starting EMI for {selectedTenure} months @ 12% p.a.
                </p>
              </div>

              {showEMIDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 space-y-3"
                >
                  <div className="text-xs font-medium text-muted-foreground mb-2">Select Tenure:</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[24, 36, 48].map((months) => {
                      const emi = Math.round(avgPrice * (0.12/12) * Math.pow(1 + 0.12/12, months) / (Math.pow(1 + 0.12/12, months) - 1));
                      return (
                        <button
                          key={months}
                          onClick={() => setSelectedTenure(months)}
                          className={cn(
                            "p-2 rounded-lg border text-center transition-all",
                            selectedTenure === months
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div className="text-xs font-semibold">{months} mo</div>
                          <div className="text-[10px] text-muted-foreground">₹{emi.toLocaleString('en-IN')}</div>
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                    <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Interest rate may vary based on your credit profile. Final rates will be shown after eligibility check.
                    </p>
                  </div>
                </motion.div>
              )}

              <Button 
                className="w-full" 
                variant="default"
                onClick={handleApplyForLoan}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Apply for Loan
              </Button>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                *Zero downpayment options available. T&C apply.
              </p>
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full">
            <Navigation className="w-4 h-4 mr-2" />
            Navigate to Zone
          </Button>
        </div>
      </div>

      {vehicle.specifications.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicle.specifications.slice(0, 3).map((specCategory) => (
                <div key={specCategory.category}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    {specCategory.category}
                  </h4>
                  <div className="space-y-2">
                    {specCategory.specs.slice(0, 5).map((spec) => (
                      <div key={spec.name} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{spec.name}</span>
                        <span>{spec.values.join(', ')} {spec.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, X, ChevronRight, Bike } from 'lucide-react';

import { vehicleImageResolver } from '@core/assets/vehicleImageResolver';
import { useCompare, useCompareActions } from '@store';
import { Button } from '@components/ui/Button';
import { cn } from '@core/utils';

export function CompareBar() {
  const navigate = useNavigate();
  const { compareList, maxCompareCount } = useCompare();
  const { removeFromCompare, clearCompareList } = useCompareActions();

  if (compareList.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-700"
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-2 text-white shrink-0">
                <Scale className="h-5 w-5" />
                <span className="font-medium">
                  Compare ({compareList.length}/{maxCompareCount})
                </span>
              </div>

              <div className="flex gap-2">
                {compareList.map((vehicle) => {
                  const imageConfig = vehicleImageResolver.resolveImage(vehicle, {
                    variant: 'thumbnail'
                  });

                  return (
                    <div
                      key={vehicle.id}
                      className="relative flex items-center gap-2 bg-slate-800 rounded-lg p-2 pr-6 shrink-0"
                    >
                      <div className="w-12 h-12 rounded bg-slate-700 overflow-hidden">
                        <img
                          src={imageConfig.src}
                          alt={imageConfig.alt}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-white text-sm">
                        <p className="font-medium line-clamp-1">{vehicle.modelName}</p>
                        <p className="text-xs text-slate-400">{vehicle.makeName}</p>
                      </div>
                      <button
                        onClick={() => removeFromCompare(vehicle.id)}
                        className="absolute top-1 right-1 p-0.5 hover:bg-slate-600 rounded-full transition-colors"
                      >
                        <X className="h-3 w-3 text-slate-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="sm" onClick={clearCompareList} className="text-slate-400">
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/compare')}
                disabled={compareList.length < 2}
                className="flex items-center gap-1"
              >
                Compare Now
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

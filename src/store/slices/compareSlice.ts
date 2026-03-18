import type { StateCreator } from 'zustand';
import type { Vehicle } from '@core/types/vehicles';

export interface CompareSlice {
  compareList: Vehicle[];
  maxCompareCount: number;

  addToCompare: (vehicle: Vehicle) => boolean;
  removeFromCompare: (vehicleId: string) => void;
  clearCompareList: () => void;
  isInCompareList: (vehicleId: string) => boolean;
  getCompareCount: () => number;
  canAddMore: () => boolean;
}

export const createCompareSlice: StateCreator<CompareSlice> = (set, get) => ({
  compareList: [],
  maxCompareCount: 4,

  addToCompare: (vehicle) => {
    const { compareList, maxCompareCount } = get();

    if (compareList.length >= maxCompareCount) {
      return false;
    }

    if (compareList.some((v) => v.id === vehicle.id)) {
      return false;
    }

    set({ compareList: [...compareList, vehicle] });
    return true;
  },

  removeFromCompare: (vehicleId) => {
    const { compareList } = get();
    set({
      compareList: compareList.filter((v) => v.id !== vehicleId)
    });
  },

  clearCompareList: () => {
    set({ compareList: [] });
  },

  isInCompareList: (vehicleId) => {
    const { compareList } = get();
    return compareList.some((v) => v.id === vehicleId);
  },

  getCompareCount: () => {
    return get().compareList.length;
  },

  canAddMore: () => {
    const { compareList, maxCompareCount } = get();
    return compareList.length < maxCompareCount;
  }
});

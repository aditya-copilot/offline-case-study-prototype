import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { createThemeSlice, type ThemeSlice } from './slices/themeSlice';
import { createBLESlice, type BLESlice } from './slices/bleSlice';
import { createBLEDetectionSlice, type BLEDetectionSlice } from './slices/bleDetectionSlice';
import { createUserSlice, type UserSlice } from './slices/userSlice';
import { createNavigationSlice, type NavigationSlice } from './slices/navigationSlice';
import { createShoppingListSlice, type ShoppingListSlice } from './slices/shoppingListSlice';
import { createUISlice, type UISlice } from './slices/uiSlice';
import { createPathEngineSlice, type PathEngineSlice } from './slices/pathEngineSlice';
import { createCompareSlice, type CompareSlice } from './slices/compareSlice';

export type StoreState = ThemeSlice &
  BLESlice &
  BLEDetectionSlice &
  UserSlice &
  NavigationSlice &
  ShoppingListSlice &
  UISlice &
  PathEngineSlice &
  CompareSlice;

const STORAGE_KEY = 'store-navigator-storage';

export const useStore = create<StoreState>()(
  persist(
    immer((set, get, api) => ({
      ...createThemeSlice(set, get, api),
      ...createBLESlice(set, get, api),
      ...createBLEDetectionSlice(set, get, api),
      ...createUserSlice(set, get, api),
      ...createNavigationSlice(set, get, api),
      ...createShoppingListSlice(set, get, api),
      ...createUISlice(set, get, api),
      ...createPathEngineSlice(set, get, api),
      ...createCompareSlice(set, get, api)
    })),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        profile: state.profile
      }),
      version: 1
    }
  )
);

export const initializeStore = async (): Promise<void> => {
  const store = useStore.getState();

  store.initializeTheme();

  await Promise.all([store.initializeUser(), store.initializeLists()]);

  const onboardingComplete = localStorage.getItem('sn:onboarding');
  if (onboardingComplete === 'true') {
    useStore.setState({ showOnboarding: false });
  }
};

export const useTheme = () => useStore((state) => state.theme);
export const useThemeActions = () =>
  useStore((state) => ({
    setThemeMode: state.setThemeMode,
    setPrimaryColor: state.setPrimaryColor,
    setAccentColor: state.setAccentColor,
    setFontScale: state.setFontScale,
    toggleReduceMotion: state.toggleReduceMotion,
    toggleHighContrast: state.toggleHighContrast
  }));

export const useBLE = () =>
  useStore((state) => ({
    isScanning: state.isScanning,
    isSupported: state.isSupported,
    hasPermission: state.hasPermission,
    detectedBeacons: state.detectedBeacons,
    userLocation: state.userLocation,
    currentZone: state.currentZone,
    error: state.error
  }));

export const useBLEActions = () =>
  useStore((state) => ({
    startScan: state.startScan,
    stopScan: state.stopScan,
    requestPermission: state.requestPermission,
    simulateBeacons: state.simulateBeacons,
    clearError: state.clearError
  }));

export const useBLEDetection = () =>
  useStore((state) => ({
    beaconConfigs: state.beaconConfigs,
    isScanning: state.isScanning,
    scanStatus: state.scanStatus,
    rawSignals: state.rawSignals,
    filteredSignals: state.filteredSignals,
    currentZone: state.currentZone,
    zoneEstimates: state.zoneEstimates,
    zoneConfidence: state.zoneConfidence,
    isSimulationMode: state.isSimulationMode,
    simulationPosition: state.simulationPosition,
    scanRate: state.scanRate,
    activeBeaconCount: state.activeBeaconCount
  }));

export const useBLEDetectionActions = () =>
  useStore((state) => ({
    setBeaconConfigs: state.setBeaconConfigs,
    startScan: state.startScan,
    stopScan: state.stopScan,
    addRawSignal: state.addRawSignal,
    addFilteredSignal: state.addFilteredSignal,
    clearSignals: state.clearSignals,
    setCurrentZone: state.setCurrentZone,
    setZoneEstimates: state.setZoneEstimates,
    setSimulationMode: state.setSimulationMode,
    setSimulationPosition: state.setSimulationPosition,
    reset: state.reset
  }));

export const useUser = () =>
  useStore((state) => ({
    profile: state.profile,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated
  }));

export const useUserActions = () =>
  useStore((state) => ({
    updatePreferences: state.updatePreferences,
    recordProductFound: state.recordProductFound,
    recordListCompleted: state.recordListCompleted,
    recordDistanceWalked: state.recordDistanceWalked,
    updateStreak: state.updateStreak,
    updateProfile: state.updateProfile,
    signOut: state.signOut
  }));

export const useNavigation = () =>
  useStore((state) => ({
    isNavigating: state.isNavigating,
    currentRoute: state.currentRoute,
    currentInstruction: state.currentInstruction,
    remainingDistance: state.remainingDistance,
    remainingTime: state.remainingTime,
    destination: state.destination,
    targetList: state.targetList,
    error: state.error
  }));

export const useNavigationActions = () =>
  useStore((state) => ({
    startNavigation: state.startNavigation,
    stopNavigation: state.stopNavigation,
    nextInstruction: state.nextInstruction,
    previousInstruction: state.previousInstruction,
    skipToNextZone: state.skipToNextZone,
    calculateRoute: state.calculateRoute,
    setError: state.setError
  }));

export const useShoppingList = () =>
  useStore((state) => ({
    lists: state.lists,
    currentList: state.currentList,
    recentProducts: state.recentProducts,
    isLoading: state.isLoading,
    error: state.error
  }));

export const useShoppingListActions = () =>
  useStore((state) => ({
    createList: state.createList,
    setCurrentList: state.setCurrentList,
    addItem: state.addItem,
    removeItem: state.removeItem,
    updateItemQuantity: state.updateItemQuantity,
    toggleItemChecked: state.toggleItemChecked,
    updateItemPriority: state.updateItemPriority,
    clearCheckedItems: state.clearCheckedItems,
    deleteList: state.deleteList,
    optimizeOrder: state.optimizeOrder,
    getProgress: state.getProgress,
    getEstimatedCost: state.getEstimatedCost
  }));

export const useUI = () =>
  useStore((state) => ({
    toasts: state.toasts,
    bottomSheet: state.bottomSheet,
    modal: state.modal,
    isLoading: state.isLoading,
    loadingMessage: state.loadingMessage,
    searchQuery: state.searchQuery,
    activeTab: state.activeTab,
    showOnboarding: state.showOnboarding,
    sidebarOpen: state.sidebarOpen
  }));

export const useUIActions = () =>
  useStore((state) => ({
    addToast: state.addToast,
    removeToast: state.removeToast,
    clearAllToasts: state.clearAllToasts,
    openBottomSheet: state.openBottomSheet,
    closeBottomSheet: state.closeBottomSheet,
    openModal: state.openModal,
    closeModal: state.closeModal,
    setLoading: state.setLoading,
    setSearchQuery: state.setSearchQuery,
    setActiveTab: state.setActiveTab,
    completeOnboarding: state.completeOnboarding,
    toggleSidebar: state.toggleSidebar,
    setSidebarOpen: state.setSidebarOpen
  }));

export const usePathEngine = () =>
  useStore((state) => ({
    route: state.route,
    isCalculating: state.isCalculating,
    calculationProgress: state.calculationProgress,
    routeAlternatives: state.routeAlternatives,
    selectedRouteIndex: state.selectedRouteIndex,
    shoppingMode: state.shoppingMode,
    algorithm: state.algorithm,
    adaptationState: state.adaptationState,
    remainingDistance: state.remainingDistance,
    remainingTime: state.remainingTime,
    metrics: state.metrics
  }));

export const usePathEngineActions = () =>
  useStore((state) => ({
    setRoute: state.setRoute,
    calculateRoute: state.calculateRoute,
    selectAlternativeRoute: state.selectAlternativeRoute,
    setShoppingMode: state.setShoppingMode,
    setAlgorithm: state.setAlgorithm,
    completeWaypoint: state.completeWaypoint,
    skipWaypoint: state.skipWaypoint,
    updateAdaptationState: state.updateAdaptationState,
    resetRoute: state.resetRoute,
    clearRoute: state.clearRoute,
    exportRoute: state.exportRoute,
    importRoute: state.importRoute
  }));

export const useCompare = () =>
  useStore((state) => ({
    compareList: state.compareList,
    maxCompareCount: state.maxCompareCount
  }));

export const useCompareActions = () =>
  useStore((state) => ({
    addToCompare: state.addToCompare,
    removeFromCompare: state.removeFromCompare,
    clearCompareList: state.clearCompareList,
    isInCompareList: state.isInCompareList,
    canAddMore: state.canAddMore
  }));

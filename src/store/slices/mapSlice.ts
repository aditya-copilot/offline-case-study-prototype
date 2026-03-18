import type { StateCreator } from 'zustand';
import type {
  StoreZone,
  Shelf,
  NavigationNode,
  NavigationEdge,
  NavigationPath,
  CustomerPosition,
  Vector2,
  MapCamera
} from '@core/spatial/types';
import { StoreGraphImpl } from '@core/graph/StoreGraph';
import { createSimulationEngine } from '@core/map-engine/SimulationEngine';

export interface MapSlice {
  zones: StoreZone[];
  shelves: Shelf[];
  nodes: NavigationNode[];
  edges: NavigationEdge[];
  graph: StoreGraphImpl | null;
  currentPath: NavigationPath | null;
  isNavigating: boolean;
  navigationTarget: string | null;
  customerPosition: CustomerPosition | null;
  currentZone: string | null;
  isSimulating: boolean;
  mapCamera: MapCamera;
  selectedZone: StoreZone | null;
  hoveredZone: string | null;
  showDebug: boolean;
  nightMode: boolean;
  mapLayers: {
    grid: boolean;
    zones: boolean;
    shelves: boolean;
    nodes: boolean;
    edges: boolean;
    path: boolean;
    avatar: boolean;
  };
  mapStats: {
    fps: number;
    renderTime: number;
    entityCount: number;
  };
  
  setMapData: (data: {
    zones: StoreZone[];
    shelves: Shelf[];
    nodes: NavigationNode[];
    edges: NavigationEdge[];
  }) => void;
  startNavigation: (targetNodeId: string) => void;
  stopNavigation: () => void;
  setCurrentPath: (path: NavigationPath | null) => void;
  updateNavigationProgress: (progress: number) => void;
  setCustomerPosition: (position: CustomerPosition) => void;
  updateCustomerZone: (zoneId: string | null) => void;
  startSimulation: () => void;
  stopSimulation: () => void;
  teleportCustomer: (position: Vector2) => void;
  setMapCamera: (camera: Partial<MapCamera>) => void;
  selectZone: (zone: StoreZone | null) => void;
  hoverZone: (zoneId: string | null) => void;
  toggleDebug: () => void;
  toggleNightMode: () => void;
  toggleLayer: (layer: keyof MapSlice['mapLayers']) => void;
  updateMapStats: (stats: Partial<MapSlice['mapStats']>) => void;
  initializeMap: () => Promise<void>;
}

export const createMapSlice: StateCreator<MapSlice> = (set, get) => ({
  zones: [],
  shelves: [],
  nodes: [],
  edges: [],
  
  graph: null,
  
  currentPath: null,
  isNavigating: false,
  navigationTarget: null,
  
  customerPosition: null,
  currentZone: null,
  isSimulating: false,
  
  mapCamera: {
    position: { x: 50, y: 40 },
    zoom: 0.8,
    rotation: 0
  },
  
  selectedZone: null,
  hoveredZone: null,
  showDebug: false,
  nightMode: false,
  mapLayers: {
    grid: true,
    zones: true,
    shelves: true,
    nodes: false,
    edges: false,
    path: true,
    avatar: true
  },
  
  mapStats: {
    fps: 60,
    renderTime: 0,
    entityCount: 0
  },
  
  // Actions
  setMapData: (data) => {
    const graph = new StoreGraphImpl();
    
    data.zones.forEach(zone => graph.addZone(zone));
    data.shelves.forEach(shelf => graph.addShelf(shelf));
    data.nodes.forEach(node => graph.addNode(node));
    data.edges.forEach(edge => graph.addEdge(edge));
    
    set({
      zones: data.zones,
      shelves: data.shelves,
      nodes: data.nodes,
      edges: data.edges,
      graph
    });
  },
  
  startNavigation: (targetNodeId) => {
    set({
      isNavigating: true,
      navigationTarget: targetNodeId
    });
  },
  
  stopNavigation: () => {
    set({
      isNavigating: false,
      navigationTarget: null,
      currentPath: null
    });
  },
  
  setCurrentPath: (path) => {
    set({ currentPath: path });
  },
  
  updateNavigationProgress: (progress) => {
    set(state => ({
      currentPath: state.currentPath ? {
        ...state.currentPath,
        estimatedTime: state.currentPath.estimatedTime * (1 - progress)
      } : null
    }));
  },
  
  setCustomerPosition: (position) => {
    set({ customerPosition: position });
  },
  
  updateCustomerZone: (zoneId) => {
    set({ currentZone: zoneId });
  },
  
  startSimulation: () => {
    set({ isSimulating: true });
  },
  
  stopSimulation: () => {
    set({ isSimulating: false });
  },
  
  teleportCustomer: (position) => {
    set(state => ({
      customerPosition: state.customerPosition ? {
        ...state.customerPosition,
        position,
        velocity: { x: 0, y: 0 },
        isMoving: false
      } : {
        id: 'customer-1',
        position,
        heading: 0,
        velocity: { x: 0, y: 0 },
        accuracy: 1,
        timestamp: Date.now(),
        isMoving: false
      }
    }));
  },
  
  setMapCamera: (camera) => {
    set(state => ({
      mapCamera: { ...state.mapCamera, ...camera }
    }));
  },
  
  selectZone: (zone) => {
    set({ selectedZone: zone });
  },
  
  hoverZone: (zoneId) => {
    set({ hoveredZone: zoneId });
  },
  
  toggleDebug: () => {
    set(state => ({ showDebug: !state.showDebug }));
  },
  
  toggleNightMode: () => {
    set(state => ({ nightMode: !state.nightMode }));
  },
  
  toggleLayer: (layer) => {
    set(state => ({
      mapLayers: {
        ...state.mapLayers,
        [layer]: !state.mapLayers[layer]
      }
    }));
  },
  
  updateMapStats: (stats) => {
    set(state => ({
      mapStats: { ...state.mapStats, ...stats }
    }));
  },
  
  initializeMap: async () => {
    try {
      const response = await fetch('/config/storeLayout.json');
      const data = await response.json();
      get().setMapData(data);
    } catch (error) {
      console.error('Failed to load map data:', error);
    }
  }
});

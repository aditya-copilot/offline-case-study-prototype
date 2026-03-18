import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  NavigationNode,
  NavigationEdge,
  StoreZone,
  Shelf,
  NavigationPath,
  Vector2
} from '@core/spatial/types';
import { StoreGraphImpl } from '@core/graph/StoreGraph';
import { zoneRepo } from '@services/db';

interface UseStoreGraphOptions {
  autoLoad?: boolean;
  initialData?: {
    zones?: StoreZone[];
    shelves?: Shelf[];
    nodes?: NavigationNode[];
    edges?: NavigationEdge[];
  };
}

interface UseStoreGraphReturn {
  graph: StoreGraphImpl | null;
  isLoading: boolean;
  error: Error | null;
  getNode: (id: string) => NavigationNode | undefined;
  getEdge: (id: string) => NavigationEdge | undefined;
  getZone: (id: string) => StoreZone | undefined;
  getShelf: (id: string) => Shelf | undefined;
  getNeighbors: (nodeId: string) => NavigationNode[];
  findPath: (start: string, end: string) => NavigationPath | null;
  findMultiStopPath: (stops: string[]) => NavigationPath | null;
  findNearestNode: (position: Vector2) => NavigationNode | null;
  addZone: (zone: StoreZone) => void;
  addShelf: (shelf: Shelf) => void;
  addNode: (node: NavigationNode) => void;
  addEdge: (edge: NavigationEdge) => void;
  loadFromData: (data: {
    zones: StoreZone[];
    shelves: Shelf[];
    nodes: NavigationNode[];
    edges: NavigationEdge[];
  }) => void;
  clear: () => void;
  nodeCount: number;
  edgeCount: number;
  zoneCount: number;
  shelfCount: number;
}

export const useStoreGraph = (options: UseStoreGraphOptions = {}): UseStoreGraphReturn => {
  const { autoLoad = true, initialData } = options;
  
  const graphRef = useRef<StoreGraphImpl | null>(null);
  const [isLoading, setIsLoading] = useState(autoLoad);
  const [error, setError] = useState<Error | null>(null);
  const [, forceUpdate] = useState({});

  useEffect(() => {
    if (!graphRef.current) {
      graphRef.current = new StoreGraphImpl();
      
      if (initialData) {
        graphRef.current.fromJSON(initialData);
      }
      
      if (autoLoad) {
        loadFromDatabase();
      }
    }
  }, []);

  const loadFromDatabase = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const zones = await zoneRepo.getAll();
      
      if (zones.length > 0 && graphRef.current) {
        zones.forEach(zone => graphRef.current!.addZone(zone as StoreZone));
        forceUpdate({});
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load graph'));
    } finally {
      setIsLoading(false);
    }
  };

  const getNode = useCallback((id: string) => {
    return graphRef.current?.getNode(id);
  }, []);

  const getEdge = useCallback((id: string) => {
    return graphRef.current?.getEdge(id);
  }, []);

  const getZone = useCallback((id: string) => {
    return graphRef.current?.getZone(id);
  }, []);

  const getShelf = useCallback((id: string) => {
    return graphRef.current?.getShelf(id);
  }, []);

  const getNeighbors = useCallback((nodeId: string) => {
    return graphRef.current?.getNeighbors(nodeId) || [];
  }, []);

  const findPath = useCallback((start: string, end: string): NavigationPath | null => {
    if (!graphRef.current) return null;
    
    const nodePath = graphRef.current.findPath(start, end);
    if (!nodePath) return null;
    
    return graphRef.current.buildNavigationPath(nodePath.map(n => n.id)) || null;
  }, []);

  const findMultiStopPath = useCallback((stops: string[]): NavigationPath | null => {
    if (!graphRef.current || stops.length < 2) return null;
    
    const nodePath = graphRef.current.findMultiStopPath(stops);
    if (!nodePath) return null;
    
    return graphRef.current.buildNavigationPath(nodePath.map(n => n.id)) || null;
  }, []);

  const findNearestNode = useCallback((position: Vector2): NavigationNode | null => {
    return graphRef.current?.findNearestNode(position) || null;
  }, []);

  const addZone = useCallback((zone: StoreZone) => {
    graphRef.current?.addZone(zone);
    forceUpdate({});
  }, []);

  const addShelf = useCallback((shelf: Shelf) => {
    graphRef.current?.addShelf(shelf);
    forceUpdate({});
  }, []);

  const addNode = useCallback((node: NavigationNode) => {
    graphRef.current?.addNode(node);
    forceUpdate({});
  }, []);

  const addEdge = useCallback((edge: NavigationEdge) => {
    graphRef.current?.addEdge(edge);
    forceUpdate({});
  }, []);

  const loadFromData = useCallback((data: {
    zones: StoreZone[];
    shelves: Shelf[];
    nodes: NavigationNode[];
    edges: NavigationEdge[];
  }) => {
    graphRef.current?.fromJSON(data);
    forceUpdate({});
  }, []);

  const clear = useCallback(() => {
    graphRef.current?.clear();
    forceUpdate({});
  }, []);

  const graph = graphRef.current;
  const nodeCount = graph?.nodes.size || 0;
  const edgeCount = graph?.edges.size || 0;
  const zoneCount = graph?.zones.size || 0;
  const shelfCount = graph?.shelves.size || 0;

  return {
    graph,
    isLoading,
    error,
    getNode,
    getEdge,
    getZone,
    getShelf,
    getNeighbors,
    findPath,
    findMultiStopPath,
    findNearestNode,
    addZone,
    addShelf,
    addNode,
    addEdge,
    loadFromData,
    clear,
    nodeCount,
    edgeCount,
    zoneCount,
    shelfCount
  };
};

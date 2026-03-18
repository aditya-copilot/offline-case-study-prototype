import type {
  StoreGraph as IStoreGraph,
  NavigationNode,
  NavigationEdge,
  StoreZone,
  Shelf,
  Vector2,
  NavigationPath,
  PathSegment
} from '@core/spatial/types';
import { calculateDistance, generateId } from '@core/utils';

interface GraphEdge {
  to: string;
  weight: number;
  edgeId: string;
}

export class StoreGraphImpl implements IStoreGraph {
  nodes: Map<string, NavigationNode> = new Map();
  edges: Map<string, NavigationEdge> = new Map();
  zones: Map<string, StoreZone> = new Map();
  shelves: Map<string, Shelf> = new Map();
  
  private adjacencyList: Map<string, GraphEdge[]> = new Map();
  private reverseAdjacencyList: Map<string, GraphEdge[]> = new Map();

  constructor() {}

  addNode(node: NavigationNode): void {
    this.nodes.set(node.id, node);
    if (!this.adjacencyList.has(node.id)) {
      this.adjacencyList.set(node.id, []);
    }
    if (!this.reverseAdjacencyList.has(node.id)) {
      this.reverseAdjacencyList.set(node.id, []);
    }
  }

  addEdge(edge: NavigationEdge): void {
    this.edges.set(edge.id, edge);
    
    const fromList = this.adjacencyList.get(edge.fromNodeId) || [];
    fromList.push({ to: edge.toNodeId, weight: edge.weight, edgeId: edge.id });
    this.adjacencyList.set(edge.fromNodeId, fromList);

    const toList = this.reverseAdjacencyList.get(edge.toNodeId) || [];
    toList.push({ to: edge.fromNodeId, weight: edge.weight, edgeId: edge.id });
    this.reverseAdjacencyList.set(edge.toNodeId, toList);

    if (edge.bidirectional) {
      const reverseFromList = this.adjacencyList.get(edge.toNodeId) || [];
      reverseFromList.push({ to: edge.fromNodeId, weight: edge.weight, edgeId: edge.id });
      this.adjacencyList.set(edge.toNodeId, reverseFromList);

      const reverseToList = this.reverseAdjacencyList.get(edge.fromNodeId) || [];
      reverseToList.push({ to: edge.toNodeId, weight: edge.weight, edgeId: edge.id });
      this.reverseAdjacencyList.set(edge.fromNodeId, reverseToList);
    }

    const fromNode = this.nodes.get(edge.fromNodeId);
    const toNode = this.nodes.get(edge.toNodeId);
    if (fromNode && !fromNode.connectedEdges.includes(edge.id)) {
      fromNode.connectedEdges.push(edge.id);
    }
    if (toNode && edge.bidirectional && !toNode.connectedEdges.includes(edge.id)) {
      toNode.connectedEdges.push(edge.id);
    }
  }

  addZone(zone: StoreZone): void {
    this.zones.set(zone.id, zone);
  }

  addShelf(shelf: Shelf): void {
    this.shelves.set(shelf.id, shelf);
  }

  getNode(id: string): NavigationNode | undefined {
    return this.nodes.get(id);
  }

  getEdge(id: string): NavigationEdge | undefined {
    return this.edges.get(id);
  }

  getZone(id: string): StoreZone | undefined {
    return this.zones.get(id);
  }

  getShelf(id: string): Shelf | undefined {
    return this.shelves.get(id);
  }

  getNeighbors(nodeId: string): NavigationNode[] {
    const edges = this.adjacencyList.get(nodeId) || [];
    return edges
      .map(edge => this.nodes.get(edge.to))
      .filter((node): node is NavigationNode => node !== undefined);
  }

  getEdgesFrom(nodeId: string): NavigationEdge[] {
    const edges = this.adjacencyList.get(nodeId) || [];
    return edges
      .map(edge => this.edges.get(edge.edgeId))
      .filter((edge): edge is NavigationEdge => edge !== undefined);
  }

  getEdgesTo(nodeId: string): NavigationEdge[] {
    const edges = this.reverseAdjacencyList.get(nodeId) || [];
    return edges
      .map(edge => this.edges.get(edge.edgeId))
      .filter((edge): edge is NavigationEdge => edge !== undefined);
  }

  findPath(start: string, end: string): NavigationNode[] | null {
    if (!this.nodes.has(start) || !this.nodes.has(end)) {
      return null;
    }

    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const unvisited = new Set<string>();

    for (const nodeId of this.nodes.keys()) {
      distances.set(nodeId, nodeId === start ? 0 : Infinity);
      previous.set(nodeId, null);
      unvisited.add(nodeId);
    }

    while (unvisited.size > 0) {
      let current: string | null = null;
      let minDistance = Infinity;

      for (const nodeId of unvisited) {
        const dist = distances.get(nodeId) || Infinity;
        if (dist < minDistance) {
          minDistance = dist;
          current = nodeId;
        }
      }

      if (current === null || current === end) break;
      unvisited.delete(current);

      const neighbors = this.adjacencyList.get(current) || [];
      for (const neighbor of neighbors) {
        if (!unvisited.has(neighbor.to)) continue;

        const alt = (distances.get(current) || 0) + neighbor.weight;
        if (alt < (distances.get(neighbor.to) || Infinity)) {
          distances.set(neighbor.to, alt);
          previous.set(neighbor.to, current);
        }
      }
    }

    if (distances.get(end) === Infinity) {
      return null;
    }

    const path: NavigationNode[] = [];
    let current: string | null = end;
    while (current !== null) {
      const node = this.nodes.get(current);
      if (node) {
        path.unshift(node);
      }
      current = previous.get(current) || null;
    }

    return path;
  }

  findMultiStopPath(stops: string[]): NavigationNode[] | null {
    if (stops.length < 2) return null;

    const fullPath: NavigationNode[] = [];

    for (let i = 0; i < stops.length - 1; i++) {
      const segment = this.findPath(stops[i], stops[i + 1]);
      if (!segment) return null;

      if (i === 0) {
        fullPath.push(...segment);
      } else {
        fullPath.push(...segment.slice(1));
      }
    }

    return fullPath;
  }

  buildNavigationPath(nodeIds: string[]): NavigationPath | null {
    const nodes: NavigationNode[] = [];
    for (const id of nodeIds) {
      const node = this.nodes.get(id);
      if (!node) return null;
      nodes.push(node);
    }

    if (nodes.length < 2) return null;

    const segments: PathSegment[] = [];
    const waypoints: Vector2[] = [];
    const zoneSet = new Set<string>();
    let totalDistance = 0;

    for (let i = 0; i < nodes.length - 1; i++) {
      const from = nodes[i];
      const to = nodes[i + 1];
      const distance = calculateDistance(from.position.x, from.position.y, to.position.x, to.position.y);
      const direction = Math.atan2(to.position.y - from.position.y, to.position.x - from.position.x);

      segments.push({
        from: from.position,
        to: to.position,
        distance,
        direction,
        instruction: this.generateInstruction(from, to, i, nodes.length - 1)
      });

      waypoints.push(from.position);
      totalDistance += distance;

      if (from.zoneId) zoneSet.add(from.zoneId);
    }

    waypoints.push(nodes[nodes.length - 1].position);
    if (nodes[nodes.length - 1].zoneId) {
      zoneSet.add(nodes[nodes.length - 1].zoneId);
    }

    const walkingSpeed = 1.4;
    const estimatedTime = totalDistance / walkingSpeed;

    return {
      id: generateId(),
      nodes,
      segments,
      totalDistance,
      estimatedTime,
      waypoints,
      zones: Array.from(zoneSet)
    };
  }

  private generateInstruction(from: NavigationNode, to: NavigationNode, index: number, total: number): string {
    if (index === 0) return 'Start here';
    if (index === total - 1) return 'You have arrived';
    
    const angle = Math.atan2(to.position.y - from.position.y, to.position.x - from.position.x);
    const degrees = (angle * 180) / Math.PI;
    
    let direction = 'Continue straight';
    if (degrees > 30 && degrees < 150) direction = 'Turn right';
    else if (degrees > 150 || degrees < -150) direction = 'Turn around';
    else if (degrees < -30 && degrees > -150) direction = 'Turn left';

    if (to.zoneId && to.type === 'zone-center') {
      const zone = this.zones.get(to.zoneId);
      if (zone) {
        return `Enter ${zone.name}`;
      }
    }

    return direction;
  }

  findNearestNode(position: Vector2): NavigationNode | null {
    let nearest: NavigationNode | null = null;
    let minDistance = Infinity;

    for (const node of this.nodes.values()) {
      const dist = calculateDistance(position.x, position.y, node.position.x, node.position.y);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = node;
      }
    }

    return nearest;
  }

  findNodesInRadius(center: Vector2, radius: number): NavigationNode[] {
    const results: NavigationNode[] = [];
    
    for (const node of this.nodes.values()) {
      const dist = calculateDistance(center.x, center.y, node.position.x, node.position.y);
      if (dist <= radius) {
        results.push(node);
      }
    }

    return results;
  }

  getZoneAtPoint(point: Vector2): StoreZone | null {
    for (const zone of this.zones.values()) {
      if (
        point.x >= zone.bounds.min.x &&
        point.x <= zone.bounds.max.x &&
        point.y >= zone.bounds.min.y &&
        point.y <= zone.bounds.max.y
      ) {
        return zone;
      }
    }
    return null;
  }

  getAllNodesInZone(zoneId: string): NavigationNode[] {
    const zone = this.zones.get(zoneId);
    if (!zone) return [];

    return Array.from(this.nodes.values()).filter(node => 
      node.position.x >= zone.bounds.min.x &&
      node.position.x <= zone.bounds.max.x &&
      node.position.y >= zone.bounds.min.y &&
      node.position.y <= zone.bounds.max.y
    );
  }

  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.zones.clear();
    this.shelves.clear();
    this.adjacencyList.clear();
    this.reverseAdjacencyList.clear();
  }

  toJSON(): object {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      zones: Array.from(this.zones.values()),
      shelves: Array.from(this.shelves.values())
    };
  }

  fromJSON(data: {
    nodes: NavigationNode[];
    edges: NavigationEdge[];
    zones: StoreZone[];
    shelves: Shelf[];
  }): void {
    this.clear();
    
    for (const zone of data.zones) {
      this.addZone(zone);
    }
    
    for (const shelf of data.shelves) {
      this.addShelf(shelf);
    }
    
    for (const node of data.nodes) {
      this.addNode(node);
    }
    
    for (const edge of data.edges) {
      this.addEdge(edge);
    }
  }
}

export const createStoreGraph = (): StoreGraphImpl => {
  return new StoreGraphImpl();
};

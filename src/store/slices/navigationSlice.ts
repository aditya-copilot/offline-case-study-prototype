import type { StateCreator } from 'zustand';
import type {
  NavigationRoute,
  NavigationInstruction,
  ShoppingList,
  StoreZone,
  Coordinates
} from '@core/types';
import { NAVIGATION_CONSTANTS } from '@core/constants';
import { generateId, calculateDistance } from '@core/utils';

export interface NavigationSlice {
  isNavigating: boolean;
  currentRoute: NavigationRoute | null;
  currentInstructionIndex: number;
  currentInstruction: NavigationInstruction | null;
  remainingDistance: number;
  remainingTime: number;
  destination: Coordinates | null;
  targetList: ShoppingList | null;
  zonesToVisit: StoreZone[];
  completedZones: string[];
  error: string | null;

  startNavigation: (route: NavigationRoute, targetList?: ShoppingList) => void;
  stopNavigation: () => void;
  nextInstruction: () => void;
  previousInstruction: () => void;
  updateProgress: (currentLocation: Coordinates) => void;
  skipToNextZone: () => void;
  calculateRoute: (
    start: Coordinates,
    zones: StoreZone[],
    products: Array<{ coordinates: Coordinates }>
  ) => NavigationRoute;
  setError: (error: string | null) => void;
}

const calculateRouteDistance = (waypoints: Coordinates[]): number => {
  let distance = 0;
  for (let i = 1; i < waypoints.length; i++) {
    distance += calculateDistance(
      waypoints[i - 1].x,
      waypoints[i - 1].y,
      waypoints[i].x,
      waypoints[i].y
    );
  }
  return distance;
};

const estimateTime = (distance: number): number => {
  const walkingSpeed = 1.4;
  return Math.ceil(distance / walkingSpeed);
};

const generateInstructions = (
  waypoints: Coordinates[],
  zones: StoreZone[]
): NavigationInstruction[] => {
  const instructions: NavigationInstruction[] = [];

  if (waypoints.length === 0) return instructions;

  instructions.push({
    id: generateId(),
    type: 'start',
    text: 'Start navigation',
    distance: 0,
    coordinates: waypoints[0]
  });

  for (let i = 1; i < waypoints.length - 1; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    const next = waypoints[i + 1];

    const angle =
      Math.atan2(next.y - curr.y, next.x - curr.x) -
      Math.atan2(curr.y - prev.y, curr.x - prev.x);
    const degrees = (angle * 180) / Math.PI;

    let type: NavigationInstruction['type'] = 'straight';
    let text = 'Continue straight';
    let icon = 'arrow-up';

    if (Math.abs(degrees) > 30) {
      if (degrees > 0) {
        type = 'turn';
        text = degrees > 90 ? 'Turn right' : 'Turn slight right';
        icon = 'corner-up-right';
      } else {
        type = 'turn';
        text = degrees < -90 ? 'Turn left' : 'Turn slight left';
        icon = 'corner-up-left';
      }
    }

    const distance = calculateDistance(prev.x, prev.y, curr.x, curr.y);

    instructions.push({
      id: generateId(),
      type,
      text,
      distance,
      coordinates: curr,
      nextCoordinates: next,
      icon
    });

    const nearbyZone = zones.find((z) =>
      curr.x >= z.bounds.minX &&
      curr.x <= z.bounds.maxX &&
      curr.y >= z.bounds.minY &&
      curr.y <= z.bounds.maxY
    );

    if (nearbyZone) {
      instructions.push({
        id: generateId(),
        type: 'arrival',
        text: `Entering ${nearbyZone.name}`,
        distance: 0,
        coordinates: curr,
        icon: 'map-pin'
      });
    }
  }

  if (waypoints.length > 1) {
    const last = waypoints[waypoints.length - 1];
    instructions.push({
      id: generateId(),
      type: 'arrival',
      text: 'You have arrived at your destination',
      distance: 0,
      coordinates: last,
      icon: 'flag'
    });
  }

  return instructions;
};

const optimizeWaypoints = (
  start: Coordinates,
  targets: Array<{ coordinates: Coordinates }>
): Coordinates[] => {
  if (targets.length === 0) return [start];

  const unvisited = [...targets];
  const route: Coordinates[] = [start];
  let current = start;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = calculateDistance(
        current.x,
        current.y,
        unvisited[i].coordinates.x,
        unvisited[i].coordinates.y
      );
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestIndex = i;
      }
    }

    const nearest = unvisited.splice(nearestIndex, 1)[0];
    current = nearest.coordinates;
    route.push(current);
  }

  return route;
};

export const createNavigationSlice: StateCreator<NavigationSlice> = (set, get) => ({
  isNavigating: false,
  currentRoute: null,
  currentInstructionIndex: 0,
  currentInstruction: null,
  remainingDistance: 0,
  remainingTime: 0,
  destination: null,
  targetList: null,
  zonesToVisit: [],
  completedZones: [],
  error: null,

  startNavigation: (route, targetList) => {
    set({
      isNavigating: true,
      currentRoute: route,
      currentInstructionIndex: 0,
      currentInstruction: route.instructions[0] ?? null,
      remainingDistance: route.estimatedDistance,
      remainingTime: route.estimatedTime,
      destination: route.waypoints[route.waypoints.length - 1] ?? null,
      targetList: targetList ?? null,
      zonesToVisit: [],
      completedZones: [],
      error: null
    });
  },

  stopNavigation: () => {
    set({
      isNavigating: false,
      currentRoute: null,
      currentInstructionIndex: 0,
      currentInstruction: null,
      remainingDistance: 0,
      remainingTime: 0,
      destination: null,
      targetList: null,
      zonesToVisit: [],
      completedZones: []
    });
  },

  nextInstruction: () => {
    const { currentRoute, currentInstructionIndex } = get();
    if (!currentRoute) return;

    const nextIndex = currentInstructionIndex + 1;
    if (nextIndex >= currentRoute.instructions.length) {
      get().stopNavigation();
      return;
    }

    const instruction = currentRoute.instructions[nextIndex];

    set({
      currentInstructionIndex: nextIndex,
      currentInstruction: instruction,
      remainingDistance: Math.max(0, get().remainingDistance - instruction.distance)
    });
  },

  previousInstruction: () => {
    const { currentRoute, currentInstructionIndex } = get();
    if (!currentRoute || currentInstructionIndex <= 0) return;

    const prevIndex = currentInstructionIndex - 1;
    const instruction = currentRoute.instructions[prevIndex];

    set({
      currentInstructionIndex: prevIndex,
      currentInstruction: instruction,
      remainingDistance: get().remainingDistance + instruction.distance
    });
  },

  updateProgress: (currentLocation) => {
    const { currentRoute, currentInstruction, destination, nextInstruction } = get();
    if (!currentRoute || !currentInstruction || !destination) return;

    const distanceToNext = calculateDistance(
      currentLocation.x,
      currentLocation.y,
      currentInstruction.coordinates.x,
      currentInstruction.coordinates.y
    );

    if (distanceToNext < NAVIGATION_CONSTANTS.WAYPOINT_THRESHOLD) {
      nextInstruction();
    }
  },

  skipToNextZone: () => {
    const { currentRoute, currentInstructionIndex } = get();
    if (!currentRoute) return;

    for (let i = currentInstructionIndex + 1; i < currentRoute.instructions.length; i++) {
      if (currentRoute.instructions[i].type === 'arrival') {
        set({
          currentInstructionIndex: i,
          currentInstruction: currentRoute.instructions[i]
        });
        break;
      }
    }
  },

  calculateRoute: (start, zones, products) => {
    const waypoints = optimizeWaypoints(
      start,
      products.map((p) => ({ coordinates: p.coordinates }))
    );

    const distance = calculateRouteDistance(waypoints);
    const time = estimateTime(distance);
    const instructions = generateInstructions(waypoints, zones);

    const route: NavigationRoute = {
      id: generateId(),
      waypoints,
      estimatedTime: time,
      estimatedDistance: distance,
      zones: zones.map((z) => z.id),
      instructions,
      createdAt: Date.now()
    };

    return route;
  },

  setError: (error) => {
    set({ error });
  }
});

interface Point {
  x: number;
  y: number;
}

interface PathOptions {
  startPoint?: Point;
  endPoint?: Point;
  waypoints?: Point[];
  smoothness?: number;
  includePauses?: boolean;
  pauseProbability?: number;
  pauseDurationRange?: [number, number];
}

export class WalkPathGenerator {
  private storeWidth: number = 100;
  private storeHeight: number = 80;

  constructor(storeWidth?: number, storeHeight?: number) {
    if (storeWidth) this.storeWidth = storeWidth;
    if (storeHeight) this.storeHeight = storeHeight;
  }

  generateRandomPath(length: number = 20, options: PathOptions = {}): Array<Point & { pause?: number }> {
    const path: Array<Point & { pause?: number }> = [];
    const { pauseProbability = 0.15, pauseDurationRange = [1000, 3000] } = options;

    let currentX = options.startPoint?.x ?? Math.random() * this.storeWidth;
    let currentY = options.startPoint?.y ?? Math.random() * this.storeHeight;

    path.push({ x: currentX, y: currentY });

    for (let i = 1; i < length; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 5 + Math.random() * 15;

      currentX += Math.cos(angle) * distance;
      currentY += Math.sin(angle) * distance;

      currentX = Math.max(5, Math.min(this.storeWidth - 5, currentX));
      currentY = Math.max(5, Math.min(this.storeHeight - 5, currentY));

      const point: Point & { pause?: number } = { x: currentX, y: currentY };

      if (Math.random() < pauseProbability) {
        point.pause = pauseDurationRange[0] + Math.random() * (pauseDurationRange[1] - pauseDurationRange[0]);
      }

      path.push(point);
    }

    return this.smoothPath(path, options.smoothness ?? 0.3);
  }

  generateZoneTourPath(zoneCenters: Map<string, Point>, startZone?: string): Array<Point & { pause?: number }> {
    const zones = Array.from(zoneCenters.entries());
    const path: Array<Point & { pause?: number }> = [];

    let currentZone = startZone;
    const visited = new Set<string>();
    const tour: string[] = [];

    while (visited.size < zones.length) {
      let nearestZone: string | null = null;
      let nearestDist = Infinity;
      let currentPos = currentZone ? zoneCenters.get(currentZone) : null;

      zones.forEach(([zoneId, center]) => {
        if (visited.has(zoneId)) return;

        if (!currentPos) {
          nearestZone = zoneId;
          nearestDist = 0;
        } else {
          const dist = this.distance(currentPos, center);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestZone = zoneId;
          }
        }
      });

      if (nearestZone) {
        tour.push(nearestZone);
        visited.add(nearestZone);
        currentZone = nearestZone;
      } else {
        break;
      }
    }

    tour.forEach((zoneId, index) => {
      const center = zoneCenters.get(zoneId);
      if (!center) return;

      const variance = 3;
      path.push({
        x: center.x + (Math.random() - 0.5) * variance,
        y: center.y + (Math.random() - 0.5) * variance,
        pause: 2000 + Math.random() * 3000
      });

      if (index < tour.length - 1) {
        const nextCenter = zoneCenters.get(tour[index + 1]);
        if (nextCenter) {
          const intermediatePoints = this.generateIntermediatePoints(center, nextCenter, 2);
          path.push(...intermediatePoints);
        }
      }
    });

    return path;
  }

  generatePerimeterPath(margin: number = 8): Point[] {
    const path: Point[] = [];
    const w = this.storeWidth - margin * 2;
    const h = this.storeHeight - margin * 2;

    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      path.push({
        x: margin + t * w,
        y: margin
      });
    }

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      path.push({
        x: this.storeWidth - margin,
        y: margin + t * h
      });
    }

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      path.push({
        x: this.storeWidth - margin - t * w,
        y: this.storeHeight - margin
      });
    }

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      path.push({
        x: margin,
        y: this.storeHeight - margin - t * h
      });
    }

    return path;
  }

  generateFigureEightPath(center: Point, radius: number = 20): Point[] {
    const path: Point[] = [];
    const steps = 60;

    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const x = center.x + radius * Math.sin(t);
      const y = center.y + radius * Math.sin(2 * t) / 2;
      path.push({ x, y });
    }

    return path;
  }

  generateSpiralPath(center: Point, maxRadius: number = 30, turns: number = 3): Point[] {
    const path: Point[] = [];
    const steps = turns * 20;

    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * turns * Math.PI * 2;
      const radius = (i / steps) * maxRadius;
      const x = center.x + radius * Math.cos(t);
      const y = center.y + radius * Math.sin(t);
      path.push({ x, y });
    }

    return path;
  }

  private generateIntermediatePoints(start: Point, end: Point, count: number): Point[] {
    const points: Point[] = [];
    for (let i = 1; i <= count; i++) {
      const t = i / (count + 1);
      const variation = 2;
      points.push({
        x: start.x + (end.x - start.x) * t + (Math.random() - 0.5) * variation,
        y: start.y + (end.y - start.y) * t + (Math.random() - 0.5) * variation
      });
    }
    return points;
  }

  private smoothPath<T extends Point>(path: T[], factor: number): T[] {
    if (path.length < 3) return path;

    const smoothed: T[] = [path[0]];

    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1];
      const curr = path[i];
      const next = path[i + 1];

      const smoothX = curr.x * (1 - factor) + (prev.x + next.x) / 2 * factor;
      const smoothY = curr.y * (1 - factor) + (prev.y + next.y) / 2 * factor;

      smoothed.push({
        ...curr,
        x: smoothX,
        y: smoothY
      } as T);
    }

    smoothed.push(path[path.length - 1]);
    return smoothed;
  }

  private distance(a: Point, b: Point): number {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
  }

  calculatePathLength(path: Point[]): number {
    let length = 0;
    for (let i = 1; i < path.length; i++) {
      length += this.distance(path[i - 1], path[i]);
    }
    return length;
  }

  calculateEstimatedTime(path: Array<Point & { pause?: number }>, speed: number = 1.5): number {
    let time = 0;
    for (let i = 1; i < path.length; i++) {
      const dist = this.distance(path[i - 1], path[i]);
      time += (dist / speed) * 1000;
      if (path[i].pause) {
        time += path[i].pause;
      }
    }
    return time;
  }

  optimizePath(path: Point[]): Point[] {
    if (path.length < 3) return path;

    const optimized: Point[] = [path[0]];

    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[optimized.length - 1];
      const curr = path[i];
      const next = path[i + 1];

      const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);

      if (Math.abs(angle2 - angle1) > 0.1) {
        optimized.push(curr);
      }
    }

    optimized.push(path[path.length - 1]);
    return optimized;
  }
}

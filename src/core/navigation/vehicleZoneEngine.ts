import { vehicleDataLoader } from '@core/data/vehicleDataLoader';
import type {
  Vehicle,
  VehicleZone,
  VehicleZoneType,
  VehicleAIContext,
  FuelType,
  BodyStyle
} from '@core/types/vehicles';

interface ZoneAssignment {
  vehicleId: string;
  zoneId: VehicleZoneType;
  confidence: number;
  reasons: string[];
}

class VehicleZoneEngine {
  private zones: Map<VehicleZoneType, VehicleZone> = new Map();
  private vehicleAssignments: Map<string, ZoneAssignment> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const zones = vehicleDataLoader.getZones();
    for (const zone of zones) {
      this.zones.set(zone.id, zone);
    }

    await this.assignVehiclesToZones();
    this.initialized = true;
  }

  private async assignVehiclesToZones(): Promise<void> {
    const result = await vehicleDataLoader.load();
    if (!result.success) return;

    const vehicles = vehicleDataLoader.getAllVehicles();

    for (const vehicle of vehicles) {
      const assignment = this.determineOptimalZone(vehicle);
      this.vehicleAssignments.set(vehicle.id, assignment);
    }
  }

  private determineOptimalZone(vehicle: Vehicle): ZoneAssignment {
    const reasons: string[] = [];
    let confidence = 1.0;

    if (vehicle.fuelType === 'Electric') {
      reasons.push('Electric vehicle - belongs in EV showroom');
      return {
        vehicleId: vehicle.id,
        zoneId: 'ev-showroom',
        confidence: 1.0,
        reasons
      };
    }

    if (vehicle.vehicleType === 'Scooter') {
      reasons.push('Scooter type - belongs in scooter zone');
      return {
        vehicleId: vehicle.id,
        zoneId: 'scooter-zone',
        confidence: 1.0,
        reasons
      };
    }

    const avgPrice = (vehicle.priceRange.min + vehicle.priceRange.max) / 2;
    if (avgPrice >= 150000) {
      reasons.push(`Premium price point (₹${avgPrice.toLocaleString()})`);
      return {
        vehicleId: vehicle.id,
        zoneId: 'premium-zone',
        confidence: 0.95,
        reasons
      };
    }

    switch (vehicle.bodyStyle) {
      case 'Sports':
        reasons.push('Sports bike classification');
        return {
          vehicleId: vehicle.id,
          zoneId: 'sports-zone',
          confidence: 0.95,
          reasons
        };
      case 'Cruiser':
        reasons.push('Cruiser bike classification');
        return {
          vehicleId: vehicle.id,
          zoneId: 'cruiser-zone',
          confidence: 0.95,
          reasons
        };
      case 'Adventure':
        reasons.push('Adventure/touring bike classification');
        return {
          vehicleId: vehicle.id,
          zoneId: 'adventure-zone',
          confidence: 0.95,
          reasons
        };
    }

    reasons.push('Standard commuter bike');
    return {
      vehicleId: vehicle.id,
      zoneId: 'commuter-zone',
      confidence: 0.9,
      reasons
    };
  }

  getZoneForVehicle(vehicleId: string): ZoneAssignment | undefined {
    return this.vehicleAssignments.get(vehicleId);
  }

  getVehiclesInZone(zoneId: VehicleZoneType): Vehicle[] {
    return vehicleDataLoader.getVehiclesByZone(zoneId);
  }

  getZone(zoneId: VehicleZoneType): VehicleZone | undefined {
    return this.zones.get(zoneId);
  }

  getAllZones(): VehicleZone[] {
    return Array.from(this.zones.values());
  }

  getAdjacentZones(zoneId: VehicleZoneType): VehicleZoneType[] {
    const adjacencies: Record<VehicleZoneType, VehicleZoneType[]> = {
      'ev-showroom': ['scooter-zone', 'premium-zone'],
      'scooter-zone': ['ev-showroom', 'commuter-zone'],
      'commuter-zone': ['scooter-zone', 'sports-zone', 'premium-zone'],
      'sports-zone': ['commuter-zone', 'premium-zone'],
      'premium-zone': ['ev-showroom', 'commuter-zone', 'sports-zone', 'cruiser-zone'],
      'cruiser-zone': ['premium-zone', 'adventure-zone'],
      'adventure-zone': ['cruiser-zone', 'commuter-zone'],
      'service-center': [],
      'accessories': ['commuter-zone', 'premium-zone'],
      'test-ride': ['ev-showroom', 'premium-zone', 'sports-zone']
    };

    return adjacencies[zoneId] || [];
  }

  findOptimalRoute(startZone: VehicleZoneType, interests: string[]): VehicleZoneType[] {
    const route: VehicleZoneType[] = [startZone];
    const visited = new Set<VehicleZoneType>([startZone]);

    const prioritizeZones = () => {
      const scores = new Map<VehicleZoneType, number>();

      for (const [zoneId, zone] of this.zones) {
        if (visited.has(zoneId)) continue;

        let score = 0;

        if (interests.includes('electric') && zoneId === 'ev-showroom') score += 10;
        if (interests.includes('premium') && zoneId === 'premium-zone') score += 10;
        if (interests.includes('sports') && zoneId === 'sports-zone') score += 10;
        if (interests.includes('scooter') && zoneId === 'scooter-zone') score += 10;

        const lastZone = route[route.length - 1];
        if (this.getAdjacentZones(lastZone).includes(zoneId)) {
          score += 5;
        }

        scores.set(zoneId, score);
      }

      return Array.from(scores.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([zoneId]) => zoneId);
    };

    while (route.length < this.zones.size) {
      const candidates = prioritizeZones();
      if (candidates.length === 0) break;

      const nextZone = candidates[0];
      route.push(nextZone);
      visited.add(nextZone);
    }

    return route;
  }

  generateZoneHeatmap(): Map<VehicleZoneType, number> {
    const heatmap = new Map<VehicleZoneType, number>();

    for (const zoneId of this.zones.keys()) {
      const vehicles = this.getVehiclesInZone(zoneId);
      const totalInterest = vehicles.reduce((sum, v) => sum + (v.overallRating * v.totalReviews), 0);
      heatmap.set(zoneId, totalInterest);
    }

    return heatmap;
  }

  getZoneRecommendations(currentZoneId: VehicleZoneType, preferences: {
    viewedVehicles: string[];
    preferredFuelType?: FuelType;
    budgetRange?: { min: number; max: number };
  }): Array<{ zoneId: VehicleZoneType; reason: string; priority: number }> {
    const recommendations: Array<{ zoneId: VehicleZoneType; reason: string; priority: number }> = [];
    const adjacent = this.getAdjacentZones(currentZoneId);

    for (const zoneId of adjacent) {
      const vehicles = this.getVehiclesInZone(zoneId);
      let priority = 1;
      let reason = `Adjacent to current zone`;

      if (preferences.preferredFuelType) {
        const matchingFuel = vehicles.filter(v => v.fuelType === preferences.preferredFuelType).length;
        if (matchingFuel > 0) {
          priority += 2;
          reason = `Contains ${matchingFuel} ${preferences.preferredFuelType} vehicles`;
        }
      }

      if (preferences.budgetRange) {
        const matchingBudget = vehicles.filter(v => {
          const avgPrice = (v.priceRange.min + v.priceRange.max) / 2;
          return avgPrice >= preferences.budgetRange!.min && avgPrice <= preferences.budgetRange!.max;
        }).length;
        if (matchingBudget > 0) {
          priority += 1;
          reason += `, ${matchingBudget} in your budget`;
        }
      }

      const unviewedCount = vehicles.filter(v => !preferences.viewedVehicles.includes(v.id)).length;
      if (unviewedCount > 0) {
        priority += 1;
        reason += `, ${unviewedCount} new vehicles to explore`;
      }

      recommendations.push({ zoneId, reason, priority });
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }
}

export const vehicleZoneEngine = new VehicleZoneEngine();
export { VehicleZoneEngine };
export type { ZoneAssignment };

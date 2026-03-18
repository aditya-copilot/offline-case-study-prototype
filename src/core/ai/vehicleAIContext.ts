import { vehicleDataLoader } from '@core/data/vehicleDataLoader';
import { vehicleZoneEngine } from '@core/navigation/vehicleZoneEngine';
import type {
  Vehicle,
  VehicleAIContext,
  VehicleRecommendationContext,
  FuelType,
  BodyStyle
} from '@core/types/vehicles';

interface SimilarityScore {
  vehicleId: string;
  score: number;
  reasons: string[];
}

interface RecommendationResult {
  vehicles: Vehicle[];
  reasoning: string;
  confidence: number;
}

class VehicleAIContextPipeline {
  private context: VehicleAIContext | null = null;
  private lastUpdated = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000;

  async buildContext(): Promise<VehicleAIContext> {
    if (this.context && Date.now() - this.lastUpdated < this.CACHE_TTL) {
      return this.context;
    }

    await vehicleDataLoader.load();
    await vehicleZoneEngine.initialize();

    const vehicles = vehicleDataLoader.getAllVehicles();
    const stats = vehicleDataLoader.getStats();
    const zones = vehicleDataLoader.getZones();

    const prices = vehicles.flatMap(v => [v.priceRange.min, v.priceRange.max]).filter(p => p > 0);
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];

    const priceBands = [
      { min: 0, max: 80000, label: 'Budget', count: 0 },
      { min: 80000, max: 150000, label: 'Mid-range', count: 0 },
      { min: 150000, max: 300000, label: 'Premium', count: 0 },
      { min: 300000, max: Infinity, label: 'Luxury', count: 0 }
    ];

    for (const vehicle of vehicles) {
      const avgPrice = (vehicle.priceRange.min + vehicle.priceRange.max) / 2;
      const band = priceBands.find(b => avgPrice >= b.min && avgPrice < b.max);
      if (band) band.count++;
    }

    const allTags = new Map<string, { count: number; vehicles: string[] }>();
    for (const vehicle of vehicles) {
      for (const tag of vehicle.tags) {
        const existing = allTags.get(tag) || { count: 0, vehicles: [] };
        existing.count++;
        existing.vehicles.push(vehicle.id);
        allTags.set(tag, existing);
      }
    }

    const featureTags = Array.from(allTags.entries())
      .map(([tag, data]) => ({ tag, count: data.count, vehicles: data.vehicles.slice(0, 5) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const brandData = new Map<string, { vehicles: Vehicle[]; totalPrice: number }>();
    for (const vehicle of vehicles) {
      const existing = brandData.get(vehicle.makeName) || { vehicles: [], totalPrice: 0 };
      existing.vehicles.push(vehicle);
      existing.totalPrice += (vehicle.priceRange.min + vehicle.priceRange.max) / 2;
      brandData.set(vehicle.makeName, existing);
    }

    const brandClusters = Array.from(brandData.entries())
      .map(([brand, data]) => ({
        brand,
        count: data.vehicles.length,
        avgPrice: Math.round(data.totalPrice / data.vehicles.length),
        topModels: data.vehicles
          .sort((a, b) => b.overallRating - a.overallRating)
          .slice(0, 3)
          .map(v => v.modelName)
      }))
      .sort((a, b) => b.count - a.count);

    const zoneVehicleCounts: Record<string, number> = {};
    for (const zone of zones) {
      zoneVehicleCounts[zone.id] = vehicleDataLoader.getVehiclesByZone(zone.id).length;
    }

    const sortedByRating = [...vehicles].sort((a, b) => b.overallRating - a.overallRating);
    const popularVehicles = sortedByRating.slice(0, 10).map(v => v.id);

    const sortedByRecent = [...vehicles].sort((a, b) =>
      new Date(b.launchedOn).getTime() - new Date(a.launchedOn).getTime()
    );
    const trendingVehicles = sortedByRecent.slice(0, 10).map(v => v.id);

    const comparablePairs: Array<[string, string]> = [];
    for (const vehicle of vehicles) {
      const similar = this.findSimilarVehiclesInternal(vehicle, vehicles, 2);
      for (const sim of similar) {
        if (vehicle.id < sim.vehicleId) {
          comparablePairs.push([vehicle.id, sim.vehicleId]);
        }
      }
    }

    this.context = {
      vehicles,
      availableBrands: Array.from(brandData.keys()),
      priceDistribution: {
        bands: priceBands,
        median: medianPrice
      },
      featureTags,
      brandClusters,
      zones,
      zoneVehicleCounts,
      popularVehicles,
      trendingVehicles,
      comparablePairs: comparablePairs.slice(0, 50)
    };

    this.lastUpdated = Date.now();
    return this.context;
  }

  async generateRecommendations(context: VehicleRecommendationContext): Promise<RecommendationResult> {
    const aiContext = await this.buildContext();
    const vehicles = aiContext.vehicles;

    const scoredVehicles: Array<{ vehicle: Vehicle; score: number; reasons: string[] }> = [];

    for (const vehicle of vehicles) {
      let score = 0;
      const reasons: string[] = [];

      if (context.viewedVehicles.includes(vehicle.id)) {
        continue;
      }

      if (context.userPreferences?.preferredFuelType) {
        if (vehicle.fuelType === context.userPreferences.preferredFuelType) {
          score += 10;
          reasons.push(`Matches preferred fuel type: ${vehicle.fuelType}`);
        }
      }

      if (context.userPreferences?.preferredBodyStyle) {
        if (vehicle.bodyStyle === context.userPreferences.preferredBodyStyle) {
          score += 8;
          reasons.push(`Matches preferred style: ${vehicle.bodyStyle}`);
        }
      }

      if (context.userPreferences?.budgetRange) {
        const avgPrice = (vehicle.priceRange.min + vehicle.priceRange.max) / 2;
        if (avgPrice >= context.userPreferences.budgetRange.min &&
            avgPrice <= context.userPreferences.budgetRange.max) {
          score += 15;
          reasons.push('Within budget range');
        } else if (avgPrice < context.userPreferences.budgetRange.max * 1.2) {
          score += 5;
          reasons.push('Slightly above budget but worth considering');
        }
      }

      if (context.userPreferences?.preferredBrands?.includes(vehicle.makeName)) {
        score += 7;
        reasons.push(`Preferred brand: ${vehicle.makeName}`);
      }

      if (context.userPreferences?.priorityFeatures) {
        const matchingFeatures = vehicle.tags.filter(tag =>
          context.userPreferences?.priorityFeatures?.some(f =>
            tag.toLowerCase().includes(f.toLowerCase())
          )
        );
        if (matchingFeatures.length > 0) {
          score += matchingFeatures.length * 3;
          reasons.push(`Has ${matchingFeatures.length} priority features`);
        }
      }

      if (vehicle.overallRating >= 4.5) {
        score += 5;
        reasons.push('Highly rated by customers');
      }

      if (vehicle.isNewlyLaunched) {
        score += 3;
        reasons.push('Newly launched model');
      }

      if (context.currentZone) {
        const assignment = vehicleZoneEngine.getZoneForVehicle(vehicle.id);
        if (assignment?.zoneId === context.currentZone) {
          score += 10;
          reasons.push('Available in current zone');
        } else if (vehicleZoneEngine.getAdjacentZones(context.currentZone as any).includes(assignment?.zoneId as any)) {
          score += 5;
          reasons.push('Available in adjacent zone');
        }
      }

      if (score > 0) {
        scoredVehicles.push({ vehicle, score, reasons });
      }
    }

    scoredVehicles.sort((a, b) => b.score - a.score);

    const topRecommendations = scoredVehicles.slice(0, 5);

    return {
      vehicles: topRecommendations.map(r => r.vehicle),
      reasoning: this.generateRecommendationReasoning(topRecommendations),
      confidence: topRecommendations.length > 0 ? Math.min(topRecommendations[0].score / 50, 1) : 0
    };
  }

  private generateRecommendationReasoning(
    recommendations: Array<{ vehicle: Vehicle; score: number; reasons: string[] }>
  ): string {
    if (recommendations.length === 0) {
      return 'No specific recommendations based on current preferences. Browse our collection to find your perfect ride.';
    }

    const topPick = recommendations[0];
    const brandDiversity = new Set(recommendations.map(r => r.vehicle.makeName)).size;
    const priceRange = {
      min: Math.min(...recommendations.map(r => r.vehicle.priceRange.min)),
      max: Math.max(...recommendations.map(r => r.vehicle.priceRange.max))
    };

    return `Top recommendation: ${topPick.vehicle.name} - ${topPick.reasons.join(', ')}. ` +
           `Showing ${recommendations.length} options from ${brandDiversity} brands ` +
           `in the price range of ₹${priceRange.min.toLocaleString()} - ₹${priceRange.max.toLocaleString()}.`;
  }

  async findSimilarVehicles(vehicleId: string, limit: number = 5): Promise<Vehicle[]> {
    const aiContext = await this.buildContext();
    const targetVehicle = aiContext.vehicles.find(v => v.id === vehicleId);

    if (!targetVehicle) return [];

    const similar = this.findSimilarVehiclesInternal(targetVehicle, aiContext.vehicles, limit + 1);
    return similar
      .filter(s => s.vehicleId !== vehicleId)
      .slice(0, limit)
      .map(s => aiContext.vehicles.find(v => v.id === s.vehicleId)!)
      .filter(Boolean);
  }

  private findSimilarVehiclesInternal(
    target: Vehicle,
    vehicles: Vehicle[],
    limit: number
  ): SimilarityScore[] {
    const scores: SimilarityScore[] = [];

    for (const vehicle of vehicles) {
      if (vehicle.id === target.id) continue;

      let score = 0;
      const reasons: string[] = [];

      if (vehicle.makeName === target.makeName) {
        score += 10;
        reasons.push('Same brand');
      }

      if (vehicle.fuelType === target.fuelType) {
        score += 8;
        reasons.push(`Same fuel type: ${vehicle.fuelType}`);
      }

      if (vehicle.bodyStyle === target.bodyStyle) {
        score += 7;
        reasons.push(`Same body style: ${vehicle.bodyStyle}`);
      }

      const targetPrice = (target.priceRange.min + target.priceRange.max) / 2;
      const vehiclePrice = (vehicle.priceRange.min + vehicle.priceRange.max) / 2;
      const priceDiff = Math.abs(targetPrice - vehiclePrice);
      if (priceDiff < 20000) {
        score += 10;
        reasons.push('Similar price point');
      } else if (priceDiff < 50000) {
        score += 5;
        reasons.push('Comparable price range');
      }

      const commonTags = vehicle.tags.filter(t => target.tags.includes(t));
      if (commonTags.length > 0) {
        score += commonTags.length * 2;
        reasons.push(`${commonTags.length} shared features`);
      }

      const targetDisplacement = this.extractDisplacement(target);
      const vehicleDisplacement = this.extractDisplacement(vehicle);
      if (targetDisplacement && vehicleDisplacement) {
        const dispDiff = Math.abs(targetDisplacement - vehicleDisplacement);
        if (dispDiff <= 50) {
          score += 6;
          reasons.push('Similar engine capacity');
        }
      }

      scores.push({ vehicleId: vehicle.id, score, reasons });
    }

    return scores.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  private extractDisplacement(vehicle: Vehicle): number | null {
    const displacement = vehicle.variants[0]?.specs['Displacement'];
    if (!displacement) return null;

    const match = displacement.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  async compareVehicles(vehicleIds: string[]): Promise<{
    comparison: Array<{
      attribute: string;
      values: Record<string, string | number>;
      winner?: string;
    }>;
    summary: string;
  }> {
    const aiContext = await this.buildContext();
    const vehicles = vehicleIds
      .map(id => aiContext.vehicles.find(v => v.id === id))
      .filter(Boolean) as Vehicle[];

    if (vehicles.length < 2) {
      return { comparison: [], summary: 'Need at least 2 vehicles to compare' };
    }

    const comparison = [
      {
        attribute: 'Price',
        values: Object.fromEntries(vehicles.map(v => [
          v.id,
          `₹${((v.priceRange.min + v.priceRange.max) / 2).toLocaleString()}`
        ])),
        winner: vehicles.reduce((min, v) =>
          v.priceRange.min < min.priceRange.min ? v : min
        ).id
      },
      {
        attribute: 'Rating',
        values: Object.fromEntries(vehicles.map(v => [v.id, v.overallRating])),
        winner: vehicles.reduce((max, v) =>
          v.overallRating > max.overallRating ? v : max
        ).id
      },
      {
        attribute: 'Fuel Type',
        values: Object.fromEntries(vehicles.map(v => [v.id, v.fuelType]))
      },
      {
        attribute: 'Reviews',
        values: Object.fromEntries(vehicles.map(v => [v.id, v.totalReviews]))
      }
    ];

    const summary = this.generateComparisonSummary(vehicles);

    return { comparison, summary };
  }

  private generateComparisonSummary(vehicles: Vehicle[]): string {
    const brands = [...new Set(vehicles.map(v => v.makeName))];
    const avgPrice = vehicles.reduce((sum, v) =>
      sum + (v.priceRange.min + v.priceRange.max) / 2, 0
    ) / vehicles.length;

    const bestRated = vehicles.reduce((max, v) =>
      v.overallRating > max.overallRating ? v : max
    );

    return `Comparing ${vehicles.length} vehicles from ${brands.join(', ')}. ` +
           `Average price: ₹${Math.round(avgPrice).toLocaleString()}. ` +
           `Best rated: ${bestRated.name} (${bestRated.overallRating}/5).`;
  }

  getContextStats(): {
    totalVehicles: number;
    totalBrands: number;
    lastUpdated: number;
    isFresh: boolean;
  } | null {
    if (!this.context) return null;

    return {
      totalVehicles: this.context.vehicles.length,
      totalBrands: this.context.availableBrands.length,
      lastUpdated: this.lastUpdated,
      isFresh: Date.now() - this.lastUpdated < this.CACHE_TTL
    };
  }

  invalidateCache(): void {
    this.context = null;
    this.lastUpdated = 0;
  }
}

export const vehicleAIContext = new VehicleAIContextPipeline();
export { VehicleAIContextPipeline };

import { vehicleDataLoader } from '@core/data/vehicleDataLoader';
import { vehicleZoneEngine } from '@core/navigation/vehicleZoneEngine';
import type {
  Vehicle,
  VehicleAnalyticsEvent,
  VehicleAnalyticsMetrics,
  FuelType
} from '@core/types/vehicles';
import type { AnalyticsEventBus } from '@analytics/collectors/AnalyticsEventBus';

interface VehicleViewSession {
  vehicleId: string;
  startTime: number;
  variantsViewed: number[];
  colorsViewed: number[];
  citiesChecked: number[];
}

class VehicleAnalytics {
  private eventBus: AnalyticsEventBus | null = null;
  private activeSessions: Map<string, VehicleViewSession> = new Map();
  private eventHistory: VehicleAnalyticsEvent[] = [];
  private maxHistorySize = 10000;

  initialize(eventBus: AnalyticsEventBus): void {
    this.eventBus = eventBus;
  }

  trackVehicleView(vehicleId: string, sessionId: string): void {
    const session: VehicleViewSession = {
      vehicleId,
      startTime: Date.now(),
      variantsViewed: [],
      colorsViewed: [],
      citiesChecked: []
    };
    this.activeSessions.set(sessionId, session);

    const event: VehicleAnalyticsEvent = {
      type: 'vehicle_view',
      vehicleId,
      timestamp: Date.now(),
      sessionId
    };

    this.recordEvent(event);
  }

  trackVariantSelect(vehicleId: string, variantId: number, sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.variantsViewed.push(variantId);
    }

    const event: VehicleAnalyticsEvent = {
      type: 'variant_select',
      vehicleId,
      variantId,
      timestamp: Date.now(),
      sessionId
    };

    this.recordEvent(event);
  }

  trackColorChange(vehicleId: string, colorId: number, sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.colorsViewed.push(colorId);
    }

    const event: VehicleAnalyticsEvent = {
      type: 'color_change',
      vehicleId,
      colorId,
      timestamp: Date.now(),
      sessionId
    };

    this.recordEvent(event);
  }

  trackPriceCheck(vehicleId: string, cityId: number, sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.citiesChecked.push(cityId);
    }

    const event: VehicleAnalyticsEvent = {
      type: 'price_check',
      vehicleId,
      cityId,
      timestamp: Date.now(),
      sessionId
    };

    this.recordEvent(event);
  }

  trackVehicleCompare(vehicleIds: string[], sessionId: string): void {
    const event: VehicleAnalyticsEvent = {
      type: 'vehicle_compare',
      vehicleId: vehicleIds.join(','),
      timestamp: Date.now(),
      sessionId
    };

    this.recordEvent(event);
  }

  trackSpecExpand(vehicleId: string, specCategory: string, sessionId: string): void {
    const event: VehicleAnalyticsEvent = {
      type: 'spec_expand',
      vehicleId,
      timestamp: Date.now(),
      sessionId,
      metadata: { category: specCategory }
    };

    this.recordEvent(event);
  }

  endVehicleView(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      const dwellTime = Date.now() - session.startTime;

      const event: VehicleAnalyticsEvent = {
        type: 'vehicle_view',
        vehicleId: session.vehicleId,
        timestamp: Date.now(),
        sessionId,
        dwellTime,
        metadata: {
          variantsViewed: session.variantsViewed.length,
          colorsViewed: session.colorsViewed.length,
          citiesChecked: session.citiesChecked.length
        }
      };

      this.recordEvent(event);
      this.activeSessions.delete(sessionId);
    }
  }

  private recordEvent(event: VehicleAnalyticsEvent): void {
    this.eventHistory.push(event);

    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize / 2);
    }

    this.eventBus?.emit('event-collected', event as any);
  }

  async generateMetrics(): Promise<VehicleAnalyticsMetrics> {
    await vehicleDataLoader.load();

    const viewEvents = this.eventHistory.filter(e => e.type === 'vehicle_view');
    const vehicleViewCounts = new Map<string, number>();

    for (const event of viewEvents) {
      const count = vehicleViewCounts.get(event.vehicleId) || 0;
      vehicleViewCounts.set(event.vehicleId, count + 1);
    }

    const mostViewedVehicles = Array.from(vehicleViewCounts.entries())
      .map(([vehicleId, count]) => ({ vehicleId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const zoneHeatmap: Record<string, number> = {};
    for (const [vehicleId, count] of vehicleViewCounts) {
      const vehicle = vehicleDataLoader.getVehicleById(vehicleId);
      if (vehicle) {
        zoneHeatmap[vehicle.zoneId] = (zoneHeatmap[vehicle.zoneId] || 0) + count;
      }
    }

    const priceInterestBands: Record<string, number> = {
      'budget': 0,
      'mid': 0,
      'premium': 0,
      'luxury': 0
    };

    for (const [vehicleId, count] of vehicleViewCounts) {
      const vehicle = vehicleDataLoader.getVehicleById(vehicleId);
      if (vehicle) {
        const avgPrice = (vehicle.priceRange.min + vehicle.priceRange.max) / 2;
        if (avgPrice < 80000) priceInterestBands.budget += count;
        else if (avgPrice < 150000) priceInterestBands.mid += count;
        else if (avgPrice < 300000) priceInterestBands.premium += count;
        else priceInterestBands.luxury += count;
      }
    }

    const fuelPreferenceTrends: Record<FuelType, number> = {
      'Petrol': 0,
      'Electric': 0,
      'CNG': 0,
      'Hybrid': 0
    };

    for (const [vehicleId, count] of vehicleViewCounts) {
      const vehicle = vehicleDataLoader.getVehicleById(vehicleId);
      if (vehicle) {
        fuelPreferenceTrends[vehicle.fuelType] += count;
      }
    }

    const brandInterestDistribution: Record<string, number> = {};
    for (const [vehicleId, count] of vehicleViewCounts) {
      const vehicle = vehicleDataLoader.getVehicleById(vehicleId);
      if (vehicle) {
        brandInterestDistribution[vehicle.makeName] =
          (brandInterestDistribution[vehicle.makeName] || 0) + count;
      }
    }

    const tagCounts = new Map<string, number>();
    for (const [vehicleId, count] of vehicleViewCounts) {
      const vehicle = vehicleDataLoader.getVehicleById(vehicleId);
      if (vehicle) {
        for (const tag of vehicle.tags) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + count);
        }
      }
    }

    const featureInterestTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    const sessions = new Set(viewEvents.map(e => e.sessionId));
    const totalDwellTime = viewEvents
      .filter(e => e.dwellTime)
      .reduce((sum, e) => sum + (e.dwellTime || 0), 0);

    const compareEvents = this.eventHistory.filter(e => e.type === 'vehicle_compare').length;
    const detailEvents = this.eventHistory.filter(e =>
      e.type === 'variant_select' || e.type === 'color_change'
    ).length;

    return {
      mostViewedVehicles,
      zoneHeatmap,
      priceInterestBands,
      fuelPreferenceTrends,
      brandInterestDistribution,
      featureInterestTags,
      averageSessionDuration: sessions.size > 0 ? totalDwellTime / sessions.size : 0,
      conversionFunnel: {
        view: viewEvents.length,
        compare: compareEvents,
        detail: detailEvents,
        intent: this.eventHistory.filter(e => e.type === 'price_check').length
      }
    };
  }

  getPopularVehicles(limit: number = 10): Array<{ vehicle: Vehicle; viewCount: number }> {
    const viewCounts = new Map<string, number>();

    for (const event of this.eventHistory) {
      if (event.type === 'vehicle_view') {
        viewCounts.set(event.vehicleId, (viewCounts.get(event.vehicleId) || 0) + 1);
      }
    }

    return Array.from(viewCounts.entries())
      .map(([vehicleId, viewCount]) => ({
        vehicle: vehicleDataLoader.getVehicleById(vehicleId)!,
        viewCount
      }))
      .filter(item => item.vehicle)
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, limit);
  }

  getTrendingTags(): Array<{ tag: string; growth: number }> {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const twoHoursAgo = now - 2 * 60 * 60 * 1000;

    const recentCounts = new Map<string, number>();
    const olderCounts = new Map<string, number>();

    for (const event of this.eventHistory) {
      if (event.type !== 'vehicle_view') continue;

      const vehicle = vehicleDataLoader.getVehicleById(event.vehicleId);
      if (!vehicle) continue;

      if (event.timestamp > oneHourAgo) {
        for (const tag of vehicle.tags) {
          recentCounts.set(tag, (recentCounts.get(tag) || 0) + 1);
        }
      } else if (event.timestamp > twoHoursAgo) {
        for (const tag of vehicle.tags) {
          olderCounts.set(tag, (olderCounts.get(tag) || 0) + 1);
        }
      }
    }

    const trending: Array<{ tag: string; growth: number }> = [];
    for (const [tag, recentCount] of recentCounts) {
      const olderCount = olderCounts.get(tag) || 1;
      const growth = ((recentCount - olderCount) / olderCount) * 100;
      trending.push({ tag, growth });
    }

    return trending.sort((a, b) => b.growth - a.growth).slice(0, 10);
  }

  exportEvents(): VehicleAnalyticsEvent[] {
    return [...this.eventHistory];
  }

  clearHistory(): void {
    this.eventHistory = [];
    this.activeSessions.clear();
  }
}

export const vehicleAnalytics = new VehicleAnalytics();
export { VehicleAnalytics };

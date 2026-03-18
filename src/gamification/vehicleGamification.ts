import { vehicleDataLoader } from '@core/data/vehicleDataLoader';
import { vehicleZoneEngine } from '@core/navigation/vehicleZoneEngine';
import type {
  Vehicle,
  VehicleMission,
  VehicleDiscoveryChallenge,
  VehicleMissionType,
  FuelType
} from '@core/types/vehicles';

interface PlayerProgress {
  missionsCompleted: string[];
  challengesCompleted: string[];
  vehiclesDiscovered: string[];
  zonesExplored: string[];
  totalXp: number;
  badges: string[];
}

class VehicleGamificationEngine {
  private missions: Map<string, VehicleMission> = new Map();
  private challenges: Map<string, VehicleDiscoveryChallenge> = new Map();
  private playerProgress: PlayerProgress = {
    missionsCompleted: [],
    challengesCompleted: [],
    vehiclesDiscovered: [],
    zonesExplored: [],
    totalXp: 0,
    badges: []
  };

  async initialize(): Promise<void> {
    await vehicleDataLoader.load();
    this.generateDailyMissions();
    this.generateDiscoveryChallenges();
  }

  private generateDailyMissions(): void {
    const missionTemplates: Array<{
      type: VehicleMissionType;
      title: string;
      description: string;
      difficulty: 'easy' | 'medium' | 'hard';
      xp: number;
    }> = [
      {
        type: 'explore_zone',
        title: 'Zone Explorer',
        description: 'Visit 3 different vehicle zones',
        difficulty: 'easy',
        xp: 100
      },
      {
        type: 'find_vehicle',
        title: 'Vehicle Hunter',
        description: 'View details of 5 different vehicles',
        difficulty: 'easy',
        xp: 150
      },
      {
        type: 'compare_vehicles',
        title: 'Comparison Shopper',
        description: 'Compare 2 or more vehicles',
        difficulty: 'medium',
        xp: 200
      },
      {
        type: 'discover_feature',
        title: 'Feature Finder',
        description: 'Find a vehicle with ABS braking',
        difficulty: 'easy',
        xp: 100
      },
      {
        type: 'variant_explore',
        title: 'Variant Viewer',
        description: 'Explore different variants of 3 vehicles',
        difficulty: 'medium',
        xp: 250
      },
      {
        type: 'brand_exploration',
        title: 'Brand Explorer',
        description: 'View vehicles from 3 different brands',
        difficulty: 'easy',
        xp: 150
      }
    ];

    for (let i = 0; i < 3; i++) {
      const template = missionTemplates[Math.floor(Math.random() * missionTemplates.length)];
      const mission: VehicleMission = {
        id: `mission-${Date.now()}-${i}`,
        type: template.type,
        title: template.title,
        description: template.description,
        difficulty: template.difficulty,
        requirements: [{ type: template.type, target: this.getTargetForType(template.type), current: 0 }],
        rewards: { xp: template.xp, points: template.xp / 10 },
        completed: false,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
      };

      this.missions.set(mission.id, mission);
    }
  }

  private generateDiscoveryChallenges(): void {
    const vehicles = vehicleDataLoader.getAllVehicles();

    const evVehicles = vehicles.filter(v => v.fuelType === 'Electric');
    if (evVehicles.length > 0) {
      const highestRangeEV = evVehicles.reduce((max, v) => {
        const range = this.extractRange(v);
        return range > this.extractRange(max) ? v : max;
      });

      this.challenges.set('highest-range-ev', {
        id: 'highest-range-ev',
        name: 'Range Champion',
        description: 'Find the electric vehicle with the longest range',
        criteria: { type: 'highest_range', fuelType: 'Electric' },
        targetVehicleId: highestRangeEV.id,
        reward: {
          xp: 500,
          badgeName: 'EV Expert',
          badgeIcon: 'zap'
        },
        completed: false
      });
    }

    const scooters = vehicles.filter(v => v.vehicleType === 'Scooter');
    if (scooters.length > 0) {
      const cheapestScooter = scooters.reduce((min, v) =>
        v.priceRange.min < min.priceRange.min ? v : min
      );

      this.challenges.set('cheapest-scooter', {
        id: 'cheapest-scooter',
        name: 'Budget Scooter Hunter',
        description: 'Find the most affordable scooter',
        criteria: { type: 'lowest_price', bodyStyle: 'Scooter' },
        targetVehicleId: cheapestScooter.id,
        reward: {
          xp: 300,
          badgeName: 'Smart Shopper',
          badgeIcon: 'search'
        },
        completed: false
      });
    }

    const premiumBikes = vehicles.filter(v =>
      (v.priceRange.min + v.priceRange.max) / 2 >= 150000
    );
    if (premiumBikes.length > 0) {
      const mostPowerful = premiumBikes.reduce((max, v) => {
        const power = this.extractPower(v);
        return power > this.extractPower(max) ? v : max;
      });

      this.challenges.set('most-powerful-premium', {
        id: 'most-powerful-premium',
        name: 'Power Seeker',
        description: 'Find the most powerful premium bike',
        criteria: { type: 'most_powerful' },
        targetVehicleId: mostPowerful.id,
        reward: {
          xp: 400,
          badgeName: 'Speed Demon',
          badgeIcon: 'flame'
        },
        completed: false
      });
    }

    const newestVehicle = vehicles.reduce((newest, v) =>
      new Date(v.launchedOn) > new Date(newest.launchedOn) ? v : newest
    );

    this.challenges.set('newest-arrival', {
      id: 'newest-arrival',
      name: 'Early Adopter',
      description: 'Discover our newest vehicle arrival',
      criteria: { type: 'newest' },
      targetVehicleId: newestVehicle.id,
      reward: {
        xp: 200,
        badgeName: 'Trendsetter',
        badgeIcon: 'star'
      },
      completed: false
    });
  }

  private getTargetForType(type: VehicleMissionType): number {
    switch (type) {
      case 'explore_zone': return 3;
      case 'find_vehicle': return 5;
      case 'compare_vehicles': return 1;
      case 'discover_feature': return 1;
      case 'variant_explore': return 3;
      case 'brand_exploration': return 3;
      default: return 1;
    }
  }

  private extractRange(vehicle: Vehicle): number {
    const range = vehicle.variants[0]?.specs['Riding Range'];
    return range ? parseInt(range.replace(/\D/g, '')) : 0;
  }

  private extractPower(vehicle: Vehicle): number {
    const power = vehicle.variants[0]?.specs['Max Power(bhp)'];
    return power ? parseFloat(power.replace(/[^\d.]/g, '')) : 0;
  }

  getActiveMissions(): VehicleMission[] {
    return Array.from(this.missions.values())
      .filter(m => !m.completed && (!m.expiresAt || m.expiresAt > Date.now()));
  }

  getActiveChallenges(): VehicleDiscoveryChallenge[] {
    return Array.from(this.challenges.values()).filter(c => !c.completed);
  }

  async checkMissionProgress(eventType: VehicleMissionType, data: {
    zoneId?: string;
    vehicleId?: string;
    feature?: string;
  }): Promise<VehicleMission[]> {
    const completedMissions: VehicleMission[] = [];

    for (const mission of this.missions.values()) {
      if (mission.completed || mission.type !== eventType) continue;

      let progressed = false;

      switch (eventType) {
        case 'explore_zone':
          if (data.zoneId && !this.playerProgress.zonesExplored.includes(data.zoneId)) {
            this.playerProgress.zonesExplored.push(data.zoneId);
            progressed = true;
          }
          break;

        case 'find_vehicle':
          if (data.vehicleId && !this.playerProgress.vehiclesDiscovered.includes(data.vehicleId)) {
            this.playerProgress.vehiclesDiscovered.push(data.vehicleId);
            progressed = true;
          }
          break;

        case 'discover_feature':
          if (data.feature && data.vehicleId) {
            progressed = true;
          }
          break;
      }

      if (progressed) {
        for (const req of mission.requirements) {
          req.current = Math.min(req.current + 1, req.target);
        }

        const allComplete = mission.requirements.every(req => req.current >= req.target);
        if (allComplete) {
          mission.completed = true;
          mission.completed = true;
          this.playerProgress.missionsCompleted.push(mission.id);
          this.playerProgress.totalXp += mission.rewards.xp;
          completedMissions.push(mission);
        }
      }
    }

    return completedMissions;
  }

  async checkChallengeCompletion(vehicleId: string): Promise<VehicleDiscoveryChallenge[]> {
    const completedChallenges: VehicleDiscoveryChallenge[] = [];

    for (const challenge of this.challenges.values()) {
      if (challenge.completed) continue;

      if (challenge.targetVehicleId === vehicleId) {
        challenge.completed = true;
        challenge.completedAt = Date.now();
        this.playerProgress.challengesCompleted.push(challenge.id);
        this.playerProgress.totalXp += challenge.reward.xp;
        this.playerProgress.badges.push(challenge.reward.badgeName);
        completedChallenges.push(challenge);
      }
    }

    return completedChallenges;
  }

  getPlayerProgress(): PlayerProgress {
    return { ...this.playerProgress };
  }

  getProgressForMission(missionId: string): number {
    const mission = this.missions.get(missionId);
    if (!mission) return 0;

    const totalTarget = mission.requirements.reduce((sum, r) => sum + r.target, 0);
    const totalCurrent = mission.requirements.reduce((sum, r) => sum + r.current, 0);

    return Math.min((totalCurrent / totalTarget) * 100, 100);
  }

  getNextBadge(): { name: string; description: string; progress: number } | null {
    const badges = [
      { name: 'Novice Explorer', description: 'Complete 1 mission', requiredMissions: 1 },
      { name: 'Zone Master', description: 'Explore all zones', requiredZones: 7 },
      { name: 'Vehicle Expert', description: 'Discover 20 vehicles', requiredVehicles: 20 },
      { name: 'Challenge Hunter', description: 'Complete 3 challenges', requiredChallenges: 3 }
    ];

    for (const badge of badges) {
      if (this.playerProgress.badges.includes(badge.name)) continue;

      let progress = 0;
      if (badge.requiredMissions) {
        progress = (this.playerProgress.missionsCompleted.length / badge.requiredMissions) * 100;
      } else if (badge.requiredZones) {
        progress = (this.playerProgress.zonesExplored.length / badge.requiredZones) * 100;
      } else if (badge.requiredVehicles) {
        progress = (this.playerProgress.vehiclesDiscovered.length / badge.requiredVehicles) * 100;
      } else if (badge.requiredChallenges) {
        progress = (this.playerProgress.challengesCompleted.length / badge.requiredChallenges) * 100;
      }

      return { name: badge.name, description: badge.description, progress: Math.min(progress, 100) };
    }

    return null;
  }

  generateHint(challengeId: string): string | null {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) return null;

    const vehicle = vehicleDataLoader.getVehicleById(challenge.targetVehicleId);
    if (!vehicle) return null;

    const hints = [
      `Look for a ${vehicle.makeName} vehicle`,
      `Check the ${vehicle.zoneId.replace('-', ' ')}`,
      `This vehicle costs around ₹${Math.round((vehicle.priceRange.min + vehicle.priceRange.max) / 2).toLocaleString()}`,
      `It's a ${vehicle.bodyStyle.toLowerCase()} style bike`
    ];

    return hints[Math.floor(Math.random() * hints.length)];
  }

  resetProgress(): void {
    this.playerProgress = {
      missionsCompleted: [],
      challengesCompleted: [],
      vehiclesDiscovered: [],
      zonesExplored: [],
      totalXp: 0,
      badges: []
    };
    this.missions.clear();
    this.challenges.clear();
  }
}

export const vehicleGamification = new VehicleGamificationEngine();
export { VehicleGamificationEngine };
export type { PlayerProgress };

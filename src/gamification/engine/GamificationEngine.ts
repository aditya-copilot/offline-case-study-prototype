import { EventEmitter } from '@core/utils/events';
import type {
  PlayerProfile,
  Mission,
  Reward,
  LiveEvent,
  XpGain,
  GamificationEvent,
  MissionType,
  ShopperPersona
} from '../types';
import { ProgressionEngine } from '../progression/ProgressionEngine';
import { MissionGenerator } from '../missions/MissionGenerator';
import { RewardManager } from '../rewards/RewardManager';
import { PsychologyEngine } from '../psychology/PsychologyEngine';
import { GamificationRepository } from './GamificationRepository';

interface GamificationEngineEvents {
  'xp-gained': XpGain;
  'level-up': { level: number; rewards: Reward[] };
  'mission-completed': Mission;
  'reward-claimed': Reward;
  'badge-unlocked': { badgeId: string; name: string };
  'streak-updated': { days: number; bonus: number };
  'persona-changed': ShopperPersona;
  'engagement-update': { score: number; energy: number };
}

export class GamificationEngine extends EventEmitter<GamificationEngineEvents> {
  private static instance: GamificationEngine;
  private repo: GamificationRepository;
  private progression: ProgressionEngine;
  private missionGen: MissionGenerator;
  private rewardManager: RewardManager;
  private psychology: PsychologyEngine;
  
  private player: PlayerProfile | null = null;
  private missions: Mission[] = [];
  private activeEvents: LiveEvent[] = [];
  private initialized = false;

  static getInstance(): GamificationEngine {
    if (!GamificationEngine.instance) {
      GamificationEngine.instance = new GamificationEngine();
    }
    return GamificationEngine.instance;
  }

  private constructor() {
    super();
    this.repo = new GamificationRepository();
    this.progression = new ProgressionEngine();
    this.missionGen = new MissionGenerator();
    this.rewardManager = new RewardManager();
    this.psychology = new PsychologyEngine();
  }

  async initialize(playerId: string): Promise<void> {
    if (this.initialized) return;

    await this.repo.initialize();
    
    this.player = await this.repo.loadPlayerProfile(playerId);
    if (!this.player) {
      this.player = this.createNewPlayer(playerId);
      await this.repo.savePlayerProfile(this.player);
    }

    this.missions = await this.repo.loadActiveMissions(playerId);
    if (this.missions.length === 0) {
      this.missions = this.missionGen.generateDailyMissions(this.player);
      await this.repo.saveMissions(playerId, this.missions);
    }

    this.checkStreak();
    this.startEnergyRegeneration();
    
    this.initialized = true;
    this.emit('engagement-update', {
      score: this.player.engagementScore,
      energy: this.psychology.getEnergy()
    });
  }

  private createNewPlayer(id: string): PlayerProfile {
    return {
      id,
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      totalXpEarned: 0,
      points: 0,
      persona: 'explorer',
      streakDays: 0,
      visitCount: 0,
      totalDistanceWalked: 0,
      productsFound: 0,
      listsCompleted: 0,
      missionsCompleted: 0,
      achievements: [],
      badges: [],
      unlockedThemes: ['default'],
      zoneMastery: new Map(),
      skillTree: this.progression.getInitialSkillTree(),
      shoppingEfficiency: 0,
      engagementScore: 50
    };
  }

  gainXp(amount: number, source: string, triggerDopamine = true): void {
    if (!this.player) return;

    const multiplier = this.calculateXpMultiplier();
    const finalAmount = Math.round(amount * multiplier);

    this.player.xp += finalAmount;
    this.player.totalXpEarned += finalAmount;

    const xpGain: XpGain = {
      amount: finalAmount,
      source,
      timestamp: Date.now(),
      multiplier
    };

    this.emit('xp-gained', xpGain);

    if (triggerDopamine) {
      this.psychology.triggerDopamine('progress', finalAmount / 100);
    }

    this.checkLevelUp();
    this.updateEngagement(5);
  }

  private calculateXpMultiplier(): number {
    let multiplier = 1;
    
    if (this.player) {
      const skillBoosts = this.player.skillTree
        .filter(s => s.unlocked)
        .flatMap(s => s.effects)
        .filter(e => e.type === 'xp_boost')
        .reduce((sum, e) => sum + e.value, 0);
      
      multiplier += skillBoosts;
      
      if (this.player.streakDays > 0) {
        multiplier += Math.min(this.player.streakDays * 0.05, 0.5);
      }
    }

    return multiplier;
  }

  private checkLevelUp(): void {
    if (!this.player) return;

    while (this.player.xp >= this.player.xpToNextLevel) {
      this.player.xp -= this.player.xpToNextLevel;
      this.player.level++;
      this.player.xpToNextLevel = this.progression.getXpForLevel(this.player.level);

      const rewards = this.rewardManager.getLevelUpRewards(this.player.level);
      
      this.emit('level-up', { level: this.player.level, rewards });
      this.psychology.triggerDopamine('achievement', 0.8);
    }

    this.repo.savePlayerProfile(this.player);
  }

  completeMission(missionId: string): void {
    if (!this.player) return;

    const mission = this.missions.find(m => m.id === missionId);
    if (!mission || mission.completed) return;

    mission.completed = true;
    mission.completedAt = Date.now();
    mission.progress = 100;

    this.player.missionsCompleted++;

    for (const reward of mission.rewards) {
      this.grantReward(reward);
    }

    const xpReward = mission.rewards.find(r => r.type === 'xp')?.amount ?? 50;
    this.gainXp(xpReward, `Mission: ${mission.title}`, false);

    this.emit('mission-completed', mission);
    this.psychology.triggerDopamine('achievement', 0.7);
    this.updateEngagement(10);

    this.repo.saveMissions(this.player.id, this.missions);
    this.repo.savePlayerProfile(this.player);
  }

  updateMissionProgress(missionId: string, objectiveId: string, progress: number): void {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission || mission.completed) return;

    const objective = mission.objectives.find(o => o.id === objectiveId);
    if (!objective) return;

    objective.current = Math.min(progress, objective.target);
    objective.completed = objective.current >= objective.target;

    const totalProgress = mission.objectives.reduce((sum, o) => 
      sum + (o.current / o.target), 0
    ) / mission.objectives.length;

    mission.progress = Math.round(totalProgress * 100);

    if (mission.objectives.every(o => o.completed)) {
      this.completeMission(missionId);
    } else {
      this.repo.saveMissions(this.player!.id, this.missions);
    }
  }

  private grantReward(reward: { type: string; amount?: number; badgeId?: string; themeId?: string }): void {
    if (!this.player) return;

    switch (reward.type) {
      case 'xp':
        this.gainXp(reward.amount ?? 25, 'Reward', false);
        break;
      case 'points':
        this.player.points += reward.amount ?? 10;
        break;
      case 'badge':
        if (reward.badgeId) {
          this.unlockBadge(reward.badgeId);
        }
        break;
      case 'theme':
        if (reward.themeId && !this.player.unlockedThemes.includes(reward.themeId)) {
          this.player.unlockedThemes.push(reward.themeId);
        }
        break;
    }
  }

  private unlockBadge(badgeId: string): void {
    if (!this.player) return;
    
    const existing = this.player.badges.find(b => b.id === badgeId);
    if (existing) return;

    const badge = this.rewardManager.getBadge(badgeId);
    if (badge) {
      this.player.badges.push({
        ...badge,
        unlockedAt: Date.now()
      });
      
      this.emit('badge-unlocked', { badgeId, name: badge.name });
      this.psychology.triggerDopamine('social', 0.6);
    }
  }

  private checkStreak(): void {
    if (!this.player?.lastVisitDate) return;

    const now = Date.now();
    const lastVisit = this.player.lastVisitDate;
    const dayMs = 24 * 60 * 60 * 1000;
    const daysSince = Math.floor((now - lastVisit) / dayMs);

    if (daysSince === 1) {
      this.player.streakDays++;
      const bonus = Math.min(this.player.streakDays * 10, 100);
      this.emit('streak-updated', { days: this.player.streakDays, bonus });
    } else if (daysSince > 1) {
      this.player.streakDays = 0;
    }
  }

  recordVisit(): void {
    if (!this.player) return;
    
    this.player.visitCount++;
    this.player.lastVisitDate = Date.now();
    this.checkStreak();
    this.gainXp(10, 'Daily Visit');
  }

  recordZoneVisit(zoneId: string, dwellTime: number): void {
    if (!this.player) return;

    const mastery = this.player.zoneMastery.get(zoneId) ?? 0;
    this.player.zoneMastery.set(zoneId, mastery + 1);

    const xp = Math.min(Math.floor(dwellTime / 10), 50);
    this.gainXp(xp, 'Zone Exploration');

    this.missions
      .filter(m => m.zoneId === zoneId && !m.completed)
      .forEach(m => {
        const obj = m.objectives.find(o => o.type === 'visit' || o.type === 'explore');
        if (obj) {
          this.updateMissionProgress(m.id, obj.id, obj.current + 1);
        }
      });
  }

  recordProductFound(productId: string): void {
    if (!this.player) return;
    
    this.player.productsFound++;
    this.gainXp(15, 'Product Discovery');

    this.missions
      .filter(m => m.productId === productId && !m.completed)
      .forEach(m => this.completeMission(m.id));
  }

  recordDistance(distance: number): void {
    if (!this.player) return;
    
    this.player.totalDistanceWalked += distance;
    
    const milestones = [100, 500, 1000, 5000];
    for (const milestone of milestones) {
      if (this.player.totalDistanceWalked >= milestone &&
          this.player.totalDistanceWalked - distance < milestone) {
        this.gainXp(milestone / 10, 'Distance Milestone');
      }
    }
  }

  private updateEngagement(delta: number): void {
    if (!this.player) return;
    
    this.player.engagementScore = Math.min(100, this.player.engagementScore + delta);
    this.psychology.updateEnergy(delta);
    
    this.emit('engagement-update', {
      score: this.player.engagementScore,
      energy: this.psychology.getEnergy()
    });
  }

  private startEnergyRegeneration(): void {
    setInterval(() => {
      this.psychology.regenerateEnergy(1);
      this.emit('engagement-update', {
        score: this.player?.engagementScore ?? 0,
        energy: this.psychology.getEnergy()
      });
    }, 60000);
  }

  getPlayer(): PlayerProfile | null {
    return this.player;
  }

  getMissions(): Mission[] {
    return this.missions;
  }

  getActiveMissions(): Mission[] {
    return this.missions.filter(m => !m.completed);
  }

  getEnergy(): number {
    return this.psychology.getEnergy();
  }

  getMaxEnergy(): number {
    return this.psychology.getMaxEnergy();
  }
}

export const gamificationEngine = GamificationEngine.getInstance();

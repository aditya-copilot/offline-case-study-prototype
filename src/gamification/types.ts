import type { Vector2 } from '@core/spatial/types';
import type { Achievement, Badge } from '@core/types';

export type ShopperPersona = 'explorer' | 'speedster' | 'collector' | 'socialite' | 'perfectionist';

export type MissionType = 
  | 'find_product'
  | 'explore_zone'
  | 'time_challenge'
  | 'ai_recommendation'
  | 'treasure_hunt'
  | 'efficiency'
  | 'streak'
  | 'social';

export type MissionDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type RewardType = 'xp' | 'points' | 'badge' | 'theme' | 'coupon' | 'mystery';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface PlayerProfile {
  id: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalXpEarned: number;
  points: number;
  persona: ShopperPersona;
  streakDays: number;
  lastVisitDate?: number;
  visitCount: number;
  totalDistanceWalked: number;
  productsFound: number;
  listsCompleted: number;
  missionsCompleted: number;
  achievements: Achievement[];
  badges: Badge[];
  unlockedThemes: string[];
  zoneMastery: Map<string, number>;
  skillTree: SkillNode[];
  shoppingEfficiency: number;
  engagementScore: number;
}

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  children: string[];
  cost: number;
  effects: SkillEffect[];
}

export interface SkillEffect {
  type: 'xp_boost' | 'points_boost' | 'time_bonus' | 'discount' | 'discovery';
  value: number;
  description: string;
}

export interface Mission {
  id: string;
  type: MissionType;
  title: string;
  description: string;
  difficulty: MissionDifficulty;
  objectives: MissionObjective[];
  rewards: MissionReward[];
  timeLimit?: number;
  expiresAt?: number;
  completed: boolean;
  completedAt?: number;
  progress: number;
  zoneId?: string;
  productId?: string;
  aiRecommended?: boolean;
}

export interface MissionObjective {
  id: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  type: 'visit' | 'find' | 'collect' | 'time' | 'efficiency' | 'explore';
}

export interface MissionReward {
  type: RewardType;
  amount?: number;
  badgeId?: string;
  themeId?: string;
  couponCode?: string;
  rarity?: Rarity;
}

export interface TreasureHunt {
  id: string;
  name: string;
  description: string;
  clues: TreasureClue[];
  currentClueIndex: number;
  targetProductId: string;
  reward: MissionReward;
  completed: boolean;
  expiresAt: number;
}

export interface TreasureClue {
  id: string;
  text: string;
  hint: string;
  zoneId?: string;
  revealed: boolean;
}

export interface Reward {
  id: string;
  type: RewardType;
  name: string;
  description: string;
  icon: string;
  rarity: Rarity;
  claimed: boolean;
  claimedAt?: number;
  expiresAt?: number;
  amount?: number;
  metadata?: Record<string, unknown>;
}

export interface Coupon extends Reward {
  type: 'coupon';
  code: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  minimumPurchase?: number;
  applicableCategories: string[];
  applicableProducts: string[];
}

export interface MysteryReward extends Reward {
  type: 'mystery';
  revealedReward?: Reward;
}

export interface LevelConfig {
  level: number;
  xpRequired: number;
  title: string;
  icon: string;
  rewards: MissionReward[];
  unlockedFeatures: string[];
}

export interface ProgressionState {
  currentLevel: number;
  xp: number;
  xpToNext: number;
  progress: number;
  recentXpGains: XpGain[];
  levelHistory: LevelHistoryEntry[];
}

export interface XpGain {
  amount: number;
  source: string;
  timestamp: number;
  multiplier: number;
}

export interface LevelHistoryEntry {
  level: number;
  achievedAt: number;
  xpAtLevel: number;
}

export interface ZoneMastery {
  zoneId: string;
  visits: number;
  totalDwellTime: number;
  productsDiscovered: number;
  masteryLevel: number;
  masteryProgress: number;
  unlockedPerks: string[];
}

export interface LiveEvent {
  id: string;
  type: 'flash_sale' | 'time_limited' | 'zone_activation' | 'crowd_challenge' | 'treasure_hunt';
  title: string;
  description: string;
  imageUrl?: string;
  startsAt: number;
  endsAt: number;
  active: boolean;
  rewards: MissionReward[];
  requirements?: EventRequirement[];
  participants: number;
  completed: boolean;
  zoneId?: string;
}

export interface EventRequirement {
  type: 'visit' | 'purchase' | 'explore' | 'social';
  target: number;
  current: number;
}

export interface SocialLeaderboard {
  id: string;
  name: string;
  type: 'xp' | 'points' | 'missions' | 'efficiency' | 'streak';
  entries: LeaderboardEntry[];
  playerRank?: number;
  playerEntry?: LeaderboardEntry;
  expiresAt?: number;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  avatar?: string;
  score: number;
  isPlayer: boolean;
  trend: 'up' | 'down' | 'stable';
}

export interface GhostPath {
  playerId: string;
  playerName: string;
  path: Vector2[];
  duration: number;
  efficiency: number;
  recordedAt: number;
}

export interface CommunityChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  participants: number;
  endsAt: number;
  rewards: MissionReward[];
  completed: boolean;
}

export interface DopamineTrigger {
  type: 'achievement' | 'reward' | 'progress' | 'social' | 'surprise';
  intensity: number;
  delay: number;
  duration: number;
}

export interface FeedbackLoop {
  action: string;
  reward: Reward;
  timing: 'immediate' | 'short' | 'variable';
  nextAction?: string;
}

export interface EngagementState {
  score: number;
  energy: number;
  maxEnergy: number;
  lastActivity: number;
  sessionStart: number;
  activities: ActivityEntry[];
  trend: 'rising' | 'falling' | 'stable';
}

export interface ActivityEntry {
  type: string;
  timestamp: number;
  engagementValue: number;
}

export interface GamificationEvent {
  type: 'xp_gain' | 'level_up' | 'mission_complete' | 'reward_claimed' | 'badge_unlocked' | 'streak_update' | 'achievement_unlocked';
  timestamp: number;
  data: unknown;
}

export interface GamificationConfig {
  xpMultiplier: number;
  pointsMultiplier: number;
  energyRegenRate: number;
  streakGraceHours: number;
  missionRefreshInterval: number;
  enableSocial: boolean;
  enableLiveEvents: boolean;
}

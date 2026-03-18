import type { StateCreator } from 'zustand';
import type { UserProfile, UserPreferences, UserGamification } from '@core/types';
import { DEFAULT_USER_PREFERENCES, GAMIFICATION_CONSTANTS } from '@core/constants';
import { generateId } from '@core/utils';
import { userRepo } from '@services/db';

export interface UserSlice {
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  initializeUser: () => Promise<void>;
  createAnonymousUser: () => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  addXP: (amount: number) => Promise<void>;
  checkLevelUp: () => Promise<boolean>;
  recordProductFound: () => Promise<void>;
  recordListCompleted: () => Promise<void>;
  recordDistanceWalked: (meters: number) => Promise<void>;
  updateStreak: () => Promise<void>;
  unlockAchievement: (achievementId: string) => Promise<void>;
  addBadge: (badgeId: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  signOut: () => Promise<void>;
}

const calculateXPForLevel = (level: number): number => {
  return Math.floor(
    GAMIFICATION_CONSTANTS.LEVEL_BASE_XP *
      Math.pow(GAMIFICATION_CONSTANTS.LEVEL_MULTIPLIER, level - 1)
  );
};

const createDefaultGamification = (): UserGamification => ({
  level: 1,
  xp: 0,
  xpToNextLevel: calculateXPForLevel(1),
  totalDistanceWalked: 0,
  productsFound: 0,
  listsCompleted: 0,
  achievements: [],
  badges: [],
  streakDays: 0
});

const createAnonymousProfile = (): UserProfile => ({
  id: generateId(),
  anonymous: true,
  displayName: 'Guest Shopper',
  preferences: DEFAULT_USER_PREFERENCES,
  gamification: createDefaultGamification(),
  createdAt: Date.now(),
  lastActiveAt: Date.now()
});

export const createUserSlice: StateCreator<UserSlice> = (set, get) => ({
  profile: null,
  isLoading: false,
  isAuthenticated: false,

  initializeUser: async () => {
    set({ isLoading: true });

    try {
      const existing = await userRepo.getProfile();

      if (existing) {
        set({
          profile: existing,
          isAuthenticated: !existing.anonymous,
          isLoading: false
        });
      } else {
        await get().createAnonymousUser();
      }
    } catch {
      set({ isLoading: false });
    }
  },

  createAnonymousUser: async () => {
    const profile = createAnonymousProfile();

    await userRepo.saveProfile(profile);

    set({
      profile,
      isAuthenticated: false,
      isLoading: false
    });
  },

  updatePreferences: async (preferences) => {
    const { profile } = get();
    if (!profile) return;

    const updated = {
      ...profile,
      preferences: {
        ...profile.preferences,
        ...preferences
      },
      lastActiveAt: Date.now()
    };

    await userRepo.saveProfile(updated);
    set({ profile: updated });
  },

  addXP: async (amount) => {
    const { profile } = get();
    if (!profile) return;

    const gamification = profile.gamification;
    let newXP = gamification.xp + amount;
    let newLevel = gamification.level;
    let xpToNext = gamification.xpToNextLevel;

    while (newXP >= xpToNext) {
      newXP -= xpToNext;
      newLevel++;
      xpToNext = calculateXPForLevel(newLevel);
    }

    const updated = {
      ...profile,
      gamification: {
        ...gamification,
        level: newLevel,
        xp: newXP,
        xpToNextLevel: xpToNext
      },
      lastActiveAt: Date.now()
    };

    await userRepo.saveProfile(updated);
    set({ profile: updated });
  },

  checkLevelUp: async () => {
    const { profile } = get();
    if (!profile) return false;

    return profile.gamification.xp >= profile.gamification.xpToNextLevel;
  },

  recordProductFound: async () => {
    const { profile, addXP } = get();
    if (!profile) return;

    const updated = {
      ...profile,
      gamification: {
        ...profile.gamification,
        productsFound: profile.gamification.productsFound + 1
      },
      lastActiveAt: Date.now()
    };

    await userRepo.saveProfile(updated);
    set({ profile: updated });

    await addXP(GAMIFICATION_CONSTANTS.XP_PER_PRODUCT_FOUND);
  },

  recordListCompleted: async () => {
    const { profile, addXP } = get();
    if (!profile) return;

    const updated = {
      ...profile,
      gamification: {
        ...profile.gamification,
        listsCompleted: profile.gamification.listsCompleted + 1
      },
      lastActiveAt: Date.now()
    };

    await userRepo.saveProfile(updated);
    set({ profile: updated });

    await addXP(GAMIFICATION_CONSTANTS.XP_PER_LIST_COMPLETED);
  },

  recordDistanceWalked: async (meters) => {
    const { profile, addXP } = get();
    if (!profile) return;

    const updated = {
      ...profile,
      gamification: {
        ...profile.gamification,
        totalDistanceWalked:
          profile.gamification.totalDistanceWalked + meters
      },
      lastActiveAt: Date.now()
    };

    await userRepo.saveProfile(updated);
    set({ profile: updated });

    const xpEarned = Math.floor(meters * GAMIFICATION_CONSTANTS.XP_PER_METER_WALKED);
    if (xpEarned > 0) {
      await addXP(xpEarned);
    }
  },

  updateStreak: async () => {
    const { profile } = get();
    if (!profile) return;

    const today = new Date().setHours(0, 0, 0, 0);
    const lastVisit = profile.gamification.lastVisitDate;

    if (!lastVisit) {
      const updated = {
        ...profile,
        gamification: {
          ...profile.gamification,
          streakDays: 1,
          lastVisitDate: today
        },
        lastActiveAt: Date.now()
      };

      await userRepo.saveProfile(updated);
      set({ profile: updated });
      return;
    }

    const lastVisitDay = new Date(lastVisit).setHours(0, 0, 0, 0);
    const dayDiff = (today - lastVisitDay) / (1000 * 60 * 60 * 24);

    if (dayDiff === 1) {
      const updated = {
        ...profile,
        gamification: {
          ...profile.gamification,
          streakDays: Math.min(
            profile.gamification.streakDays + 1,
            GAMIFICATION_CONSTANTS.MAX_STREAK_DAYS
          ),
          lastVisitDate: today
        },
        lastActiveAt: Date.now()
      };

      await userRepo.saveProfile(updated);
      set({ profile: updated });
    } else if (dayDiff > 1) {
      const updated = {
        ...profile,
        gamification: {
          ...profile.gamification,
          streakDays: 1,
          lastVisitDate: today
        },
        lastActiveAt: Date.now()
      };

      await userRepo.saveProfile(updated);
      set({ profile: updated });
    }
  },

  unlockAchievement: async (achievementId) => {
    const { profile, addXP } = get();
    if (!profile) return;

    const achievement = profile.gamification.achievements.find(
      (a) => a.id === achievementId
    );

    if (!achievement || achievement.unlockedAt) return;

    const updatedAchievements = profile.gamification.achievements.map((a) =>
      a.id === achievementId
        ? { ...a, unlockedAt: Date.now(), progress: a.maxProgress }
        : a
    );

    const updated = {
      ...profile,
      gamification: {
        ...profile.gamification,
        achievements: updatedAchievements
      },
      lastActiveAt: Date.now()
    };

    await userRepo.saveProfile(updated);
    set({ profile: updated });

    await addXP(achievement.reward);
  },

  addBadge: async (badgeId) => {
    const { profile } = get();
    if (!profile) return;

    const hasBadge = profile.gamification.badges.some((b) => b.id === badgeId);
    if (hasBadge) return;

    const updated = {
      ...profile,
      gamification: {
        ...profile.gamification,
        badges: [
          ...profile.gamification.badges,
          {
            id: badgeId,
            name: 'New Badge',
            description: 'Badge description',
            icon: 'award',
            rarity: 'common',
            unlockedAt: Date.now()
          }
        ]
      },
      lastActiveAt: Date.now()
    };

    await userRepo.saveProfile(updated);
    set({ profile: updated });
  },

  updateProfile: async (updates) => {
    const { profile } = get();
    if (!profile) return;

    const updated = {
      ...profile,
      ...updates,
      lastActiveAt: Date.now()
    };

    await userRepo.saveProfile(updated);
    set({ profile: updated });
  },

  signOut: async () => {
    set({
      profile: null,
      isAuthenticated: false
    });
  }
});

import { motion } from 'framer-motion';
import {
  Trophy,
  Award,
  Star,
  Zap,
  MapPin,
  ShoppingCart,
  Target,
  Flame,
  Lock
} from 'lucide-react';

import { useUser } from '@store';
import { cn } from '@core/utils';
import { Card, CardContent } from '@components/ui/Card';

const achievements = [
  {
    id: 'first-product',
    name: 'First Find',
    description: 'Find your first product',
    icon: ShoppingCart,
    xp: 10,
    unlocked: true
  },
  {
    id: 'navigator',
    name: 'Navigator',
    description: 'Complete your first navigation',
    icon: MapPin,
    xp: 50,
    unlocked: false
  },
  {
    id: 'speed-shopper',
    name: 'Speed Shopper',
    description: 'Complete a list in under 15 minutes',
    icon: Zap,
    xp: 100,
    unlocked: false
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Visit all store zones',
    icon: Target,
    xp: 150,
    unlocked: false
  },
  {
    id: 'streak',
    name: 'On Fire',
    description: 'Maintain a 7-day streak',
    icon: Flame,
    xp: 200,
    unlocked: false
  },
  {
    id: 'master',
    name: 'Store Master',
    description: 'Reach level 10',
    icon: Trophy,
    xp: 500,
    unlocked: false
  }
];

export function AchievementsPage() {
  const { profile } = useUser();

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalXP = achievements
    .filter((a) => a.unlocked)
    .reduce((sum, a) => sum + a.xp, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Achievements</h1>
        <p className="text-muted-foreground">
          {unlockedCount} of {achievements.length} unlocked • {totalXP} XP earned
        </p>
      </div>

      <div className="grid gap-4">
        {achievements.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={cn(
                'overflow-hidden transition-all',
                achievement.unlocked
                  ? 'border-primary/50 bg-primary/5'
                  : 'opacity-75'
              )}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div
                  className={cn(
                    'w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0',
                    achievement.unlocked
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {achievement.unlocked ? (
                    <achievement.icon className="w-7 h-7" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{achievement.name}</h3>
                    {achievement.unlocked && (
                      <Star className="w-4 h-4 fill-warning text-warning" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {achievement.description}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-medium text-primary">
                    +{achievement.xp} XP
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="bg-gradient-to-br from-primary-500 to-accent-500 text-white border-0">
        <CardContent className="p-6 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-80" />
          <h3 className="text-lg font-semibold mb-1">Keep Shopping!</h3>
          <p className="text-sm opacity-90">
            Complete more achievements to earn XP and level up faster
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

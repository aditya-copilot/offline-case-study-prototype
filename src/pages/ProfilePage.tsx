import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Settings,
  LogOut,
  Award,
  TrendingUp,
  MapPin,
  Package,
  List,
  ChevronRight
} from 'lucide-react';

import { useUser, useUIActions } from '@store';
import { cn, formatDistance } from '@core/utils';
import { ROUTES } from '@core/constants';
import { Button } from '@components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/Card';
import { Skeleton } from '@components/feedback/Skeleton';

export function ProfilePage() {
  const { profile, isLoading } = useUser();
  const { addToast } = useUIActions();

  useEffect(() => {
    if (!profile) return;
  }, [profile]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton variant="circle" className="w-20 h-20" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">Profile not loaded</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-2xl font-bold">
          {profile.displayName?.charAt(0) ?? 'G'}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{profile.displayName}</h1>
          <p className="text-muted-foreground">
            {profile.anonymous ? 'Guest Shopper' : 'Member'}
          </p>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-primary-500 to-accent-500 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm opacity-75">Level {profile.gamification.level}</p>
              <p className="text-3xl font-bold">{profile.gamification.xp} XP</p>
            </div>
            <Award className="w-12 h-12 opacity-50" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Progress to Level {profile.gamification.level + 1}</span>
              <span>
                {profile.gamification.xp} / {profile.gamification.xpToNextLevel} XP
              </span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width: `${(profile.gamification.xp / profile.gamification.xpToNextLevel) * 100}%`
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={TrendingUp}
          label="Level"
          value={profile.gamification.level}
        />
        <StatCard
          icon={MapPin}
          label="Distance"
          value={formatDistance(profile.gamification.totalDistanceWalked * 1000)}
        />
        <StatCard
          icon={Package}
          label="Products"
          value={profile.gamification.productsFound}
        />
        <StatCard
          icon={List}
          label="Lists Done"
          value={profile.gamification.listsCompleted}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <button
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
            onClick={() => addToast({ type: 'info', title: 'Settings', message: 'Coming soon' })}
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <span>App Settings</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
            onClick={() => addToast({ type: 'info', title: 'Achievements', message: 'Coming soon' })}
          >
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-muted-foreground" />
              <span>Achievements</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full" onClick={() => addToast({ type: 'info', title: 'Sign Out', message: 'Coming soon' })}>
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="text-center p-4">
      <Icon className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

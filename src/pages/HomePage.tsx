import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Map,
  Bike,
  ClipboardList,
  ScanLine,
  Navigation,
  Zap,
  Bluetooth,
  TrendingUp
} from 'lucide-react';

import { useUser, useBLE, useShoppingList, useUIActions } from '@store';
import { cn, formatCurrency } from '@core/utils';
import { ROUTES } from '@core/constants';
import { Button } from '@components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/Card';

const quickActions = [
  { icon: Map, label: 'Store Map', path: ROUTES.MAP, color: 'bg-primary' },
  { icon: Bike, label: 'Two-Wheelers', path: ROUTES.VEHICLES, color: 'bg-accent-indigo-500' },
  { icon: ClipboardList, label: 'My List', path: ROUTES.SHOPPING_LIST, color: 'bg-accent-emerald-500' },
  { icon: ScanLine, label: 'Scan', path: ROUTES.SCAN, color: 'bg-accent-amber-500' },
  { icon: Navigation, label: 'Navigate', path: ROUTES.NAVIGATE, color: 'bg-store-zone-checkout' }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100
    }
  }
};

export function HomePage() {
  const navigate = useNavigate();
  const { profile } = useUser();
  const { isScanning, detectedBeacons } = useBLE();
  const { currentList } = useShoppingList();
  const { addToast } = useUIActions();
  const greetingShown = useRef(false);

  useEffect(() => {
    if (profile && !greetingShown.current) {
      greetingShown.current = true;
      const hour = new Date().getHours();
      let greeting = 'Good evening';
      if (hour < 12) greeting = 'Good morning';
      else if (hour < 18) greeting = 'Good afternoon';

      addToast({
        type: 'info',
        title: `${greeting}, ${profile.displayName ?? 'Shopper'}!`,
        duration: 3000
      });
    }
  }, [profile, addToast]);

  const listProgress = currentList
    ? {
        total: currentList.items.length,
        checked: currentList.items.filter((i) => i.isChecked).length
      }
    : { total: 0, checked: 0 };

  const progressPercentage = listProgress.total > 0
    ? Math.round((listProgress.checked / listProgress.total) * 100)
    : 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back!
        </h1>
        <p className="text-muted-foreground">
          Navigate the store efficiently with BLE zone detection.
        </p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-br from-primary-500 to-accent-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Bluetooth className={cn('w-5 h-5', isScanning && 'animate-pulse')} />
                  <span className="text-sm font-medium opacity-90">
                    {isScanning ? 'Scanning Active' : 'BLE Ready'}
                  </span>
                </div>
                <p className="text-2xl font-bold">
                  {detectedBeacons.length} Zones Detected
                </p>
                <p className="text-sm opacity-75">
                  {detectedBeacons[0]?.zoneId
                    ? `Currently in: ${detectedBeacons[0].zoneId}`
                    : 'Move around to detect zones'}
                </p>
              </div>
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Zap className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.path}
              variant="outline"
              className="h-auto py-4 flex-col gap-2 hover:scale-105 transition-transform"
              onClick={() => navigate(action.path)}
            >
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-white', action.color)}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Shopping List
              </CardTitle>
              <CardDescription>
                {currentList?.name ?? 'No active list'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {listProgress.total > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {listProgress.checked} of {listProgress.total} items
                    </span>
                    <span className="font-medium">{progressPercentage}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(ROUTES.SHOPPING_LIST)}
                  >
                    View List
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Your list is empty
                  </p>
                  <Button
                    size="sm"
                    onClick={() => navigate(ROUTES.VEHICLES)}
                  >
                    Browse Two-Wheelers
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Your Stats
              </CardTitle>
              <CardDescription>
                Keep shopping to level up!
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Level</span>
                    <span className="font-bold text-lg">{profile.gamification.level}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">XP</span>
                    <span className="font-medium">
                      {profile.gamification.xp} / {profile.gamification.xpToNextLevel}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-accent-amber-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(profile.gamification.xp / profile.gamification.xpToNextLevel) * 100}%`
                      }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="text-center p-2 bg-muted rounded-lg">
                      <p className="text-lg font-bold">{profile.gamification.productsFound}</p>
                      <p className="text-xs text-muted-foreground">Products Found</p>
                    </div>
                    <div className="text-center p-2 bg-muted rounded-lg">
                      <p className="text-lg font-bold">{profile.gamification.listsCompleted}</p>
                      <p className="text-xs text-muted-foreground">Lists Done</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Loading stats...
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

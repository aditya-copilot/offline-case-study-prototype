import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Moon,
  Sun,
  Monitor,
  Volume2,
  Bell,
  Smartphone,
  Accessibility,
  Trash2,
  Download,
  Info
} from 'lucide-react';

import { useTheme, useUser, useUIActions } from '@store';
import { cn } from '@core/utils';
import { APP_NAME, APP_VERSION } from '@core/constants';
import { Button } from '@components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/Card';
import { dbManager } from '@services/db';

export function SettingsPage() {
  const { theme, setThemeMode } = useTheme();
  const { profile, updatePreferences } = useUser();
  const { addToast } = useUIActions();
  const [storageInfo, setStorageInfo] = useState({ usage: 0, quota: 0 });

  const handleClearData = async () => {
    await dbManager.close();
    localStorage.clear();
    addToast({
      type: 'success',
      title: 'Data Cleared',
      message: 'All local data has been cleared'
    });
  };

  const handleExportData = () => {
    const data = {
      profile,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `store-navigator-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      title: 'Data Exported',
      message: 'Your data has been exported successfully'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Customize your app experience
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setThemeMode('light')}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors',
                theme.mode === 'light'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <Sun className="w-6 h-6" />
              <span className="text-sm font-medium">Light</span>
            </button>
            <button
              onClick={() => setThemeMode('dark')}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors',
                theme.mode === 'dark'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <Moon className="w-6 h-6" />
              <span className="text-sm font-medium">Dark</span>
            </button>
            <button
              onClick={() => setThemeMode('system')}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors',
                theme.mode === 'system'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <Monitor className="w-6 h-6" />
              <span className="text-sm font-medium">System</span>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SettingItem
            icon={Bell}
            label="Push Notifications"
            description="Receive alerts about offers and updates"
            checked={profile?.preferences.notifications ?? true}
            onChange={() => {}}
          />
          <SettingItem
            icon={Volume2}
            label="Sound Effects"
            description="Play sounds for actions and achievements"
            checked={profile?.preferences.soundEffects ?? true}
            onChange={() => {}}
          />
          <SettingItem
            icon={Smartphone}
            label="Haptic Feedback"
            description="Vibrate on interactions"
            checked={profile?.preferences.hapticFeedback ?? true}
            onChange={() => {}}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleExportData}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-error hover:text-error hover:bg-error/10"
            onClick={handleClearData}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Data
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">App Name</span>
            <span className="font-medium">{APP_NAME}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium">{APP_VERSION}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Built with</span>
            <span className="font-medium">React + Vite + TypeScript</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingItem({
  icon: Icon,
  label,
  description,
  checked,
  onChange
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <button
        onClick={onChange}
        className={cn(
          'w-11 h-6 rounded-full transition-colors relative',
          checked ? 'bg-primary' : 'bg-muted'
        )}
      >
        <span
          className={cn(
            'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}

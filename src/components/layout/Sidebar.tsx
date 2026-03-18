import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Map,
  Bike,
  ClipboardList,
  ScanLine,
  Navigation,
  Trophy,
  Settings,
  HelpCircle,
  X
} from 'lucide-react';

import { useUIActions } from '@store';
import { cn } from '@core/utils';
import { ROUTES } from '@core/constants';

const navItems = [
  { path: ROUTES.HOME, label: 'Home', icon: Home },
  { path: ROUTES.MAP, label: 'Store Map', icon: Map },
  { path: ROUTES.VEHICLES, label: 'Two-Wheelers', icon: Bike },
  { path: ROUTES.SHOPPING_LIST, label: 'My List', icon: ClipboardList },
  { path: ROUTES.SCAN, label: 'Scan', icon: ScanLine },
  { path: ROUTES.NAVIGATE, label: 'Navigate', icon: Navigation },
  { path: ROUTES.ACHIEVEMENTS, label: 'Achievements', icon: Trophy }
];

const secondaryNavItems = [
  { path: ROUTES.SETTINGS, label: 'Settings', icon: Settings },
  { path: ROUTES.HELP, label: 'Help', icon: HelpCircle }
];

export function Sidebar() {
  const location = useLocation();
  const { toggleSidebar } = useUIActions();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border lg:hidden">
        <span className="font-semibold">Menu</span>
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                    'text-sm font-medium transition-all duration-200',
                    'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )
                }
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    toggleSidebar();
                  }
                }}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mt-8 pt-6 border-t border-border">
          <ul className="space-y-1">
            {secondaryNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                      'text-sm font-medium transition-all duration-200',
                      'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )
                  }
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      toggleSidebar();
                    }
                  }}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-lg p-4">
          <p className="text-xs font-medium text-primary mb-1">Pro Tip</p>
          <p className="text-xs text-muted-foreground">
            Enable Bluetooth for precise indoor navigation with zone detection.
          </p>
        </div>
      </div>
    </div>
  );
}

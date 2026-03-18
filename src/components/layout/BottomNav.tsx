import { NavLink, useLocation } from 'react-router-dom';
import { Home, Map, Bike, ClipboardList, ScanLine } from 'lucide-react';

import { cn } from '@core/utils';
import { ROUTES } from '@core/constants';

const bottomNavItems = [
  { path: ROUTES.HOME, label: 'Home', icon: Home },
  { path: ROUTES.MAP, label: 'Map', icon: Map },
  { path: ROUTES.SCAN, label: 'Scan', icon: ScanLine, isCenter: true },
  { path: ROUTES.SHOPPING_LIST, label: 'List', icon: ClipboardList },
  { path: ROUTES.VEHICLES, label: 'Bikes', icon: Bike }
];

export function BottomNav() {
  const location = useLocation();
  const isVisible = !location.pathname.includes('/navigate');

  if (!isVisible) return null;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center flex-1 h-full',
                'transition-colors duration-200',
                item.isCenter && '-mt-4',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            {item.isCenter ? (
              <div className="w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center -mt-2 border-4 border-background">
                <item.icon className="w-6 h-6 text-primary-foreground" />
              </div>
            ) : (
              <>
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

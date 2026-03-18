import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';

import { RootLayout } from '@components/layout/RootLayout';

import { HomePage } from '@pages/HomePage';
import { MapPage } from '@pages/MapPage';
import { MapDemoPage } from '@pages/MapDemoPage';
import { BLELabPage } from '@pages/BLELabPage';
import { RouteLabPage } from '@pages/RouteLabPage';
import { VehiclesPage } from '@pages/VehiclesPage';
import AssistantLabPage from '@pages/AssistantLabPage';
import { VehicleDetailPage } from '@pages/VehicleDetailPage';
import { ComparePage } from '@pages/ComparePage';
import { ShoppingListPage } from '@pages/ShoppingListPage';
import { ScanPage } from '@pages/ScanPage';
import { NavigatePage } from '@pages/NavigatePage';
import { ProfilePage } from '@pages/ProfilePage';
import { SettingsPage } from '@pages/SettingsPage';
import { AchievementsPage } from '@pages/AchievementsPage';
import { HelpPage } from '@pages/HelpPage';
import { AboutPage } from '@pages/AboutPage';
import { NotFoundPage } from '@pages/NotFoundPage';
import { DynamicOffersScreen, UserInputPage, CKYCPage, AgreementPage, MandatePage, LoanApprovedPage, InvoicePage, DisbursedPage } from '@features/loan';

import { ROUTES } from '@core/constants';

const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: ROUTES.MAP,
        element: <MapPage />
      },
      {
        path: '/map-demo',
        element: <MapDemoPage />
      },
      {
        path: '/ble-lab',
        element: <BLELabPage />
      },
      {
        path: '/route-lab',
        element: <RouteLabPage />
      },
      {
        path: '/assistant-lab',
        element: <AssistantLabPage />
      },
      {
        path: ROUTES.VEHICLES,
        element: <VehiclesPage />
      },
      {
        path: '/vehicles/:id',
        element: <VehicleDetailPage />
      },
      {
        path: '/compare',
        element: <ComparePage />
      },
      {
        path: ROUTES.SHOPPING_LIST,
        element: <ShoppingListPage />
      },
      {
        path: ROUTES.SCAN,
        element: <ScanPage />
      },
      {
        path: ROUTES.NAVIGATE,
        element: <NavigatePage />
      },
      {
        path: ROUTES.PROFILE,
        element: <ProfilePage />
      },
      {
        path: ROUTES.SETTINGS,
        element: <SettingsPage />
      },
      {
        path: ROUTES.ACHIEVEMENTS,
        element: <AchievementsPage />
      },
      {
        path: ROUTES.HELP,
        element: <HelpPage />
      },
      {
        path: ROUTES.ABOUT,
        element: <AboutPage />
      },
      {
        path: '/loan/user-input',
        element: <UserInputPage />
      },
      {
        path: '/loan/offers',
        element: <DynamicOffersScreen />
      },
      {
        path: '/loan/ckyc',
        element: <CKYCPage />
      },
      {
        path: '/loan/agreement',
        element: <AgreementPage />
      },
      {
        path: '/loan/mandate',
        element: <MandatePage />
      },
      {
        path: '/loan/approved',
        element: <LoanApprovedPage />
      },
      {
        path: '/loan/invoice',
        element: <InvoicePage />
      },
      {
        path: '/loan/disbursed',
        element: <DisbursedPage />
      },
      {
        path: '*',
        element: <NotFoundPage />
      }
    ]
  }
];

export const router = createBrowserRouter(routes, {
  future: {
    v7_normalizeFormMethod: true
  }
});

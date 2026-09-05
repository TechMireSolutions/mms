import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { ROUTES, TENANT_APP_PATHS } from '@/lib/config/routes';
import PlatformBootGate, { PlatformFallbackRoute } from '@/platform/components/PlatformBootGate';
import { PlatformFirstRunGate } from '@/platform/components/PlatformFirstRunGate';
import RouteStatusFallback from '@/components/routing/RouteStatusFallback';

const ApexHome = React.lazy(() => import('@/platform/pages/ApexHome'));
const ApexWorkspaceGate = React.lazy(() => import('@/platform/pages/ApexWorkspaceGate'));
const TenantNotFoundPage = React.lazy(() => import('@/platform/pages/TenantNotFoundPage'));
const OnboardingWizard = React.lazy(() => import('@/platform/pages/onboarding/OnboardingWizard'));
const PlatformAccount = React.lazy(() => import('@/platform/pages/PlatformAccount'));
const PlatformAdmins = React.lazy(() => import('@/platform/pages/PlatformAdmins'));
const PlatformForgotPassword = React.lazy(() => import('@/platform/pages/auth/PlatformForgotPassword'));
const PlatformLoginPage = React.lazy(() => import('@/platform/pages/auth/PlatformLoginPage'));
const PlatformConsole = React.lazy(() => import('@/platform/pages/PlatformConsole'));
const PlatformErdPage = React.lazy(() => import('@/platform/pages/PlatformErdPage'));

const apexTenantGate = (
  <ApexWorkspaceGate variant="tenantOnly" showWorkspaceList />
);

/**
 * Platform apex route tree — public entry routes vs platform-auth-protected admin routes.
 * Dedicated sign-in lives at `/platform/login` (`ROUTES.platformLogin`), dedicated dashboard at `/platform/dashboard`.
 */
export default function ApexRoutes(): React.JSX.Element {
  return (
    <Routes>
      {/* Entry — no platform session required */}
      <Route path={ROUTES.home} element={<ApexHome />} />
      <Route path={ROUTES.login} element={<PlatformLoginPage />} />
      <Route path={ROUTES.platformLogin} element={<PlatformLoginPage />} />
      <Route path={ROUTES.tenantNotFound} element={<TenantNotFoundPage />} />
      <Route
        path={ROUTES.forgotPassword}
        element={<ApexWorkspaceGate variant="forgotPassword" showWorkspaceList />}
      />
      <Route element={<PlatformFirstRunGate />}>
        <Route path={ROUTES.platformForgotPassword} element={<PlatformForgotPassword />} />
      </Route>
      <Route
        path={ROUTES.twoFactor}
        element={<ApexWorkspaceGate variant="twoFactor" showWorkspaceList={false} />}
      />
      <Route path={`${ROUTES.settings}/*`} element={apexTenantGate} />
      {TENANT_APP_PATHS.map((path) => (
        <Route key={path} path={path} element={apexTenantGate} />
      ))}

      {/* Protected platform routes — BootGate sends unauthenticated users to `/platform/login` */}
      <Route element={<PlatformBootGate requireAuth />}>
        <Route path={ROUTES.platformAccount} element={<PlatformAccount />} />
        <Route path={ROUTES.platformDashboard} element={<PlatformConsole />} />
        <Route path={ROUTES.platformWorkspaces} element={<PlatformConsole />} />
        <Route path={ROUTES.platformReports} element={<PlatformConsole />} />
      </Route>
      <Route element={<PlatformBootGate requireAuth requirePermission="onboard" />}>
        <Route path={ROUTES.onboarding} element={<OnboardingWizard />} />
      </Route>
      <Route element={<PlatformBootGate requireAuth requirePermission="admins" />}>
        <Route path={ROUTES.platformAdmins} element={<PlatformAdmins />} />
      </Route>
      <Route element={<PlatformBootGate requireAuth requirePermission="system" />}>
        <Route path={ROUTES.platformActivityLogs} element={<PlatformConsole />} />
        <Route path={ROUTES.platformSystem} element={<PlatformConsole />} />
        <Route path={ROUTES.platformErd} element={<PlatformErdPage />} />
      </Route>

      <Route path="*" element={<PlatformFallbackRoute />} />
    </Routes>
  );
}

export function ApexRoutesWithSuspense(): React.JSX.Element {
  return (
    <React.Suspense fallback={<RouteStatusFallback fullScreen />}>
      <ApexRoutes />
    </React.Suspense>
  );
}

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
      <Route path={ROUTES.home} element={<React.Suspense fallback={<RouteStatusFallback fullScreen />}><ApexHome /></React.Suspense>} />
      <Route path={ROUTES.login} element={<React.Suspense fallback={<RouteStatusFallback fullScreen />}><PlatformLoginPage /></React.Suspense>} />
      <Route path={ROUTES.platformLogin} element={<React.Suspense fallback={<RouteStatusFallback fullScreen />}><PlatformLoginPage /></React.Suspense>} />
      <Route path={ROUTES.tenantNotFound} element={<React.Suspense fallback={<RouteStatusFallback fullScreen />}><TenantNotFoundPage /></React.Suspense>} />
      <Route
        path={ROUTES.forgotPassword}
        element={<React.Suspense fallback={<RouteStatusFallback fullScreen />}><ApexWorkspaceGate variant="forgotPassword" showWorkspaceList /></React.Suspense>}
      />
      <Route element={<PlatformFirstRunGate />}>
        <Route path={ROUTES.platformForgotPassword} element={<React.Suspense fallback={<RouteStatusFallback fullScreen />}><PlatformForgotPassword /></React.Suspense>} />
      </Route>
      <Route
        path={ROUTES.twoFactor}
        element={<React.Suspense fallback={<RouteStatusFallback fullScreen />}><ApexWorkspaceGate variant="twoFactor" showWorkspaceList={false} /></React.Suspense>}
      />
      <Route path={`${ROUTES.settings}/*`} element={apexTenantGate} />
      {TENANT_APP_PATHS.map((path) => (
        <Route key={path} path={path} element={apexTenantGate} />
      ))}

      {/* Protected platform routes — BootGate sends unauthenticated users to `/platform/login` */}
      <Route element={<PlatformBootGate requireAuth />}>
        <Route path={ROUTES.platformAccount} element={<React.Suspense fallback={<RouteStatusFallback />}><PlatformAccount /></React.Suspense>} />
        <Route path={ROUTES.platformDashboard} element={<React.Suspense fallback={<RouteStatusFallback />}><PlatformConsole /></React.Suspense>} />
        <Route path={ROUTES.platformWorkspaces} element={<React.Suspense fallback={<RouteStatusFallback />}><PlatformConsole /></React.Suspense>} />
        <Route path={ROUTES.platformReports} element={<React.Suspense fallback={<RouteStatusFallback />}><PlatformConsole /></React.Suspense>} />
      </Route>
      <Route element={<PlatformBootGate requireAuth requirePermission="onboard" />}>
        <Route path={ROUTES.onboarding} element={<React.Suspense fallback={<RouteStatusFallback />}><OnboardingWizard /></React.Suspense>} />
      </Route>
      <Route element={<PlatformBootGate requireAuth requirePermission="admins" />}>
        <Route path={ROUTES.platformAdmins} element={<React.Suspense fallback={<RouteStatusFallback />}><PlatformAdmins /></React.Suspense>} />
      </Route>
      <Route element={<PlatformBootGate requireAuth requirePermission="system" />}>
        <Route path={ROUTES.platformActivityLogs} element={<React.Suspense fallback={<RouteStatusFallback />}><PlatformConsole /></React.Suspense>} />
        <Route path={ROUTES.platformSystem} element={<React.Suspense fallback={<RouteStatusFallback />}><PlatformConsole /></React.Suspense>} />
        <Route path={ROUTES.platformErd} element={<React.Suspense fallback={<RouteStatusFallback />}><PlatformErdPage /></React.Suspense>} />
      </Route>

      <Route path="*" element={<PlatformFallbackRoute />} />
    </Routes>
  );
}

import { PlatformAuthProvider } from '@/platform/lib/PlatformAuthContext';
import { ApexBootPrefetch } from '@/platform/components/ApexBootPrefetch';

export function ApexRoutesWithSuspense(): React.JSX.Element {
  return (
    <PlatformAuthProvider>
      <ApexBootPrefetch />
      <React.Suspense fallback={<RouteStatusFallback fullScreen />}>
        <ApexRoutes />
      </React.Suspense>
    </PlatformAuthProvider>
  );
}

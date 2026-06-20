import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ROUTES, TENANT_APP_PATHS } from '@/lib/config/routes';
import PlatformBootGate from '@/platform/components/PlatformBootGate';
import { PlatformFallbackRoute } from '@/platform/components/PlatformAuthRequired';
import RouteStatusFallback from '@/components/routing/RouteStatusFallback';

const ApexHome = React.lazy(() => import('@/platform/pages/ApexHome'));
const ApexWorkspaceGate = React.lazy(() => import('@/platform/pages/ApexWorkspaceGate'));
const OnboardingWizard = React.lazy(() => import('@/platform/pages/onboarding/OnboardingWizard'));
const PlatformAccount = React.lazy(() => import('@/platform/pages/PlatformAccount'));
const PlatformForgotPassword = React.lazy(() => import('@/platform/pages/auth/PlatformForgotPassword'));

const apexTenantGate = (
  <ApexWorkspaceGate variant="tenantOnly" showWorkspaceList />
);

/**
 * Platform apex route tree — public entry routes vs platform-auth-protected admin routes.
 */
export default function ApexRoutes(): React.JSX.Element {
  return (
    <Routes>
      {/* Entry — no platform session required */}
      <Route path={ROUTES.home} element={<ApexHome />} />
      <Route path={ROUTES.login} element={<Navigate to={ROUTES.home} replace />} />
      <Route
        path={ROUTES.forgotPassword}
        element={<ApexWorkspaceGate variant="forgotPassword" showWorkspaceList />}
      />
      <Route path={ROUTES.platformForgotPassword} element={<PlatformForgotPassword />} />
      <Route
        path={ROUTES.twoFactor}
        element={<ApexWorkspaceGate variant="twoFactor" showWorkspaceList={false} />}
      />
      <Route path={`${ROUTES.settings}/*`} element={apexTenantGate} />
      {TENANT_APP_PATHS.map((path) => (
        <Route key={path} path={path} element={apexTenantGate} />
      ))}

      {/* Protected — platform super-user session required */}
      <Route element={<PlatformBootGate requireAuth />}>
        <Route path={ROUTES.onboarding} element={<OnboardingWizard />} />
        <Route path={ROUTES.platformAccount} element={<PlatformAccount />} />
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

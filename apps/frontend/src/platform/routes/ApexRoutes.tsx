import React from "react";
import { Route, Routes } from "react-router-dom";
import { ROUTES, TENANT_APP_PATHS } from "@/lib/config/routes";
import PlatformBootGate from "@/platform/components/PlatformBootGate";
import RouteStatusFallback from "@/components/routing/RouteStatusFallback";
import ApexPageNotFound from "@/platform/components/ApexPageNotFound";

const ApexHome = React.lazy(() => import("@/platform/pages/ApexHome"));
const ApexWorkspaceGate = React.lazy(() => import("@/platform/pages/ApexWorkspaceGate"));
const OnboardingWizard = React.lazy(() => import("@/platform/pages/onboarding/OnboardingWizard"));
const PlatformAccount = React.lazy(() => import("@/platform/pages/PlatformAccount"));
const PlatformForgotPassword = React.lazy(() => import("@/platform/pages/auth/PlatformForgotPassword"));

const apexTenantGate = (
  <ApexWorkspaceGate variant="tenantOnly" showWorkspaceList />
);

/**
 * Platform apex route tree — onboarding, super-user console, workspace picker.
 * Never mounts tenant AppLayout or madrasa module pages.
 */
export default function ApexRoutes(): React.JSX.Element {
  return (
    <Routes>
      <Route path={ROUTES.home} element={<ApexHome />} />

      <Route element={<PlatformBootGate requireAuth />}>
        <Route path={ROUTES.onboarding} element={<OnboardingWizard />} />
        <Route path={ROUTES.platformAccount} element={<PlatformAccount />} />
      </Route>

      <Route path={ROUTES.login} element={<ApexWorkspaceGate variant="login" showWorkspaceList />} />
      <Route
        path={ROUTES.forgotPassword}
        element={<ApexWorkspaceGate variant="forgotPassword" showWorkspaceList />}
      />
      <Route path={ROUTES.platformForgotPassword} element={<PlatformForgotPassword />} />
      <Route path={ROUTES.twoFactor} element={<ApexWorkspaceGate variant="twoFactor" showWorkspaceList={false} />} />

      <Route path={`${ROUTES.settings}/*`} element={apexTenantGate} />
      {TENANT_APP_PATHS.map((path) => (
        <Route key={path} path={path} element={apexTenantGate} />
      ))}

      <Route path="*" element={<ApexPageNotFound />} />
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

import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { useTenant } from "@/lib/contexts/TenantContext";
import { ROUTES } from "@/lib/config/routes";
import { apexUrl } from "@/lib/config/tenantConfig";
import ProtectedRoute from "@/components/routing/ProtectedRoute";
import GuestRoute from "@/components/routing/GuestRoute";
import TenantNotFoundScreen from "@/components/routing/TenantNotFoundScreen";
import WorkspaceDisabledScreen from "@/components/routing/WorkspaceDisabledScreen";
import AppLayout from "@/components/layout/AppLayout";
import PageNotFound from "@/components/routing/PageNotFound";
import RouteStatusFallback from "@/components/routing/RouteStatusFallback";

const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const Contacts = React.lazy(() => import("@/pages/Contacts"));
const Students = React.lazy(() => import("@/pages/Students"));
const Teachers = React.lazy(() => import("@/pages/Teachers"));
const Enrollments = React.lazy(() => import("@/pages/Enrollments"));
const Sessions = React.lazy(() => import("@/pages/Sessions"));
const Finance = React.lazy(() => import("@/pages/Finance"));
const HasanatCards = React.lazy(() => import("@/pages/HasanatCards"));
const Examinations = React.lazy(() => import("@/pages/Examinations"));
const QuestionBankPage = React.lazy(() => import("@/pages/QuestionBank"));
const SettingsPage = React.lazy(() => import("@/pages/Settings"));
const Attendance = React.lazy(() => import("@/pages/Attendance"));
const Users = React.lazy(() => import("@/pages/Users"));
const AccountProfile = React.lazy(() => import("@/pages/AccountProfile"));
const Obligations = React.lazy(() => import("@/pages/Obligations"));
const Accounting = React.lazy(() => import("@/pages/Accounting"));
const Login = React.lazy(() => import("@/pages/auth/Login"));
const ForgotPassword = React.lazy(() => import("@/pages/auth/ForgotPassword"));
const TwoFactorAuth = React.lazy(() => import("@/pages/auth/TwoFactorAuth"));

function RedirectToApex({ path }: { path: string }): React.JSX.Element {
  React.useEffect(() => {
    window.location.href = apexUrl(path);
  }, [path]);

  return <RouteStatusFallback fullScreen />;
}

function TenantBootGate({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { workspaceLoading, workspace, subdomain } = useTenant();

  if (workspaceLoading) {
    return <RouteStatusFallback fullScreen />;
  }

  if (!workspace && subdomain) {
    return <TenantNotFoundScreen subdomain={subdomain} />;
  }

  if (workspace && workspace.enabled === false) {
    return (
      <WorkspaceDisabledScreen
        madrasaName={workspace.madrasaName}
        subdomain={workspace.subdomain}
      />
    );
  }

  return <>{children}</>;
}

/**
 * Tenant madrasa route tree — login, dashboard, and module pages on {slug}.{domain}.
 */
function TenantRoutesInner(): React.JSX.Element {
  return (
    <TenantBootGate>
      <Routes>
        <Route path={ROUTES.onboarding} element={<RedirectToApex path={ROUTES.onboarding} />} />

        <Route path={ROUTES.twoFactor} element={<TwoFactorAuth />} />
        <Route element={<GuestRoute />}>
          <Route path={ROUTES.login} element={<Login />} />
          <Route path={ROUTES.forgotPassword} element={<ForgotPassword />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path={ROUTES.home} element={<Dashboard />} />
            <Route path={ROUTES.contacts} element={<Contacts />} />
            <Route path={ROUTES.students} element={<Students />} />
            <Route path={ROUTES.teachers} element={<Teachers />} />
            <Route path={ROUTES.enrollments} element={<Enrollments />} />
            <Route path={ROUTES.sessions} element={<Sessions />} />
            <Route path={ROUTES.attendance} element={<Attendance />} />
            <Route path={ROUTES.finance} element={<Finance />} />
            <Route path={ROUTES.hasanatCards} element={<HasanatCards />} />
            <Route path={ROUTES.examinations} element={<Examinations />} />
            <Route path={ROUTES.questionBank} element={<QuestionBankPage />} />
            <Route path={ROUTES.accounting} element={<Accounting />} />
            <Route path={ROUTES.obligations} element={<Obligations />} />
            <Route path={ROUTES.users} element={<Users />} />
            <Route path={ROUTES.profile} element={<AccountProfile />} />
            <Route path={ROUTES.settings} element={<SettingsPage />} />
            <Route path={`${ROUTES.settings}/:section`} element={<Navigate to={ROUTES.settings} replace />} />
          </Route>
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </TenantBootGate>
  );
}

export default function TenantRoutes(): React.JSX.Element {
  return (
    <React.Suspense fallback={<RouteStatusFallback fullScreen />}>
      <TenantRoutesInner />
    </React.Suspense>
  );
}

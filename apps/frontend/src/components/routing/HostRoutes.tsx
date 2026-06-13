import React, { useEffect } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useTenant } from "@/lib/TenantContext";
import { ROUTES, TENANT_APP_PATHS } from "@/lib/routes";
import { apexUrl } from "@/lib/tenantConfig";
import ProtectedRoute from "@/components/routing/ProtectedRoute";
import GuestRoute from "@/components/routing/GuestRoute";
import TenantNotFoundScreen from "@/components/routing/TenantNotFoundScreen";
import AppLayout from "@/components/layout/AppLayout";
import PageNotFound from "@/lib/PageNotFound";

const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const Contacts = React.lazy(() => import("@/pages/Contacts"));
const Students = React.lazy(() => import("@/pages/Students"));
const Enrollments = React.lazy(() => import("@/pages/Enrollments"));
const Sessions = React.lazy(() => import("@/pages/Sessions"));
const Finance = React.lazy(() => import("@/pages/Finance"));
const HasanatCards = React.lazy(() => import("@/pages/HasanatCards"));
const Examinations = React.lazy(() => import("@/pages/Examinations"));
const QuestionBankPage = React.lazy(() => import("@/pages/QuestionBank"));
const SettingsPage = React.lazy(() => import("@/pages/Settings"));
const Attendance = React.lazy(() => import("@/pages/Attendance"));
const Users = React.lazy(() => import("@/pages/Users"));
const Obligations = React.lazy(() => import("@/pages/Obligations"));
const Accounting = React.lazy(() => import("@/pages/Accounting"));
const Login = React.lazy(() => import("@/pages/auth/Login"));
const ForgotPassword = React.lazy(() => import("@/pages/auth/ForgotPassword"));
const TwoFactorAuth = React.lazy(() => import("@/pages/auth/TwoFactorAuth"));
const OnboardingWizard = React.lazy(() => import("@/pages/onboarding/OnboardingWizard"));
const ApexLanding = React.lazy(() => import("@/pages/ApexLanding"));
const ApexWorkspaceGate = React.lazy(() => import("@/pages/ApexWorkspaceGate"));

function RedirectToApex({ path }: { path: string }): React.JSX.Element {
  useEffect(() => {
    window.location.href = apexUrl(path);
  }, [path]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function TenantBootGate({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { workspaceLoading, workspace, subdomain } = useTenant();

  if (workspaceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!workspace && subdomain) {
    return <TenantNotFoundScreen subdomain={subdomain} />;
  }

  return <>{children}</>;
}

const apexTenantGate = (
  <ApexWorkspaceGate variant="tenantOnly" showWorkspaceList />
);

/**
 * Renders apex-only or tenant-only route trees — never both (avoids / redirect loops).
 */
export default function HostRoutes(): React.JSX.Element {
  const { isApex } = useTenant();

  if (isApex) {
    return (
      <Routes>
        <Route path={ROUTES.home} element={<ApexLanding />} />
        <Route path={ROUTES.onboarding} element={<OnboardingWizard />} />
        <Route path={ROUTES.login} element={<ApexWorkspaceGate variant="login" showWorkspaceList />} />
        <Route
          path={ROUTES.forgotPassword}
          element={<ApexWorkspaceGate variant="forgotPassword" showWorkspaceList />}
        />
        <Route path={ROUTES.twoFactor} element={<ApexWorkspaceGate variant="twoFactor" showWorkspaceList={false} />} />
        <Route path={`${ROUTES.settings}/*`} element={apexTenantGate} />
        {TENANT_APP_PATHS.map((path) => (
          <Route key={path} path={path} element={apexTenantGate} />
        ))}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    );
  }

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
            <Route path={ROUTES.settings} element={<Navigate to={ROUTES.settingsSection("global")} replace />} />
            <Route path={`${ROUTES.settings}/:section`} element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </TenantBootGate>
  );
}

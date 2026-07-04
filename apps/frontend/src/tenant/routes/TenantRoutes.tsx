import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { useTenant } from "@/lib/contexts/TenantContext";
import { ROUTES } from "@/lib/config/routes";
import { apexUrl } from "@/lib/config/tenantConfig";
import ProtectedRoute from "@/tenant/components/guards/ProtectedRoute";
import GuestRoute from "@/tenant/components/guards/GuestRoute";
import TenantNotFoundScreen from "@/tenant/components/TenantNotFoundScreen";
import WorkspaceDisabledScreen from "@/tenant/components/WorkspaceDisabledScreen";
import AppLayout from "@/tenant/components/layout/AppLayout";
import PageNotFound from "@/tenant/components/PageNotFound";
import RouteStatusFallback from "@/components/routing/RouteStatusFallback";

const Dashboard = React.lazy(() => import("@/tenant/features/dashboard/DashboardPage"));
const Contacts = React.lazy(() => import("@/tenant/features/contacts/ContactsPage"));
const Students = React.lazy(() => import("@/tenant/features/students/StudentsPage"));
const Teachers = React.lazy(() => import("@/tenant/features/teachers/TeachersPage"));
const Enrollments = React.lazy(() => import("@/tenant/features/enrollments/EnrollmentsPage"));
const Sessions = React.lazy(() => import("@/tenant/features/sessions/SessionsPage"));
const Finance = React.lazy(() => import("@/tenant/features/finance/FinancePage"));
const HasanatCards = React.lazy(() => import("@/tenant/features/hasanat/HasanatCardsPage"));
const Examinations = React.lazy(() => import("@/tenant/features/examinations/ExaminationsPage"));
const QuestionBankPage = React.lazy(() => import("@/tenant/features/question-bank/QuestionBankPage"));
const SettingsPage = React.lazy(() => import("@/tenant/features/settings/SettingsPage"));
const Attendance = React.lazy(() => import("@/tenant/features/attendance/AttendancePage"));
const Users = React.lazy(() => import("@/tenant/features/users/UsersPage"));
const AccountProfile = React.lazy(() => import("@/tenant/features/profile/AccountProfilePage"));
const Obligations = React.lazy(() => import("@/tenant/features/obligations/ObligationsPage"));
const Accounting = React.lazy(() => import("@/tenant/features/accounting/AccountingPage"));
const Login = React.lazy(() => import("@/tenant/pages/auth/Login"));
const ForgotPassword = React.lazy(() => import("@/tenant/pages/auth/ForgotPassword"));
const TwoFactorAuth = React.lazy(() => import("@/tenant/pages/auth/TwoFactorAuth"));
const Messaging = React.lazy(() => import("@/tenant/features/messaging/MessagingPage"));

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
            <Route path={ROUTES.messaging} element={<Messaging />} />
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

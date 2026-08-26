import React, { Suspense, lazy } from "react";
import { useLocation, useSearchParams, Link } from "react-router-dom";
import { User, LayoutDashboard, Building2, BarChart3, Settings, Server, Activity, Plus, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PlatformPageShell } from "@/platform/components/PlatformPageShell";
import { useTranslation } from "@/hooks/useTranslation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { PageHeader } from "@/components/ui/PageHeader";
import { usePlatformPermissions } from "@/platform/hooks/usePlatformPermissions";
import { ROUTES } from "@/lib/config/routes";
import { CardSkeleton, StatsSkeleton } from "@/components/ui/LoadingState";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";

import { PlatformAddAdminForm } from "@/platform/pages/PlatformAddAdminForm";
import { containerVariantsConsole as containerVariants, itemVariants } from "@/platform/lib/animations";

const PlatformDashboard = lazy(() => import("@/platform/components/PlatformDashboard").then(m => ({ default: m.PlatformDashboard })));
const PlatformReports = lazy(() => import("@/platform/components/PlatformReports").then(m => ({ default: m.PlatformReports })));
const PlatformSystemMaintenance = lazy(() => import("@/platform/components/PlatformSystemMaintenance").then(m => ({ default: m.PlatformSystemMaintenance })));
const PlatformActivityLogsContent = lazy(() => import("@/platform/components/PlatformActivityLogsContent"));
const PlatformAdminsContent = lazy(() => import("@/platform/components/PlatformAdminsContent").then(m => ({ default: m.PlatformAdminsContent })));
const PlatformWorkspaceList = lazy(() => import("@/platform/components/PlatformWorkspaceList"));

function TabFallback(): React.JSX.Element {
  return <StatsSkeleton count={3} />;
}

function WorkspaceListFallback(): React.JSX.Element {
  return <CardSkeleton count={2} className="grid-cols-1 lg:grid-cols-2" />;
}

type PlatformTab = "dashboard" | "work" | "reports" | "logs" | "system" | "setup";

/**
 * Authenticated apex console — clean view driven strictly by sidebar navigation links.
 */
export default function PlatformConsole(): React.JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { platformUser, isSuperUser, canWorkspaces, canOnboard, canSystem } = usePlatformPermissions();

  const pathname = location.pathname;
  const rawTab = searchParams.get("tab");
  const activeTab: PlatformTab =
    pathname === ROUTES.platformWorkspaces || rawTab === "work"
      ? "work"
      : pathname === ROUTES.platformReports || rawTab === "reports"
        ? "reports"
        : (pathname === ROUTES.platformActivityLogs || rawTab === "logs") && canSystem
          ? "logs"
          : (pathname === ROUTES.platformSystem || rawTab === "system") && canSystem
            ? "system"
            : rawTab === "setup"
              ? "setup"
              : "dashboard";

  const tabHeaderProps = {
    dashboard: {
      icon: LayoutDashboard,
      title: t("dashboard.title"),
      subtitle: isSuperUser
        ? t("platform.consoleSubtitle", { name: platformUser?.name ?? "" })
        : t("platform.adminConsoleSubtitle", { name: platformUser?.name ?? "" }),
    },
    work: {
      icon: Building2,
      title: t("platform.manageMadrasas"),
      subtitle: t("platform.consoleSubtitle", { name: platformUser?.name ?? "" }),
      actions: canOnboard ? (
        <Button
          asChild
          className="min-h-11 rounded-xl font-bold px-5 shadow-sm shadow-primary/20 hover:shadow-md interactive-scale cursor-pointer"
          onMouseEnter={() => {
            void import('@/platform/pages/onboarding/OnboardingWizard');
          }}
        >
          <Link to={ROUTES.onboarding}>
            <Plus className="w-4 h-4 me-1.5" aria-hidden />
            {t('auth.createMadrasa')}
            <ArrowRight className="w-4 h-4 ms-1 rtl:rotate-180" aria-hidden />
          </Link>
        </Button>
      ) : null,
    },
    reports: {
      icon: BarChart3,
      title: t("module.reports"),
      subtitle: t("platform.consoleSubtitle", { name: platformUser?.name ?? "" }),
    },
    logs: {
      icon: Activity,
      title: t("platform.activityLogsTitle"),
      subtitle: t("platform.activityLogsSubtitle"),
    },
    system: {
      icon: Server,
      title: t("platform.systemMaintenance"),
      subtitle: t("platform.profileSubtitle"),
    },
    setup: {
      icon: Settings,
      title: t("platform.adminsTitle"),
      subtitle: t("platform.adminsSubtitle"),
      actions: <PlatformAddAdminForm asTriggerOnly />,
    },
  }[activeTab];

  return (
    <PlatformPageShell width="7xl">
      <motion.div
        variants={containerVariants}
        initial={reducedMotion ? false : "hidden"}
        animate="show"
        className="space-y-6"
      >
        <PageHeader
          icon={tabHeaderProps.icon}
          title={tabHeaderProps.title}
          subtitle={tabHeaderProps.subtitle}
          actions={tabHeaderProps.actions}
        />

        {canWorkspaces ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<TabFallback />}>
                {activeTab === "dashboard" && <PlatformDashboard />}

                {activeTab === "work" && (
                  <div className="space-y-6">
                    <Suspense fallback={<WorkspaceListFallback />}>
                      <PlatformWorkspaceList />
                    </Suspense>
                  </div>
                )}

                {activeTab === "reports" && <PlatformReports />}

                {activeTab === "logs" && canSystem && <PlatformActivityLogsContent />}

                {activeTab === "system" && canSystem && <PlatformSystemMaintenance />}

                {activeTab === "setup" && <PlatformAdminsContent />}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        ) : (
          <motion.div variants={itemVariants}>
            <EmptyState
              icon={User}
              title={t("platform.adminNoCapabilities")}
              description={
                canOnboard
                  ? t("platform.permOnboardDesc")
                  : t("platform.adminLimitedDescription")
              }
            />
          </motion.div>
        )}
      </motion.div>
    </PlatformPageShell>
  );
}

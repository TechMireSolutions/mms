import React from "react";
import { Building2, Globe, Ban, PlusCircle, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { usePlatformPermissions } from "@/platform/hooks/usePlatformPermissions";
import { usePlatformWorkspaceMetrics } from "@/platform/hooks/usePlatformWorkspaceMetrics";
import { ModuleCommandMetricsGrid } from "@/components/ui/ModuleCommandMetricsGrid";
import { StatsSkeleton } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { containerVariantsConsole, itemVariants } from "@/platform/lib/animations";
import { PlatformDashboardBanner } from "./dashboard/PlatformDashboardBanner";
import { PlatformDashboardTelemetry } from "./dashboard/PlatformDashboardTelemetry";
import { PlatformDashboardCharts } from "./dashboard/PlatformDashboardCharts";
import { PlatformDashboardQuickActions } from "./dashboard/PlatformDashboardQuickActions";
import { ROUTES } from "@/lib/config/routes";

export function PlatformDashboard(): React.JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const { platformUser, isSuperUser, canWorkspaces, canOnboard, canSystem, canAdmins } =
    usePlatformPermissions();
  const {
    data: metrics,
    isLoading: metricsLoading,
    isError: metricsError,
    refetch,
  } = usePlatformWorkspaceMetrics();

  const totalWorkspaces = metrics?.total ?? 0;
  const activeWorkspaces = metrics?.active ?? 0;
  const disabledWorkspaces = metrics?.inactive ?? 0;
  const metricsReady = !metricsLoading && !metricsError && metrics !== undefined;

  return (
    <motion.div
      variants={reducedMotion ? undefined : containerVariantsConsole}
      initial={reducedMotion ? false : "hidden"}
      animate="show"
      className="space-y-8 text-start"
    >
      {/* First viewport: greeting + fleet KPIs */}
      <PlatformDashboardBanner
        platformUser={platformUser}
        isSuperUser={isSuperUser}
        canWorkspaces={canWorkspaces}
        canOnboard={canOnboard}
      />

      <motion.div variants={reducedMotion ? undefined : itemVariants}>
        {metricsError ? (
          <ErrorState
            title={t("platform.loadFailed")}
            description={t("platform.loadFailedHint")}
            onRetry={() => void refetch()}
          />
        ) : metricsReady && totalWorkspaces === 0 && canOnboard ? (
          <EmptyState
            icon={Building2}
            title={t("apex.noMadrasasYet")}
            description={t("platform.superConsoleDesc")}
            action={
              <Button asChild className="min-h-11 rounded-xl font-bold px-5 cursor-pointer">
                <Link to={ROUTES.onboarding}>
                  <PlusCircle className="w-4 h-4 me-1.5" aria-hidden />
                  {t('auth.createMadrasa')}
                </Link>
              </Button>
            }
          />
        ) : metricsReady ? (
          <ModuleCommandMetricsGrid
            items={[
              {
                icon: Building2,
                label: t("platform.manageMadrasas"),
                value: totalWorkspaces,
                accent: "primary",
              },
              {
                icon: Globe,
                label: t("platform.workspaceActive"),
                value: activeWorkspaces,
                accent: "success",
              },
              {
                icon: Ban,
                label: t("platform.workspaceInactive"),
                value: disabledWorkspaces,
                accent: "destructive",
              },
            ]}
          />
        ) : (
          <StatsSkeleton count={3} />
        )}
      </motion.div>

      {/* Second section: fleet snapshot + ops shortcuts */}
      {metricsReady && totalWorkspaces > 0 ? (
        <motion.div
          variants={reducedMotion ? undefined : itemVariants}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
        >
          <div className="lg:col-span-2 space-y-6">
            <PlatformDashboardCharts
              activeWorkspaces={activeWorkspaces}
              disabledWorkspaces={disabledWorkspaces}
            />
          </div>
          <PlatformDashboardQuickActions
            canWorkspaces={canWorkspaces}
            canSystem={canSystem}
            canAdmins={canAdmins}
          />
        </motion.div>
      ) : null}

      {/* Third section: system health (collapsed unless system permission) */}
      <motion.div variants={reducedMotion ? undefined : itemVariants}>
        <details
          className="group rounded-xl border border-border/60 bg-card/40 open:bg-card/60"
          open={canSystem}
        >
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
            <Activity className="h-4 w-4 text-primary shrink-0" aria-hidden />
            {t("platform.dashboard.systemHealth")}
          </summary>
          <div className="border-t border-border/40 px-4 pb-4 pt-3">
            <PlatformDashboardTelemetry />
          </div>
        </details>
      </motion.div>
    </motion.div>
  );
}

import React from "react";
import { Building2, Globe, Ban, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { usePlatformPermissions } from "@/platform/hooks/usePlatformPermissions";
import { usePlatformWorkspaces } from "@/platform/hooks/usePlatformWorkspaces";
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
  const { platformUser, isSuperUser, canWorkspaces, canOnboard, canSystem, canAdmins } = usePlatformPermissions();
  const {
    data: workspaces,
    isLoading: workspacesLoading,
    isError: workspacesError,
    refetch,
  } = usePlatformWorkspaces();

  const totalWorkspaces = workspaces?.length ?? 0;
  const activeWorkspaces = workspaces?.filter((w) => w.enabled).length ?? 0;
  const disabledWorkspaces = workspaces?.filter((w) => w.enabled === false).length ?? 0;
  const metricsReady = !workspacesLoading && !workspacesError && workspaces !== undefined;

  return (
    <motion.div
      variants={reducedMotion ? undefined : containerVariantsConsole}
      initial={reducedMotion ? false : "hidden"}
      animate="show"
      className="space-y-8 text-start"
    >
      <PlatformDashboardBanner
        platformUser={platformUser}
        isSuperUser={isSuperUser}
        canWorkspaces={canWorkspaces}
        canOnboard={canOnboard}
        totalWorkspaces={totalWorkspaces}
        activeWorkspaces={activeWorkspaces}
      />

      <motion.div variants={reducedMotion ? undefined : itemVariants}>
        {workspacesError ? (
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

      <PlatformDashboardTelemetry />

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
    </motion.div>
  );
}


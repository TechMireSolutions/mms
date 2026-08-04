import React, { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus, Globe, Building2, Ban, User } from "lucide-react";
import { motion } from "framer-motion";
import { PlatformPageShell } from "@/platform/components/PlatformPageShell";
import { useTranslation } from "@/hooks/useTranslation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ROUTES } from "@/lib/config/routes";
import { Button } from "@/components/ui/button";
import { ModuleCommandMetricsGrid } from "@/components/ui/ModuleCommandMetricsGrid";
import { usePlatformWorkspaces } from "@/platform/hooks/usePlatformWorkspaces";
import { usePlatformPermissions } from "@/platform/hooks/usePlatformPermissions";
import { CardSkeleton } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

import { containerVariantsConsole as containerVariants, itemVariants } from "@/platform/lib/animations";

const PlatformWorkspaceList = lazy(() => import("@/platform/components/PlatformWorkspaceList"));

function WorkspaceListFallback(): React.JSX.Element {
  return <CardSkeleton count={2} className="grid-cols-1 lg:grid-cols-2" />;
}

/**
 * Authenticated apex console — workspace ops and onboarding gated by permissions.
 */
export default function PlatformConsole(): React.JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const { platformUser, isSuperUser, canWorkspaces, canOnboard } = usePlatformPermissions();
  const { data: workspaces, isLoading: workspacesLoading } = usePlatformWorkspaces();

  const totalWorkspaces = workspaces?.length ?? 0;
  const activeWorkspaces = workspaces?.filter((w) => w.enabled).length ?? 0;
  const disabledWorkspaces = workspaces?.filter((w) => w.enabled === false).length ?? 0;
  const metricsReady = !workspacesLoading && workspaces !== undefined;

  const headerActions = canOnboard ? (
    <Button
      asChild
      className="h-11 rounded-xl font-bold px-5 shadow-sm shadow-primary/20 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer self-start sm:self-auto"
      onMouseEnter={() => {
        void import("@/platform/pages/onboarding/OnboardingWizard");
      }}
    >
      <Link to={ROUTES.onboarding}>
        <Plus className="w-4 h-4 me-1.5" aria-hidden />
        {t("auth.createMadrasa")}
        <ArrowRight className="w-4 h-4 ms-1 rtl:rotate-180" aria-hidden />
      </Link>
    </Button>
  ) : undefined;

  return (
    <PlatformPageShell width="7xl">
      <motion.div
        variants={containerVariants}
        initial={reducedMotion ? false : "hidden"}
        animate="show"
        className="space-y-8"
      >
        <motion.div variants={itemVariants}>
          <PageHeader
            title={t("platform.consoleTitle")}
            subtitle={
              isSuperUser
                ? t("platform.consoleSubtitle", { name: platformUser?.name ?? "" })
                : t("platform.adminConsoleSubtitle", { name: platformUser?.name ?? "" })
            }
            actions={headerActions}
          />
        </motion.div>

        {canWorkspaces ? (
          <>
            <motion.div variants={itemVariants}>
              {metricsReady ? (
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
                <CardSkeleton count={3} className="grid-cols-1 sm:grid-cols-3" />
              )}
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-card/30 border border-border/40 rounded-2xl p-6 backdrop-blur-sm shadow-sm space-y-6"
            >
              <Suspense fallback={<WorkspaceListFallback />}>
                <PlatformWorkspaceList />
              </Suspense>
            </motion.div>
          </>
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
              action={
                canOnboard ? (
                  <Button asChild className="min-h-11">
                    <Link to={ROUTES.onboarding}>{t("auth.createMadrasa")}</Link>
                  </Button>
                ) : (
                  <Button asChild className="min-h-11">
                    <Link to={ROUTES.platformAccount}>{t("platform.myAccount")}</Link>
                  </Button>
                )
              }
            />
          </motion.div>
        )}
      </motion.div>
    </PlatformPageShell>
  );
}

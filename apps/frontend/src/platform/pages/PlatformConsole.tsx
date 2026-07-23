import React, { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus, Globe, Building2, Ban } from "lucide-react";
import { motion } from "framer-motion";
import { PlatformPageShell } from "@/platform/components/PlatformPageShell";
import { usePlatformAuth } from "@/platform/lib/PlatformAuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { ROUTES } from "@/lib/config/routes";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/StatCard";
import { usePlatformWorkspaces } from "@/platform/hooks/usePlatformWorkspaces";
import { CardSkeleton } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";

import { containerVariantsConsole as containerVariants, itemVariants } from "@/platform/lib/animations";

const PlatformWorkspaceList = lazy(() => import("@/platform/components/PlatformWorkspaceList"));

function WorkspaceListFallback(): React.JSX.Element {
  return <CardSkeleton count={2} className="grid-cols-1 lg:grid-cols-2" />;
}

/**
 * Authenticated apex console — super-user provisions new madrasa workspaces.
 */
export default function PlatformConsole(): React.JSX.Element {
  const { t } = useTranslation();
  const { platformUser } = usePlatformAuth();
  const { data: workspaces } = usePlatformWorkspaces();
  const isSuperUser = platformUser?.role === "super_user";

  const totalWorkspaces = workspaces?.length ?? 0;
  const activeWorkspaces = workspaces?.filter((w) => w.enabled).length ?? 0;
  const disabledWorkspaces = workspaces?.filter((w) => !w.enabled).length ?? 0;

  const headerActions = isSuperUser ? (
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
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        <motion.div variants={itemVariants}>
          <PageHeader
            title={t("platform.consoleTitle")}
            subtitle={t("platform.consoleSubtitle", { name: platformUser?.name ?? "" })}
            actions={headerActions}
          />
        </motion.div>

        {/* Dashboard Statistics Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label={t("platform.manageMadrasas")}
            value={totalWorkspaces}
            icon={Building2}
            accent="primary"
            delayIndex={0}
          />
          <StatCard
            label={t("platform.workspaceActive")}
            value={activeWorkspaces}
            icon={Globe}
            accent="success"
            delayIndex={1}
          />
          <StatCard
            label={t("platform.workspaceInactive")}
            value={disabledWorkspaces}
            icon={Ban}
            accent="destructive"
            delayIndex={2}
          />
        </motion.div>

        {/* Workspaces List Section */}
        <motion.div
          variants={itemVariants}
          className="bg-card/30 border border-border/40 rounded-2xl p-6 backdrop-blur-sm shadow-sm space-y-6"
        >
          <Suspense fallback={<WorkspaceListFallback />}>
            <PlatformWorkspaceList />
          </Suspense>
        </motion.div>
      </motion.div>
    </PlatformPageShell>
  );
}


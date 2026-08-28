import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { usePlatformPermissions } from '@/platform/hooks/usePlatformPermissions';
import { usePlatformWorkspaces } from '@/platform/hooks/usePlatformWorkspaces';
import { containerVariantsConsole, itemVariants } from '@/platform/lib/animations';
import { PlatformReportsMetrics } from './reports/PlatformReportsMetrics';
import { PlatformReportsGrowthChart } from './reports/PlatformReportsGrowthChart';
import { PlatformReportsPieCharts } from './reports/PlatformReportsPieCharts';
import { PlatformReportsOperatorCard } from './reports/PlatformReportsOperatorCard';

export function PlatformReports(): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const { platformUser, isSuperUser, canWorkspaces, canOnboard, canSettings, canAdmins, canSystem } =
    usePlatformPermissions();
  const { data: workspaces, isLoading: workspacesLoading, isError: workspacesError } =
    usePlatformWorkspaces();

  const totalWorkspaces = workspaces?.length ?? 0;
  const activeWorkspaces = workspaces?.filter((w) => w.enabled).length ?? 0;
  const disabledWorkspaces = workspaces?.filter((w) => w.enabled === false).length ?? 0;
  const verifyRequiredCount = workspaces?.filter((w) => Boolean(w.requireEmailVerification)).length ?? 0;
  const verifyOptionalCount = totalWorkspaces - verifyRequiredCount;
  const activeRate = totalWorkspaces > 0 ? Math.round((activeWorkspaces / totalWorkspaces) * 100) : 0;
  const metricsReady = !workspacesLoading && !workspacesError && workspaces !== undefined;

  return (
    <motion.div
      variants={reducedMotion ? undefined : containerVariantsConsole}
      initial={reducedMotion ? false : 'hidden'}
      animate="show"
      className="space-y-6 text-start"
    >
      <motion.div variants={reducedMotion ? undefined : itemVariants}>
        <PlatformReportsMetrics
          totalWorkspaces={totalWorkspaces}
          activeWorkspaces={activeWorkspaces}
          activeRate={activeRate}
          platformUser={platformUser}
          isReady={metricsReady}
          isError={workspacesError}
        />
      </motion.div>

      <motion.div variants={reducedMotion ? undefined : itemVariants}>
        <PlatformReportsGrowthChart workspaces={workspaces} />
      </motion.div>

      <motion.div variants={reducedMotion ? undefined : itemVariants}>
        <PlatformReportsPieCharts
          totalWorkspaces={totalWorkspaces}
          activeWorkspaces={activeWorkspaces}
          disabledWorkspaces={disabledWorkspaces}
          verifyRequiredCount={verifyRequiredCount}
          verifyOptionalCount={verifyOptionalCount}
        />
      </motion.div>

      <motion.div variants={reducedMotion ? undefined : itemVariants}>
        <PlatformReportsOperatorCard
          platformUser={platformUser}
          isSuperUser={isSuperUser}
          canWorkspaces={canWorkspaces}
          canOnboard={canOnboard}
          canSettings={canSettings}
          canAdmins={canAdmins}
          canSystem={canSystem}
        />
      </motion.div>
    </motion.div>
  );
}

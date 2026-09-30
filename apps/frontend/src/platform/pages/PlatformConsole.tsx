import { PlatformOnboardingAction } from '@/platform/components/common/PlatformOnboardingAction';
import React from 'react';
import { User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ModuleScaffold } from '@/components/common/ModuleScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { PlatformAddAdminForm } from '@/platform/pages/PlatformAddAdminForm';
import { containerVariantsConsole as containerVariants, itemVariants } from '@/platform/lib/animations';
import { usePlatformConsoleController } from '@/platform/pages/usePlatformConsoleController';
import { PlatformWorkTier } from '@/platform/components/tiers/PlatformWorkTier';
import { PlatformReportsTier } from '@/platform/components/tiers/PlatformReportsTier';
import { PlatformSetupTier } from '@/platform/components/tiers/PlatformSetupTier';

/**
 * Authenticated apex console aligned with the MMS 3-tier architecture:
 * Work · Reports · Setup
 */
export default function PlatformConsole(): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const controller = usePlatformConsoleController();
  const { t, perms, activeTab } = controller;

  const headerActions = (() => {
    if (activeTab === 'work' && controller.activeWorkSubTab === 'workspaces' && perms.canOnboard) {
      return (
        <PlatformOnboardingAction />
      );
    }
    if (activeTab === 'setup' && controller.activeSetupSubTab === 'admins' && perms.canAdmins) {
      return <PlatformAddAdminForm asTriggerOnly />;
    }
    return undefined;
  })();

  const hasAnyCapability = perms.canWorkspaces || perms.canAdmins || perms.canSystem;

  return (
    <ModuleScaffold
      seoTitle={`${controller.headerProps.title} | ${t('platform.consoleTitle')}`}
      seoDescription={controller.headerProps.subtitle}
      headerIcon={controller.headerProps.icon}
      headerTitle={controller.headerProps.title}
      headerSubtitle={controller.headerProps.subtitle}
      headerActions={headerActions}
      tabs={controller.topTabs}
      activeTab={controller.activeTab}
      onTabChange={controller.handleTabChange}
      panelIdPrefix="platform-main-tab"
    >
      <motion.div
        variants={containerVariants}
        initial={reducedMotion ? false : 'hidden'}
        animate="show"
        className="space-y-6"
      >
        {hasAnyCapability ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'work' && (
                <PlatformWorkTier
                  activeSubTab={controller.activeWorkSubTab}
                  onSubTabChange={controller.handleWorkSubTabChange}
                  canSystem={perms.canSystem}
                />
              )}

              {activeTab === 'reports' && (
                <PlatformReportsTier
                  activeSubTab={controller.activeReportsSubTab}
                  onSubTabChange={controller.handleReportsSubTabChange}
                />
              )}

              {activeTab === 'setup' && (
                <PlatformSetupTier
                  activeSubTab={controller.activeSetupSubTab}
                  onSubTabChange={controller.handleSetupSubTabChange}
                  canAdmins={perms.canAdmins}
                  canSystem={perms.canSystem}
                />
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          <motion.div variants={itemVariants}>
            <EmptyState
              icon={User}
              title={t('platform.adminNoCapabilities')}
              description={
                perms.canOnboard
                  ? t('platform.permOnboardDesc')
                  : t('platform.adminLimitedDescription')
              }
            />
          </motion.div>
        )}
      </motion.div>
    </ModuleScaffold>
  );
}

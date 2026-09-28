import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ModuleScaffold } from '@/components/common/ModuleScaffold';
import { PlatformAddAdminForm } from '@/platform/pages/PlatformAddAdminForm';
import { usePlatformAdmins } from '@/platform/hooks/usePlatformAdmins';
import { usePlatformPermissions } from '@/platform/hooks/usePlatformPermissions';
import { PlatformUsersCommandMetrics } from '@/platform/components/users/PlatformUsersCommandMetrics';
import { PlatformUsersWorkTier } from '@/platform/components/users/PlatformUsersWorkTier';
import { PlatformUsersReportsTier } from '@/platform/components/users/PlatformUsersReportsTier';
import { PlatformUsersSetupTier } from '@/platform/components/users/PlatformUsersSetupTier';
import type { AccordionTabItem } from '@/components/ui/ResponsiveAccordionTabs';

export type PlatformUsersTab = 'work' | 'reports' | 'setup';

export default function PlatformUsersPage(): React.JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const { canAdmins } = usePlatformPermissions();
  const { data: admins, isLoading, isError } = usePlatformAdmins();
  const [activeTab, setActiveTab] = useState<PlatformUsersTab>('work');

  const tabs: AccordionTabItem[] = [
    {
      id: 'work',
      label: t('module.work'),
      description: t('module.workHint'),
      icon: Users,
    },
    {
      id: 'reports',
      label: t('module.reports'),
      description: t('module.reportsHint'),
    },
    {
      id: 'setup',
      label: t('module.setup'),
      description: t('module.setupHint'),
    },
  ];

  return (
    <ModuleScaffold
      seoTitle={`${t('platform.adminsTitle')} | ${t('platform.consoleTitle')}`}
      seoDescription={t('platform.adminsSubtitle')}
      headerIcon={Users}
      headerTitle={t('platform.adminsTitle')}
      headerSubtitle={t('platform.adminsSubtitle')}
      headerActions={canAdmins ? <PlatformAddAdminForm asTriggerOnly /> : undefined}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id as PlatformUsersTab)}
      panelIdPrefix="platform-users-tab"
      metricsStrip={
        <PlatformUsersCommandMetrics admins={admins} loading={isLoading} error={isError} />
      }
    >
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'work' && <PlatformUsersWorkTier />}
            {activeTab === 'reports' && <PlatformUsersReportsTier />}
            {activeTab === 'setup' && <PlatformUsersSetupTier />}
          </motion.div>
        </AnimatePresence>
      </div>
    </ModuleScaffold>
  );
}

import React, { Suspense, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { ResponsiveAccordionTabs } from '@/components/ui/ResponsiveAccordionTabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useFilteredModuleTierTabs';
import { Users, BarChart3, Settings } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

// 1. Lazy-load tier components to minimize initial bundle impact
const ModuleWorkTab = React.lazy(() =>
  import('./ModuleWorkTab').then((m) => ({ default: m.ModuleWorkTab }))
);
const ModuleReportsTab = React.lazy(() =>
  import('./ModuleReportsTab').then((m) => ({ default: m.ModuleReportsTab }))
);
const ModuleSetupTab = React.lazy(() =>
  import('./ModuleSetupTab').then((m) => ({ default: m.ModuleSetupTab }))
);

/**
 * Canonical Three-Tier Module Page Scaffold.
 * Implements Work, Reports, and Setup tiers with URL synchronization and responsive accordion collapse.
 */
export function TemplateModulePage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'work';

  const handleTabChange = (tabId: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tabId);
      return next;
    });
  };

  const rawTabs = useMemo(
    () => [
      {
        id: 'work',
        label: t('module.workTier'),
        icon: Users,
        content: (
          <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
            <ModuleWorkTab />
          </Suspense>
        ),
      },
      {
        id: 'reports',
        label: t('module.reportsTier'),
        icon: BarChart3,
        content: (
          <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
            <ModuleReportsTab />
          </Suspense>
        ),
      },
      {
        id: 'setup',
        label: t('module.setupTier'),
        icon: Settings,
        content: (
          <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
            <ModuleSetupTab />
          </Suspense>
        ),
      },
    ],
    [t]
  );

  // Filters tiers based on user RBAC permissions
  const tabs = useFilteredModuleTierTabs('templateModule', rawTabs);

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t('module.title')}
        description={t('module.description')}
      />

      <ResponsiveAccordionTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </div>
  );
}

import React, { Suspense } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { useTrashMode } from '@/hooks/useTrashMode';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import { ModulePageShell } from '@/components/ui/ModulePageShell';
import { ModuleTierMotion } from '@/components/ui/ModuleTierMotion';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import RouteStatusFallback from '@/components/routing/RouteStatusFallback';
import { EXAMPLE_MODULE_MANIFEST } from '@mms/shared';

/**
 * Canonical three-tier module page scaffold (Work | Reports | Setup).
 *
 * Copy into your module feature folder (for example the accounting page in
 * `apps/frontend/src/tenant/features/accounting/AccountingPage.tsx`), replace
 * `Example`/`EXAMPLE_` with the module name, then register the page in
 * `apps/frontend/src/components/routing/HostRoutes.tsx`.
 *
 * Contract highlights this template deliberately encodes:
 *  - the header/tab shell comes from ModulePageShell (never hand-rolled)
 *  - the tier list comes from useFilteredModuleTierTabs (RBAC-filtered)
 *  - the ACTIVE tier is persisted state, not URL state (?view=trash is the only
 *    URL-owned view flag, and it belongs to the Work tier)
 */

const ExampleWorkTier = React.lazy(() =>
  import('./components/ExampleWorkTier').then((m) => ({ default: m.ExampleWorkTier })),
);
const ExampleReportsTier = React.lazy(() =>
  import('./components/ExampleReportsTier').then((m) => ({ default: m.ExampleReportsTier })),
);
const ExampleSetupTier = React.lazy(() =>
  import('./components/ExampleSetupTier').then((m) => ({ default: m.ExampleSetupTier })),
);

export default function ExamplePage() {
  const { t } = useTranslation();
  const { canWrite, canDelete, canReports: canViewReports, canViewSetup } =
    useModulePermissions(EXAMPLE_MODULE_MANIFEST);

  const tierTabs = useFilteredModuleTierTabs({ canViewSetup, canViewReports });
  const [activeTab, setActiveTab] = usePersistedTabState<string>('example_active_tab', 'work');
  const [showDeleted, setShowDeleted] = useTrashMode();

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t('nav.example')}`}
      seoDescription={t('page.example.subtitle')}
      headerTitle={t('nav.example')}
      headerSubtitle={t('page.example.subtitle')}
      tabs={tierTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      panelIdPrefix="example-tier"
    >
      <ErrorBoundary>
        <ModuleTierMotion tier={activeTab} className="space-y-4">
          <Suspense fallback={<RouteStatusFallback />}>
            {activeTab === 'work' && (
              <ExampleWorkTier
                canWrite={canWrite}
                canDelete={canDelete}
                showDeleted={showDeleted}
                onShowDeletedChange={() => setShowDeleted((prev) => !prev)}
              />
            )}
            {activeTab === 'reports' && <ExampleReportsTier />}
            {activeTab === 'setup' && <ExampleSetupTier />}
          </Suspense>
        </ModuleTierMotion>
      </ErrorBoundary>
    </ModulePageShell>
  );
}

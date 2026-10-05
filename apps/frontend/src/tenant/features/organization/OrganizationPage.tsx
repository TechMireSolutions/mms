import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Network, Sparkles } from 'lucide-react';
import { ORGANIZATION_MODULE_MANIFEST } from '@mms/shared';
import { ModulePageShell } from '@/components/ui/ModulePageShell';
import { ModuleTierMotion } from '@/components/ui/ModuleTierMotion';
import { ModuleTrashToggle } from '@/components/ui/ModuleTrashToggle';
import { ResponsiveAccordionTabs } from '@/components/ui/ResponsiveAccordionTabs';
import { Button } from '@/components/ui/button';
import { useDirectoryTrashState } from '@/hooks/useDirectoryTrashState';
import { useTranslation } from '@/hooks/useTranslation';
import { useIndustryTerminology } from '@/tenant/hooks/useIndustryTerminology';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import {
  useOrganizationPositions,
  useOrganizationLocations,
} from '@/tenant/hooks/collections/organization';
import { OrganizationChart } from './components/OrganizationChart';
import { OrganizationLocationsPanel } from './components/OrganizationLocationsPanel';
import { OrganizationArchivedPositions } from './components/OrganizationArchivedPositions';
import { OrganizationBlueprintModal } from './components/OrganizationBlueprintModal';

export default function OrganizationPage(): React.JSX.Element {
  const { t } = useTranslation();
  const terminology = useIndustryTerminology();
  const { canWrite, canDelete } = useModulePermissions(ORGANIZATION_MODULE_MANIFEST);
  const [activeTab, setActiveTab] = useState<'chart' | 'locations' | 'setup'>('chart');
  const [blueprintOpen, setBlueprintOpen] = useState(false);
  const [viewingDeleted, setViewingDeleted] = useDirectoryTrashState();

  const { data: positions = [] } = useOrganizationPositions({ includeDeleted: false });
  const { data: locations = [] } = useOrganizationLocations({ includeDeleted: false });

  const pageTabs = [
    { id: 'chart', label: t('organization.tree') },
    { id: 'locations', label: terminology.locationLabel },
    { id: 'setup', label: t('organization.blueprints') },
  ];

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t('nav.organization')}`}
      seoDescription={t('page.organization.subtitle')}
      headerIcon={Network}
      headerTitle={t('nav.organization')}
      headerSubtitle={t('page.organization.subtitle')}
      headerActions={
        canDelete ? (
          <ModuleTrashToggle
            viewingDeleted={viewingDeleted}
            onToggle={() => setViewingDeleted(!viewingDeleted)}
          />
        ) : undefined
      }
      metricsStrip={
        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
          <span>
            {t('organization.positions')}:{' '}
            <strong className="text-foreground">{positions.length}</strong>
          </span>
          <span>
            {terminology.locationLabel}:{' '}
            <strong className="text-foreground">{locations.length}</strong>
          </span>
        </div>
      }
    >
      <ResponsiveAccordionTabs
        tabs={pageTabs}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as 'chart' | 'locations' | 'setup')}
        panelIdPrefix="org-tab"
      >
        <AnimatePresence mode="wait">
          <ModuleTierMotion tier={activeTab} className="space-y-4">
            {activeTab === 'chart' && (
              viewingDeleted ? (
                <OrganizationArchivedPositions />
              ) : (
                <OrganizationChart canWrite={canWrite} canDelete={canDelete} />
              )
            )}
            {activeTab === 'locations' && (
              <OrganizationLocationsPanel
                canWrite={canWrite}
                canDelete={canDelete}
                viewingDeleted={viewingDeleted}
              />
            )}
            {activeTab === 'setup' && !viewingDeleted ? (
              <div className="w-full max-w-none rounded-lg border border-border bg-card p-5 space-y-3">
                <h3 className="font-semibold text-foreground text-wrap-balance">
                  {t('organization.blueprints')}
                </h3>
                <p className="text-xs text-muted-foreground text-wrap-pretty">
                  {t('organization.blueprint.applyHint')}
                </p>
                <Button
                  type="button"
                  className="min-h-11 gap-1.5"
                  onClick={() => setBlueprintOpen(true)}
                >
                  <Sparkles className="h-4 w-4" aria-hidden />
                  {t('organization.applyBlueprint')}
                </Button>
              </div>
            ) : null}
          </ModuleTierMotion>
        </AnimatePresence>
      </ResponsiveAccordionTabs>

      <OrganizationBlueprintModal
        open={blueprintOpen}
        onClose={() => setBlueprintOpen(false)}
      />
    </ModulePageShell>
  );
}

export { OrganizationPage };

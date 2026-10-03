import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Network } from 'lucide-react';
import { ModulePageShell } from '@/components/ui/ModulePageShell';
import { ModuleTierMotion } from '@/components/ui/ModuleTierMotion';
import { ResponsiveAccordionTabs } from '@/components/ui/ResponsiveAccordionTabs';
import { useTranslation } from '@/hooks/useTranslation';
import { useOrganizationPositions, useOrganizationLocations } from '@/tenant/hooks/collections/organization';
import { OrganizationChart } from './components/OrganizationChart';
import { OrganizationLocationsPanel } from './components/OrganizationLocationsPanel';

export default function OrganizationPage(): React.JSX.Element {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'chart' | 'locations'>('chart');

  const { data: positions = [] } = useOrganizationPositions();
  const { data: locations = [] } = useOrganizationLocations();

  const pageTabs = [
    { id: 'chart', label: t('organization.tree') },
    { id: 'locations', label: t('organization.locations') },
  ];

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t('nav.organization')}`}
      seoDescription={t('page.organization.subtitle')}
      headerIcon={Network}
      headerTitle={t('nav.organization')}
      headerSubtitle={t('page.organization.subtitle')}
      metricsStrip={
        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
          <span>
            {t('organization.positions')}:{' '}
            <strong className="text-foreground">{positions.length}</strong>
          </span>
          <span>
            {t('organization.locations')}:{' '}
            <strong className="text-foreground">{locations.length}</strong>
          </span>
        </div>
      }
    >
      <ResponsiveAccordionTabs
        tabs={pageTabs}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as 'chart' | 'locations')}
        panelIdPrefix="org-tab"
      >
        <AnimatePresence mode="wait">
          <ModuleTierMotion tier={activeTab} className="space-y-4">
            {activeTab === 'chart' && <OrganizationChart />}
            {activeTab === 'locations' && <OrganizationLocationsPanel />}
          </ModuleTierMotion>
        </AnimatePresence>
      </ResponsiveAccordionTabs>
    </ModulePageShell>
  );
}

export { OrganizationPage };

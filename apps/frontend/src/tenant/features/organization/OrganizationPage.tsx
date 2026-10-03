import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Network } from 'lucide-react';
import { ModulePageShell } from '@/components/ui/ModulePageShell';
import { ModuleTierMotion } from '@/components/ui/ModuleTierMotion';
import { ResponsiveAccordionTabs } from '@/components/ui/ResponsiveAccordionTabs';
import { useTranslation } from '@/hooks/useTranslation';
import { useOrganizationPositions, useOrganizationLocations } from '@/tenant/hooks/collections/organization';
import { OrganizationChart } from './components/OrganizationChart';

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
          <span>Positions: <strong className="text-foreground">{positions.length}</strong></span>
          <span>Locations: <strong className="text-foreground">{locations.length}</strong></span>
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

            {activeTab === 'locations' && (
              <div className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-foreground">
                    Physical Facilities & Locations
                  </h3>
                  <span className="text-xs text-muted-foreground font-mono">
                    {locations.length} locations configured
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {locations.map((loc) => (
                    <div
                      key={loc.id}
                      className="p-3 rounded-md border border-border bg-background space-y-1 text-start"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {loc.code}
                        </span>
                        <span className="text-[11px] font-medium text-primary capitalize">
                          {loc.type}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm text-foreground">{loc.name}</h4>
                      {loc.address ? (
                        <p className="text-xs text-muted-foreground line-clamp-1">{loc.address}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ModuleTierMotion>
        </AnimatePresence>
      </ResponsiveAccordionTabs>
    </ModulePageShell>
  );
}

export { OrganizationPage };

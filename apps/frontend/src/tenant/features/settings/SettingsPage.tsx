import React, { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings as SettingsIcon } from 'lucide-react';
import { ModulePageShell } from '@/components/ui/ModulePageShell';
import { useTranslation } from '@/hooks/useTranslation';
import { ResponsiveAccordionTabs, type AccordionTabItem } from '@/components/ui/ResponsiveAccordionTabs';
import { isSettingsSection, type SettingsSection } from '@/lib/config/routes';
import { SETTINGS_NAV } from '@/lib/config/settingsNavConfig';
import { SETTINGS_SECTION_COMPONENTS } from '@/lib/config/settingsSectionComponents';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { usePermissions } from '@/tenant/hooks/usePermissions';
import { SettingsTabProvider } from '@/lib/contexts/SettingsTabContext';
import { SettingsBrandingDraftProvider } from '@/lib/contexts/SettingsBrandingDraftContext';
import { SettingsGlobalDraftProvider } from '@/lib/contexts/SettingsGlobalDraftContext';

import { ModulePanelSuspenseFallback } from '@/components/ui/ModulePanelSuspenseFallback';

function SettingsContent({ section }: { section: SettingsSection }): React.JSX.Element {
  const Component = SETTINGS_SECTION_COMPONENTS[section];
  return (
    <Suspense fallback={<ModulePanelSuspenseFallback />}>
      <Component />
    </Suspense>
  );
}

/**
 * App-wide settings only. Per-module configuration lives in each module's
 * Configuration tab (Fields / Preferences). All sections share `/settings`.
 */
export default function Settings(): React.JSX.Element {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const [tab, setTab] = usePersistedTabState<SettingsSection>('mms-settings-tab', 'global');

  const handleTabChange = ((id: string) => {
      if (isSettingsSection(id)) {
        setTab(id);
      }
    });

  const visibleNav = SETTINGS_NAV.filter(
    (item) => !item.requiredPermission || can(item.requiredPermission),
  );
  const visibleIds = new Set(visibleNav.map((item) => item.id));
  // A persisted tab from a prior session/role (e.g. an admin-only section) that the
  // current user can no longer see falls back to General rather than rendering nothing.
  const effectiveTab: SettingsSection = visibleIds.has(tab) ? tab : 'global';

  const tabs: AccordionTabItem[] = visibleNav.map((item) => ({
    id: item.id,
    label: t(item.labelKey),
    icon: item.icon,
  }));

  return (
    <SettingsTabProvider value={{ activeTab: tab, setActiveTab: setTab }}>
      <SettingsGlobalDraftProvider>
        <SettingsBrandingDraftProvider
          saveSuccessMessage={t('branding.savedToast')}
          saveSuccessDescription={t('branding.savedToastDesc')}
        >
          <ModulePageShell
            seoTitle={`MMS - ${t('settings.title')}`}
            seoDescription={t('settings.subtitle')}
            headerIcon={SettingsIcon}
            headerTitle={t('settings.title')}
            headerSubtitle={t('settings.subtitle')}
          >
            <ResponsiveAccordionTabs
              tabs={tabs}
              activeTab={effectiveTab}
              onTabChange={handleTabChange}
              desktopLayout="sidebar"
              collapsible={false}
              panelIdPrefix="settings-panel"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={effectiveTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <SettingsContent section={effectiveTab} />
                </motion.div>
              </AnimatePresence>
            </ResponsiveAccordionTabs>
          </ModulePageShell>
        </SettingsBrandingDraftProvider>
      </SettingsGlobalDraftProvider>
    </SettingsTabProvider>
  );
}

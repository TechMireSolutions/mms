import React, { Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings as SettingsIcon } from 'lucide-react';
import { ModulePageShell } from '@/components/ui/ModulePageShell';
import { useTranslation } from '@/hooks/useTranslation';
import { ResponsiveAccordionTabs, type AccordionTabItem } from '@/components/ui/ResponsiveAccordionTabs';
import { isSettingsSection, type SettingsSection } from '@/lib/config/routes';
import { SETTINGS_NAV } from '@/lib/config/settingsNavConfig';
import { SETTINGS_SECTION_COMPONENTS } from '@/lib/config/settingsSectionComponents';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { SettingsTabProvider } from '@/lib/contexts/SettingsTabContext';
import { SettingsBrandingDraftProvider } from '@/lib/contexts/SettingsBrandingDraftContext';
import { SettingsGlobalDraftProvider } from '@/lib/contexts/SettingsGlobalDraftContext';

function SettingsContent({ section }: { section: SettingsSection }): React.JSX.Element {
  const { t } = useTranslation();
  const Component = SETTINGS_SECTION_COMPONENTS[section];
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
          <div
            className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary"
            aria-hidden
          />
          <span className="sr-only">{t('common.loading')}</span>
        </div>
      }
    >
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
  const [tab, setTab] = usePersistedTabState<SettingsSection>('mms-settings-tab', 'global');

  const handleTabChange = useCallback(
    (id: string) => {
      if (isSettingsSection(id)) {
        setTab(id);
      }
    },
    [setTab],
  );

  const tabs: AccordionTabItem[] = SETTINGS_NAV.map((item) => ({
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
              activeTab={tab}
              onTabChange={handleTabChange}
              desktopLayout="sidebar"
              collapsible={false}
              panelIdPrefix="settings-panel"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <SettingsContent section={tab} />
                </motion.div>
              </AnimatePresence>
            </ResponsiveAccordionTabs>
          </ModulePageShell>
        </SettingsBrandingDraftProvider>
      </SettingsGlobalDraftProvider>
    </SettingsTabProvider>
  );
}

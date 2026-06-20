import React, { Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings as SettingsIcon } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import useTranslation from '@/hooks/useTranslation';
import ResponsiveAccordionTabs, { type AccordionTabItem } from '@/components/ui/ResponsiveAccordionTabs';
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
    description: t(item.descKey),
    icon: item.icon,
  }));

  const activeNav = SETTINGS_NAV.find((item) => item.id === tab);
  const ActiveIcon = activeNav?.icon;

  return (
    <SettingsTabProvider value={{ activeTab: tab, setActiveTab: setTab }}>
      <SettingsGlobalDraftProvider>
        <SettingsBrandingDraftProvider
          saveSuccessMessage={t('branding.savedToast')}
          saveSuccessDescription={t('branding.savedToastDesc')}
        >
          <div className="mx-auto max-w-7xl space-y-5">
            <title>MMS - {t('settings.title')}</title>
            <meta name="description" content={t('settings.subtitle')} />
            <PageHeader
              icon={SettingsIcon}
              title={t('settings.title')}
              subtitle={t('settings.subtitle')}
            />

            <ResponsiveAccordionTabs
              tabs={tabs}
              activeTab={tab}
              onTabChange={handleTabChange}
              desktopLayout="sidebar"
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
                  {activeNav && ActiveIcon ? (
                    <div className="mb-5 hidden items-start gap-3 border-b border-border/60 pb-4 lg:flex">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <ActiveIcon className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <h2 className="text-base font-bold text-foreground">{t(activeNav.labelKey)}</h2>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {t(activeNav.descKey)}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  <SettingsContent section={tab} />
                </motion.div>
              </AnimatePresence>
            </ResponsiveAccordionTabs>
          </div>
        </SettingsBrandingDraftProvider>
      </SettingsGlobalDraftProvider>
    </SettingsTabProvider>
  );
}

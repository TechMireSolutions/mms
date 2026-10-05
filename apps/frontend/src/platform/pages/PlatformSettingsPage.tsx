import React, { useState, Suspense } from 'react';
import { Settings, Globe, Palette, Server, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ModulePageShell } from '@/components/ui/ModulePageShell';
import { ResponsiveAccordionTabs, type AccordionTabItem } from '@/components/ui/ResponsiveAccordionTabs';
import { CardSkeleton } from '@/components/ui/LoadingState';
import { PlatformGlobalSettingsPanel } from '@/platform/components/settings/PlatformGlobalSettingsPanel';
import { PlatformThemeSettingsPanel } from '@/platform/components/settings/PlatformThemeSettingsPanel';
import { PlatformSystemSettingsPanel } from '@/platform/components/settings/PlatformSystemSettingsPanel';
import { PlatformSecuritySettingsPanel } from '@/platform/components/settings/PlatformSecuritySettingsPanel';

export type PlatformSettingsSection = 'global' | 'theme' | 'system' | 'security';

export default function PlatformSettingsPage(): React.JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [activeSection, setActiveSection] = useState<PlatformSettingsSection>('global');

  const tabs: AccordionTabItem[] = [
    {
      id: 'global',
      label: t('platform.settingsTabGlobal'),
      icon: Globe,
    },
    {
      id: 'theme',
      label: t('platform.settingsTabTheme'),
      icon: Palette,
    },
    {
      id: 'system',
      label: t('platform.systemMaintenance'),
      icon: Server,
    },
    {
      id: 'security',
      label: t('platform.settingsTabSecurity'),
      icon: ShieldCheck,
    },
  ];

  return (
    <ModulePageShell
      seoTitle={`${t('platform.settingsPageTitle')} | ${t('platform.consoleTitle')}`}
      seoDescription={t('platform.settingsPageSubtitle')}
      headerIcon={Settings}
      headerTitle={t('platform.settingsPageTitle')}
      headerSubtitle={t('platform.settingsPageSubtitle')}
    >
      <ResponsiveAccordionTabs
        tabs={tabs}
        activeTab={activeSection}
        onTabChange={(id) => setActiveSection(id as PlatformSettingsSection)}
        desktopLayout="sidebar"
        collapsible={false}
        panelIdPrefix="platform-settings-panel"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <Suspense fallback={<CardSkeleton count={2} />}>
              {activeSection === 'global' && <PlatformGlobalSettingsPanel />}
              {activeSection === 'theme' && <PlatformThemeSettingsPanel />}
              {activeSection === 'system' && <PlatformSystemSettingsPanel />}
              {activeSection === 'security' && <PlatformSecuritySettingsPanel />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </ResponsiveAccordionTabs>
    </ModulePageShell>
  );
}

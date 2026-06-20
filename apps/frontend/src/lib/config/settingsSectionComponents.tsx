import React, { lazy, type LazyExoticComponent } from 'react';
import type { SettingsSection } from '@/lib/config/routes';

const GlobalSettings = lazy(() => import('@/components/settings/GlobalSettings'));
const SystemModulesSettings = lazy(() => import('@/components/settings/SystemModulesSettings'));
const BrandingSettings = lazy(() => import('@/components/settings/BrandingSettings'));
const ThemeSettings = lazy(() => import('@/components/settings/ThemeSettings'));
const BackupRestore = lazy(() => import('@/components/settings/BackupRestore'));

export const SETTINGS_SECTION_COMPONENTS: Record<
  SettingsSection,
  LazyExoticComponent<() => React.JSX.Element>
> = {
  global: GlobalSettings,
  modules: SystemModulesSettings,
  branding: BrandingSettings,
  theme: ThemeSettings,
  backup: BackupRestore,
};

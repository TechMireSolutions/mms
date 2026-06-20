import { Boxes, Database, Globe, Palette, Sparkles, type LucideIcon } from 'lucide-react';
import type { AppTranslationKey } from '@mms/shared';
import { SETTINGS_SECTIONS, type SettingsSection } from '@/lib/config/routes';

export interface SettingsNavItem {
  id: SettingsSection;
  labelKey: AppTranslationKey;
  descKey: AppTranslationKey;
  icon: LucideIcon;
}

/** Sidebar order for `/settings` — keep ids aligned with {@link SETTINGS_SECTIONS}. */
export const SETTINGS_NAV: SettingsNavItem[] = [
  { id: 'global', labelKey: 'settings.global', descKey: 'settings.globalDesc', icon: Globe },
  { id: 'branding', labelKey: 'settings.branding', descKey: 'settings.brandingDesc', icon: Palette },
  { id: 'theme', labelKey: 'settings.theme', descKey: 'settings.themeDesc', icon: Sparkles },
  { id: 'modules', labelKey: 'settings.modules', descKey: 'settings.modulesDesc', icon: Boxes },
  { id: 'backup', labelKey: 'settings.backup', descKey: 'settings.backupDesc', icon: Database },
];

const navIds = new Set(SETTINGS_NAV.map((item) => item.id));
if (SETTINGS_SECTIONS.some((id) => !navIds.has(id))) {
  throw new Error('SETTINGS_NAV is missing one or more SETTINGS_SECTIONS entries');
}

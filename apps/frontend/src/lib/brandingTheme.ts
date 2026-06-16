import {
  BRANDING_THEME_VARIABLES,
  applyDocumentLanguage,
  buildBrandingCssVariables,
  type BrandingSettings,
  type BrandingThemeMode,
  type GlobalSettings,
} from '@mms/shared';
import { isApexHost } from '@mms/shared';
import {
  getScopedBrandingSettings,
  getScopedGlobalSettings,
} from './settingsPreviewStore';
import { getAppDomain } from './config/tenantConfig';
import { isEntryPath } from './config/routes';
import { isTenantHost, MMS_PLATFORM_GLOBAL_SETTINGS } from './themeScope';

function resolveDocumentLanguage(storedLanguage: string, pathname: string): string {
  const isApex =
    typeof window !== 'undefined'
      ? isApexHost(window.location.hostname, getAppDomain())
      : true;
  return isEntryPath(pathname, { isApex }) ? 'en' : storedLanguage;
}

function resolveThemeMode(settings: GlobalSettings): BrandingThemeMode {
  const root = document.documentElement;
  if (settings.theme === 'dark') return 'dark';
  if (settings.theme === 'light') return 'light';
  return root.classList.contains('dark') ? 'dark' : 'light';
}

/**
 * Applies branding colours to CSS variables.
 * Apex host: MMS platform defaults only. Tenant host: institution branding.
 */
export function applyBrandingTheme(
  branding?: Pick<BrandingSettings, 'primaryColor' | 'secondaryColor'>,
  mode?: BrandingThemeMode,
): void {
  const root = document.documentElement;
  const settings = getScopedGlobalSettings();
  const activeMode = mode ?? resolveThemeMode(settings);
  const scoped = getScopedBrandingSettings();
  const merged = branding
    ? { ...scoped, ...branding }
    : scoped;

  const variables = buildBrandingCssVariables(
    merged.primaryColor,
    merged.secondaryColor,
    activeMode,
  );

  for (const key of BRANDING_THEME_VARIABLES) {
    const value = variables[key];
    if (value) root.style.setProperty(key, value);
  }
}

export type AppThemeOverrides = Partial<Pick<GlobalSettings, 'theme' | 'language'>>;

/**
 * Applies global theme class plus branding tokens for the active host scope.
 */
export function applyAppTheme(pathname?: string, overrides?: AppThemeOverrides): void {
  const base = isTenantHost() ? getScopedGlobalSettings() : MMS_PLATFORM_GLOBAL_SETTINGS;
  const settings = { ...base, ...overrides };
  const root = document.documentElement;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const activeTheme = settings.theme === 'system' ? systemTheme : settings.theme;
  const activePath =
    pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '/');

  if (activeTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  applyDocumentLanguage(resolveDocumentLanguage(settings.language, activePath));

  applyBrandingTheme(undefined, activeTheme);
}

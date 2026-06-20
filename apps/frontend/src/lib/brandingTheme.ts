import {
  BRANDING_THEME_VARIABLES,
  brandingPrimaryToThemeColor,
  buildBrandingCssVariables,
  isApexHost,
  normalizeBrandingCornerStyle,
  resolveBrandingCornerRadius,
  type BrandingSettings,
  type BrandingThemeMode,
  type GlobalSettings,
} from '@mms/shared';
import {
  getScopedBrandingSettings,
  getScopedGlobalSettings,
} from './settingsPreviewStore';
import { getAppDomain } from './config/tenantConfig';
import { isEntryPath } from './config/routes';
import { isTenantHost, MMS_PLATFORM_BRANDING, MMS_PLATFORM_GLOBAL_SETTINGS } from '@/platform/lib/themeScope';
import {
  applyApexPlatformTheme,
  applyBrandingFromSettings,
  applyDocumentLanguageWithFonts,
  resolveThemeMode,
} from './brandingThemeCore';

export { applyApexPlatformTheme, applyTenantEntryTheme } from './brandingThemeCore';

function resolveDocumentLanguage(storedLanguage: string, pathname: string): string {
  const isApex =
    typeof window !== 'undefined'
      ? isApexHost(window.location.hostname, getAppDomain())
      : true;
  return isEntryPath(pathname, { isApex }) ? 'en' : storedLanguage;
}

function syncDocumentChrome(mode: BrandingThemeMode, primaryHex: string): void {
  const root = document.documentElement;
  root.style.colorScheme = mode;
  root.dataset.theme = mode;

  const themeColor = brandingPrimaryToThemeColor(primaryHex);
  let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = themeColor;
}

/**
 * Applies branding colours to CSS variables.
 * Apex host: MMS platform defaults only. Tenant host: institution branding.
 */
export function applyBrandingTheme(
  branding?: Partial<Pick<BrandingSettings, 'primaryColor' | 'secondaryColor' | 'cornerStyle'>>,
  mode?: BrandingThemeMode,
): void {
  if (!isTenantHost()) {
    const activeMode = mode ?? resolveThemeMode(MMS_PLATFORM_GLOBAL_SETTINGS);
    const merged = branding ? { ...MMS_PLATFORM_BRANDING, ...branding } : MMS_PLATFORM_BRANDING;
    applyBrandingFromSettings(merged, activeMode);
    return;
  }

  const root = document.documentElement;
  const settings = getScopedGlobalSettings();
  const activeMode = mode ?? resolveThemeMode(settings);
  const scoped = getScopedBrandingSettings();
  const merged = branding ? { ...scoped, ...branding } : scoped;

  const variables = buildBrandingCssVariables(
    merged.primaryColor,
    merged.secondaryColor,
    activeMode,
  );

  for (const key of BRANDING_THEME_VARIABLES) {
    const value = variables[key];
    if (value) root.style.setProperty(key, value);
  }

  const cornerStyle = normalizeBrandingCornerStyle(merged.cornerStyle);
  root.style.setProperty('--radius', resolveBrandingCornerRadius(cornerStyle));

  syncDocumentChrome(activeMode, merged.primaryColor);
}

export type AppThemeOverrides = Partial<Pick<GlobalSettings, 'theme' | 'language'>>;

/**
 * Applies global theme class plus branding tokens for the active host scope.
 */
export function applyAppTheme(pathname?: string, overrides?: AppThemeOverrides): void {
  const activePath =
    pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '/');

  if (!isTenantHost()) {
    const language = isEntryPath(activePath, { isApex: true }) ? 'en' : MMS_PLATFORM_GLOBAL_SETTINGS.language;
    applyApexPlatformTheme(language);
    return;
  }

  const base = getScopedGlobalSettings();
  const settings = { ...base, ...overrides };
  const root = document.documentElement;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const activeTheme = settings.theme === 'system' ? systemTheme : settings.theme;

  if (activeTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  applyDocumentLanguageWithFonts(resolveDocumentLanguage(settings.language, activePath));

  applyBrandingTheme(undefined, activeTheme);
}

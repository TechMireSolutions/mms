import {
  BRANDING_THEME_VARIABLES,
  applyDocumentLanguage,
  brandingPrimaryToThemeColor,
  buildBrandingCssVariables,
  DEFAULT_BRANDING_SETTINGS,
  DEFAULT_GLOBAL_SETTINGS,
  mergeBrandingSettings,
  normalizeAppLanguage,
  normalizeBrandingCornerStyle,
  resolveBrandingCornerRadius,
  type BrandingSettings,
  type BrandingThemeMode,
  type GlobalSettings,
  type PublicBranding,
} from '@mms/shared';
import { MMS_PLATFORM_BRANDING, MMS_PLATFORM_GLOBAL_SETTINGS } from '@/platform/lib/themeScope';
import { ensureLocaleFontsLoaded } from '@/lib/localeFonts';

function resolveThemeMode(settings: GlobalSettings): BrandingThemeMode {
  const root = document.documentElement;
  if (settings.theme === 'dark') return 'dark';
  if (settings.theme === 'light') return 'light';
  return root.classList.contains('dark') ? 'dark' : 'light';
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

/** Applies branding tokens from explicit settings — no localStorage / db imports. */
export function applyBrandingFromSettings(
  branding: BrandingSettings,
  mode: BrandingThemeMode,
): void {
  const root = document.documentElement;
  const variables = buildBrandingCssVariables(
    branding.primaryColor,
    branding.secondaryColor,
    mode,
  );

  for (const key of BRANDING_THEME_VARIABLES) {
    const value = variables[key];
    if (value) root.style.setProperty(key, value);
  }

  const cornerStyle = normalizeBrandingCornerStyle(branding.cornerStyle);
  root.style.setProperty('--radius', resolveBrandingCornerRadius(cornerStyle));
  syncDocumentChrome(mode, branding.primaryColor);
}

function applyDocumentLanguageWithFonts(language: string): void {
  const normalized = normalizeAppLanguage(language);
  applyDocumentLanguage(normalized);
  ensureLocaleFontsLoaded(normalized);
}

/** Lightweight apex boot theme — platform defaults only, English entry fonts. */
export function applyApexPlatformTheme(language = 'en'): void {
  const settings = MMS_PLATFORM_GLOBAL_SETTINGS;
  const root = document.documentElement;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const activeTheme = settings.theme === 'system' ? systemTheme : settings.theme;

  if (activeTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  applyDocumentLanguageWithFonts(language);
  applyBrandingFromSettings(MMS_PLATFORM_BRANDING, activeTheme);
}

/** Tenant auth entry theme — public workspace branding, English/LTR, no db reads. */
export function applyTenantEntryTheme(branding: PublicBranding): void {
  const settings = DEFAULT_GLOBAL_SETTINGS;
  const root = document.documentElement;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const activeTheme = settings.theme === 'system' ? systemTheme : settings.theme;

  if (activeTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  applyDocumentLanguageWithFonts('en');
  applyBrandingFromSettings(
    mergeBrandingSettings({ ...DEFAULT_BRANDING_SETTINGS, ...branding }),
    activeTheme,
  );
}

export { resolveThemeMode, syncDocumentChrome, applyDocumentLanguageWithFonts };

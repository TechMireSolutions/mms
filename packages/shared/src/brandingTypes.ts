import type { AppTranslationKey } from "./appTranslations.js";
import { translateAppParams } from "./appTranslations.js";
import {
  DEFAULT_BRANDING_CORNER_STYLE,
  normalizeBrandingCornerStyle,
  type BrandingCornerStyle,
} from "./brandingCornerStyle.js";
import { normalizeToE164, parsePhoneNumber } from "./utils.js";

const BRANDING_HEX = /^#[0-9a-f]{6}$/i;

function normalizeBrandingHexLocal(raw: string | undefined, fallback: string): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return fallback.toLowerCase();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (!BRANDING_HEX.test(withHash)) return fallback.toLowerCase();
  return withHash.toLowerCase();
}

/** A single social profile link on the institution branding record. */
export interface BrandingSocialLink {
  platform: string;
  url: string;
}

export const BRANDING_NAME_MAX = 60;
export const BRANDING_FOOTER_MAX = 120;

/** Singleton object stored under the `branding` key. */
export interface BrandingSettings {
  madrasaName: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  /** UI corner roundness — injected as CSS `--radius` on tenant hosts. */
  cornerStyle: BrandingCornerStyle;
  logoUrl: string;
  faviconUrl: string;
  footerText: string;
  email: string;
  phone: string;
  website: string;
  legalName: string;
  registrationNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  socialLinks: BrandingSocialLink[];
}

/** Branding fields safe to expose on public auth/workspace routes. */
export type PublicBranding = Pick<
  BrandingSettings,
  'madrasaName' | 'tagline' | 'logoUrl' | 'faviconUrl' | 'primaryColor' | 'secondaryColor'
>;

/** Preset social platforms for branding profile links. */
export const BRANDING_SOCIAL_PLATFORMS = [
  'Facebook',
  'Instagram',
  'X (Twitter)',
  'LinkedIn',
  'YouTube',
  'TikTok',
  'WhatsApp',
  'Telegram',
] as const;

export type BrandingSocialPlatformId = (typeof BRANDING_SOCIAL_PLATFORMS)[number];

/** Registry entries for social platform pickers (stable id + translation key). */
export const BRANDING_SOCIAL_PLATFORM_DEFS: readonly {
  id: BrandingSocialPlatformId;
  labelKey: AppTranslationKey;
}[] = [
  { id: 'Facebook', labelKey: 'branding.socialPlatformFacebook' },
  { id: 'Instagram', labelKey: 'branding.socialPlatformInstagram' },
  { id: 'X (Twitter)', labelKey: 'branding.socialPlatformX' },
  { id: 'LinkedIn', labelKey: 'branding.socialPlatformLinkedIn' },
  { id: 'YouTube', labelKey: 'branding.socialPlatformYouTube' },
  { id: 'TikTok', labelKey: 'branding.socialPlatformTikTok' },
  { id: 'WhatsApp', labelKey: 'branding.socialPlatformWhatsApp' },
  { id: 'Telegram', labelKey: 'branding.socialPlatformTelegram' },
] as const;

export const BRANDING_SOCIAL_PLACEHOLDERS: Record<string, string> = {
  Facebook: 'https://facebook.com/your-page',
  Instagram: 'https://instagram.com/your-page',
  'X (Twitter)': 'https://x.com/your-page',
  LinkedIn: 'https://linkedin.com/company/your-page',
  YouTube: 'https://youtube.com/@your-channel',
  TikTok: 'https://tiktok.com/@your-page',
  WhatsApp: '+44 7700 900000',
  Telegram: 'https://t.me/your-page',
};

/** Curated brand colour palettes (primary + accent) for theme settings and onboarding. */
export const BRANDING_THEME_PRESETS = [
  {
    id: 'emerald',
    labelKey: 'theme.presetEmerald',
    primaryColor: '#047857',
    secondaryColor: '#c2410c',
    category: 'green',
  },
  {
    id: 'teal',
    labelKey: 'theme.presetTeal',
    primaryColor: '#0f766e',
    secondaryColor: '#b45309',
    category: 'green',
  },
  {
    id: 'blue',
    labelKey: 'theme.presetBlue',
    primaryColor: '#1d4ed8',
    secondaryColor: '#b45309',
    category: 'blue',
  },
  {
    id: 'indigo',
    labelKey: 'theme.presetIndigo',
    primaryColor: '#4338ca',
    secondaryColor: '#c2410c',
    category: 'blue',
  },
  {
    id: 'purple',
    labelKey: 'theme.presetPurple',
    primaryColor: '#7e22ce',
    secondaryColor: '#b45309',
    category: 'blue',
  },
  {
    id: 'rose',
    labelKey: 'theme.presetRose',
    primaryColor: '#be123c',
    secondaryColor: '#334155',
    category: 'warm',
  },
  {
    id: 'amber',
    labelKey: 'theme.presetAmber',
    primaryColor: '#b45309',
    secondaryColor: '#047857',
    category: 'warm',
  },
  {
    id: 'slate',
    labelKey: 'theme.presetSlate',
    primaryColor: '#334155',
    secondaryColor: '#c2410c',
    category: 'neutral',
  },
] as const;

export const BRANDING_TAGLINE_MAX = 80;

/** Default copyright footer for auth screens and documents (locale-aware). */
export function formatBrandingFooterDefault(madrasaName: string, language: string): string {
  const name = madrasaName.trim() || DEFAULT_BRANDING_SETTINGS.madrasaName;
  const year = new Date().getFullYear();
  return translateAppParams("theme.footerDefault", language, { year, name });
}

/** Inputs collected during madrasa onboarding that map to the branding record. */
export interface OnboardingBrandingInput {
  madrasaName: string;
  tagline?: string;
  subdomain: string;
  country?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  adminEmail?: string;
  adminPhone?: string;
  website?: string;
  footerText?: string;
}

/**
 * Builds a complete `branding` object from onboarding (sign-in page + settings tab).
 */
export function buildBrandingFromOnboarding(input: OnboardingBrandingInput): BrandingSettings {
  const name = input.madrasaName.trim() || DEFAULT_BRANDING_SETTINGS.madrasaName;
  const logo = input.logoUrl?.trim() ?? '';

  return mergeBrandingSettings({
    madrasaName: name,
    tagline: input.tagline?.trim() || DEFAULT_BRANDING_SETTINGS.tagline,
    primaryColor: input.primaryColor ?? DEFAULT_BRANDING_SETTINGS.primaryColor,
    secondaryColor: input.secondaryColor ?? DEFAULT_BRANDING_SETTINGS.secondaryColor,
    logoUrl: logo,
    faviconUrl: logo,
    footerText: input.footerText?.trim() || formatBrandingFooterDefault(name, 'en'),
    legalName: name,
    country: input.country?.trim() ?? '',
    email: input.adminEmail?.trim() ?? '',
    phone: input.adminPhone?.trim() ?? '',
    website: input.website?.trim() ?? '',
  });
}

/** Hardcoded MMS platform theme (apex domain). Tenant workspaces customise via the `branding` object. */
export const DEFAULT_BRANDING_SETTINGS: BrandingSettings = {
  madrasaName: 'MMS',
  tagline: 'Nurturing Knowledge & Character',
  primaryColor: '#047857',
  secondaryColor: '#c2410c',
  cornerStyle: DEFAULT_BRANDING_CORNER_STYLE,
  logoUrl: '',
  faviconUrl: '',
  footerText: '© 2026 MMS. All rights reserved.',
  email: '',
  phone: '',
  website: '',
  legalName: '',
  registrationNumber: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
  socialLinks: [],
};

type LegacyBranding = Partial<BrandingSettings> & { address?: string };

/** Extracts login-safe branding fields from a merged settings record. */
export function toPublicBranding(settings: BrandingSettings): PublicBranding {
  return {
    madrasaName: settings.madrasaName,
    tagline: settings.tagline,
    logoUrl: settings.logoUrl,
    faviconUrl: settings.faviconUrl,
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
  };
}

/**
 * Merges partial or legacy branding payloads with defaults.
 * Supports the legacy single-line `address` field used by older invoice templates.
 */
/** Institution identity fields — name, contact, assets, address, social (not theme colours). */
export type BrandingIdentityFields = Pick<
  BrandingSettings,
  | 'madrasaName'
  | 'tagline'
  | 'logoUrl'
  | 'faviconUrl'
  | 'email'
  | 'phone'
  | 'website'
  | 'legalName'
  | 'registrationNumber'
  | 'addressLine1'
  | 'addressLine2'
  | 'city'
  | 'region'
  | 'postalCode'
  | 'country'
  | 'socialLinks'
>;

/** Theme / appearance fields stored on the same branding record. */
export type BrandingThemeFields = Pick<
  BrandingSettings,
  'primaryColor' | 'secondaryColor' | 'cornerStyle' | 'footerText'
>;

/** Keys tracked for dirty/preview on Settings → Institution. */
export const BRANDING_IDENTITY_FIELD_KEYS = [
  'madrasaName',
  'tagline',
  'logoUrl',
  'faviconUrl',
  'email',
  'phone',
  'website',
  'legalName',
  'registrationNumber',
  'addressLine1',
  'addressLine2',
  'city',
  'region',
  'postalCode',
  'country',
  'socialLinks',
] as const satisfies readonly (keyof BrandingIdentityFields)[];

/** Keys tracked for dirty/preview on Settings → Theme. */
export const BRANDING_THEME_FIELD_KEYS = [
  'primaryColor',
  'secondaryColor',
  'cornerStyle',
  'footerText',
] as const satisfies readonly (keyof BrandingThemeFields)[];

/** Picks a subset of branding fields for scoped dirty checks and preview patches. */
export function pickBrandingFields<K extends keyof BrandingSettings>(
  settings: BrandingSettings,
  keys: readonly K[],
): Pick<BrandingSettings, K> {
  const result = {} as Pick<BrandingSettings, K>;
  for (const key of keys) {
    result[key] = settings[key];
  }
  return result;
}

/** Returns whether any field in `keys` differs between draft and persisted baseline. */
export function isBrandingFieldsDirty(
  data: BrandingSettings,
  baseline: BrandingSettings,
  keys: readonly (keyof BrandingSettings)[],
): boolean {
  return (
    JSON.stringify(pickBrandingFields(data, keys)) !==
    JSON.stringify(pickBrandingFields(baseline, keys))
  );
}

/**
 * Resets institution identity to defaults while preserving theme colours and footer.
 */
export function resetBrandingIdentity(current: BrandingSettings): BrandingSettings {
  return mergeBrandingSettings({
    ...current,
    madrasaName: DEFAULT_BRANDING_SETTINGS.madrasaName,
    tagline: DEFAULT_BRANDING_SETTINGS.tagline,
    logoUrl: DEFAULT_BRANDING_SETTINGS.logoUrl,
    faviconUrl: DEFAULT_BRANDING_SETTINGS.faviconUrl,
    email: DEFAULT_BRANDING_SETTINGS.email,
    phone: DEFAULT_BRANDING_SETTINGS.phone,
    website: DEFAULT_BRANDING_SETTINGS.website,
    legalName: DEFAULT_BRANDING_SETTINGS.legalName,
    registrationNumber: DEFAULT_BRANDING_SETTINGS.registrationNumber,
    addressLine1: DEFAULT_BRANDING_SETTINGS.addressLine1,
    addressLine2: DEFAULT_BRANDING_SETTINGS.addressLine2,
    city: DEFAULT_BRANDING_SETTINGS.city,
    region: DEFAULT_BRANDING_SETTINGS.region,
    postalCode: DEFAULT_BRANDING_SETTINGS.postalCode,
    country: DEFAULT_BRANDING_SETTINGS.country,
    socialLinks: [],
  });
}

/**
 * Resets brand colours and footer copy to defaults while preserving institution identity
 * (name, logo, contact, address, social links, etc.).
 */
export function resetBrandingAppearance(
  current: BrandingSettings,
  language: string,
): BrandingSettings {
  const name = current.madrasaName.trim() || DEFAULT_BRANDING_SETTINGS.madrasaName;
  return mergeBrandingSettings({
    ...current,
    primaryColor: DEFAULT_BRANDING_SETTINGS.primaryColor,
    secondaryColor: DEFAULT_BRANDING_SETTINGS.secondaryColor,
    cornerStyle: DEFAULT_BRANDING_SETTINGS.cornerStyle,
    footerText: formatBrandingFooterDefault(name, language),
  });
}

function trimField(value: string | undefined, maxLen?: number): string {
  const trimmed = (value ?? '').trim();
  if (maxLen !== undefined && trimmed.length > maxLen) {
    return trimmed.slice(0, maxLen);
  }
  return trimmed;
}

function normalizeBrandingPhone(phone: string | undefined): string {
  const trimmed = trimField(phone);
  if (!trimmed) return '';
  const parsed = parsePhoneNumber(trimmed);
  return normalizeToE164(parsed.countryCode, parsed.number);
}

function normalizeSocialLinks(links: BrandingSocialLink[] | undefined): BrandingSocialLink[] {
  if (!Array.isArray(links)) return [];
  const allowed = new Set<string>(BRANDING_SOCIAL_PLATFORMS);
  return links
    .map((link) => ({
      platform: allowed.has(link.platform) ? link.platform : BRANDING_SOCIAL_PLATFORMS[0],
      url: (link.url ?? '').trim(),
    }))
    .filter((link) => link.url.length > 0);
}

export function mergeBrandingSettings(partial: LegacyBranding | null | undefined): BrandingSettings {
  const merged: BrandingSettings = {
    ...DEFAULT_BRANDING_SETTINGS,
    ...(partial ?? {}),
    madrasaName:
      partial && 'madrasaName' in partial
        ? trimField(partial.madrasaName, BRANDING_NAME_MAX)
        : DEFAULT_BRANDING_SETTINGS.madrasaName,
    tagline:
      partial && 'tagline' in partial
        ? trimField(partial.tagline, BRANDING_TAGLINE_MAX)
        : DEFAULT_BRANDING_SETTINGS.tagline,
    email: trimField(partial?.email),
    phone: normalizeBrandingPhone(partial?.phone),
    website: trimField(partial?.website),
    legalName: trimField(partial?.legalName),
    registrationNumber: trimField(partial?.registrationNumber),
    addressLine1: trimField(partial?.addressLine1),
    addressLine2: trimField(partial?.addressLine2),
    city: trimField(partial?.city),
    region: trimField(partial?.region),
    postalCode: trimField(partial?.postalCode),
    country: trimField(partial?.country),
    logoUrl: partial?.logoUrl ?? DEFAULT_BRANDING_SETTINGS.logoUrl,
    faviconUrl: partial?.faviconUrl ?? DEFAULT_BRANDING_SETTINGS.faviconUrl,
    footerText:
      partial && 'footerText' in partial
        ? trimField(partial.footerText, BRANDING_FOOTER_MAX)
        : DEFAULT_BRANDING_SETTINGS.footerText,
    primaryColor: normalizeBrandingHexLocal(
      partial?.primaryColor,
      DEFAULT_BRANDING_SETTINGS.primaryColor,
    ),
    secondaryColor: normalizeBrandingHexLocal(
      partial?.secondaryColor,
      DEFAULT_BRANDING_SETTINGS.secondaryColor,
    ),
    cornerStyle: normalizeBrandingCornerStyle(partial?.cornerStyle),
    socialLinks: normalizeSocialLinks(partial?.socialLinks),
  };

  if (partial?.address && !partial.addressLine1) {
    merged.addressLine1 = trimField(partial.address);
  }

  return merged;
}

/**
 * Formats structured address fields into a single line for invoices and print views.
 */
export function formatBrandingAddress(
  branding: Pick<
    BrandingSettings,
    'addressLine1' | 'addressLine2' | 'city' | 'region' | 'postalCode' | 'country'
  >,
): string {
  const locality = [branding.city, branding.region].filter(Boolean).join(', ');
  return [branding.addressLine1, branding.addressLine2, locality, branding.postalCode, branding.country]
    .filter(Boolean)
    .join(', ');
}

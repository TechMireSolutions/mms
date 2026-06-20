import type { AppTranslationKey } from './appTranslations.js';

/** Tenant-selectable UI corner roundness — maps to CSS `--radius`. */
export const BRANDING_CORNER_STYLE_VALUES = ['sharp', 'subtle', 'rounded', 'soft'] as const;

export type BrandingCornerStyle = (typeof BRANDING_CORNER_STYLE_VALUES)[number];

export const DEFAULT_BRANDING_CORNER_STYLE: BrandingCornerStyle = 'rounded';

/** Base `--radius` token per style (drives `rounded-*` across shadcn/Tailwind). */
export const BRANDING_CORNER_RADIUS: Record<BrandingCornerStyle, string> = {
  sharp: '0.125rem',
  subtle: '0.375rem',
  rounded: '0.625rem',
  soft: '1rem',
};

export interface BrandingCornerStyleOption {
  value: BrandingCornerStyle;
  labelKey: AppTranslationKey;
  descriptionKey: AppTranslationKey;
}

export const BRANDING_CORNER_STYLE_OPTIONS: readonly BrandingCornerStyleOption[] = [
  {
    value: 'sharp',
    labelKey: 'theme.cornerSharp',
    descriptionKey: 'theme.cornerSharpDesc',
  },
  {
    value: 'subtle',
    labelKey: 'theme.cornerSubtle',
    descriptionKey: 'theme.cornerSubtleDesc',
  },
  {
    value: 'rounded',
    labelKey: 'theme.cornerRounded',
    descriptionKey: 'theme.cornerRoundedDesc',
  },
  {
    value: 'soft',
    labelKey: 'theme.cornerSoft',
    descriptionKey: 'theme.cornerSoftDesc',
  },
] as const;

/**
 * Coerces stored branding values to a supported corner style.
 */
export function normalizeBrandingCornerStyle(value: unknown): BrandingCornerStyle {
  if (
    typeof value === 'string' &&
    (BRANDING_CORNER_STYLE_VALUES as readonly string[]).includes(value)
  ) {
    return value as BrandingCornerStyle;
  }
  return DEFAULT_BRANDING_CORNER_STYLE;
}

/** Resolves the CSS length for `--radius`. */
export function resolveBrandingCornerRadius(style: BrandingCornerStyle): string {
  return BRANDING_CORNER_RADIUS[style];
}

/** Translation key for the active corner style label. */
export function cornerStyleLabelKey(style: BrandingCornerStyle): AppTranslationKey {
  return (
    BRANDING_CORNER_STYLE_OPTIONS.find((option) => option.value === style)?.labelKey ??
    'theme.cornerRounded'
  );
}

import { BRANDING_THEME_PRESETS } from './brandingTypes.js';
import {
  DEFAULT_PRIMARY,
  clamp,
  hexToHslColor,
  hslColorToHex,
  type HslColor,
} from './brandingColorConvert.js';
import {
  ensureAccentButtonContrast,
  getContrastRatio,
  meetsWcagAaTextContrast,
} from './brandingColorContrast.js';

const BRAND_PRESET_LOOKUP = new Map(
  BRANDING_THEME_PRESETS.map((preset) => [preset.primaryColor.toLowerCase(), preset]),
);

/**
 * Suggests a harmonious accent colour for a given primary brand colour.
 * Uses split-complementary hue rotation and enforces accessible contrast on solid fills.
 */
export function suggestSecondaryColor(primaryHex: string): string {
  const normalized = primaryHex.trim().toLowerCase();
  const preset = BRAND_PRESET_LOOKUP.get(normalized);
  if (preset) return preset.secondaryColor;

  const primary = hexToHslColor(primaryHex) ?? DEFAULT_PRIMARY;
  const splitHue = (primary.h + 150) % 360;
  let accent: HslColor = {
    h: splitHue,
    s: clamp(Math.round(primary.s * 0.9), 55, 92),
    l: clamp(Math.round(primary.l + 22), 40, 52),
  };

  return ensureAccentButtonContrast(hslColorToHex(accent));
}

/** Contrast metadata for a curated branding preset (primary + accent vs white). */
export interface BrandingPresetAccessibility {
  primaryTextRatio: number | null;
  accentTextRatio: number | null;
  primaryPassesAaText: boolean;
  accentPassesAaText: boolean;
}

export function getBrandingPresetAccessibility(
  primaryHex: string,
  accentHex: string,
): BrandingPresetAccessibility {
  const primaryTextRatio = getContrastRatio('#ffffff', primaryHex);
  const accentTextRatio = getContrastRatio('#ffffff', accentHex);
  return {
    primaryTextRatio,
    accentTextRatio,
    primaryPassesAaText: meetsWcagAaTextContrast(primaryTextRatio),
    accentPassesAaText: meetsWcagAaTextContrast(accentTextRatio),
  };
}

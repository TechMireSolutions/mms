import {
  ensureAccentButtonContrast,
  getBrandingPresetAccessibility,
  getContrastRatio,
  hexToHslColor,
  meetsWcagAaTextContrast,
  suggestSecondaryColor,
  type BrandingPresetAccessibility,
  type HslColor,
} from './brandingTheme.js';

/** Brand colours inferred from a logo image palette. */
export interface LogoBrandColors {
  primaryColor: string;
  secondaryColor: string;
  /** Ranked dominant swatches extracted from the logo (most frequent first). */
  palette: readonly string[];
  /** WCAG AA contrast for white text on primary and accent fills. */
  accessibility: BrandingPresetAccessibility;
}

export interface DeriveBrandColorsFromPaletteOptions {
  /** Minimum HSL saturation (0–100) to treat a swatch as chromatic. */
  minSaturation?: number;
  /** Lightness band for primary candidates. */
  minLightness?: number;
  maxLightness?: number;
  /** Minimum hue separation between primary and secondary. */
  minHueSeparation?: number;
}

const DEFAULT_DERIVE_OPTIONS: Required<DeriveBrandColorsFromPaletteOptions> = {
  minSaturation: 10,
  minLightness: 14,
  maxLightness: 86,
  minHueSeparation: 22,
};

const MAX_PRIMARY_CANDIDATES = 5;
/** Minimum contrast between primary and accent fills so they stay visually distinct. */
const MIN_FILL_DISTINCTION_RATIO = 1.12;

/**
 * Normalizes a hex colour to lowercase `#rrggbb`, or `null` when invalid.
 */
export function normalizeBrandHex(hex: string): string | null {
  let raw = hex.trim().replace(/^#/, '');
  if (raw.length === 3) {
    raw = raw
      .split('')
      .map((ch) => ch + ch)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return null;
  return `#${raw.toLowerCase()}`;
}

function hueDistance(a: HslColor, b: HslColor): number {
  const delta = Math.abs(a.h - b.h);
  return Math.min(delta, 360 - delta);
}

function isNeutral(hsl: HslColor, minSaturation: number): boolean {
  return hsl.s < minSaturation || hsl.l < 6 || hsl.l > 96;
}

/**
 * Scores a swatch for suitability as a UI primary colour.
 * Favours saturated, mid-lightness hues weighted by extraction frequency.
 */
function brandCandidateScore(hsl: HslColor, frequencyWeight: number): number {
  const saturationScore = hsl.s / 100;
  const lightnessScore = 1 - Math.min(1, Math.abs(hsl.l - 40) / 40);
  return frequencyWeight * (0.45 + saturationScore * 0.4 + lightnessScore * 0.15);
}

/**
 * Scores how well a swatch becomes an accessible button fill while preserving brand hue.
 */
function accessiblePrimaryFit(hex: string): number {
  const adjusted = ensureAccentButtonContrast(hex);
  const ratio = getContrastRatio('#ffffff', adjusted);
  if (!meetsWcagAaTextContrast(ratio)) return 0;

  const baseHsl = hexToHslColor(hex);
  const adjHsl = hexToHslColor(adjusted);
  if (!baseHsl || !adjHsl) return 0.65;

  const huePreserved = 1 - Math.min(1, hueDistance(baseHsl, adjHsl) / 75);
  const lightnessShift = Math.abs(baseHsl.l - adjHsl.l);
  const minimalAdjust = 1 - Math.min(1, lightnessShift / 45);
  return 0.35 + huePreserved * 0.35 + minimalAdjust * 0.3;
}

function smartPrimaryScore(candidate: RankedSwatch): number {
  return (
    brandCandidateScore(candidate.hsl, candidate.frequencyWeight) * 0.5 +
    accessiblePrimaryFit(candidate.hex) * 0.5
  );
}

/**
 * Darkens a colour until white button text meets WCAG AA (4.5:1).
 */
export function ensurePrimaryButtonContrast(primaryHex: string): string {
  return ensureAccentButtonContrast(primaryHex);
}

interface RankedSwatch {
  hex: string;
  hsl: HslColor;
  frequencyWeight: number;
}

function rankSwatches(
  swatches: readonly string[],
  options: Required<DeriveBrandColorsFromPaletteOptions>,
  relaxLightness: boolean,
): RankedSwatch[] {
  const ranked: RankedSwatch[] = [];

  swatches.forEach((raw, index) => {
    const hex = normalizeBrandHex(raw);
    if (!hex) return;

    const hsl = hexToHslColor(hex);
    if (!hsl || isNeutral(hsl, options.minSaturation)) return;
    if (!relaxLightness && (hsl.l < options.minLightness || hsl.l > options.maxLightness)) return;

    const frequencyWeight = Math.max(1, swatches.length - index);
    ranked.push({ hex, hsl, frequencyWeight });
  });

  return ranked.sort(
    (a, b) =>
      brandCandidateScore(b.hsl, b.frequencyWeight) - brandCandidateScore(a.hsl, a.frequencyWeight),
  );
}

function pickPrimaryCandidate(ranked: RankedSwatch[]): RankedSwatch {
  const pool = ranked.slice(0, MAX_PRIMARY_CANDIDATES);
  return pool.reduce((best, current) =>
    smartPrimaryScore(current) > smartPrimaryScore(best) ? current : best,
  );
}

function fillsAreDistinct(primary: string, secondary: string): boolean {
  const ratio = getContrastRatio(primary, secondary);
  return ratio !== null && ratio >= MIN_FILL_DISTINCTION_RATIO;
}

function pickSecondaryCandidate(
  primaryColor: string,
  primaryHsl: HslColor,
  ranked: RankedSwatch[],
  opts: Required<DeriveBrandColorsFromPaletteOptions>,
): string {
  const primaryNormalized = normalizeBrandHex(primaryColor);
  const secondaryCandidates = ranked
    .filter((candidate) => normalizeBrandHex(candidate.hex) !== primaryNormalized)
    .sort(
      (a, b) =>
        brandCandidateScore(b.hsl, b.frequencyWeight) - brandCandidateScore(a.hsl, a.frequencyWeight),
    );

  for (const candidate of secondaryCandidates) {
    if (hueDistance(candidate.hsl, primaryHsl) < opts.minHueSeparation) continue;

    const adjusted = ensureAccentButtonContrast(candidate.hex);
    const adjHsl = hexToHslColor(adjusted);
    if (!adjHsl) continue;

    const textRatio = getContrastRatio('#ffffff', adjusted);
    if (!meetsWcagAaTextContrast(textRatio)) continue;
    if (hueDistance(adjHsl, primaryHsl) < opts.minHueSeparation) continue;
    if (!fillsAreDistinct(primaryColor, adjusted)) continue;

    return adjusted;
  }

  const harmonious = suggestSecondaryColor(primaryColor);
  if (
    meetsWcagAaTextContrast(getContrastRatio('#ffffff', harmonious)) &&
    fillsAreDistinct(primaryColor, harmonious)
  ) {
    return harmonious;
  }

  return ensureAccentButtonContrast(harmonious);
}

function finalizeAccessiblePair(primaryColor: string, secondaryColor: string): {
  primaryColor: string;
  secondaryColor: string;
  accessibility: BrandingPresetAccessibility;
} {
  let primary = ensureAccentButtonContrast(primaryColor);
  let secondary = ensureAccentButtonContrast(secondaryColor);

  let accessibility = getBrandingPresetAccessibility(primary, secondary);
  if (!accessibility.primaryPassesAaText) {
    primary = ensureAccentButtonContrast(primary);
  }
  if (!accessibility.accentPassesAaText) {
    secondary = ensureAccentButtonContrast(secondary);
  }

  accessibility = getBrandingPresetAccessibility(primary, secondary);
  if (!accessibility.accentPassesAaText || !fillsAreDistinct(primary, secondary)) {
    secondary = suggestSecondaryColor(primary);
    secondary = ensureAccentButtonContrast(secondary);
    accessibility = getBrandingPresetAccessibility(primary, secondary);
  }

  return { primaryColor: primary, secondaryColor: secondary, accessibility };
}

/**
 * Picks primary and accent colours from a ranked palette (most frequent swatch first).
 * Ranks candidates by brand presence and accessible button-fill potential, then enforces
 * WCAG AA white-on-fill contrast for both colours.
 */
export function deriveBrandColorsFromPalette(
  swatches: readonly string[],
  options?: DeriveBrandColorsFromPaletteOptions,
): LogoBrandColors | null {
  const opts = { ...DEFAULT_DERIVE_OPTIONS, ...options };
  const palette = swatches
    .map((swatch) => normalizeBrandHex(swatch))
    .filter((hex): hex is string => hex !== null);

  if (palette.length === 0) return null;

  let ranked = rankSwatches(palette, opts, false);
  if (ranked.length === 0) {
    ranked = rankSwatches(palette, opts, true);
  }
  if (ranked.length === 0) return null;

  const primaryCandidate = pickPrimaryCandidate(ranked);
  const primaryColor = ensureAccentButtonContrast(primaryCandidate.hex);
  const primaryHsl = hexToHslColor(primaryColor);
  if (!primaryHsl) return null;

  const secondaryColor = pickSecondaryCandidate(primaryColor, primaryHsl, ranked, opts);
  const finalized = finalizeAccessiblePair(primaryColor, secondaryColor);

  return {
    primaryColor: finalized.primaryColor,
    secondaryColor: finalized.secondaryColor,
    palette,
    accessibility: finalized.accessibility,
  };
}

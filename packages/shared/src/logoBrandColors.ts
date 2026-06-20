import {
  getContrastRatio,
  hexToHslColor,
  hslColorToHex,
  suggestSecondaryColor,
  tone,
  type HslColor,
} from './brandingTheme.js';

/** Brand colours inferred from a logo image palette. */
export interface LogoBrandColors {
  primaryColor: string;
  secondaryColor: string;
  /** Ranked dominant swatches extracted from the logo (most frequent first). */
  palette: readonly string[];
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

const HEX_6 = /^#[0-9a-f]{6}$/;

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
 * Darkens a colour until white button text meets WCAG AA (4.5:1).
 */
export function ensurePrimaryButtonContrast(primaryHex: string): string {
  const normalized = normalizeBrandHex(primaryHex);
  if (!normalized) return primaryHex;

  const ratio = getContrastRatio('#ffffff', normalized);
  if (ratio !== null && ratio >= 4.5) return normalized;

  const base = hexToHslColor(normalized);
  if (!base) return normalized;

  let adjusted = base;
  for (let step = 0; step < 10; step += 1) {
    adjusted = tone(adjusted, { l: -5, s: Math.min(4, Math.max(0, 12 - adjusted.s)) });
    const candidate = hslColorToHex(adjusted);
    const candidateRatio = getContrastRatio('#ffffff', candidate);
    if (candidateRatio !== null && candidateRatio >= 4.5) return candidate;
  }

  return hslColorToHex(adjusted);
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

/**
 * Picks primary and accent colours from a ranked palette (most frequent swatch first).
 * Falls back to harmonious accent generation when the logo has a single chromatic hue.
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

  const primaryColor = ensurePrimaryButtonContrast(ranked[0].hex);
  const primaryHsl = hexToHslColor(primaryColor);
  if (!primaryHsl) return null;

  let secondaryColor = suggestSecondaryColor(primaryColor);
  const secondaryCandidates = ranked
    .slice(1)
    .filter((candidate) => candidate.hex !== primaryColor)
    .sort(
      (a, b) =>
        brandCandidateScore(b.hsl, b.frequencyWeight) - brandCandidateScore(a.hsl, a.frequencyWeight),
    );

  for (const candidate of secondaryCandidates) {
    if (hueDistance(candidate.hsl, primaryHsl) >= opts.minHueSeparation) {
      secondaryColor = candidate.hex;
      break;
    }
  }

  return { primaryColor, secondaryColor, palette };
}

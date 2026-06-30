import { BRANDING_THEME_PRESETS } from './brandingTypes.js';

/** Light or dark application chrome. */
export type BrandingThemeMode = 'light' | 'dark';

export interface HslColor {
  h: number;
  s: number;
  l: number;
}

const DEFAULT_PRIMARY: HslColor = { h: 160, s: 84, l: 22 };
const DEFAULT_SECONDARY: HslColor = { h: 42, s: 60, l: 70 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Parses a hex colour into HSL components.
 */
export function hexToHslColor(hex: string): HslColor | null {
  let normalized = hex.replace(/^#/, '').trim();
  if (normalized.length === 3) {
    normalized = normalized
      .split('')
      .map((ch) => ch + ch)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;

  const red = parseInt(normalized.substring(0, 2), 16) / 255;
  const green = parseInt(normalized.substring(2, 4), 16) / 255;
  const blue = parseInt(normalized.substring(4, 6), 16) / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let hue = 0;
  let saturation = 0;
  const lightness = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case red:
        hue = (green - blue) / delta + (green < blue ? 6 : 0);
        break;
      case green:
        hue = (blue - red) / delta + 2;
        break;
      default:
        hue = (red - green) / delta + 4;
        break;
    }
    hue /= 6;
  }

  return {
    h: Math.round(hue * 360),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  };
}

/**
 * Formats HSL components as a Tailwind-compatible CSS token (`H S% L%`).
 */
export function hslColorToToken(color: HslColor): string {
  return `${color.h} ${color.s}% ${color.l}%`;
}

/**
 * Converts a hex colour to a Tailwind-compatible HSL token string.
 */
export function hexToHslToken(hex: string): string {
  return hslColorToToken(hexToHslColor(hex) ?? DEFAULT_PRIMARY);
}

const BRANDING_HEX = /^#[0-9a-f]{6}$/;

/** Coerces a user-entered hex colour to `#rrggbb` or returns fallback. */
export function normalizeBrandingHex(raw: string | undefined, fallback: string): string {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return fallback.toLowerCase();
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  if (!BRANDING_HEX.test(withHash)) return fallback.toLowerCase();
  return withHash.toLowerCase();
}

/** Converts HSL components to a `#rrggbb` hex string. */
export function hslColorToHex(color: HslColor): string {
  const hue = color.h / 360;
  const saturation = color.s / 100;
  const lightness = color.l / 100;

  const hueToRgb = (lowerBound: number, upperBound: number, hueOffset: number): number => {
    let adjustedHue = hueOffset;
    if (adjustedHue < 0) adjustedHue += 1;
    if (adjustedHue > 1) adjustedHue -= 1;
    if (adjustedHue < 1 / 6) return lowerBound + (upperBound - lowerBound) * 6 * adjustedHue;
    if (adjustedHue < 1 / 2) return upperBound;
    if (adjustedHue < 2 / 3) return lowerBound + (upperBound - lowerBound) * (2 / 3 - adjustedHue) * 6;
    return lowerBound;
  };

  let red: number;
  let green: number;
  let blue: number;

  if (saturation === 0) {
    red = green = blue = lightness;
  } else {
    const upperBound = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
    const lowerBound = 2 * lightness - upperBound;
    red = hueToRgb(lowerBound, upperBound, hue + 1 / 3);
    green = hueToRgb(lowerBound, upperBound, hue);
    blue = hueToRgb(lowerBound, upperBound, hue - 1 / 3);
  }

  const toHex = (channel: number) =>
    Math.round(clamp(channel * 255, 0, 255))
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let normalized = hex.replace(/^#/, '').trim();
  if (normalized.length === 3) {
    normalized = normalized
      .split('')
      .map((ch) => ch + ch)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  return {
    r: parseInt(normalized.substring(0, 2), 16),
    g: parseInt(normalized.substring(2, 4), 16),
    b: parseInt(normalized.substring(4, 6), 16),
  };
}

function relativeLuminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const transform = (channel: number) => {
    const scaledChannel = channel / 255;
    return scaledChannel <= 0.03928 ? scaledChannel / 12.92 : ((scaledChannel + 0.055) / 1.055) ** 2.4;
  };
  const red = transform(rgb.r);
  const green = transform(rgb.g);
  const blue = transform(rgb.b);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/**
 * WCAG contrast ratio between two hex colours (1–21).
 */
export function getContrastRatio(foregroundHex: string, backgroundHex: string): number | null {
  const fg = relativeLuminance(foregroundHex);
  const bg = relativeLuminance(backgroundHex);
  if (fg === null || bg === null) return null;
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsWcagAaUiContrast(ratio: number | null): boolean {
  return ratio !== null && ratio >= 3;
}

export function meetsWcagAaTextContrast(ratio: number | null): boolean {
  return ratio !== null && ratio >= 4.5;
}

/**
 * Darkens or saturates an accent until white label text meets WCAG AA (4.5:1).
 */
export function ensureAccentButtonContrast(accentHex: string): string {
  const normalized = normalizeBrandingHex(accentHex, accentHex);
  const ratio = getContrastRatio('#ffffff', normalized);
  if (ratio !== null && meetsWcagAaTextContrast(ratio)) return normalized;

  const base = hexToHslColor(normalized);
  if (!base) return normalized;

  let adjusted = base;
  for (let step = 0; step < 24; step += 1) {
    adjusted = tone(adjusted, { l: -4, s: Math.min(6, Math.max(0, 70 - adjusted.s)) });
    const candidate = hslColorToHex(adjusted);
    const candidateRatio = getContrastRatio('#ffffff', candidate);
    if (candidateRatio !== null && meetsWcagAaTextContrast(candidateRatio)) return candidate;
  }

  while (adjusted.l > 14) {
    adjusted = tone(adjusted, { l: -3, s: -5 });
    const candidate = hslColorToHex(adjusted);
    const candidateRatio = getContrastRatio('#ffffff', candidate);
    if (candidateRatio !== null && meetsWcagAaTextContrast(candidateRatio)) return candidate;
  }

  return hslColorToHex(adjusted);
}

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

/** Tailwind HSL token → CSS `hsl()` colour. */
export function brandingTokenToCss(token: string): string {
  return `hsl(${token.replace(/ /g, ', ')})`;
}

function parseHslToken(token: string): HslColor | null {
  const match = token.trim().match(/^(\d+)\s+(\d+)%\s+(\d+)%$/);
  if (!match) return null;
  return { h: Number(match[1]), s: Number(match[2]), l: Number(match[3]) };
}

/** Tailwind HSL token → `#rrggbb` (for Recharts / canvas APIs). */
export function brandingTokenToHex(token: string, fallback = '#047857'): string {
  const parsed = parseHslToken(token);
  return parsed ? hslColorToHex(parsed) : fallback;
}

/** Hex palette derived from institution brand colours for chart libraries. */
export interface BrandingChartPaletteHex {
  primary: string;
  secondary: string;
  charts: readonly [string, string, string, string, string];
}

/**
 * Resolves chart-ready hex colours from brand primary/secondary for the active theme mode.
 */
export function resolveBrandingChartPaletteHex(
  primaryHex: string,
  secondaryHex: string,
  mode: BrandingThemeMode,
): BrandingChartPaletteHex {
  const vars = buildBrandingCssVariables(primaryHex, secondaryHex, mode);
  const toHex = (key: string): string =>
    brandingTokenToHex(vars[key] ?? '', primaryHex);
  return {
    primary: toHex('--primary'),
    secondary: toHex('--secondary'),
    charts: [
      toHex('--chart-1'),
      toHex('--chart-2'),
      toHex('--chart-3'),
      toHex('--chart-4'),
      toHex('--chart-5'),
    ],
  };
}

const BRAND_PRESET_LOOKUP = new Map(
  BRANDING_THEME_PRESETS.map((preset) => [preset.primaryColor.toLowerCase(), preset]),
);

function withAbsoluteLightness(color: HslColor, targetLightness: number): HslColor {
  return { ...color, l: clamp(targetLightness, 0, 100) };
}

function darkModePrimaryUi(primary: HslColor): HslColor {
  const softened = tone(primary, { s: -Math.round(primary.s * 0.3) });
  return withAbsoluteLightness(softened, clamp(primary.l + 18, 35, 55));
}

function darkModeSecondaryUi(secondary: HslColor): HslColor {
  const softened = tone(secondary, { s: -Math.round(secondary.s * 0.35) });
  return withAbsoluteLightness(softened, clamp(secondary.l - 20, 30, 60));
}

function ensureAccessibleFillSurface(color: HslColor): HslColor {
  let adjusted = color;
  for (let step = 0; step < 24; step += 1) {
    const hex = hslColorToHex(adjusted);
    const whiteRatio = getContrastRatio('#ffffff', hex);
    const darkText = hslColorToHex({ h: adjusted.h, s: 30, l: 12 });
    const darkRatio = getContrastRatio(darkText, hex);
    if (meetsWcagAaTextContrast(whiteRatio) || meetsWcagAaTextContrast(darkRatio)) {
      return adjusted;
    }
    adjusted = tone(adjusted, { l: -4, s: Math.min(6, Math.max(0, adjusted.s - 55)) });
  }
  return adjusted;
}

function pickAccessibleTextToken(
  hue: number,
  saturation: number,
  backgrounds: readonly HslColor[],
  candidateLightness: readonly number[],
): string {
  for (const lightness of candidateLightness) {
    const foreground = { h: hue, s: saturation, l: lightness };
    const fgHex = hslColorToHex(foreground);
    const allPass = backgrounds.every((background) =>
      meetsWcagAaTextContrast(getContrastRatio(fgHex, hslColorToHex(background))),
    );
    if (allPass) return hslColorToToken(foreground);
  }

  let bestLightness = candidateLightness[0] ?? 50;
  let bestMinRatio = 0;
  for (const lightness of candidateLightness) {
    const fgHex = hslColorToHex({ h: hue, s: saturation, l: lightness });
    const minRatio = Math.min(
      ...backgrounds.map((background) => getContrastRatio(fgHex, hslColorToHex(background)) ?? 0),
    );
    if (minRatio > bestMinRatio) {
      bestMinRatio = minRatio;
      bestLightness = lightness;
    }
  }
  return hslColorToToken({ h: hue, s: saturation, l: bestLightness });
}

function descendingLightness(from: number, to: number): number[] {
  const values: number[] = [];
  for (let l = from; l >= to; l -= 1) values.push(l);
  return values;
}

function ascendingLightness(from: number, to: number): number[] {
  const values: number[] = [];
  for (let l = from; l <= to; l += 1) values.push(l);
  return values;
}

function buildLightModeSurfaceTokens(surfaceHue: number, accentHue: number): Record<string, string> {
  const background = { h: surfaceHue, s: 20, l: 98 };
  const muted = { h: surfaceHue, s: 15, l: 94 };
  const sidebarBackground = { h: surfaceHue, s: 30, l: 10 };
  const sidebarAccent = { h: surfaceHue, s: 25, l: 16 };
  const foreground = pickAccessibleTextToken(surfaceHue, 30, [background], descendingLightness(10, 8));
  const mutedForeground = pickAccessibleTextToken(
    surfaceHue,
    10,
    [muted, background],
    descendingLightness(45, 32),
  );
  const sidebarForeground = pickAccessibleTextToken(
    accentHue,
    15,
    [sidebarBackground],
    ascendingLightness(85, 92),
  );
  const sidebarAccentForeground = pickAccessibleTextToken(
    accentHue,
    15,
    [sidebarAccent],
    ascendingLightness(92, 96),
  );
  const sidebarMutedForeground = pickAccessibleTextToken(
    surfaceHue,
    10,
    [sidebarBackground, sidebarAccent],
    ascendingLightness(55, 72),
  );

  return {
    '--background': hslColorToToken(background),
    '--foreground': foreground,
    '--card': '0 0% 100%',
    '--card-foreground': foreground,
    '--popover': '0 0% 100%',
    '--popover-foreground': foreground,
    '--muted': hslColorToToken(muted),
    '--muted-foreground': mutedForeground,
    '--border': `${surfaceHue} 15% 90%`,
    '--input': `${surfaceHue} 15% 90%`,
    '--sidebar-background': hslColorToToken(sidebarBackground),
    '--sidebar-foreground': sidebarForeground,
    '--sidebar-accent': hslColorToToken(sidebarAccent),
    '--sidebar-accent-foreground': sidebarAccentForeground,
    '--sidebar-border': `${surfaceHue} 20% 18%`,
    '--sidebar-muted-foreground': sidebarMutedForeground,
  };
}

function buildDarkModeSurfaceTokens(surfaceHue: number, accentHue: number): Record<string, string> {
  const background = { h: surfaceHue, s: 20, l: 5 };
  const muted = { h: surfaceHue, s: 15, l: 14 };
  const card = { h: surfaceHue, s: 20, l: 8 };
  const sidebarBackground = { h: surfaceHue, s: 25, l: 6 };
  const sidebarAccent = { h: surfaceHue, s: 20, l: 12 };
  const foreground = pickAccessibleTextToken(accentHue, 15, [background], ascendingLightness(92, 96));
  const mutedForeground = pickAccessibleTextToken(
    surfaceHue,
    10,
    [muted, background],
    ascendingLightness(55, 72),
  );
  const sidebarForeground = pickAccessibleTextToken(
    accentHue,
    15,
    [sidebarBackground],
    ascendingLightness(85, 92),
  );
  const sidebarAccentForeground = pickAccessibleTextToken(
    accentHue,
    15,
    [sidebarAccent],
    ascendingLightness(92, 96),
  );
  const sidebarMutedForeground = pickAccessibleTextToken(
    surfaceHue,
    10,
    [sidebarBackground, sidebarAccent],
    ascendingLightness(50, 72),
  );

  return {
    '--background': hslColorToToken(background),
    '--foreground': foreground,
    '--card': hslColorToToken(card),
    '--card-foreground': foreground,
    '--popover': hslColorToToken(card),
    '--popover-foreground': foreground,
    '--muted': hslColorToToken(muted),
    '--muted-foreground': mutedForeground,
    '--border': `${surfaceHue} 15% 16%`,
    '--input': `${surfaceHue} 15% 16%`,
    '--sidebar-background': hslColorToToken(sidebarBackground),
    '--sidebar-foreground': sidebarForeground,
    '--sidebar-accent': hslColorToToken(sidebarAccent),
    '--sidebar-accent-foreground': sidebarAccentForeground,
    '--sidebar-border': `${surfaceHue} 15% 14%`,
    '--sidebar-muted-foreground': sidebarMutedForeground,
  };
}

function foregroundForSurface(surface: HslColor): string {
  const surfaceHex = hslColorToHex(surface);
  const whiteRatio = getContrastRatio('#ffffff', surfaceHex) ?? 0;
  const darkText = hslColorToHex(tone(surface, { s: -15, l: -42 }));
  const darkRatio = getContrastRatio(darkText, surfaceHex) ?? 0;
  const whiteOk = meetsWcagAaTextContrast(whiteRatio);
  const darkOk = meetsWcagAaTextContrast(darkRatio);

  if (whiteOk && (!darkOk || whiteRatio >= darkRatio)) return '0 0% 100%';
  if (darkOk) return `${surface.h} 30% 12%`;
  return whiteRatio >= darkRatio ? '0 0% 100%' : `${surface.h} 30% 12%`;
}

function ensureAccessibleSemanticPair(base: HslColor): { fill: string; foreground: string } {
  let surface = base;
  for (let step = 0; step < 28; step += 1) {
    const fill = hslColorToToken(surface);
    const foreground = foregroundForSurface(surface);
    const ratio = getContrastRatio(brandingTokenToHex(foreground), hslColorToHex(surface));
    if (meetsWcagAaTextContrast(ratio)) {
      return { fill, foreground };
    }
    surface = tone(surface, { l: -3, s: Math.min(4, Math.max(0, surface.s - 58)) });
  }

  const fill = hslColorToToken(surface);
  const whiteRatio = getContrastRatio('#ffffff', hslColorToHex(surface));
  return {
    fill,
    foreground: meetsWcagAaTextContrast(whiteRatio) ? '0 0% 100%' : `${surface.h} 30% 12%`,
  };
}

function buildSemanticStatusTokens(mode: BrandingThemeMode): Record<string, string> {
  const bases =
    mode === 'light'
      ? {
          '--destructive': { h: 0, s: 72, l: 51 },
          '--success': { h: 142, s: 71, l: 36 },
          '--warning': { h: 32, s: 95, l: 44 },
          '--info': { h: 217, s: 91, l: 52 },
        }
      : {
          '--destructive': { h: 0, s: 63, l: 31 },
          '--success': { h: 142, s: 65, l: 32 },
          '--warning': { h: 32, s: 90, l: 38 },
          '--info': { h: 217, s: 88, l: 46 },
        };

  const tokens: Record<string, string> = {};
  for (const [key, base] of Object.entries(bases)) {
    const pair = ensureAccessibleSemanticPair(base);
    tokens[key] = pair.fill;
    tokens[`${key}-foreground`] = pair.foreground;
  }
  return tokens;
}

/** Hex suitable for `<meta name="theme-color">` from institution primary. */
export function brandingPrimaryToThemeColor(primaryHex: string): string {
  const primary = hexToHslColor(primaryHex) ?? DEFAULT_PRIMARY;
  return hslColorToHex(tone(primary, { l: -4 }));
}

export function tone(color: HslColor, deltas: { h?: number; s?: number; l?: number }): HslColor {
  return {
    h: (color.h + (deltas.h ?? 0) + 360) % 360,
    s: clamp(color.s + (deltas.s ?? 0), 0, 100),
    l: clamp(color.l + (deltas.l ?? 0), 0, 100),
  };
}

/**
 * Derives the full set of shadcn/Tailwind CSS variables from brand primary and secondary colours.
 */
export function buildBrandingCssVariables(
  primaryHex: string,
  secondaryHex: string,
  mode: BrandingThemeMode,
): Record<string, string> {
  const primaryBase = hexToHslColor(primaryHex) ?? DEFAULT_PRIMARY;
  const secondaryBase = hexToHslColor(secondaryHex) ?? DEFAULT_SECONDARY;

  const primaryUi = ensureAccessibleFillSurface(
    mode === 'dark' ? darkModePrimaryUi(primaryBase) : primaryBase,
  );
  const secondaryUi = ensureAccessibleFillSurface(
    mode === 'dark' ? darkModeSecondaryUi(secondaryBase) : secondaryBase,
  );

  const primaryToken = hslColorToToken(primaryUi);
  const secondaryToken = hslColorToToken(secondaryUi);

  const chart3 = tone(primaryUi, { s: -Math.round(primaryUi.s * 0.45), l: 8 });
  const chart4 = tone(secondaryUi, { s: -Math.round(secondaryUi.s * 0.35), l: -12 });
  const chart5 = tone(primaryUi, { s: -Math.round(primaryUi.s * 0.75), l: 22 });

  const surfaceHue = primaryBase.h;
  const accentHue = secondaryBase.h;
  const semantic = buildSemanticStatusTokens(mode);

  const surfaceTokens =
    mode === 'light'
      ? buildLightModeSurfaceTokens(surfaceHue, accentHue)
      : buildDarkModeSurfaceTokens(surfaceHue, accentHue);

  const brandTokens = {
    '--primary': primaryToken,
    '--primary-foreground': foregroundForSurface(primaryUi),
    '--secondary': secondaryToken,
    '--secondary-foreground': foregroundForSurface(secondaryUi),
    '--accent': secondaryToken,
    '--accent-foreground': foregroundForSurface(secondaryUi),
    '--ring': primaryToken,
    '--chart-1': primaryToken,
    '--chart-2': secondaryToken,
    '--chart-3': hslColorToToken(chart3),
    '--chart-4': hslColorToToken(chart4),
    '--chart-5': hslColorToToken(chart5),
    '--sidebar-primary': secondaryToken,
    '--sidebar-primary-foreground': foregroundForSurface(secondaryUi),
    '--sidebar-ring': secondaryToken,
  };

  if (mode === 'light') {
    return {
      ...semantic,
      ...surfaceTokens,
      ...brandTokens,
    };
  }

  return {
    ...semantic,
    ...surfaceTokens,
    ...brandTokens,
  };
}

/** CSS custom properties owned by the branding theme injector. */
export const BRANDING_THEME_VARIABLES = [
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--accent',
  '--accent-foreground',
  '--ring',
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
  '--background',
  '--foreground',
  '--card',
  '--card-foreground',
  '--popover',
  '--popover-foreground',
  '--muted',
  '--muted-foreground',
  '--destructive',
  '--destructive-foreground',
  '--success',
  '--success-foreground',
  '--warning',
  '--warning-foreground',
  '--info',
  '--info-foreground',
  '--border',
  '--input',
  '--sidebar-background',
  '--sidebar-foreground',
  '--sidebar-primary',
  '--sidebar-primary-foreground',
  '--sidebar-accent',
  '--sidebar-accent-foreground',
  '--sidebar-border',
  '--sidebar-ring',
  '--sidebar-muted-foreground',
] as const;

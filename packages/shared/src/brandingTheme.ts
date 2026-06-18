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

  const r = parseInt(normalized.substring(0, 2), 16) / 255;
  const g = parseInt(normalized.substring(2, 4), 16) / 255;
  const b = parseInt(normalized.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
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
  const h = color.h / 360;
  const s = color.s / 100;
  const l = color.l / 100;

  const hue2rgb = (p: number, q: number, t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  let r: number;
  let g: number;
  let b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (channel: number) =>
    Math.round(clamp(channel * 255, 0, 255))
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = transform(rgb.r);
  const g = transform(rgb.g);
  const b = transform(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
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
  for (let step = 0; step < 12; step += 1) {
    adjusted = tone(adjusted, { l: -4, s: Math.min(6, Math.max(0, 70 - adjusted.s)) });
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

function foregroundForSurface(surface: HslColor): string {
  const surfaceHex = hslColorToHex(surface);
  const whiteRatio = getContrastRatio('#ffffff', surfaceHex) ?? 0;
  const darkText = hslColorToHex(tone(surface, { s: -15, l: -42 }));
  const darkRatio = getContrastRatio(darkText, surfaceHex) ?? 0;

  if (whiteRatio >= darkRatio) {
    return meetsWcagAaTextContrast(whiteRatio) || whiteRatio >= darkRatio
      ? '0 0% 100%'
      : `${surface.h} 30% 12%`;
  }
  return meetsWcagAaTextContrast(darkRatio) ? `${surface.h} 30% 12%` : '0 0% 100%';
}

function buildSemanticStatusTokens(mode: BrandingThemeMode): Record<string, string> {
  if (mode === 'light') {
    return {
      '--destructive': '0 72% 51%',
      '--destructive-foreground': '0 0% 98%',
      '--success': '142 71% 36%',
      '--success-foreground': '0 0% 100%',
      '--warning': '32 95% 44%',
      '--warning-foreground': '0 0% 100%',
      '--info': '217 91% 52%',
      '--info-foreground': '0 0% 100%',
    };
  }
  return {
    '--destructive': '0 62.8% 30.6%',
    '--destructive-foreground': '0 0% 98%',
    '--success': '142 60% 38%',
    '--success-foreground': '0 0% 100%',
    '--warning': '32 80% 46%',
    '--warning-foreground': '0 0% 100%',
    '--info': '217 80% 54%',
    '--info-foreground': '0 0% 100%',
  };
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
  const primary = hexToHslColor(primaryHex) ?? DEFAULT_PRIMARY;
  const secondary = hexToHslColor(secondaryHex) ?? DEFAULT_SECONDARY;

  const primaryUi =
    mode === 'dark'
      ? tone(primary, { s: -Math.round(primary.s * 0.3), l: clamp(primary.l + 18, 35, 55) })
      : primary;
  const secondaryUi =
    mode === 'dark'
      ? tone(secondary, { s: -Math.round(secondary.s * 0.35), l: clamp(secondary.l - 20, 30, 60) })
      : secondary;

  const primaryToken = hslColorToToken(primaryUi);
  const secondaryToken = hslColorToToken(secondaryUi);

  const chart3 = tone(primaryUi, { s: -Math.round(primaryUi.s * 0.45), l: 8 });
  const chart4 = tone(secondaryUi, { s: -Math.round(secondaryUi.s * 0.35), l: -12 });
  const chart5 = tone(primaryUi, { s: -Math.round(primaryUi.s * 0.75), l: 22 });

  const surfaceHue = primary.h;
  const accentHue = secondary.h;
  const semantic = buildSemanticStatusTokens(mode);

  if (mode === 'light') {
    return {
      ...semantic,
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
      '--background': `${surfaceHue} 20% 98%`,
      '--foreground': `${surfaceHue} 30% 10%`,
      '--card': '0 0% 100%',
      '--card-foreground': `${surfaceHue} 30% 10%`,
      '--popover': '0 0% 100%',
      '--popover-foreground': `${surfaceHue} 30% 10%`,
      '--muted': `${surfaceHue} 15% 94%`,
      '--muted-foreground': `${surfaceHue} 10% 45%`,
      '--border': `${surfaceHue} 15% 90%`,
      '--input': `${surfaceHue} 15% 90%`,
      '--sidebar-background': `${surfaceHue} 30% 10%`,
      '--sidebar-foreground': `${accentHue} 15% 85%`,
      '--sidebar-primary': secondaryToken,
      '--sidebar-primary-foreground': foregroundForSurface(secondaryUi),
      '--sidebar-accent': `${surfaceHue} 25% 16%`,
      '--sidebar-accent-foreground': `${accentHue} 15% 92%`,
      '--sidebar-border': `${surfaceHue} 20% 18%`,
      '--sidebar-ring': secondaryToken,
      '--sidebar-muted-foreground': `${surfaceHue} 10% 55%`,
    };
  }

  return {
    ...semantic,
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
    '--background': `${surfaceHue} 20% 5%`,
    '--foreground': `${accentHue} 15% 92%`,
    '--card': `${surfaceHue} 20% 8%`,
    '--card-foreground': `${accentHue} 15% 92%`,
    '--popover': `${surfaceHue} 20% 8%`,
    '--popover-foreground': `${accentHue} 15% 92%`,
    '--muted': `${surfaceHue} 15% 14%`,
    '--muted-foreground': `${surfaceHue} 10% 55%`,
    '--border': `${surfaceHue} 15% 16%`,
    '--input': `${surfaceHue} 15% 16%`,
    '--sidebar-background': `${surfaceHue} 25% 6%`,
    '--sidebar-foreground': `${accentHue} 15% 85%`,
    '--sidebar-primary': secondaryToken,
    '--sidebar-primary-foreground': foregroundForSurface(secondaryUi),
    '--sidebar-accent': `${surfaceHue} 20% 12%`,
    '--sidebar-accent-foreground': `${accentHue} 15% 92%`,
    '--sidebar-border': `${surfaceHue} 15% 14%`,
    '--sidebar-ring': secondaryToken,
    '--sidebar-muted-foreground': `${surfaceHue} 10% 50%`,
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

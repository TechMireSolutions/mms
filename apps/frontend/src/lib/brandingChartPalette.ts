import {
  resolveBrandingChartPaletteHex,
  type BrandingChartPaletteHex,
  type BrandingThemeMode,
} from '@mms/shared';
import {
  getScopedBrandingSettings,
  getScopedGlobalSettings,
} from '@/lib/settingsPreviewStore';

export type { BrandingChartPaletteHex };

function resolveActiveThemeMode(): BrandingThemeMode {
  const settings = getScopedGlobalSettings();
  if (settings.theme === 'dark') return 'dark';
  if (settings.theme === 'light') return 'light';
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Chart palette from effective branding + global theme mode (no React). */
export function getBrandingChartPalette(): BrandingChartPaletteHex {
  const branding = getScopedBrandingSettings();
  return resolveBrandingChartPaletteHex(
    branding.primaryColor,
    branding.secondaryColor,
    resolveActiveThemeMode(),
  );
}

/** Reads a live CSS variable as `hsl(h, s%, l%)` for SVG/canvas. */
export function readThemeCssColor(varName: string): string {
  if (typeof window === 'undefined') return '';
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return raw ? `hsl(${raw.replace(/ /g, ', ')})` : '';
}

/** Brand chart colours as CSS `hsl()` strings (from computed document variables). */
export function getBrandingChartPaletteCss(): string[] {
  return ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'].map((name) =>
    readThemeCssColor(name),
  );
}

/** Widget builder colour name → branded chart hex (Recharts). */
export function resolveWidgetChartHex(name: string, palette: BrandingChartPaletteHex): string {
  const key = name.toLowerCase();
  const chartHexByColorName: Record<string, string> = {
    emerald: palette.primary,
    green: palette.primary,
    blue: palette.charts[3],
    violet: palette.charts[4],
    amber: palette.secondary,
    red: palette.charts[0],
    yellow: palette.charts[2],
  };
  return chartHexByColorName[key] ?? palette.primary;
}

/** Threshold alert swatch for dashboard widgets (Recharts). */
export function resolveThresholdChartHex(
  color: 'red' | 'amber' | 'yellow' | undefined,
  palette: BrandingChartPaletteHex,
): string {
  if (color === 'amber') return palette.secondary;
  if (color === 'yellow') return palette.charts[2];
  return palette.charts[0];
}

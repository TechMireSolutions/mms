import { DEFAULT_BRANDING_SETTINGS } from '@mms/shared';
import { getBrandingChartPalette } from './brandingChartPalette';

/** Default card colour for new denominations. */
export const DEFAULT_DENOMINATION_COLOR = DEFAULT_BRANDING_SETTINGS.primaryColor;

/** Metallic swatches plus branded chart colours for the denomination picker. */
export function getDenominationPresetColors(): readonly string[] {
  const palette = getBrandingChartPalette();
  return [
    '#cd7f32',
    '#9ca3af',
    palette.secondary,
    palette.charts[4],
    palette.charts[3],
    palette.primary,
    palette.charts[0],
    palette.charts[2],
  ];
}

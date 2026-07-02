import { DEFAULT_BRANDING_SETTINGS } from '@mms/shared';
import { getBrandingChartPalette } from '@/lib/brandingChartPalette';
import { getScopedBrandingSettings } from '@/lib/settingsPreviewStore';

/** Neutral print-canvas colours (not institution-specific). */
export const PRINT_NEUTRAL = {
  text: '#222222',
  muted: '#888888',
  caption: '#6b7280',
  subcaption: '#9ca3af',
  body: '#4b5563',
  emphasis: '#374151',
  label: '#555555',
  labelLight: '#777777',
  border: '#e5e7eb',
  placeholder: '#cccccc',
  paper: '#ffffff',
} as const;

export interface PrintBrandingTokens {
  primary: string;
  secondary: string;
  destructive: string;
  onPrimary: string;
  logoPlaceholderBg: string;
  logoPlaceholderBorder: string;
  fieldPlaceholderBg: string;
  fieldPlaceholderBorder: string;
  text: string;
  muted: string;
  border: string;
  placeholder: string;
  paper: string;
}

function hexWithAlpha(hex: string, alpha: number): string {
  let hexValue = hex.replace('#', '').trim();
  if (hexValue.length === 3) hexValue = hexValue.split('').map((hexDigit) => hexDigit + hexDigit).join('');
  const red = parseInt(hexValue.slice(0, 2), 16);
  const green = parseInt(hexValue.slice(2, 4), 16);
  const blue = parseInt(hexValue.slice(4, 6), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
}

/** Brand-derived hex tokens for invoice/certificate print canvases (inline styles). */
export function getPrintBrandingTokens(): PrintBrandingTokens {
  const branding = getScopedBrandingSettings();
  const palette = getBrandingChartPalette();
  const primary = branding.primaryColor || DEFAULT_BRANDING_SETTINGS.primaryColor;
  const secondary = branding.secondaryColor || DEFAULT_BRANDING_SETTINGS.secondaryColor;

  return {
    primary,
    secondary,
    destructive: palette.charts[0],
    onPrimary: '#ffffff',
    logoPlaceholderBg: hexWithAlpha(primary, 0.06),
    logoPlaceholderBorder: hexWithAlpha(primary, 0.2),
    fieldPlaceholderBg: hexWithAlpha(primary, 0.04),
    fieldPlaceholderBorder: hexWithAlpha(primary, 0.25),
    ...PRINT_NEUTRAL,
  };
}

import {
  DEFAULT_PRIMARY,
  DEFAULT_SECONDARY,
  type BrandingThemeMode,
  hexToHslColor,
  hslColorToToken,
  tone,
} from './brandingColorUtils.js';
import {
  darkModePrimaryUi,
  darkModeSecondaryUi,
  ensureAccessibleFillSurface,
  foregroundForSurface,
} from './brandingCssContrast.js';
import { buildSemanticStatusTokens } from './brandingCssSemanticTokens.js';
import { buildBrandingSurfaceTokens } from './brandingCssSurfaceTokens.js';

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

  const semanticTokens = buildSemanticStatusTokens(mode);
  const surfaceTokens = buildBrandingSurfaceTokens(mode, primaryBase.h, secondaryBase.h);
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

  return {
    ...semanticTokens,
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

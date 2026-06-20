import { describe, expect, it } from 'vitest';
import { BRANDING_THEME_PRESETS } from './brandingTypes.js';
import {
  brandingPrimaryToThemeColor,
  brandingTokenToHex,
  buildBrandingCssVariables,
  ensureAccentButtonContrast,
  getBrandingPresetAccessibility,
  getContrastRatio,
  meetsWcagAaTextContrast,
  suggestSecondaryColor,
} from './brandingTheme.js';
import {
  CHART_PALETTE_DEFS,
  DEFAULT_CHART_PALETTE_ID,
  getChartPaletteColors,
  isColorblindSafeChartPalette,
} from './chartPalettes.js';

describe('buildBrandingCssVariables', () => {
  it('includes semantic status tokens for tenant themes', () => {
    const vars = buildBrandingCssVariables('#047857', '#c2410c', 'light');
    expect(vars['--success']).toBeTruthy();
    expect(vars['--destructive']).toBeTruthy();
    expect(vars['--warning']).toBeTruthy();
    expect(vars['--info']).toBeTruthy();
  });

  it('picks readable primary foreground via contrast', () => {
    const vars = buildBrandingCssVariables('#0b3d2e', '#c9a227', 'light');
    const fgHex = brandingTokenToHex(vars['--primary-foreground'] ?? '');
    const ratio = getContrastRatio(fgHex, '#0b3d2e');
    expect(meetsWcagAaTextContrast(ratio)).toBe(true);
  });

  it('derives theme-color meta hex from primary', () => {
    expect(brandingPrimaryToThemeColor('#047857')).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('BRANDING_THEME_PRESETS', () => {
  it('every curated preset passes WCAG AA text contrast on primary and accent', () => {
    for (const preset of BRANDING_THEME_PRESETS) {
      const access = getBrandingPresetAccessibility(preset.primaryColor, preset.secondaryColor);
      expect(access.primaryPassesAaText, `${preset.id} primary`).toBe(true);
      expect(access.accentPassesAaText, `${preset.id} accent`).toBe(true);
    }
  });

  it('every curated preset passes WCAG contrast in dark mode derived tokens', () => {
    const textPairs = [
      ['--primary-foreground', '--primary'],
      ['--secondary-foreground', '--secondary'],
      ['--accent-foreground', '--accent'],
      ['--foreground', '--background'],
      ['--card-foreground', '--card'],
      ['--popover-foreground', '--popover'],
      ['--muted-foreground', '--muted'],
      ['--muted-foreground', '--background'],
      ['--sidebar-foreground', '--sidebar-background'],
      ['--sidebar-primary-foreground', '--sidebar-primary'],
      ['--sidebar-accent-foreground', '--sidebar-accent'],
      ['--sidebar-muted-foreground', '--sidebar-background'],
      ['--sidebar-muted-foreground', '--sidebar-accent'],
      ['--destructive-foreground', '--destructive'],
      ['--success-foreground', '--success'],
      ['--warning-foreground', '--warning'],
      ['--info-foreground', '--info'],
    ] as const;

    const failures: string[] = [];
    for (const preset of BRANDING_THEME_PRESETS) {
      const vars = buildBrandingCssVariables(preset.primaryColor, preset.secondaryColor, 'dark');
      for (const [fgKey, bgKey] of textPairs) {
        const fgHex = brandingTokenToHex(vars[fgKey] ?? '');
        const bgHex = brandingTokenToHex(vars[bgKey] ?? '');
        const ratio = getContrastRatio(fgHex, bgHex);
        if (!meetsWcagAaTextContrast(ratio)) {
          failures.push(`${preset.id} ${fgKey}/${bgKey} ratio=${ratio?.toFixed(2)} fg=${fgHex} bg=${bgHex}`);
        }
      }
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });

  it('every curated preset passes WCAG contrast in light mode derived tokens', () => {
    const textPairs = [
      ['--primary-foreground', '--primary'],
      ['--secondary-foreground', '--secondary'],
      ['--accent-foreground', '--accent'],
      ['--foreground', '--background'],
      ['--card-foreground', '--card'],
      ['--popover-foreground', '--popover'],
      ['--muted-foreground', '--muted'],
      ['--muted-foreground', '--background'],
      ['--sidebar-foreground', '--sidebar-background'],
      ['--sidebar-primary-foreground', '--sidebar-primary'],
      ['--sidebar-accent-foreground', '--sidebar-accent'],
      ['--sidebar-muted-foreground', '--sidebar-background'],
      ['--sidebar-muted-foreground', '--sidebar-accent'],
      ['--destructive-foreground', '--destructive'],
      ['--success-foreground', '--success'],
      ['--warning-foreground', '--warning'],
      ['--info-foreground', '--info'],
    ] as const;

    const failures: string[] = [];
    for (const preset of BRANDING_THEME_PRESETS) {
      const vars = buildBrandingCssVariables(preset.primaryColor, preset.secondaryColor, 'light');
      for (const [fgKey, bgKey] of textPairs) {
        const fgHex = brandingTokenToHex(vars[fgKey] ?? '');
        const bgHex = brandingTokenToHex(vars[bgKey] ?? '');
        const ratio = getContrastRatio(fgHex, bgHex);
        if (!meetsWcagAaTextContrast(ratio)) {
          failures.push(`${preset.id} ${fgKey}/${bgKey} ratio=${ratio?.toFixed(2)}`);
        }
      }
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });
});

describe('suggestSecondaryColor', () => {
  it('returns accessible accent for arbitrary primaries', () => {
    const accent = suggestSecondaryColor('#2563eb');
    const ratio = getContrastRatio('#ffffff', accent);
    expect(meetsWcagAaTextContrast(ratio)).toBe(true);
  });

  it('ensureAccentButtonContrast darkens low-contrast accents', () => {
    const adjusted = ensureAccentButtonContrast('#d97706');
    const ratio = getContrastRatio('#ffffff', adjusted);
    expect(meetsWcagAaTextContrast(ratio)).toBe(true);
  });
});

describe('chartPalettes', () => {
  it('defaults to an accessible palette', () => {
    expect(isColorblindSafeChartPalette(DEFAULT_CHART_PALETTE_ID)).toBe(true);
    const colors = getChartPaletteColors(DEFAULT_CHART_PALETTE_ID);
    expect(colors.length).toBeGreaterThanOrEqual(5);
  });

  it('resolves brand palette from institution chart colours', () => {
    const brand = ['#047857', '#c2410c', '#065f46', '#92400e', '#0f766e'];
    expect(getChartPaletteColors('brand', brand)).toEqual(brand);
  });

  it('marks accessible palettes as colourblind-safe', () => {
    const accessible = CHART_PALETTE_DEFS.filter((def) => def.category === 'accessible');
    expect(accessible.length).toBeGreaterThanOrEqual(3);
    for (const def of accessible) {
      expect(def.colorblindSafe).toBe(true);
      expect(def.colors.length).toBeGreaterThan(0);
    }
  });
});

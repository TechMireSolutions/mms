import { describe, expect, it } from 'vitest';
import {
  brandingPrimaryToThemeColor,
  brandingTokenToHex,
  buildBrandingCssVariables,
  getContrastRatio,
  meetsWcagAaTextContrast,
} from './brandingTheme.js';

describe('buildBrandingCssVariables', () => {
  it('includes semantic status tokens for tenant themes', () => {
    const vars = buildBrandingCssVariables('#047857', '#d4a853', 'light');
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

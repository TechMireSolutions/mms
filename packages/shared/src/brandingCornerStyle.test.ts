import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BRANDING_CORNER_STYLE,
  normalizeBrandingCornerStyle,
  resolveBrandingCornerRadius,
} from './brandingCornerStyle.js';

describe('brandingCornerStyle', () => {
  it('normalizes unknown values to rounded default', () => {
    expect(normalizeBrandingCornerStyle(undefined)).toBe(DEFAULT_BRANDING_CORNER_STYLE);
    expect(normalizeBrandingCornerStyle('invalid')).toBe('rounded');
    expect(normalizeBrandingCornerStyle('sharp')).toBe('sharp');
  });

  it('maps each style to a CSS radius token', () => {
    expect(resolveBrandingCornerRadius('sharp')).toBe('0.125rem');
    expect(resolveBrandingCornerRadius('rounded')).toBe('0.625rem');
    expect(resolveBrandingCornerRadius('soft')).toBe('1rem');
  });
});

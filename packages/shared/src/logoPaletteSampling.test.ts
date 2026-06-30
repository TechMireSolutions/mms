import { describe, expect, it } from 'vitest';
import { extractDominantSwatchesFromRgba } from './logoPaletteSampling.js';
import { deriveBrandColorsFromPalette } from './logoBrandColors.js';

function fillSolidRgba(width: number, height: number, r: number, g: number, b: number, a = 255): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = a;
  }
  return data;
}

function fillWithCenterDisc(
  width: number,
  height: number,
  background: [number, number, number],
  disc: [number, number, number],
  radiusRatio = 0.35,
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * radiusRatio;

  for (let yPosition = 0; yPosition < height; yPosition += 1) {
    for (let xPosition = 0; xPosition < width; xPosition += 1) {
      const pixelOffset = (yPosition * width + xPosition) * 4;
      const inside = Math.hypot(xPosition - centerX, yPosition - centerY) <= radius;
      const [red, green, blue] = inside ? disc : background;
      data[pixelOffset] = red;
      data[pixelOffset + 1] = green;
      data[pixelOffset + 2] = blue;
      data[pixelOffset + 3] = 255;
    }
  }
  return data;
}

describe('extractDominantSwatchesFromRgba', () => {
  it('returns a saturated green for a solid green logo', () => {
    const data = fillSolidRgba(48, 48, 4, 120, 87);
    const swatches = extractDominantSwatchesFromRgba(data, 48, 48);
    expect(swatches.length).toBeGreaterThan(0);
    expect(swatches[0]).toMatch(/^#[0-9a-f]{6}$/);
    const derived = deriveBrandColorsFromPalette(swatches);
    expect(derived?.primaryColor).toBeDefined();
    expect(derived?.secondaryColor).toBeDefined();
  });

  it('prefers the centre disc over a white margin', () => {
    const data = fillWithCenterDisc(64, 64, [255, 255, 255], [180, 30, 60]);
    const swatches = extractDominantSwatchesFromRgba(data, 64, 64);
    expect(swatches[0]).toBe('#b41e3c');
  });

  it('ignores fully transparent pixels', () => {
    const data = fillSolidRgba(32, 32, 200, 40, 40, 0);
    const swatches = extractDominantSwatchesFromRgba(data, 32, 32);
    expect(swatches).toHaveLength(0);
  });
});

describe('deriveBrandColorsFromPalette', () => {
  it('picks a contrasting secondary when two hues exist', () => {
    const result = deriveBrandColorsFromPalette(['#047857', '#d97706', '#ffffff']);
    expect(result).not.toBeNull();
    expect(result!.primaryColor).toMatch(/^#[0-9a-f]{6}$/);
    expect(result!.secondaryColor).toMatch(/^#[0-9a-f]{6}$/);
    expect(result!.secondaryColor).not.toBe(result!.primaryColor);
  });
});

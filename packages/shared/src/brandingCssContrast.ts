import {
  type HslColor,
  brandingTokenToHex,
  clamp,
  getContrastRatio,
  hslColorToHex,
  hslColorToToken,
  meetsWcagAaTextContrast,
  tone,
} from './brandingColorUtils.js';

function withAbsoluteLightness(color: HslColor, targetLightness: number): HslColor {
  return { ...color, l: clamp(targetLightness, 0, 100) };
}

/** Adapts a primary colour for dark-mode UI fills. */
export function darkModePrimaryUi(primary: HslColor): HslColor {
  const softened = tone(primary, { s: -Math.round(primary.s * 0.3) });
  return withAbsoluteLightness(softened, clamp(primary.l + 18, 35, 55));
}

/** Adapts a secondary colour for dark-mode UI fills. */
export function darkModeSecondaryUi(secondary: HslColor): HslColor {
  const softened = tone(secondary, { s: -Math.round(secondary.s * 0.35) });
  return withAbsoluteLightness(softened, clamp(secondary.l - 20, 30, 60));
}

/** Adjusts a fill until light or dark text meets WCAG AA. */
export function ensureAccessibleFillSurface(color: HslColor): HslColor {
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

/** Selects the strongest accessible text token across all supplied backgrounds. */
export function pickAccessibleTextToken(
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

/** Produces an inclusive descending lightness range. */
export function descendingLightness(from: number, to: number): number[] {
  const values: number[] = [];
  for (let lightness = from; lightness >= to; lightness -= 1) values.push(lightness);
  return values;
}

/** Produces an inclusive ascending lightness range. */
export function ascendingLightness(from: number, to: number): number[] {
  const values: number[] = [];
  for (let lightness = from; lightness <= to; lightness += 1) values.push(lightness);
  return values;
}

/** Chooses an accessible foreground token for a coloured surface. */
export function foregroundForSurface(surface: HslColor): string {
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

/** Builds an accessible semantic fill and foreground pair. */
export function ensureAccessibleSemanticPair(
  base: HslColor,
): { fill: string; foreground: string } {
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

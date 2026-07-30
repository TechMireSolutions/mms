import type { BrandingThemeMode } from './brandingColorUtils.js';
import { ensureAccessibleSemanticPair } from './brandingCssContrast.js';

/** Builds accessible semantic status fill and foreground tokens. */
export function buildSemanticStatusTokens(
  mode: BrandingThemeMode,
): Record<string, string> {
  const bases =
    mode === 'light'
      ? {
          '--destructive': { h: 0, s: 72, l: 51 },
          '--success': { h: 142, s: 71, l: 36 },
          '--warning': { h: 32, s: 95, l: 44 },
          '--info': { h: 217, s: 91, l: 52 },
        }
      : {
          '--destructive': { h: 0, s: 63, l: 31 },
          '--success': { h: 142, s: 65, l: 32 },
          '--warning': { h: 32, s: 90, l: 38 },
          '--info': { h: 217, s: 88, l: 46 },
        };

  const tokens: Record<string, string> = {};
  for (const [key, base] of Object.entries(bases)) {
    const pair = ensureAccessibleSemanticPair(base);
    tokens[key] = pair.fill;
    tokens[`${key}-foreground`] = pair.foreground;
  }
  return tokens;
}

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { getContrastRatio } from "@mms/shared";

/**
 * Executable form of the WCAG AA contrast contract documented in `src/index.css`.
 *
 * The default light palette previously failed AA across the board: every semantic
 * token was a mid-tone chosen for hue, not for contrast. Each token serves three
 * roles and the value has to satisfy all of them:
 *
 *   1. a solid fill — `bg-primary` with `text-primary-foreground` on it;
 *   2. text/icons — `text-primary` on `--card` / `--background`;
 *   3. text/icons on the token's OWN low tint — `bg-primary/10 text-primary`,
 *      the standard chip pattern (188 usages at /10, plus /15 and /20 variants).
 *
 * (1) and (2) reduce to the same luminance constraint; (3) is the strictest,
 * because a tint of the token lightens the surface the token is read against.
 *
 * Contrast uses the repository's own `getContrastRatio()`
 * (`packages/shared/src/brandingColorContrast.ts`) rather than a re-implementation,
 * so this test and the runtime branding/contrast tooling cannot drift.
 */

const INDEX_CSS = path.resolve(import.meta.dirname, "../index.css");

const AA_TEXT = 4.5;
/** WCAG 1.4.11 non-text contrast, for focus indicators and UI boundaries. */
const AA_NON_TEXT = 3;
/** Strongest same-token tint used behind same-token text AT REST, per theme.
 *
 * Measured from the codebase, not chosen:
 *   light — `bg-primary/15 text-primary` (calendar.tsx, PermissionMatrixRow.tsx)
 *           plus ~188 `/10` chips;
 *   dark  — only `dark:bg-<role>/10` exists; there is no `dark:bg-<role>/15`.
 * A stronger tint lightens the surface the token is read against, so this is the
 * binding constraint on how light a token may be.
 */
const MAX_RESTING_TINT = { light: 0.15, dark: 0.1 } as const;

type Hsl = [number, number, number];

/** HSL components from the declarations inside `selector { … }`. */
function readTokenBlock(css: string, selector: string): Record<string, Hsl> {
  // Anchor to the start of a line. A bare `indexOf(".dark")` finds the
  // `@custom-variant dark (&:is(.dark *))` declaration near the top of the file
  // and then reads the wrong block entirely.
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const located = new RegExp(`^\\s*${escaped}\\s*\\{`, "m").exec(css);
  if (!located) throw new Error(`Selector ${selector} not found in index.css`);
  const open = css.indexOf("{", located.index);
  const close = css.indexOf("}", open);
  const block = css.slice(open + 1, close);

  const tokens: Record<string, Hsl> = {};
  for (const line of block.split("\n")) {
    const declaration = /^\s*--([a-z0-9-]+):\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*;/.exec(line);
    if (!declaration) continue;
    tokens[declaration[1]] = [
      Number(declaration[2]),
      Number(declaration[3]),
      Number(declaration[4]),
    ];
  }
  return tokens;
}

function hslToHex([h, s, l]: Hsl): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = s / 100;
  const light = l / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;
  let rgb: [number, number, number];
  if (hue < 60) rgb = [c, x, 0];
  else if (hue < 120) rgb = [x, c, 0];
  else if (hue < 180) rgb = [0, c, x];
  else if (hue < 240) rgb = [0, x, c];
  else if (hue < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`;
}

/** `bg-<token>/<alpha>` composited over `base` — how Tailwind renders a tint. */
function tintOver(tintHex: string, baseHex: string, alpha: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const composited = [0, 1, 2].map((i) =>
    Math.round(channel(tintHex, i) * alpha + channel(baseHex, i) * (1 - alpha)),
  );
  return `#${composited.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

const css = readFileSync(INDEX_CSS, "utf-8");
const light = readTokenBlock(css, ":root");
const dark = readTokenBlock(css, ".dark");

/** Roles that must work as a fill, as text, and as text on their own tint. */
const SEMANTIC_ROLES = ["primary", "destructive", "success", "warning", "info"] as const;

function hex(tokens: Record<string, Hsl>, name: string): string {
  const token = tokens[name];
  if (!token) throw new Error(`Token --${name} is missing`);
  return hslToHex(token);
}

function assertAtLeast(actual: number | null, minimum: number, label: string): void {
  expect(actual, `${label} is ${actual?.toFixed(2)}:1, needs ${minimum}:1`).toBeGreaterThanOrEqual(
    minimum,
  );
}

describe.each([
  ["light", light, ["card", "background"] as const, MAX_RESTING_TINT.light],
  ["dark", dark, ["card", "background"] as const, MAX_RESTING_TINT.dark],
])("design tokens — %s theme WCAG AA", (_themeName, tokens, surfaces, maxTint) => {
  it.each(SEMANTIC_ROLES)("--%s works as text on every surface", (role) => {
    for (const surface of surfaces) {
      assertAtLeast(
        getContrastRatio(hex(tokens, role), hex(tokens, surface)),
        AA_TEXT,
        `--${role} as text on --${surface}`,
      );
    }
  });

  it.each(SEMANTIC_ROLES)("--%s works as a solid fill", (role) => {
    // `bg-<role> text-<role>-foreground` is how the solid Button variants work.
    assertAtLeast(
      getContrastRatio(hex(tokens, `${role}-foreground`), hex(tokens, role)),
      AA_TEXT,
      `--${role}-foreground on --${role}`,
    );
  });

  it.each(SEMANTIC_ROLES)("--%s stays legible on its own tint", (role) => {
    // The chip/badge pattern: `bg-<role>/10 text-<role>`.
    const roleHex = hex(tokens, role);
    for (const surface of surfaces) {
      const tinted = tintOver(roleHex, hex(tokens, surface), maxTint);
      assertAtLeast(
        getContrastRatio(roleHex, tinted),
        AA_TEXT,
        `--${role} on bg-${role}/${Math.round(maxTint * 100)} over --${surface}`,
      );
    }
  });

  it("keeps --ring visible enough to serve as a focus indicator", () => {
    // Non-text contrast only (WCAG 1.4.11).
    assertAtLeast(
      getContrastRatio(hex(tokens, "ring"), hex(tokens, "card")),
      AA_NON_TEXT,
      "--ring on --card",
    );
  });

  it("keeps --muted-foreground legible on --card, --muted and --background", () => {
    // --muted is a real surface (table headers, zebra rows), and a value tuned
    // only against white is 3.95:1 there.
    for (const surface of ["card", "muted", "background"] as const) {
      assertAtLeast(
        getContrastRatio(hex(tokens, "muted-foreground"), hex(tokens, surface)),
        AA_TEXT,
        "--muted-foreground on --" + surface,
      );
    }
  });
});

describe("design tokens — typography legibility floor", () => {
  it("keeps the sub-xs scale at or above 10px", () => {
    // 9px and 10px steps were unreadable, and much worse for Nastaliq.
    const sizeOf = (token: string) => {
      const match = new RegExp(`--font-size-${token}:\\s*([\\d.]+)rem`).exec(css);
      if (!match) throw new Error(`--font-size-${token} is missing`);
      return Number(match[1]) * 16;
    };
    expect(sizeOf("4xs")).toBeGreaterThanOrEqual(10);
    expect(sizeOf("3xs")).toBeGreaterThanOrEqual(11);
    expect(sizeOf("2xs")).toBeGreaterThanOrEqual(12);
  });
});

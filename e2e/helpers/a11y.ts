import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Accessibility assertions for the E2E suite.
 *
 * Implements the check the `mms-a11y-smoke` skill prescribes ("run
 * `@axe-core/playwright` on shell + one Work directory at 375 and 1440; fail on
 * serious/critical") — which previously had no tooling behind it, so it could
 * not actually be run.
 *
 * Scope choices:
 *  - WCAG 2.1 A + AA rules, matching the `wcag21aa` tag set axe recommends for
 *    a general-purpose app. Adding `best-practice` rules would surface dozens of
 *    style opinions and train people to ignore the gate.
 *  - Only `serious` and `critical` fail the build. `moderate`/`minor` findings
 *    are reported as annotations so they stay visible without blocking deploys —
 *    a gate that fails on trivia gets bypassed.
 *  - Colour-contrast checks are meaningful only in a real rendered browser,
 *    which is exactly why this lives in Playwright rather than a jsdom unit test.
 */

export type Impact = 'minor' | 'moderate' | 'serious' | 'critical';

/** Impacts that fail the test. */
const BLOCKING_IMPACTS: readonly Impact[] = ['serious', 'critical'];

/**
 * Accepted-at-adoption baseline, keyed by axe rule id.
 *
 * These are PRE-EXISTING violations found when the gate was first switched on.
 * Listing them keeps CI green today and, more importantly, makes the debt
 * explicit: any rule NOT listed here fails the build, so the codebase cannot get
 * worse. Entries are surfaced as annotations on every run so they stay visible
 * rather than quietly forgotten.
 *
 * How each is expected to be removed: fix the underlying markup/design, delete
 * the entry, and let this gate hold the line. Do not add an entry to unblock a
 * change — fix the change instead.
 *
 * See `docs/a11y-baseline.md` for the current findings and their triage.
 */
export const A11Y_BASELINE: Record<string, string> = {
  // The ROOT CAUSE of this one has been fixed at the token layer: the light
  // palette's semantic tokens were mid-tones that failed AA as text, as fills
  // with white labels, and on their own tints. `--primary`/`--destructive`/
  // `--success`/`--warning`/`--info` (plus `--ring` and `--muted-foreground`)
  // are now solved so that all three roles clear 4.5:1 / 3:1, and
  // `apps/frontend/src/__tests__/designTokens.contrast.test.ts` holds that line.
  //
  // The entry is retained ONLY because the axe gate is a rendered-browser check
  // and has not been re-run since the palette change — a colour-contrast rule can
  // also fire on surfaces the tokens do not cover (disabled text at reduced
  // opacity, text on tenant gradients). DELETE this entry once a CI run reports
  // zero `color-contrast` nodes; if it still fires, the `html:` diagnostic in the
  // failure output names the node.
  'color-contrast': 'Root cause fixed in the token palette; entry pending an axe confirmation run.',
  // Intermittent and data-dependent (seen only when dashboard widgets render).
  // Related fix already applied: `ProgressBar` used to spread `aria-hidden` onto
  // a `role="progressbar"` element across 8+ call sites — a real ARIA conflict,
  // now resolved in the component. That has NOT been confirmed as this finding's
  // cause, so the entry stays until a firing run identifies the node directly
  // (the `html:` diagnostic prints it). See docs/a11y-baseline.md.
  'aria-hidden-focus': 'Dashboard widget; intermittent — not yet attributable to a component.',
};

/**
 * When set, prints every violation as a JSON array and never fails. Used to
 * regenerate the baseline after a deliberate UI change.
 */
const COLLECT_MODE = process.env.A11Y_COLLECT === '1';

export interface A11yAuditOptions {
  /** Human-readable label used in failure messages, e.g. "dashboard @ 375px". */
  context: string;
  /** Extra axe rule IDs to disable, with a reason documented at the call site. */
  disabledRules?: string[];
  /**
   * CSS selectors for elements to exclude. Use sparingly and narrowly — for
   * third-party embeds you cannot fix, not for your own components.
   */
  exclude?: string[];
}

/** Result shape derived from the builder, so `axe-core` need not be a direct dep. */
type AxeResults = Awaited<ReturnType<InstanceType<typeof AxeBuilder>['analyze']>>;

interface AxeViolationSummary {
  id: string;
  impact: Impact | null;
  help: string;
  nodes: number;
  sampleTargets: string[];
  /** Truncated outerHTML of the first offending node — makes a failure actionable. */
  sampleHtml: string;
}

function summarize(violations: AxeResults['violations']): AxeViolationSummary[] {
  return violations.map((violation) => ({
    id: violation.id,
    impact: (violation.impact as Impact | null) ?? null,
    help: violation.help,
    nodes: violation.nodes.length,
    // axe's `target` is an ARRAY of selectors that walks into frames/shadow roots.
    // Joining it with a space (the obvious thing) silently produced a composite
    // like `.card > .child[aria-hidden]` that looked like one CSS selector but
    // was actually two different elements — which sent me chasing the wrong
    // component. Keep the steps visually distinct so the target is unambiguous.
    sampleTargets: violation.nodes.slice(0, 3).map((node) => node.target.join(' >> ')),
    sampleHtml: (violation.nodes[0]?.html ?? '').replace(/\s+/g, ' ').slice(0, 300),
  }));
}

function renderSummary(summaries: AxeViolationSummary[]): string {
  return summaries
    .map(
      (v) =>
        `  • [${v.impact}] ${v.id} — ${v.help} (${v.nodes} node${v.nodes === 1 ? '' : 's'})\n` +
        v.sampleTargets.map((t) => `      ${t}`).join('\n') +
        (v.sampleHtml ? `\n      html: ${v.sampleHtml}` : ''),
    )
    .join('\n');
}

/**
 * Runs axe against the current page state and fails on serious/critical
 * violations. Non-blocking findings are attached as test annotations.
 */
export async function assertNoSeriousA11yViolations(
  page: Page,
  options: A11yAuditOptions,
): Promise<void> {
  let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);

  for (const selector of options.exclude ?? []) {
    builder = builder.exclude(selector);
  }
  if (options.disabledRules && options.disabledRules.length > 0) {
    builder = builder.disableRules(options.disabledRules);
  }

  const results = await builder.analyze();
  const summaries = summarize(results.violations);

  const serious = summaries.filter((v) => v.impact && BLOCKING_IMPACTS.includes(v.impact));
  const advisory = summaries.filter((v) => !v.impact || !BLOCKING_IMPACTS.includes(v.impact));

  if (COLLECT_MODE) {
    // eslint-disable-next-line no-console
    console.log(
      `[a11y:collect] ${options.context} ${JSON.stringify(
        summaries.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes, help: v.help })),
      )}`,
    );
    return;
  }

  const baselined = serious.filter((v) => A11Y_BASELINE[v.id] !== undefined);
  const blocking = serious.filter((v) => A11Y_BASELINE[v.id] === undefined);

  if (baselined.length > 0) {
    // eslint-disable-next-line no-console
    console.log(
      `[a11y] ${options.context}: ${baselined.length} BASELINED violation(s) still present\n${renderSummary(baselined)}`,
    );
    for (const v of baselined) {
      test.info().annotations.push({
        type: `a11y-baseline:${v.id}`,
        description: `${options.context} — ${A11Y_BASELINE[v.id]}`,
      });
    }
  }

  if (advisory.length > 0) {
    // Visible without blocking: these are real findings worth tracking.
    // eslint-disable-next-line no-console
    console.log(
      `[a11y] ${options.context}: ${advisory.length} non-blocking finding(s)\n${renderSummary(advisory)}`,
    );
  }

  expect(
    blocking,
    `Accessibility violations (${BLOCKING_IMPACTS.join('/')}) at ${options.context}:\n` +
      `${renderSummary(blocking)}\n\n` +
      'Fix the markup, or disable the specific rule with a documented reason.',
  ).toEqual([]);
}

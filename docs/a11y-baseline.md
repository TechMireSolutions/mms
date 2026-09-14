# Accessibility (a11y) Baseline

The axe gate runs in the normal E2E job as `e2e/tests/a11y-shell.spec.ts` — this is
the executable form of the `mms-a11y-smoke` skill, which previously described the
check but had no tooling installed to run it.

## What the gate does

- Sweeps the app shell, one Work surface (Contacts) and one Setup surface
  (Settings) at **375px** and **1440px**, plus an **RTL** pass at 1440px.
- Runs axe-core with the **WCAG 2.1 A + AA** tag set.
- **Fails** on `serious` / `critical` violations that are not baselined.
- **Reports without failing** on `moderate` / `minor` (these are logged per run).

Contrast rules are the reason this lives in Playwright rather than a jsdom unit
test: colour contrast and focus visibility need a real rendered browser.

## Adopting the gate: why a baseline exists

Switching the gate on for the first time surfaced pre-existing violations. Two of
them are real but require a **design-token decision**, not a one-line markup fix.
Blocking CI on them on day one would have meant either abandoning the gate or
changing global design tokens unilaterally.

So `A11Y_BASELINE` in `e2e/helpers/a11y.ts` lists the rule IDs known to be
failing at adoption:

| Rule | Status | Notes |
|---|---|---|
| `color-contrast` | Baselined | `text-primary` at small sizes does not reach the 4.5:1 WCAG AA ratio. |
| `aria-hidden-focus` | Baselined | Intermittent; see below. |

This is a **ratchet**, in the same spirit as `scripts/check-migration-indexes.mjs`:
any rule *not* listed fails the build, so the codebase cannot get worse, and
baselined findings are printed on every run (and attached as test annotations) so
they stay visible instead of quietly forgotten.

**Do not add a baseline entry to unblock a change.** Fix the change.

## Finding 1 — `color-contrast` (serious)

One root cause, three observed sites. All are `text-primary` rendered too small or
on a tinted surface:

| Element | Where |
|---|---|
| `<span class="block text-sm font-semibold">General</span>` | Settings nav, active tab (`ResponsiveAccordionTabTrigger.tsx`) |
| `<span class="block text-sm font-semibold">Work</span>` | Settings nav, active tab (same component) |
| `<span class="… rounded-full text-2xs font-semibold bg-primary/10 text-primary …">10/38</span>` | Work-directory count badge |

At 14px semibold the text is **not** "large text" under WCAG (that needs ≥18.66px
bold or ≥24px), so it must reach **4.5:1**, not 3:1.

**Why it is not fixed here:** `text-primary` is a global token used across the
app. The fix is a palette decision — darken `--primary`, or use a dedicated
higher-contrast token for small text on tinted surfaces — and that changes the
product's appearance everywhere. It needs a design owner, not a drive-by edit.

**Suggested direction:** keep `--primary` for accents/backgrounds and introduce a
`--primary-strong` (or reuse `--foreground`) for small text and badges.

## Finding 2 — `aria-hidden-focus` (serious, intermittent)

`aria-hidden="true"` must not wrap focusable content: a keyboard user can tab into
something a screen reader cannot announce.

Observed only on the dashboard and only on some runs, which points at
data-dependent widget rendering (KPI/widget cards appear once their data lands).

### A real ARIA conflict was found and fixed while investigating

`ProgressBar` (the SSOT progress/rate bar) spread `...props` onto the same element
that carried `role="progressbar"` + `aria-valuenow`. Eight call sites — attendance,
accounting (×3), sessions (×2), profile, question-bank (×2), dashboard charts —
pass `aria-hidden="true"` to mark a bar *decorative*, so those elements both
declared a widget **and** hid it from assistive tech. Two consequences:

1. An `aria-hidden-focus` violation at every one of those sites.
2. The progress value was never announced — the parent rows convey it only
   visually (their `aria-label` sits on a role-less `<div>`, which AT ignores).

The component now drops the widget role when marked decorative, so the two ARIA
contracts cannot contradict. Covered by
`apps/frontend/src/components/ui/ProgressBar.test.tsx`.

**Recommended follow-up (not done — it is a product decision).** Honouring
`aria-hidden` makes the violation go away, but it does not make the data
available: those bars carry real information (attendance rate, fee collection,
session utilisation) that is currently conveyed only visually. The more
accessible end state is to REMOVE `aria-hidden` at those call sites and give each
bar an accessible name via `aria-label`/`aria-labelledby` describing what it
measures ("Attendance rate for Grade 5"). That needs per-site labelling decisions
about context, which is why it is flagged here rather than done unilaterally.
`ProgressBar` supports it already: omit `aria-hidden` and it exposes the widget
with its value.

### Status: still baselined, deliberately

**This fix has NOT been confirmed as the cause of the dashboard finding**, so the
baseline entry stays. The evidence is weaker than it first appears:

- The violation is intermittent (~1 in 6 runs before the fix); 4 clean runs after
  it is supporting, not conclusive.
- The originally reported selector was **misleading**: my helper joined axe's
  `node.target` array with a space, and that array can hold multiple selectors for
  a multi-element target. It produced `.min-h-card-sm > .flex-shrink-0[aria-hidden="true"]`,
  which reads as one CSS selector but was two separate elements — that sent the
  investigation at the wrong component. The helper now joins with `>>` so the
  steps are distinguishable.

### Next step

Re-run until the violation fires and read the `html:` line the helper prints
(first offending node's `outerHTML`), then trace that element to its component. If
it turns out to be `ProgressBar`-related, delete the entry.

## Regenerating the baseline

After a deliberate UI change, list current findings without failing:

```bash
cd e2e && A11Y_COLLECT=1 npx playwright test tests/a11y-shell.spec.ts --reporter=list
```

Then update `A11Y_BASELINE`, removing entries that are genuinely fixed.

## Widening coverage

The smoke deliberately covers shell + one Work + one Setup surface. Most a11y
breakage comes from shared primitives (`AppLayout`, `FormModal`, `Table`, buttons,
inputs), which this exercises. Add a route to `AUDIT_ROUTES` when changing those
primitives, or when adding a new top-level surface — not per module, which would
multiply runtime without changing the class of regressions caught.

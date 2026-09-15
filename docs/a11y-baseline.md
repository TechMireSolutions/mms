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

**Status: root cause fixed (see below); entry pending one axe confirmation run.**

### Resolution

This was never three sites — it was one token-level defect with a very wide blast
radius. The light palette's semantic tokens were mid-tones picked for hue, and each
served three roles at once:

1. a solid fill — `bg-primary` with `text-primary-foreground` on it;
2. text/icons — `text-primary` on `--card` / `--background`;
3. text/icons on the token's own tint — `bg-primary/10 text-primary`, the standard
   chip pattern (188 usages at `/10`, plus `/15` and `/20` variants).

Measured against the pre-fix palette with the repo's own `getContrastRatio()`:

| Pair | Before | Now |
|---|---|---|
| `--primary-foreground` on `--primary` (every default Button label) | 2.61:1 | 5.91:1 |
| `--primary` as text on `--card` | 2.61:1 | 5.91:1 |
| `--destructive` as text on `--card` | 3.76:1 | 6.52:1 |
| `--success` as text on `--card` | 3.52:1 | 5.94:1 |
| `--warning` as text on `--card` | 3.16:1 | 5.96:1 |
| `--primary` on its own `/15` tint | 3.5:1 | 4.78:1 |
| `--ring` vs `--card` (WCAG 1.4.11, needs 3:1) | 2.61:1 | 5.91:1 |
| dark `--destructive` as text on `--card` | **1.66:1** | 5.29:1 |
| `--muted-foreground` on `--muted` | 3.95:1 | 4.61:1 |

Two structural fixes, not a spot patch:

- **Light theme** tokens are solved so all three roles clear 4.5:1 simultaneously.
  Roles (1) and (2) reduce to the same luminance constraint; role (3) is the
  binding one, because a tint of the token lightens the surface it is read
  against. The values therefore sit near Tailwind's **700** step, not 500/600 —
  `amber-600` (3.19:1), `emerald-600` (3.77:1) and `orange-600` (3.56:1) all fail
  AA with white text, let alone on a tint.
- **Dark theme** already used the correct "light solid + dark foreground" shape for
  `--primary`; `--destructive`, `--success`, `--warning` and `--info` were migrated
  to match, which is what fixed the 1.66:1 `text-destructive`.

A few resting chips used a tint stronger than one hue can satisfy (`/20`, `/30`),
and those were normalised to `/10`–`/15`. `dark:bg-<role>/20` chips became `/10`.

**Enforcement:** `apps/frontend/src/__tests__/designTokens.contrast.test.ts` parses
`src/index.css` and asserts every role against every surface, its own tint, and its
fill in both themes, using the shared `getContrastRatio()`. It fails if anyone
lightens a token without re-checking.

**Remaining step:** the axe gate is a rendered-browser check and has not been re-run
since the palette change, so the `color-contrast` entry stays for now. Delete it
when a CI run reports zero `color-contrast` nodes. A colour-contrast rule can also
fire on surfaces the tokens do not cover — disabled text at reduced opacity, or text
over a tenant gradient — and if it still fires, the `html:` line in the failure
output names the offending node.

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

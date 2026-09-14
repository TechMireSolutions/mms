---
name: mms-a11y-smoke
description: Runs accessibility smoke audits, axe-core scans, focus-return verification, and touch target checks across AppLayout, FormModal, Table, and interactive primitives. Use when authoring or refactoring UI components, shell layouts, or modal dialogs. Do NOT use for inventing design tokens (use mms-ui-ux-design) or building create/edit forms (use mms-form-architecture).
---

# MMS A11y Smoke Workflow

**Rules (norms SSOT):** `mms-testing-observability.mdc` · `mms-ui-ux-design.mdc` §3/§4 · `mms-form-architecture.mdc` (focus-return) · `mms-completion-review.mdc`.

Do **not** use to invent design tokens → `mms-ui-ux-design.mdc` rule. Do **not** use to build forms → `mms-form-architecture`. Full PR review → `mms-code-review`.

## Anti-Patterns & Banned Operations

- ❌ **NEVER omit accessible names**: Icon-only buttons must have `aria-label` or visually hidden label text.
- ❌ **NEVER show spinner-only pending states**: Long-running lists must use `aria-busy="true"` and polite live regions.
- ❌ **NEVER break keyboard focus trapping**: Modal dialogs and detail drawers must trap focus and return focus to the trigger on close.
- ❌ **NEVER use sub-44px touch targets**: Interactive controls must be at least 44x44px (`min-h-11 min-w-11`) on mobile viewports.

## Workflow

1. Confirm the change hits app shell or shared interactive primitives (AppLayout, FormModal, Table, buttons/inputs).
2. Keyboard path + accessible name/label spot-check on new controls.
3. FormModal/drawer: focus trap + **focus-return** to the opener on close.
4. Run `@axe-core/playwright` (or equivalent) on shell + one Work directory at **375** and **1440**; fail on serious/critical.
5. Work list pending: `aria-busy` / polite live region (not spinner-only) — `mms-ui-ux-design.mdc` §3.
6. Touch targets ≥ 44px (`min-h-11` / `min-w-11`); no page horizontal overflow.
7. Honor `prefers-reduced-motion`; semantic landmarks (`main`/`nav`/`section`) preserved.
8. When FormModal chrome touched: spot-check `dvh`/`svh` + safe-area — `mms-form-architecture.mdc`.
9. Responsive shell specs named in `mms-ui-ux-design.mdc` §4 when layout chrome changed.
10. If out of scope, state skip reason in completion review.

## Checklist

```
- [ ] axe serious/critical clean (or filed)
- [ ] Focus-return on FormModal/drawer
- [ ] Labels / aria-label on icon-only controls
- [ ] Work list pending: aria-busy / polite live region
- [ ] FormModal chrome: dvh/svh / safe-area when touched
- [ ] 375 / 768 / 1440 spot-check when shell touched
```

## Done

Completion-review a11y row satisfied — `mms-completion-review.mdc`.

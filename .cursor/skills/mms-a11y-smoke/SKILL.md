---
name: mms-a11y-smoke
description: Runs axe smoke and shell a11y checks (FormModal focus-return, 375/768/1440) when changing AppLayout, FormModal, DataTable, or shared interactive primitives. Use for a11y verification, not for inventing UI tokens.
---

# MMS A11y Smoke Workflow

**Rules (norms SSOT):** `mms-testing-observability.mdc` · `mms-ui-ux-design.mdc` §5/§7 · `mms-form-architecture.mdc` (focus-return) · `mms-completion-review.mdc`.

Do **not** use to invent design tokens → `mms-ui-ux-design.mdc` rule. Do **not** use to build forms → `mms-form-architecture`. Full PR review → `mms-code-review`.

## Workflow

1. Confirm the change hits app shell or shared interactive primitives (AppLayout, FormModal, DataTable, buttons/inputs).
2. Keyboard path + accessible name/label spot-check on new controls.
3. FormModal/drawer: focus trap + **focus-return** to the opener on close.
4. Run `@axe-core/playwright` (or equivalent) on shell + one Work directory at **375** and **1440**; fail on serious/critical.
5. Touch targets ≥ 44px (`min-h-11` / `min-w-11`); no page horizontal overflow.
6. Honor `prefers-reduced-motion`; semantic landmarks (`main`/`nav`/`section`) preserved.
7. Responsive shell specs named in `mms-ui-ux-design.mdc` §7 when layout chrome changed.
8. If out of scope, state skip reason in completion review.

## Checklist

```
- [ ] axe serious/critical clean (or filed)
- [ ] Focus-return on FormModal/drawer
- [ ] Labels / aria-label on icon-only controls
- [ ] 375 / 768 / 1440 spot-check when shell touched
```

## Done

Completion-review a11y row satisfied — `mms-completion-review.mdc`.

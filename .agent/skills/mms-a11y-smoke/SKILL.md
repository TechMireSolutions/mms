---
name: mms-a11y-smoke
description: Runs axe smoke and shell a11y checks (FormModal focus-return, 375/768/1440) when changing AppLayout, FormModal, Table, or shared interactive primitives. Use for a11y verification, not for inventing UI tokens.
---

# MMS A11y Smoke Workflow

**Rules (norms SSOT):** `mms-testing-observability.md` · `mms-ui-ux-design.md` §5/§7 · `mms-form-architecture.md` (focus-return) · `mms-completion-review.md`.

Do **not** use to invent design tokens → `mms-ui-ux-design.md` rule. Do **not** use to build forms → `mms-form-architecture`. Full PR review → `mms-code-review`.

## Workflow

1. Confirm the change hits app shell or shared interactive primitives (AppLayout, FormModal, Table, buttons/inputs).
2. Keyboard path + accessible name/label spot-check on new controls.
3. FormModal/drawer: focus trap + **focus-return** to the opener on close.
4. Run `@axe-core/playwright` (or equivalent) on shell + one Work directory at **375** and **1440**; fail on serious/critical.
5. Work list pending: `aria-busy` / polite live region (not spinner-only) — `mms-ui-ux-design.md` §5.
6. Touch targets ≥ 44px (`min-h-11` / `min-w-11`); no page horizontal overflow.
7. Honor `prefers-reduced-motion`; semantic landmarks (`main`/`nav`/`section`) preserved.
8. When FormModal chrome touched: spot-check `dvh`/`svh` + safe-area — `mms-form-architecture.md`.
9. Responsive shell specs named in `mms-ui-ux-design.md` §7 when layout chrome changed.
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

Completion-review a11y row satisfied — `mms-completion-review.md`.

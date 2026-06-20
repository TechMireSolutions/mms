---
description: Accessibility — WCAG baseline, focus, landmarks, RTL, screen readers
paths:
  - "apps/frontend/src/**/*.tsx"
  - "apps/frontend/src/index.css"
  - "apps/frontend/src/components/ui/**"
---

# MMS Accessibility

Radix primitives (Dialog, Popover, Select) provide baseline focus trap and ARIA — do not bypass with fully custom overlays (`mms-ui-forms.md`, `mms-ui-rendering.md`).

## Required patterns

| Area | Rule |
|------|------|
| **Page structure** | One `h1` per route via `PageHeader`; logical heading order |
| **Buttons** | Icon-only buttons need `aria-label` from `t('…')` |
| **Forms** | Labels associated with inputs (`htmlFor` / `id`); errors linked via `aria-describedby` on `FormModal` error banner |
| **Modals** | Use `Modal` / `FormModal` — focus trap + `Escape` to close; `useBodyScrollLock` (`mms-hooks.md`) |
| **Toasts** | `Toaster` region is announced — keep titles concise; use `notify` only (`mms-ui-rendering.md`) |
| **Dropdowns** | Custom panels: `role="listbox"` / `role="option"`, `aria-selected`, Arrow/Enter nav — already required in `mms-ui-rendering.md` |
| **Touch targets** | Min 44×44px interactive targets (`mms-frontend.md`) |
| **Motion** | Respect `prefers-reduced-motion` for Framer Motion loops (`mms-core.md`) |

## RTL (`ar`, `ur`, `fa`)

- `dir` from `useTranslation()` / `APP_LANGUAGES` — set on form shell when needed
- Logical properties: `text-start`, `ms-*`, `ps-*`, `border-s-*` — not hardcoded `left`/`right` (`mms-i18n.md`)

## Colour & status

- Do not rely on colour alone — pair `StatusBadge` with text label (`mms-ui-visual.md`)
- Contrast: primary text on glass surfaces must meet WCAG AA where feasible; use theme tokens not ad-hoc pastels

## Tables

- `DataTable`: `<th scope="col">` for column headers; sortable columns expose sort state (`aria-sort` target)

## Banned

```tsx
// ❌ Clickable div without role/keyboard
<div onClick={save}>Save</div>

// ❌ Title-only tooltip on critical action
<button><Trash2 /></button>

// ✅
<button type="button" aria-label={t('common.delete')}><Trash2 /></button>
```

## Checklist (new UI)

- [ ] Keyboard path works: Tab to control, Enter/Space activates
- [ ] Icon buttons have `aria-label`
- [ ] RTL layout checked for new form shells
- [ ] Status not conveyed by colour alone

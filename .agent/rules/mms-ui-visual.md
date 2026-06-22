---
trigger: model_decision
---

# MMS Visual & Permissions

## Visual standards

- **Surfaces:** Glassmorphism (`backdrop-blur`, translucent borders) — match existing module cards.
- **Charts:** Recharts only.
- **Theme:** CSS variables from `branding` + `global_settings`; `useBranding()` / `App.tsx` injection.
- **Accessible brand colours:** `@mms/shared` `brandingTheme.ts` + `logoBrandColors.ts` — WCAG AA on primary/accent and muted text tokens; FE previews use derived tokens (`BrandColorPanel`), not raw hex on surfaces.
- **Responsive:** Mobile-first — `mms-frontend.md` owns breakpoints and touch targets.
- **Motion:** Honour `prefers-reduced-motion` for decorative Framer loops (`mms-a11y.md`).

## Semantic status

```tsx
// ❌ Hardcoded colour map
const c = status === 'paid' ? 'text-green-500' : 'text-red-500';

// ✅ Config-driven
<StatusBadge statusKey={record.status} />
```

Status labels and colours belong in settings or a status registry — not scattered in components. Labels use `labelKey` + `t()` when shown outside `StatusBadge` (`mms-i18n.md`).

Destructive/success/warning affordances use semantic tokens (`text-destructive`, `bg-destructive/10`, theme `--success`) — never raw `red-500` / `green-500` (`mms-ui-rendering.md`).

## Permissions visibility

Role checks and API gates → **`mms-rbac.md`**. Summary: use `can()` / `usePermissions`; forbidden elements must **not render**.

## Current vs target

| Topic | Current | Target |
|-------|---------|--------|
| Role checks | Scattered `role ===` (~8 files) | `can()` — see `mms-rbac.md` |
| Status colours | Inline `text-green-500` / `text-red-500` (~30 files) | `StatusBadge` + config |
| Glassmorphism | Most modules | Consistent on all cards/panels |

### Status colour debt (migrate when touching)

Accounting, obligations, finance widgets, dashboard tables, reports — grep `text-green-500` / `text-red-500` under `apps/frontend/src/components/` and replace with `StatusBadge` or semantic tokens (`text-destructive`, theme `--success`).

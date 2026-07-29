---
description: Module-embedded analytics, exports, report builder
paths:
  - "apps/frontend/src/lib/reports/**"
  - "apps/frontend/src/tenant/features/**"
  - "apps/frontend/src/tenant/features/dashboard*/**"
  - "apps/frontend/src/components/ui/ExportToolbar.tsx"
  - "apps/frontend/src/components/ui/SafeResponsiveContainer.tsx"
---

# MMS Reports & Analytics

**Placement & per-module categories** → `mms-module-architecture.md`. This file covers report **implementation** only.

## Data (Query-first)

- Prefer TanStack Query / server aggregates / module `/metrics` for REST-migrated modules.
- `getCollection` / `useLiveCollection` only for legacy non-migrated report sources — never as the primary path for REST entities.
- No stale snapshot caches unless the user explicitly exports.
- Hydrate cross-module ids via batch `/resolve` — ban N+1 client loops.

## Definitions

- Shared metadata/utils: `@/lib/reports/*` (feature paths may re-export)
- `CustomReportBuilder` / `DynamicCardBuilder` — ad-hoc columns + aggregates (Sum, Avg, Count)
- Preview cap: 20 rows before full run
- Column picker keys must match field registry keys where applicable
- Module report category must be module-specific — never `category="academic"` on module reports

## Export (`ExportToolbar`)

| Format | Implementation |
|--------|----------------|
| Print | CSS `@media print` — hide chrome |
| Excel | `xlsx` via dynamic `import()` |
| PDF | `jspdf` + `jspdf-autotable` — auto page size/orientation |

Use shared `ExportToolbar` (`@/components/ui/ExportToolbar`) — not a deleted `ReportExportBar`. Charts: `lazy` + `SafeResponsiveContainer`. Escape formula-prefix cells (`=`, `+`, `-`, `@`) in CSV/Excel.

## Visual

Recharts + semantic colours (`StatusBadge` / design tokens). Export/print labels via `t()` — `mms-settings-i18n.md`.

## Dashboard widgets

`PinnedWidgets` / dashboard cards — config in `reports_*` collections or objects, not hardcoded in `Dashboard.tsx`.

## Module-aware filters

Hide irrelevant filters per module context — do not show finance filters on attendance reports.

## Permissions & export policy

Exports must respect active filters, search, field visibility, soft-deletion policy, and `can()` — same boundary as Work (`mms-module-architecture.md` §6–§7). Audit large/sensitive exports (target — `mms-auth-security.md`).

## Drill-down (target)

Chart segment / summary row → Work directory with equivalent filters (URL/search params when practical), preserving RBAC.

## Saved reports

Save **report logic** (filters, columns, aggregates), not a data snapshot. Re-run against current authorised data. If a saved field/tab is archived, show an explicit error — do not fail silently.

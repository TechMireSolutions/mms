---
name: mms-reports-export
description: Builds MMS module analytics, CustomReportBuilder, Recharts dashboards, and PDF/Excel/print exports. Use when editing Reports tabs, KPIs, ExportToolbar, drill-down, saved reports, or dashboard widgets.
---

# MMS Reports & Export Workflow

**Rules:** `mms-reports.md`, `mms-module-architecture.md`, `mms-ui-ux-design.md`, `mms-settings-i18n.md`.

## Placement

Reports tab **inside** each module — no standalone `/reports` page. Shared UI: `apps/frontend/src/components/reports/` · utils: `@/lib/reports/*`.

## Data (Query-first)

```ts
// ✅ REST modules — Query / server aggregates / /metrics
const { data, isError } = useModuleReportQuery(...)

// ✅ Dashboard widgets / visualizer
useWidgetCollections({ requiredCollections })
useReportCollectionRows(collectionKey)

// ❌ Do not use as primary for REST entities
useLiveCollection('finance_invoices', SEED)
getCollection('finance_invoices') // primary read
saveCollection('students', rows)  // widget toggle
```

- Module category must be module-specific — never `category="academic"`.
- Cross-module ids via batch `/resolve` — no N+1 hydrate loops.
- Charts: `lazy` + `SafeResponsiveContainer`.
- Widget toggles: `persistWidgetRecordToggle` — not `saveCollection`.
- **Dashboard / KPI SSOT**: home seeded cards + report standard KPIs → category-gated `use*Metrics` / widget-aggregates. Gate `useWidgetCollections({ requiredCollections })` for pinned widgets / builder / drilldown; visualizer → `useReportCollectionRows`. Niche charts/statements may Query-reduce rows when aggregates unavailable — never localStorage-primary for REST. Ban fake faculty hours (`hours += 2`); use real class counts.

## Add / change a report

1. Register metadata in `@/lib/reports` / `reportMetadata` when shared.
2. Embed in module Reports tab; show `ErrorState` when query-backed and `isError`.
3. Module-aware filters only.
4. Drill-down target: chart/summary → Work with equivalent filters (URL params when practical).
5. Saved reports: save **logic** (filters/columns/aggregates), not snapshots.
   - Generic modules → `/api/saved-reports?category=` (typed `saved_reports` table).
   - Contacts (share scopes) → `/api/contacts/saved-reports` only; category `contacts` in the same table — never resurrect `contacts_saved_reports` objects.

## Export

| Format | Import |
|--------|--------|
| Print | CSS `@media print` |
| Excel | `await import('xlsx')` |
| PDF | `await import('jspdf')` + autotable |

Use shared `ExportToolbar` — not a deleted `ReportExportBar`. Escape formula-prefix cells (`=`, `+`, `-`, `@`). Respect filters, RBAC, field visibility, soft-delete policy, `can()`.

## Checklist

```
- [ ] Query/server data for REST modules
- [ ] KPI StatCards on `/metrics` where available — no forced collection dumps for those values
- [ ] Widget collections gated with requiredCollections
- [ ] No academic category on module reports
- [ ] lazy charts + SafeResponsiveContainer
- [ ] Tables / drill-down grids in `overflow-x-auto`; no page-level horizontal scroll at 375px
- [ ] Print/paper previews hosted in scroll/scale containers (px/`mm` OK for print fidelity)
- [ ] Export labels via t(); formula injection escaped
- [ ] Permissions match Work boundary
```

## Done

`pnpm typecheck` · FE lint — `mms-completion-review.md`.

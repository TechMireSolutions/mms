---
name: mms-reports-export
description: Builds MMS module analytics, CustomReportBuilder, Recharts dashboards, and PDF/Excel/print exports. Use when editing Reports tabs, KPIs, ExportToolbar, drill-down, saved reports, or dashboard widgets.
---

# MMS Reports & Export Workflow

**Rules:** `mms-reports.mdc`, `mms-module-architecture.mdc`, `mms-ui-ux-design.mdc`, `mms-settings-i18n.mdc`.

## Placement

Reports tab **inside** each module — no standalone `/reports` page. Shared UI: `apps/frontend/src/components/reports/` · utils: `@/lib/reports/*`.

## Data (Query-first)

```ts
// ✅ REST modules — Query / server aggregates / /metrics
const { data, isError } = useModuleReportQuery(...)

// ❌ Do not use as primary for REST entities
useLiveCollection('finance_invoices', SEED)
```

- Module category must be module-specific — never `category="academic"`.
- Cross-module ids via batch `/resolve` — no N+1 hydrate loops.
- Charts: `lazy` + `SafeResponsiveContainer`.

## Add / change a report

1. Register metadata in `@/lib/reports` / `reportMetadata` when shared.
2. Embed in module Reports tab; show `ErrorState` when query-backed and `isError`.
3. Module-aware filters only.
4. Drill-down target: chart/summary → Work with equivalent filters (URL params when practical).
5. Saved reports: save **logic** (filters/columns/aggregates), not snapshots.

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
- [ ] No academic category on module reports
- [ ] lazy charts + SafeResponsiveContainer
- [ ] Tables / drill-down grids in `overflow-x-auto`; no page-level horizontal scroll at 375px
- [ ] Print/paper previews hosted in scroll/scale containers (px/`mm` OK for print fidelity)
- [ ] Export labels via t(); formula injection escaped
- [ ] Permissions match Work boundary
```

## Done

`pnpm typecheck` · FE lint — `mms-completion-review.mdc`.

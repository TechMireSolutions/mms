---
name: mms-reports-export
description: Builds MMS module analytics, CustomReportBuilder, Recharts dashboards, and PDF/Excel/print exports. Use when editing reports, analytics tabs, KPIs, ReportExportBar, or dashboard widgets.
---

# MMS Reports & Export Workflow

## Placement

Analytics tab **inside** each module — no standalone `/reports` page.

Components: `apps/frontend/src/components/reports/`

## Data

Live only:

```ts
const data = useLiveCollection('finance_invoices', SEED);
// or getCollection at render — no stale snapshots
```

## Add module report

1. Register in `reportMetadata.ts` if shared definition needed
2. Embed in module page Analytics tab via `ModuleReports` / custom component
3. Module-aware filters — hide irrelevant chips
4. Recharts for charts; glassmorphism cards

## Export

Use `ReportExportBar` pattern:

| Format | Import |
|--------|--------|
| Print | CSS `@media print` |
| Excel | `await import('xlsx')` |
| PDF | `await import('jspdf')` + autotable |

## Ad-hoc builder

`CustomReportBuilder`: drag columns, aggregates (Sum/Avg/Count), 20-row preview.

## Dashboard widgets

## Widgets

`PinnedWidgets.tsx` — config from `reports_*` collections/objects. Shared logic split into `components/reports/pinnedWidgets/` (types, widgetDataUtils, widgetDefaults). Re-export from `PinnedWidgets.tsx` for stable imports.

## Rules

`.cursor/rules/mms-reports.mdc`, `mms-ui-visual.mdc`

---
description: Module-embedded analytics, exports, report builder
paths:
  - "apps/frontend/src/components/reports/**"
  - "apps/frontend/src/pages/**/*.tsx"
  - "apps/frontend/src/components/dashboard/**"
---

# MMS Reports & Analytics

**Placement & per-module categories** → `mms-module-isolation.md`. This file covers report **implementation** only.

## Data

- **Live bindings** — `getCollection` / `useLiveCollection` at render time.
- No stale snapshot caches unless user explicitly exports.

## Definitions

- `reportMetadata.ts` — report types, module relevance
- `CustomReportBuilder` / `DynamicCardBuilder` — ad-hoc columns + aggregates (Sum, Avg, Count)
- Preview cap: 20 rows before full run
- Column picker keys must match field registry keys where applicable

## Export (`ReportExportBar`)

| Format | Implementation |
|--------|----------------|
| Print | CSS `@media print` — hide chrome |
| Excel | `xlsx` via dynamic `import()` |
| PDF | `jspdf` + `jspdf-autotable` — auto page size/orientation |

## Visual

Glassmorphism containers · Recharts charts · semantic colours from config (`StatusBadge` patterns). Export/print button labels via `t()` — `mms-i18n.md`.

## Dashboard widgets

`PinnedWidgets` / dashboard cards — config in `reports_*` collections or objects, not hardcoded in `Dashboard.tsx`.

## Module-aware filters

Hide irrelevant filters per module context — do not show finance filters on attendance reports.

## Export safety

- CSV/Excel exports: escape formula-prefix cells (`=`, `+`, `-`, `@`) to prevent spreadsheet injection
- Large exports: stream or chunk — avoid blocking main thread; keep dynamic `import()` for `xlsx`/`jspdf` (`mms-frontend.md`)

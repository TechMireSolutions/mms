---
description: Module-embedded analytics, exports, report builder. Applies to tenant module reports and any platform analytics pages.
paths:
  - "apps/frontend/src/lib/reports/**"
  - "apps/frontend/src/tenant/features/**/*Report*"
  - "apps/frontend/src/tenant/features/**/*Reports*"
  - "apps/frontend/src/platform/components/reports/**"
  - "apps/frontend/src/tenant/features/dashboard*/**"
  - "apps/frontend/src/platform/**/*Report*"
  - "apps/frontend/src/components/ui/ExportToolbar.tsx"
  - "apps/frontend/src/components/ui/ExportToolbarCompact.tsx"
  - "apps/frontend/src/components/ui/exportToolbarUtils.ts"
  - "apps/frontend/src/components/ui/SafeResponsiveContainer.tsx"
  - "packages/shared/src/*Report*.ts"
---

# MMS Reports & Analytics

**Workflow skills:** charts/exports/KPIs → `mms-reports-export` · mega export job tray → `mms-background-jobs`. Query policy → `mms-data-layer.md` · skill `mms-query-factories`.

## 1. Data Layer (Query-First)

- Use TanStack Query, server aggregates, or module `/metrics` for REST entities. `useLiveCollection` / `getCollection` are restricted to legacy non-migrated entities.
- Widgets/builders/drilldown: `useWidgetCollections({ requiredCollections })` — fetch only pinned collections.
- Chart visualizer: `useReportCollectionRows(collectionKey)`. Contacts visualizer uses SQL `GROUP BY` via `POST /api/contacts/widget-aggregates` (ban capped dumps).
- Widget toggles / Hasanat drilldown deletes: persist via REST helpers (`persistWidgetRecordToggle`), not `saveCollection`.
- Hydrate cross-module IDs via batch `/resolve` endpoints (ban N+1 client loops). No stale snapshot caches unless explicitly exported.

## 2. Definitions & Builders

- Shared metadata/utilities in `@/lib/reports/*`.
- `CustomReportBuilder` / `DynamicCardBuilder`: ad-hoc columns + aggregates (Sum, Avg, Count). Cap live preview at 20 rows.
- Column picker keys match field registry keys. Module report category must be module-specific (never generic `"academic"`).

## 3. Export Architecture (ExportToolbar)

- Formats: Print (CSS `@media print`), Excel (`xlsx` dynamic `import()`), PDF (`jspdf` + `jspdf-autotable`).
- Use shared `ExportToolbar` / `ExportToolbarCompact` (`exportToolbarUtils.ts`). Charts use `lazy` + `SafeResponsiveContainer`.
- Escape untrusted cells with formula prefixes (`=`, `+`, `-`, `@`) in CSV/Excel; preserve negative numbers.
- Exports exceeding interactive thresholds offload to BullMQ worker + download tray (`mms-module-architecture.md` §5).

## 4. Visualizations & Chart Rules

- Recharts + semantic design tokens (`StatusBadge`). Export/print labels via `t()`. Ban simulated workload hours (`hours += 2`); use actual class counts.

## 5. Dashboard & KPI SSOT

- Pinned widgets/cards configure via `kpi_custom_widgets` (`DASHBOARD_WIDGETS_KEY`) and typed `saved_reports`.
- Data sources:
  - Seeded KPIs: Category-gated `use*Metrics` / widget-aggregates.
  - Pinned widgets / builders: `useWidgetCollections` Query facades.
  - Dynamic charts: `useReportCollectionRows` (Contacts uses `/widget-aggregates` SQL series).
  - Financial statements: `/metrics` / server aggregates; row-level Query reduce permitted when server aggregates unavailable.

## 6. Module-Aware Filters

- Context-sensitive filters only (hide finance filters on attendance reports).

## 7. Permissions, Export Policy & Drill-Down

- Respect active filters, search, field visibility, soft-delete policies, and `can()`. Adhere to manifest `softDelete`: `reportsIncludeDeleted: false` displays only active rows; `exportsIncludeDeleted: false` hides export CTAs in trash.
- Chart segment / summary row drill-down links to Work directory with equivalent URL filter params, preserving RBAC.

## 8. Saved Reports

- Persist report logic (filters, columns, aggregates), not static data snapshots. Error explicitly if saved fields/tabs are archived.
- Generic modules: typed `saved_reports` + FORCE RLS via `/api/saved-reports?category=`.
- Contacts: `category: 'contacts'` with share scopes inside `filters` JSONB via `/api/contacts/saved-reports` (not generic category enum; not `objects` store).

## 9. Audit Trail & Compliance Reporting

- Compliance exports (`POST /api/audit/export`) embed cryptographic chain hashes, Merkle roots, and verification signatures in metadata.
- Audit data access is auditable: view sessions, searches, and exports targeting audit records emit immutable audit events (`action_type: 'VIEW'`).

---
name: mms-reports-export
description: Builds MMS module analytics, CustomReportBuilder, Recharts dashboards, and PDF/Excel/print exports. Use when editing Reports tabs, KPIs, ExportToolbar, drill-down, saved reports, or dashboard widgets. Do NOT use for primary entity CRUD directories (use mms-module-work), multi-tier module layout (use mms-module-page), or background worker scheduling (use mms-background-jobs).
---

# MMS Reports & Export Workflow

**Rule (norms SSOT):** `mms-reports.mdc` · `mms-data-layer.mdc` · `mms-performance.mdc` §1-2 · `mms-module-architecture.mdc`.
**Workflows:** `/feature-module` · **Manifest:** `.agent/skills-manifest.json`

## Placement

Reports tab **inside** each module — no standalone `/reports` page. Shared UI: `apps/frontend/src/components/ui/reports/` · utils: `@/lib/reports/*`.

## Data (Query-first)

REST reports/KPIs use Query hooks / `/metrics` — not localStorage-primary. Factories → **`mms-query-factories`**.

```ts
// ✅ REST modules — Query / server aggregates / /metrics
const { data, isError, refetch } = useModuleReportAggregatesQuery(...)

// ✅ Dashboard widgets / visualizer
useWidgetCollections({ requiredCollections })
useReportCollectionRows(collectionKey)

// ❌ Never — collection dumps for chart data
useLiveCollection('finance_invoices', SEED)          // banned for REST entities
getCollection('finance_invoices')                    // primary read banned
useFinanceInvoicesPaginated({ page: 1, limit: 500 }) // 500-row client dump banned
saveCollection('students', rows)                     // widget toggle banned
```

- Module category must be module-specific — never `category="academic"`.
- Cross-module ids via batch `/resolve` — no N+1 hydrate loops.
- Charts: `lazy` + `SafeResponsiveContainer` — recharts must NOT be imported directly in report parent components.
- Widget toggles: `persistWidgetRecordToggle` — not `saveCollection`.
- **Aggregation on server only**: charts showing monthly/weekly/daily bucketing require a `/report-aggregates` backend endpoint. No `limit:500` page dump + client `reduce()`.
- **QueryOptions**: report aggregate queries use `staleTime: 5 * 60 * 1000` — reports are not real-time.
- **Dashboard / KPI SSOT**: home seeded cards + report standard KPIs → category-gated `use*Metrics` / widget-aggregates. Gate `useWidgetCollections({ requiredCollections })` for pinned widgets / builder / drilldown; visualizer → `useReportCollectionRows`. Niche charts/statements may Query-reduce rows when aggregates unavailable — never localStorage-primary for REST. Ban fake faculty hours (`hours += 2`); use real class counts.
- **Soft-Delete Manifest Compliance**: Analytical dashboards must respect manifest `softDelete.reportsIncludeDeleted: false` by querying only active records (`WHERE deleted_at IS NULL`). Exports must respect manifest `softDelete.exportsIncludeDeleted: false` by hiding export buttons in trash mode and excluding archived rows (`docs/soft-delete.md` §5 & §7.6 · `mms-soft-delete`).

## Tier Shell Standard

Every `*ReportsTier.tsx` must use this exact shell — no inner wrapper divs:

```tsx
export function ModuleReportsTier(): React.JSX.Element {
  return (
    <ModuleTierMotion tier="reports" className="space-y-4">
      <ErrorBoundary>
        <KPISummary category="moduleName" />
        <ModuleReports category="moduleName" />
      </ErrorBoundary>
    </ModuleTierMotion>
  );
}
```

## Chart Rules & Lazy Loading
- **Chart Component Isolation**: Recharts must NOT be imported directly into parent report components. Extract chart JSX into a `{Module}ReportCharts.tsx` sibling and lazy-load it with Suspense and Skeleton fallback.
- **Safe Responsive Container**: Wrap all charts in `ReportChartCard` (which enforces `SafeResponsiveContainer` and handles empty states).
- **Reference Example**: [examples/ModuleReportCharts.tsx](file:///Users/syedaalin/Documents/mms/.agent/skills/mms-reports-export/examples/ModuleReportCharts.tsx).

## Add / Change a Report

1. Add a `/api/{module}/report-aggregates` backend route if new monthly/weekly data bucketing is needed.
2. Create a `use{Module}ReportAggregates` query hook with `staleTime: 5 * 60 * 1000`.
3. Register metadata in `@/lib/reports` / `reportMetadata` when shared across modules.
4. Extract chart JSX into a `{Module}ReportCharts.tsx` sibling — lazy-load it from the parent.
5. Embed in module Reports tab; show `ErrorState` (with `description` hint) when query-backed and `isError`.
6. Add module-aware filters only — update `CATEGORY_FILTERS` in `ReportFilters.tsx`.
7. Wire drill-down: chart segment `onClick` → push URL params → Work directory with equivalent filters.
8. Saved reports: save **logic** (filters/columns/aggregates), not snapshots.
   - Generic modules → `/api/saved-reports?category=` (typed `saved_reports` table).
   - Contacts (share scopes) → `/api/contacts/saved-reports` only; category `contacts` in the same table — never resurrect `contacts_saved_reports` objects.
9. Add `aria-label` on the `<section>` root and `aria-label` on each `ReportChartCard`.
10. All text rendered in charts (axis, tooltips, legends) must go through `t()`.

## Export Standards & Compliance
Detailed size gates, background queuing, formula injection protection, and tamper-evident compliance export specs:
- Reference [references/export-standards.md](file:///Users/syedaalin/Documents/mms/.agent/skills/mms-reports-export/references/export-standards.md) · `mms-background-jobs`.

## Accessibility Checklist

```
- [ ] <section aria-label={t('module.reports.aria')}> on report root
- [ ] aria-hidden="true" on chart containers (table is the accessible alternative)
- [ ] <table> has <caption> or aria-labelledby pointing to section heading
- [ ] Interactive chart bars/segments: tabIndex={0} + onKeyDown Enter/Space drill-down
- [ ] KPI delta badges: aria-label="Up 12% vs last month" (not just colored icon)
- [ ] ExportToolbar shows spinner + aria-busy="true" during export
```

## Filter Standards

```
- [ ] Date range defaults to current academic session (or current month for finance)
- [ ] Date strings normalized to UTC midnight before querying
- [ ] Free-text debounced 300ms
- [ ] Filter state URL-serializable (bookmarkable)
- [ ] Clearing a filter resets to module default, not unbounded "all time"
- [ ] CATEGORY_FILTERS in ReportFilters.tsx updated for new module
```

## i18n / Formatting

```
- [ ] All chart labels, tooltips, legends via t()
- [ ] Numbers via formatNumber() from @mms/shared
- [ ] Currency via formatCurrency()
- [ ] Month/date labels via formatMonthName() / formatDate() from @mms/shared
- [ ] Export column headers via t() — same keys as table column headers
```

## Completion Checklist

```
- [ ] Query/server data for REST modules — no limit:500 page dumps
- [ ] /report-aggregates backend route for any new monthly/weekly bucketing
- [ ] staleTime: 5 * 60 * 1000 on report aggregate queries
- [ ] KPI StatCards on /metrics where available — no forced collection dumps
- [ ] Widget collections gated with requiredCollections
- [ ] No academic category on module reports
- [ ] Chart JSX in lazy-loaded sibling file; parent imports via lazy() + Suspense
- [ ] SafeResponsiveContainer via ReportChartCard (not raw ResponsiveContainer)
- [ ] Skeleton fallback on Suspense; EmptyState via emptyNode on ReportChartCard
- [ ] ErrorState with description hint when isError
- [ ] Tables / drill-down grids in overflow-x-auto; no page-level scroll at 375px
- [ ] Print: isAnimationActive={false} on charts for @media print
- [ ] ExportToolbar uses columns+rows API (not deprecated data+headers)
- [ ] Export filename includes module + date range + timestamp
- [ ] Formula injection escaped in Excel/CSV cells
- [ ] PII exports logged to audit log
- [ ] Tamper-evident compliance exports embed chain hash + Merkle root proof
- [ ] Accessing audit logs emits 'VIEW' audit entry (Auditing the Auditor)
- [ ] Background job for exports >500 rows Excel / >200 rows PDF
- [ ] Permissions match Work boundary (can(), field visibility, soft-delete policy: reportsIncludeDeleted / exportsIncludeDeleted from manifest; Export CTA hidden in trash mode)
- [ ] a11y: aria-label, table caption, keyboard drill-down, aria-busy on export
- [ ] All strings via t(); numbers via formatNumber(); dates via formatDate()
- [ ] Filter state URL-serializable; date ranges UTC-normalized
- [ ] Tier shell: ModuleTierMotion space-y-4, no inner wrapper divs
```

## Done

`pnpm typecheck` · `cd apps/frontend && pnpm lint` — `mms-completion-review.mdc`.

---
name: mms-reports-export
description: Builds MMS module analytics, CustomReportBuilder, Recharts dashboards, and PDF/Excel/print exports. Use when editing Reports tabs, KPIs, ExportToolbar, drill-down, saved reports, or dashboard widgets.
---

# MMS Reports & Export Workflow

**Rules:** `mms-reports.md`, `mms-data-layer.md` (Query-first policy), `mms-performance.md` §1-2 (Server Aggregates, Streaming & Heavy Exports), `mms-module-architecture.md`, `mms-ui-ux-design.md`, `mms-settings-i18n.md`.

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

## Chart Rules

```tsx
// ✅ Lazy-loaded chart component — recharts stays out of the Reports tab initial bundle
const ModuleReportCharts = lazy(() =>
  import('./ModuleReportCharts').then((mod) => ({ default: mod.ModuleReportCharts })),
);

// ✅ Usage with Suspense skeleton
<Suspense fallback={<Skeleton className="h-chart-md w-full rounded-xl" />}>
  <ModuleReportCharts data={aggregates} />
</Suspense>

// ✅ All charts wrapped in ReportChartCard (includes SafeResponsiveContainer)
<ReportChartCard title={t('module.reports.chartTitle')} accentColor="primary" heightClass="h-chart-md">
  <BarChart data={data} barSize={28}>
    <XAxis dataKey="name" tick={chartAxisTick(10)} />
    <YAxis tick={chartAxisTick(11)} />
    <Tooltip formatter={(v) => [formatNumber(v), t('module.reports.label')]} />
    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
  </BarChart>
</ReportChartCard>

// ✅ Empty state inside chart card
<ReportChartCard
  empty={data.length === 0}
  emptyNode={<EmptyState icon={BarChart2} title={t('module.reports.noData')} compact />}
>
  ...
</ReportChartCard>

// ❌ Banned — direct recharts import in non-lazy component
import { BarChart, Bar } from 'recharts'; // in a parent report component
```

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

## Export

| Format | Implementation | Size gate | Notes |
|--------|----------------|-----------|-------|
| Print | CSS `@media print` | any | Set `isAnimationActive={false}` on charts for print |
| CSV | Streaming `ReadableStream` → `Blob` | always stream | No full in-memory stringify |
| Excel | `xlsx` via dynamic `import()` (FE inline) | ≤500 rows | `resolveRows` callback — never pass raw in-memory array >1000 items |
| Excel large | Backend ExcelJS stream pipe via BullMQ | >500 rows → background | Background job + tray download |
| PDF | `jspdf` + `jspdf-autotable` (FE inline) | ≤200 rows | |
| PDF large | Backend Typst worker via BullMQ | >200 rows → background | Background job + tray download |

- Use shared `ExportToolbar` — not a deleted `ReportExportBar`.
- Always use `columns`+`rows` prop API on `ExportToolbar` — not the deprecated `data`+`headers`.
- Escape formula-prefix cells (`=`, `+`, `-`, `@`) — formula injection vector.
- Export filename: `{module}-report-{date-range}-{YYYY-MM-DD}.{ext}`.
- Include `generatedAt` timestamp and `generatedBy` in the export file header row.
- Respect filters, RBAC, field visibility, soft-delete policy, `can()`.
- Log PII exports to audit log before streaming.
- Background export jobs must emit BullMQ progress events at ≥10% increments.

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
- [ ] Background job for exports >500 rows Excel / >200 rows PDF
- [ ] Permissions match Work boundary (can(), field visibility, soft-delete)
- [ ] a11y: aria-label, table caption, keyboard drill-down, aria-busy on export
- [ ] All strings via t(); numbers via formatNumber(); dates via formatDate()
- [ ] Filter state URL-serializable; date ranges UTC-normalized
- [ ] Tier shell: ModuleTierMotion space-y-4, no inner wrapper divs
```

## Done

`pnpm typecheck` · `cd apps/frontend && pnpm lint` — `mms-completion-review.md`.

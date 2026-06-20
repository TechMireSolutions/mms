---
description: Module tab isolation — Work, Reports, Setup content must belong to that module only
paths:
  - "apps/frontend/src/pages/**/*.tsx"
  - "apps/frontend/src/components/reports/**/*.tsx"
---

# MMS Module Isolation

Every feature module page uses **exactly three top-level tabs** from `useModuleTierTabs()`:

```
work | reports | setup
              └─ Fields | Preferences (and module-specific setup sub-tabs)
```

## Tier ownership

| Tier id | Allowed content | Banned |
|---------|-----------------|--------|
| **work** | CRUD, lists, wizards, mark/record flows, module dashboards scoped to that domain | KPI rows, `ModuleReports`, cross-module widgets, report builders, other modules' summaries |
| **reports** | `KPISummary` (module category only), `ModuleReports` / module report panels, charts derived from this module's collections | Foreign-module KPIs, invoice widgets on Obligations, Hasanat payouts on Finance, enrollment reports under Work |
| **setup** | `{module}_settings`, field registries, preferences, RBAC matrix (Users) | Live data tables, analytics, global institution settings (those live under `/settings`) |

**Dashboard** (`/`) is not a feature module — it may show cross-module pinned widgets but does not use the three-tier shell. New feature modules must not mimic Dashboard layout; use `useModuleTierTabs` + `ResponsiveAccordionTabs`.

## Module category mapping

Pass the **module's own** analytics category — never a shared umbrella that pulls foreign KPIs:

| Module | `KPISummary` / `ModuleReports` category |
|--------|----------------------------------------|
| Contacts | `contacts` |
| Students | `students` |
| Sessions | `sessions` |
| Enrollments | `enrollments` |
| Attendance | `attendance` |
| Examinations | `examinations` |
| Question Bank | `questionBank` |
| Hasanat Cards | `hasanat` |
| Finance | `financial` |
| Accounting | `accounting` (+ `FinancialReports` — not generic finance invoices) |
| Obligations | obligations-local components only — not `financial` |
| Users | `faculty` reports only; no foreign attendance/finance KPIs |

**Banned:** `category="academic"` on module pages (mixed enrollments + exams + attendance KPIs).

## Placement rules

1. **`KPISummary` only inside the Reports tab** — never above `ResponsiveAccordionTabs` (visible on all tiers).
2. **Reports only in Reports** — no Work sub-tab named "Reports" unless it is operational export (rare); prefer Reports tier.
3. **PageHeader actions** stay module-scoped; no links/widgets to other modules.
4. **Custom card / widget builders** in `ModuleReports` must default `initialCollection` to the active module's collection.

## Checklist (new or refactored module page)

```
- [ ] Three tiers via useModuleTierTabs + ResponsiveAccordionTabs
- [ ] Work = transactional UI only (`work` tab)
- [ ] Reports = KPISummary(moduleCategory) + module reports/charts (`reports` tab)
- [ ] Setup = *Settings panel(s) only (`setup` tab)
- [ ] No sibling-module imports in Work/Reports (e.g. Finance → HasanatPayouts)
- [ ] category prop matches module table above
```

Reference: `Contacts.tsx`, `Students.tsx`, `Finance.tsx` after isolation pass.

Heavy Work/Reports trees: wrap in `ErrorBoundary` per tier (`mms-observability.md`).

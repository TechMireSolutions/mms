---
name: mms-module-page
description: Creates or modifies MMS module pages per globle.md — Work, Reports, Setup tiers, module contract, PageHeader command centre, and settings panels. Use when adding a module, three-tier page, or aligning an existing module to universal architecture.
---

# MMS Module Page Pattern

**Source:** [`globle.md`](../../globle.md) (§1–§14) · Rule: `mms-module-architecture.mdc`

## globle.md section map

| § | Topic | MMS rule / skill |
|---|--------|------------------|
| 1 | Global foundation (contract, RBAC, audit, offline, soft delete, integrity) | `mms-module-architecture.mdc`, `mms-rbac.mdc`, `mms-security.mdc` |
| 2 | Command centre (metrics, dedup, export, create) | `mms-ui-tabs.mdc` PageHeader, `mms-contacts.mdc` |
| 3 | Work directory | `mms-module-isolation.mdc`, `mms-ui-rendering.mdc` |
| 4 | Reports analytics | `mms-reports.mdc`, skill `mms-reports-export` |
| 5–7 | Setup tab | `mms-module-setup.mdc`, skill **`mms-module-setup`** |
| 6 | Fields/tabs | `mms-fields.mdc`, skill `mms-fields-registry` |
| 7 | Preferences | `mms-config.mdc` |
| 8–14 | Jobs, errors, perf, a11y, security | `mms-module-crosscutting.mdc` |

## Required structure

```
PageHeader (command centre — always visible)
work  |  reports  |  setup
                    └─ Fields | Preferences | (module extras)
```

## Reference implementations

| Module | Architecture alignment | Data layer | Primary hooks |
|--------|-------------------------|------------|---------------|
| **Contacts** | **Full globle1 reference** — contract, metrics, dedup, soft delete, field RBAC, cards, drill-down, sync outbox, saved reports | REST + Query + hybrid cache | `useContactsPageState`, `useContacts`, `useContactMutations`, `useContactsSyncOutbox` |
| Students | REST + three-tier shell | REST + Query | `useStudents`, `useStudentMutations` |
| Finance | Legacy collection | localStorage | `useLiveCollection` |

**Before building a new module:** read `Contacts.tsx`, `contactsModuleContract.ts`, and skill `mms-contacts`.

## Module contract (§1.1 — required for new modules)

Add `packages/shared/src/{module}ModuleContract.ts`:

```typescript
export const STUDENTS_MODULE_CONTRACT = {
  moduleId: 'students',
  entityType: 'Student',
  collectionKey: 'students',
  restBasePath: '/api/students',
  tiers: ['work', 'reports', 'setup'] as const,
  permissions: { read: '...', write: '...', delete: '...' },
  work: { directoryViews: [...], bulkActions: [...], integrityTools: [...] },
  setupSubTabs: ['fields', 'preferences'] as const,
  exportInlineMaxRows: 500,
  exportChunkSize: 100,
  softDelete: { workExcludesDeleted: true, ... },
} as const;
```

Hooks and pages import constants — no duplicated collection names or tier ids.

## Checklist

```
- [ ] {Module}ModuleContract in @mms/shared
- [ ] Page in apps/frontend/src/pages/ — lazy route in HostRoutes.tsx
- [ ] Nav: navConfig.tsx + SYSTEM_MODULES + SYSTEM_MODULE_NAV
- [ ] PageHeader command centre: metrics, create, export, integrity tools (not tier-gated)
- [ ] use{Module}PageState hook — keep page thin
- [ ] ResponsiveAccordionTabs + useModuleTierTabs (work | reports | setup)
- [ ] Work: directory + search/filter/sort + detail drawer + bulk bar + FormModal
- [ ] Work mobile: card layout where appropriate (Contacts: ContactCards)
- [ ] Reports: KPISummary(moduleCategory) + ModuleReports — reports tier only
- [ ] Setup: SubTabBar → Fields + Preferences (+ contract setupSubTabs)
- [ ] can() UI gates + API RBAC on writes
- [ ] Field/tab/column RBAC when registry-driven (Contacts pattern)
- [ ] Soft delete in contract + API when REST CRUD exists
- [ ] Data: Query-first if REST exists; else useLiveCollection
- [ ] ErrorBoundary on Work + Reports
- [ ] i18n via t(); no new uiStrings keys
- [ ] Audit on sensitive writes (Contacts REST + setup-audit shipped)
- [ ] Field delete dependency checks when registry-driven Setup (Contacts: contactFieldDependencies)
- [ ] Offline outbox pattern when REST + offline UX required (Contacts reference)
```

## PageHeader command centre (§2)

| Element | Placement |
|---------|-------------|
| Title, subtitle/metrics | `PageHeader` |
| Add entity | `PageHeader.actions` — visible on all tiers |
| Export, duplicates, module tools | `PageHeader.actions` |
| Tier-specific controls | Inside tier panel only |

Reference: `ContactsCommandMetrics.tsx`.

## Data layer choice

| Scenario | Pattern |
|----------|---------|
| Module has `/api/{resource}` | Query hooks in `hooks/use{Resource}.ts` |
| Generic `/api/db/collections` | `useLiveCollection` + `saveCollection` |
| Migrating to REST | Query hooks first; hybrid localStorage sync in `queryFn` if KPI widgets need it |
| Dashboard widgets on legacy data | Query cache first (`widgetDataUtils`); `saveCollection` in `queryFn` fallback |

## Work tier (§3)

- Search/filter/sort — permission-aware
- Directory views: list/table, optional kanban, **mobile cards**
- Detail drawer — no route change; registry tabs + field RBAC
- Bulk bar — partial failure reporting for large ops
- Lazy-load heavy overlays (`DuplicateDetection`, messaging panels)
- Per-user column prefs on server when REST module exists

## Reports tier (§4)

- Same RBAC boundary as Work
- Drill-down: chart segment → filtered Work view (Contacts: `contactsWorkDrillDown.ts`)
- Saved reports: logic not snapshot — per-module REST (Contacts shipped; generic `SavedReports` empty until wired)
- CustomReportBuilder contacts fields: `contactsReportFields.ts` + `t()`

## Setup tier (§5–§7 — globle2.md)

Skill: **`mms-module-setup`** · Rule: `mms-module-setup.mdc`

- Fields + Preferences sub-tabs via `SubTabBar`
- Module extras registered in contract `setupSubTabs`
- Field delete: `getContactFieldRemovalIssues()` pattern before remove
- Copy via `t()` — do not add Setup `uiStrings` editors
- Audit all Setup saves (Contacts: `setup-audit` shipped)

## Module isolation

Each tier is **module-scoped only** (`mms-module-isolation.mdc`):

| Tier (id) | User label | Content |
|-----------|------------|---------|
| work | Work | CRUD, lists, wizards — no KPIs or reports |
| reports | Reports | `KPISummary(moduleCategory)` + module charts |
| setup | Setup | fields, preferences, module config |

- `KPISummary` **inside Reports tab only**
- Use module's own analytics category (not `academic`)

## Responsive tabs

`ResponsiveAccordionTabs` — `mms-ui-tabs.mdc`. Inner setup uses `SubTabBar`.

## Do not

- Add a fourth top-level tier
- Gate PageHeader CTAs on `activeTab`
- Mount module Setup under `/settings`
- Use raw `fetch('/api/...')` — use `apiClient`
- Duplicate data paths (Query mutations + parallel `saveCollection` for same entity)
- Nest `ContactConfigProvider` on module pages
- Hard-delete when contract specifies soft delete
- Reference removed `globlestructure.md` — use `globle.md`

## Rules

`mms-module-architecture.mdc`, `mms-module-isolation.mdc`, `mms-ui-tabs.mdc`, `mms-config.mdc`, `mms-query.mdc`, `mms-frontend.mdc`

## Related skills

`mms-contacts` (reference implementation), `mms-module-setup`, `mms-fields-registry`, `mms-reports-export`, `mms-data-sync`

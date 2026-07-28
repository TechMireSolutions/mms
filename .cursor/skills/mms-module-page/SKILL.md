---
name: mms-module-page
description: Creates or modifies MMS module pages per mms-module-architecture.mdc — Work, Reports, Setup tiers, module manifest, PageHeader command centre, and settings panels. Use when adding a module, three-tier page, or aligning an existing module to universal architecture.
---

# MMS Module Page Pattern

**Source:** Rule: `mms-module-architecture.mdc`

## Module Architecture Section Map

| Section | Topic | Skill / rule |
|---------|--------|--------------|
| §1 | Manifests | `mms-module-architecture.mdc` |
| §2 | Three-tier shell | `mms-ui-ux-design.mdc`, this skill |
| §3 | Work directory | skill **`mms-module-work`** |
| §4 | Setup / fields | skill **`mms-module-setup`**, `mms-fields.mdc` |
| §5 | Background jobs | skill **`mms-background-jobs`** |
| §6 | Soft-delete / RBAC | `mms-auth-security.mdc` |
| §7 | Gold-standard parity | checklist below |
| Reports | Analytics / export | skill **`mms-reports-export`** |

Modules live under `apps/frontend/src/tenant/features/{module}/` (not legacy `pages/` only).

## Required structure

```
PageHeader (command centre — always visible)
work  |  reports  |  setup
                    └─ Fields | Preferences | (module extras)
```

## Reference implementations

| Module | Architecture alignment | Data layer | Primary hooks |
|--------|-------------------------|------------|---------------|
| **Contacts** | **Full reference** — manifest, metrics, dedup, soft delete + trash UI, field RBAC, cards, drill-down, sync outbox, saved reports | REST + Query | `useContactsPageState`, `useContacts`, `useContactMutations` |
| **Students / Teachers** | Three-tier + soft-delete Work trash + `useModulePermissions` + Cmd/Ctrl+N | REST + Query | `useStudents` / `useTeachers` mutations |
| **Hasanat / Examinations / Obligations / Finance / Accounting / Sessions / Attendance / Enrollments** | Gold-standard soft-delete trash + upsert bulk + awaited saves (pattern varies by entity) | REST + Query | Feature `useXxx` / `useXxxMutations` |
| **Users** | Manifest `setupSubTabs`; soft-delete Work trash (`deleted_at`); ErrorState; awaited saves | REST + Query | `useUsers` / `useUsersMutations` |
| **Messaging** | Templates Setup; log clear soft-archive; ErrorState; Cmd/Ctrl+N campaign | REST + Query | `useMessageTemplates` / `useMessagingMutations` |
| Question Bank | Three-tier + soft-delete trash on questions + upsert bulk + gold-standard Setup/UX | REST + Query | `useQuestionBank*` |

**Before building a new module:** read `ContactsPage.tsx` (or Students for soft-delete), `{module}ModuleManifest.ts`, `mms-module-architecture.mdc` §7, and skill `mms-module-work`.

## Module manifest (§1.1 — required for new modules)

Add `packages/shared/src/{module}ModuleManifest.ts`:

```typescript
export const STUDENTS_MODULE_MANIFEST = {
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

## Gold-standard checklist (`mms-module-architecture.mdc` §7)

```
- [ ] Bulk PUT upsert-only (never replaceForWorkspace wipe on API write paths)
- [ ] Soft-delete + Work trash UI (or documented manifest variant)
- [ ] mutateAsync + await form/setup saves; close only after success
- [ ] setupSubTabs + canEditSetup + saveSettingsAsync
- [ ] ErrorState + retry on list query failure
- [ ] Cmd/Ctrl+N create when canWrite and not in trash
- [ ] useModulePermissions(manifest); omit forbidden CTAs
- [ ] i18n via t() (en/ar/ur/fa)
```

## Checklist

```
- [ ] {Module}ModuleManifest in @mms/shared
- [ ] Page in apps/frontend/src/pages/ — lazy route in HostRoutes.tsx
- [ ] Nav: navConfig.tsx + SYSTEM_MODULES + SYSTEM_MODULE_NAV
- [ ] PageHeader command centre: metrics, create, export, integrity tools (not tier-gated)
- [ ] use{Module}PageState hook — keep page thin
- [ ] ResponsiveAccordionTabs + useModuleTierTabs (work | reports | setup)
- [ ] Work: directory + search/filter/sort + detail drawer + bulk bar + FormModal
- [ ] Work mobile: card layout where appropriate (Contacts: ContactCards)
- [ ] Reports: KPISummary(moduleCategory) + ModuleReports — reports tier only
- [ ] Setup: SubTabBar → Fields + Preferences (+ manifest setupSubTabs)
- [ ] can() / useModulePermissions(manifest) UI gates + API RBAC on writes
- [ ] Field/tab/column RBAC when registry-driven (Contacts pattern)
- [ ] Soft delete in API when REST CRUD exists; Work trash UI or documented hard-delete/variant
- [ ] Data: Query-first if REST exists; else useLiveCollection (do not expand legacy)
- [ ] ErrorBoundary on Work + Reports; ErrorState on list load failure
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
- Soft-delete trash toggle — skill `mms-module-work`
- Lazy-load heavy overlays (`DuplicateDetection`, messaging panels)
- Per-user column prefs on server when REST module exists

## Reports tier (§4)

- Same RBAC boundary as Work
- Drill-down: chart segment → filtered Work view (Contacts: `contactsWorkDrillDown.ts`)
- Saved reports: logic not snapshot — per-module REST (Contacts shipped; generic `SavedReports` empty until wired)
- CustomReportBuilder contacts fields: `contactsReportFields.ts` + `t()`

## Setup tier (Fields & Preferences)

Skill: **`mms-module-setup`** · Rule: `mms-module-architecture.mdc`

- Fields + Preferences sub-tabs via `SubTabBar`
- Module extras registered in manifest `setupSubTabs`
- Field delete: `getContactFieldRemovalIssues()` pattern before remove
- Copy via `t()` — do not add Setup `uiStrings` editors
- Audit all Setup saves (Contacts: `setup-audit` shipped)
- `canEditSetup` — read-only message when view-only; prefer `saveSettingsAsync`

## Module isolation

Each tier is **module-scoped only** (`mms-module-architecture.mdc`):

| Tier (id) | User label | Content |
|-----------|------------|---------|
| work | Work | CRUD, lists, wizards — no KPIs or reports |
| reports | Reports | `KPISummary(moduleCategory)` + module charts |
| setup | Setup | fields, preferences, module config |

- `KPISummary` **inside Reports tab only**
- Use module's own analytics category (not `academic`)

## Responsive tabs

`ResponsiveAccordionTabs` — `mms-ui-ux-design.mdc`. Inner setup uses `SubTabBar`.

## Do not

- Add a fourth top-level tier
- Gate PageHeader CTAs on `activeTab`
- Mount module Setup under `/settings`
- Use raw `fetch('/api/...')` — use `apiClient`
- Duplicate data paths (Query mutations + parallel `saveCollection` for same entity)
- Nest `ContactConfigProvider` on module pages
- Hard-delete when manifest specifies soft delete
- Wipe workspace rows via bulk PUT `replaceForWorkspace`
- Close forms after fire-and-forget `mutate()` without awaiting success
- Reference removed `globlestructure.md` or `globle.md` — use `mms-module-architecture.mdc`

## Rules

`mms-module-architecture.mdc`, `mms-ui-ux-design.mdc`, `mms-settings-i18n.mdc`, `mms-data-layer.mdc`, `mms-api-interface.mdc`

## Related skills

`mms-module-work`, `mms-module-setup`, `mms-fields-registry`, `mms-reports-export`, `mms-messaging`, `mms-background-jobs`

## Done

`mms-completion-review.mdc` — typecheck + FE lint; new modules need §7 checklist green.

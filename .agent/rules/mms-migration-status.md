---
trigger: model_decision
---

# MMS Migration Status

**Workflow skill:** `mms-migration-fixes` — prioritized gap list and recipes. Rules describe **target architecture**. Fix open gaps only when in task scope.

## Open Gaps Register

| Area | Scope & Current Status | Target Standard |
|---|---|---|
| **Copy & a11y** | Residual hardcoded strings; niche a11y/RTL checks. | Full `t()` en/ar/ur/fa; WCAG 2.1 AA (`mms-settings-i18n.md`, `mms-ui-ux-design.md`). |
| **RBAC** | Residual `role ===` write gates on non-migrated tenant modules. | Contract `can()` via `useModulePermissions(manifest)` (`mms-auth-security.md`). |
| **Setup & Prefs** | Contacts, Students, Teachers, Users, Sessions, Enrollments closed on typed REST. Residual modules' `*_field_config` on `objects`. | Migrate remaining module prefs/lookups to typed tables (`mms-fields.md`, `mms-data-layer.md`). |
| **Live Push & Aggregates** | Closed: Contacts/Students/Teachers/Sessions/Enrollments WS invalidate + SQL aggregates. Residual: other module emit/subscribe, comparison mode dumps. | WS `/api/ws` invalidate + SQL `GROUP BY` aggregates (`mms-core.md`, `mms-reports.md`). |
| **PG Statement Budgets** | Tenant budgets shipped on `withTenantTransaction` + `runInTransaction`. | Route-level tighter budgets for hot paths (`mms-data-layer.md`). |
| **Contacts Full Loads** | Closed: SQL metrics, candidate match, blocked duplicate scans. Residual: niche chart dumps. | SQL aggregates across all visualizers (`mms-data-layer.md`, `mms-reports.md`). |
| **CSRF / Origin Gate** | Mutations rely on `SameSite=Lax` + CORS. | Strict Origin / `Sec-Fetch-Site` header checks on all cookie writes (`mms-auth-security.md`). |
| **SQL Pagination** | Closed: Teachers, Users, Sessions, Enrollments, Finance, Accounting SQL-page. Residual: remaining in-memory paged lists. | Server SQL `LIMIT`/`OFFSET` via `contactsListQuerySchema` (`mms-data-layer.md`). |

## Regressions: Do Not Reintroduce

| Theme | Forbidden Regression | Canonical Owner |
|---|---|---|
| **Data Authority** | `saveCollection` mutation dual-write; `getCollection` as primary for REST; unpaged `loadAllFn` / `maxPageSize` card dumps. | `mms-data-layer.md` |
| **Sessions** | Storing JWTs in `localStorage`; skipping platform `/me` session probe on boot. | `mms-auth-security.md` |
| **Soft-Delete UX** | Work trash without drawer archive chrome; ad-hoc callouts instead of `WarningCallout` / `BulkSelectionBar`. | `mms-module-architecture.md` §6–§7 |
| **Soft-Delete Schema** | JSONB-only `deletedAt` when typed columns exist; accepting client soft-delete fields on create/update. | `mms-data-layer.md`, `mms-form-architecture.md` |
| **Gold Standard §7** | Bulk wipe PUT (missing rows deleted); closing forms before `mutateAsync` resolves; missing `ErrorState` + hints. | `mms-module-architecture.md` §7 |
| **Work Directory** | Filter preset pill bars duplicating Filters menu; `directoryViews: ['list']` on table\|cards; server prefs overriding local column width. | `mms-module-architecture.md` §3 |
| **UI Chrome DRY** | Hand-rolled empties / glass stacks; forked delete/restore buttons; ad-hoc chart heights or z-index (use `h-chart-*`, `z-modal*`). | `mms-ui-ux-design.md`, `mms-dry.md` |
| **Fields & Forms** | Hardcoded field allowlists dropping Setup custom fields; unlocked `basic` tab; loosening write Zod from `.strict()`. | `mms-fields.md`, `mms-form-architecture.md` |
| **Person Modules** | Persisting contact profile fields on `students.custom_data` or `teachers.custom_data` when `contactId` is set; filtering JSONB instead of joining `contacts`. | `mms-data-layer.md`, `mms-form-architecture.md` |
| **Messaging** | Re-introducing `messages_u:` allowlist; FE page-walk for select-all/CSV; idempotency keys without body digests. | `mms-messaging.md` |
| **Reports** | Full-collection dumps for KPIs when `/metrics` exists; widget state via `saveCollection`. | `mms-reports.md` |
| **Security & RLS** | Secrets in unscoped `objects`; omitting `FORCE ROW LEVEL SECURITY` on tenant tables; unbounded backup KDF. | `mms-auth-security.md`, `mms-data-layer.md` |
| **Layout & a11y** | Horizontal page overflow; touch targets < 44px (`min-h-11 min-w-11`); custom sub-tabs instead of `SubTabBar`. | `mms-ui-ux-design.md` §7 |
| **File Structure** | Files > 300 lines without concern split; renaming public barrels during refactors. | `mms-structure-naming.md` |t indexed keys | `mms-ops-infrastructure.md`, `mms-data-layer.md` |

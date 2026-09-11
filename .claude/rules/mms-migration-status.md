---
description: Known gaps between rules (target) and codebase (current) — do not opportunistically fix outside task scope
---

# MMS Migration Status

**Workflow skill:** `mms-migration-fixes` — prioritized gap list and recipes. Rules describe **target architecture**. Fix open gaps only when in task scope.

## Open Gaps Register

| Area | Scope & Current Status | Target Standard |
|---|---|---|
| **Copy & a11y** | Residual hardcoded strings; niche a11y/RTL checks. | Full `t()` en/ar/ur/fa; WCAG 2.1 AA (`mms-settings-i18n.md`, `mms-ui-ux-design.md`). |
| **RBAC** | Closed: `role ===` write gates replaced by `useModulePermissions`. | Contract `can()` via `useModulePermissions(manifest)` (`mms-auth-security.md`). |
| **Setup & Prefs** | Closed: All module prefs/lookups migrated to typed tables. | Migrate remaining module prefs/lookups to typed tables (`mms-fields.md`, `mms-data-layer.md`). |
| **Live Push & Aggregates** | Closed: Contacts/Students/Teachers/Sessions/Enrollments WS invalidate + SQL aggregates. Residual: other module emit/subscribe, comparison mode dumps. | WS `/api/ws` invalidate + SQL `GROUP BY` aggregates (`mms-core.md`, `mms-reports.md`). |
| **PG Statement Budgets** | Closed: Route-level budgets on hot paths via `statementTimeoutMs`. | Route-level tighter budgets for hot paths (`mms-data-layer.md`). |
| **Contacts Full Loads** | Closed: SQL metrics, candidate match, blocked duplicate scans. Residual: niche chart dumps. | SQL aggregates across all visualizers (`mms-data-layer.md`, `mms-reports.md`). |
| **CSRF / Origin Gate** | Closed: `registerCsrfOriginGuard` enforces `Sec-Fetch-Site: same-origin|same-site|none`, origin validation, and `application/json` mutation media types. | Strict Origin / `Sec-Fetch-Site` header checks on all cookie writes (`mms-auth-security.md`). |
| **SQL Pagination** | Closed: All paged lists migrated to server SQL `LIMIT`/`OFFSET`. | Server SQL `LIMIT`/`OFFSET` via `contactsListQuerySchema` (`mms-data-layer.md`). |
| **Soft-Delete Indexes & Gaps** | Closed: Migration `0104` added Category B/C partial indexes across all entity tables, partial unique indexes (`WHERE deleted_at IS NULL`), `deleted_with_cascade` on enrollments, `forbid_hard_delete()` trigger, session revocation, and restore attribution. | Category B/C partial indexes, partial unique indexes (`WHERE deleted_at IS NULL`), atomic cascades (`mms-data-layer.md` §6). |
| **Retention Hard-Purge** | Closed: Scheduled background worker (`purgeExpiredArchivedRecords`) in bounded chunks of 500 rows with lock-free `SKIP LOCKED` processing per manifest `retentionDays`. | Scheduled background worker (`purgeExpiredArchivedRecords`) in bounded chunks (`mms-data-layer.md` §6, `mms-background-jobs`). |

## Regressions: Do Not Reintroduce

| Theme | Forbidden Regression | Canonical Owner |
|---|---|---|
| **Data Authority** | `saveCollection` mutation dual-write; `getCollection` as primary for REST; unpaged `loadAllFn` / `maxPageSize` card dumps. | `mms-data-layer.md` |
| **Sessions** | Storing JWTs in `localStorage`; skipping platform `/me` session probe on boot; failing to invalidate active sessions and tokens when a user/teacher is soft-deleted; allowing soft-deleted accounts to authenticate. | `mms-auth-security.md` |
| **Soft-Delete UX** | Work trash without drawer archive chrome; ad-hoc callouts instead of `WarningCallout` / `BulkSelectionBar`; resetting search/filters on trash toggle; omitting 23505 conflict trap on restore; missing optimistic Undo toast (5–10s). | `mms-module-architecture.md` §6–§7 |
| **Soft-Delete Schema** | JSONB-only `deletedAt` when typed columns exist; accepting client soft-delete fields on create/update; standard `UNIQUE` or `UNIQUE NULLS NOT DISTINCT` on recyclable keys (blocking email/phone reuse after archive); direct SQL `DELETE` bypassing `forbid_hard_delete()` trigger. | `mms-data-layer.md`, `mms-form-architecture.md` |
| **Soft-Delete Query Planner** | Parameterized booleans (`$2::boolean IS TRUE OR deleted_at IS NULL`) breaking Category B partial index; Drizzle relational `with: { ... }` omitting explicit child `where: isNull(child.deletedAt)`. | `mms-data-layer.md` §6 |
| **Hard-Purge Contention** | Unbounded single-transaction hard purges; running purges inline in HTTP requests; omitting `entity.hard_purge` audit event before deletion; cross-tenant purge queries. | `mms-data-layer.md` §6, `mms-background-jobs` |
| **Gold Standard §7** | Bulk wipe PUT (missing rows deleted); closing forms before `mutateAsync` resolves; missing `ErrorState` + hints. | `mms-module-architecture.md` §7 |
| **Work Directory** | Filter preset pill bars duplicating Filters menu; `directoryViews: ['list']` on table\|cards; server prefs overriding local column width. | `mms-module-architecture.md` §3 |
| **UI Chrome DRY** | Hand-rolled empties / glass stacks; forked delete/restore buttons; ad-hoc chart heights or z-index (use `h-chart-*`, `z-modal*`). | `mms-ui-ux-design.md`, `mms-dry.md` |
| **Fields & Forms** | Hardcoded field allowlists dropping Setup custom fields; unlocked `basic` tab; loosening write Zod from `.strict()`. | `mms-fields.md`, `mms-form-architecture.md` |
| **Person Modules** | Persisting contact profile fields on `students.custom_data` or `teachers.custom_data` when `contactId` is set; filtering JSONB instead of joining `contacts`. | `mms-data-layer.md`, `mms-form-architecture.md` |
| **Messaging** | Re-introducing `messages_u:` allowlist; FE page-walk for select-all/CSV; idempotency keys without body digests. | `mms-messaging.md` |
| **Reports** | Full-collection dumps for KPIs when `/metrics` exists; widget state via `saveCollection`. | `mms-reports.md` |
| **Security & RLS** | Secrets in unscoped `objects`; omitting `FORCE ROW LEVEL SECURITY` on tenant tables; unbounded backup KDF. | `mms-auth-security.md`, `mms-data-layer.md` |
| **Layout & a11y** | Horizontal page overflow; touch targets < 44px (`min-h-11 min-w-11`); custom sub-tabs instead of `SubTabBar`. | `mms-ui-ux-design.md` §7 |
| **File Structure** | Files > 300 lines without concern split; renaming public barrels during refactors. | `mms-structure-naming.md` |
| **Auth Artifacts** | Unindexed artifact scans instead of indexed lookup/scope keys. | `mms-ops-infrastructure.md`, `mms-data-layer.md` |
| **Audit Trail & Immutability** | Bare `UPDATE`/`DELETE` on audit tables; deleting/re-hashing historical rows for erasure (instead of crypto-shredding or redact-and-append); ad-hoc uncanonical JSON; global un-sharded serial hash chains causing write contention; unmonitored verification gaps. | `mms-data-layer.md`, `mms-auth-security.md` |


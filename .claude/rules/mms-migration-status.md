---
description: Known gaps between rules (target) and codebase (current) — do not opportunistically fix outside task scope
---

# MMS Migration Status

**Workflow skill:** `mms-migration-fixes` — prioritized gap list and recipes. Rules describe **target architecture**. Fix open gaps only when in task scope.

## Open Gaps Register (Active Debt)

Only address these residual gaps when explicitly within task scope.

| Area | Scope & Current Status | Target Standard |
|---|---|---|
| **Copy & a11y** | Residual hardcoded strings; niche a11y/RTL checks. | Full `t()` en/ar/ur/fa; WCAG 2.1 AA (`mms-settings-i18n.md`, `mms-ui-ux-design.md`). |
| **Live Push & Aggregates** | Closed for primary modules (Contacts/Students/Teachers/Sessions/Enrollments). Residual: secondary module WS emit/subscribe and comparison mode dumps. | WS `/api/ws` invalidate + SQL `GROUP BY` aggregates (`mms-core.md`, `mms-reports.md`). |
| **Contacts Full Loads** | Closed for core SQL metrics, candidate match, duplicate scans. Residual: niche chart dumps. | SQL aggregates across all visualizers (`mms-data-layer.md`, `mms-reports.md`). |

## Completed Architectural Milestones (Closed)

- **RBAC**: Replaced legacy `role ===` write gates with contract `can()` via `useModulePermissions(manifest)` (`mms-auth-security.md`).
- **Setup & Prefs**: Migrated all module preferences and lookups to typed relational tables (`mms-fields.md`, `mms-data-layer.md`).
- **PG Statement Budgets**: Enforced route-level query budgets on hot paths via `statementTimeoutMs` (`mms-data-layer.md`).
- **CSRF / Origin Gate**: Enforced strict `Sec-Fetch-Site` and origin validation on all mutation routes (`mms-auth-security.md`).
- **SQL Pagination**: Migrated all collection lists to server SQL `LIMIT`/`OFFSET` (`mms-data-layer.md`).
- **Soft-Delete System**: Added Category B/C partial indexes, partial unique indexes (`WHERE deleted_at IS NULL`), cascades, and session revocation (`mms-data-layer.md` §6).
- **Retention Hard-Purge**: Implemented background purge worker in bounded chunks of 500 rows with lock-free `SKIP LOCKED` (`mms-data-layer.md` §6).

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


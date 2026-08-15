---
trigger: model_decision
---

# MMS Data Layer & Caching System

**Workflow skills:** REST Query factories → `mms-query-factories` · Drizzle DDL/RLS → `mms-schema-migrate` · legacy `/api/db` → `mms-data-sync` · backup wipe → `mms-backup-restore`.

Authoritative standards for backend databases, Drizzle ORM, transactions, and TanStack Query across **tenant and platform** boundaries.

## 1. Database & ORM Architecture (PostgreSQL + Drizzle)

| Concern | Standard & Constraint |
|---|---|
| **Pool Sizing & Timeouts** | Size pool via `PG_POOL_MAX` (default 20). `withTenantTransaction` applies `PG_STATEMENT_TIMEOUT_MS` (30s) and `PG_IDLE_IN_TX_TIMEOUT_MS` (15s). |
| **SQL Fragment Safety** | Use parameterized `sql` tagged templates only. Strict **ban** on `sql.raw`, string concatenation, or unescaped user identifiers. |
| **Clean Architecture** | Routes → Use Cases (`{module}/use-cases/**`) via DI → Repository Interface (`{module}/repository/**`) → Drizzle Adapter. Controllers never import raw DB pools. |
| **Transaction RLS** | Enforce session context inside transactions via `SET LOCAL` (`app.current_tenant`, `app.rls_bypass = off`, `app.current_user_id`). Destroyed automatically on rollback/commit. |
| **New Tenant Tables** | Composite PK `(workspace_subdomain, id)` + `FORCE ROW LEVEL SECURITY` + RLS policy. Writes route through `withTenantTransaction`. |
| **Soft-Delete Standards** | Typed nullable `deleted_at` + index `(workspace_subdomain, deleted_at)` + partial index `WHERE deleted_at IS NULL`. Audited with `deleted_by`/`deletion_reason`. Strip on write from JSONB. |
| **Person Module Linking** | Records store `contactId`. Person profile fields (`CONTACT_PROFILE_FIELDS`) live on `contacts`. Hydrate on read, strip on write. Work SQL joins `contacts` for identity filtering/sorting. |
| **Secrets Tables** | OAuth/API credentials store in tenant-scoped `FORCE RLS` tables (e.g. `contact_google_sync_credentials`), never in KV `objects`. |

### JSONB Write Strategies (`createGenericRepository`)

| Strategy | Single Row `save` | Bulk Conflict `bulkSave` | Best For |
|---|---|---|---|
| **`overwrite`** | Replaces `custom_data` | Replaces `excluded.custom_data` | Full prepared entities (Contacts/Students) where empty arrays (`[]`) clear data. |
| **`merge`** | `custom_data \|\|` patch | Same `\|\|` patch | Intentionally partial JSONB updates where omitted keys must survive. |

### Workspace Backup & Wipe-Restore (`/api/db/backup`, `/api/db/sync`)
- **Full Snapshot (`GET /backup`):** Read snapshot via `REPEATABLE READ` transaction envelope (AES-GCM encryption with PBKDF2 bounded iterations).
- **Atomic Wipe-Restore (`POST /sync`):** `synchronizeData(payload, signal)` under `withSyncTimeout`. On abort or timeout, transaction rolls back cleanly with `408 Request Timeout` (`backup.syncTimeout`).
- **Validation Before Wipe:** Validate envelope version (≤ `ENCRYPTED_BACKUP_VERSION`), subdomain match, admin credential preservation, and prototype safety before any wipe. Exclude credential tables from snapshots.

### Drizzle DDL & Migrations
- **Forward-Only Migrations:** Baseline is `0000_init.sql`. Append forward-only SQL migrations + commit `_journal.json`.
- **Ban `drizzle-kit push`:** `db push` is forbidden against shared/staging/production databases.
- **Expand/Contract Pattern:** Add nullable column → backfill data → add constraints; drop old columns only after deprecation window.

## 2. Client Persistence (`db.ts` [DEPRECATED for Primary Collections])

- **Legacy Settings Only:** `db.ts` is restricted strictly to non-migrated settings/singletons (`branding`, `global_settings`).
- **Event Bus:** Local settings updates dispatch `window.dispatchEvent(new Event('local-database-update'))`.
- **REST Entities Ban:** Contacts, Students, Teachers, Sessions, Users, Enrollments, Finance, Accounting use Query/REST — never `getCollection` or `saveCollection`.

## 3. TanStack Query v5 (Server-Authoritative REST)

| Setting / Concern | Standard |
|---|---|
| **Client Defaults** | `staleTime: 30_000` (30s), `gcTime: 300_000` (5m), `refetchOnWindowFocus: false`, `refetchOnReconnect: true`, `retry <= 1` (skip 401/403). |
| **Query Key Factories** | Stable tuple keys via colocated `queryOptions` / `mutationOptions` factories (`mms-hooks.md`). |
| **Auth Gate & Signal** | `enabled: isAuthenticated` (tenant) / `isPlatformAuthenticated` (platform). Pass Query `signal` to `apiFetch` (mandatory). |
| **Mutations & Cache** | Call-site `notify.*` + `t()` after `mutateAsync`. Await mutation before dialog close. Invalidate specific list/count tuple keys. Ban global mutation toast buses. |
| **Optimistic Policy** | Only for idempotent, easily-rollbackable actions. **Banned** for money, soft-delete, bulk ops, messaging sends. Always reconcile against server response. |
| **Pagination & Lists** | Server `page` + `limit` for directories; `placeholderData: (prev) => prev` for smooth pagination. Unpaged dumps (`loadAllFn`) are strictly banned. |
| **Live WebSocket Push** | `/api/ws` with `broadcastTenantUpdate` → FE `TenantLivePushSubscriber` invalidates Query tuple keys on server events. |

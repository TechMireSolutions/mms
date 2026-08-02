---
description: Data Layer — PostgreSQL, Drizzle schema, migrations, database transactions, localStorage cache, sync API, and TanStack Query fetching.
paths:
  - "apps/backend/src/db/**"
  - "apps/backend/drizzle.config.ts"
  - "apps/backend/src/db/migrations/**"
  - "apps/backend/src/routes/common/db.ts"
  - "apps/backend/src/routes/tenant/**"
  - "apps/backend/src/services/dbSyncService.ts"
  - "apps/frontend/src/lib/db.ts"
  - "apps/frontend/src/lib/queryClient.ts"
  - "apps/frontend/src/hooks/**"
  - "apps/frontend/src/tenant/hooks/**"
  - "apps/frontend/src/tenant/features/**/hooks/**"
  - "packages/shared/src/apiSchemas.ts"
---

# MMS Data Layer & Caching System

**Workflow skills:** REST Query factories → `mms-query-factories` · Drizzle DDL/RLS → `mms-schema-migrate` · legacy `/api/db` / localStorage → `mms-data-sync` · backup wipe → `mms-backup-restore`.

Authoritative standards for backend databases, migrations, caching architectures, and client fetching strategies in the MMS monorepo.

---

## 1. Database & ORM Stack (PostgreSQL + Drizzle)
- **Database Engine**: PostgreSQL is the unified relational database. Ensure connection secrets are configured via `DATABASE_URL`.
- **Pool sizing**: Size the PG pool via `PG_POOL_MAX` / `serverConfig.pgPoolMax` (default 20) — do not hardcode `Pool({ max })` in call sites. Keep RLS SET LOCAL inside transactions so pooled clients never leak tenant context.
- **Drizzle ORM**: Defines schemas in `apps/backend/src/db/schema.ts`. Circular imports are avoided via `dbClient.ts` dependencies.
- **Module layout**: Connection / init / purge / document-store helpers may live in focused siblings (`dbConnection.ts`, `dbInit.ts`, `documentStore*.ts`, …) re-exported from the stable public surface callers already import — `mms-structure-naming.md`.
- **Access Pattern**: Controllers must not import raw `pg` drivers. Prefer **REST repositories**; use `dbSyncService` only for settings/legacy sync paths.
- **Hydrate graphs**: Prefer Drizzle relational `db.query.*` or explicit joins in services — ban N+1 per-id loops (pair with FE batch `/resolve`).

### Transaction-Scoped Tenant RLS (Pool Poisoning Prevention)
- Enforce strict transaction boundaries on pooled connections. Global PG configurations are prohibited. Context settings must use `LOCAL` parameters (destroyed on commit/rollback):
  ```typescript
  await db.transaction(async (tx) => {
    // 'true' indicates SET LOCAL
    await tx.execute(sql`SELECT set_config('app.current_tenant', ${tenantId}, true)`);
    await tx.execute(sql`SELECT set_config('app.rls_bypass', 'off', true)`);
    await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId ?? ''}, true)`);
    // safe scoped queries execute here...
  });
  ```
- Bind `app.current_user_id` from authenticated session (`bindRequestUserId` after `authenticateTenant`) so audit triggers can attribute writes.

### New tenant tables
- Composite PK `(workspace_subdomain, id)` (or equivalent tenant-scoped key).
- RLS policy + **`FORCE ROW LEVEL SECURITY`** on the table (Messaging / Contacts / `custom_tabs` / `saved_reports` / `contact_google_sync_credentials` pattern).
- Writes go through `withTenantTransaction` / SET LOCAL — never rely on app filters alone.
- API bulk write paths must **upsert** (`bulkSave` / `bulkUpsertCustomTabsForModule` / merge-by-id). Keep `replaceForWorkspace` only for migrations, intentional admin clears, or documented one-shot archives — never as the route `saveFn` for normal client saves (`mms-api-interface.md`).

### Soft-delete on entity tables
- Prefer a typed nullable `deleted_at` column + `(workspace_subdomain, deleted_at)` index.
- Prefer **partial indexes** for hot active lists, e.g. `(workspace_subdomain, …) WHERE deleted_at IS NULL`, in addition to the soft-delete filter index.
- Prefer typed `deleted_by` / `deletion_reason` when auditing who archived a row (Contacts pattern) — do not leave audit only in JSONB.
- Repository list helpers must SQL-filter (`deleted: 'active' | 'deleted' | 'all'`) — do not load the full tenant then filter only in JS for Work/trash.
- When `syncDeletedAtColumn` is on, hydrate `deletedAt` from the **column** (source of truth) and **strip** soft-delete keys from `custom_data` JSONB on write.
- Client create/update bodies must not set soft-delete metadata — shared write schema + `stripContactClientSoftDeleteFields` (entity-specific equivalents OK).

### Entity list pagination (REST)
- Paginated list routes: clients should send `page` (+ `limit`); omit may default to page 1 / default page size with a server max cap — **ban** unpaged full-tenant dumps via `loadAllFn` or optional-page paths that return everything (Contacts closed this; do not re-open on Students/Teachers/…). Do not claim Zod already requires `page`/`limit` until `baseListQuerySchema` is tightened.
- Work **cards** and **table** must use the same server page/limit APIs — ban `maxPageSize` one-shot loads for cards with a truncation banner that says “switch to list”.
- Prefer SQL `LIMIT`/`OFFSET` (or keyset) + total count; in-memory `paginateX(loadAll())` is migration debt — do not expand it.

### Secrets & credential stores
- Long-lived OAuth / API secrets belong in **tenant-scoped FORCE-RLS tables** (e.g. `contact_google_sync_credentials`), never in the unscoped `objects` KV.
- Keep legacy object keys in `SERVER_ONLY_OBJECT_KEYS` only to strip old backups — do not write them at runtime.
- Do **not** include credential tables in admin backup snapshots (`relationalReplaceMapping`).

### Workspace backup / wipe-restore
- **`GET /api/db/backup`**: Full-fidelity admin snapshot — document store + relational tables via `fetchBackupSnapshot` inside `runInReadSnapshotTransaction` (REPEATABLE READ).
- **`GET/POST /api/db/sync`**: Admin sync path. Wipe-restore runs `synchronizeData(payload, signal)` under `withSyncTimeout`; on abort/timeout the transaction must roll back and the route returns `408` + `backup.syncTimeout` (no partial commit).
- Envelope helpers SSOT in `@mms/shared`: `buildWorkspaceBackupEnvelope`, `remapBackupKeysToPrefix`, `validateWorkspaceBackupJson`, `validateAndNormalizeSnapshot` (prototype-pollution / restricted-key / admin-present checks).
- Envelope `format version` must be ≤ `ENCRYPTED_BACKUP_VERSION`; reject unknown/future versions and DoS KDF params (`BACKUP_KDF_MIN_ITERATIONS`…`BACKUP_KDF_MAX_ITERATIONS`, salt/iv caps).
- Product UI restore enforces same-subdomain; cross-workspace key remap is intentional/dev-only and must not become the Settings default.
- Strip `SERVER_ONLY_OBJECT_KEYS` on restore; exclude credential tables from `relationalReplaceMapping`. On restore, park unusable user hashes as `!restore-…` + `mustChangePassword`; fail only when **no** admin credential survives (`backup.missingUserCredentials`).
- After successful server restore: clear local collection cache by tenant prefix; keep settings/singleton objects only — do **not** dump the full relational snapshot into localStorage.

### Data Migrations & Schema DDL
- **Baseline**: Squashed `apps/backend/src/db/migrations_drizzle/0000_init.sql` is the DDL baseline. Append **forward-only** migrations + journal entries — do not resurrect pre-squash numbered SQL history (`0032_*`, etc.).
- **Ban `drizzle-kit push` / `db push` against shared/prod DBs** — only forward migrations + journal (`migrations_drizzle`). Push is local/dev emergency only.
- **DDL Changes**: Generate Drizzle migrations and ensure journal tracking (`apps/backend/src/db/migrations_drizzle/meta/_journal.json`) is committed in the same change. Keep meta snapshots aligned with applied SQL.
- **Expand/contract**: Prefer add-nullable → backfill → constrain; drop columns/tables only after a dual-read window. Never expand-and-break live tenants in one migration.
- **Platform audit FK**: `platform_activity_logs.user_id` is nullable with `ON DELETE SET NULL` so deleting a platform user retains audit history — do not “fix” back to `NOT NULL` / cascade-delete of log rows.
- **TypeScript Transforms**: Implement idempotent data updates in `migrations/00N_*.ts` to execute on server startup.
- **GIN & JSONB Indexes**: Dynamic fields are stored in a native `JSONB` column (`custom_data`). Search indexing uses `GIN` definitions or Expression Indexes in Drizzle migrations.
- **JSONB write strategies** (`createGenericRepository`):
  | `updateStrategy` | Single-row `save` | `bulkSave` on conflict |
  |---|---|---|
  | `'merge'` (default) | top-level `custom_data \|\|` patch | same `\|\|` merge |
  | `'overwrite'` (Contacts + other full-row entities) | replace `custom_data` | replace `excluded.custom_data` — **not** `\|\|` |
  - Use **`overwrite`** when the API persists a full prepared entity (Contacts). Empty collection keys (`phones: []`, …) must replace prior arrays; `\|\|` merge alone is not enough if bulk conflict still concatenates.
  - Use **`merge`** only for intentionally partial JSONB patches where omitted keys must survive.
- **Partial PUT merges**: Merge defined patch keys onto the existing row **before** prepare/normalize so **omitted** collections are not wiped. Once a collection key is present (including `[]`), it is authoritative — do not rebuild from legacy scalars (`phone` / `email` / `line1` / `address`). Contacts: `normalizeContactPhones` hydrates from scalar only when `phones` is absent; then `syncContactScalarFields` clears/syncs mirrors — `mms-form-architecture.md` §3.
---

## 2. Client Persistence & Synchronization (`db.ts` [DEPRECATED for Primary Collections])

### Local Storage Caching (Legacy)
- **Settings & Singletons Only**: The client-side database helper `db.ts` is deprecated for primary feature collection storage. Its usage is restricted to singletons (e.g. `branding`, `global_settings`) and custom field configuration objects.
- **Event Bus Refreshes**: Local updates for settings drafts trigger window-level events on local state writes:
  ```typescript
  window.dispatchEvent(new Event('local-database-update'));
  ```
- **Sync Endpoints**: Legacy bulk synchronization routes through `/api/db/sync` (bulk snapshot GET/POST), `/api/db/collections/:name`, and `/api/db/reset` (admin-only tenant reset).
- **Title Case Formatting**: Apply `applyTitleCaseRecursive` on save boundaries — policy owner **`mms-structure-naming.md`**.

### Settings Singletons
Settings singletons (`branding`, `global_settings`) must survive authentication syncs:
- **Save Actions**: Await backend resolution (`POST /api/db/objects/:key`) before UI success feedback. Raw `saveObject` is prohibited; utilize typed helpers.
- **Secrets Protection**: Server-only configuration properties (e.g. `email_integration_secrets`, legacy Google sync object keys) must be filtered out of sync reads and client objects. Prefer dedicated FORCE-RLS tables for new secrets (see §1).
- **Allowed objects**: Do not leave obsolete logical keys in `ALLOWED_OBJECTS` / object RBAC maps after migrating to typed tables (e.g. Contacts saved reports → `saved_reports`).
- **Allowed collections**: After REST migration, remove the entity key from `ALLOWED_COLLECTIONS` and FE `BUSINESS_COLLECTIONS` so `POST /api/db/collections/:name` cannot ghost-write a parallel JSON array (Contacts entity already closed). Lookup collections (`genders`, `phoneLabels`, `countryCodes`, …) remain document-store until migrated.

---

## 3. TanStack Query (Server-Authoritative REST)

### Query client defaults
Align with `queryClient.ts`: `staleTime` 30s, `gcTime` 5m, `refetchOnWindowFocus: false`, `refetchOnReconnect: true`, `retry` ≤ 1 (skip 401/403). Keep `structuralSharing` on unless a `select` returns unstable new refs every render. Prefer pause/disable queries when unauthenticated — do not invent a second offline sync stack.

### Fetching Standards (policy)
- **Tuple Keys**: Named tuple constants / shared key factories — not ad-hoc strings. Prefer colocated TanStack Query v5 `queryOptions` / `mutationOptions` factories — hooks wrap factories (`mms-hooks.md`).
- **Auth Gate**: `enabled: isAuthenticated` for tenant queries.
- **Cancellation**: Pass Query `signal` into `apiFetch` / `queryFn` (required).
- **Mutations**: Narrow invalidation of list + count keys — avoid blanket `invalidateQueries()`. Await `mutateAsync` (or success callback) before UI “saved”. Surface success/error via call-site `notify.*` + `t()` — do not add a global `MutationCache` toast middleware or `mutation.meta` toast bus (`mms-hooks.md`).
- **Optimistic updates**: Allowed only for idempotent, easily-rollbackable UX. **Ban** for money, soft-delete/restore, bulk, backup/restore, messaging send. Always reconcile via invalidate + server response — never leave optimistic cache as SSOT.
- **No dual-write**: After server `bulkSave`, FE invalidates only — ban looping `upsert` / `saveCollection` in mutation `onSuccess`.
- **`select` / `placeholderData`**: Prefer Query `select` for derived view models; use `placeholderData` / `keepPreviousData` for paginated lists — do not invent parallel local caches.
- **Pagination shape**: Prefer server offset `page`+`limit` for Work directories; use infinite/keyset Query only when the API supports cursor/keyset — ban client-side full dumps / `loadAllFn` (HTTP contract pointer `mms-api-interface.md` §6).
- **List load failures**: Work/Reports show `ErrorState` + hint + retry — `mms-module-architecture.md` §7.
- **Cross-module hydrate**: Batch `/resolve` — ban N+1 per-id loops.
- **Errors / loading**: `notify.error()`; expose `isPending` / `isFetching`.
- Hook recipes (controllers, facades) → **`mms-hooks.md`**.

### Hybrid Trajectory (Deprecated)
- **Banned for New Modules**: Query → localStorage mirror for widgets. Read from Query hooks.
- **Constraint**: No new `useLiveCollection` for REST-migrated entities.

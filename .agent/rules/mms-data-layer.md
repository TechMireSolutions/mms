---
trigger: model_decision
---

# MMS Data Layer & Caching System

Authoritative standards for backend databases, migrations, caching architectures, and client fetching strategies in the MMS monorepo.

---

## 1. Database & ORM Stack (PostgreSQL + Drizzle)
- **Database Engine**: PostgreSQL is the unified relational database. Ensure connection secrets are configured via `DATABASE_URL`.
- **Drizzle ORM**: Defines schemas in `apps/backend/src/db/schema.ts`. Circular imports are avoided via `dbClient.ts` dependencies.
- **Access Pattern**: Controllers must not import raw `pg` drivers. Prefer **REST repositories**; use `dbSyncService` only for settings/legacy sync paths.

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
- RLS policy + **`FORCE ROW LEVEL SECURITY`** on the table (Messaging / Contacts / `saved_reports` / `contact_google_sync_credentials` pattern).
- Writes go through `withTenantTransaction` / SET LOCAL — never rely on app filters alone.

### Soft-delete on entity tables
- Prefer a typed nullable `deleted_at` column + `(workspace_subdomain, deleted_at)` index.
- Repository list helpers must SQL-filter (`deleted: 'active' | 'deleted' | 'all'`) — do not load the full tenant then filter only in JS for Work/trash.
- When `syncDeletedAtColumn` is on, hydrate `deletedAt` from the **column** (source of truth) and **strip** soft-delete keys from `custom_data` JSONB on write.
- Client create/update bodies must not set soft-delete metadata — shared write schema + `stripContactClientSoftDeleteFields` (entity-specific equivalents OK).

### Secrets & credential stores
- Long-lived OAuth / API secrets belong in **tenant-scoped FORCE-RLS tables** (e.g. `contact_google_sync_credentials`), never in the unscoped `objects` KV.
- Keep legacy object keys in `SERVER_ONLY_OBJECT_KEYS` only to strip old backups — do not write them at runtime.
- Do **not** include credential tables in admin backup snapshots (`relationalReplaceMapping`).

### Data Migrations & Schema DDL
- **DDL Changes**: Generate Drizzle migrations and ensure journal tracking (`meta/_journal.json`) is committed in the same change.
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
- **Title Case Formatting**: All save operations to local storage (`saveCollection` / `saveObject` / `dbSyncService` / backend repository writes) must recursively apply Title Case formatting using `applyTitleCaseRecursive` from `@mms/shared` before committing the write.

### Settings Singletons
Settings singletons (`branding`, `global_settings`) must survive authentication syncs:
- **Save Actions**: Await backend resolution (`POST /api/db/objects/:key`) before UI success feedback. Raw `saveObject` is prohibited; utilize typed helpers.
- **Secrets Protection**: Server-only configuration properties (e.g. `email_integration_secrets`, legacy Google sync object keys) must be filtered out of sync reads and client objects. Prefer dedicated FORCE-RLS tables for new secrets (see §1).
- **Allowed objects**: Do not leave obsolete logical keys in `ALLOWED_OBJECTS` / object RBAC maps after migrating to typed tables (e.g. Contacts saved reports → `saved_reports`).
- **Allowed collections**: After REST migration, remove the entity key from `ALLOWED_COLLECTIONS` and FE `BUSINESS_COLLECTIONS` so `POST /api/db/collections/:name` cannot ghost-write a parallel JSON array (Contacts entity already closed). Lookup collections (`genders`, `phoneLabels`, `countryCodes`, …) remain document-store until migrated.

---

## 3. TanStack Query (Server-Authoritative REST)

### Query client defaults
- Set default client options: `refetchOnWindowFocus: false`, `retry: 1`. List responses use a default `staleTime: 30_000`.

### Fetching Standards
- **Tuple Keys**: Export query keys as named tuple constants from the hook file (prefer shared key factories over ad-hoc strings).
- **Auth Gate**: Gate tenant-specific queries using `enabled: isAuthenticated` from the authentication context.
- **Cancellation**: Pass Query `signal` into `apiFetch` / `queryFn` so in-flight work aborts on unmount/key change.
- **Mutations**: Hook success handlers must invalidate list and count query keys narrowly — avoid blanket `invalidateQueries()`.
- **Server-persisted imports**: After a server route already `bulkSave`s rows (e.g. Google Contacts sync), the FE must **invalidate** Query keys only — ban looping `upsert` dual-writes of the same payload.
- **Save Confirmation**: UI saved/success states must wait for `mutateAsync` or an explicit mutation success callback. Do not mark a REST-backed draft as saved immediately after calling fire-and-forget `mutate()`.
- **List load failures**: Module Work (and Reports when query-backed) surfaces must show `ErrorState` with retry when the primary list query `isError` — do not render an empty directory as success (`mms-module-architecture.md` §7).
- **Cross-module hydrate**: Use batch `/resolve` endpoints — ban N+1 per-id fetches in loops.
- **Errors**: Propagate mutation/toast errors through `notify.error()`. Expose loading screens via `isPending` or `isFetching`.
- **Scroll surfaces**: Route and tier/sub-tab changes use shared scroll helpers (`scrollDocumentToTop` / `useScrollSurfaceOnChange`) — do not fork per-page `window.scrollTo` recipes.
### Hybrid Trajectory (Deprecated)
- **Banned for New Modules**: The hybrid pattern (saving query responses to local storage to satisfy legacy widgets) is a transition mechanism only. New feature modules must read directly from TanStack Query hooks without cache mirroring.
- **Constraint**: Never use `useLiveCollection` for an entity that is already fetched via Query on the same viewport. No new `useLiveCollection` for REST-migrated entities.

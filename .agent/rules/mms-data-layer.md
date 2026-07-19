---
trigger: model_decision
---

# MMS Data Layer & Caching System

Authoritative standards for backend databases, migrations, caching architectures, and client fetching strategies in the MMS monorepo.

---

## 1. Database & ORM Stack (PostgreSQL + Drizzle)
- **Database Engine**: PostgreSQL is the unified relational database. Ensure connection secrets are configured via `DATABASE_URL`.
- **Drizzle ORM**: Defines schemas in `apps/backend/src/db/schema.ts`. Circular imports are avoided via `dbClient.ts` dependencies.
- **Access Pattern**: Controllers must not import direct database connection drivers or raw `pg` client pools. Route operations through `dbSyncService` or REST repositories.

### Transaction-Scoped Tenant RLS (Pool Poisoning Prevention)
- Enforce strict transaction boundaries on pooled connections. Global PG configurations are prohibited. Context settings must use `LOCAL` parameters (destroyed on commit/rollback):
  ```typescript
  await db.transaction(async (tx) => {
    // 'true' indicates SET LOCAL
    await tx.execute(sql`SELECT set_config('app.current_tenant', ${tenantId}, true)`);
    // safe scoped queries execute here...
  });
  ```

### Data Migrations & Schema DDL
- **DDL Changes**: Generate Drizzle migrations and ensure journal tracking (`meta/_journal.json`) is committed in the same change.
- **TypeScript Transforms**: Implement idempotent data updates in `migrations/00N_*.ts` to execute on server startup.
- **GIN & JSONB Indexes**: Dynamic fields are stored in a native `JSONB` column (`custom_data`). Search indexing uses `GIN` definitions or Expression Indexes in Drizzle migrations.
- **RBAC JSONB Merging**: To prevent destroying data omitted from partial frontend payloads, always write custom fields using `||` concatenation with `COALESCE`:
  ```typescript
  await tx.update(students)
    .set({ customData: sql`COALESCE(${students.customData}, '{}'::jsonb) || ${incomingPayload}::jsonb` })
    .where(eq(students.id, studentId));
  ```

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
- **Secrets Protection**: Server-only configuration properties (e.g. `email_integration_secrets`) must be filtered out of sync reads and client objects.

---

## 3. TanStack Query (Server-Authoritative REST)

### Query client defaults
- Set default client options: `refetchOnWindowFocus: false`, `retry: 1`. List responses use a default `staleTime: 30_000`.

### Fetching Standards
- **Tuple Keys**: Export query keys as named tuple constants from the hook file.
- **Auth Gate**: Gate tenant-specific queries using `enabled: isAuthenticated` from the authentication context.
- **Mutations**: Hook success handlers must invalidate list and count query keys simultaneously.
- **Save Confirmation**: UI saved/success states must wait for `mutateAsync` or an explicit mutation success callback. Do not mark a REST-backed draft as saved immediately after calling fire-and-forget `mutate()`.
- **Errors**: Propagate errors through `notify.error()`. Expose loading screens via `isPending` or `isFetching`.

### Hybrid Trajectory (Deprecated)
- **Banned for New Modules**: The hybrid pattern (saving query responses to local storage to satisfy legacy widgets) is a transition mechanism only. New feature modules must read directly from TanStack Query hooks without cache mirroring.
- **Constraint**: Never use `useLiveCollection` for an entity that is already fetched via Query on the same viewport.


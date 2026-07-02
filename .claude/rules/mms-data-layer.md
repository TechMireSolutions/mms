---
description: Data Layer — PostgreSQL, Drizzle schema, migrations, database transactions, localStorage cache, sync API, and TanStack Query fetching.
paths:
  - "apps/backend/src/db/**"
  - "apps/backend/drizzle.config.ts"
  - "apps/backend/src/db/migrations/**"
  - "apps/frontend/src/lib/db.ts"
  - "apps/frontend/src/hooks/useLiveCollection.ts"
  - "apps/backend/src/routes/db.ts"
  - "apps/backend/src/services/dbSyncService.ts"
  - "apps/frontend/src/hooks/**"
  - "apps/frontend/src/pages/**"
  - "apps/frontend/src/lib/query-client.ts"
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

## 2. Client Persistence & Synchronization (`db.ts`)

### Local Storage Caching
- **Schema Mapping**: Map collections and singletons locally using `getCollection`, `saveCollection`, and the live event hook `useLiveCollection('name')`.
- **Event Bus Refreshes**: Trigger window-level events on local state writes:
  ```typescript
  window.dispatchEvent(new Event('local-database-update'));
  ```
- **Sync Endpoints**: Sync operations route through `/api/db/sync` (bulk snapshot GET/POST), `/api/db/collections/:name`, and `/api/db/reset` (admin-only tenant reset).
- **Title Case Formatting**: All save operations to local storage (`saveCollection` / `saveObject` / `dbSyncService` / backend repository writes) must recursively apply Title Case formatting using `applyTitleCaseRecursive` from `@mms/shared` before committing the write, ensuring consistent text casing across local and synchronized states.

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
- **Errors**: Propagate errors through `notify.error()`. Expose loading screens via `isPending` or `isFetching`.

### Hybrid Trajectory
When legacy analytics widgets require local storage but the module is REST-migrated, synchronize values inside the query loader:
```typescript
async function fetchContacts(): Promise<Contact[] | unknown[]> {
  const body = await apiJson<{ contacts: Contact[] }>('/api/contacts');
  saveCollection('contacts', body.contacts);
  return body.contacts;
}

export function useContactsCollection(): Contact[] | unknown[] {
  const { data: fromQuery = [] } = useContacts();
  const fromLocal = useLiveCollection<Contact>('contacts');
  return fromQuery.length > 0 ? fromQuery : fromLocal;
}
```
*Constraint*: Never use `useLiveCollection` for an entity that is already fetched via Query on the same viewport.

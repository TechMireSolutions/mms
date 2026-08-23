---
name: mms-schema-migrate
description: Forward-only Drizzle migrations with journal/meta, expand/contract DDL, FORCE RLS on new tenant tables, and ban on drizzle-kit push against shared/prod DBs. Use when changing schema.ts, writing SQL migrations, or reviewing DDL PRs.
---

# MMS Schema & Drizzle Migration Workflow

**Rules (norms SSOT):** `mms-data-layer.mdc` · `mms-ops-infrastructure.mdc` · `mms-structure-naming.mdc` · `mms-api-interface.mdc` · `mms-form-architecture.mdc`.

Use when designing and implementing PostgreSQL database schemas, Drizzle ORM models, relations, forward-only SQL migrations, and matching `@mms/shared` Zod contracts.

## 1. Normalization & Schema Purity
- **Strict Third Normal Form (3NF):** Every non-key attribute must depend directly on the primary key, the whole key, and nothing but the key. Eliminate transitive dependencies into separate child tables.
- **Zero Semi-Structured Storage:** Do not use `json`, `jsonb`, `array`, `hstore`, or untyped text blobs for business attributes. Every single data point must have a dedicated, typed PostgreSQL column.
- **No EAV (Entity-Attribute-Value):** Never model dynamic properties using generic key/value tables (e.g., `field_name`, `field_value`). Add explicit columns or concrete relational sub-tables.
- **Atomic Attributes:** Never store delimited values (e.g., comma-separated tags or IDs). Use dedicated junction tables for many-to-many ($N:M$) relationships.

## 2. Multi-Tenancy & Isolation
- **Mandatory Tenant Foreign Key:** Every tenant-scoped table must include:
  ```ts
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  ```
  *(or `workspaceSubdomain: text("workspace_subdomain").notNull()` where workspace scope applies)*.
- **Row-Level Security (RLS):** Every query must execute within a database transaction scoped with `SET LOCAL app.current_tenant = :tenant_id` (via the `withTenant` wrapper).
  To prevent RLS context pollution across pooled connections (`pg`), tenant execution context must be encapsulated within transaction scopes using `set_config('app.current_tenant', :tenant_id, true)`.
  Tables must enforce `FORCE ROW LEVEL SECURITY`.
  Use the standard dynamic tenant isolation policy:
  ```sql
  CREATE POLICY tenant_isolation_policy ON [table]
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

  CREATE POLICY platform_superadmin_policy ON [table]
    FOR ALL
    TO mms_platform_admin
    USING (true)
    WITH CHECK (true);
  ```
- **Composite Tenant Uniqueness:** Any entity-level unique constraint must include the tenant identifier (e.g., `UNIQUE(tenant_id, email)` or `UNIQUE(tenant_id, code)`).
- **Immutable Audit Ledger:** Every balance change, grade modification, and attendance update must be backed by an append-only audit trail (`audit_trail_ledger`) verified via cryptographic hashing.

## 3. Data Typing & Column Standards
- **Primary Keys:** Standardize on:
  - `id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity()` for high-write/internal tables OR
  - `id: uuid("id").defaultRandom().primaryKey()` for distributed/public-facing IDs.
  - *Never use auto-incrementing serials without identity semantics.*
- **Temporal Columns:** Always use `TIMESTAMPTZ` (`timestamp({ withTimezone: true, mode: "date" })`). Every table must have `createdAt` and `updatedAt` defaulting to `clock_timestamp()` / `now()`.
- **Bounded Strings:** Use `varchar({ length: N })` with explicit length constraints for predictable fields (names, codes, phone numbers, postal codes). Reserve `text` exclusively for open-ended multi-line content (notes, descriptions).
- **State Machines:** Use PostgreSQL native `pgEnum` for fixed domain statuses (e.g., `enrollment_status`, `payment_status`) to prevent invalid string writes.

## 4. Indexing & Integrity Invariants
- **Foreign Key Indexing:** Every foreign key column must have an explicit B-Tree index to prevent full table scans during joins and cascade deletes.
- **Database-Enforced Integrity:** Never rely solely on application-layer validation. Enforce invariants with `CHECK`, `NOT NULL`, `DEFAULT`, and `FOREIGN KEY` definitions directly in DDL.
- **Filter Predicates:** Create composite indexes matching query patterns left-to-right:
  ```ts
  (table) => [
    uniqueIndex('entity_tenant_code_uidx').on(table.tenantId, table.code),
    index('entity_tenant_status_created_idx').on(table.tenantId, table.status, table.createdAt),
    index('entity_deleted_at_idx').on(table.tenantId, table.deletedAt).where(sql`${table.deletedAt} is null`),
  ]
  ```

## 5. Drizzle ORM & Migration Guidelines
- **Bidirectional Relations:** Every `pgTable` definition must have corresponding `relations()` configured in Drizzle to support typed relational queries (`db.query`):
  ```ts
  export const entityRelations = relations(entityTable, ({ one, many }) => ({
    tenant: one(tenants, { fields: [entityTable.tenantId], references: [tenants.id] }),
    items: many(entityItemsTable),
  }));
  ```
- **Export Types:** Every schema file must export `$inferSelect` and `$inferInsert` types alongside the table definition:
  ```ts
  export type Entity = typeof entityTable.$inferSelect;
  export type NewEntity = typeof entityTable.$inferInsert;
  ```
- **Migration Immutability:** Never alter existing generated migration SQL files once committed to version control. Apply new schema changes by generating subsequent migration steps via `drizzle-kit generate`.

## 6. Shared Contract & Fastify Service Standards
- **Shared Zod Contracts (`packages/shared/src/...`):** Define write schemas using Zod with `.strict()` enforcement to reject unknown keys. Export explicit Insert, Update, and Response DTO types inferred from the Zod schemas aligning 1:1 with Drizzle table definitions.
- **Backend Fastify Services (`apps/backend/src/...`):** Execute all tenant operations within transaction-scoped RLS sessions ensuring `SET LOCAL app.current_tenant` is applied. Validate incoming payloads using `@mms/shared` Zod schemas before database persistence.

---

## Deliverable Format for Entity & Feature Generation
When generating code for any feature or entity, provide:
1. **Drizzle Table & Relations Definition** (`apps/backend/src/db/schema/[entity].ts`) with full constraints and indexes.
2. **Shared Zod Validation Schemas & DTO Types** (`packages/shared/src/schemas/[entity].ts`).
3. **Database Migration Script / SQL DDL** representing the changes.

---

## Migration Workflow
1. Edit/create `apps/backend/src/db/schema/[entity].ts` and export from `schema.ts`.
2. Append forward-only `migrations_drizzle/00NN_*.sql` (no squashing active migrations).
3. Update `_journal.json` + meta snapshots in the same change.
4. Prefer expand/contract: add nullable → backfill → constrain; drop only after dual-read window.
5. **Ban** `drizzle-kit push` / `db push` against shared/prod.
6. New tenant tables: RLS + `FORCE ROW LEVEL SECURITY`; writes via `withTenantTransaction` / `SET LOCAL`.
7. Prefer partial indexes for hot active lists (`WHERE deleted_at IS NULL`) when adding soft-delete.
8. Statement/sql safety budgets → `mms-data-layer.mdc` (`statement_timeout`, parameterized `sql` only).

## Checklist

```
- [ ] Strict 3NF/BCNF normalization; atomic attributes; junction tables for N:M
- [ ] Zero semi-structured storage (no json/jsonb/array/EAV for domain data)
- [ ] Multi-tenancy tenantId / workspaceSubdomain with cascade FK
- [ ] Identifiers: bigint identity or uuid PK
- [ ] Bounded varchar(N), timestamp with timezone, pgEnum
- [ ] Composite uniqueIndex and B-Tree indexes on join/filter columns
- [ ] Bidirectional relations(...) defined
- [ ] $inferSelect and $inferInsert types exported
- [ ] @mms/shared Zod schemas with .strict() and matching DTO types
- [ ] Fastify routes use transaction-scoped RLS (SET LOCAL app.current_tenant)
- [ ] schema.ts + SQL DDL + journal/meta committed together
- [ ] No drizzle-kit push in CI/prod docs or scripts
- [ ] FORCE RLS on new tenant tables
```

## Done

Migration applies cleanly on empty + existing DB; Zod and Drizzle types compile with `pnpm typecheck` — `mms-completion-review.mdc`.

---
name: mms-schema-migrate
description: Forward-only Drizzle migrations with journal/meta, expand/contract DDL, FORCE RLS on new tenant tables, and ban on drizzle-kit push against shared/prod DBs. Use when changing schema.ts, writing SQL migrations, or reviewing DDL PRs.
---

# MMS Schema & Drizzle Migration Workflow

**Rules (norms SSOT):** `mms-data-layer.mdc` §5–§6 · `mms-auth-security.mdc` §5 · `mms-performance.mdc` §1 · `mms-ops-infrastructure.mdc` · `mms-structure-naming.mdc` · `mms-api-interface.mdc` · `mms-form-architecture.mdc`. Audit trail workflow → **`mms-audit-trail`**. Soft-delete workflow → **`mms-soft-delete`**.

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
- **Row-Level Security (RLS) & Explicit Resource Management:** Every query must execute within a database transaction scoped with `SET LOCAL app.current_tenant = :tenant_id` (via the `withTenant` wrapper).
  Leverage Explicit Resource Management (`using` / `await using`) for database client checkouts and scopes to ensure connections are automatically disposed and returned to the pool upon scope exit without `finally` boilerplate.
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
- **Immutable Audit Ledger & Partitioning (`mms-audit-trail`):** Every state change, balance modification, and critical entity update must be backed by an append-only audit trail (`audit_trail_events` / `audit_trail_ledger`). Audit tables must use monthly date partitioning (`PARTITION BY RANGE (transaction_timestamp)`), include cryptographic chaining columns (`hash_previous`, `hash_current`), enforce `INSERT`-only database permissions for the application user, and strictly execute:
  ```sql
  REVOKE UPDATE, DELETE, TRUNCATE ON audit_trail_events FROM PUBLIC, mms_app_user;
  ```
  Archive older partitions (91+ days to cold WORM storage) by detaching partitions (`ALTER TABLE audit_trail_events DETACH PARTITION ...`) rather than running `DELETE` queries, eliminating table locks, transaction bloat, and WAL churn.

## 3. Data Typing & Column Standards
- **Primary Keys:** Standardize on:
  - `id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity()` for high-write/internal tables OR
  - `id: uuid("id").defaultRandom().primaryKey()` for distributed/public-facing IDs.
  - *Never use auto-incrementing serials without identity semantics.*
- **Temporal Columns:** Always use `TIMESTAMPTZ` (`timestamp({ withTimezone: true, mode: "date" })`). Every table must have `createdAt` and `updatedAt` defaulting to `clock_timestamp()` / `now()`.
- **Bounded Strings:** Use `varchar({ length: N })` with explicit length constraints for predictable fields (names, codes, phone numbers, postal codes). Reserve `text` exclusively for open-ended multi-line content (notes, descriptions).
- **State Machines:** Use PostgreSQL native `pgEnum` for fixed domain statuses (e.g., `enrollment_status`, `payment_status`) to prevent invalid string writes.

## 4. Indexing & Integrity Invariants
- **Mandatory Indexing for Query Predicates (`mms-performance.mdc`):** Every column used in `where()` filters, `leftJoin() ... on()` foreign keys, and `orderBy()` sorting clauses must have an explicit B-Tree index. Prefix multi-tenant compound indexes with tenant scope (`(tenant_id, status, created_at DESC)`).
- **Foreign Key Indexing:** Every foreign key column must have an explicit B-Tree index to prevent full table scans during joins and cascade deletes.
- **Database-Enforced Integrity:** Never rely solely on application-layer validation. Enforce invariants with `CHECK`, `NOT NULL`, `DEFAULT`, and `FOREIGN KEY` definitions directly in DDL.
- **Soft-Delete Column Quintuple (`softDeleteColumns` mixin):** Every soft-deletable entity table carries `deletedAt` (Date), `deletedBy` (text), `deletionReason` (varchar 500), `restoredAt` (Date), `restoredBy` (text), and `deletedWithCascade` (boolean default false). For automated lifecycle purge, add `purgeAfter` generated column (`deleted_at + INTERVAL '90 days'`) (`mms-soft-delete`).
- **Filter Predicates & Three-Tier Soft-Delete Index Strategy:** Create composite indexes matching query patterns left-to-right, and implement the three soft-delete index categories:
  - **Category A (Non-partial trash index):** `index('table_workspace_deleted_idx').on(table.workspaceSubdomain, table.deletedAt)` for `includeDeleted=true` queries.
  - **Category B (Active-record partial index):** `index('table_workspace_active_idx').on(table.workspaceSubdomain).where(sql`${table.deletedAt} is null`)` for hot active reads.
  - **Category C (Archived-record partial index):** `index('table_workspace_deleted_records_idx').on(table.workspaceSubdomain, table.deletedAt).where(sql`${table.deletedAt} is not null`)` for trash browser pagination.
  ```ts
  (table) => [
    uniqueIndex('contacts_email_active_unique').on(table.workspaceSubdomain, table.email).where(sql`${table.deletedAt} is null`),
    index('contacts_workspace_active_idx').on(table.workspaceSubdomain).where(sql`${table.deletedAt} is null`),
    index('contacts_workspace_deleted_records_idx').on(table.workspaceSubdomain, table.deletedAt).where(sql`${table.deletedAt} is not null`),
  ]
  ```
- **Partial Unique Indexes vs `NULLS NOT DISTINCT`:** Recyclable unique fields (`email`, `phone`, `employee_id`, `student_id`, slug) MUST use partial unique indexes `WHERE deleted_at IS NULL`. Banned: PostgreSQL 15+ `UNIQUE NULLS NOT DISTINCT` (it treats NULLs as identical, permitting only 1 soft-deleted row).
- **Schema-Level Hard-Delete Guard (`BEFORE DELETE` Trigger):** Attach `forbid_hard_delete()` trigger on soft-deletable tables (`students`, `contacts`, etc.) to prevent physical row deletions unless `current_setting('app.allow_hard_purge', true) = 'true'`.
- **Row-Level Security (RLS) Policy:** Configure `tenant_soft_delete_isolation` policy ensuring queries automatically exclude soft-deleted rows unless `current_setting('app.include_deleted', true) = 'true'`.
- **High-Churn Autovacuum Tuning:** High-churn soft-deleted tables (`message_logs`, `attendance_records`) must declare tuned vacuum parameters in DDL (`autovacuum_vacuum_scale_factor = 0.05, autovacuum_vacuum_cost_limit = 1000`).
- **Zero Wildcard Projections (`SELECT *` Strict Ban):** Query surfaces must explicitly project only required columns matching `@mms/shared` Response DTOs. Never emit unconstrained `db.select().from(table)` across network boundaries. Strip heavy blobs/notes from list queries.

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
9. Audit trail tables: Monthly date partitioning (`PARTITION BY RANGE (transaction_timestamp)`), `INSERT`-only database privileges (`REVOKE UPDATE, DELETE, TRUNCATE ON audit_trail_events FROM PUBLIC, mms_app_user, mms_admin;`), and partition detachment (`ALTER TABLE ... DETACH PARTITION ...`) for zero-downtime archival without `DELETE` table locks (`mms-audit-trail`).

## Checklist

```
- [ ] Strict 3NF/BCNF normalization; atomic attributes; junction tables for N:M
- [ ] Zero semi-structured storage (no json/jsonb/array/EAV for domain data)
- [ ] Multi-tenancy tenantId / workspaceSubdomain with cascade FK
- [ ] Identifiers: bigint identity or uuid PK
- [ ] Bounded varchar(N), timestamp with timezone, pgEnum
- [ ] Composite uniqueIndex and B-Tree indexes on join/filter/order columns
- [ ] Explicit typed column projections (no SELECT * / bare table select)
- [ ] Bidirectional relations(...) defined
- [ ] $inferSelect and $inferInsert types exported
- [ ] @mms/shared Zod schemas with .strict() and matching DTO types
- [ ] Fastify routes use transaction-scoped RLS (SET LOCAL app.current_tenant)
- [ ] schema.ts + SQL DDL + journal/meta committed together
- [ ] No drizzle-kit push in CI/prod docs or scripts
- [ ] FORCE RLS on new tenant tables
- [ ] Audit tables partitioned by date with INSERT-only privileges (UPDATE/DELETE revoked)
- [ ] Soft-delete column sextuple via `softDeleteColumns` mixin (`Date` objects contract)
- [ ] Soft-delete Category A (non-partial), Category B (active partial), Category C (archived partial) indexes
- [ ] Partial unique indexes (`WHERE deleted_at IS NULL`) on recyclable unique fields (`email`, `phone`, `employee_id`)
- [ ] `forbid_hard_delete()` trigger attached to soft-deletable tables
- [ ] `tenant_soft_delete_isolation` RLS policy configured with `app.include_deleted` gate
```

## Done

Migration applies cleanly on empty + existing DB; Zod and Drizzle types compile with `pnpm typecheck` — `mms-completion-review.mdc`.

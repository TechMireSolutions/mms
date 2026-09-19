---
description: Data Layer — PostgreSQL, Drizzle schema, migrations, database transactions, and TanStack Query policy
paths:
  - "apps/backend/src/db/**"
  - "apps/backend/drizzle.config.ts"
  - "apps/backend/src/db/migrations/**"
  - "apps/backend/src/db/migrations_drizzle/**"
  - "apps/backend/src/worker/**"
  - "apps/backend/src/lib/redis.ts"
  - "apps/backend/src/routes/common/db.ts"
  - "apps/backend/src/services/dbSyncService.ts"
  - "apps/backend/src/lib/tenantContext.ts"
  - "apps/frontend/src/lib/db.ts"
  - "apps/frontend/src/lib/queryClient.ts"
  - "packages/shared/src/apiSchemas.ts"
---

# MMS Data Layer & Caching System

**Workflow skills:** REST Query factories → `mms-query-factories` · Drizzle DDL/RLS/Schema → `mms-schema-migrate` · backend API → `mms-backend-api` · shared package → `mms-shared-package` · legacy `/api/db` → `mms-data-sync` · backup wipe → `mms-backup-restore` · audit trail → `mms-audit-trail` · soft-delete → `mms-soft-delete`.

Authoritative standards for backend databases (PostgreSQL 16), Drizzle ORM 0.45, Redis 7 / BullMQ 6 worker queues, transactions, shared Zod 4 contracts, and TanStack Query v5 across **tenant and platform** boundaries.

## 1. Normalization, Multi-Tenancy & Drizzle Schema Standards

### 1. Normalization & Schema Purity
- **Strict Third Normal Form (3NF):** Every non-key attribute must depend directly on the primary key, the whole key, and nothing but the key. Eliminate transitive dependencies into separate child tables.
- **Zero Semi-Structured Storage:** Do not use `json`, `jsonb`, `array`, `hstore`, or untyped text blobs for business attributes. Every single data point must have a dedicated, typed PostgreSQL column. (Ephemeral auth artifacts, legacy snapshots, and settings singletons are the sole exceptions).
- **No EAV (Entity-Attribute-Value):** Never model dynamic properties using generic key/value tables (e.g., `field_name`, `field_value`). Add explicit columns or concrete relational sub-tables.
- **Atomic Attributes:** Never store delimited values (e.g., comma-separated tags or IDs). Use dedicated junction tables for many-to-many ($N:M$) relationships.

### 2. Multi-Tenancy & Isolation
- **Mandatory Tenant Foreign Key:** Every tenant-scoped table must include `tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" })` (or `workspaceSubdomain: text("workspace_subdomain").notNull()` where workspace scope applies).
- **Row-Level Security (RLS) & Transaction Bounds:** Every tenant query must execute within an explicit database transaction (`db.transaction(async (tx) => { ... })` or `withTenant`) scoped with `SET LOCAL app.current_tenant = :tenant_id`. Under transaction-mode connection poolers (e.g. PgBouncer / Supavisor), executing `SET LOCAL` outside an active `BEGIN ... COMMIT` block is strictly forbidden, as it risks session variable leakage across pooled client checkouts.
- **Composite Tenant Uniqueness:** Any entity-level unique constraint must include the tenant identifier (e.g., `UNIQUE(tenant_id, email)` or `UNIQUE(tenant_id, code)`).

### 3. Data Typing & Column Standards
- **Primary Keys:** Standardize on `id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity()` for high-write/internal relational tables, or sequential **UUIDv7** (RFC 9562; `crypto.randomUUIDv7()` or PostgreSQL 17 / Drizzle helper) for distributed/public-facing entity IDs to eliminate B-Tree index fragmentation and random I/O write amplification while preserving 128-bit unguessability. Never use auto-incrementing serials without identity semantics, and avoid random UUIDv4 on high-churn tables.
- **Temporal Columns:** Always use `TIMESTAMPTZ` (`timestamp({ withTimezone: true, mode: "date" })`). Every table must have `createdAt` and `updatedAt` defaulting to `clock_timestamp()` / `now()`.
- **Bounded Strings:** Use `varchar({ length: N })` with explicit length constraints for predictable fields (names, codes, phone numbers, postal codes). Reserve `text` exclusively for open-ended multi-line content (notes, descriptions).
- **State Machines:** Use PostgreSQL native `pgEnum` for fixed domain statuses (e.g., `enrollment_status`, `payment_status`) to prevent invalid string writes.

### 4. Indexing & Integrity Invariants
- **Foreign Key Indexing:** Every foreign key column must have an explicit B-Tree index to prevent full table scans during joins and cascade deletes.
- **Database-Enforced Integrity:** Never rely solely on application-layer validation. Enforce invariants with `CHECK`, `NOT NULL`, `DEFAULT`, and `FOREIGN KEY` definitions directly in DDL.
- **Filter & Sort Predicates:** Create composite indexes matching query patterns left-to-right: `(tenant_id, status, created_at DESC)` and partial indexes `WHERE deleted_at IS NULL` for active queries. All columns evaluated in `where()`, `leftJoin() ... on()`, and `orderBy()` clauses must be indexed — `mms-performance.md`.
- **Multivariate Extended Statistics (`CREATE STATISTICS`):** Large multi-tenant tables (> 50,000 rows) with strongly correlated filter predicates (e.g. `tenant_id`, `status`, `deleted_at`) must declare PostgreSQL extended statistics (`CREATE STATISTICS ... (dependencies, mcv) ON tenant_id, status, deleted_at FROM ...`) in schema DDL to ensure accurate query planner selectivity estimates and prevent erroneous nested-loop join plans.

### 5. Drizzle ORM & Migration Guidelines
- **Bidirectional Relations:** Every `pgTable` definition must have corresponding `relations()` configured in Drizzle to support typed relational queries (`db.query`).
- **Export Types:** Every schema file must export `$inferSelect` and `$inferInsert` types alongside the table definition.
- **Migration Immutability:** Never alter existing generated migration SQL files once committed to version control. Apply new schema changes by generating subsequent migration steps via `drizzle-kit generate`.

### 6. Shared Contract & Fastify Service Standards
- **Shared Zod Contracts (`packages/shared/src/...`):** Define write schemas using Zod 4 with `.strict()` enforcement. Export explicit Insert, Update, and Response DTO types aligning 1:1 with Drizzle table definitions.
- **Backend Fastify Services (`apps/backend/src/...`):** Execute all tenant operations within transaction-scoped RLS sessions ensuring `SET LOCAL app.current_tenant` is applied. Validate incoming payloads using `@mms/shared` Zod 4 schemas before database persistence.

### 7. Deliverable Format for Entity & Feature Generation
When generating code for any feature or entity, provide:
1. **Drizzle Table & Relations Definition** (`apps/backend/src/db/schema/[entity].ts`) with full constraints and indexes.
2. **Shared Zod Validation Schemas & DTO Types** (`packages/shared/src/schemas/[entity].ts`).
3. **Database Migration Script / SQL DDL** representing the changes.

---

## 2. Database & ORM Architecture (PostgreSQL + Drizzle)

| Concern | Standard & Constraint |
|---|---|
| **Database & Engine** | PostgreSQL 16 (`pg: ^8.23.0`) managed via Drizzle ORM 0.45 (`drizzle-orm: ^0.45.2`, `drizzle-kit: ^0.31.10`). |
| **Pool Sizing & Timeouts** | Size pool via `PG_POOL_MAX` (default 20). `withTenant` applies `PG_STATEMENT_TIMEOUT_MS` (30s) and `PG_IDLE_IN_TX_TIMEOUT_MS` (15s). Route-level statement timeout tiers: interactive reads `3000ms`, standard mutations `5000ms`, background jobs/sync up to `60000ms`. |
| **Explicit Resource Management** | Use `using` / `await using` for database connections, file handles, and stream resources to auto-dispose and return clients to pool on scope exit without boilerplate `finally` blocks. |
| **Zero Queries in Loops** | Strict ban on queries in `for`, `forEach`, `map`, or `Promise.all`. Batch via Drizzle relational `with`, `inArray` (bounded $\le 500$ via `bulkIdsBodySchema`), SQL joins, or batch `/resolve`. |
| **Zero Wildcard Projections** | Strict ban on `SELECT *` and bare `db.select().from(table)`. Explicit column projections matching Response DTOs (`db.select({ id: table.id, ... })` or `columns: { id: true, ... }`). |
| **Server Caching Architecture** | Redis (`apps/backend/src/lib/redis.ts`) + LRU caching. TTL 60s for metrics/KPIs, 300s for lookups/config/branding. Multi-tenant key isolation: `mms:{tenantId}:{module}:{resource}:{hash}`. Mutating ops must evict keys and broadcast via `/api/ws`. |
| **Worker Queue Architecture** | BullMQ 6 (`bullmq: ^6.3.4`) backed by Redis 6 (`ioredis: ^6.0.0`) for asynchronous background processing (large exports/imports, hard purge, report batching). |
| **SQL Fragment Safety** | Use parameterized `sql` tagged templates only. Strict **ban** on `sql.raw`, string concatenation, or unescaped user identifiers. |
| **Clean Architecture** | Routes → Use Cases (`{module}/use-cases/**`) via DI → Repository Interface (`{module}/repository/**`) → Drizzle Adapter. Controllers never import raw DB pools. |
| **Transaction RLS** | Enforce session context inside transactions via `SET LOCAL` (`app.current_tenant`, `app.rls_bypass = off`, `app.current_user_id`). Destroyed automatically on rollback/commit. |
| **Tenant Boundary API** | Three entry points in `apps/backend/src/db/tenant-context.ts`: `withTenant(tenant, cb)` (read-write on primary), `withTenantRead(tenant, cb)` (read replica + read-only mode for lists/reports), and `withGlobalTenant(cb)` (RLS bypassed: migrations, workers, seeding). `withTenant` fails closed on falsy tenant. |
| **Read-Your-Writes** | Never use `withTenantRead` for reads that must observe an immediately preceding write (create-then-refetch, uniqueness checks) — use `withTenant` there. |
| **Tenant-Scoped ID Lookups** | Every repository lookup by ID must scope by workspace: `eq(table.workspaceSubdomain, tenant)`. RLS is defense-in-depth, not a substitute for explicit predicates. Global lookups use explicit `*ByIdGlobal` naming for platform callers only. |
| **New Tenant Tables** | `FORCE ROW LEVEL SECURITY` + RLS policy (`tenant_id = current_setting('app.current_tenant', true)::uuid` or subdomain match). |
| **Soft-Delete Standards** | Column sextuple standard (`deleted_at`, `deleted_by`, `deletion_reason`, `restored_at`, `restored_by`, `deleted_with_cascade`). 3 index categories (A, B active partial, C archived partial). Partial unique indexes `WHERE deleted_at IS NULL`. Hard-delete trigger guard (`forbid_hard_delete`). RLS session flag `app.include_deleted`. |
| **Person Module Linking** | Records store `contactId`. Person profile fields (`CONTACT_PROFILE_FIELDS`) live on `contacts`. Hydrate on read, strip on write. Work SQL joins `contacts` for identity filtering/sorting. |
| **Secrets Tables** | OAuth/API credentials store in tenant-scoped `FORCE RLS` tables (e.g. `contact_google_sync_credentials`), never in KV `objects`. |

### Workspace Backup & Wipe-Restore (`/api/db/backup`, `/api/db/sync`)
- **Full Snapshot (`GET /backup`):** Read snapshot via `REPEATABLE READ` transaction envelope (AES-GCM encryption with PBKDF2 bounded iterations).
- **Atomic Wipe-Restore (`POST /sync`):** `synchronizeData(payload, signal)` under `withSyncTimeout`. On abort or timeout, transaction rolls back cleanly with `408 Request Timeout` (`backup.syncTimeout`).
- **Validation Before Wipe:** Validate envelope version (≤ `ENCRYPTED_BACKUP_VERSION`), subdomain match, admin credential preservation, and prototype safety before any wipe. Exclude credential tables from snapshots.

### Drizzle DDL & Migrations
- **Forward-Only Migrations:** Baseline is `0000_init.sql`. Append forward-only SQL migrations + commit `_journal.json`.
- **Ban `drizzle-kit push`:** `db push` is forbidden against shared/staging/production databases.
- **Expand/Contract Pattern:** Add nullable column → backfill data → add constraints; drop old columns only after deprecation window.

---

## 3. Client Persistence (`db.ts` [DEPRECATED for Primary Collections])

- **Legacy Settings Only:** `db.ts` is restricted strictly to non-migrated settings/singletons (`branding`, `global_settings`).
- **Event Bus:** Local settings updates dispatch `window.dispatchEvent(new Event('local-database-update'))`.
- **REST Entities Ban:** Contacts, Students, Teachers, Sessions, Users, Enrollments, Finance, Accounting use Query/REST — never `getCollection` or `saveCollection`.

---

## 4. TanStack Query v5 (Server-Authoritative REST)

| Setting / Concern | Standard |
|---|---|
| **Client Defaults** | `staleTime: 30_000` (30s), `gcTime: 300_000` (5m), `refetchOnWindowFocus: false`, `refetchOnReconnect: true`, `retry <= 1` (skip 401/403). |
| **Query Key Factories & Contracts** | Stable tuple keys via colocated `queryOptions` / `mutationOptions` factories (`mms-hooks.md`) or `@ts-rest/react-query` (`tsr` client in `apps/frontend/src/lib/api.ts`). |
| **Auth Gate & Signal** | `enabled: isAuthenticated` (tenant) / `isPlatformAuthenticated` (platform). Pass Query `signal` to `apiFetch` (mandatory). |
| **Mutations & Cache** | Call-site `notify.*` + `t()` after `mutateAsync`. Await mutation before dialog close. Invalidate specific list/count tuple keys. Ban global mutation toast buses. |
| **Optimistic Policy** | Only for idempotent, easily-rollbackable actions. **Banned** for money, bulk ops, messaging sends. Single-record soft-delete uses optimistic cache hide with 5–10s Undo toast (`docs/soft-delete.md` §7.8 · skill `mms-soft-delete`). Always reconcile against server response / rollback on failure. |
| **Live WebSocket Push** | `/api/ws` with `broadcastTenantUpdate` → FE `TenantLivePushSubscriber` invalidates Query tuple keys on server events. |

---

## 5. Modern Database Audit Trail & Cryptographic Integrity

Operational workflows, verification checklists, and anomaly baselines → skill **`mms-audit-trail`**.

1. **Five-Dimension Capture Standard:** Every audit record captures:
   - **Who:** `real_user_id`, `impersonated_user_id`, `ip_address`, `client_app`, `session_id`.
   - **What:** `table_name`, `record_id`, `old_state`, `new_state` stored as canonical JSON.
   - **When:** UTC microsecond timestamp (`timestamptz`).
   - **Why:** `correlation_id` (propagating W3C Trace Context `traceparent`), `action_type` (`CREATE`, `UPDATE`, `DELETE`, `VIEW`, `LOGIN`, `REDACT`, `RESTORE`), `api_endpoint`, `http_method`.
   - **Integrity:** `hash_previous`, `hash_current`, `verification_status`.
2. **RFC 8785 Canonical JSON (JCS):** Payloads and state hashing MUST use RFC 8785 JSON Canonicalization Scheme for deterministic representation across environments. Ad-hoc string manipulation is strictly forbidden.
3. **Capture Minimization:** Capture only fields essential for point-in-time state reconstruction. Never log full raw PII payloads or secrets (passwords, tokens, credentials, payment details) into audit rows.
4. **Application-Level Outbox:** Audit events write atomically inside the database transaction (`withTenant`) alongside the primary entity mutation. Rollback cleanly aborts audit capture.
5. **Cryptographic Hash Chaining & Sharding:**
   - Emit SHA-256 hashes: `crypto.hash('sha256', buffer)` via native `node:crypto`.
   - Shard hash chains per logical partition (per tenant workspace or domain) to prevent write contention; roll up shard heads into periodic Merkle roots.
6. **Privilege Hardening:** Database service user has `INSERT`-only privileges on audit tables. `UPDATE` and `DELETE` are revoked from all application roles.
7. **Privacy & Right-to-Erasure:** Never delete or rewrite historical audit rows (which breaks hash chains). Resolve erasure via:
   - **Crypto-Shredding (Primary):** Encrypt personal fields with a per-subject key; destroy the key to permanently render plaintext unrecoverable.
   - **Redact-and-Append:** Overwrite personal values with `[REDACTED_PER_REQUEST]` and append a new chained audit event (`action_type = 'REDACT'`).
8. **Partition Archival:** Partition audit tables monthly by date (`PARTITION BY RANGE (transaction_timestamp)`). Archive via partition detachment (`ALTER TABLE ... DETACH PARTITION`), never by row deletion.

---

## 6. Authoritative Soft-Delete Architecture & Index Strategy

Operational workflows, complete code snippets, and UI interaction standards → skill **`mms-soft-delete`** and `docs/soft-delete.md`.

1. **Architectural Deletion Taxonomy:**
   - **Bucket 1 (Soft-Delete):** Primary business entities (`contacts`, `students`, `teachers`, `sessions`, `enrollments`, `finance_invoices`, `accounting_accounts`). User self-service restore, historical reporting continuity.
   - **Bucket 2 (Ephemeral Hard-Delete):** Scratchpad data without independent lifecycle (`question_bank_tests`, join edges, drafts).
   - **Bucket 3 (Sweeper TTL Purge):** Scheduled background worker (`message_logs`, upload artifacts, idempotency keys, sessions).
   - **Bucket 4 (Append-Only Immutable):** Physical delete/update forbidden at DB layer (`audit_trail_events`, `accounting_entries`).
2. **Column Sextuple Standard:** Standardize on `softDeleteColumns`: `deletedAt` (timestamptz Date), `deletedBy` (text), `deletionReason` (varchar 500), `restoredAt` (timestamptz Date), `restoredBy` (text), `deletedWithCascade` (boolean default false). Always assign `Date` objects (`new Date()`).
3. **Three-Tier Index Strategy & Autovacuum Tuning:**
   - **Category A (Non-Partial):** `(workspaceSubdomain, deletedAt)`. Covers `includeDeleted = true` queries.
   - **Category B (Active-Record Partial):** `(workspaceSubdomain)` scoped `WHERE deleted_at IS NULL`. Compound variants for filtered paths: `(workspaceSubdomain, status, updatedAt) WHERE deleted_at IS NULL`.
   - **Category C (Archived-Record Partial):** `(workspaceSubdomain, deletedAt)` scoped `WHERE deleted_at IS NOT NULL`. Covers trash queries.
   - **Autovacuum Storage Tuning:** High-churn soft-deletable tables (`message_logs`, `audit_trail_events`, `attendance_records`) should specify aggressive autovacuum thresholds in DDL (`WITH (autovacuum_vacuum_scale_factor = 0.05, autovacuum_vacuum_cost_limit = 1000)`) to reclaim dead tuples and maintain index efficiency.
4. **Partial Unique Indexes Mandatory:** Recyclable unique identifiers (`email`, `phone`, `employee_id`, `student_id`, slug) MUST use partial unique indexes scoped `WHERE deleted_at IS NULL`. Banned: `UNIQUE NULLS NOT DISTINCT`.
5. **Schema-Level Hard-Delete Guard:** Schema `BEFORE DELETE` triggers execute `forbid_hard_delete()` to raise `check_violation` on direct SQL `DELETE`. Bypass requires `SET LOCAL app.allow_hard_purge = 'true'` inside authorized purge/teardown transactions.
6. **Query Planner & Dynamic AST:** Strictly ban parameterized boolean predicates `WHERE ($2::boolean IS TRUE OR deleted_at IS NULL)` (breaks Category B index). Conditionally append `isNull(table.deletedAt)` for active reads or `isNotNull(table.deletedAt)` for trash reads in Drizzle AST.
7. **Drizzle Relational Child Filtering:** Relational queries (`db.query.*`) do not auto-filter relations. Child relations in `with: { ... }` must declare explicit `where: (c, { isNull }) => isNull(c.deletedAt)`.
8. **Referential Integrity & Cascades:**
   - Default: Restrict soft-delete if active dependent children exist (`409 Conflict`).
   - Cascade: Programmatic cascade marking children `deletedWithCascade = true`. Lock parent (`FOR UPDATE`) before cascading. On restore, restore only children marked `deletedWithCascade = true`.
   - Active FK Guarding: Validate foreign keys point to active entities (`deleted_at IS NULL`) on write.
9. **Single-Statement Bulk Updates:** `bulkDeleteFn` and `bulkRestoreFn` execute a single batched SQL `UPDATE ... WHERE id IN (...) AND deleted_at IS NULL`. N+1 loops are strictly banned.
10. **Uniqueness-on-Restore:** Pre-check active conflicts before restore and trap PostgreSQL error `23505` (`unique_violation`), mapping cleanly to `409 Conflict`.
11. **Lock-Free Chunked Background Purge:** Purge worker (`purgeExpiredArchivedRecords`) runs off-peak in bounded chunks of 500 rows using `LIMIT 500 FOR UPDATE SKIP LOCKED` with 50ms pauses, emitting `entity.hard_purge` audit events and executing `SET LOCAL app.allow_hard_purge = 'true'`.

## 7. Migration Safety & Zero-Downtime DDL

Forward-only migrations (`mms-schema-migrate` skill owns the authoring workflow). Every DDL statement must be safe to run against a live database with concurrent traffic — a migration that takes a blocking lock is an outage, not a deploy.

1. **No Write-Blocking Index Builds:** `CREATE INDEX` (non-concurrent) takes a `SHARE` lock that blocks all writes for the duration of the build. NEVER commit a plain `CREATE INDEX` on a large or hot table in a migration file. Build it out-of-band with `pnpm --filter mms-backend index:concurrent`, or use `CREATE INDEX IF NOT EXISTS` for small/new tables only. Enforced by `pnpm run check:migration-indexes` (CI ratchet).
2. **Why `CONCURRENTLY` Cannot Live in a Migration:** Drizzle runs each migration inside a single transaction, and PostgreSQL forbids `CREATE INDEX CONCURRENTLY` in a transaction block. Do not "fix" this by wrapping it in a DO block — move it to the concurrent script.
3. **Lock Timeout Guard:** Any `ALTER TABLE` on a populated table must set a bounded `lock_timeout` in the same transaction so a queued `ACCESS EXCLUSIVE` lock cannot stall the whole application behind it; retry after the timeout rather than retrying blindly.
4. **Expand / Contract, Never In-Place Rename:** Add the new column/index, backfill in bounded batches, dual-write or backfill from the old shape, switch reads, then drop the old shape in a **later** migration. Banned: renaming or retyping a column in the same release that still reads it.
5. **Additive Defaults Only:** Adding a `NOT NULL` column requires a default (PostgreSQL 11+ stores it without a full rewrite) or a two-phase backfill. Adding a nullable column is always safe; adding a constraint to existing rows is not — validate it against real data first.
6. **Reversible Data, Forward-Only Schema:** Schema changes are forward-only (no `down` migration). Data backfills must be idempotent and resumable so a redeploy can safely re-run them.
7. **Ban `drizzle-kit push`** against shared/staging/production databases — it diffs and applies destructive DDL non-deterministically. Migrations are the only sanctioned path (`mms-schema-migrate` skill).

## 8. Business Dates & Timezone Semantics

Instants and calendar days are different types of value. Conflating them produces off-by-one-day bugs that only appear in some timezones — and a madrasa operates on local calendar days (attendance, enrolment, invoice due dates, session schedules).

1. **Instants are `TIMESTAMPTZ`:** every audit/created/updated column stores an absolute instant with timezone (`timestamp({ withTimezone: true, mode: "date" })`). Never store a naive local time for an instant.
2. **Business calendar days are dates, not instants:** attendance day, enrolment date, invoice due date, and session date are *calendar days in the tenant's timezone*. Model them explicitly (a `date` column, or a `varchar(10)` `YYYY-MM-DD`, matching the shared schema) and never derive them by truncating a `timestamptz` in application code — truncating in UTC shifts the day for tenants east of UTC.
3. **The tenant's timezone is the authority:** resolve "today" in the workspace timezone, not the server's and not the browser's. The browser is a display surface; the server decides what day it is for a write.
4. **Formatting is a presentation concern:** render through `formatDate`/`formatMoney` from `@mms/shared` (skill `mms-i18n-completeness`), never with ad-hoc `Intl`/`toLocaleDateString` calls scattered per module. Formats differ per locale; stored values do not.
5. **DST boundaries are real:** a day is not always 24 hours and a local midnight may not exist. Never compute a day boundary as `start + 24h`; construct the boundary from the calendar date in the tenant timezone.
6. **Comparison and range filters** must use the same representation as storage: comparing a `date` column against an instant, or a `timestamptz` against a naive string, silently drops the index and can return a wrong day. Verify with `EXPLAIN` (skill `mms-db-performance`).
7. **Calendar policy:** the product stores and compares Gregorian values; any lunar/Hijri display is a derived, tenant-configurable presentation (see `mms-form-architecture.md` on the calendar field). Do not let a display calendar change stored semantics.

---
description: Data Layer — PostgreSQL, Drizzle schema, migrations, database transactions, localStorage cache, sync API, and TanStack Query fetching. Applies to tenant and platform.
paths:
  - "apps/backend/src/db/**"
  - "apps/backend/drizzle.config.ts"
  - "apps/backend/src/db/migrations/**"
  - "apps/backend/src/routes/common/db.ts"
  - "apps/backend/src/routes/tenant/**"
  - "apps/backend/src/routes/platform/**"
  - "apps/backend/src/services/dbSyncService.ts"
  - "apps/backend/src/contacts/**"
  - "apps/backend/src/lib/**"
  - "apps/frontend/src/lib/db.ts"
  - "apps/frontend/src/lib/queryClient.ts"
  - "apps/frontend/src/hooks/**"
  - "apps/frontend/src/tenant/hooks/**"
  - "apps/frontend/src/platform/**"
  - "apps/frontend/src/tenant/features/**/hooks/**"
  - "packages/shared/src/apiSchemas.ts"
---

# MMS Data Layer & Caching System

**Workflow skills:** REST Query factories → `mms-query-factories` · Drizzle DDL/RLS/Schema → `mms-schema-migrate` · backend API → `mms-backend-api` · shared package → `mms-shared-package` · legacy `/api/db` → `mms-data-sync` · backup wipe → `mms-backup-restore`.

Authoritative standards for backend databases, Drizzle ORM, transactions, shared Zod contracts, and TanStack Query across **tenant and platform** boundaries.

## 1. Normalization, Multi-Tenancy & Drizzle Schema Standards

### 1. Normalization & Schema Purity
- **Strict Third Normal Form (3NF):** Every non-key attribute must depend directly on the primary key, the whole key, and nothing but the key. Eliminate transitive dependencies into separate child tables.
- **Zero Semi-Structured Storage:** Do not use `json`, `jsonb`, `array`, `hstore`, or untyped text blobs for business attributes. Every single data point must have a dedicated, typed PostgreSQL column. (Ephemeral auth artifacts, legacy snapshots, and settings singletons are the sole exceptions).
- **No EAV (Entity-Attribute-Value):** Never model dynamic properties using generic key/value tables (e.g., `field_name`, `field_value`). Add explicit columns or concrete relational sub-tables.
- **Atomic Attributes:** Never store delimited values (e.g., comma-separated tags or IDs). Use dedicated junction tables for many-to-many ($N:M$) relationships.

### 2. Multi-Tenancy & Isolation
- **Mandatory Tenant Foreign Key:** Every tenant-scoped table must include `tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" })` (or `workspaceSubdomain: text("workspace_subdomain").notNull()` where workspace scope applies).
- **Row-Level Security (RLS):** Every query must execute within a database transaction scoped with `SET LOCAL app.current_tenant = :tenant_id`.
- **Composite Tenant Uniqueness:** Any entity-level unique constraint must include the tenant identifier (e.g., `UNIQUE(tenant_id, email)` or `UNIQUE(tenant_id, code)`).

### 3. Data Typing & Column Standards
- **Primary Keys:** Standardize on `id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity()` for high-write/internal tables or `id: uuid("id").defaultRandom().primaryKey()` for distributed/public-facing IDs. Never use auto-incrementing serials without identity semantics.
- **Temporal Columns:** Always use `TIMESTAMPTZ` (`timestamp({ withTimezone: true, mode: "date" })`). Every table must have `createdAt` and `updatedAt` defaulting to `clock_timestamp()` / `now()`.
- **Bounded Strings:** Use `varchar({ length: N })` with explicit length constraints for predictable fields (names, codes, phone numbers, postal codes). Reserve `text` exclusively for open-ended multi-line content (notes, descriptions).
- **State Machines:** Use PostgreSQL native `pgEnum` for fixed domain statuses (e.g., `enrollment_status`, `payment_status`) to prevent invalid string writes.

### 4. Indexing & Integrity Invariants
- **Foreign Key Indexing:** Every foreign key column must have an explicit B-Tree index to prevent full table scans during joins and cascade deletes.
- **Database-Enforced Integrity:** Never rely solely on application-layer validation. Enforce invariants with `CHECK`, `NOT NULL`, `DEFAULT`, and `FOREIGN KEY` definitions directly in DDL.
- **Filter Predicates:** Create composite indexes matching query patterns left-to-right: `(tenant_id, status, created_at DESC)` and partial indexes `WHERE deleted_at IS NULL` for active queries.

### 5. Drizzle ORM & Migration Guidelines
- **Bidirectional Relations:** Every `pgTable` definition must have corresponding `relations()` configured in Drizzle to support typed relational queries (`db.query`).
- **Export Types:** Every schema file must export `$inferSelect` and `$inferInsert` types alongside the table definition.
- **Migration Immutability:** Never alter existing generated migration SQL files once committed to version control. Apply new schema changes by generating subsequent migration steps via `drizzle-kit generate`.

### 6. Shared Contract & Fastify Service Standards
- **Shared Zod Contracts (`packages/shared/src/...`):** Define write schemas using Zod with `.strict()` enforcement. Export explicit Insert, Update, and Response DTO types aligning 1:1 with Drizzle table definitions.
- **Backend Fastify Services (`apps/backend/src/...`):** Execute all tenant operations within transaction-scoped RLS sessions ensuring `SET LOCAL app.current_tenant` is applied. Validate incoming payloads using `@mms/shared` Zod schemas before database persistence.

### 7. Deliverable Format for Entity & Feature Generation
When generating code for any feature or entity, provide:
1. **Drizzle Table & Relations Definition** (`apps/backend/src/db/schema/[entity].ts`) with full constraints and indexes.
2. **Shared Zod Validation Schemas & DTO Types** (`packages/shared/src/schemas/[entity].ts`).
3. **Database Migration Script / SQL DDL** representing the changes.

---

## 2. Database & ORM Architecture (PostgreSQL + Drizzle)

| Concern | Standard & Constraint |
|---|---|
| **Pool Sizing & Timeouts** | Size pool via `PG_POOL_MAX` (default 20). `withTenantTransaction` applies `PG_STATEMENT_TIMEOUT_MS` (30s) and `PG_IDLE_IN_TX_TIMEOUT_MS` (15s). |
| **SQL Fragment Safety** | Use parameterized `sql` tagged templates only. Strict **ban** on `sql.raw`, string concatenation, or unescaped user identifiers. |
| **Clean Architecture** | Routes → Use Cases (`{module}/use-cases/**`) via DI → Repository Interface (`{module}/repository/**`) → Drizzle Adapter. Controllers never import raw DB pools. |
| **Transaction RLS** | Enforce session context inside transactions via `SET LOCAL` (`app.current_tenant`, `app.rls_bypass = off`, `app.current_user_id`). Destroyed automatically on rollback/commit. |
| **New Tenant Tables** | `FORCE ROW LEVEL SECURITY` + RLS policy (`tenant_id = current_setting('app.current_tenant', true)::uuid` or subdomain match). Writes route through `withTenantTransaction`. |
| **Soft-Delete Standards** | Typed nullable `deleted_at` + index `(tenant_id, deleted_at)` + partial index `WHERE deleted_at IS NULL`. Audited with `deleted_by`/`deletion_reason`. |
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
| **Query Key Factories** | Stable tuple keys via colocated `queryOptions` / `mutationOptions` factories (`mms-hooks.md`). |
| **Auth Gate & Signal** | `enabled: isAuthenticated` (tenant) / `isPlatformAuthenticated` (platform). Pass Query `signal` to `apiFetch` (mandatory). |
| **Mutations & Cache** | Call-site `notify.*` + `t()` after `mutateAsync`. Await mutation before dialog close. Invalidate specific list/count tuple keys. Ban global mutation toast buses. |
| **Optimistic Policy** | Only for idempotent, easily-rollbackable actions. **Banned** for money, soft-delete, bulk ops, messaging sends. Always reconcile against server response. |
| **Pagination & Lists** | Server `page` + `limit` for directories; `placeholderData: (prev) => prev` for smooth pagination. Unpaged dumps (`loadAllFn`) are strictly banned. |
| **Live WebSocket Push** | `/api/ws` with `broadcastTenantUpdate` → FE `TenantLivePushSubscriber` invalidates Query tuple keys on server events. |

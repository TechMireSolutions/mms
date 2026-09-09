---
trigger: model_decision
---

# MMS Data Layer & Caching System

**Workflow skills:** REST Query factories → `mms-query-factories` · Drizzle DDL/RLS/Schema → `mms-schema-migrate` · backend API → `mms-backend-api` · shared package → `mms-shared-package` · legacy `/api/db` → `mms-data-sync` · backup wipe → `mms-backup-restore` · audit trail → `mms-audit-trail`.

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
- **Filter & Sort Predicates:** Create composite indexes matching query patterns left-to-right: `(tenant_id, status, created_at DESC)` and partial indexes `WHERE deleted_at IS NULL` for active queries. All columns evaluated in `where()`, `leftJoin() ... on()`, and `orderBy()` clauses must be indexed — `mms-performance.md`.

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
| **Explicit Resource Management** | Use `using` / `await using` for database connections, file handles, and stream resources to auto-dispose and return clients to pool on scope exit without boilerplate `finally` blocks. |
| **Zero Queries in Loops** | Strict ban on queries in `for`, `forEach`, `map`, or `Promise.all`. Batch via Drizzle relational `with`, `inArray` (bounded $\le 500$ via `bulkIdsBodySchema`), SQL joins, or batch `/resolve`. |
| **Zero Wildcard Projections** | Strict ban on `SELECT *` and bare `db.select().from(table)`. Explicit column projections matching Response DTOs (`db.select({ id: table.id, ... })` or `columns: { id: true, ... }`). |
| **Server Caching Architecture** | Redis (`apps/backend/src/lib/redis.ts`) + LRU caching. TTL 60s for metrics/KPIs, 300s for lookups/config/branding. Multi-tenant key isolation: `mms:{tenantId}:{module}:{resource}:{hash}`. Mutating ops must evict keys and broadcast via `/api/ws`. |
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
| **Live WebSocket Push** | `/api/ws` with `broadcastTenantUpdate` → FE `TenantLivePushSubscriber` invalidates Query tuple keys on server events. |

---

## 5. Modern Database Audit Trail & Cryptographic Integrity

Authoritative standards for audit trail architecture, tamper-evident hash chains, transactional capture, privacy-compliant erasure, and storage tiering.

### 1. Five-Dimension Payload Standard & Canonical JSON
- **Five Dimensions:** Every audit record must capture:
  - **Who:** `real_user_id`, `impersonated_user_id` (if any), `ip_address`, `client_app`, `session_id`. Traces both human/system actor and any impersonated context.
  - **What:** `table_name`, `record_id`, `old_state`, `new_state` stored as canonical JSON for exact point-in-time state reconstruction.
  - **When:** `transaction_timestamp` in UTC with microsecond precision (`timestamptz`) for timeline accuracy under concurrent writes.
  - **Why:** `correlation_id` (propagating W3C Trace Context `traceparent`), `action_type` (`CREATE`, `UPDATE`, `DELETE`, `VIEW`, `LOGIN`, `REDACT`, `RESTORE`), `api_endpoint`, `http_method`. Links a database write back to the request or business event that caused it.
  - **Integrity:** `hash_previous`, `hash_current`, `verification_status`.
- **W3C Trace Context as Correlation ID:** Propagate the W3C Trace Context `traceparent` value as (or alongside) the `correlation_id` (use a real trace ID, not a bespoke UUID). This links audit rows directly to the APM/observability tracing stack rather than maintaining an isolated, audit-only identifier.
- **RFC 8785 Canonical JSON (JCS):** Row states (`old_state`, `new_state`) and payload hashing MUST use RFC 8785 JSON Canonicalization Scheme for deterministic representation across environments, runtimes, and languages — rather than an ad-hoc "sort keys, strip whitespace" convention, so canonicalisation is interoperable across your stack. Ad-hoc string manipulation is strictly forbidden.
- **Capture Minimization:** Minimize at capture time. Capture only fields essential for point-in-time state reconstruction. Never log full raw PII payloads or secrets (passwords, tokens, credentials, payment details) into audit rows — every field captured is a field that must later be handled under an erasure request.

### 2. Capture Patterns & Consistency Trade-Offs
- **Application-Level Outbox (Default for MMS):** Audit events must be written atomically inside the existing database transaction (`withTenantTransaction`) alongside the primary entity mutation. Best for new services where strong consistency is required; low overhead (writes inside the existing transaction). If the transaction rolls back, no orphan audit rows exist.
- **Change Data Capture (CDC):** Best for high-throughput systems where you cannot touch application code; near-zero overhead on the primary; async downstream; eventual consistency (e.g. Debezium reading WAL into Kafka).
- **Hybrid (CDC + Outbox):** Sanctioned for large systems with mixed workloads requiring strong consistency for financial transactions and async capture for read/metric streams.
- **Event Sourcing Ban for Pure Audit:** Do not reach for Event Sourcing purely for audit purposes. Event sourcing is an architectural commitment across the entire domain, not an audit feature; adopt it only if your domain already benefits from an event-sourced model for reasons beyond auditing.

### 3. Scalable Cryptographic Tamper-Evidence
- **Cryptographic Hash Chaining:**
  `hash_current = SHA-256(hash_previous + canonical_json(payload) + transaction_timestamp)`
  Emitted via native `node:crypto` (`crypto.hash('sha256', buffer)`).
- **Sharded Chains Over Global Serialization:** Scale the chain — never serialize all writes through a single global chain. A single strictly-sequential hash chain forces every write to wait on the previous row's hash, causing severe transaction lock contention under concurrent load. Shard hash chains per logical partition (per tenant workspace, per aggregate domain, or per time-window) and periodically roll shard heads up into a Merkle tree, publishing the Merkle root at fixed intervals (the same technique certificate-transparency logs use to make tamper-evidence scale under concurrent writes); verify against the published root rather than replaying one global serial chain.
- **Scheduled Automated Verification:** Run automated chain (or Merkle-root) verification on a scheduled cadence (hourly/daily). Store verification outcomes in a separate append-only table (`audit_verification_runs`). Immediately alert on broken chains, missing records, or sequence gaps — never rely on someone noticing during a manual audit.
- **Complementary Statement-Level Auditing (`pgAudit`):** Statement-level logging is complementary, not a substitute. A row-based audit table only captures writes that go through the application write path. It will not see ad-hoc `SELECT`s, direct database console access, or DDL. Pair it with database-native statement/session auditing (`pgAudit`) to close that gap.
- **Database Privilege Hardening & JIT Access:**
  - The service writing transactional data gets `INSERT`-only privileges on the audit schema.
  - Revoke `UPDATE`/`DELETE` on audit tables from every role, including the application's own database user.
  - Direct read access is segregated to a dedicated security role with mandatory MFA enforcement and ideally Just-In-Time (JIT) break-glass access (granted, logged, and expires — not a standing grant).

### 4. Privacy, Retention & Right-to-Erasure
- **Ban on Historical Row Deletion:** Immutable audit logs and a "right to erasure" obligation are in direct tension. Resolve it with one of two recognized patterns — never delete or rewrite historical rows, which breaks the hash chain:
  1. **Crypto-Shredding (Primary Standard):** Encrypt personal-data fields with a per-subject (or per-record) key at write time. To "erase" a subject, destroy their key rather than the row. The audit row, its hash, and position in the chain remain untouched; the plaintext becomes permanently unrecoverable mathematical noise. More rigorous option and scales cleanly to bulk erasure requests.
  2. **Redact-and-Append:** Replace personal-data values in-place with a fixed redaction marker (`[REDACTED_PER_REQUEST]`), appending a new chained audit event (`action_type = 'REDACT'`). Never recompute `hash_previous`/`hash_current` on the historical rows — the chain attests to when the redaction happened, not to a rewritten history.
- **Statutory Retention Floors:**
  - **HIPAA:** 6 years (if health records are in scope).
  - **SOX:** 7 years (if listed-company financials are in scope).
  - **PCI-DSS:** 1 year (3 months online). Avoid storing card data in the audit trail at all — reference a tokenised payment-processor record instead.
  - **Regional Privacy Laws (GDPR / equivalent):** Verify your jurisdiction's law is actually enacted and in force before treating a draft bill as binding.
- **Automated Retention Enforcement:** Automate retention enforcement as policy-driven purging (on the *encrypted-key* lifecycle for crypto-shredded data, or on the *raw row* lifecycle for non-personal audit data) rather than manual review.

### 5. Storage Tiering & Archival
- **Partitioned Relational Tables (Hot: 0–30 days):** Partition audit tables by date (monthly `PARTITION BY RANGE (transaction_timestamp)`). Bounds index sizes, speeds time-bound queries, and makes archiving a partition-detach operation instead of a `DELETE`.
- **Warm Tier (31–90 days):** Time-series storage or older read-only partitions for time-bound queries and limited aggregation.
- **Cold Tier (91+ days):** Columnar format (Parquet/ORC) on WORM-locked (Write Once Read Many) immutable object storage (S3 Object Lock or immutable blob storage). Cold storage must be WORM-enforced — "cold" without immutability is merely cheaper storage, not tamper-evident storage.
- **Detached Partition Verification:** Carry the relevant chain hash (or Merkle root) alongside each archived batch so a detached partition can still be verified after archival.

### 6. Integrity Monitoring, Anomaly Baselining & Auditing the Auditor
- **Integrity Monitoring:** Automated chain verification on schedule; alert on breaks, gaps, or missing records.
- **Anomaly Detection Baselining:** Baseline normal write volume and access patterns per actor. Alert on write spikes (>300% of baseline), off-hours administrative access, and geographically implausible sessions. Reserve ML-based anomaly detection for when rule-based baselining stops catching real incidents — it is a scaling step, not a starting point.
- **Compliance Reporting & Auditing the Auditor:** Automate report generation and tamper-evident export (include chain/Merkle verification in the export itself). Access to the audit trail is itself an auditable event: all search queries, view sessions, and exports targeting audit tables must emit an immutable audit event (`action_type: 'VIEW'`, `table_name: 'audit_trail_events'`).

### 7. Implementation Roadmap & Blockchain Scoping
- **Five-Phase Implementation Roadmap:**
  1. **Phase 1 (Foundation):** Payload schema with RFC 8785 canonical JSON, append-only privilege model (`INSERT`-only), monthly date partitioning.
  2. **Phase 2 (Core Capture):** Transactional outbox or CDC deployment, W3C `traceparent` correlation-ID propagation, initial monitoring.
  3. **Phase 3 (Integrity):** Sharded hash chaining, Merkle tree rollups, scheduled automated verification job, alerting.
  4. **Phase 4 (Privacy):** Crypto-shredding key management or redact-and-append erasure workflows, automated policy-driven retention purging.
  5. **Phase 5 (Advanced):** Tiered storage lifecycle with WORM S3 Object Lock, rule-to-ML anomaly detection baselining, external anchoring only if a stated requirement exists.
- **Blockchain / Decentralized Anchoring Scope:** Scope blockchain/decentralized anchoring correctly. It solves one specific problem: proving integrity to an external party without that party trusting your database administrators. Most systems don't have that requirement. Treat it as an optional addition for cases with an explicit external-evidentiary need (e.g. a regulator or court requires proof independent of your own infrastructure) — not a default "layer" every audit system should build.




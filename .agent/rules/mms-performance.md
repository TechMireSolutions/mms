---
trigger: model_decision
description: Mandatory performance, resource efficiency, caching, streaming, query optimization, and DOM virtualization rules.
---

# MMS Performance & Resource Efficiency Rules

Authoritative performance and resource constraints across **tenant workspaces and platform apex**. Every code change, refactor, and new feature is strictly bound by these invariants.

**Workflow skills:** code review & bottlenecks → `mms-code-review` · query factories & caching → `mms-query-factories` · backend services → `mms-backend-api` · Drizzle indexes & DDL → `mms-schema-migrate` · soft-delete performance & purge → `mms-soft-delete` · frontend shell & rendering → `mms-frontend`.

---

## 1. Database & I/O Optimization

- **Zero Queries in Loops (N+1 Elimination):** NEVER execute database queries inside iterative loops (`for`, `forEach`, `map`, `Promise.all`).
  - Batch iterations using Drizzle relational `with: { ... }` queries, `inArray(table.column, ids)` predicates (bounded to $\le 500$ IDs via shared `bulkIdsBodySchema`), SQL `JOIN`s, or batch resolution endpoints (`/resolve`).
- **Zero Wildcard Projections (`SELECT *` Strict Ban):** NEVER emit `SELECT *` or bare Drizzle `db.select().from(table)` without column selection across the network. `pnpm run check:db-projections` (CI) holds the pre-existing sites as a ratchet — it prints `count` against its own `BASELINE`, and no NEW site may be added. The hazard is future bloat, not measured cost today: these tables are narrow and their mappers read most columns, but adding one wide `jsonb` column would silently inflate every list query. Do not restate the count here — the script is the SSOT.
  - Explicit typed column projection required (e.g. `db.select({ id: table.id }).from(table)` or `db.query.findMany({ columns: { id: true } })`). Strip heavy text, notes, and audit blobs from list queries; load only on `GET /:id`. Align projections 1:1 with `@mms/shared` Response DTOs.
- **Mandatory Indexing for Query Predicates:**
  - ALWAYS back columns used in `where()` filters, `leftJoin() ... on()` foreign key links, and `orderBy()` sorting with explicit indexes in Drizzle schema definitions.
  - Multi-tenant indexing standard: prefix compound indexes with tenant scope (e.g. `(tenant_id, status, created_at DESC)`) and define partial indexes `WHERE deleted_at IS NULL` for active queries on soft-deleted tables (`mms-data-layer.md`).
- **Mandatory Pagination with Hard Upper Bounds:**
  - ALWAYS enforce pagination on every collection query.
  - Apply standard defaults: default `limit: 25`, maximum hard upper bound `limit: 100` via shared `baseListQuerySchema`.
  - Unpaged collection dumps (`loadAllFn`, unbounded queries without `limit`) are strictly banned.
- **Connection Pool Reuse & Explicit Lifecycle:**
  - Maintain and reuse the persistent connection pool (`PG_POOL_MAX`, default 20) with `withTenant`.
  - NEVER open ad-hoc, unpooled database connections (`new Pool()` or `new Client()` per request).
  - Use Node.js 24 Explicit Resource Management (`using` / `await using`) for automatic cleanup and checkout release back to the pool without boilerplate `finally` blocks.
- **Audit Hash Chain Sharding & Partition Detachment (`mms-audit-trail`):**
  - NEVER serialize system writes through a single global cryptographic hash chain. Shard hash chains per logical partition (tenant or aggregate domain) and roll up into periodic Merkle roots.
  - Archive hot audit partitions by detaching date partitions (`ALTER TABLE ... DETACH PARTITION`) instead of running `DELETE` — details `mms-data-layer.md` §5.
- **Soft-Delete Indexing & Storage Engine Efficiency:**
  - Active list queries must hit Category B partial indexes (`WHERE deleted_at IS NULL`), trash queries hit Category C (`WHERE deleted_at IS NOT NULL`).
  - High-churn soft-deleted tables (`message_logs`, `attendance_records`) must configure aggressive autovacuum thresholds in DDL (`autovacuum_vacuum_scale_factor = 0.05`) — details `mms-data-layer.md` §6.3.
- **BRIN (Block Range Index) for Append-Only Time-Series:**
  - Sequential append-only tables (`audit_trail_events`, `message_logs`) must index monotonic timestamp columns (`transaction_timestamp`, `created_at`) using PostgreSQL BRIN indexes (`using: 'brin'`) rather than standard B-Trees.
  - BRIN indexes consume < 1% of the disk space of B-Trees, maintain high buffer cache residency, and eliminate B-Tree page split / rebalancing write amplification during continuous inserts.

---

## 2. Server Compute & Memory Discipline

- **Zero Memory Buffering for Large Datasets:**
  - NEVER buffer large datasets, bulk exports, or file uploads into process memory (`Buffer.concat`, `file.toBuffer()`, or loading 10,000 rows into memory arrays).
  - File uploads: Stream multipart files using Fastify `@fastify/multipart` stream chunks directly to disk/storage.
  - Bulk exports: Use streaming pipelines (`node:stream`, `stream.Readable.from()`, chunked transfer, or async generators). Datasets exceeding the interactive threshold ($> 500$ rows) must be offloaded to isolated background worker jobs (`mms-background-jobs`).
- **Algorithmic Efficiency on Hot Paths:**
  - Hot execution paths (request filters, permissions checks, entity transformations, sync pipelines) must strictly avoid nested loops ($O(n^2)$).
  - Use `Map<string, T>` or `Set<string>` for $O(1)$ lookups, relationship resolution, and deduplication instead of `array.find()` inside `array.map()`.
- **Memory Leak Prevention:**
  - Always clean up resources: pair `addEventListener` with `removeEventListener`, clear intervals/timeouts (`clearInterval`, `clearTimeout`), and remove `AbortSignal` listeners on completion.
  - Ban unbounded module-scoped caches, arrays, or maps (`const cache = {}`) without LRU eviction and strict maximum item limits.
- **Lean Network Payloads & Compression:**
  - Keep payloads minimal: serialize only required DTO fields, strip `null`/`undefined` keys where practical.
  - Dynamic compression: configure Fastify `@fastify/compress` with fast Brotli (quality 4) and gzip (level 6) for API JSON payloads to prevent event-loop stalls.
  - Static pre-compression: configure `@fastify/static` with `preCompressed: true` so pre-generated `.br` and `.gz` files are streamed directly with zero runtime compression CPU overhead.
  - Streaming & Realtime Transport: use `Transfer-Encoding: chunked` and unbuffered streaming (`flushpackets=auto`, `X-Accel-Buffering: no`) for SSE and live-push updates.
  - Never serialize internal database attributes (`tenantId`, password hashes, salts, internal flags) to client consumers. Format money as exact decimal strings (`/^\d+(\.\d{1,2})?$/`).
- **Audit Payload Minimization & Canonical Hashing (`mms-audit-trail`):**
  - Minimize audit payloads at capture time: never log full raw PII or secrets into `old_state`/`new_state`.
  - State hashing and delta comparisons must strictly use RFC 8785 (JSON Canonicalization Scheme - JCS) for deterministic representation, avoiding CPU-heavy custom recursive sorting on hot write paths — `mms-data-layer.md` §5.2.
- **Batched Single-Statement Bulk Updates:**
  - `bulkDeleteFn` and `bulkRestoreFn` must execute a single batched SQL `UPDATE` statement scoped via `inArray(table.id, ids)`. Sequential row update loops ($N+1$) are strictly banned — `mms-data-layer.md` §6.9.
- **Chunked Lock-Free Background Purge Processing:**
  - Hard-purge workers (`purgeExpiredArchivedRecords`) must execute deletions in bounded chunks of 500 rows using `LIMIT 500 FOR UPDATE SKIP LOCKED` with brief pauses (50ms) to eliminate WAL spikes and transaction lock contention — `mms-data-layer.md` §6.11.

---

## 3. Caching Architecture (Redis & In-Memory)
- **Multi-Tier TTLs:** Cache read-heavy queries via Redis (`apps/backend/src/lib/redis.ts`) / LRU. Standard TTLs: `60s` for aggregate metrics/KPIs; `300s` for static config/lookups/branding. SWR on high-traffic read paths.
- **Tenant Isolation:** Cache keys MUST isolate by tenant and context: `mms:{tenantId}:{module}:{resource}:{hash(queryParams)}`. Include role/permission scope when payload varies by viewer. Global keys for tenant data are strictly banned.
- **Write Invalidation:** Every mutation (`POST`/`PUT`/`PATCH`/`DELETE`) must evict affected keys and broadcast real-time invalidation via `/api/ws` (`broadcastTenantUpdate`).
- **HTTP Caching & Edge Strategy:**
  - Idempotent API reads: Emit tenant-salted weak ETags (`W/"<tenantId>-<digest>"` or `W/"<tenantId>-r<rev>-<digest>"`, incorporating `x-schema-revision` when provided) and differential `Cache-Control`. Return `304 Not Modified` on matching `If-None-Match`.
  - Multi-tenant `Vary` isolation: every `/api/*` response must inject `Vary: Accept-Encoding, X-Tenant-Id, Authorization` to strictly eliminate cross-tenant cache contamination on intermediate proxies.
  - Differential `Cache-Control`: Tenant metadata and lookups (`/preferences`, `/field-config`, `/lookups`, `/branding`, `/setup-config`, `/column-preferences`) emit `Cache-Control: private, no-cache`. Dynamic business endpoints emit `Cache-Control: private, no-cache, no-store, must-revalidate`.
  - Hashed static assets (`/assets/*.[hash].js`, `/assets/*.[hash].css`): Emit `Cache-Control: public, max-age=31536000, immutable` and `Vary: Accept-Encoding`.
  - Brand & root assets (`/favicon.ico`, `/favicon.svg`, `/platform-logo.*`, `/icon-*.png`, `apple-touch-icon.*`): Emit `Cache-Control: public, max-age=86400, must-revalidate` and `Vary: Accept-Encoding` (preventing multi-year stale locks while permitting repeat caching).
  - Application shell entry files (`index.html`, `site.webmanifest`, `/sw.js`): Emit `Cache-Control: no-cache, no-store, must-revalidate`, `Pragma: no-cache`, and `Vary: Accept-Encoding` to ensure instant client adoption of new releases and service workers.
  - Edge & Origin Transport: Apache reverse proxy terminates HTTP/2 (`Protocols h2 http/1.1`) over TLS, Brotli/gzip compression, explicit `KeepAlive On`, `KeepAliveTimeout 30`, `MaxKeepAliveRequests 1000`, and `ProxyTimeout 60`. Fastify Node HTTP server enforces synchronized `keepAliveTimeout` (30s) and `headersTimeout` (35s) with TCP Keep-Alive (`socket.setKeepAlive(true, 10000)`).
  - Streaming SSE / Real-time Push: Emit `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no`, and `Transfer-Encoding: chunked` with proxy buffering disabled (`flushpackets=auto`, `SetEnv proxy-sendchunked 1`, `disablereuse=Off`).
  - WebSocket Backpressure & Heartbeats: Enforce 30s ping cycle with 10s pong deadline (`WS_PONG_DEADLINE_MS = 10000`). Drop non-essential telemetry if `bufferedAmount > 64 KB` and terminate stalled sockets if `bufferedAmount > 512 KB`. Sanitize job payloads for strict tenant isolation.
  - Client Offline Persistence: Hydrate TanStack Query v5 cache via native IndexedDB persister (`mms_offline_cache`) with 24-hour `gcTime`, exponential backoff retry ($2^n \times 1000\text{ ms}$), and `networkMode: 'online'` with automatic mutation pause/resume. Service Worker caches core static shell (CacheFirst) and tenant branding/icons (StaleWhileRevalidate) while passing mutations directly to network (NetworkOnly).

---

## 4. Client Bundle & Asset Optimization
- **Build-Time Pre-compression:** Vite builds must integrate `vite-plugin-compression2` to automatically generate `.br` (Brotli quality 11) and `.gz` (gzip level 9) files for all static bundle outputs exceeding 1 KB (`.js`, `.css`, `.html`, `.svg`, `.json`, `.webmanifest`), achieving > 65% transfer size reduction without runtime CPU cost. Fastify serves these directly from disk via `@fastify/static` with `preCompressed: true`.
- **Modular Imports:** Ban `lodash`, `moment`, `date-fns` (full), `ramda`. Use native modern JS (`toSorted`, `Object.groupBy`, `Intl.*`), pure `@mms/shared` (`formatDate`, `formatMoney`), and named icon imports (`import { Plus } from 'lucide-react'`).
- **Dynamic Imports & Splitting:** Route code-splitting with React `lazy` + `Suspense` across all feature routes. Dynamically import heavy libraries (Recharts, `jspdf`, `xlsx`, editors) on demand in action handlers (`mms-reports.md`).
- **Tree-Shaking:** Ban CommonJS-only packages that bloat the vendor chunk.
- **Zero CLS:** Serve images in WebP/AVIF with explicit `width`/`height` or aspect-ratio containers. Native `loading="lazy"` on non-hero images.

---

## 5. Client Rendering & Interaction Performance
- **Subtree Isolation:** Colocate transient input/toggle state to leaf components; never store keystroke state in page controllers.
- **Targeted Memoization:** Memoize non-trivial calculations (`useMemo` for sorting/filtering/aggregates) and callbacks/objects passed to memoized children (`useCallback`, `React.memo`) or dependency arrays. Complement with React 19 `startTransition`, `useDeferredValue`, and `useEffectEvent`.
- **Mandatory Virtualization (> 30 Items):** ALWAYS virtualize lists, tables, and card grids > 30 items via `@tanstack/react-virtual` (`useVirtualizer` as in `ContactsListDesktopTable.tsx`).
- **TanStack Query State:** Deduplicate network requests using tuple keys (`queryOptions` factories). Strict ban on `useEffect` fetch loops. Use `placeholderData: (prev) => prev` for smooth pagination.

---

## 6. Safety, Verification & Documentation Standards
- **Backward Compatibility:** Performance refactors must not change response contracts or schema. If a shape must change, land the contract change separately with its DTO and tests.
- **Verification Gate:** Run `pnpm typecheck` plus the scoped tests for what you touched (`pnpm test` = turbo unit/integration across workspaces; `pnpm test:e2e` for browser flows). Performance-sensitive changes also have ratchets in CI — `pnpm run check:db-projections`, `pnpm run check:migration-indexes`, `pnpm run check:bundle` — run the relevant one locally.
- **Document Bottlenecks:** Document Baseline Bottleneck and Quantified Resource Saved (CPU, RAM, DB queries, bundle size) in PR / completion reviews.

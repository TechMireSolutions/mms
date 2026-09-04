---
trigger: always_on
---

# MMS Performance & Resource Efficiency Rules

Authoritative performance and resource constraints across **tenant workspaces and platform apex**. Every code change, refactor, and new feature is strictly bound by these invariants.

**Workflow skills:** code review & bottlenecks → `mms-code-review` · query factories & caching → `mms-query-factories` · backend services → `mms-backend-api` · Drizzle indexes & DDL → `mms-schema-migrate` · frontend shell & rendering → `mms-frontend`.

---

## 1. Database & I/O Optimization

- **Zero Queries in Loops (N+1 Elimination):** NEVER execute database queries inside iterative loops (`for`, `forEach`, `map`, `Promise.all`).
  - Batch iterations using Drizzle relational `with: { ... }` queries, `inArray(table.column, ids)` predicates (bounded to $\le 500$ IDs via shared `bulkIdsBodySchema`), SQL `JOIN`s, or batch resolution endpoints (`/resolve`).
- **Zero Wildcard Projections (`SELECT *` Strict Ban):** NEVER emit `SELECT *` or bare Drizzle `db.select().from(table)` without column selection across network boundaries.
  - Explicitly specify only the columns required by the immediate consumer using typed projection objects:
    ```ts
    // ✅ Explicit Drizzle column projection
    await db.select({ id: students.id, firstName: students.firstName, lastName: students.lastName }).from(students);
    // ✅ Drizzle relational explicit columns
    await db.query.students.findMany({ columns: { id: true, firstName: true, lastName: true } });
    // ❌ Banned wildcard projection
    await db.select().from(students);
    ```
  - Strip heavy text, notes, full payloads, and internal audit blobs from list queries; load heavy attributes only on individual detail reads (`GET /:id`). Projections must align 1:1 with `@mms/shared` Response DTOs.
- **Mandatory Indexing for Query Predicates:**
  - ALWAYS back columns used in `where()` filters, `leftJoin() ... on()` foreign key links, and `orderBy()` sorting with explicit indexes in Drizzle schema definitions.
  - Multi-tenant indexing standard: prefix compound indexes with tenant scope (e.g. `(tenant_id, status, created_at DESC)`) and define partial indexes `WHERE deleted_at IS NULL` for active queries on soft-deleted tables (`mms-data-layer.md`).
- **Mandatory Pagination with Hard Upper Bounds:**
  - ALWAYS enforce pagination on every collection query.
  - Apply standard defaults: default `limit: 25`, maximum hard upper bound `limit: 100` via shared `baseListQuerySchema`.
  - Unpaged collection dumps (`loadAllFn`, unbounded queries without `limit`) are strictly banned.
- **Connection Pool Reuse & Explicit Lifecycle:**
  - Maintain and reuse the persistent connection pool (`PG_POOL_MAX`, default 20) with `withTenantTransaction`.
  - NEVER open ad-hoc, unpooled database connections (`new Pool()` or `new Client()` per request).
  - Use Node.js 24 Explicit Resource Management (`using` / `await using`) for automatic cleanup and checkout release back to the pool without boilerplate `finally` blocks.

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
  - Keep payloads minimal: serialize only required DTO fields, strip `null`/`undefined` keys where practical, and ensure Fastify `@fastify/compress` (gzip/Brotli) is active on responses.
  - Never serialize internal database attributes (`tenantId`, password hashes, salts, internal flags) to client consumers. Format money as exact decimal strings (`/^\d+(\.\d{1,2})?$/`).

---

## 3. Caching Architecture (Redis & In-Memory)

- **Multi-Tier Caching with Explicit TTLs:**
  - Cache read-heavy, low-churn query results using the backend Redis client (`apps/backend/src/lib/redis.ts`) or bounded in-memory LRU stores.
  - Standard TTLs:
    - `60s` for aggregate metrics, KPI dashboard strips, and report counts.
    - `300s` for static module configurations, field registries, lookups, and branding.
  - Use Stale-While-Revalidate (SWR) patterns on high-traffic read paths to serve instant responses while refreshing data in the background.
- **Multi-Tenant Key Namespacing (Zero Data Contamination):**
  - All cache keys MUST strictly isolate by tenant and context:
    `mms:{tenantId}:{module}:{resource}:{hash(queryParams)}`
  - Include user role/permissions scope in the cache key whenever the response shape or content varies by viewer permissions. Global un-namespaced keys for tenant data are strictly forbidden.
- **Mandatory Write Invalidation:**
  - Pair every mutation operation (`POST`, `PUT`, `PATCH`, `DELETE`) with an explicit cache eviction trigger targeting affected Redis keys.
  - Broadcast real-time invalidations to connected clients via `/api/ws` (`broadcastTenantUpdate`) to trigger TanStack Query cache invalidations.
- **HTTP Caching Headers:**
  - Emit standard caching headers (`ETag`, `Cache-Control: private, no-cache`) on idempotent `GET` endpoints.
  - Return `304 Not Modified` on matching `If-None-Match` headers to eliminate redundant payload transmission.

---

## 4. Client Bundle & Asset Optimization

- **Modular Imports Over Monolithic Bundles:**
  - NEVER import full utility libraries if modular or native runtime equivalents exist:
    - Ban `lodash`, `moment`, `date-fns` (full), `ramda`.
    - Use native modern JavaScript (`Array.prototype.toSorted`, `Object.groupBy`, `Intl.DateTimeFormat`, `Intl.NumberFormat`) and pure `@mms/shared` utilities (`formatDate`, `formatMoney`).
    - Import icons modularly from `lucide-react` (`import { Plus } from 'lucide-react'`), never `import * as Icons`.
- **Dynamic Imports & Route Code-Splitting:**
  - All feature routes in `AppRoutes.tsx` and `PlatformRoutes.tsx` must use React `lazy(() => import(...))` with `Suspense`.
  - Heavy client libraries (Recharts, `jspdf`, `xlsx`, rich text editors) must be loaded dynamically on demand via dynamic `await import(...)` within action handlers or isolated route chunks (`mms-reports.md`).
- **Tree-Shaking & Package Discipline:**
  - Verify tree-shaking compatibility before introducing any new third-party dependency.
  - Ban CommonJS-only packages that break Vite tree-shaking or bloat the vendor chunk.
- **Asset Optimization & Zero CLS:**
  - Serve images in modern formats (WebP/AVIF) with explicit `width` and `height` dimensions (or fixed aspect-ratio containers) to guarantee Cumulative Layout Shift (CLS) = 0.
  - Use native `loading="lazy"` and `decoding="async"` on all non-hero images.

---

## 5. Client Rendering & Interaction Performance

- **Subtree Re-Render Isolation:**
  - Prevent full-subtree re-renders: colocate transient state (search input text, form drafts, toggle states, dropdown open flags) to the leaf-most component.
  - Avoid storing keystroke-by-keystroke input state in top-level page controllers.
- **Targeted Memoization & React 19 Patterns:**
  - Memoize non-trivial calculations (`useMemo`) such as sorting large arrays, multi-field filtering, regex matches, and summary reductions to prevent render churn.
  - Memoize function handlers and object/array references (`useCallback`, `useMemo`) passed as props to memoized child components (`React.memo`) or into hook dependency arrays.
  - Avoid premature memoization on trivial primitive operations (e.g. simple string concatenations or basic additions).
  - Complement memoization with React 19 concurrent capabilities: `startTransition` for non-urgent filter/tab transitions, `useDeferredValue` for high-frequency search inputs, and `useEffectEvent` for stable event callbacks that read latest props/state.
- **Mandatory Virtualization for Lists & Tables (> 30 Items):**
  - ALWAYS virtualize DOM lists, tables, cards grids, and feeds containing more than 30 concurrent items using `@tanstack/react-virtual` (`useVirtualizer`).
  - Reference: `ContactsListDesktopTable.tsx` for table virtualization with fixed/estimated row height, container scrolling, and bounded overscan. Never render hundreds of DOM table rows simultaneously.
- **TanStack Query State Deduplication:**
  - Deduplicate inflight network requests and cache query states using TanStack Query v5 tuple keys (`queryOptions` factories in `mms-query-factories`).
  - Strict ban on manual `useEffect(() => { fetch(...) }, [])` calls for server state.
  - Use `placeholderData: (prev) => prev` for smooth pagination without layout flickers.

---

## 6. Safety, Verification & Documentation Standards

- **Strict Backward Compatibility:**
  - Maintain 100% backward compatibility for all existing API contracts, database schemas, and consumer-facing props during performance refactors.
  - Never break existing caller contracts in the name of optimization.
- **Verification Gate:**
  - Run unit, integration, and typecheck tests after every performance refactor to guarantee zero behavioral regressions (`pnpm typecheck && pnpm test`).
- **Mandatory Bottleneck & Savings Documentation:**
  - For every performance refactor, explicitly document in the PR / commit description / completion review:
    1. **Baseline Bottleneck:** The root cause of the inefficiency (e.g., N+1 query loop, unvirtualized 200-row DOM, missing composite index, unmemoized render cascade).
    2. **Quantified Resource Saved:** The exact resource gain achieved (e.g., DB queries reduced from 50 to 1, DOM node count reduced by 90%, response time cut by 300ms, memory allocation reduced by 70%, bundle size reduced by 85KB).

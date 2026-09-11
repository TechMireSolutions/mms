---
name: mms-backend-api
description: Adds or modifies Fastify routes, middleware (authenticateTenant), services, Zod validation, auth artifacts, and WhatsApp integration in the MMS backend. Use when creating API endpoints, db sync, students/contacts REST, error handling, or backend services. For Drizzle DDL/migrations use mms-schema-migrate first.
---

# MMS Backend API Workflow

**Rules (norms SSOT):** `mms-api-interface.mdc` · `mms-data-layer.mdc` §5–§6 · `mms-performance.mdc` · `mms-auth-security.mdc` §5 · `mms-testing-observability.mdc` · `mms-form-architecture.mdc`. Modern Audit Trail Workflow → **`mms-audit-trail`**. Soft-Delete Workflow → **`mms-soft-delete`**.

## When to use

- New/changed route in `apps/backend/src/routes/`
- Service / Zod validation / WhatsApp-email backend
- Backend tests with Node 24 `node:test` and Fastify `inject()`

DDL / `schema.ts` / journal → skill **`mms-schema-migrate`**. CSRF / Origin / cookies / rate limits → **`mms-backend-security`**. Soft-delete architecture & checklist → **`mms-soft-delete`**. Health/ready probes → `mms-ops-infrastructure.mdc`.

## Architecture

```
app.ts → plugins/ → routes/ (thin) → middleware/ → services/ → db/
```

Refactored/growing modules (Contacts is the reference) use Clean Architecture layering:

```
routes/ (thin) → {module}/use-cases/ → {module}/repository/ (interface) → adapter (db/)
```

- Route handlers call the module **composition root** (`contactUseCases`) — never reach past it into Drizzle.
- Use-case functions take the repository **interface** via DI (testable with fakes).
- A single repository interface (`ContactsRepository`) is the sole storage gateway; the Drizzle adapter (`{module}RepositoryAdapter`) is the only concrete implementation.
- Legacy `services/*.ts` module paths stay as **stable re-export shims** of the composition root.

Never query `pg` from handlers. Prefer repositories / `withTenantTransaction`. Use **`dbSyncService`** only for legacy JSON documents (`/api/db/...`).

## Document store vs REST

| Situation | Approach |
|-----------|----------|
| Legacy `useLiveCollection` | Keep `/api/db/collections/:name` until migrated |
| Side effects (WA, email) | Dedicated route + service |
| **New domain module** | REST plugin + Zod + Query on FE |

Shipped REST: students, contacts, teachers, finance, enrollments, obligations, accounting, hasanat, examinations, question-bank, users, attendance, sessions, messaging (`routes/tenant/`). After REST migration, remove entity from `ALLOWED_COLLECTIONS` / FE `BUSINESS_COLLECTIONS`.

## Soft delete on REST resources

All soft-delete route logic flows through shared route factories (`crudResourceRoutes.ts`, `crudBulkRouteFactories.ts`, `crudBulkRouteHelpers.ts`). Never hand-roll ad-hoc delete/restore endpoints (complete workflow & checklist → **`mms-soft-delete`**):

- **Factory Route Registration**: Use `registerResourceRoutes` (`deleteFn`, `restoreFn`) and `registerSoftDeletableBulkTrashRoutes` (`bulkDeleteFn`, `bulkRestoreFn`). Gated on `canDeleteCollection(user, collection)` or module `canDelete`.
- **Trash-Aware List Loading**: Use `handleBulkListGet` with `supportsIncludeDeleted: true` (parses `isQueryFlagTrue(request.query.includeDeleted)` and enforces `canDeleteCollection` gate). Ban `scopeDeleted()` in memory.
- **Single-Record Read Semantics (`GET /:id`)**: Standard reads MUST append `isNull(table.deletedAt)` and return `404 Not Found` for archived records. Detail inspection with `?includeDeleted=true` requires `canDeleteCollection` check and sets `SET LOCAL app.include_deleted = 'true'` (`docs/soft-delete.md` §4.7).
- **Atomic Conditional Latch**: Avoid TOCTOU race conditions by updating with an atomic conditional latch:
  ```ts
  const [deleted] = await db.update(table)
    .set({ deletedAt: new Date(), deletedBy: userId, deletionReason: reason ?? null })
    .where(and(eq(table.id, id), eq(table.workspaceSubdomain, tenant), isNull(table.deletedAt)))
    .returning({ id: table.id });
  if (!deleted) throw new NotFoundError('Record not found or already archived');
  ```
- **Batched Single-Statement Bulk Updates**: `bulkDeleteFn` and `bulkRestoreFn` implementations must execute a single batched SQL statement (`inArray(table.id, ids)`). Never iterate sequentially row-by-row (`mms-performance.mdc` §1).
- **Dynamic Query AST**: Construct Drizzle query branches dynamically (`isNull(table.deletedAt)` vs `isNotNull(table.deletedAt)`). Never emit parameterized booleans (`$2::boolean IS TRUE OR deleted_at IS NULL`) which disable Category B partial indexes.
- **Relational Child Guardrails**: Nested relations in Drizzle `db.query.table.findMany({ with: { ... } })` do NOT auto-filter soft-deleted children. Declare explicit `where: (c, { isNull }) => isNull(c.deletedAt)`.
- **Uniqueness-on-Restore & Error 23505 Trap**: When restoring entities with unique fields (`email`, `phone`, `employee_id`), check for conflicts first, execute update, and catch PostgreSQL error `23505` (`unique_violation`), mapping it cleanly to `409 Conflict` (`docs/soft-delete.md` §4.5).
- **Session Revocation Invariant**: Immediately revoke active sessions and refresh tokens in Redis upon soft-deleting users or teachers. Gate auth resolvers on `deleted_at IS NULL`.
- **Active Foreign Key Guarding**: Reject writes attempting to assign foreign keys pointing to soft-deleted entities.
- **CDC Outbox Events**: Emit `entity.soft_deleted` and `entity.restored` transactional outbox events with monotonic versioning (`version: Date.now()`) for search index and Redis eviction.
- **Write Schemas**: Create/Update write schemas strip client soft-delete fields (`deletedAt`, `deletedBy`, `deletionReason`). Default excludes deleted; trash = deleted-only.
- **Audit Hooks**: Call `onAfterDelete` and `onAfterRestore` hooks; capture text snapshots on archival for forensics survival.

## Bulk PUT

Upsert only (`bulkSave` + `conflictTarget`). **Never** wire `replaceForWorkspace` as route `saveFn` for normal client saves.

## Transactional Outbox Audit Capture (`mms-audit-trail`)

When mutating audited entities (Contacts, Students, Teachers, Invoices, Accounting, Sessions):
- Capture audit events within the primary `withTenantTransaction` using the transactional outbox pattern to ensure atomicity.
- Populate the 5 dimensions: Who (`real_user_id`, `session_id`, `ip_address`), What (`table_name`, `record_id`, `old_state`, `new_state` as RFC 8785 canonical JSON), When (`clock_timestamp()`), Why (`correlation_id` from W3C `traceparent` header, `action_type`), and Integrity (`hash_previous`, `hash_current`).
- Strip non-essential PII and secrets (passwords, tokens) before serializing state deltas.

## Deliverable Format for Entity & Feature Generation
When generating backend code for any feature or entity, provide:
1. **Drizzle Table & Relations Definition** (`apps/backend/src/db/schema/[entity].ts`) with full constraints and indexes.
2. **Shared Zod Validation Schemas & DTO Types** (`packages/shared/src/schemas/[entity].ts`).
3. **Database Migration Script / SQL DDL** representing the changes.

## Add a REST resource

1. **Zod Schemas & Contracts**: Define strictly-typed API endpoints using `@ts-rest/core` contracts in `@mms/shared/contracts`. Write schemas in `@mms/shared` (`.strict()` on write bodies) + explicit Insert/Update/Response DTO types aligning 1:1 with Drizzle tables.
2. **Domain & DB Layer**:
   - Drizzle schema with typed columns (3NF/BCNF, zero semi-structured storage, multi-tenancy `tenantId` FK, bidirectional relations).
   - Domain use-cases in `{module}/use-cases/**` (orchestration, repo DI) + `{module}/repository/` interface + Drizzle adapter + composition root (`{module}UseCases`) — `mms-api-interface.mdc` §2.
3. **Service & Transaction RLS**: Execute tenant writes inside `withTenantTransaction` applying `SET LOCAL app.current_tenant = ?`. Always validate payloads via `@mms/shared` Zod schemas before persistence.
4. **Fastify Route**: Implement endpoints using `@ts-rest/fastify` connected to the shared contracts. `routes/tenant/{resource}.ts` — `authenticateTenant` + `registerStandardTenantRoutes` (+ bulk when needed) + `canWriteCollection` (or `authenticatePlatform` + `platformUserCan` for platform routes); call the composition root.
5. **Registration**: Register under `/api/{resource}` or `/api/platform/{resource}` in `routes/index.ts`.
6. **Tests**: `inject()` tests with `host: 'tenant.localhost'`.
7. **FE Query Hooks**: **`mms-query-factories`** / **`mms-frontend`**.

Refs: `routes/tenant/students.ts`, `contacts.ts`, `teachers.ts`, `examinations.ts`, `hasanat.ts`; Contacts Clean Architecture refactor (`contacts/use-cases/` + `contacts/repository/` + `contactUseCases`).

## New route checklist

```
- [ ] FastifyPluginAsync in routes/
- [ ] preHandler: `authenticateTenant` or `authenticatePlatform` (not raw jwtVerify)
- [ ] Zod via parseRequest + replyValidationError on writes
- [ ] rbacService / canWrite on mutations
- [ ] Errors: { type, message } + correct status
- [ ] Registered prefix; inject() with tenant host + cookie
- [ ] Tenant writes: withTenantTransaction + SET LOCAL (+ app.current_user_id for audit) utilizing Node 24 explicit resource management (`await using` db handles for auto-cleanup)
- [ ] Prefer SET LOCAL statement_timeout / idle_in_transaction_session_timeout on tenant write txs — mms-data-layer
- [ ] Parameterized sql only — ban user/tenant input → sql.raw
- [ ] Large/hot list APIs: prefer keyset/cursor; OFFSET OK for small Work pages — mms-data-layer
- [ ] Zero queries inside loops (N+1); batch via Drizzle relational `with`, `inArray` ($\le 500$), SQL joins, or `/resolve` — `mms-performance.mdc`
- [ ] Zero wildcard projections (`SELECT *` or bare select); use explicit column projection objects matching Response DTOs — `mms-performance.mdc`
- [ ] Mandatory pagination with hard caps: default 25, max 100 via `baseListQuerySchema` — `mms-performance.mdc`
- [ ] Large file uploads stream via `@fastify/multipart` (no memory buffering); exports stream via `node:stream` / async generators; datasets $> 500$ rows offloaded to background jobs — `mms-performance.mdc`
- [ ] Redis caching: tenant-scoped key `mms:{tenantId}:{module}:{resource}:{hash}`; mutations trigger cache eviction + `/api/ws` invalidation — `mms-performance.mdc`
- [ ] HTTP caching headers: emit `ETag` and `Cache-Control: private, no-cache` on idempotent GET responses (`304 Not Modified` on match) — `mms-performance.mdc`
- [ ] Contested PUT: updated_at/version → 409 conflict, or document LWW — mms-api-interface §6
- [ ] bodyLimit / requestTimeout from serverConfig (or explicit raise for sync/upload)
- [ ] Outbound provider fetch uses native `fetch()` + `AbortSignal.timeout` (no `axios`/`node-fetch`/`ws` for client comms)
- [ ] Use `node:crypto` `crypto.hash()` instead of `createHash().update().digest()` chains
- [ ] Use `URLPattern` for matching instead of `path-to-regexp`
- [ ] Replace legacy `url.parse()` with WHATWG `new URL()`
- [ ] Core module imports prefixed with `node:` (`node:fs/promises`, `node:crypto`, `node:path`, `node:async_hooks`)
- [ ] Request / tenant tracking via `AsyncLocalStorage` (`AsyncContextFrame`)
- [ ] Soft-delete endpoints use registerResourceRoutes (deleteFn/restoreFn) + registerSoftDeletableBulkTrashRoutes
- [ ] Atomic conditional latch on soft-delete (`WHERE deleted_at IS NULL RETURNING id`)
- [ ] Batched single-statement SQL for bulk delete/restore (no per-row loops)
- [ ] Dynamic AST in Drizzle queries matching Category B/C partial indexes (no parameterized booleans)
- [ ] Relational child queries in `with: { ... }` explicitly declare `where: (c, { isNull }) => isNull(c.deletedAt)`
- [ ] Restore traps PostgreSQL error `23505` mapping to `409 Conflict`
- [ ] Single-record `GET /:id` returns 404 for archived records unless `?includeDeleted=true` with `canDelete`
- [ ] Session invalidation on user/teacher soft delete + `deleted_at IS NULL` verification in auth resolvers
- [ ] CDC outbox events emitted with monotonic versioning (`entity.soft_deleted` / `entity.restored`)
```

## Auth / workspace routes

| Area | Notes |
|------|--------|
| `routes/auth.ts` | Public login/onboard/2fa rate-limited; `/me` = `authenticateTenant`; `/refresh` via artifacts |
| `routes/workspace.ts` | **No** `authenticateTenant` — registry apex-only; public branding/current/subdomain |

## Contacts + WhatsApp

E.164 + title-case via repository (FORCE RLS). Runtime dial/label defaults from prefs + collections. `handleContactSaveOrUpdate` enqueues WA. List/filter SSOT: `@mms/shared` `contactsListQuerySchema`. WA: `whatsAppService` → queue → `PuppeteerWhatsAppProvider` (dev only).

## Verify

```bash
cd apps/backend && pnpm typecheck && pnpm test && pnpm lint
# probes: mms-ops-infrastructure — GET /health , GET /ready
```

```ts
await app.inject({
  method: 'GET',
  url: '/api/students',
  headers: { host: 'demo.localhost', cookie: 'mms_access=…' },
});
```

## Related skills

`mms-backend-security`, `mms-schema-migrate`, `mms-shared-package`, `mms-data-sync`, `mms-messaging`, `mms-query-factories`

## Done

`mms-completion-review.mdc` — typecheck + backend lint/tests; authz changes need allow+deny `inject()`.

---
name: mms-backend-api
description: Adds or modifies Fastify routes, middleware (authenticateTenant), services, Zod validation, auth artifacts, and WhatsApp integration in the MMS backend. Use when creating API endpoints, db sync, students/contacts REST, error handling, or backend services. Do NOT use for database DDL/migrations (use mms-schema-migrate), session/CSRF security hardening (use mms-backend-security), or background worker queuing (use mms-background-jobs).
license: Proprietary
metadata:
  owner: mms-platform
  last-verified: 2026-09-15
---

# MMS Backend API Workflow

**Rules (norms SSOT):** `mms-api-interface.md` · `mms-data-layer.md` §5–§6 · `mms-performance.md` · `mms-auth-security.md` §5 · `mms-testing-observability.md` · `mms-form-architecture.md`. Modern Audit Trail Workflow → **`mms-audit-trail`**. Soft-Delete Workflow → **`mms-soft-delete`**.

The 40-item new-route checklist: **`references/new-route-checklist.md`**. Use it when adding a route or resource; it walks layering, validation, RBAC, soft-delete, audit, errors, and tests.

Step-by-step walkthrough for adding a REST resource: **`references/add-rest-resource.md`**.

## When to use

- New/changed route in `apps/backend/src/routes/`
- Service / Zod validation / WhatsApp-email backend
- Backend tests with Node 24 `node:test` and Fastify `inject()`

DDL / `schema.ts` / journal → skill **`mms-schema-migrate`**. CSRF / Origin / cookies / rate limits → **`mms-backend-security`**. Soft-delete architecture & checklist → **`mms-soft-delete`**. Health/ready probes → `mms-ops-infrastructure.md`.

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
- **Reference Implementation**: `.agent/skills/mms-backend-api/examples/clean-architecture-route.ts`.

Never query `pg` from handlers. Prefer repositories / `withTenant`. Use **`dbSyncService`** only for legacy JSON documents (`/api/db/...`).
- **Explicit Column Projections (`check:db-projections`)**: Bare `.select().from(table)` and `SELECT *` are strictly banned (`mms-performance.md`). Every query must supply an explicit typed column projection (`db.select({ id: table.id, name: table.name }).from(table)`).
- **Explicit Resource Management**: Leverage Node 24 `await using` on pooled client checkouts or stream handles to guarantee deterministic disposal without manual `finally` blocks.

## Document store vs REST

| Situation | Approach |
|-----------|----------|
| Legacy `useLiveCollection` | Keep `/api/db/collections/:name` until migrated |
| Side effects (WA, email) | Dedicated route + service |
| **New domain module** | REST plugin + Zod + Query on FE |

Shipped REST: students, contacts, teachers, finance, enrollments, obligations, accounting, hasanat, examinations, question-bank, users, attendance, sessions, messaging (`routes/tenant/`). After REST migration, remove entity from `ALLOWED_COLLECTIONS` / FE `BUSINESS_COLLECTIONS`.

## Soft Delete on REST Resources (`mms-soft-delete`)

All soft-delete route logic flows through shared route factories (`crudResourceRoutes.ts`, `crudBulkRouteFactories.ts`, `crudBulkRouteHelpers.ts`). Never hand-roll ad-hoc delete/restore endpoints (complete workflow & checklist → **`mms-soft-delete`**):

- **Factory Route Registration**: Use `registerResourceRoutes` (`deleteFn`, `restoreFn`) and `registerSoftDeletableBulkTrashRoutes` (`bulkDeleteFn`, `bulkRestoreFn`). Gated on `canDeleteCollection(user, collection)`.
- **Trash-Aware List Loading**: Use `handleBulkListGet` with `supportsIncludeDeleted: true` (parses `isQueryFlagTrue(request.query.includeDeleted)` and enforces `canDeleteCollection`).
- **Single-Record Reads (`GET /:id`)**: Append `isNull(table.deletedAt)` and return `404 Not Found` for archived records unless caller has delete permissions and specifies `?includeDeleted=true`.
- **Atomic Latch & Batched SQL**: Use atomic conditional updates (`isNull(table.deletedAt)`) and batched SQL (`inArray(table.id, ids)`) for bulk operations.
- **Relational Child Filtering**: Nested Drizzle relations do not auto-filter soft-deleted children; declare explicit `where: (c, { isNull }) => isNull(c.deletedAt)`.
- **Session & Conflict Guards**: Revoke active Redis sessions on user soft-delete; catch PostgreSQL `23505` on unique field restore and map to `409 Conflict`.
- **Outbox CDC**: Emit monotonic `entity.soft_deleted` and `entity.restored` events for search index sync.

## Bulk PUT

Upsert only (`bulkSave` + `conflictTarget`). **Never** wire `replaceForWorkspace` as route `saveFn` for normal client saves.

## Transactional Outbox Audit Capture (`mms-audit-trail`)

When mutating audited entities (Contacts, Students, Teachers, Invoices, Accounting, Sessions), capture audit events inside the primary `withTenant` transaction using the outbox pattern. Populate the 5 dimensions (Who, What as RFC 8785 canonical JSON, When, Why, Integrity) and strip secrets/tokens prior to persistence. Full specs → **`mms-audit-trail`**.

## Deliverable Format for Entity & Feature Generation
When generating backend code for any feature or entity, provide:
1. **Drizzle Table & Relations Definition** (`apps/backend/src/db/schema/[entity].ts`) with full constraints and indexes.
2. **Shared Zod Validation Schemas & DTO Types** (`packages/shared/src/schemas/[entity].ts`).
3. **Database Migration Script / SQL DDL** representing the changes.

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
pnpm run check:db-projections                         # Ratchet: zero bare .select() projections
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

`mms-completion-review.md` — typecheck + backend lint/tests; authz changes need allow+deny `inject()`.

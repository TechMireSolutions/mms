---
name: mms-backend-api
description: Adds or modifies Fastify routes, middleware (authenticateTenant), services, Zod validation, auth artifacts, and WhatsApp integration in the MMS backend. Use when creating API endpoints, db sync, students/contacts REST, error handling, or backend services. For Drizzle DDL/migrations use mms-schema-migrate first.
---

# MMS Backend API Workflow

**Rules (norms SSOT):** `mms-api-interface.mdc` · `mms-data-layer.mdc` · `mms-auth-security.mdc` · `mms-testing-observability.mdc` · `mms-form-architecture.mdc`

## When to use

- New/changed route in `apps/backend/src/routes/`
- Service / Zod validation / WhatsApp-email backend
- Backend tests with Fastify `inject()`

DDL / `schema.ts` / journal → skill **`mms-schema-migrate`**. CSRF / Origin / cookies / rate limits → **`mms-backend-security`**. Health/ready probes → `mms-ops-infrastructure.mdc`.

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

When the entity supports archives (Contacts / Students / Teachers pattern + Sessions, Attendance, Enrollments, Finance, Accounting, Obligations, Hasanat, Examinations):

- Prefer `registerStandardTenantRoutes` with `deleteFn` + `restoreFn` (`POST :id/restore`)
- List: `includeDeleted`; **SQL-filter** typed `deleted_at` — do not load full tenant then filter only in memory
- Default exclude deleted; trash = deleted-only; FE Work trash required for parity (`mms-module-work`)
- Document variants in `{Module}ModuleManifest.softDelete`
- Write schemas strip soft-delete fields; merge (Contacts) = atomic tenant transaction

## Bulk PUT

Upsert only (`bulkSave` + `conflictTarget`). **Never** wire `replaceForWorkspace` as route `saveFn` for normal client saves.

## Deliverable Format for Entity & Feature Generation
When generating backend code for any feature or entity, provide:
1. **Drizzle Table & Relations Definition** (`apps/backend/src/db/schema/[entity].ts`) with full constraints and indexes.
2. **Shared Zod Validation Schemas & DTO Types** (`packages/shared/src/schemas/[entity].ts`).
3. **Database Migration Script / SQL DDL** representing the changes.

## Add a REST resource

1. **Zod Schemas**: Write schemas in `@mms/shared` (`.strict()` on write bodies) + explicit Insert/Update/Response DTO types aligning 1:1 with Drizzle tables.
2. **Domain & DB Layer**:
   - Drizzle schema with typed columns (3NF/BCNF, zero semi-structured storage, multi-tenancy `tenantId` FK, bidirectional relations).
   - Domain use-cases in `{module}/use-cases/**` (orchestration, repo DI) + `{module}/repository/` interface + Drizzle adapter + composition root (`{module}UseCases`) — `mms-api-interface.mdc` §2.
3. **Service & Transaction RLS**: Execute tenant writes inside `withTenantTransaction` applying `SET LOCAL app.current_tenant = ?`. Always validate payloads via `@mms/shared` Zod schemas before persistence.
4. **Fastify Route**: `routes/tenant/{resource}.ts` — `authenticateTenant` + `registerStandardTenantRoutes` (+ bulk when needed) + `canWriteCollection` (or `authenticatePlatform` + `platformUserCan` for platform routes); call the composition root.
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
- [ ] Tenant writes: withTenantTransaction + SET LOCAL (+ app.current_user_id for audit)
- [ ] Prefer SET LOCAL statement_timeout / idle_in_transaction_session_timeout on tenant write txs — mms-data-layer
- [ ] Parameterized sql only — ban user/tenant input → sql.raw
- [ ] Large/hot list APIs: prefer keyset/cursor; OFFSET OK for small Work pages — mms-data-layer
- [ ] Contested PUT: updated_at/version → 409 conflict, or document LWW — mms-api-interface §6
- [ ] bodyLimit / requestTimeout from serverConfig (or explicit raise for sync/upload)
- [ ] Retryable POSTs: idempotency key bound to body digest (409 on mismatch) — mms-api-interface §6
- [ ] Outbound provider fetch uses AbortSignal.timeout
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

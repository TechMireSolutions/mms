---
name: mms-backend-api
description: Adds or modifies Fastify routes, middleware (authenticateTenant), services, Zod validation, auth artifacts, and WhatsApp integration in the MMS backend. Use when creating API endpoints, db sync, students/contacts REST, error handling, or backend services. For Drizzle DDL/migrations use mms-schema-migrate first.
---

# MMS Backend API Workflow

**Rules (norms SSOT):** `mms-api-interface.md` · `mms-data-layer.md` · `mms-auth-security.md` · `mms-testing-observability.md` · `mms-form-architecture.md`

## When to use

- New/changed route in `apps/backend/src/routes/`
- Service / Zod validation / WhatsApp-email backend
- Backend tests with Fastify `inject()`

DDL / `schema.ts` / journal → skill **`mms-schema-migrate`**. CSRF / Origin / cookies / rate limits → **`mms-backend-security`**. Health/ready probes → `mms-ops-infrastructure.md`.

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

## Add a REST resource

1. Zod schemas — `validation/` or `@mms/shared` (`.strict()` on write bodies)
2. Domain layer — `{module}/use-cases/**` (orchestration, repo DI) + `{module}/repository/` interface + Drizzle adapter + composition root (`{module}UseCases`) — `mms-api-interface.md` §2
3. `routes/tenant/{resource}.ts` — `authenticateTenant` + `registerStandardTenantRoutes` (+ bulk when needed) + `canWriteCollection`; call the composition root
4. Register under `/api/{resource}` in `routes/index.ts`
5. `inject()` tests with `host: 'tenant.localhost'`
6. FE Query hooks — **`mms-query-factories`** / **`mms-frontend`**

Refs: `routes/tenant/students.ts`, `contacts.ts`, `teachers.ts`, `examinations.ts`, `hasanat.ts`; Contacts Clean Architecture refactor (`contacts/use-cases/` + `contacts/repository/` + `contactUseCases`).

## New route checklist

```
- [ ] FastifyPluginAsync in routes/
- [ ] preHandler: authenticateTenant (not raw jwtVerify)
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

## Custom-field / Dynamic Form System (DFS) writes

Custom tabs and fields are managed via the Fastify 5 `dynamicFormPlugin` (`DFS.md` §4). Endpoints under `/api/v2`:

- `GET  /modules/:module/tabs` — list tabs + fields (any authenticated tenant user)
- `POST /modules/:module/tabs` — create tab (`can(module, 'editSetup')`)
- `POST /modules/:module/tabs/:tabId/fields` — create field (`can(module, 'editSetup')`; write DTO `customFieldConfigSchema.omit({id,tabId})` `.strict()`)
- `PATCH /modules/:module/tabs/:tabId/fields/:fieldId` — update field (`can(module, 'editSetup')`; `updateFieldBodySchema` `.strict()`; type-lock when `hasData: true` → 422; uniqueness enforcer when `unique false→true` → 409)
- `PUT   /modules/:module/tabs/:tabId/fields/reorder` — transactional batch (`reorderFieldsBodySchema`; single `db.transaction`)
- `POST /modules/:module/fields/check-unique` — probe (NOT audited; `fieldKey` validated against `custom_fields` registry before `@>` containment query — SQL-injection guard)

Key invariants (`DFS.md` §1):
- **Tenant isolation**: `workspaceSubdomain: text` + composite PK + `FORCE RLS` on `custom_fields`/`custom_tabs`; app-generated `text` IDs (`cf_<ts>_<rand>`, `custom_<ts>_<rand>`) via `crypto.randomUUID()` — never DB `uuid` PKs.
- **RBAC**: `authenticateTenant` + `can(module, 'editSetup')` on all writes; reads open to authenticated tenant users.
- **Validation**: Zod `.strict()` write DTOs on every mutating route (no `request.body as any`). PATCH must validate via `updateFieldBodySchema`.
- **Audit**: `auditPreHandler`/`auditOnSend` (`onSend` returns `payload` — Fastify v5 contract); re-fetch new state from DB (not response body); skip `/check-unique` probes + error responses (`statusCode >= 400`). Writes to existing `audit_logs` table (`tableName`/`recordId`/`oldValues`/`newValues`/`userId`).
- **Uniqueness**: `checkValueUniqueness(workspaceSubdomain, moduleName, fieldKey, value)` uses parameterized `sql` + GIN `@>` containment; `fieldKey` MUST be registry-validated first; module-aware typed table map (no `any`).
- **Server-side entity validation**: entity save routes (students/contacts/teachers) MUST re-validate `customData` via `buildDynamicValidationSchema` + `safeParse` and enforce `unique` fields via `checkValueUniqueness` before persisting — never trust the client (`DFS.md` §4.5).
- **Idempotency/concurrency**: retryable POSTs may use `Idempotency-Key` bound to body digest (409 on mismatch); contested PATCH may use `If-Match: <updatedAt>` → 409 `stale_version` (`DFS.md` §4.7/§4.8).
- **Body limits / rate limits**: set `bodyLimit` on plugin registration; `@fastify/rate-limit` on `/check-unique` (high-frequency probe) and write routes.

Ref: `apps/backend/src/plugins/dynamicFormPlugin.ts`, `services/dynamic-form/fieldService.ts`, `hooks/auditHooks.ts`.

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

`mms-completion-review.md` — typecheck + backend lint/tests; authz changes need allow+deny `inject()`.

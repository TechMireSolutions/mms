---
name: mms-backend-api
description: Adds or modifies Fastify routes, middleware (authenticateTenant), services, Zod validation, auth artifacts, and WhatsApp integration in the MMS backend. Use when creating API endpoints, db sync, students/contacts REST, error handling, drizzle migrations, or backend services.
---

# MMS Backend API Workflow

## When to use this skill

- New or changed route in `apps/backend/src/routes/`
- New service in `apps/backend/src/services/`
- Zod schemas in `apps/backend/src/validation/`
- Drizzle schema / migration / seed changes
- WhatsApp or email integration backend work
- Backend tests with Fastify `inject()`

## Architecture

```
app.ts
  plugins/     → security, http, requestHooks
  routes/      → thin Fastify plugins
  middleware/  → authenticateTenant | authenticatePlatform
  services/    → business logic by domain (auth/, platform/, email/, whatsapp/, …)
  db/          → database.ts + dbSyncService for JSON documents
```

**Never** query `pg` from route handlers. Prefer repositories / `withTenantTransaction` for typed REST tables. Use **`dbSyncService`** only for legacy JSON document collections/objects (`/api/db/...`).

## Decision: document store vs REST

| Situation | Approach |
|-----------|----------|
| Existing module using `useLiveCollection` | Keep `/api/db/collections/:name` until migrated |
| Side effects (contacts WhatsApp, email) | Dedicated route + service |
| **New domain module** | REST plugin + Zod + Query on FE |

**Shipped REST:** students, contacts, teachers, finance, enrollments, obligations, accounting, hasanat, examinations, question-bank, users, attendance, sessions, messaging (see `routes/tenant/`).

Contacts (and other typed person entities) persist via **repositories + FORCE RLS tables** — not `persistCollection('contacts')`. After REST migration, remove the entity key from `ALLOWED_COLLECTIONS` and FE `BUSINESS_COLLECTIONS`.

## Soft delete on REST resources

## Soft delete on REST resources

When the entity supports archives (Contacts / Students / Teachers pattern — also Sessions, Attendance, Enrollments, Finance, Accounting, Obligations, Hasanat, Examinations):

- Prefer `registerStandardTenantRoutes` with `deleteFn` + `restoreFn` (`POST :id/restore`)
- List queries accept `includeDeleted`; **SQL-filter** typed `deleted_at` (`active` vs `deleted`) — do not load full tenant then filter only in memory for Work/trash
- Default responses exclude soft-deleted rows; trash mode returns deleted-only
- FE Work trash UI is required for full parity (skill `mms-module-work`) — do not leave restore API orphaned without UI when shipping soft-delete
- Document intentional variants in `{Module}ModuleManifest.softDelete` (Messaging log clear; QB papers/results upsert-only)
- Create/update bodies use write schemas that strip soft-delete fields; only soft-delete helpers set them
- Entity merge (Contacts): atomic `POST /api/contacts/merge` inside a tenant transaction — not FE dual-write

## Bulk PUT semantics

API bulk write paths must **upsert** (`bulkSave` + `conflictTarget`, or merge-by-id service helpers). **Never** wire `replaceForWorkspace` as the route `saveFn` for normal client saves — that wipes rows absent from the payload (`mms-api-interface.mdc`, `mms-module-architecture.mdc` §7). Keep replace helpers for migrations / intentional clears only.
## Add a REST resource (preferred for new work)

1. **`validation/{resource}Schemas.ts`** — Zod list + record schemas; export inferred types (or shared manifest schemas in `@mms/shared`)
2. **`routes/tenant/{resource}.ts`**
   ```ts
   fastify.addHook('preHandler', authenticateTenant);
   // Prefer registerStandardTenantRoutes (+ registerBulkPutRoute when needed)
   // canWriteCollection(user, '{resource}') on mutations
   ```
3. Register in `routes/index.ts` under `/api/{resource}`
4. **Tests** — `app.inject()` with `host: 'tenant.localhost'` header
5. **Frontend** — Query hooks + `useModulePermissions(manifest)` (`mms-frontend`, `mms-data-layer.mdc`)

Reference implementations:

- `apps/backend/src/routes/tenant/students.ts` — CRUD + soft-delete/restore
- `apps/backend/src/routes/tenant/contacts.ts` — CRUD + soft-delete + E.164 + WhatsApp side effects
- `apps/backend/src/routes/tenant/teachers.ts` — CRUD + soft-delete/restore
- `apps/backend/src/routes/tenant/examinations.ts` / `hasanat.ts` — upsert bulk + soft-delete
- Avoid as a soft-delete/upsert reference: none for primary Work entities — Question Bank questions now follow examinations upsert + soft-delete; keep migration-only `replace*` helpers.
## Add a document-store write (legacy path)

Usually **no new route** — frontend calls `POST /api/db/collections/:name`.

If server-side normalization required: dedicated route (contacts migrated to full REST).

Ensure route uses `authenticateTenant` + `canWriteCollection` / `canWriteObject`.

## New route plugin checklist

- [ ] `FastifyPluginAsync` in `routes/`
- [ ] `preHandler: authenticateTenant` for tenant protected routes (not raw `jwtVerify`)
- [ ] Zod validation via `parseRequest` + `replyValidationError` (`lib/zodRequest.ts`) on all write endpoints
- [ ] RBAC on writes — `rbacService` or inline admin check
- [ ] Collection access via `dbSyncService` when persisting JSON documents
- [ ] Errors: `{ type, message }` + correct HTTP status
- [ ] Register prefix in `app.ts`
- [ ] Test with `inject()` — include tenant host header

## Auth routes (exception)

`apps/backend/src/routes/auth.ts` — mixed public/protected:

| Route | Middleware |
|-------|------------|
| login, onboard, handoff, 2fa/* | Rate-limited public (10/min) |
| `/me` | `authenticateTenant` |
| `/refresh` | Cookie validation via `authArtifactService` |

Do not use `authenticateTenant` on apex-only public routes.

## Workspace routes (public)

`apps/backend/src/routes/workspace.ts` — **no** `authenticateTenant`:

- `GET /registry` — apex only (404 on tenant host)
- `GET /public-branding`, `/current`, `/by-subdomain/:subdomain`, `/subdomain-available/:subdomain`

## Drizzle migration

1. Edit `apps/backend/src/db/schema.ts`
2. Add `migrations_drizzle/000N_name.sql`
3. **Add entry to `migrations_drizzle/meta/_journal.json`** — required or migration won't run
4. Restart backend — `initDb()` applies automatically

## Contacts + WhatsApp

`/api/contacts` full REST. On create/update:

- E.164 normalize, title-case, persist via contacts **repository** (typed `contacts` table + FORCE RLS)
- Runtime dial/label defaults from `loadContactRuntimeDefaults` (prefs `defaultCountry` + collections `countryCodes` / `phoneLabels` / `emailLabels`)
- `handleContactSaveOrUpdate` enqueues WhatsApp check
- Bulk delete/restore bodies use shared `bulkIdsBodySchema` (`.max(500)`)
- List/filter query SSOT: `@mms/shared` `contactsListQuerySchema` / `paginateContacts` (includes `hasEmail` / `hasPhone` / `hasReachable` for Messaging “select all with email” etc.) — do not fork flags per route

`whatsAppService` → `whatsAppQueue` → `PuppeteerWhatsAppProvider` (dev only; no CI).

## Security (mandatory)

- `JWT_SECRET` required
- `authenticateTenant` on tenant protected routes
- `rbacService` on writes
- Rate limit login/onboard when touching auth
- No secrets in logs
- `unknown` + narrowing — not `any`

## Custom-field / JSONB write architecture

Entity forms are static `FormModal` + shared Zod (no blueprint compilers). Custom `custom_data` / GIN / SET LOCAL / `COALESCE ||` merge rules still follow **`mms-form-architecture.mdc`** and **`mms-data-layer.mdc`**:
- **Fastify Zod Asymmetry:** Builder routes use `zodToJsonSchema` for AJV performance; custom-data entry routes bypass AJV and run Zod validation manually inside the handler.
- **ORM & GIN Indexes:** Custom data uses native `JSONB` columns with PostgreSQL GIN indexing.
- **Poisoning Prevention:** Row-level security config parameters must be set strictly inside transaction scopes (`SET LOCAL`).
- **Data Destruction Prevention:** Payload updates use PostgreSQL `||` with `COALESCE` to prevent overwriting/deleting fields the user is unauthorized to write.

## Verify

```bash
cd apps/backend && pnpm typecheck && pnpm test && pnpm lint
curl http://localhost:3000/health
curl http://localhost:3000/ready
```

Integration test host header example:

```ts
await app.inject({
  method: 'GET',
  url: '/api/students',
  headers: { host: 'demo.localhost', cookie: 'mms_access=…' },
});
```

Tenant writes must use `withTenantTransaction` / SET LOCAL RLS (`mms-data-layer.mdc`), including `app.current_user_id` for audit triggers. New tables: composite tenant PK + FORCE RLS. Bulk PUT upsert only — never `replaceForWorkspace` wipe. OAuth/API secrets: FORCE-RLS credential tables — not `objects` KV. Messaging REST: `routes/tenant/messaging.ts`.

## Rules

`mms-api-interface.mdc`, `mms-data-layer.mdc`, `mms-auth-security.mdc`, `mms-testing-observability.mdc`, `mms-form-architecture.mdc`

## Related skills

- `mms-backend-security` — tenant isolation, RBAC, cookies, rate limits
- `mms-data-sync` — `/api/db` contract (legacy)
- `mms-shared-package` — Zod DTOs
- `mms-messaging` — messaging routes / soft-archive clear

## Done

`mms-completion-review.mdc` — typecheck + backend lint/tests; authz changes need allow+deny `inject()`.

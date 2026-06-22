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

**Never** query `pg` from route handlers. REST routes use **`dbSyncService`**, not direct `database.ts` imports.

## Decision: document store vs REST

| Situation | Approach |
|-----------|----------|
| Existing module using `useLiveCollection` | Keep `/api/db/collections/:name` until migrated |
| Side effects (contacts WhatsApp, email) | Dedicated route + service |
| **New domain module** | REST plugin + Zod + Query on FE |

**Shipped REST pilots:** `students.ts`, `contacts.ts`

## Add a REST resource (preferred for new work)

1. **`validation/{resource}Schemas.ts`** — Zod list + record schemas; export inferred types
2. **`routes/{resource}.ts`**
   ```ts
   fastify.addHook('preHandler', authenticateTenant);
   // GET list, GET /count, GET :id (optional), POST, PUT :id, DELETE :id
   // canWriteCollection(user, '{resource}') on mutations
   // fetchCollection / persistCollection from dbSyncService
   ```
3. Register in `app.ts`: `app.register(xRoutes, { prefix: '/api/{resource}' })`
4. **Tests** — `app.inject()` with `host: 'tenant.localhost'` header
5. **Frontend** — `useQuery` / `useMutation` + invalidation (`mms-query.mdc`)

Reference implementations:

- `apps/backend/src/routes/students.ts` — minimal CRUD
- `apps/backend/src/routes/contacts.ts` — CRUD + E.164 + WhatsApp side effects

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

- E.164 normalize, title-case, persist via `dbSyncService`
- `handleContactSaveOrUpdate` enqueues WhatsApp check
- `GET /:id/whatsapp-status` for UI indicator

`whatsAppService` → `whatsAppQueue` → `PuppeteerWhatsAppProvider` (dev only; no CI).

## Security (mandatory)

- `JWT_SECRET` required
- `authenticateTenant` on tenant protected routes
- `rbacService` on writes
- Rate limit login/onboard when touching auth
- No secrets in logs
- `unknown` + narrowing — not `any`

Details: `mms-security.mdc`, `mms-rbac.mdc`

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

## Rules

`.cursor/rules/mms-backend.mdc`, `mms-database.mdc`, `mms-security.mdc`, `mms-rbac.mdc`, `mms-testing.mdc`

## Related skills

- `mms-auth-users` — sessions, cookies, 2FA, refresh
- `mms-backend-security` — threat model, tenant isolation audit
- `mms-data-sync` — `/api/db` contract
- `mms-shared-package` — types used in validation

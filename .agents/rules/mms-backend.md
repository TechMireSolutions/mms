---
trigger: model_decision
---

# MMS Backend API

## Stack

Fastify 5 · `@fastify/jwt` · `@fastify/cookie` · `@fastify/cors` · `@fastify/rate-limit` · Drizzle ORM + `pg` · Vitest · Zod (REST routes) · TypeScript ESM · `@mms/shared`.

## Layout

```
apps/backend/src/
  app.ts                      # bootstrap, global hooks, route registration
  index.ts                    # listen on :3000
  middleware/authenticate.ts  # authenticateTenant
  routes/*.ts                 # Fastify plugins (one domain per file)
  validation/*Schemas.ts      # Zod for REST resources
  services/*.ts               # business logic — routes delegate here
  db/
    schema.ts                 # Drizzle tables
    database.ts               # collection/object CRUD, initDb, tenant key resolution
    dbClient.ts               # Drizzle singleton (authArtifactService)
    minimalSeeds.ts           # onboard + tenant reset defaults
    migrations_drizzle/       # DDL + meta/_journal.json
    migrations/00N_*.ts       # idempotent data transforms
  utils/tenantContext.ts      # AsyncLocalStorage tenant scope
```

## Environment

| Variable | Required | Purpose |
|----------|----------|---------|
| `JWT_SECRET` | **Yes** | Hard fail at startup if missing |
| `DATABASE_URL` | Yes (prod) | PostgreSQL connection string |
| `ALLOWED_ORIGIN` | Prod | CORS origin when `NODE_ENV=production` |
| `MMS_APP_DOMAIN` | No | Apex domain for subdomain parse (default `localhost`) |
| `LOG_LEVEL` | No | Fastify logger level (default `info`) |
| `NODE_ENV` | No | `production` tightens CORS |
| `SEED_DEV_PASSWORD` | Dev only | Hashed users in legacy full-seed path |

## App bootstrap (`apps/backend/src/app.ts`)

1. `initDb()` — Drizzle DDL migrate, data migrations `001–003`, purge expired `auth_artifacts`
2. Register `@fastify/rate-limit` (`global: false` — per-route scopes)
3. Register `@fastify/cookie` before JWT
4. Global `onRequest`: resolve tenant → `tenantStorage.run()` → `attachAccessTokenFromCookie()` (cookie → `Authorization` header)
5. CORS `credentials: true`; production origin from `ALLOWED_ORIGIN`
6. Register route plugins (table below)

## Route map

| Prefix | Auth middleware | RBAC / notes |
|--------|-----------------|--------------|
| `/api/auth` | Mixed | Login/onboard **rate-limited** (10/min); `/me` → `authenticateTenant`; refresh/handoff/2FA public |
| `/api/workspace` | **Public** | Apex registry + branding lookups — no `authenticateTenant` (`mms-tenant.md`) |
| `/api/db` | `authenticateTenant` | Writes → `rbacService`; **GET + POST `/sync` admin-only** |
| `/api/contacts` | `authenticateTenant` | REST CRUD + WhatsApp — Zod + `canWriteCollection(user, 'contacts')` on mutations |
| `/api/email` | `authenticateTenant` | Admin-only (`requireAdmin`) integration routes |
| `/api/students` | `authenticateTenant` | REST CRUD pilot — Zod in `validation/studentSchemas.ts` |
| `/health` | Public | Liveness |
| `/ready` | Public | PostgreSQL ping (`pingDatabase`) — `503` when DB down |

### REST resource endpoints (server-first pilots)

| Resource | Methods | Validation | Data access |
|----------|---------|------------|-------------|
| `/api/students` | `GET /`, `GET /count`, `POST /`, `PUT /:id`, `DELETE /:id` | `validation/studentSchemas.ts` | `dbSyncService.fetchCollection` / `persistCollection` |
| `/api/contacts` | `GET /`, `GET /count`, `POST /`, `PUT /:id`, `DELETE /:id`, `GET /:id/whatsapp-status` | `validation/contactSchemas.ts` + JSON Schema on POST body | same + `whatsAppService` side effects |

### Workspace routes (public)

| Route | Host | Purpose |
|-------|------|---------|
| `GET /api/workspace/registry` | Apex only | Public workspace list |
| `GET /api/workspace/public-branding` | Tenant | Branding for login shell |
| `GET /api/workspace/current` | Tenant | Workspace + branding |
| `GET /api/workspace/by-subdomain/:subdomain` | Any | Onboarding / gate lookup |
| `GET /api/workspace/subdomain-available/:subdomain` | Any | Subdomain availability check |

### API evolution

| Stage | Pattern |
|-------|---------|
| Legacy bulk | `GET/POST /api/db/collections/:name`, `objects/:key`, `/sync` |
| **New domains** | Dedicated plugin under `/api/{resource}` + Zod + `authenticateTenant` + `rbacService` |
| Versioning | `/api/v1/` prefix when breaking changes ship (target) |

## Middleware — `authenticateTenant` (required)

**File:** `apps/backend/src/middleware/authenticate.ts`

Use on **every tenant-scoped protected route**. Do **not** call raw `request.jwtVerify()` in route files.

| Check | Failure |
|-------|---------|
| Valid JWT (`mms_access` cookie or `Bearer`) | `401 auth_required` |
| Tenant subdomain on host / `x-forwarded-host` | `403` — endpoint requires tenant |
| `user.workspaceSubdomain === tenant` | `403` — token not valid for workspace |
| `tokenType !== 'refresh'` | `401` |
| `twoFactorVerified !== false` | `403 two_factor_required` |

Apex-only routes (`/api/workspace/registry`, public branding) must **not** use `authenticateTenant`.

## Layering

```
routes/*.ts → services/*.ts → db/database.ts
                           → services/dbSyncService.ts (collection/object from routes)
                           → services/authArtifactService.ts (ephemeral auth state)
```

- Never import `pg` or Drizzle in route handlers
- REST routes read/write collections via **`dbSyncService`** — not direct `database.ts` imports
- Business logic in `services/`; routes validate + authorize + delegate
- Ephemeral auth (handoff, 2FA challenge, refresh hash) → `auth_artifacts` via `authArtifactService.ts` + `db/dbClient.ts`

## Errors (stable JSON)

```json
{ "type": "validation_error", "message": "…" }
```

Types: `auth_required`, `invalid_credentials`, `forbidden`, `two_factor_required`, `not_found`, `validation_error`, `database_error`, `server_error`, `conflict`.

- Validate bodies: Fastify JSON Schema (document routes, optional fast-path) or **Zod** `safeParse` (REST resource routes)
- Prefer `unknown` + narrowing — not `any`
- No stack traces to clients in production

## Add a new REST resource (preferred)

1. `validation/{resource}Schemas.ts` — Zod list + record schemas; export inferred types
2. `routes/{resource}.ts` — `FastifyPluginAsync`, `preHandler: authenticateTenant`, RBAC per mutation
3. Use `fetchCollection` / `persistCollection` from `dbSyncService.ts`
4. `services/{resource}Service.ts` only when logic exceeds collection CRUD or has side effects
5. Register in `app.ts`: `app.register(xRoutes, { prefix: '/api/{resource}' })`
6. Frontend: TanStack Query hooks (`mms-query.md`)
7. Tests: `auth.integration.test.ts` or colocated `*.test.ts` with `app.inject()`

**Pilots:** `routes/students.ts`, `routes/contacts.ts`

## Document store (`/api/db/*`)

Still authoritative for most modules. See `mms-data-layer.md` for sync contract.

| Endpoint | RBAC |
|----------|------|
| `GET /sync` | **Admin only** (`canDownloadBulkSync`) |
| `POST /sync` | Admin only (`canBulkSync`) |
| `POST /collections/:name` | `canWriteCollection` |
| `POST /objects/:key` | `canWriteObject` + audit on `users`, `global_settings`, `branding` |
| `POST /reset` | Admin — **tenant-scoped** reset to minimal seeds (not full DB drop) |

Server-only object keys (`email_integration_secrets`) → `404` on read, `403` on write (`@mms/shared`).

Branding writes call `syncWorkspaceFromBranding` after persist.

## Contacts + WhatsApp

Full REST at `/api/contacts` (see table above). On create/update:

- E.164 via `@mms/shared` `normalizeToE164` / `parsePhoneNumber`
- `applyTitleCaseToContact` before persist
- `handleContactSaveOrUpdate` enqueues WhatsApp verification

`GET /api/contacts/:id/whatsapp-status`: status + `uiIndicatorStyle` from tenant prefs.

Pipeline: `whatsAppService` → `whatsAppQueue` → `PuppeteerWhatsAppProvider`. Mock provider behind env flag for dev. **No Puppeteer in CI tests.**

## Security & observability

Full checklist → **`mms-security.md`**, logging → **`mms-observability.md`**, RBAC → **`mms-rbac.md`**.

- [ ] `JWT_SECRET` set at startup (hard fail if missing)
- [ ] `authenticateTenant` on new protected tenant routes
- [ ] `rbacService` on every write/destructive route
- [ ] Rate limit `POST /api/auth/login` and `/onboard` when touching auth
- [ ] No passwords/tokens/OTP in logs
- [ ] DTO validation on all write endpoints
- [ ] Drizzle journal updated when adding `migrations_drizzle/*.sql`

## Testing

```bash
cd apps/backend && pnpm typecheck && pnpm test && pnpm lint
```

| File | Covers |
|------|--------|
| `app.health.test.ts` | `/health`, `/ready` |
| `app.security.test.ts` | RBAC download sync, unauthenticated deny |
| `auth.integration.test.ts` | Login subdomain, refresh rotation, 2FA gate, tenant JWT binding |
| `services/rbacService.test.ts` | Permission matrix |
| `services/twoFactorService.test.ts` | OTP / refresh helpers |

Use Fastify `inject()` with `headers: { host: '{subdomain}.localhost', cookie: 'mms_access=…' }`. Mock `initDb` and `authArtifactService` in integration tests.

## Dev

```bash
cd apps/backend && pnpm dev          # tsx watch
curl http://localhost:3000/health
curl http://localhost:3000/ready
```

Monorepo Docker: build from **repo root** (`apps/backend/Dockerfile`). Requires PostgreSQL at `DATABASE_URL`.

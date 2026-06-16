---
name: mms-backend-security
description: Hardens MMS backend auth, tenant isolation, RBAC, cookies, rate limits, and auth artifacts. Use when reviewing security, fixing auth bypass, adding protected routes, or auditing Fastify middleware and session handling.
---

# MMS Backend Security Workflow

## When to use

- New protected route or auth endpoint
- Security review / PR audit
- Tenant isolation or cross-workspace bugs
- Cookie, refresh, 2FA, or handoff changes

## Mandatory middleware

**All tenant-scoped protected routes** → `authenticateTenant` (`middleware/authenticate.ts`):

1. Valid JWT from `mms_access` cookie or `Authorization: Bearer`
2. Resolved tenant on host / `x-forwarded-host`
3. `user.workspaceSubdomain === tenant`
4. Not a refresh token
5. `twoFactorVerified !== false`

Do **not** use raw `request.jwtVerify()` in route handlers.

## RBAC on writes

| Surface | Check |
|---------|-------|
| `POST /api/db/collections/:name` | `canWriteCollection` |
| `POST /api/db/objects/:key` | `canWriteObject` |
| `GET/POST /api/db/sync` | `canDownloadBulkSync` / `canBulkSync` (admin) |
| `POST /api/db/reset` | Admin + tenant-scoped only |
| REST mutations (students) | `canWriteCollection(user, 'students')` |
| `/api/email/*` | Admin inline check |

**Known gap:** `POST /api/contacts` — no write RBAC yet.

## Ephemeral auth state

Store in PostgreSQL `auth_artifacts` via `authArtifactService` — **never** in-memory `Map`:

| kind | TTL |
|------|-----|
| `handoff` | 2 min |
| `two_factor_challenge` | 10 min |
| `refresh_token` | 7 days (rotate on refresh) |

OTP: `crypto.randomInt()` — never `Math.random()`.

## Rate limiting

`POST /api/auth/login` and `POST /api/auth/onboard` — `@fastify/rate-limit` (10/min). Preserve when editing auth routes.

## Cookies

| Cookie | Purpose |
|--------|---------|
| `mms_access` | JWT, httpOnly, 15 min, `SameSite=Lax` |
| `mms_refresh` | Opaque refresh; hash in `auth_artifacts` |

CORS: `credentials: true`; production requires explicit `ALLOWED_ORIGIN`.

## Tenant isolation checklist

- [ ] Tenant from host header — not from client JSON body
- [ ] Storage keys `t:{subdomain}:{logicalKey}` on server
- [ ] JWT subdomain matches resolved tenant
- [ ] Apex routes do not expose other tenants' data
- [ ] Tests use `host: '{subdomain}.localhost'` in `inject()`

## Secrets & logging

Never log: passwords, JWTs, refresh tokens, OTP codes, `passwordHash`, bulk PII payloads.

## Security test matrix

| Test file | Proves |
|-----------|--------|
| `app.security.test.ts` | Unauthenticated deny, admin-only sync download |
| `auth.integration.test.ts` | Subdomain login, refresh rotation, 2FA gate, tenant JWT binding |
| `rbacService.test.ts` | Permission matrix |

```bash
cd apps/backend && pnpm test
```

## Rules

`mms-security.mdc`, `mms-auth.mdc`, `mms-rbac.mdc`, `mms-backend.mdc`, `mms-tenant.mdc`

## Related skills

`mms-backend-api`, `mms-auth-users`, `mms-code-review`

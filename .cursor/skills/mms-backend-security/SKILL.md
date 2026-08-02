---
name: mms-backend-security
description: Hardens MMS backend auth, tenant isolation, RBAC, cookies, rate limits, and auth artifacts. Use when reviewing security, fixing auth bypass, adding protected routes, auditing Fastify middleware, cookies, CORS, Helmet/headers, or session/OTP flows.
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

**All protected apex `/api/platform/*` routes** → `requireMainDomain` + `authenticatePlatform` (`middleware/authenticatePlatform.ts`):

1. Apex host only (tenant subdomain → `403`)
2. Strip client `Authorization`; attach `mms_platform_access` cookie only
3. JWT `tokenType === 'platform_access'`; reload user from DB
4. Enforce `disabledAt` + `sessionVersion`
5. Capability gates: `requireSuperUser` / `requirePlatformPermission` / `platformUserCan` — not tenant `can()` strings

Do **not** use raw `request.jwtVerify()` in route handlers.

**Public exceptions:** `/api/auth/login|onboard|handoff|2fa/*`, `/api/workspace/*`, `/health`, `/ready`, and unauthenticated platform auth/setup/reset routes under `/api/platform/auth/*`.

**FE note:** `apiClient` never calls `/api/auth/refresh` for `/api/platform/*` (`isTenantSessionRequest` excludes platform paths). Logged-out `GET /api/platform/auth/me` → expected `401`.

## RBAC on writes

| Surface | Check |
|---------|-------|
| `POST /api/db/collections/:name` | `canWriteCollection` |
| `POST /api/db/objects/:key` | `canWriteObject` |
| `POST /api/db/reset` | `canResetTenantData` (admin) |
| `GET /api/db/backup` | Admin + `canBulkSync` — full-fidelity snapshot (REPEATABLE READ) |
| `POST /api/db/sync` | `canBulkSync` + `bodyLimit: MMS_SYNC_MAX_BODY_BYTES`; wipe-restore under `withSyncTimeout` → abort/rollback + `408` / `backup.syncTimeout` |
| REST mutations `/api/students`, `/api/contacts` | `canWriteCollection` |
| REST reads `/api/students`, `/api/contacts` | `canReadCollection` |
| `GET /api/db/collections/*` | `canReadCollection` |
| `GET /api/db/objects/*` | `canReadObject` |
| `/api/email/integration*` | `canWriteObject(user, 'email_integration')` |

Legacy unmapped collections: read allowed for staff write roles until per-module `*.read` is added.

## Ephemeral auth state

Store in PostgreSQL `auth_artifacts` via `authArtifactService` — **never** in-memory `Map`:

| kind | TTL |
|------|-----|
| `handoff` | 2 min |
| `two_factor_challenge` | 10 min |
| `refresh_token` | 7 days (rotate on refresh) |
| `platform_password_reset` | Platform TTLs via shared constants — do not reintroduce unused `platform_setup` artifact kind |

OTP: `crypto.randomInt()` — never `Math.random()`.

## Rate limiting

`POST /api/auth/login` and `POST /api/auth/onboard` — `@fastify/rate-limit` (10/min). Preserve when editing auth routes. Platform login/setup/reset routes keep their rate limits too.

## Cookies

| Cookie | Purpose |
|--------|---------|
| `mms_access` | Tenant JWT, httpOnly, 15 min, `SameSite=Lax` |
| `mms_refresh` | Tenant opaque refresh; hash in `auth_artifacts` |
| `mms_platform_access` | Platform JWT (`tokenType: 'platform_access'`), httpOnly **session** cookie (no `maxAge`), ~8h JWT TTL; **no** platform refresh cookie |

Mutual exclusion: issuing/clearing a platform session also clears tenant auth cookies (and logout clears both).

CORS: `credentials: true`; production requires explicit `ALLOWED_ORIGIN`.

## Tenant isolation checklist

- [ ] Tenant from host header — not from client JSON body on protected routes
- [ ] Storage keys `t:{subdomain}:{logicalKey}` on server (`database.ts` + `tenantContext.ts`)
- [ ] JWT subdomain matches resolved tenant
- [ ] Apex routes do not expose other tenants' data
- [ ] Tests use `host: '{subdomain}.localhost'` in `inject()`
- [ ] Typed REST routes use repositories + `withTenantTransaction` / SET LOCAL RLS (not `dbSyncService`); `dbSyncService` only for `/api/db` JSON documents

## Secrets & logging

Never log: passwords, JWTs, refresh tokens, OTP codes, `passwordHash`, OAuth client secrets / access tokens, bulk PII payloads.

Long-lived secrets (Google Contacts OAuth, etc.) live in tenant FORCE-RLS tables — not `objects`. Keep legacy secret object keys in `SERVER_ONLY_OBJECT_KEYS` for backup strip only. After migrating a logical object to a typed table, remove it from `ALLOWED_OBJECTS` / object permission maps.

Encrypted workspace backups (`.mmsbak`): bound PBKDF2 iterations (`BACKUP_KDF_MIN_ITERATIONS`…`BACKUP_KDF_MAX_ITERATIONS`), format `version` ≤ `ENCRYPTED_BACKUP_VERSION`, salt/iv length caps. On restore, park unusable user hashes as `!restore-…` + `mustChangePassword`; fail only when no admin credential survives (`backup.missingUserCredentials`). Settings UI also requires password step-up + safety backup before wipe.

## Security test matrix

| Test file | Proves |
|-----------|--------|
| `app.security.test.ts` | Unauthenticated deny, admin-only sync download |
| `auth.integration.test.ts` | Subdomain login, refresh rotation, 2FA gate, tenant JWT binding |
| `rbacService.test.ts` | Permission matrix |
| `twoFactorService.test.ts` | OTP / refresh helpers |

```bash
cd apps/backend && pnpm test
```

## Route audit checklist (new PR)

1. Is the route tenant-scoped? → `authenticateTenant` (+ `bindRequestUserId`)
2. Is the route platform apex? → `requireMainDomain` + `authenticatePlatform` (+ `requireSuperUser` / `requirePlatformPermission` as needed)
3. Is it a mutation **or** sensitive read? → `rbacService` / `canReadCollection` / `requireAdmin` (tenant) or `platformUserCan` (platform)
4. Is body validated? → Zod via `parseRequest` before service layer (write schema strips soft-delete when applicable)
5. Never trust body `workspaceSubdomain` / authz `userId` — session only
6. Does it touch auth or messaging send? → rate limit preserved
7. Prod cookies `Secure`; prefer Helmet/secure headers when touching `app.ts`
8. Integration test with wrong-subdomain host returns `403`? (platform routes: tenant host must `403`)
9. New secret store? → FORCE-RLS table + exclude from backup snapshots

## Rules

`mms-auth-security.mdc`, `mms-api-interface.mdc`, `mms-testing-observability.mdc`

## Related skills

`mms-backend-api`, `mms-code-review`, `mms-messaging`

## Done

Run `app.security.test.ts` / auth integration when touching auth — `mms-completion-review.mdc`.

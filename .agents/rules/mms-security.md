---
trigger: model_decision
---

# MMS Security

Canonical for security beyond RBAC matrices (`mms-rbac.md`) and auth session shape (`mms-auth.md`).

## Threat model (current)

| Surface | Current | Residual risk | Target |
|---------|---------|---------------|--------|
| Session storage | httpOnly cookies `mms_access` / `mms_refresh` + Bearer fallback | XSS still dangerous for session fixation | Remove legacy `mms_token` localStorage writes |
| API auth | JWT in cookie or `Authorization` header | Stolen token until expiry | Short access TTL (15m) + opaque refresh rotation |
| Multi-tenant isolation | `t:{subdomain}:{key}` + `authenticateTenant` | Misconfigured proxy host header | Always trust `x-forwarded-host` from Vite/nginx only |
| Bulk sync download | `GET /api/db/sync` **admin-only** | Large payload exfiltration by admin | Payload size limits (target) |
| Bulk sync upload | `POST /api/db/sync` admin-only | Payload abuse | Size limits + request timeout (target) |
| 2FA | Server-side challenge in `auth_artifacts`; OTP hashed | SMS channel not fully wired | Email/SMS via tenant settings |
| CSRF | Cookie session with `SameSite=Lax` | Cross-site POST from malicious origin | `SameSite=Strict` + CSRF token for cookie-only mutations (evaluate) |
| REST mutations | `canWriteCollection` on students + contacts REST | Read endpoints open to all tenant users | Role-based read matrix (evaluate) |

## Required on every auth/write change

- [ ] **`authenticateTenant`** on tenant-scoped protected routes (`mms-backend.md`)
- [ ] **`rbacService`** on new `/api/db/*` writes and REST mutations (`mms-rbac.md`)
- [ ] **Rate limit** `POST /api/auth/login` and `POST /api/auth/onboard` — `@fastify/rate-limit`; return `429` with stable `type`
- [ ] **Validate bodies** — Fastify JSON Schema or Zod before service layer
- [ ] **No secrets in logs** — passwords, JWTs, refresh tokens, OTP codes, `passwordHash`, bulk PII
- [ ] **CORS** — `ALLOWED_ORIGIN` in production; `credentials: true` requires explicit origin (no `*`)

## Tenant isolation

1. Backend resolves tenant from `Host` / `X-Forwarded-Host` → `tenantStorage` (AsyncLocalStorage) — **never** from client JSON `subdomain` fields on protected routes.
2. JWT payload `workspaceSubdomain` **must match** resolved tenant (`authenticateTenant`).
3. `GET /api/auth/me` requires tenant host — apex calls return `403` (by design).
4. Frontend `tenantLocalStoragePrefix` must match server key scheme (`mms-data-layer.md`, `mms-tenant.md`).
5. Apex routes (`/api/workspace/registry`) must not expose other tenants' collection data.

## Auth artifacts (`auth_artifacts` table)

| `kind` | TTL | Purpose |
|--------|-----|---------|
| `handoff` | 2 min | Cross-subdomain onboarding session exchange |
| `two_factor_challenge` | 10 min | Hashed OTP pending verification |
| `refresh_token` | 7 days | Opaque refresh token hash (rotation on `/api/auth/refresh`) |

- One-time consume via `takeAuthArtifact` where applicable
- `purgeExpiredAuthArtifacts()` on startup
- **Drizzle journal** must include migration when adding SQL — or startup fails

## Passwords & OTP

- Hash: scrypt in `passwordService.ts` — `timingSafeEqual` on verify
- OTP: `crypto.randomInt()` in `twoFactorService` — **never** `Math.random()`
- Policy: `assertPasswordMeetsPolicy()` on onboard

## Headers & transport (production)

| Control | Where |
|---------|-------|
| HTTPS | Reverse proxy / Hetzner |
| `Strict-Transport-Security` | Proxy |
| `Content-Security-Policy` | Proxy (target) |
| `X-Content-Type-Options: nosniff` | Proxy |

Document cookie + CORS origin in deploy runbook (`mms-ops.md`).

## Audit trail (current)

`auditService` appends to `audit_log` **collection** on writes to:

- `users` collection
- `global_settings` object
- `branding` object

Fields: `userId`, `userEmail`, `action`, `entityType`, `entityId`, `summary`, timestamp.

Target: relational `audit_log` table with retention policy (`mms-database.md`).

## Error responses

Stable `type` codes — frontend maps to `t('errors.*')` (`mms-i18n.md`). Never return stack traces in production.

## Known gaps (do not regress)

| Gap | Status |
|-----|--------|
| Read RBAC on `GET /api/db/collections/*` and REST list endpoints | Open — any authenticated tenant user can read |
| Refresh token replay | Rotation deletes old artifact — verify in tests when changing auth |
| Bulk sync payload limits | Open — size/timeout guards (target) |

## Checklist (PR)

- [ ] New write route: `authenticateTenant` + RBAC + validation
- [ ] Login/onboard rate limited if touching auth routes
- [ ] Tenant JWT binding tested for new protected routes
- [ ] No token/password/OTP logging
- [ ] Migration journal updated if `auth_artifacts` schema changes

---
name: mms-auth-users
description: Fixes or extends MMS authentication, httpOnly cookies, opaque refresh tokens, server-side 2FA, auth artifacts, userService, seeds alignment, login/onboard, handoff, and RBAC. Use when editing auth routes, middleware/authenticate, users collection, AuthContext, login, passwords, roles, or permissions.
---

# MMS Auth & Users Workflow

## Canonical stored user

```ts
interface StoredUser {
  id: string;
  email: string;
  name: string;
  role: string;              // singular — NOT roles[]
  workspaceSubdomain: string;
  passwordHash: string;      // scrypt "salt:hash" hex
  createdAt: string;
}
```

Public API/JWT: `User` from `@mms/shared`.

## Session model

| Mechanism | Details |
|-----------|---------|
| `mms_access` cookie | JWT access token, httpOnly, 15 min, `SameSite=Lax` |
| `mms_refresh` cookie | Opaque token; hash stored in `auth_artifacts` (`kind: refresh_token`) |
| Bearer header | Fallback for legacy clients / tests |
| `mms_token` localStorage | **Read-only** fallback in `apiClient` — do not write on login |

### Flows

| Flow | Endpoints |
|------|-----------|
| Login | `POST /api/auth/login` → cookies or `requires2FA` + `challengeId` |
| 2FA | `POST /api/auth/2fa/verify` → sets cookies |
| Refresh | `POST /api/auth/refresh` → validates artifact, rotates, new cookies |
| Handoff | `POST /api/auth/handoff` → one-time code from `auth_artifacts` |
| Session check | `GET /api/auth/me` — requires **tenant** host + `authenticateTenant` |
| Logout | `POST /api/auth/logout` → clears cookies |

OTP: `crypto.randomInt()` in `twoFactorService` — never `Math.random()`.

## Add auth-protected tenant endpoint

1. `fastify.addHook('preHandler', authenticateTenant)` — **not** raw `jwtVerify`
2. Validate body (Zod or JSON Schema)
3. `rbacService` for writes
4. Return `{ type, message }` on error
5. Test with `host: '{subdomain}.localhost'` in `inject()`

## Add public auth endpoint

1. Register inside rate-limited block in `auth.ts` if brute-force sensitive
2. Do **not** require tenant for onboard (apex) — but login **requires** tenant subdomain
3. Store ephemeral state in `authArtifactService` — not in-memory `Map`

## Frontend alignment

- `AuthContext` — `apiClient` with `credentials: 'include'`
- `checkAppState` / `checkUserAuth` — `useCallback`; mount-only effect; **do not** block UI on `/health`
- Guards: `ProtectedRoute`, `GuestRoute`, `HostRoutes` only
- 2FA: `lib/twoFactor.ts` calls server verify/resend — not client-side OTP storage
- Never log tokens/passwords

## UI vs backend

2FA, `status`, multi-role UI in `components/users/` — backend must enforce before UI implies security.

## Tests

| File | Scope |
|------|-------|
| `auth.integration.test.ts` | Login subdomain, refresh, tenant JWT binding, 2FA gate |
| `app.security.test.ts` | Unauthenticated deny |
| `services/twoFactorService.test.ts` | OTP/refresh helpers |
| `services/rbacService.test.ts` | Permission matrix |

Mock `initDb`, `authArtifactService`, `userService` in integration tests.

## Key files

| Area | Path |
|------|------|
| Middleware | `middleware/authenticate.ts` |
| Cookies / OTP hash | `services/authCookieService.ts` |
| Login/onboard | `services/authService.ts` |
| Users | `services/userService.ts` |
| 2FA | `services/twoFactorService.ts` |
| Artifacts DB | `services/authArtifactService.ts` |
| Handoff | `services/authHandoffService.ts` |
| Routes | `routes/auth.ts` |
| Frontend | `lib/AuthContext.tsx`, `lib/apiClient.ts`, `lib/twoFactor.ts` |

## Rules

`mms-auth.mdc`, `mms-security.mdc`, `mms-rbac.mdc`, `mms-database.mdc` (auth_artifacts)

---
trigger: model_decision
---

# MMS Auth & Users

## Stored user (canonical)

```ts
interface StoredTenantUser {
  id: string;
  contactId?: string | number;
  loginEmail: string;           // sign-in identifier — NOT contact CRM email
  emailVerifiedAt?: string;     // ISO; required when users_settings.requireEmailVerification
  name: string;                 // hydrated from contact on read
  email?: string;               // hydrated contact email — display only
  role: string;                 // singular — NOT roles[]
  workspaceSubdomain: string;
  passwordHash: string;         // scrypt "salt:hash" hex
  createdAt: string;
}
```

JWT / API public shape: `User` from `@mms/shared` — `{ id, email, name, role, workspaceSubdomain, contactId?, loginEmail?, emailVerifiedAt? }`. JWT `email` mirrors `loginEmail` for backward compatibility.

**Contact vs sign-in email:** Profile fields (name, phone, CRM email) live on the linked `contacts` row. Login matches `loginEmail` only. Changing contact email does **not** change sign-in. Users change sign-in email via `/api/auth/login-email/*` (password + OTP).

## Seeds & UI alignment

- Seeds must include `passwordHash`, `role`, and `workspaceSubdomain`. `roles: ['admin']` without hash **breaks login**.
- UI fields for 2FA, `status`, `roles[]` in seeds are **display-only** until backend enforces them.

## Endpoints

| Route | Auth | Notes |
|-------|------|-------|
| `POST /api/auth/login` | Public (tenant host) | Rate-limited; subdomain required; may return `requires2FA` + `challengeId` |
| `POST /api/auth/onboard` | Public (apex) | New workspace + admin user |
| `POST /api/auth/2fa/verify` | Public | Completes server-side challenge in `auth_artifacts` |
| `POST /api/auth/2fa/resend` | Public | Re-issues OTP for active challenge |
| `POST /api/auth/refresh` | Cookie | Opaque `mms_refresh` → validate artifact → rotate → new cookie pair |
| `POST /api/auth/handoff` | Public | One-time code from `auth_artifacts` (`kind: handoff`) |
| `GET /api/auth/me` | **`authenticateTenant`** | Tenant host required; JWT subdomain must match host |
| `GET /api/auth/profile` | **`authenticateTenant`** | Full profile: contact + `loginEmail` + verification state |
| `PUT /api/auth/me/contact` | **`authenticateTenant`** | Self-service linked contact update (name, phone, emails) |
| `POST /api/auth/change-password` | **`authenticateTenant`** | Current + new password |
| `POST /api/auth/login-email/request` | **`authenticateTenant`** | Password + new email → OTP challenge (`login_email_change`) |
| `POST /api/auth/login-email/confirm` | **`authenticateTenant`** | OTP → updates `loginEmail`, rotates refresh tokens |
| `POST /api/auth/logout` | — | Clears `mms_access` / `mms_refresh` cookies |

`JWT_SECRET` required at startup.

## Session storage

| Layer | Mechanism |
|-------|-----------|
| Access | httpOnly cookie `mms_access` (JWT, 15 min, `SameSite=Lax`) |
| Refresh | httpOnly cookie `mms_refresh` (opaque token; hash in `auth_artifacts`, 7 days) |
| Frontend API | `apiClient` sends cookies via `credentials: 'include'` only — no `localStorage` token reads |
| Legacy cleanup | Cookie-only session — do not reintroduce `mms_token` reads or writes |
| Backend verify | `attachAccessTokenFromCookie` copies `mms_access` → `Authorization` Bearer for `jwtVerify` |

OTP codes: `crypto.randomInt()` — never `Math.random()`.

## Auth artifacts (PostgreSQL)

Ephemeral auth state lives in `auth_artifacts` — **not** in-memory `Map`.

| `kind` | TTL | Purpose |
|--------|-----|---------|
| `handoff` | 2 min | Cross-subdomain session exchange |
| `two_factor_challenge` | 10 min | Hashed OTP pending verification |
| `refresh_token` | 7 days | Opaque refresh hash; rotated on `/api/auth/refresh` |
| `login_email_change` | 10 min | Hashed OTP pending sign-in email change |

Details: `mms-security.md`, `mms-database.md`.

## Tenant session binding

Protected tenant routes use **`authenticateTenant`** (`middleware/authenticate.ts`):

- Valid JWT from cookie or Bearer
- Resolved tenant subdomain on host / `x-forwarded-host`
- `user.workspaceSubdomain === tenant`
- Rejects refresh tokens and incomplete 2FA (`twoFactorVerified === false`)

Do **not** call raw `request.jwtVerify()` in route handlers.

## RBAC

Enforcement → **`mms-rbac.md`** (`rbacService`, `can()` hook, registry `permissions`).

## Frontend

- `AuthProvider` at app root — session via cookies + `GET /api/auth/me` on tenant host (skipped when no cached `mms_user` on entry routes to avoid login-page 401 noise)
- **Profile page:** `/profile` (`AccountProfile`) — contact CRM fields + verified sign-in email change
- **Single guard set:** `GuestRoute`, `ProtectedRoute`, `HostRoutes` in `components/routing/`
- 2FA: `lib/twoFactor.ts` calls server verify/resend — not client-side OTP validation
- `checkAppState` / auth effects — `useCallback`; mount-only; do not block UI on `/health`
- All auth API calls through `apiClient` (`credentials: 'include'`)
- Never log token or password values

## Password handling

- Hash/verify only in `userService` (scrypt + `timingSafeEqual`)
- Never send or store plaintext passwords outside login/onboard handlers

## Tests

| File | Scope |
|------|-------|
| `auth.integration.test.ts` | Login subdomain, refresh rotation, 2FA gate, tenant JWT binding |
| `app.security.test.ts` | Unauthenticated deny |
| `twoFactorService.test.ts` | OTP/refresh helpers |

Skill: `mms-auth-users`.

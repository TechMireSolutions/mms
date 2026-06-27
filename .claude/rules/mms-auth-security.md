---
description: Authentication session cookies, JWT token scopes, tenant isolation context, RBAC matrices, and threat mitigations.
paths:
  - "apps/backend/src/routes/auth.ts"
  - "apps/backend/src/middleware/authenticate.ts"
  - "apps/backend/src/services/auth*.ts"
  - "apps/backend/src/services/rbacService.ts"
  - "apps/backend/src/utils/tenantContext.ts"
  - "apps/frontend/src/lib/contexts/AuthContext.tsx"
  - "apps/frontend/src/hooks/usePermissions.ts"
  - "apps/frontend/src/lib/apiClient.ts"
  - "apps/frontend/src/components/routing/**"
---

# MMS Auth & Security System

Governs user authentication, sessions, tenant isolation, role-based authorization (RBAC), and server threat protections in the Madrasa Management System (MMS).

---

## 1. Authentication & Session Management

### Session Cookies Shape
- **Access Token**: httpOnly cookie `mms_access` (15-minute JWT, `SameSite=Lax`).
- **Refresh Token**: httpOnly cookie `mms_refresh` (7-day opaque token rotated on refresh).
- **Client Configuration**: The frontend `apiClient` must specify `credentials: 'include'`. Directly writing or reading session tokens via client `localStorage` is forbidden.
- **Verification Hook**: Backend `attachAccessTokenFromCookie` copies `mms_access` to the `Authorization` header before verification.

### Authentication Artifacts (`auth_artifacts` PG Table)
Ephemeral auth challenges and tokens are persisted in `auth_artifacts` (not in-memory):
- `handoff` (2 min TTL): Subdomain session exchange.
- `two_factor_challenge` (10 min TTL): OTP hashes.
- `refresh_token` (7 days TTL): Token rotation hashes.
- `login_email_change` (10 min TTL): Verification hashes.

---

## 2. Multi-Tenant Routing & Isolation

### Tenant Resolution
- **Subdomain Routing**: Hosts are resolved dynamically:
  - **Apex Host** (`localhost`, `madrasa.app`): Marketing and new workspace onboard.
  - **Tenant Host** (`{slug}.localhost`): Full workspace instance.
- **Request Context**: Backend parses tenant from `Host` or `X-Forwarded-Host` headers (never from client JSON bodies) and starts an AsyncLocalStorage scope (`tenantStorage`).
- **Endpoint Protection**: Tenant API routes require **`authenticateTenant`** which validates that the JWT payload `workspaceSubdomain` matches the resolved request subdomain. Apex requests to tenant routes return `403`.

---

## 3. Role-Based Access Control (RBAC)

### Permissions Matrix
- **Permissions Hook**: Frontend gates use `can('permission.string')` via the `usePermissions` hook. Inline role comparisons (e.g. `role === 'admin'`) are deprecated.
- **DOM Rendering**: Forbidden elements must be omitted from rendering entirely; do not render disabled placeholders for unauthorized actions.
- **Backend Enforcement**: Enforce permission checks inside route preHandlers (e.g. `canWriteCollection(user, 'students')`). Denied operations must return `403` with a stable `type: 'forbidden'` payload.

---

## 4. Threat Mitigations & Security Checklist
- **Rate Limiting**: Limit onboarding/login calls (`@fastify/rate-limit`); return `429` on abuse.
- **Password Security**: Hash passwords utilizing `scrypt`. Enforce password policy constraints on onboarding. Verify using `timingSafeEqual`.
- **OTP Generation**: Issue OTP codes utilizing `crypto.randomInt()`. The use of `Math.random()` is forbidden.
- **CORS Configuration**: CORS must bind to explicit origins (`ALLOWED_ORIGIN`) when using credentials; wildcard `*` is forbidden.
- **Logs Hygiene**: NEVER print user passwords, session tokens, JWT signatures, OTP codes, or bulk PII to console logs.
- **Auditing**: `auditService` must capture an append-only entry on database collection modifications (writes, merges, soft-deletes).

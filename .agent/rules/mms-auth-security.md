---
trigger: model_decision
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
- **Permissions Hook**: Frontend gates use `can('permission.string')` via `usePermissions`, or **`useModulePermissions(X_MODULE_MANIFEST)`** for module pages (resolves `canWrite` / `canDelete` / `canExport` / `canViewSetup` / reports from the manifest).
- **Module pages**: Prefer contract-driven gates + `useFilteredModuleTierTabs({ canViewSetup, canViewReports })`. Do not introduce new `role === 'admin'|'teacher'|…` write gates on tenant modules.
- **DOM Rendering**: Forbidden elements must be omitted from rendering entirely; do not render disabled placeholders for unauthorized actions.
- **Backend Enforcement**: Enforce permission checks inside route preHandlers (e.g. `canWriteCollection(user, 'students')`). Denied operations must return `403` with a stable `type: 'forbidden'` payload.

---

## 4. Threat Mitigations & Security Checklist
- **Rate Limiting**: Limit onboarding/login and write-heavy / messaging send endpoints (`@fastify/rate-limit`); return `429` on abuse.
- **Password Security**: Hash with `scrypt`. Enforce onboarding password policy. Verify with `timingSafeEqual`.
- **OTP Generation**: `crypto.randomInt()` only — `Math.random()` forbidden.
- **CORS**: Explicit origins (`ALLOWED_ORIGIN`) when using credentials; wildcard `*` forbidden.
- **Cookies (prod)**: Set `Secure` on session cookies under HTTPS / `NODE_ENV=production`.
- **Headers**: Prefer `@fastify/helmet` (or equivalent) — at least `X-Content-Type-Options`, frame denial, HSTS in prod; CSP suitable for the SPA.
- **IDOR**: Authorize via permission **and** tenant RLS. Never trust body `workspaceSubdomain` / authz `userId` — force from session (Messaging log POST pattern).
- **XSS / exports**: No unsanitized HTML; encode user content in PDF/CSV/Excel cells.
- **Logs Hygiene**: NEVER print passwords, session tokens, JWT signatures, OTP codes, or bulk PII.
- **Auditing**: `auditService` append-only entry on collection writes, merges, soft-deletes.

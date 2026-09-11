---
trigger: model_decision
---

# MMS Auth & Security System

**Workflow skill:** `mms-backend-security` (CSRF/Origin, cookies, RBAC, tenant isolation) · audit trail security → `mms-audit-trail`. Route/service wiring → `mms-backend-api`.

Governs user authentication, sessions, tenant isolation, role-based authorization (RBAC), and server threat protections in the Madrasa Management System (MMS). These security rules apply **equally and rigorously to both tenant workspaces and the platform apex**.

---

## 1. Authentication & Session Management

### Session Cookies Shape

**Tenant workspace**
- **Access Token**: httpOnly cookie `mms_access` (15-minute JWT, `SameSite=Lax`, `Path=/`).
- **Refresh Token**: httpOnly cookie `mms_refresh` (7-day opaque token rotated on refresh, `SameSite=Lax`, `Path=/api/auth/refresh`).
- **Verification Hook**: On tenant hosts, `attachAccessTokenFromCookie` copies `mms_access` to `Authorization` before verification.

**Platform apex** (separate from tenant — do not reuse `mms_access` / `mms_refresh`)
- **Access Token**: httpOnly cookie `mms_platform_access` — browser **session** cookie (no `maxAge`; cleared when the browser closes).
- **JWT**: Sign only `{ id, tokenType: 'platform_access', sessionVersion }` (`PlatformAccessTokenPayload`); ~8h `expiresIn`. Do **not** embed role/permissions/email — reload via DB in `authenticatePlatform`. The JWT has an ~8h server-side max-expiry; the *cookie* is a session cookie (no `maxAge`) and is cleared when the browser closes — whichever ends first wins.
- **No platform refresh cookie** — expired/revoked sessions require re-login. FE idle timeout (`PLATFORM_IDLE_SESSION_TIMEOUT_MINUTES`, 30) also signs out.
- **Verification**: On apex, `attachPlatformTokenFromCookie` binds the cookie. `authenticatePlatform` runs `requireMainDomain`, **deletes** any client `Authorization` header, then re-attaches from cookie only (Bearer injection is not trusted).
- **Mutual exclusion**: Issuing or clearing a platform session also clears tenant auth cookies (and logout clears both).

**Client Configuration**
- `apiClient` must use `credentials: 'include'`. Never store JWTs in `localStorage`. Clearing legacy `mms_user` on platform login/logout is OK (tenant cache hygiene), not a session store.

### Platform FE session probe
- On apex boot, `PlatformAuthProvider` **always** calls `GET /api/platform/auth/me` (no sessionStorage gate).
- Logged-out / invalid / revoked / disabled probe → **`200 { user: null, isAuthenticated: false }`** (soft probe via `optionalAuthenticatePlatform`) — treat as unauthenticated; do not toast or trigger tenant `/api/auth/refresh`.
- Hard `authenticatePlatform` on other `/api/platform/*` routes still returns typed `401` (`auth_required` / `session_revoked` / `account_disabled`).
- Never reintroduce a sessionStorage (or similar) gate that skips the `/me` probe on new tabs / deep links / post-setup / password-reset.

### Platform session revoke & soft-disable
- **`sessionVersion`**: Compare JWT claim to `platform_users.session_version`. Mismatch → `401` `{ type: 'session_revoked' }`. Bump on password change/reset and admin **disable** (re-issue cookie after self password change). Re-enable does **not** bump.
- **Soft-disable**: `platform_users.disabled_at` (API `disabledAt`). Non-null → login (after password verifies) and middleware `401` `{ type: 'account_disabled' }`. Super-users cannot be disabled/deleted; cannot disable/delete self; destructive admin ops require current-password re-auth (`sendInvalidCurrentPassword`).
- **Soft-Delete Session Invalidation ("Not deleted until sessions die"):** When a user or staff account (`tenant_users`, `teachers`) is soft-deleted, all active sessions and refresh tokens must be revoked immediately in Redis/auth stores. All authentication resolvers (`authenticateTenant`, `/me`, credentials login, OAuth) must explicitly verify `deleted_at IS NULL` to prevent zombie sessions and silent account resurrection (`mms-soft-delete`).
- Missing/invalid JWT → default `auth_required` (`sendUnauthorized`).

### Platform error SSOT
- All platform API `type` strings live in `@mms/shared` `platformApiErrors.ts` (`PLATFORM_API_ERROR_TYPES` / `PlatformApiErrorType`). BE `PlatformError` uses `PLATFORM_SERVICE_ERROR_STATUSES`; FE maps via `mapPlatformAuthError` / `getPlatformErrorMessage` — do not invent ad-hoc platform `type` strings.

### Authentication Artifacts (`auth_artifacts` PG Table)
Ephemeral auth challenges and tokens are persisted in `auth_artifacts` (not in-memory):
- `handoff` (2 min TTL): Subdomain session exchange (prefer `scope_key` `ws:{subdomain}`).
- `two_factor_challenge` (10 min TTL): OTP hashes (prefer workspace `scope_key`).
- `refresh_token` (7 days TTL): Token rotation hashes — store opaque hash in indexed `lookup_key` and `user:{id}` in `scope_key` (not payload-only scans).
- `login_email_change` (10 min TTL): Verification hashes.
- `platform_password_reset`: Apex password-reset OTP artifacts (platform TTLs via shared constants). Do **not** reintroduce unused `platform_setup` artifact kind — first-run uses interactive setup when no users exist.
- **2FA scope**: OTP via `auth_artifacts.two_factor_challenge` only — do not invent WebAuthn/passkeys or recovery-code flows outside an explicit product task. If recovery codes ever ship, store only hashed artifacts (same TTL/purge rules).
- **Purge**: Startup + scheduled `purgeExpiredAuthArtifacts` (API process) — TTL hygiene only; see `mms-ops-infrastructure.md` for wipe/reset paths.

---

## 2. Multi-Tenant Routing & Isolation

### Tenant Resolution
- **Subdomain Routing**: Hosts are resolved dynamically:
  - **Apex Host** (`localhost` in dev, or configured `MMS_APP_DOMAIN`): Marketing, platform console, onboarding, and **tenant-not-found**.
  - **Tenant Host** (`{slug}.localhost` / `{slug}.{MMS_APP_DOMAIN}`): Full workspace instance.
- **Unknown tenant SPA gate**: If the FE resolves no registered workspace for the host subdomain, **hard-redirect** to apex `/tenant-not-found?subdomain=…` — never mount tenant `/settings` or leave the user on the unregistered host (`mms-settings-i18n.md`, `mms-ui-ux-design.md` §8).
- **Request Context**: Backend parses tenant from `Host` or `X-Forwarded-Host` headers (never from client JSON bodies) and starts an AsyncLocalStorage scope (`tenantStorage`).
- **Endpoint Protection**: Tenant API routes require **`authenticateTenant`**: JWT from cookie **or** Bearer (does **not** strip client `Authorization`) → workspace enabled → `workspaceSubdomain` match → reject `refresh` / `platform_access` → `twoFactorVerified !== false` → `bindRequestUserId`. Apex requests to tenant routes return `403`.

### Platform API protection
- All `/api/platform/*` routes: apex-only (`requireMainDomain` inside `authenticatePlatform` and on public platform plugins — tenant subdomain → `403`).
- **`authenticatePlatform`** (not `authenticateTenant`): cookie-only trust → `tokenType === 'platform_access'` → load user → `disabledAt` / `sessionVersion` → `request.platformUser`. Prefer hydrated `platformUser` over JWT claims for email/role.
- Capability gates: `requireSuperUser` for super-user-only admin management; `requirePlatformPermission('workspaces'|'onboard')` / shared `platformUserCan` for grantable admin caps. Do not invent tenant `can()` strings for platform ops.
- **OTP delivery (platform)**: Production fail-closed — no `devCode` / proceed when email `sent === false` (`email_send_failed`); prod without SMTP → `smtp_required`. Non-prod may surface `devCode` / `devReset`.
- **Env bootstrap**: Seed platform super-user only when `PLATFORM_ALLOW_ENV_BOOTSTRAP=true` **and** `PLATFORM_ADMIN_EMAIL` + password env (`PLATFORM_ADMIN_PASSWORD` or `SEED_DEV_PASSWORD`) are set; otherwise first-run UI.

---

## 3. Role-Based Access Control (RBAC)

### Permissions Matrix
- **Permissions Hook**: Frontend gates use `can('permission.string')` via `usePermissions`, or **`useModulePermissions(X_MODULE_MANIFEST)`** for module pages (resolves `canWrite` / `canDelete` / `canExport` / `canViewSetup` / reports from the manifest).
- **Do not widen write gates with Setup**: entity sync / mutate paths that need `contacts.write` (or module `canWrite`) must not OR with `canEditSetup` (Google Contacts sync pattern — Setup configures; write permission performs).
- **Module pages**: Prefer contract-driven gates + `useFilteredModuleTierTabs({ canViewSetup, canViewReports })`. Do not introduce new `role === 'admin'|'teacher'|…` write gates on tenant modules.
- **Platform console**: Use `platformUserCan` / `requirePlatformPermission` for grantable caps; keep intentional `super_user` checks for admin-management gates — do not invent tenant permission strings.
- **DOM Rendering**: Forbidden elements must be omitted from rendering entirely; do not render disabled placeholders for unauthorized actions.
- **Backend Enforcement**: Enforce permission checks inside route preHandlers (e.g. `canWriteCollection(user, 'students')`). Denied operations must return `403` with a stable `type: 'forbidden'` payload.
- **Soft-Delete & Trash RBAC Gating:** All soft-delete actions (`DELETE /:id`, `POST /:id/restore`, `POST /bulk-delete`, `POST /bulk-restore`) and trash inspection queries (`GET /?includeDeleted=true`, `GET /:id?includeDeleted=true`) require delete privileges (`canDeleteCollection(user, collection)` or module `canDelete`). Lacking delete permissions returns `403 Forbidden` immediately; non-delete users must never be permitted to browse archived rows.

---

## 4. Threat Mitigations & Security Checklist
- **Rate Limiting**: Limit onboarding/login and write-heavy / messaging send endpoints (`@fastify/rate-limit`); return `429` on abuse (`type: 'rate_limit_exceeded'` where configured). Emit **`Retry-After`** (and `X-RateLimit-*` when the plugin exposes them). FE must not tight-loop retries on `429` — back off / surface `notify`.
- **Platform `AUTH_RATE_LIMIT`**: Auth-sensitive + destructive platform routes (login/setup/password flows; admin disable/delete; workspace delete; database reset; migrate-and-restart) — do not ship those mutations without the limit + password confirm where already required.
- **Hard-Delete Bypass Security:** Physical row deletion is blocked by PostgreSQL `forbid_hard_delete()` trigger. Executing `SET LOCAL app.allow_hard_purge = 'true'` is strictly restricted to authorized background retention workers (`purgeExpiredArchivedRecords`) and platform workspace teardown (`purgeTenantDataBySubdomain`).
- **Cookie CSRF / Origin**: Cookie-auth state-changing requests (`POST`/`PUT`/`PATCH`/`DELETE`) must enforce same-origin (`Origin` / `Sec-Fetch-Site` header checks against allowed origin) or an equivalent CSRF defense. Do not rely on `SameSite=Lax` alone for mutations.
- **Content-Type**: JSON mutation routes reject bodies without `application/json` (multipart only on upload routes). Ban empty/`text/plain` bodies on JSON write paths.
- **Password Security**: Keep `scrypt` + `crypto.timingSafeEqual` (constant-time check from `node:crypto`) to prevent timing side-channel attacks. Enforce onboarding / platform password policy. Do not switch to argon2 (or dual algorithms) without an explicit dual-verify migration plan.
- **OTP Generation & Verification**: `crypto.randomInt()` from `node:crypto` only — `Math.random()` strictly forbidden. Verify OTP hashes using constant-time comparison (`timingSafeEqual`).
- **One-Shot Hashing**: Use `crypto.hash()` from `node:crypto` instead of verbose `createHash().update().digest()` chains.
- **URL Resolution**: Use WHATWG `new URL()` and `URLPattern` API — legacy `url.parse()` is strictly forbidden.
- **Node Permission Controls**: Enforce the Node 24 `--permission` model (e.g. `--permission --allow-fs-read=/var/www/mmsv2/data`) in high-risk / production environments.
- **CORS**: Explicit origins (`ALLOWED_ORIGIN`) when using credentials; wildcard `*` strictly forbidden with credentials.
- **Cookies (prod)**: Set `Secure` under HTTPS / `NODE_ENV=production`. Prefer `__Host-` cookie names when `Path=/` and no `Domain` is required; never `SameSite=None` without `Secure` and an explicit cross-site need (tenant/platform stay `SameSite=Lax`).
- **Security Headers**: `@fastify/helmet` is registered with frame denial (`X-Frame-Options: DENY`), MIME sniffing prevention (`X-Content-Type-Options: nosniff`), and HSTS in production. CSP remains SPA-compatible (hash/nonce-based).
- **Identity & Authorization**: Never trust client body/query for `workspaceSubdomain` or authz `userId` — bind from session + host after `authenticateTenant` / `authenticatePlatform`.
- **IDOR Defense**: Authorize via explicit permission **and** tenant RLS. Never trust body `workspaceSubdomain` / authz `userId` — force from authenticated session.
- **Secrets storage**: Long-lived OAuth/API secrets in FORCE-RLS tenant tables — never in unscoped `objects` KV. Strip legacy secret object keys from backups (`SERVER_ONLY_OBJECT_KEYS`).
- **Workspace backup / restore**: Admin + `canBulkSync` on `/api/db/backup` and `/api/db/sync`. Envelope/KDF/credential-strip mechanics → **`mms-data-layer.md`**. Settings two-step UI + password step-up → **`mms-settings-i18n.md`**.
- **Document-store RBAC**: Remove obsolete keys from `ALLOWED_OBJECTS` / object permission maps **and** `ALLOWED_COLLECTIONS` / FE `BUSINESS_COLLECTIONS` after migrating entities to typed REST tables.
- **XSS & Output Encoding**: No unsanitized HTML (`dangerouslySetInnerHTML` forbidden without strict DOMPurify sanitization); encode user content in PDF/CSV/Excel cells to prevent CSV formula injection.
- **Logs Hygiene**: NEVER print passwords, session tokens, JWT signatures, OTP codes, bulk PII, or OAuth client secrets / refresh tokens. Structured logging emits to `stdout` (Pino).
- **Auditing**: `auditService` append-only entry on collection writes, merges, soft-deletes. PG row triggers and outbox workers read `app.current_user_id` + `app.current_tenant` (SET LOCAL in `withTenantTransaction` / `runInTransaction`).

---

## 5. Audit Trail Security, Governance & Trace Context
- **Five-Dimension Capture Security:** Every audit record binds Who (`real_user_id`, `impersonated_user_id`, `ip_address`, `session_id`, `client_app`), What (RFC 8785 canonical JSON row delta), When (`timestamptz` UTC microsecond precision), Why (W3C `traceparent` as `correlation_id`, `action_type`, endpoint, HTTP method), and Integrity (`hash_previous`, `hash_current`, `verification_status`).
- **W3C Trace Context Propagation:** Propagate the W3C Trace Context `traceparent` header into the request `AsyncLocalStorage` context and store it as (or alongside) `correlation_id` in audit payloads. Banned: bespoke ad-hoc random UUIDs that break correlation with APM/tracing infrastructure.
- **Audit Data Segregation & JIT Break-Glass:** The application service writing transactional data gets `INSERT`-only privileges on the audit schema. `UPDATE` and `DELETE` are strictly revoked on audit tables from every role, including the application's own database user. Direct read access to audit logs is segregated to a dedicated security role with mandatory Multi-Factor Authentication (MFA) and ideally Just-In-Time (JIT) break-glass access (granted, logged, and expires — not a standing grant).
- **Auditing the Auditor:** Access to the audit trail is itself an auditable event. All search queries, view sessions, and exports targeting audit tables must emit an immutable audit event (`action_type: 'VIEW'`, `table_name: 'audit_trail_events'`).
- **Complementary Statement-Level Auditing (`pgAudit`):** Pair application row-level audit with database-native statement auditing (`pgAudit`) to capture direct database console access, ad-hoc DBA queries, and schema DDL that bypass the Fastify application write path.
- **Tamper-Evident Compliance Exports:** Automated compliance export pipelines must include cryptographic hash verification proofs and published Merkle roots within the exported artifact.
- **Anomaly Detection Baselining:** Baseline normal write volume and access patterns per actor. Alert on write spikes (>300% of baseline), off-hours administrative access, and geographically implausible sessions. Reserve ML-based anomaly detection for when rule-based baselining stops catching real incidents — it is a scaling step, not a starting point.
- **Capture Minimization:** Minimise at capture time. Don't log full PII payloads into `old_state`/`new_state` if the field isn't needed for reconstruction — every field captured is a field you must later handle under an erasure request. Strip secrets (passwords, tokens, credentials, payment card numbers) completely.
- **Right-to-Erasure Security Invariant:** Never delete or mutate historical audit rows to satisfy GDPR/privacy requests (modifying rows destroys cryptographic hash chains). Execute erasure strictly via crypto-shredding (destroying per-subject encryption key, permanently rendering plaintext unrecoverable mathematical noise) or redact-and-append (recording `action_type = 'REDACT'`); never recompute historical hashes.
- **Statutory Retention Floors & Automated Enforcement:**
  - HIPAA: 6 years (health records).
  - SOX: 7 years (financials).
  - PCI-DSS: 1 year (3 months online). Avoid storing card data at all — reference a tokenised payment-processor record instead.
  - Regional privacy laws (GDPR / equivalent): verify jurisdiction's law is actually enacted and in force before treating draft legislation as binding.
  - Automate retention enforcement as policy-driven purging (on the *encrypted-key* lifecycle for crypto-shredded data, or on the *raw row* lifecycle for non-personal audit data) rather than manual review.
- **Decentralized / Blockchain Anchoring Scope:** Scope external blockchain anchoring strictly to scenarios with an explicit external regulatory or evidentiary mandate (e.g. proving integrity to a court or regulator independent of database administrators); do not introduce external chains as an unrequested default layer.


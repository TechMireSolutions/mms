---
trigger: model_decision
---

# MMS API & Communications Interface

Governs the communications contract between the React SPA frontend and the Fastify backend, defining routing layers, payload schemas, fetch clients, and middleware configurations.

---

## 1. Client-Server Communication Flow
All frontend requests to backend resources must use `apiFetch` or `apiJson` from the `apiClient.ts` wrapper.
- **Session Transport**: Sessions are cookie-only (`credentials: 'include'`). Tenant: `mms_access` / `mms_refresh`. Platform apex: `mms_platform_access` only (no refresh). Never parse JWTs from `localStorage`.
- **Tenant refresh only**: On `401` + `type: 'auth_required'`, `apiClient` may POST `/api/auth/refresh` **only** for tenant session requests (`isTenantSessionRequest`). Paths under `/api/platform/` are excluded — platform 401s (including expected logged-out `/me`) must not refresh.
- **REST Trajectory**: New features must implement resource-specific endpoints (e.g. `GET /api/students`, `POST /api/contacts`) instead of relying on the generic collections sync API.
- **Data Types**: All data transfer objects (DTOs) and request body structures must be shared via the `@mms/shared` package.
- **Write vs read schemas**: Prefer dedicated write schemas for create/update (strip server-owned fields such as soft-delete metadata) while response/list schemas may include them.
- **Destructive merges**: Entity merge (e.g. Contacts) must be an atomic server transaction (`POST …/merge`) — ban FE-only dual delete+upsert for the durable write.

---

## 2. Fastify Router & Layering
Backend route handlers must remain lean, delegating operations to the service layer:
```
request → route barrel / sub-routes (routes/**) → service handler (services/*.ts) → database model (db/*)
```
- **Controller Rules**: Route files must never import raw Drizzle pg pool drivers or database connections. All request bodies must validate against Zod validation schemas using the `parseRequest` service wrapper.
- **Large domains**: Prefer a thin register barrel (`routes/tenant/contacts.ts`, `messaging.ts`) plus colocated `routes/tenant/{module}/*Routes.ts` — keep the public plugin registration path stable — `mms-structure-naming.md`.
- **Boot Guards**: Fastify must fail fast and hard-fail during initialization if either the `DATABASE_URL` or `JWT_SECRET` environment variables are not defined.

---

## 3. Fastify Middleware Pipeline

### A. Subdomain Resolution & tenant context
Every request starts by parsing the host header or the `X-Forwarded-Host` parameter (forwarded in dev by Vite's proxy config) to resolve the active tenant subdomain, initializing the AsyncLocalStorage `tenantStorage` scope.

### B. `authenticateTenant` Hook
Apply the tenant hook to all protected workspace endpoints. Do not call raw `jwtVerify()` inside route code. The middleware verifies:
1. Access token is verified from the httpOnly `mms_access` cookie or standard Bearer authorization header.
2. Tenant subdomain resolved on the request matches the user's `workspaceSubdomain`.
3. 2FA OTP verification is complete (`twoFactorVerified` is true).
4. After success, bind `app.current_user_id` for the request (`bindRequestUserId`) so tenant transactions can attribute audit triggers.

### C. `authenticatePlatform` Hook
Apply to protected apex `/api/platform/*` routes. The hook embeds `requireMainDomain` (also register it on public platform plugins). Do not call raw `jwtVerify()` in handlers.
1. Apex-only; strip client `Authorization`; attach `mms_platform_access` only.
2. Verify JWT with `tokenType === 'platform_access'`.
3. Reload platform user from DB; enforce `disabledAt` + `sessionVersion` (`account_disabled` / `session_revoked`).
4. Bind `request.platformUser` (public profile). Permissions come from DB, not JWT claims.

### Platform REST namespaces (apex-only)
- `/api/platform/auth/*` — setup, login, `/me`, password reset (`requireMainDomain`; protected routes via `authenticatePlatform`).
- `/api/platform/users/*`, `/api/platform/workspaces/*`, `/api/platform/settings/*` — `authenticatePlatform` (+ `requireSuperUser` / `requirePlatformPermission` as coded).
- Destructive: `POST /api/platform/settings/reset-database` — see `mms-ops-infrastructure.md` purge / reset.

---

## 4. API Error Payloads
API errors must resolve to a uniform JSON payload format:
```json
{ "type": "validation_error", "message": "Development debug details" }
```
- **Error Classifications**: Standard types include `auth_required`, `invalid_credentials`, `forbidden`, `two_factor_required`, `not_found`, `validation_error`, `conflict`, and `server_error`. Platform clients: map against the full `@mms/shared` `PLATFORM_API_ERROR_TYPES` set (includes `database_error`, setup/reset codes, `account_disabled`, `session_revoked`, `rate_limit_exceeded`) — never invent ad-hoc platform `type` strings.
- **Mask exceptions**: Never leak database exceptions, SQL failures, or raw Node stack traces to the client in production responses.
- **Client Handling**: Tenant UI maps `type` via `t('errors.{type}')`. Platform auth/setup/admin UI maps via `mapPlatformAuthError` / `getPlatformErrorMessage` (`platformAuthErrors.ts` → `platform.*` keys) — do not fork ad-hoc English strings or raw `t('errors.{type}')` for platform UI.

---

## 5. Bulk PUT / collection replace semantics
Workspace bulk write endpoints (`PUT` that accept an array / `{ items }` payload) must **upsert** rows by composite tenant key (`bulkSave` + `conflictTarget`, merge-by-id helpers, or `bulkUpsertCustomTabsForModule`).
- **Allowed**: Insert new ids; update existing ids; leave rows absent from the payload untouched.
- **Bulk id lists**: Prefer shared `bulkIdsBodySchema` / `bulkStringIdsBodySchema` (`.max(500)`) for bulk-delete / bulk-restore — do not fork unbounded id arrays per module.
- **Contacts list/filter query**: Shared `contactsListQuerySchema` / `paginateContacts` (includes `hasEmail` / `hasPhone` / `hasReachable`) — do not fork Messaging “select all with email” flags per route.
- **Forbidden on API bulk write paths**: `replaceForWorkspace` (or any wipe that deletes rows missing from the client payload — including custom-tabs delete-then-insert). Prefer `bulkSave` / `bulkUpsertCustomTabsForModule`. Keep replace helpers only for migrations, intentional admin clears, backup restore, or documented one-shot archives (e.g. Messaging log clear after soft-archiving).
- Frontend mutations must use `mutateAsync` and await success before closing forms or showing "saved" (`mms-data-layer.md`, `mms-module-architecture.md` §7).

## 6. Pagination & idempotency
- Work/list endpoints: require **`page` and `limit`** (shared `baseListQuerySchema` / module list schemas), with a server max cap on `limit`, stable sort — never unbounded directory dumps. Do not ship optional-`page` defaults that return the full tenant (`loadAllFn` ban — `mms-data-layer.md`).
- POSTs that enqueue jobs or send campaigns should accept an idempotency key (header or body) when retries are likely.
- Production error `message` fields must stay non-sensitive; keep verbose debug messages for development only.

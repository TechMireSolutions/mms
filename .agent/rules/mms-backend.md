---
trigger: model_decision
---

# MMS Backend API Architecture

## 1. Stack & Bootstrap

- **Stack**: Fastify 5, Drizzle ORM (`better-sqlite3`), Vitest, Zod (schemas), and ESM.
- **Boot Validation**: Hard-fail at startup if `JWT_SECRET` is missing. Data migrations (`001–003`) and expired `auth_artifacts` purging run during database initialization (`initDb()`).
- **Health Checks**:
  - `GET /health` (liveness).
  - `GET /ready` returns `200` if SQLite ping (`pingDatabase`) succeeds, else `503`.

---

## 2. Layering & Architecture

- **Flow**: `routes/*.ts` → `services/*.ts` → `db/database.ts` (using `dbClient.ts` singleton).
- **Decoupling**: Never import `better-sqlite3` or Drizzle drivers inside route handlers. Use Zod schemas in `validation/*Schemas.ts` with `parseRequest` for request body validation.
- **REST Endpoints**: Prefer dedicated resource endpoints (e.g. `/api/students`, `/api/contacts`) with validation schemas and RBAC checks over legacy bulk collection updates.
- **Ephemeral State**: OTP codes, handoff codes, and refresh token hashes must be persisted in SQLite (`auth_artifacts`), not in-memory maps.

---

## 3. Middleware & Security

### 3.1 `authenticateTenant` Middleware
Enforce this middleware on all tenant-scoped protected endpoints. Do not call raw `request.jwtVerify()` inside route files. The middleware validates:
1. Active JWT token from httpOnly cookie (`mms_access`) or Bearer header.
2. Tenant subdomain matches the request host.
3. User workspace subdomain (`workspaceSubdomain`) matches the resolved tenant subdomain.
4. Two-factor verification status (`twoFactorVerified` is not false).

### 3.2 Endpoint Constraints
- **Rate Limiting**: Rate-limit auth endpoints (`/login`, `/onboard`) to 10 requests/min.
- **RBAC**: Write operations must check permissions via `rbacService` or matrix checks.
- **Sync Limits**: `/api/db/sync` body size is capped by `MMS_SYNC_MAX_BODY_BYTES` (default 10 MiB) and execution time is capped by `MMS_SYNC_REQUEST_TIMEOUT_MS`.

---

## 4. Error Handling

Return uniform JSON error shapes on failure:
```json
{ "type": "validation_error", "message": "Reason details" }
```
- Types: `auth_required`, `invalid_credentials`, `forbidden`, `two_factor_required`, `not_found`, `validation_error`, `conflict`, `server_error`.
- Never expose stack traces or raw database exceptions to the client in production.

---

## 5. Testing & Verification

- Run tests using Fastify `inject()` with mock headers and cookies:
  ```bash
  cd apps/backend && pnpm test
  ```
- Important test suites cover: `/health` & `/ready`, login/refresh/2FA integration, and permission matrix tests. Puppeteer providers must be mocked; do not run Puppeteer in CI pipelines.

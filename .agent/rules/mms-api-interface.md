---
trigger: model_decision
---

# MMS API & Communications Interface

Governs the communications contract between the React SPA frontend and the Fastify backend, defining routing layers, payload schemas, fetch clients, and middleware configurations.

---

## 1. Client-Server Communication Flow
All frontend requests to backend resources must use `apiFetch` or `apiJson` from the `apiClient.ts` wrapper.
- **Session Transport**: Session states are managed entirely via browser cookies. The `apiClient` must include `credentials: 'include'`. Directly reading or parsing tokens via client `localStorage` is forbidden.
- **REST Trajectory**: New features must implement resource-specific endpoints (e.g. `GET /api/students`, `POST /api/contacts`) instead of relying on the generic collections sync API.
- **Data Types**: All data transfer objects (DTOs) and request body structures must be shared via the `@mms/shared` package.

---

## 2. Fastify Router & Layering
Backend route handlers must remain lean, delegating operations to the service layer:
```
request → route controller (routes/*.ts) → service handler (services/*.ts) → database model (db/*)
```
- **Controller Rules**: Route files must never import raw Drizzle pg pool drivers or database connections. All request bodies must validate against Zod validation schemas using the `parseRequest` service wrapper.
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

---

## 4. API Error Payloads
API errors must resolve to a uniform JSON payload format:
```json
{ "type": "validation_error", "message": "Development debug details" }
```
- **Error Classifications**: Standard types include `auth_required`, `invalid_credentials`, `forbidden`, `two_factor_required`, `not_found`, `validation_error`, `conflict`, and `server_error`.
- **Mask exceptions**: Never leak database exceptions, SQL failures, or raw Node stack traces to the client in production responses.
- **Client Handling**: The frontend traps query errors using `notify.error(t('errors.{type}'))` to translate types into localized strings.

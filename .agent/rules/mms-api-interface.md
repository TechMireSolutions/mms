---
trigger: model_decision
---

# MMS API & Communications Interface

**Workflow skills:** FE shell/`apiClient` → `mms-frontend` · Fastify routes/`inject()` → `mms-backend-api` · CSRF/cookies → `mms-backend-security`.

Governs the communications contract between the React SPA frontend and the Fastify backend — routing layers, payload schemas, fetch clients. Sessions/middleware recipes → `mms-auth-security.md`. Query policy → `mms-data-layer.md`.

---

## 1. Client-Server Communication Flow
All frontend requests to backend resources must use `apiFetch` or `apiJson` from the `apiClient.ts` wrapper.
- **Credentials**: Always `credentials: 'include'`. Cookie names, refresh rules, JWT trust → **`mms-auth-security.md`**.
- **AbortSignal**: Pass Query/`fetch` `signal` into `apiFetch` / `apiJson` — required for cancellation — `mms-data-layer.md`.
- **REST Trajectory**: New features must implement resource-specific endpoints (e.g. `GET /api/students`) instead of the generic collections sync API.
- **Data Types**: DTOs via `@mms/shared` only. Zod `parseRequest` / form schemas are the write boundary — do **not** enable parallel Fastify Ajv/JSON-Schema body validation for the same DTO.
- **Write DTOs**: Prefer Zod `.strict()` (or explicit `.strip()` with documented passthrough exceptions) so unknown keys never silently persist — `mms-form-architecture.md`.
- **Response shapes**: Derive serializers / type guards from the same `@mms/shared` Zod (e.g. `zod-to-json-schema` or parse-on-exit in tests) — still ban hand-forked Fastify JSON Schema DTOs.
- **Write vs read schemas**: Prefer dedicated write schemas for create/update (strip server-owned soft-delete fields) while response/list schemas may include them.
- **Destructive merges**: Atomic server transaction (`POST …/merge`) — ban FE-only dual delete+upsert.
- **429 handling**: Honor `Retry-After` — `mms-auth-security.md`.

---

## 2. Fastify Router & Layering
Backend route handlers must remain lean, delegating operations to the service layer:
```
request → route barrel / sub-routes (routes/**) → service handler (services/*.ts) → database model (db/*)
```
- **Controller Rules**: Route files must never import raw Drizzle pg pool drivers. Validate bodies with Zod via `parseRequest`.
- **Plugin encapsulation**: Register domain routes as Fastify plugins with stable public registration paths; prefer thin barrels + colocated `*Routes.ts` — `mms-structure-naming.md`.
- **Boot Guards**: Fail fast if `DATABASE_URL` or `JWT_SECRET` is missing.

## 3. Auth middleware (pointer)

Apply `authenticateTenant` / `authenticatePlatform` / subdomain resolution as specified in **`mms-auth-security.md`**. Do not call raw `jwtVerify()` in handlers. Platform namespaces and destructive reset → auth + `mms-ops-infrastructure.md`.

---

## 4. API Error Payloads
API errors must resolve to a uniform JSON payload format:
```json
{ "type": "validation_error", "message": "Development debug details" }
```
- **Error Classifications**: Standard types include `auth_required`, `invalid_credentials`, `forbidden`, `two_factor_required`, `not_found`, `validation_error`, `conflict`, and `server_error`. Platform clients: map against the full `@mms/shared` `PLATFORM_API_ERROR_TYPES` set — never invent ad-hoc platform `type` strings.
- **Mask exceptions**: Never leak database exceptions, SQL failures, or raw Node stack traces to the client in production responses.
- **Client Handling**: Tenant UI maps `type` via `t('errors.{type}')`. Platform UI maps via `mapPlatformAuthError` / `getPlatformErrorMessage` (`platformAuthErrors.ts` → `platform.*` keys).

---

## 5. Bulk PUT / collection replace semantics
Workspace bulk write endpoints (`PUT` that accept an array / `{ items }` payload) must **upsert** rows by composite tenant key (`bulkSave` + `conflictTarget`, merge-by-id helpers, or `bulkUpsertCustomTabsForModule`).
- **Allowed**: Insert new ids; update existing ids; leave rows absent from the payload untouched.
- **Bulk id lists**: Prefer shared `bulkIdsBodySchema` / `bulkStringIdsBodySchema` (`.max(500)`) for bulk-delete / bulk-restore — do not fork unbounded id arrays per module.
- **Contacts list/filter query**: Shared `contactsListQuerySchema` / `paginateContacts` — do not fork Messaging “select all with email” flags per route.
- **Forbidden on API bulk write paths**: `replaceForWorkspace` (or any wipe that deletes rows missing from the client payload). Prefer `bulkSave` / `bulkUpsertCustomTabsForModule`. Keep replace helpers only for migrations, intentional admin clears, backup restore, or documented one-shot archives.
- Frontend mutations must use `mutateAsync` and await success before closing forms — `mms-data-layer.md`, `mms-module-architecture.md` §7.

## 6. Pagination & idempotency
- HTTP contract: clients **should send** `page` and `limit` (shared `baseListQuerySchema`); omit may default safely. SQL page rules, cards/table parity, and `loadAllFn` ban → **`mms-data-layer.md`**.
- Target: tighten schemas to required `page` (+ `limit`) when clients are all migrated — do not claim Zod already requires them.
- POSTs that enqueue jobs or send campaigns should accept an idempotency key (header or body) when retries are likely.
- Production error `message` fields must stay non-sensitive; keep verbose debug messages for development only.

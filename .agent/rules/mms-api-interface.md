---
trigger: model_decision
description: Client-server REST interface contracts, apiClient fetch wrappers, Fastify router setups, and API payload definitions.
---

# MMS API & Communications Interface

**Workflow skills:** FE shell/`apiClient` → `mms-frontend` · Fastify routes/`inject()` → `mms-backend-api` · CSRF/cookies → `mms-backend-security`.

## 1. Client-Server Communication Flow

- **Sanctioned Clients:** All frontend API calls must use `apiClient` (`apiFetch` / `apiJson`) or `@ts-rest/react-query` contracts (`initTsrReactQuery`). Banned: `axios`, `node-fetch`, and `ws` for standard client communication.
- **Credentials & Cancellation:** Always `credentials: 'include'`. Pass Query `signal` to `apiFetch`; composite signals via `AbortSignal.any([signal, AbortSignal.timeout(ms)])`. Fastify route handlers propagate `request.raw.signal` to abort downstream DB queries on client disconnect.
- **Contract Boundary (SSOT):** DTOs defined in `packages/shared/src/contracts/*` using Zod 4 (`parseRequest` / `@ts-rest`). Never enable parallel Fastify JSON-Schema validation.
- **W3C Distributed Tracing:** Frontend generates W3C `traceparent` (v00); Fastify extracts into `AsyncLocalStorage` (`tenantStorage` via `AsyncContextFrame`) and echoes `traceparent` + `x-request-id` in responses.

## 2. Fastify Router & Layering

- **Clean Architecture Hierarchy:** Route/Contract router (`routes/**`) → Use Case (`{module}/use-cases/**`, pure DI) → Repository Interface (`{module}/repository/**`) → Drizzle Adapter. Controllers never import raw DB pools.
- **Streaming & Request Budgets:** Enforce `bodyLimit` and `requestTimeout`. Never buffer large uploads or datasets into memory (`Buffer.concat` ban); stream uploads via `@fastify/multipart` and exports via `node:stream` (`mms-performance.md`).
- **Outbound HTTP:** External backend fetches must use `AbortSignal.timeout(ms)`.

## 3. Auth Middleware & Isolation

- Enforce `authenticateTenant` / `authenticatePlatform`. Raw `jwtVerify()` in route handlers is strictly banned (`mms-auth-security.md`).

## 4. API Error Payloads & Status Codes

- **Uniform Error Envelope:** `{ "type": string, "message": string, "details": object }`.
- **Standard Classifications:** `auth_required` (401), `forbidden` (403), `not_found` (404), `timeout` (408), `conflict` (409), `validation_error` (422), `rate_limit_exceeded` (429), `server_error` (500). Platform routes map against `@mms/shared` `PLATFORM_API_ERROR_TYPES`.
- **Exception Masking:** Never leak raw database errors, SQL syntax, or stack traces in production responses. Tenant UI maps `type` via `t('errors.{type}')`.

## 5. Bulk PUT & Collection Semantics

- **Upsert Semantics:** Workspace bulk writes (`PUT` with arrays) must upsert by composite tenant key (`bulkSave` + `conflictTarget`); never wipe rows missing from the client payload (`replaceForWorkspace` banned on API paths).
- **ID Lists:** Use shared `bulkIdsBodySchema` (`.max(500)`). Await mutation resolution before closing modals.

## 6. Pagination, Idempotency & Concurrency

- **Pagination:** Clients send `page` and `limit` (default 25, max 100 via `baseListQuerySchema`). Unbounded dumps (`loadAllFn`) banned.
- **HTTP Caching:** Emit weak `ETag` and `Cache-Control: private, no-cache` on idempotent GETs; return `304 Not Modified` on `If-None-Match`.
- **Idempotency Standard:** State-changing POSTs accept `Idempotency-Key` bound to SHA-256 canonical body digest in Redis (24h TTL). Replays return `Idempotency-Replay: true`; payload mismatches reject with `409 Conflict`.
- **Optimistic Concurrency:** Contested single-row updates verify `updated_at` / version checks or return `409 Conflict`.

## 7. Soft-Delete & Restore REST Contracts

- **Endpoints:** `DELETE /:id` (soft-delete), `POST /:id/restore` (restore), `POST /bulk-delete`, `POST /bulk-restore`, `GET /?includeDeleted=true` (trash list).
- **Read Semantics:** Standard reads append `isNull(table.deletedAt)`. Detail reads with `?includeDeleted=true` require `canDeleteCollection`.
- **Query Parsing & Protection:** Parse `includeDeleted` with `isQueryFlagTrue()`. Write schemas must strip or reject client soft-delete fields.

## 8. Versioning, Deprecation & Contract Discipline

- **Additive by Default:** No `/v2` URL prefixes. Contract changes must be additive and land in the same commit across `@mms/shared`, Fastify, and React.
- **Deprecation:** Mark deprecated fields in `@mms/shared` before removal in a later release. Never repurpose existing field names.

## 9. Workflow & Output Speed Rules

- **Zero Output Bloat:** Output surgical diffs or targeted snippets only. Never rewrite entire files unless creating a new file from scratch. Omit conversational filler and post-code recaps.
- **Verification Gates:** Verify with `pnpm typecheck` and scoped tests before marking tasks done. If standards are modified, execute `bash .agent/scripts/sync-all.sh` and verify with `node scripts/verify-rules-integrity.mjs`.

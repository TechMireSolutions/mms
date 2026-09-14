---
description: Testing strategies (unit, API, E2E), logging hygiene, ErrorBoundary/Sentry, and frontend resilience. Health endpoints → mms-ops-infrastructure.
paths:
  - "packages/shared/**/*.test.ts"
  - "apps/backend/src/**/*.test.ts"
  - "apps/frontend/src/**/*.test.ts"
  - "apps/backend/vitest*.config.ts"
  - "apps/frontend/vitest*.config.ts"
  - "packages/shared/vitest*.config.ts"
  - "e2e/**"
  - "apps/frontend/src/components/ui/ErrorBoundary.tsx"
  - "apps/frontend/src/lib/clientErrorReporting.ts"
---

# MMS Testing & Observability

**Workflow skills:** PR/self-review gates → `mms-code-review` · axe/focus-return smoke → `mms-a11y-smoke` · FE/BE test recipes → `mms-frontend` / `mms-backend-api`.

Governs testing patterns, logging hygiene, error reporting, and frontend resilience. Health `/health` `/ready` and CI orchestration → **`mms-ops-infrastructure.md`**.

---

## 1. Testing Strategy & Environments
CI runs these as separate jobs — a green root `pnpm test` is **not** CI parity for DB/RLS work:

| What | Command |
|---|---|
| All workspace unit/integration suites | `pnpm test` (turbo) |
| Shared / backend coverage gates | `pnpm --filter @mms/shared test:coverage` · `pnpm --filter mms-backend test:coverage` |
| Backend DB integration (needs live PostgreSQL + `db:migrate`) | `pnpm --filter mms-backend run test:db` |
| Frontend suites | `pnpm --filter mms-frontend exec vitest run` |
| Browser E2E | `pnpm test:e2e` (root) or `pnpm --filter e2e-tests exec playwright test tests/<spec>` |
| i18n key parity | `pnpm run check:i18n` |

Suite layout (**Vitest 4**):
- **`@mms/shared`**: Unit tests for validation schemas (Zod 4), `@ts-rest` contracts, pure utilities, date/currency formatters, and permission calculations using Vitest 4.
- **`mms-backend`**: Integration tests utilizing Fastify 5 `inject()` and Vitest with in-memory repository mock fixtures (`vi.hoisted()`), as well as `@ts-rest/fastify` contract route verification. Cover tenant auth/RBAC/token rotation **and** apex platform auth/settings/workspaces allow+deny (wrong host → `403`, cookie session, `super_user` / permission gates, reset-database validation).
- **`mms-frontend`**: Client and hook tests run in a **`happy-dom`** environment (configured in `vitest.config.ts`) to support `localStorage` and DOM mocks. Mock network boundaries by stubbing the `apiClient` boundary (`apiFetch` / `apiJson`) or by testing `@ts-rest/react-query` contract hooks against MSW-style handlers — note **MSW is not currently a workspace dependency**, so do not import it without adding it to the catalog first (`mms-dependencies.md`). Ban ad-hoc `fetch` stubs that bypass `apiClient` credentials/error mapping.
- **E2E Playwright**: Critical UI flows in `e2e/tests/*.spec.ts` using **Playwright 1.62** (`@playwright/test`) and **Axe Core 4** (`@axe-core/playwright`): `platform-onboarding.spec.ts` (platform setup → tenant onboard → …); `tenant-settings-navigation.spec.ts`; `messaging-campaign.spec.ts`; `responsive-shell.spec.ts` (public apex + tenant login — overflow, 44px touch, RTL at 375/768/1440); `responsive-authenticated.spec.ts` (tenant bootstrap → AppLayout hamburger `< lg`, dashboard RTL/overflow, Work-route sweep with table wrappers). Run via `pnpm test:e2e` (root) or `pnpm --filter e2e-tests exec playwright test tests/<spec>.spec.ts` — `playwright` is a dependency of the `e2e-tests` workspace only, so `pnpm exec playwright test` from the repo root or from `apps/frontend` fails. Prefer `getByRole` / `getByLabel` user-centric queries; after bumping `@playwright/test`, run `pnpm exec playwright install`. Auth states may be seeded via scripts (e.g. `reset-platform-users.ts`) rather than recreating every login step.

### Test Quality & Architecture Invariants
1. **Deterministic Execution (Zero Skip Latches)**: Banned: `if (!isDbAvailable) return;` or conditional live database checks. All backend integration tests must execute deterministically in CI and local dev using in-memory repository mock fixtures and Fastify `inject()`.
2. **Assertion Specificity & Precision**:
   - ❌ Banned: Loose `toBeTruthy()`, `toBeFalsy()`, or generic `toBeDefined()` on knowable primitives, timestamps, or DOM nodes.
   - ✅ Required: Strict type checks (`typeof === 'string' | 'number'`), ISO timestamp format regexes (`/^\d{4}-\d{2}-\d{2}T/`), exact object structures, and typed DOM node instances (`toBeInstanceOf(HTMLInputElement)`, `toBeInstanceOf(HTMLButtonElement)`).
3. **Clean & Silent Terminal Output**: Negative tests or expected error scenarios (e.g. 500 error routes, PM2 process reload simulations) must spy on `console.error` / `console.warn` / `console.log` and configure `LOG_LEVEL = 'silent'` so stdout is 100% clean and free of stack trace noise.
4. **Isolation Hygiene**: Vitest configs run with `isolate: true` (the default; set explicitly in `apps/backend/vitest.config.ts`) and `pool: 'threads'`. Tests must therefore be hermetic anyway: use `clearMocks: true`, `restoreMocks: true`, and explicit fixture teardown — never rely on a previous test's module state.

### When to Write Tests
1. **Shared Package**: All new non-trivial pure function exports in `@mms/shared` must include unit tests.
2. **Regression Fixes**: Bug fixes in core validations or data merge logic require a regression unit test.
3. **Security Constraints**: New RBAC permissions or auth route rules require integration tests proving allow/deny (`inject()` with correct + wrong tenant).
5. **Coverage Floors**: Do not lower the enforced gates — frontend `lines 41 / statements 40 / functions 32 / branches 39` (`apps/frontend/vitest.config.ts`) and backend `lines 45 / branches 27` (`apps/backend/vitest.config.ts`). Raise them as coverage improves; lowering one requires the same review as deleting a test.
4. **Shared write DTOs**: FE↔BE contract coverage by parsing representative payloads with the same `@mms/shared` Zod (`inject()` and/or Vitest) — ban forked expected shapes.

*Banned*: Test runs must not make live calls to external providers (e.g. WhatsApp / Puppeteer) or commit secrets.

### E2E / Playwright Best Practices
- **Deterministic Auto-Waiting Assertions**: Strictly ban fixed `waitForTimeout` sleeps. Use web-first auto-waiting assertions (`expect(locator).toBeVisible()`, `expect(locator).toHaveCount(n)`) and explicit network/state wait helpers (`waitForResponse`, Query settling).
- **User-Centric Locators**: Always use `getByRole`, `getByLabel`, and `getByText` — internal DOM traversal and brittle CSS selector chains are forbidden.
- **Shared Session Fixtures**: Prefer Playwright project `storageState` / shared auth fixtures over re-running full login in every spec; keep seeding scripts for bootstrap only.
- **Tenant Context Parity**: Backend integration tests that touch tenant tables must set RLS context the same way as production (`withTenant` / `SET LOCAL`).
- **Layout & Responsiveness**: Keep responsive specs named in **`mms-ui-ux-design.md` §4** green after shell/RTL/touch/table changes.
- **a11y Smoke**: `e2e/tests/a11y-shell.spec.ts` runs `AxeBuilder` (via `e2e/helpers/a11y.ts`) across the app shell and a Work directory at 375px and 1440px in LTR+RTL and asserts no serious/critical violations. It runs in the standard `e2e` CI job — there is **no** path-conditional trigger, so treat it as an always-on gate and run it locally (`pnpm test:e2e tests/a11y-shell.spec.ts`) whenever `AppLayout`, `FormModal`, `Table`, or shared primitives change.
- CI orchestration + trace artifacts → **`mms-ops-infrastructure.md`**.

---

## 2. API errors (test expectations)

Assert production-safe JSON `{ type, message }` — never leak SQL/stack traces. Client mapping → `mms-api-interface.md`. Health probes used in deploy checks → `mms-ops-infrastructure.md`.

---

## 3. Telemetry & Logging Hygiene
- **AsyncLocalStorage Context**: Use `AsyncLocalStorage` (running on Node 24 `AsyncContextFrame` by default) for high-performance request ID and `traceId` context propagation across asynchronous call stacks without parameter drilling.
- **Structured Logging to stdout**: Emit JSON logs directly to `stdout` via high-throughput loggers (such as Pino) and let container orchestrators / PM2 handle log shipping instead of writing directly to log files within the application process.
- **Fastify Logger**: `LOG_LEVEL` env. Prefer structured fields: `requestId` / `reqId`, route, status, tenant subdomain when known — never PII, passwords, JWTs, OTP, or full collection payloads.
- **Tracing & OpenTelemetry Semantic Conventions (v1.26+)**: Standardize telemetry, span attributes, and structured log fields to OpenTelemetry v1.26+ conventions: HTTP (`http.request.method`, `http.response.status_code`, `url.path`, `network.protocol.version`), tenancy (`tenant.id`, `workspace.subdomain`), database operations (`db.system.name: "postgresql"`, `db.operation.name`), and errors (`error.type`). Scrub PII identically across logs and traces — do not invent divergent key formats.
- **Sentry**: Scrub PII; set tenant tag when available; do not double-report handled `notify.error` paths as unhandled exceptions.

---

## 4. Frontend Resilience
- **Error Boundaries**: Wrap lazy route modules and heavy Work/Reports/Setup tiers in the central `ErrorBoundary`. Query `isError` handles fetch failures — boundaries catch render crashes.
- **Graceful Failures**: `notify.error(t('errors.generic'))` — no silent `catch`.
- **TanStack Query States**: Render gracefully from Query `isPending`, `isFetching`, and `isError` flags.

---

## 5. Audit Trail & Cryptographic Verification Testing
- **Hash Chain Determinism**: Unit test cryptographic hash chaining (`hash_current = SHA-256(hash_previous + canonical_json(payload) + transaction_timestamp)`) using RFC 8785 canonical JSON against known test vectors to verify platform-independent reproducibility.
- **Verification Job Simulation**: Test the audit verifier (`startAuditVerificationScheduler` → `services/auditVerificationService.ts`) with synthetic broken chains, altered payloads, sequence gaps, and timestamp regressions. Assert that `verificationStatus` transitions to `BROKEN_CHAIN`, `TAMPERED`, or `SEQUENCE_GAP` and dispatches alerts.
- **Auditing the Auditor**: Integration test confirming that reading, querying, or exporting from audit tables emits an immutable audit event (`action_type: 'VIEW'`, `table_name: 'audit_trail_events'`).
- **Erasure Compliance Testing**: Test crypto-shredding (subject key destruction makes plaintext unrecoverable while preserving cryptographic chain links) and redact-and-append (verifies redaction appends `action_type: 'REDACT'` without recomputing or corrupting historical row hashes).

---

## 7. Client Error Surface, Correlation & Retry Policy

Logging an error is not the same as a user being able to report it. Every user-visible failure must be traceable to a server request without asking the user for a timestamp.

1. **Show the correlation id:** when a request fails, surface the response's `x-request-id` (or Sentry event id) in the error UI — a support message that carries an id beats one that carries a screenshot of a red toast. Server side, both `x-request-id` and `traceparent` are echoed (`mms-api-interface.md`).
2. **Boundary granularity is deliberate:** `ErrorBoundary` catches *render* crashes; a heavy Work/Reports/Setup tier and each lazy route are wrapped so one crash does not blank the whole shell. Fetch failures are Query `isError` states (`ErrorState` with retry + hint), never a thrown render error.
3. **Retry only what is safe:** TanStack Query retries idempotent `GET`s; mutations do **not** auto-retry (double-submitting a payment or a broadcast is worse than a visible failure). On `429`, honour `Retry-After` (`mms-auth-security.md`); on `5xx` for a mutation, surface a retry affordance rather than retrying silently.
4. **Offline / chunk-load failures are first-class:** a failed dynamic import (stale bundle after a deploy) must offer a reload path instead of an infinite spinner; treat it as a normal error state with a retry that reloads.
5. **No silent catches:** every `catch` either recovers, or reports through `notify.error(t(...))` and/or the error reporter — a swallowed error is invisible in production and untestable.
6. **Never double-report:** handled `notify.error` paths must not also be sent as unhandled exceptions to Sentry (see §3 Sentry rules); duplicates destroy alert signal.

## 6. Soft-Delete Verification Testing
Standardizes test verification for soft-deletable entities per `docs/soft-delete.md` · skill **`mms-soft-delete`**:
- **Single-Record 404 Verification**: Assert `GET /:id` returns `404 Not Found` for soft-deleted entities on standard reads, and `200 OK` on `?includeDeleted=true` when caller has `canDeleteCollection`.
- **Conflict Trap Verification (PostgreSQL 23505)**: Integration tests must verify that restoring a soft-deleted record whose recyclable unique key (`email`, `phone`, `employee_id`) has been claimed by another active record traps error `23505` and returns formatted `409 Conflict`.
- **Idempotency & State Latches**: Verify `DELETE /:id` on an already-archived row returns `404 Not Found`. Verify `POST /:id/restore` on an active row returns `404 Not Found`.
- **Partial Unique Index Active Re-registration**: Verify that creating a new active record with the same email/phone/slug as an archived row succeeds, proving the partial unique index `WHERE deleted_at IS NULL` works as intended.
- **Bulk Operation Count Integrity**: Verify `POST /bulk-delete` and `POST /bulk-restore` with mixed active/archived IDs report accurate `succeeded` and `failed` counts.
- **Session Revocation Invariant**: Integration test confirming that soft-deleting a user account immediately invalidates active sessions/refresh tokens in Redis and prevents subsequent authentication.
- **Drizzle Relational Query Guarding**: Verify relational queries (`db.query.table.findMany({ with: { children: true } })`) explicitly filter child relations so soft-deleted child rows are never leaked to active consumers.
- **Active Foreign Key Guarding**: Verify write mutations reject foreign key assignments pointing to soft-deleted entities (`deleted_at IS NOT NULL`).
- **Atomic Cascade & Lock Verification**: Verify cascade soft-delete marks children with `deleted_with_cascade = true` while parent row is locked (`FOR UPDATE`), and parent restore only restores cascade-deleted children.



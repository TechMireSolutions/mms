---
trigger: model_decision
---

# MMS Testing & Observability

Governs testing patterns (unit, API integration, E2E), system diagnostics, logging hygiene, error reporting, and frontend resilience in the Madrasa Management System (MMS).

---

## 1. Testing Strategy & Environments
`pnpm test` executes Vitest across the monorepo workspaces:
- **`@mms/shared`**: Unit tests for validation schemas, pure utilities, and permission calculations.
- **`mms-backend`**: Integration tests utilizing Fastify's `inject()`. Focus on authentication endpoints, token rotation, RBAC constraints, and tenant context resolution.
- **`mms-frontend`**: Client and hook tests run in a **`happy-dom`** environment (configured in `vitest.config.ts`) to support `localStorage` and DOM mocks. Mock API endpoints at the network boundary.
- **E2E Playwright**: Critical UI flows live in `e2e/tests/*.spec.ts` (e.g. `onboarding-login.spec.ts` for platform setup → tenant onboard → contacts → student → attendance; Contacts UI and navigation specs; `responsive-shell.spec.ts` for 375/768/1440 overflow, touch targets, and RTL). Run via `pnpm exec playwright test` or `pnpm test:e2e`. Prefer `getByLabel` / role queries; after bumping `@playwright/test`, run `pnpm exec playwright install`. Auth states may be seeded via scripts (e.g. `reset-platform-users.ts`) rather than recreating every login step.

### When to Write Tests
1. **Shared Package**: All new non-trivial pure function exports in `@mms/shared` must include unit tests.
2. **Regression Fixes**: Bug fixes in core validations or data merge logic require a regression unit test.
3. **Security Constraints**: New RBAC permissions or auth route rules require integration tests proving allow/deny (`inject()` with correct + wrong tenant).

*Banned*: Test runs must not make live calls to external providers (e.g. WhatsApp / Puppeteer) or commit secrets.

### E2E / Playwright
- Prefer `getByRole` / `getByLabel` — avoid brittle CSS selectors.
- Ban fixed `waitForTimeout` sleeps; wait on UI/network assertions instead.
- Backend integration tests that touch tenant tables must set RLS context the same way as production (`withTenantTransaction` / SET LOCAL).
- Layout/responsiveness regressions: keep `e2e/tests/responsive-shell.spec.ts` green after shell, RTL, or touch-target changes.

---

## 2. Diagnostics & Health Endpoints

### Readiness & Liveness
- **Liveness (`GET /health`)**: Confirms process up. Called by `AuthContext.checkAppState()` (must remain unauthenticated, fast, and non-blocking for UI).
- **Readiness (`GET /ready`)**: Returns `200` on database ping, `503` if PostgreSQL is down. Deployment scripts must curl `/ready` after PM2 restarts.

### JSON Error Schema
APIs must return a structured JSON response on failures:
```json
{ "type": "validation_error", "message": "Development debug detail" }
```
*Constraint*: Never leak raw PostgreSQL database queries, stack traces, or ORM errors in production payloads. The client maps `type` identifiers to localized translations using `t('errors.{type}')`.

---

## 3. Telemetry & Logging Hygiene
- **Fastify Logger**: Configurations reside under the `LOG_LEVEL` environment variable.
- **Failure Logging**: Record endpoint errors with context on the backend `onResponse` hook for `4xx`/`5xx` responses.
- **Secrets Protection**: NEVER log PII fields, collection payloads, user passwords, refresh tokens, JWTs, or OTP verification codes.
- **Sentry**: Scrub PII from client reports; set tenant tag when available; do not double-report handled `notify.error` paths as unhandled exceptions.

---

## 4. Frontend Resilience
- **Error Boundaries**: Wrap complex feature modules in the central `ErrorBoundary` component to isolate UI failures.
- **Graceful Failures**: Trap API failures using `notify.error(t('errors.generic'))` instead of silent `catch` blocks.
- **TanStack Query States**: Render error states dynamically based on Query's `isError` flags.

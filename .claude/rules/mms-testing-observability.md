---
description: Testing strategies (unit, API, E2E), logging hygiene, ErrorBoundary/Sentry, and frontend resilience. Health endpoints → mms-ops-infrastructure.
paths:
  - "packages/shared/**/*.test.ts"
  - "apps/backend/src/**/*.test.ts"
  - "apps/frontend/src/**/*.test.ts"
  - "**/*.spec.ts"
  - "apps/frontend/src/components/ui/ErrorBoundary.tsx"
---

# MMS Testing & Observability

**Workflow skills:** PR/self-review gates → `mms-code-review` · axe/focus-return smoke → `mms-a11y-smoke` · FE/BE test recipes → `mms-frontend` / `mms-backend-api`.

Governs testing patterns, logging hygiene, error reporting, and frontend resilience. Health `/health` `/ready` and CI orchestration → **`mms-ops-infrastructure.md`**.

---

## 1. Testing Strategy & Environments
`pnpm test` executes Vitest across the monorepo workspaces:
- **`@mms/shared`**: Unit tests for validation schemas, pure utilities, and permission calculations.
- **`mms-backend`**: Integration tests utilizing Fastify's `inject()`. Cover tenant auth/RBAC/token rotation **and** apex platform auth/settings/workspaces allow+deny (wrong host → `403`, cookie session, `super_user` / permission gates, reset-database validation).
- **`mms-frontend`**: Client and hook tests run in a **`happy-dom`** environment (configured in `vitest.config.ts`) to support `localStorage` and DOM mocks. Mock the network with **MSW** (or equivalent) at the boundary — ban ad-hoc `fetch` stubs that bypass `apiClient` credentials/error mapping.
- **E2E Playwright**: Critical UI flows in `e2e/tests/*.spec.ts`: `onboarding-login.spec.ts` (platform setup → tenant onboard → …); `tenant-settings-navigation.spec.ts`; `messaging-campaign.spec.ts`; `responsive-shell.spec.ts` (public apex + tenant login — overflow, 44px touch, RTL at 375/768/1440); `responsive-authenticated.spec.ts` (tenant bootstrap → AppLayout hamburger `< lg`, dashboard RTL/overflow, Work-route sweep with table wrappers). Run via `pnpm exec playwright test` or `pnpm test:e2e`. Prefer `getByLabel` / role queries; after bumping `@playwright/test`, run `pnpm exec playwright install`. Auth states may be seeded via scripts (e.g. `reset-platform-users.ts`) rather than recreating every login step.

### When to Write Tests
1. **Shared Package**: All new non-trivial pure function exports in `@mms/shared` must include unit tests.
2. **Regression Fixes**: Bug fixes in core validations or data merge logic require a regression unit test.
3. **Security Constraints**: New RBAC permissions or auth route rules require integration tests proving allow/deny (`inject()` with correct + wrong tenant).
4. **Shared write DTOs**: FE↔BE contract coverage by parsing representative payloads with the same `@mms/shared` Zod (`inject()` and/or Vitest) — ban forked expected shapes.

*Banned*: Test runs must not make live calls to external providers (e.g. WhatsApp / Puppeteer) or commit secrets.

### E2E / Playwright
- Prefer `getByRole` / `getByLabel` — avoid brittle CSS selectors.
- Prefer Playwright project `storageState` / shared auth fixtures over re-running full login in every spec; keep seeding scripts for bootstrap only.
- Ban fixed `waitForTimeout` sleeps; wait on UI/network assertions instead.
- Backend integration tests that touch tenant tables must set RLS context the same way as production (`withTenantTransaction` / SET LOCAL).
- Layout/responsiveness: keep specs named in **`mms-ui-ux-design.md` §7** green after shell/RTL/touch/table changes.
- **a11y**: Prefer `@axe-core/playwright` (or equivalent) smoke on shell + one Work directory at 375/1440; fail on serious/critical — when AppLayout / FormModal / Table primitives change.
- CI orchestration + trace artifacts → **`mms-ops-infrastructure.md`**.

---

## 2. API errors (test expectations)

Assert production-safe JSON `{ type, message }` — never leak SQL/stack traces. Client mapping → `mms-api-interface.md`. Health probes used in deploy checks → `mms-ops-infrastructure.md`.

---

## 3. Telemetry & Logging Hygiene
- **Fastify Logger**: `LOG_LEVEL` env. Prefer structured fields: `requestId` / `reqId`, route, status, tenant subdomain when known — never PII, passwords, JWTs, OTP, or full collection payloads.
- **Failure Logging**: Record `4xx`/`5xx` on `onResponse` with the same correlation id as the request.
- **Tracing (target)**: Prefer OpenTelemetry (or Fastify-compatible tracing) with `trace_id` / `span_id` alongside `requestId`; scrub PII the same as logs — do not invent a second log pipeline.
- **Sentry**: Scrub PII; set tenant tag when available; do not double-report handled `notify.error` paths as unhandled exceptions.

---

## 4. Frontend Resilience
- **Error Boundaries**: Wrap lazy route modules and heavy Work/Reports/Setup tiers in the central `ErrorBoundary`. Query `isError` handles fetch failures — boundaries catch render crashes.
- **Graceful Failures**: `notify.error(t('errors.generic'))` — no silent `catch`.
- **TanStack Query States**: Render from Query `isError` flags.

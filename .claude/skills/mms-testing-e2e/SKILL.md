---
name: mms-testing-e2e
description: Automated testing guide for MMS — Vitest unit/integration tests, Fastify inject() API tests, Playwright E2E specs, responsive/RTL smoke suites, and axe-core accessibility checks. Use when writing, running, or debugging frontend, backend, shared package, or end-to-end tests. Do NOT use for static TypeScript typechecks (use pnpm typecheck) or dependency auditing (use mms-dependency-upgrade).
license: Proprietary
metadata:
  owner: mms-platform
  last-verified: 2026-09-15
compatibility: Requires Node 24+, Playwright browsers (`pnpm exec playwright install`), and a live PostgreSQL for `test:db`.
allowed-tools: Read Grep Glob Bash(pnpm test) Bash(pnpm test:e2e) Bash(pnpm --filter *)
---

# MMS Testing & E2E Workflow

**Rules (norms SSOT):** `mms-testing-observability.md` · `mms-agent-universal.md` · `mms-completion-review.md` · `mms-ui-ux-design.md` §3–§4 · `mms-performance.md` §6. Accessibility smoke specifics → **`mms-a11y-smoke`**.

Comprehensive guide for writing, running, and debugging automated tests across the Madrasa Management System monorepo.

---

## 1. Monorepo Testing Tiers

| Layer | Framework & Tools | Scope & Target Files | Command |
|---|---|---|---|
| **Unit & Pure Helpers** | Vitest | `@mms/shared` utils, formatters, validation schemas (`packages/shared/**/*.test.ts`). | `pnpm --filter @mms/shared test` |
| **Backend Integration** | Vitest + Fastify `inject()` | Route schemas, `authenticateTenant`, in-memory mock repositories (`vi.hoisted()`), RBAC allow/deny tests (`apps/backend/**/*.test.ts`). | `pnpm --filter mms-backend test` |
| **Frontend Component & Hooks** | Vitest + React Testing Library | TanStack Query hooks, complex modals, state facades, form validation errors (`apps/frontend/**/*.test.tsx`). | `pnpm --filter mms-frontend test` |
| **Lightweight Scripts / CLIs** | `node:test` + `--experimental-strip-types` | Standalone test/utility scripts without upfront compilation. | `node --experimental-strip-types script.ts` |
| **End-to-End (E2E)** | Playwright | Full browser flows: auth, responsive shell (375/768/1440), RTL mirroring, navigation, directory CRUD. | `pnpm test:e2e` |
| **Accessibility Smoke** | axe-core via Playwright / Vitest | Serious and critical WCAG 2.1 AA violations on shells, dialogs, and tables. | `pnpm test:e2e tests/responsive-shell.spec.ts` |

---

## 2. Test Architecture & Quality Invariants

1. **Deterministic Execution (Zero Skip Latches)**:
   - ❌ Banned: `if (!isDbAvailable) return;` or conditional database checks in test suites.
   - ✅ Required: Backend integration tests must run deterministically via `vi.hoisted()` repository mocks and Fastify `inject()` without requiring a live PostgreSQL database connection.

2. **Assertion Specificity & Precision**:
   - ❌ Banned: `toBeTruthy()`, `toBeFalsy()`, or loose `toBeDefined()` on primitive values or DOM elements.
   - ✅ Required: Strict type checks (`typeof === 'string' | 'number'`), ISO timestamp regexes (`/^\d{4}-\d{2}-\d{2}T/`), and typed DOM node instances (`toBeInstanceOf(HTMLInputElement)`, `toBeInstanceOf(HTMLButtonElement)`).

3. **Clean & Silent Terminal Output**:
   - Spying on `console.error` / `console.warn` / `console.log` during expected 4xx/5xx or process error simulations to keep stdout clean.
   - Configure `LOG_LEVEL = 'silent'` in test setups.

4. **Worker Thread Isolation Hygiene**:
   - Non-isolated worker threads (`poolOptions: { threads: { isolate: false } }`) are used for fast execution.
   - Always specify `clearMocks: true`, `restoreMocks: true`, and clean up DOM containers / local storage in `afterEach()`.

---

## 3. Unit & Integration Testing (Vitest)

### Pure Utilities (`@mms/shared`) (Vitest)
- Every exported helper (`formatDate`, `formatMoney`, `parsePhoneNumber`, `buildWorkspaceBackupEnvelope`) must have exhaustive unit tests covering happy paths, null/undefined inputs, and boundary values.

### Backend Route & RLS Testing (Fastify `inject` & `withTenant`)
- **Fastify `inject()` Route Pattern**: Reference [examples/fastify-inject.test.ts](file:///Users/syedaalin/Documents/mms/.agent/skills/mms-testing-e2e/examples/fastify-inject.test.ts).
- **Multi-Tenant RLS Concurrency**: Reference [examples/tenant-rls-concurrency.test.ts](file:///Users/syedaalin/Documents/mms/.agent/skills/mms-testing-e2e/examples/tenant-rls-concurrency.test.ts).

### API & Client Mocking (Frontend)
- **Centralized API Mocking**: Mock `@/lib/apiClient` functions (`apiJson`, `apiFetch`) via Vitest spies and module mocks (`vi.mock('@/lib/apiClient')`).
- **TanStack Query Test Wrapper**: Wrap hook and component tests in a `QueryClientProvider` using an isolated `new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })` fixture.
- **Backend API Mocking**: Use Fastify `app.inject()` with `vi.hoisted()` in-memory repository fixtures for zero-dependency API route testing.

---

## 3. End-to-End Testing (Playwright)

### Responsive & Layout Smoke (`e2e/tests/responsive-shell.spec.ts`)
Run smoke tests across standard breakpoints without inserting a bare `--` before the path:
```bash
pnpm test:e2e tests/responsive-shell.spec.ts
pnpm test:e2e tests/responsive-authenticated.spec.ts
```

### E2E Best Practices & Invariants
1. **User-Centric Locators**: Always prefer `page.getByRole()`, `page.getByLabel()`, `page.getByPlaceholder()`, or `page.getByText()`. Ban brittle XPath or deep CSS selectors (`div > span > input`).
2. **Stable Test IDs**: Use `data-testid="..."` only when semantic accessible queries are insufficient.
3. **No Flaky Timeouts**: Avoid `page.waitForTimeout()`; use locator assertions (`expect(locator).toBeVisible()`, `expect(locator).toBeEnabled()`) that auto-retry.
4. **Auth Fixtures**: Reuse authenticated browser contexts via `e2e/helpers/tenantBootstrap.ts` rather than repeatedly walking through the login form on every test.
5. **RTL Verification**: Test RTL layout mirroring by mounting in Arabic/Urdu (`dir="rtl"`) and verifying no page-level horizontal scroll (`document.documentElement.scrollWidth <= window.innerWidth`).
6. **BiDi & Trash Specs**: Reference [examples/playwright-smoke.spec.ts](file:///Users/syedaalin/Documents/mms/.agent/skills/mms-testing-e2e/examples/playwright-smoke.spec.ts).

---

## 4. Soft-Delete Integration & Parity Testing (`docs/soft-delete.md` §12 · `mms-soft-delete`)

Every soft-deletable module must include integration tests (`inject()`) verifying:
1. **Single-Record 404 on Archived**: Standard `GET /:id` returns `404 Not Found` for soft-deleted entities; `GET /:id?includeDeleted=true` returns `200 OK` when caller has `canDeleteCollection`.
2. **Conflict Trap on Restore (PostgreSQL Error 23505)**: Restoring a record whose email/phone is currently assigned to another active record traps error `23505` and returns formatted `409 Conflict`.
3. **Idempotency & State Latches**: `DELETE /:id` on an already-archived row returns `404 Not Found`. `POST /:id/restore` on an active row returns `404 Not Found`.
4. **Partial Unique Index Verification**: Creating a new active entity with the same email/phone as an archived entity succeeds without a uniqueness violation (validating `WHERE deleted_at IS NULL` index).
5. **Bulk Counts Accuracy**: `POST /bulk-delete` and `POST /bulk-restore` with mixed active/archived IDs accurately return `{ succeeded: N, failed: M }`.
6. **Session Invalidation**: Soft-deleting a user account immediately invalidates active tokens in Redis and prevents subsequent authentication. Reference [examples/fastify-inject.test.ts](file:///Users/syedaalin/Documents/mms/.agent/skills/mms-testing-e2e/examples/fastify-inject.test.ts) and [examples/playwright-smoke.spec.ts](file:///Users/syedaalin/Documents/mms/.agent/skills/mms-testing-e2e/examples/playwright-smoke.spec.ts).

---

## 5. Verification Checklist Before Done

- [ ] All new pure utility functions in `@mms/shared` have corresponding Vitest unit tests.
- [ ] Backend route changes include `inject()` test cases for authentication (`401`), authorization (`403`), and validation failure (`422`/`400`).
- [ ] Soft-delete endpoints tested for 404 on archived GET, 409 on duplicate restore, 404 on re-delete, and bulk `{ succeeded, failed }` counts.
- [ ] Audit trail mutations verify RFC 8785 canonical JSON hashing and SHA-256 chain continuity.
- [ ] Scheduled audit verification (`runAuditVerificationJob`) tested for detecting broken chains, sequence gaps, and timestamp regressions.
- [ ] Access to audit logs/exports verified to emit immutable `VIEW` audit records (Auditing the Auditor).
- [ ] Form submission error states and touch targets are verified at 375px, 768px, and 1440px.
- [ ] Performance refactors guarantee 100% backward compatibility for API contracts, schemas, and props (`mms-performance.md`).
- [ ] Performance refactors explicitly document baseline bottleneck and quantified resource saved (CPU/RAM/DB/Bundle/DOM).
- [ ] `pnpm test` runs with 100% pass rate.



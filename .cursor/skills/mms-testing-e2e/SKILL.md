---
name: mms-testing-e2e
description: Automated testing guide for MMS — Vitest unit/integration tests, Fastify inject() API tests, Playwright E2E specs, responsive/RTL smoke suites, and axe-core accessibility checks. Use when writing, running, or debugging frontend, backend, shared package, or end-to-end tests. Do NOT use for static TypeScript typechecks (use pnpm typecheck) or dependency auditing (use mms-dependency-upgrade).
license: Proprietary
metadata:
  owner: mms-platform
  last-verified: 2026-09-24
compatibility: Requires Node 24+, Playwright browsers (pnpm --filter e2e-tests exec playwright install), and a live PostgreSQL for test:db.
allowed-tools: Read Grep Glob Bash(pnpm test) Bash(pnpm test:e2e) Bash(pnpm --filter *)
---

# MMS Testing & E2E Workflow

**Rules (norms SSOT):** `mms-testing-observability.mdc` · `mms-completion-review.mdc` · `mms-ui-ux-design.mdc` §3–§4. Accessibility smoke → `mms-a11y-smoke`.

Operational guide for writing, running, and debugging automated test suites across the monorepo.

## 1. Monorepo Testing Tiers & Commands

- **Shared Pure Helpers**: `pnpm --filter @mms/shared test` (Vitest unit tests for schemas, formatters, pure utils).
- **Backend API & RBAC**: `pnpm --filter mms-backend test` (Fastify `inject()` + `vi.hoisted()` in-memory repository mocks).
- **Database Integration**: `pnpm --filter mms-backend test:db` (Real PostgreSQL suite for RLS, transaction locks, and SQL aggregates).
- **Frontend Components & Hooks**: `pnpm --filter mms-frontend test` (Vitest + happy-dom for TanStack Query facades, modals, and forms).
- **Playwright E2E**: `pnpm test:e2e` (Full browser user journeys: auth, navigation, directory CRUD).
- **Responsive & A11y Smoke**: `pnpm test:e2e tests/responsive-shell.spec.ts` (375/768/1440px) and `tests/a11y-shell.spec.ts` (WCAG 2.1 AA via axe-core).

## 2. Testing Quality Invariants

- **Zero Skip Latches**: Never write conditional test skips (`if (!isDbAvailable) return;`). Tests must fail explicitly when required infrastructure is missing (`mms-testing-observability.mdc` §1).
- **Assertion Specificity**: Strict equality and type checks only. Loose `toBeTruthy()` or `toBeDefined()` on primitives or DOM elements are banned.
- **Clean Stdout**: Spy on `console.error`/`console.warn` during expected error simulations. Test configs set `LOG_LEVEL = 'silent'`.
- **Query Client Isolation**: Frontend tests wrap components in an isolated `new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })`.

## 3. Playwright E2E Best Practices

- **User-Centric Locators**: Use accessible locators (`page.getByRole()`, `page.getByLabel()`, `page.getByPlaceholder()`). Brittle XPath and deep CSS selectors (`div > span > input`) are banned.
- **Auto-Retrying Assertions**: Use `expect(locator).toBeVisible()` and `expect(locator).toBeEnabled()`. Ban hardcoded `page.waitForTimeout()`.
- **Auth Context Fixtures**: Reuse authenticated storage states (`e2e/helpers/tenantBootstrap.ts`) instead of submitting login forms in each spec.
- **RTL Mirroring**: Verify Arabic/Urdu (`dir="rtl"`) renders with zero page horizontal overflow (`document.documentElement.scrollWidth <= window.innerWidth`).

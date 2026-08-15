---
name: mms-testing-e2e
description: Automated testing guide for MMS — Vitest unit/integration tests, MSW (Mock Service Worker) API mocking, Playwright E2E specs, responsive/RTL smoke suites, and axe-core accessibility checks. Use when writing, running, or debugging frontend, backend, shared package, or end-to-end tests.
---

# MMS Testing & E2E Workflow

**Rules (norms SSOT):** `mms-testing-observability.mdc` · `mms-ui-ux-design.mdc` §7 · `mms-completion-review.mdc`

Comprehensive testing standard across unit, integration, network mocking, and Playwright E2E suites.

---

## 1. Testing Stack & Layers

| Layer | Framework & Tools | Scope & Target Files | Command |
|---|---|---|---|
| **Unit & Pure Helpers** | Vitest | `@mms/shared` utils, formatters, validation schemas (`packages/shared/**/*.test.ts`). | `pnpm test` |
| **Backend Integration** | Vitest + Fastify `inject()` | Route schemas, `authenticateTenant`, RLS isolation, RBAC allow/deny tests (`apps/backend/**/*.test.ts`). | `cd apps/backend && pnpm test` |
| **Frontend Component & Hooks** | Vitest + React Testing Library + MSW | TanStack Query hooks, complex modals, state facades, form validation errors (`apps/frontend/**/*.test.tsx`). | `cd apps/frontend && pnpm test` |
| **End-to-End (E2E)** | Playwright | Full browser flows: auth, responsive shell (375/768/1440), RTL mirroring, navigation, directory CRUD. | `pnpm test:e2e` |
| **Accessibility Smoke** | axe-core via Playwright / Vitest | Serious and critical WCAG 2.1 AA violations on shells, dialogs, and tables. | `pnpm test:e2e tests/responsive-shell.spec.ts` |

---

## 2. Unit & Integration Testing (Vitest)

### Pure Utilities (`@mms/shared`)
- Every exported helper (`formatDate`, `formatMoney`, `parsePhoneNumber`, `buildWorkspaceBackupEnvelope`) must have exhaustive unit tests covering happy paths, null/undefined inputs, and boundary values.

### Backend Route Testing (Fastify `inject`)
```typescript
test('POST /api/contacts rejects unauthenticated tenant', async () => {
  const res = await app.inject({
    method: 'POST',
    url: '/api/contacts',
    payload: { name: 'Test Contact' },
  });
  expect(res.statusCode).toBe(401);
});
```

### Network Mocking (MSW - Mock Service Worker)
- **Do not mock `fetch` manually with ad-hoc `vi.fn()`**: Use MSW HTTP handlers in `apps/frontend/src/test/mocks/handlers.ts` to simulate server responses and errors realistically at the network boundary.

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

---

## 4. Verification Checklist Before Done

- [ ] All new pure utility functions in `@mms/shared` have corresponding Vitest tests.
- [ ] Backend route changes include `inject()` test cases for authentication (`401`), authorization (`403`), and validation failure (`422`/`400`).
- [ ] Form submission error states and touch targets are verified at 375px, 768px, and 1440px.
- [ ] `pnpm test` runs with 100% pass rate.

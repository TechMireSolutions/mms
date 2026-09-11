---
name: mms-testing-e2e
description: Automated testing guide for MMS — Vitest unit/integration tests, MSW (Mock Service Worker) API mocking, Playwright E2E specs, responsive/RTL smoke suites, and axe-core accessibility checks. Use when writing, running, or debugging frontend, backend, shared package, or end-to-end tests.
---

# MMS Testing & E2E Workflow

**Rules (norms SSOT):** `mms-testing-observability.md` · `mms-ui-ux-design.md` §7 · `mms-performance.md` §6 (Safety & Verification) · `mms-completion-review.md`

Comprehensive testing standard across unit, integration, network mocking, and Playwright E2E suites.

---

## 1. Testing Stack & Layers

| Layer | Framework & Tools | Scope & Target Files | Command |
|---|---|---|---|
| **Unit & Pure Helpers** | Vitest | `@mms/shared` utils, formatters, validation schemas (`packages/shared/**/*.test.ts`). | `pnpm --filter @mms/shared test` |
| **Backend Integration** | Vitest + Fastify `inject()` | Route schemas, `authenticateTenant`, in-memory mock repositories (`vi.hoisted()`), RBAC allow/deny tests (`apps/backend/**/*.test.ts`). | `pnpm --filter mms-backend test` |
| **Frontend Component & Hooks** | Vitest + React Testing Library + MSW | TanStack Query hooks, complex modals, state facades, form validation errors (`apps/frontend/**/*.test.tsx`). | `pnpm --filter mms-frontend test` |
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

### Backend Route Testing (Fastify `inject` & `vi.hoisted`)
```typescript
import { describe, expect, it, vi } from 'vitest';
import { createServer } from '../server.js';

test('POST /api/contacts rejects unauthenticated tenant', async () => {
  const app = await createServer();
  const res = await app.inject({
    method: 'POST',
    url: '/api/contacts',
    payload: { name: 'Test Contact' },
  });
  expect(res.statusCode).toBe(401);
});
```

### Multi-Tenant RLS Concurrency Test
When adding tenant tables, ensure the shared connection pool prevents cross-tenant data leakage:
```typescript
// apps/backend/src/__tests__/tenantIsolation.test.ts
import { describe, it, expect } from 'vitest';
import { withTenant } from '../db/tenant-context.js';
import { students } from '../db/schema.js';

describe('Row Level Security Concurrency Test', () => {
  it('prevents cross-tenant data leakage within the shared connection pool', async () => {
    const tenantA = '00000000-0000-0000-0000-000000000001';
    const tenantB = '00000000-0000-0000-0000-000000000002';

    // Seed records
    await withTenant(tenantA, async (tx) => {
      await tx.insert(students).values({ name: 'Tenant A Student', tenantId: tenantA });
    });
    await withTenant(tenantB, async (tx) => {
      await tx.insert(students).values({ name: 'Tenant B Student', tenantId: tenantB });
    });

    // Concurrently query across both tenants with explicit column projection (no SELECT *)
    const [resultA, resultB] = await Promise.all([
      withTenant(tenantA, async (tx) => tx.select({ id: students.id, name: students.name, tenantId: students.tenantId }).from(students)),
      withTenant(tenantB, async (tx) => tx.select({ id: students.id, name: students.name, tenantId: students.tenantId }).from(students)),
    ]);

    expect(resultA.every((s) => s.tenantId === tenantA)).toBe(true);
    expect(resultB.every((s) => s.tenantId === tenantB)).toBe(true);
    expect(resultA.find((s) => s.name === 'Tenant B Student')).toBeUndefined();
    expect(resultB.find((s) => s.name === 'Tenant A Student')).toBeUndefined();
  });
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

### BiDi Visual Assertion Test (Playwright)
```typescript
// e2e/specs/bidi-layout.spec.ts
import { test, expect } from '@playwright/test';

test('verifies bidirectional layout and Nastaliq rendering parity', async ({ page }) => {
  // English LTR View
  await page.goto('/tenant/students?lang=en');
  await expect(page.locator('h1')).toHaveCSS('text-align', 'start');
  const enBox = await page.locator('[data-testid="search-input"]').boundingBox();

  // Urdu RTL View
  await page.goto('/tenant/students?lang=ur');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('h1')).toHaveCSS('font-family', /Noto Nastaliq Urdu/);
  
  // Verify mirrored search icon position
  const urBox = await page.locator('[data-testid="search-input"]').boundingBox();
  expect(urBox?.x).not.toEqual(enBox?.x);
});
```

---

## 4. Soft-Delete Integration & Parity Testing (`docs/soft-delete.md` §12)

Every soft-deletable module must include integration tests (`inject()`) verifying:
1. **Single-Record 404 on Archived**: Standard `GET /:id` returns `404 Not Found` for soft-deleted entities; `GET /:id?includeDeleted=true` returns `200 OK` when caller has `canDeleteCollection`.
2. **Conflict Trap on Restore (PostgreSQL Error 23505)**: Restoring a record whose email/phone is currently assigned to another active record traps error `23505` and returns formatted `409 Conflict`.
3. **Idempotency & State Latches**: `DELETE /:id` on an already-archived row returns `404 Not Found`. `POST /:id/restore` on an active row returns `404 Not Found`.
4. **Partial Unique Index Verification**: Creating a new active entity with the same email/phone as an archived entity succeeds without a uniqueness violation (validating `WHERE deleted_at IS NULL` index).
5. **Bulk Counts Accuracy**: `POST /bulk-delete` and `POST /bulk-restore` with mixed active/archived IDs accurately return `{ succeeded: N, failed: M }`.
6. **Session Invalidation**: Soft-deleting a user account immediately invalidates active tokens in Redis and prevents subsequent authentication.

```typescript
// Fastify inject() soft-delete integration pattern
test('DELETE /api/contacts/:id soft-deletes and subsequent GET returns 404', async () => {
  const app = await createServer();
  const deleteRes = await app.inject({
    method: 'DELETE',
    url: `/api/contacts/${contactId}`,
    headers: { host: 'tenant.localhost' },
    cookies: { mms_tenant_session: validSessionCookie },
  });
  expect(deleteRes.statusCode).toBe(200);

  // Standard GET returns 404
  const getRes = await app.inject({
    method: 'GET',
    url: `/api/contacts/${contactId}`,
    headers: { host: 'tenant.localhost' },
    cookies: { mms_tenant_session: validSessionCookie },
  });
  expect(getRes.statusCode).toBe(404);
});
```

### Playwright E2E Trash & Undo Verification
```typescript
test('soft-delete row hides item, shows Undo toast, and trash toggle syncs URL', async ({ page }) => {
  await page.goto('/tenant/students');

  // 1. Single delete triggers optimistic hide + Undo toast
  await page.locator('[data-testid="row-actions-btn"]').first().click();
  await page.locator('[data-testid="archive-row-btn"]').click();
  await expect(page.locator('text=Record archived')).toBeVisible();
  await expect(page.locator('button:has-text("Undo")')).toBeVisible();

  // 2. Toggle trash syncs URL to ?view=trash and preserves filters
  await page.locator('[data-testid="search-input"]').fill('Ali');
  await page.locator('[data-testid="module-trash-toggle"]').click();
  await expect(page).toHaveURL(/.*view=trash.*/);
  await expect(page.locator('[data-testid="search-input"]')).toHaveValue('Ali');

  // 3. Add CTA hidden in trash mode
  await expect(page.locator('[data-testid="add-record-btn"]')).toBeHidden();
});
```

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



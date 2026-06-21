import { test, expect } from '@playwright/test';
import { provisionE2ETenant, type E2ETenantSession } from './helpers/tenantApi';
import {
  isBackendReachable,
  isFrontendReachable,
  loginTenantInBrowser,
  tenantAppUrl,
} from './helpers/tenantUi';

test.describe('Contacts Work tab (browser)', () => {
  let tenant: E2ETenantSession;

  test.beforeAll(async ({ request }) => {
    if (!(await isBackendReachable())) {
      test.skip(true, 'Backend not reachable — set E2E_API_URL or start backend');
      return;
    }
    if (!(await isFrontendReachable())) {
      test.skip(true, 'Frontend not reachable — start Vite on :5173 or set E2E_BASE_URL');
      return;
    }

    tenant = await provisionE2ETenant(request);
  });

  test('login → Contacts Work shows directory shell', async ({ page }) => {
    test.skip(!tenant, 'Tenant not provisioned');

    await loginTenantInBrowser(page, tenant);
    await page.goto(tenantAppUrl(tenant, '/contacts'), { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /^Contacts$/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /Add Contact/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Work$/i }).first()).toBeVisible();
    await expect(page.locator('p:has-text("No contacts yet"):visible')).toBeVisible({ timeout: 10_000 });
  });
});




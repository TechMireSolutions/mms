import { test, expect } from '@playwright/test';
import { assertModuleTierSmoke } from '../helpers/moduleTiers.js';
import {
  bootstrapAuthenticatedTenant,
  resetPlatformUsers,
  type TenantBootstrapCredentials,
} from '../helpers/tenantBootstrap.js';

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'e2e-test-jwt-secret-key-at-least-32-chars-long';

/**
 * Smoke: Organization chart shell + Tasks Work/Reports/Setup tiers after tenant bootstrap.
 * Blueprint apply runs during onboard; org chart tabs and tasks module must mount.
 */
test.describe.serial('Organization + Tasks module smoke', { tag: '@local-only' }, () => {
  const subdomain = `orgtasks${Date.now()}`;
  const credentials: TenantBootstrapCredentials = {
    subdomain,
    tenantOrigin: `http://${subdomain}.localhost:5173`,
    adminEmail: `admin@${subdomain}.com`,
    adminPassword: 'Madrasa@1234',
    changedAdminPassword: 'Madrasa@5678',
    platformEmail: `platform-${subdomain}@test.com`,
    platformPassword: 'Pa$$w0rd123',
  };

  test.beforeAll(() => {
    resetPlatformUsers();
  });

  test('loads Organization chart tabs and Tasks module tiers', async ({ page }) => {
    test.setTimeout(180_000);

    await bootstrapAuthenticatedTenant(page, credentials);
    await expect(page.locator('h1')).toContainText('Assalamu Alaikum');

    await page.goto(`${credentials.tenantOrigin}/organization`);
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByRole('tab', { name: /Hierarchy|Chart|tree/i })
        .or(page.getByRole('button', { name: /Hierarchy|Chart|Locations|Blueprints/i }))
        .first(),
    ).toBeVisible({ timeout: 20_000 });

    await assertModuleTierSmoke(page, '/tasks', credentials.tenantOrigin);
  });
});

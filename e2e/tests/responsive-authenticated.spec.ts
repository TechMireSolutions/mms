import { expect, test } from '@playwright/test';
import { loginTenant } from '../helpers/moduleTiers.js';
import {
  RESPONSIVE_VIEWPORTS,
  assertNoHorizontalOverflow,
  assertPrimaryControlsMeetTouchTarget,
  forceRtl,
  waitForToastsToClear,
} from '../helpers/responsive.js';
import {
  bootstrapAuthenticatedTenant,
  resetPlatformUsers,
} from '../helpers/tenantBootstrap.js';

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'e2e-test-jwt-secret-key-at-least-32-chars-long';

const subdomain = `resp${Date.now()}`;
const tenantOrigin = `http://${subdomain}.localhost:5173`;
const adminEmail = `admin@${subdomain}.com`;
const temporaryPassword = 'Madrasa@1234';
const permanentPassword = 'Madrasa@5678';
const platformEmail = `platform-resp-${Date.now()}@test.com`;
const platformPassword = 'Pa$$w0rd123';

test.describe.serial('Authenticated tenant shell responsive layout', () => {
  test.beforeAll(() => {
    resetPlatformUsers();
  });

  test('bootstrap platform admin and tenant workspace', async ({ page }) => {
    test.setTimeout(180_000);
    await bootstrapAuthenticatedTenant(page, {
      subdomain,
      tenantOrigin,
      adminEmail,
      adminPassword: temporaryPassword,
      changedAdminPassword: permanentPassword,
      platformEmail,
      platformPassword,
    });
  });

  for (const viewport of RESPONSIVE_VIEWPORTS) {
    test(`${viewport.name} (${viewport.width}px) dashboard has no horizontal overflow`, async ({ page }) => {
      test.setTimeout(60_000);
      await loginTenant(page, tenantOrigin, adminEmail, permanentPassword);
      await page.setViewportSize(viewport);
      await page.goto(`${tenantOrigin}/`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1')).toContainText('Assalamu Alaikum', { timeout: 20_000 });
      await assertNoHorizontalOverflow(page);
    });

    test(`${viewport.name} (${viewport.width}px) RTL dashboard has no horizontal overflow`, async ({ page }) => {
      test.setTimeout(60_000);
      await loginTenant(page, tenantOrigin, adminEmail, permanentPassword);
      await page.setViewportSize(viewport);
      await page.goto(`${tenantOrigin}/`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1')).toContainText('Assalamu Alaikum', { timeout: 20_000 });
      await forceRtl(page);
      await assertNoHorizontalOverflow(page);
    });

    test(`${viewport.name} (${viewport.width}px) shell chrome meets 44px and mobile nav rules`, async ({ page }) => {
      test.setTimeout(60_000);
      await loginTenant(page, tenantOrigin, adminEmail, permanentPassword);
      await page.setViewportSize(viewport);
      await page.goto(`${tenantOrigin}/`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('#main-content')).toBeVisible({ timeout: 20_000 });

      const openMenu = page.getByRole('button', { name: 'Open navigation menu' });

      if (viewport.width < 1024) {
        await expect(openMenu).toBeVisible();
        const menuBox = await openMenu.boundingBox();
        expect(menuBox, 'open-menu bounding box').toBeTruthy();
        expect(menuBox!.width).toBeGreaterThanOrEqual(44);
        expect(menuBox!.height).toBeGreaterThanOrEqual(44);

        await waitForToastsToClear(page);
        await openMenu.click();
        const drawer = page.getByRole('dialog');
        await expect(drawer).toBeVisible();
        await assertPrimaryControlsMeetTouchTarget(page, { within: '[role="dialog"]' });
        await page.keyboard.press('Escape');
        await expect(drawer).toBeHidden({ timeout: 5_000 });
      } else {
        await waitForToastsToClear(page);
        await expect(openMenu).toBeHidden();
        await assertPrimaryControlsMeetTouchTarget(page, { within: 'header' });
      }

      await assertNoHorizontalOverflow(page);
    });
  }
});

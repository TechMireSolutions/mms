import { expect, test, type Page } from '@playwright/test';
import {
  RESPONSIVE_VIEWPORTS,
  assertNoHorizontalOverflow,
  assertPrimaryControlsMeetTouchTarget,
  forceRtl,
  waitForAppShellReady,
} from '../helpers/responsive.js';

const APEX_READY = '#platform-setup-email, #platform-email, a[href*="login"], button:has-text("Sign")';

const PUBLIC_ROUTES: readonly { path: string; ready?: string }[] = [
  { path: '/', ready: APEX_READY },
  { path: '/platform/forgot-password', ready: 'form, input[type="email"], #email, button' },
  { path: '/contacts' },
];

const TENANT_LOGIN_URL = 'http://responsive-shell.localhost:5173/login';

async function openPublicRoute(page: Page, url: string, ready?: string): Promise<void> {
  await page.goto(url);
  await page.waitForLoadState('domcontentloaded');
  await waitForAppShellReady(page);
  if (ready) {
    await expect(page.locator(ready).first()).toBeVisible({ timeout: 20_000 });
  }
}

test.describe('Unknown tenant host redirect', { tag: '@smoke' }, () => {
  test('hard-redirects unregistered subdomain to apex tenant-not-found', async ({ page }) => {
    const missingSubdomain = `missing${Date.now()}`;
    await page.goto(`http://${missingSubdomain}.localhost:5173/settings`).catch(() => {});
    await page.waitForURL(
      (url) => {
        const parsed = new URL(url);
        return (
          parsed.hostname === 'localhost' &&
          parsed.pathname === '/tenant-not-found' &&
          parsed.searchParams.get('subdomain') === missingSubdomain
        );
      },
      { timeout: 20_000 },
    );
    await expect(page.getByRole('heading', { name: 'Tenant does not exist' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(`${missingSubdomain}.localhost`, { exact: true })).toBeVisible();
  });
});

test.describe('Public shell responsive layout', { tag: '@smoke' }, () => {
  for (const viewport of RESPONSIVE_VIEWPORTS) {
    for (const route of PUBLIC_ROUTES) {
      test(`${viewport.name} (${viewport.width}px) ${route.path} has no horizontal overflow`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await openPublicRoute(page, route.path, route.ready);
        await assertNoHorizontalOverflow(page);
      });

      test(`${viewport.name} (${viewport.width}px) RTL ${route.path} has no horizontal overflow`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await openPublicRoute(page, route.path, route.ready);
        await forceRtl(page);
        await assertNoHorizontalOverflow(page);
      });
    }

    test(`${viewport.name} (${viewport.width}px) apex primary controls meet 44px touch target`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await openPublicRoute(page, '/', APEX_READY);
      await assertPrimaryControlsMeetTouchTarget(page);
    });

    test(`${viewport.name} (${viewport.width}px) tenant login controls meet 44px touch target`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await openPublicRoute(page, TENANT_LOGIN_URL);
      await assertPrimaryControlsMeetTouchTarget(page);
    });

    test(`${viewport.name} (${viewport.width}px) tenant login shell has no horizontal overflow`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await openPublicRoute(page, TENANT_LOGIN_URL);
      await assertNoHorizontalOverflow(page);
    });

    test(`${viewport.name} (${viewport.width}px) RTL tenant login shell has no horizontal overflow`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await openPublicRoute(page, TENANT_LOGIN_URL);
      await forceRtl(page);
      await assertNoHorizontalOverflow(page);
    });
  }
});

import { expect, test, type Page } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
] as const;

const PUBLIC_ROUTES = [
  { path: '/', ready: '#platform-setup-email, #platform-email, a[href*="login"], button:has-text("Sign")' },
  { path: '/platform/forgot-password', ready: 'form, input[type="email"], #email, button' },
  { path: '/contacts', ready: 'main, [role="main"], body' },
] as const;

const TENANT_LOGIN_URL = 'http://responsive-shell.localhost:5173/login';

async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const layout = await page.evaluate(() => ({
    bodyWidth: document.body.scrollWidth,
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));

  expect(layout.bodyWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
}

async function forceRtl(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
    document.body.setAttribute('dir', 'rtl');
    document.querySelectorAll('[dir]').forEach((element) => {
      element.setAttribute('dir', 'rtl');
    });
  });
}

async function assertPrimaryControlsMeetTouchTarget(page: Page): Promise<void> {
  const undersized = await page.evaluate(() => {
    const selectors = [
      'button:not([aria-hidden="true"])',
      'a[href]:not([aria-hidden="true"])',
      '[role="button"]:not([aria-hidden="true"])',
    ].join(',');

    return Array.from(document.querySelectorAll(selectors))
      .filter((element) => {
        if (
          element.classList.contains('tsqd-open-btn') ||
          element.closest('#tsqd-root, .tsqd-parent-container, [data-testid="react-query-devtools"]')
        ) {
          return false;
        }
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || style.pointerEvents === 'none') {
          return false;
        }
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        // Skip visually decorative text links inside dense paragraphs.
        if (element.tagName === 'A' && !element.closest('nav, header, form, [role="dialog"], [role="banner"]')) {
          return false;
        }
        return rect.height < 44 || (rect.width < 44 && rect.height < 44 && element.textContent?.trim().length === 0);
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          text: (element.textContent || '').trim().slice(0, 40),
          aria: element.getAttribute('aria-label'),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      });
  });

  expect(undersized, `Undersized controls: ${JSON.stringify(undersized)}`).toEqual([]);
}

test.describe('Public shell responsive layout', () => {
  for (const viewport of VIEWPORTS) {
    for (const route of PUBLIC_ROUTES) {
      test(`${viewport.name} (${viewport.width}px) ${route.path} has no horizontal overflow`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(route.path);
        await page.waitForLoadState('domcontentloaded');
        await expect(page.locator(route.ready).first()).toBeVisible({ timeout: 20_000 });
        await assertNoHorizontalOverflow(page);
      });

      test(`${viewport.name} (${viewport.width}px) RTL ${route.path} has no horizontal overflow`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(route.path);
        await page.waitForLoadState('domcontentloaded');
        await expect(page.locator(route.ready).first()).toBeVisible({ timeout: 20_000 });
        await forceRtl(page);
        await assertNoHorizontalOverflow(page);
      });
    }

    test(`${viewport.name} (${viewport.width}px) primary controls meet 44px touch target`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await expect(
        page.locator('#platform-setup-email, #platform-email, a[href*="login"], button:has-text("Sign")').first(),
      ).toBeVisible({ timeout: 20_000 });
      await assertPrimaryControlsMeetTouchTarget(page);
    });

    test(`${viewport.name} (${viewport.width}px) tenant login shell has no horizontal overflow`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(TENANT_LOGIN_URL);
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('body')).toBeVisible({ timeout: 20_000 });
      await assertNoHorizontalOverflow(page);
    });

    test(`${viewport.name} (${viewport.width}px) RTL tenant login shell has no horizontal overflow`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(TENANT_LOGIN_URL);
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('body')).toBeVisible({ timeout: 20_000 });
      await forceRtl(page);
      await assertNoHorizontalOverflow(page);
    });
  }
});

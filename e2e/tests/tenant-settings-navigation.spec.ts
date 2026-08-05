import { test, expect } from '@playwright/test';

/**
 * Apex navigation smoke. Authenticated tenant settings are covered in
 * `onboarding-login.spec.ts` after onboard.
 */
test.describe('Tenant Navigation and Module Tab Switching E2E Flow', { tag: '@smoke' }, () => {
  test('should render platform home page and expose a sign-in path', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const pageTitle = await page.title();
    expect(pageTitle).toBeDefined();
    expect(pageTitle.length).toBeGreaterThan(0);

    // First-run setup or login — either is a valid apex landing.
    const setupOrLogin = page.locator('#platform-setup-email, #platform-email, a[href*="login"], button:has-text("Sign")');
    await expect(setupOrLogin.first()).toBeVisible({ timeout: 20_000 });
  });
});

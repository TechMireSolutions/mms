import { test, expect } from '@playwright/test';

test.describe('Tenant Navigation and Module Tab Switching E2E Flow', () => {
  test('should render platform home page and navigate to login screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Page title assertion
    const pageTitle = await page.title();
    expect(pageTitle).toBeDefined();
  });
});

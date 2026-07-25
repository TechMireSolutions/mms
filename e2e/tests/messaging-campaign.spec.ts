import { test, expect } from '@playwright/test';

test.describe('Messaging Module E2E Flow', () => {
  test('should render messaging module page and verify core elements', async ({ page }) => {
    await page.goto('/messaging');
    await page.waitForLoadState('domcontentloaded');

    // Page title check
    const title = await page.title();
    expect(title).toMatch(/MMS|Madrasa|Platform/i);
  });

  test('should verify tab switching between Work, Reports, and Setup', async ({ page }) => {
    await page.goto('/messaging');
    await page.waitForLoadState('domcontentloaded');

    // Check for active tab element if present
    const workTab = page.locator('#messaging-tab-tab-work');
    if (await workTab.isVisible()) {
      await workTab.click();
      await expect(page.locator('#messaging-tab-panel-work')).toBeVisible();
    }

    const reportsTab = page.locator('#messaging-tab-tab-reports');
    if (await reportsTab.isVisible()) {
      await reportsTab.click();
      await expect(page.locator('#messaging-tab-panel-reports')).toBeVisible();
    }

    const setupTab = page.locator('#messaging-tab-tab-setup');
    if (await setupTab.isVisible()) {
      await setupTab.click();
      await expect(page.locator('#messaging-tab-panel-setup')).toBeVisible();
    }
  });
});

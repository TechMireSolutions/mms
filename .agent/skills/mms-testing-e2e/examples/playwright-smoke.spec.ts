import { test, expect } from '@playwright/test';

test.describe('E2E Smoke & Layout Verification', () => {
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
});

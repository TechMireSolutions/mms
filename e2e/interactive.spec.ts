import { test, expect } from '@playwright/test';

test('apex landing is interactive', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const overlay = page.locator('.fixed.inset-0');
  const overlayVisible =
    (await overlay.count()) > 0 ? await overlay.first().isVisible() : false;
  expect(overlayVisible).toBe(false);

  const bodyPointerEvents = await page.evaluate(
    () => getComputedStyle(document.body).pointerEvents,
  );
  expect(bodyPointerEvents).not.toBe('none');

  const interactive = page.locator('a, button');
  await expect(interactive.first()).toBeVisible({ timeout: 10_000 });

  const errorsWithoutFavicon = errors.filter(
    (e) => !e.includes('favicon') && !e.includes('401') && !e.includes('Unauthorized'),
  );
  expect(errorsWithoutFavicon).toEqual([]);
});


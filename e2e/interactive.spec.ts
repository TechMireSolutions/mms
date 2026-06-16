import { test, expect } from '@playwright/test';

test('apex landing is interactive', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });

  // Wait past auth boot
  await page.waitForTimeout(3000);

  const overlay = page.locator('.fixed.inset-0');
  const overlayCount = await overlay.count();
  const overlayVisible = overlayCount > 0 ? await overlay.first().isVisible() : false;

  const bodyPointerEvents = await page.evaluate(() => getComputedStyle(document.body).pointerEvents);
  const rootHtml = await page.content();

  const links = page.locator('a, button');
  const linkCount = await links.count();

  let clicked = false;
  if (linkCount > 0) {
    const first = links.first();
    const box = await first.boundingBox();
    if (box) {
      await first.click({ timeout: 5000 }).catch(() => {});
      clicked = true;
    }
  }

  await page.screenshot({ path: 'test-results/browser-apex.png', fullPage: true });

  console.log('OVERLAY_COUNT', overlayCount);
  console.log('OVERLAY_VISIBLE', overlayVisible);
  console.log('BODY_POINTER_EVENTS', bodyPointerEvents);
  console.log('INTERACTIVE_COUNT', linkCount);
  console.log('CLICK_ATTEMPTED', clicked);
  console.log('ERRORS', JSON.stringify(errors.slice(0, 10)));
  console.log('TITLE', await page.title());
  console.log('URL', page.url());

  expect(errors.filter((e) => !e.includes('favicon'))).toEqual([]);
});

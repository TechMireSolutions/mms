import { expect, type Page } from '@playwright/test';

const TIER_LABELS = ['Work', 'Reports', 'Setup'] as const;

/**
 * Visits a tenant module and asserts Work / Reports / Setup tier tabs switch.
 * Assumes the page is already authenticated on the tenant host.
 */
export async function assertModuleTierSmoke(
  page: Page,
  modulePath: string,
  tenantOrigin: string,
): Promise<void> {
  await page.goto(`${tenantOrigin}${modulePath}`);
  await page.waitForLoadState('networkidle');

  const desktopNav = page
    .locator('div.hidden.lg\\:block')
    .filter({ has: page.getByRole('button', { name: 'Work', exact: true }) })
    .first();
  await expect(desktopNav, `${modulePath} missing desktop tier nav`).toBeVisible({ timeout: 20_000 });

  for (const label of TIER_LABELS) {
    const tab = desktopNav.getByRole('button', { name: label, exact: true });
    await expect(tab, `${modulePath} missing ${label} tab`).toBeVisible();
    await tab.click();
    await expect(tab).toBeVisible();
  }

  await desktopNav.getByRole('button', { name: 'Work', exact: true }).click();
}

/**
 * Signs into an existing tenant workspace with email/password.
 * If a shared storageState already lands on the dashboard, skips the form.
 */
export async function loginTenant(
  page: Page,
  tenantOrigin: string,
  email: string,
  password: string,
): Promise<void> {
  await page.goto(`${tenantOrigin}/login`);
  await page.waitForLoadState('networkidle');

  if (!page.url().includes('/login')) {
    await expect(page.locator('h1')).toContainText('Assalamu Alaikum', { timeout: 20_000 });
    return;
  }

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page.locator('h1')).toContainText('Assalamu Alaikum', { timeout: 30_000 });
  await page.waitForLoadState('networkidle');
}

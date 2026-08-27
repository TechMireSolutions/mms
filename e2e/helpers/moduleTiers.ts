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
  await page.waitForLoadState('domcontentloaded');

  const desktopNav = page
    .locator('div.hidden.lg\\:block')
    .filter({
      has: page
        .getByRole('tab', { name: 'Work', exact: true })
        .or(page.getByRole('button', { name: 'Work', exact: true })),
    })
    .first();
  await expect(desktopNav, `${modulePath} missing desktop tier nav`).toBeVisible({ timeout: 20_000 });

  for (const label of TIER_LABELS) {
    const tab = desktopNav
      .getByRole('tab', { name: label, exact: true })
      .or(desktopNav.getByRole('button', { name: label, exact: true }));
    await expect(tab, `${modulePath} missing ${label} tab`).toBeVisible();
    await tab.click();
    await expect(tab).toBeVisible();
  }

  await desktopNav
    .getByRole('tab', { name: 'Work', exact: true })
    .or(desktopNav.getByRole('button', { name: 'Work', exact: true }))
    .click();
}

export async function completeInstitutionSetupIfPresent(page: Page): Promise<void> {
  const institutionHeading = page.locator('h1', { hasText: /Institution Profile|Complete Institution/i });
  const dashboardHeading = page.locator('h1', { hasText: 'Assalamu Alaikum' });

  // Wait for either the dashboard or the setup page to appear after login
  const isSetup = await institutionHeading
    .or(dashboardHeading)
    .first()
    .waitFor({ state: 'visible', timeout: 30_000 })
    .then(async () => await institutionHeading.isVisible())
    .catch(() => false);

  if (isSetup) {
    const taglineInput = page.locator('#setup-tagline');
    await taglineInput.waitFor({ state: 'visible', timeout: 10_000 });

    if (!(await taglineInput.inputValue())) {
      await taglineInput.fill('Excellence in Islamic Education');
    }
    const emailInput = page.locator('#setup-email');
    if (!(await emailInput.inputValue())) {
      await emailInput.fill('admin@madrasa.org');
    }
    const phoneInput = page.locator('#setup-phone');
    if (!(await phoneInput.inputValue())) {
      await phoneInput.fill('03001234567');
    }
    const addressInput = page.locator('#setup-addressLine1');
    if (!(await addressInput.inputValue())) {
      await addressInput.fill('123 Madrasa Street');
    }
    const cityInput = page.locator('#setup-city');
    if (!(await cityInput.inputValue())) {
      await cityInput.fill('London');
    }
    const postalCodeInput = page.locator('#setup-postalCode');
    if (!(await postalCodeInput.inputValue())) {
      await postalCodeInput.fill('E1 6AN');
    }
    const countryInput = page.locator('#setup-country');
    if (!(await countryInput.inputValue())) {
      await countryInput.fill('United Kingdom');
    }
    await page.click('button[type="submit"]');
    await expect(dashboardHeading).toBeVisible({ timeout: 30_000 });
    await page.waitForLoadState('domcontentloaded');
  }
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
  await page.waitForLoadState('domcontentloaded');

  const emailInput = page.locator('input[name="email"]');
  const dashboardHeading = page.locator('h1', { hasText: 'Assalamu Alaikum' });

  const isLoginForm = await emailInput
    .or(dashboardHeading)
    .first()
    .waitFor({ state: 'visible', timeout: 25_000 })
    .then(() => emailInput.isVisible())
    .catch(() => false);

  if (!isLoginForm) {
    await completeInstitutionSetupIfPresent(page);
    await expect(dashboardHeading).toBeVisible({ timeout: 10_000 });
    return;
  }

  await emailInput.fill(email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  await completeInstitutionSetupIfPresent(page);

  await expect(dashboardHeading).toBeVisible({ timeout: 30_000 });
  await page.waitForLoadState('domcontentloaded');
}

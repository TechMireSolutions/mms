import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, type Page } from '@playwright/test';
import { loginTenant } from './moduleTiers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, '../../apps/backend');

export interface TenantBootstrapCredentials {
  subdomain: string;
  tenantOrigin: string;
  adminEmail: string;
  /** Temporary password set during onboarding (forced change on first login). */
  adminPassword: string;
  /** Permanent password chosen on the force-password-change screen. */
  changedAdminPassword: string;
  platformEmail: string;
  platformPassword: string;
}

/**
 * Clears platform users so first-run setup is always available.
 */
export function resetPlatformUsers(): void {
  execSync('npx tsx src/scripts/reset-platform-users.ts', {
    cwd: backendDir,
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || 'test',
      JWT_SECRET: process.env.JWT_SECRET || 'e2e-test-jwt-secret-key-at-least-32-chars-long',
    },
  });
}

/**
 * Legacy OTP helper. Platform setup now logs in directly without OTP verification.
 */
export async function completePlatformSetupOtp(page: Page): Promise<void> {
  const otpInputs = page.locator('[id^="platform-otp-"]');
  if (await otpInputs.first().isVisible().catch(() => false)) {
    const devHint = page.getByRole('status').filter({ hasText: /\b\d{6}\b/ });
    await expect(devHint).toBeVisible({ timeout: 10_000 });
    const devHintText = await devHint.textContent();
    const codeMatch = devHintText?.match(/\b\d{6}\b/);
    if (codeMatch) {
      for (let index = 0; index < codeMatch[0].length; index += 1) {
        await page.fill(`#platform-otp-${index}`, codeMatch[0][index]);
      }
      await page.click('button[type="submit"]');
    }
  }
}

/**
 * Creates a platform admin, onboards one workspace, completes forced password change,
 * and leaves the browser on the authenticated tenant dashboard.
 */
export async function bootstrapAuthenticatedTenant(
  page: Page,
  credentials: TenantBootstrapCredentials,
): Promise<void> {
  const {
    subdomain,
    tenantOrigin,
    adminEmail,
    adminPassword,
    changedAdminPassword,
    platformEmail,
    platformPassword,
  } = credentials;

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('#platform-setup-email');

  await page.fill('#platform-setup-name', 'Platform Admin');
  await page.fill('#platform-setup-email', platformEmail);
  await page.fill('#platform-setup-password', platformPassword);
  await page.click('button[type="submit"]');

  const platformConsoleHeading = page.locator('h1', { hasText: 'Platform console' });
  const signInEmailInput = page.locator('#platform-email');
  await platformConsoleHeading.or(signInEmailInput).first().waitFor({ state: 'visible', timeout: 25_000 });

  if (await signInEmailInput.isVisible()) {
    await signInEmailInput.fill(platformEmail);
    await page.fill('#platform-password', platformPassword);
    await page.click('button[type="submit"]');
  }

  await expect(platformConsoleHeading).toBeVisible({ timeout: 20_000 });

  await page.click('a[href="/onboarding"]');
  await page.waitForURL('**/onboarding');
  await page.waitForSelector('#wizard-step-title');

  await page.fill('#onboarding-name', 'Responsive Shell Madrasa');
  await page.fill('#onboarding-tagline', 'Responsive coverage');
  await page.selectOption('#onboarding-country', 'United Kingdom');
  await page.fill('#onboarding-subdomain', subdomain);
  await expect(page.locator('text=Your URL:')).toBeVisible();
  await page.click('button:has-text("Continue")');
  await page.waitForSelector('#firstName');

  await page.fill('#firstName', 'Resp');
  await page.fill('#lastName', 'Admin');
  await page.fill('#email', adminEmail);
  await page.fill('#password', adminPassword);
  await page.fill('#confirmPassword', adminPassword);
  await page.check('#terms');
  await page.click('button:has-text("Create workspace")');

  await expect(page.locator('h1')).toContainText('Platform console', { timeout: 30_000 });

  await page.goto(`${tenantOrigin}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.fill('input[name="email"]', adminEmail);
  await page.fill('input[name="password"]', adminPassword);
  await page.click('button[type="submit"]');

  await page.waitForURL(`${tenantOrigin}/force-password-change`);
  await expect(page.locator('h1')).toContainText(/temporary password|Change your/i, {
    timeout: 20_000,
  });
  await page.fill('#current-password', adminPassword);
  await page.fill('#new-password', changedAdminPassword);
  await page.fill('#confirm-password', changedAdminPassword);
  await page.click('button[type="submit"]');

  await page.waitForURL(`${tenantOrigin}/login`);
  await loginTenant(page, tenantOrigin, adminEmail, changedAdminPassword);
}

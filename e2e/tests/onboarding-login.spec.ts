import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Platform Onboarding and Tenant Login E2E Flow', () => {
  // Generate a unique subdomain for each test run to prevent tenant conflicts in the database
  const subdomain = `testmadrasa${Date.now()}`;
  const adminEmail = `admin@${subdomain}.com`;
  const adminPassword = 'Madrasa@123';
  const platformEmail = 'platform@test.com';
  const platformPassword = 'Pa$$w0rd123';

  test.beforeAll(async () => {
    console.log('Resetting platform users database state...');
    const backendDir = path.resolve(__dirname, '../../apps/backend');
    try {
      const output = execSync('npx tsx src/reset-platform-users.ts', { cwd: backendDir, encoding: 'utf8' });
      console.log(output);
    } catch (err: any) {
      console.error('Failed to reset platform users:', err.stdout || err.stderr || err.message);
      throw err;
    }
  });

  test('should setup platform, onboard a new madrasa, and log in to the new tenant dashboard', async ({ page }) => {
    // 1. Navigate to the platform apex landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait until the setup screen input field is visible (since we reset the DB, setup is always needed)
    await page.waitForSelector('#platform-setup-email');
    console.log('Platform setup screen detected. Performing first-run setup...');
    
    // Fill out registration form
    await page.fill('#platform-setup-name', 'Platform Admin');
    await page.fill('#platform-setup-email', platformEmail);
    await page.fill('#platform-setup-password', platformPassword);
    await page.click('button[type="submit"]');

    // Wait for verify OTP screen
    await page.waitForSelector('role=status');
    
    // Extract the dev code OTP from the developer hint in the DOM
    const devHintText = await page.locator('role=status').textContent();
    const codeMatch = devHintText?.match(/\b\d{6}\b/);
    if (!codeMatch) {
      throw new Error(`Failed to extract verification code from hint text: "${devHintText}"`);
    }
    const otpCode = codeMatch[0];
    console.log(`Extracted setup verification OTP: ${otpCode}`);

    // Fill in OTP inputs
    for (let i = 0; i < otpCode.length; i++) {
      await page.fill(`#platform-otp-${i}`, otpCode[i]);
    }

    // Submit verification OTP (which completes setup and redirects to login)
    await page.click('button[type="submit"]');
    
    // 2. Wait for redirect to Platform Sign-In screen
    await page.waitForSelector('#platform-email');
    console.log('Redirected to Platform Sign-In screen. Logging in with new platform credentials...');
    
    // Fill out login credentials
    await page.fill('#platform-email', platformEmail);
    await page.fill('#platform-password', platformPassword);
    await page.click('button[type="submit"]');

    // Wait until either the Platform Console is loaded or an error alert appears
    console.log('Waiting for login to complete or error to appear...');
    try {
      await page.waitForFunction(() => {
        const h1 = document.querySelector('h1');
        const alert = document.querySelector('[role="alert"]');
        return (h1 && h1.textContent?.includes('Platform console')) || alert;
      }, null, { timeout: 15000 });
    } catch (waitErr) {
      console.log('Wait condition timed out. Checking current heading...');
    }

    // Check if error is visible
    const loginErrorLocator = page.locator('[role="alert"]');
    if (await loginErrorLocator.isVisible()) {
      const errText = await loginErrorLocator.textContent();
      throw new Error(`Platform login failed with error message: "${errText}"`);
    }

    // 3. Verify we are in the Platform Console
    await page.waitForSelector('h1');
    const headerText = await page.locator('h1').textContent();
    console.log(`Platform landing page loaded with heading: "${headerText}"`);
    await expect(page.locator('h1')).toContainText('Platform console');

    // 4. Click the "Create Madrasa" button to open the Onboarding Wizard
    await page.click('a[href="/onboarding"]');
    await page.waitForURL('**/onboarding');
    
    // The step title is in an h2 element with id="wizard-step-title"
    await page.waitForSelector('#wizard-step-title');
    await expect(page.locator('#wizard-step-title')).toContainText('Institution & theme');

    // 5. Fill out step 1 (Institution details)
    await page.fill('#onboarding-name', 'Test Madrasa');
    await page.fill('#onboarding-tagline', 'Learn with excellence');
    await page.fill('#onboarding-country', 'United Kingdom');
    await page.fill('#onboarding-subdomain', subdomain);

    // Wait for the URL preview to be shown to ensure state synced
    await expect(page.locator('text=Your URL:')).toBeVisible();

    // Click "Continue" to proceed to step 2 (AdminSetup)
    await page.click('button:has-text("Continue")');
    await page.waitForSelector('#firstName');

    // 6. Fill out step 2 (AdminSetup details)
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'Admin');
    await page.fill('#email', adminEmail);
    await page.fill('#password', adminPassword);
    await page.fill('#confirmPassword', adminPassword);
    await page.check('#terms');

    // Click "Create Workspace" to complete onboarding
    await page.click('button:has-text("Create Workspace")');
    await page.waitForLoadState('networkidle');

    // Wait for success screen
    await page.waitForSelector('h1');
    await expect(page.locator('h1')).toContainText('Welcome to Test Madrasa!');

    // 7. Navigate directly to the new tenant subdomain login page
    const tenantLoginUrl = `http://${subdomain}.localhost:5173/login`;
    console.log(`Navigating to the new tenant login page: ${tenantLoginUrl}`);
    await page.goto(tenantLoginUrl);
    await page.waitForLoadState('networkidle');

    // 8. Fills out the tenant login form
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', adminPassword);
    await page.click('button[type="submit"]');

    // 9. Wait for navigation to dashboard (Vite home route redirects/resolves to `/`)
    await page.waitForURL(`http://${subdomain}.localhost:5173/`);
    await page.waitForLoadState('networkidle');

    // 10. Assert welcome banner displays the logged-in user name
    await expect(page.locator('h1')).toContainText('Assalamu Alaikum, Test Admin');
  });
});

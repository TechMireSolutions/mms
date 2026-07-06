import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure JWT_SECRET is set for backend DB CLI scripts in CI/test environments
process.env.JWT_SECRET = process.env.JWT_SECRET || 'e2e-test-jwt-secret-key-at-least-32-chars-long';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Platform Onboarding and Tenant Login E2E Flow', () => {
  // Generate a unique subdomain for each test run to prevent tenant conflicts in the database
  const subdomain = `testmadrasa${Date.now()}`;
  const adminEmail = `admin@${subdomain}.com`;
  const adminPassword = 'Madrasa@1234'; // Must be at least 12 characters per password policy
  const changedAdminPassword = 'Madrasa@5678'; // Must be at least 12 characters per password policy
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

  test('should setup platform, onboard a new madrasa, force the first password change, and log in to the new tenant dashboard', async ({ page }) => {
    // Add console log listeners to capture errors in the page
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('error')) {
        console.log(`[BROWSER CONSOLE ERROR] ${msg.text()}`);
      } else {
        console.log(`[BROWSER CONSOLE] ${msg.text()}`);
      }
    });
    page.on('pageerror', err => {
      console.log(`[BROWSER UNHANDLED EXCEPTION] ${err.message}`);
    });

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

    // Click "Create workspace" to complete onboarding
    await page.click('button:has-text("Create workspace")');
    
    // Wait for platform home redirect or error
    console.log('Waiting for platform home redirect or onboarding error...');
    try {
      await page.waitForFunction(() => {
        const h1 = document.querySelector('h1');
        const alert = document.querySelector('[role="alert"]');
        return (h1 && h1.textContent?.includes('Platform console')) || alert;
      }, null, { timeout: 20000 });
    } catch (waitErr) {
      console.log('Wait condition timed out.');
    }

    const onboardingError = page.locator('[role="alert"]');
    if (await onboardingError.isVisible()) {
      const errText = await onboardingError.textContent();
      throw new Error(`Onboarding failed with error: "${errText}"`);
    }

    await expect(page).toHaveURL('http://localhost:5173/');
    await expect(page.locator('h1')).toContainText('Platform console');

    // 7. Navigate directly to the new tenant subdomain login page
    const tenantLoginUrl = `http://${subdomain}.localhost:5173/login`;
    console.log(`Navigating to the new tenant login page: ${tenantLoginUrl}`);
    await page.goto(tenantLoginUrl);
    await page.waitForLoadState('networkidle');

    // 8. Fill out the tenant login form with the temporary onboarding password
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', adminPassword);
    await page.click('button[type="submit"]');

    // 9. First login must force a password change before the tenant app is usable
    await page.waitForURL(`http://${subdomain}.localhost:5173/force-password-change`);
    await expect(page.locator('h1')).toContainText('Change your temporary password');
    await page.fill('#current-password', adminPassword);
    await page.fill('#new-password', changedAdminPassword);
    await page.fill('#confirm-password', changedAdminPassword);
    await page.click('button[type="submit"]');

    // 10. Password change signs the tenant admin out so they can sign in with new credentials
    await page.waitForURL(`http://${subdomain}.localhost:5173/login`);
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', changedAdminPassword);
    await page.click('button[type="submit"]');

    // 11. Wait for navigation to dashboard (Vite home route redirects/resolves to `/`)
    await page.waitForURL(`http://${subdomain}.localhost:5173/`);
    await page.waitForLoadState('networkidle');

    // 12. Assert welcome banner displays the logged-in user name
    await expect(page.locator('h1')).toContainText('Assalamu Alaikum, Test Admin');

    // 13. Navigate to Contacts Page
    console.log('Navigating to Contacts Page...');
    await page.goto(`http://${subdomain}.localhost:5173/contacts`);
    await page.waitForLoadState('networkidle');

    // 14. Create a new Contact
    await page.click('button:has-text("Add Contact")');
    await page.waitForSelector('#firstName input');
    
    // Fill first name and last name
    await page.fill('#firstName input', 'Jane');
    await page.fill('#lastName input', 'Doe');

    // Fill gender
    await page.click('#gender button');
    await page.click('role=option[name="Female"]');

    // Fill date of birth and trigger blur
    await page.fill('#dob input[type="text"]', '15/05/2015');
    await page.locator('#dob input[type="text"]').blur();

    await page.click('button:has-text("Save")');
    
    // Wait for the modal dialog to close completely
    await expect(page.getByRole('dialog', { name: 'Add New Contact' })).toBeHidden();
    
    // Verify contact Jane Doe is listed and visible in the active contacts tab
    await page.waitForSelector('tbody tr:has-text("Jane Doe") >> visible=true');
    console.log('Contact Jane Doe successfully created.');

    // Create Father Contact (John Doe)
    console.log('Creating contact John Doe...');
    await page.click('button:has-text("Add Contact")');
    await page.waitForSelector('#firstName input');
    await page.fill('#firstName input', 'John');
    await page.fill('#lastName input', 'Doe');
    await page.click('#gender button');
    await page.click('role=option[name="Male"]');
    await page.click('button:has-text("Save")');
    await expect(page.getByRole('dialog', { name: 'Add New Contact' })).toBeHidden();
    await page.waitForSelector('tbody tr:has-text("John Doe") >> visible=true');
    console.log('Contact John Doe successfully created.');

    // 13. Navigate to Students Page
    console.log('Navigating to Students Page...');
    await page.goto(`http://${subdomain}.localhost:5173/students`);
    await page.waitForLoadState('networkidle');

    // 14. Create a new Student linking to the Contact
    await page.click('button:has-text("Add Student")');
    await page.waitForSelector('input[placeholder="Search contacts…"]');
    await page.fill('input[placeholder="Search contacts…"]', 'Jane Doe');
    const janeOption = page.locator('button').filter({ hasText: 'Jane Doe' }).filter({ hasNotText: 'Create' }).first();
    await janeOption.waitFor({ state: 'visible' });
    await janeOption.dispatchEvent('mousedown');

    // Link Father guardian (John Doe)
    await page.fill('div:has(> span:text-is("Father")) input[placeholder="Search contacts…"]', 'John Doe');
    const johnOption = page.locator('button').filter({ hasText: 'John Doe' }).filter({ hasNotText: 'Create' }).first();
    await johnOption.waitFor({ state: 'visible' });
    await johnOption.dispatchEvent('mousedown');
    
    // Wait for the next GR number query to resolve and populate the input field
    await expect(page.locator('input[placeholder="e.g. 0001-2026"]')).not.toHaveValue('');
    
    await page.click('button:has-text("Register student")');

    // Wait for the modal dialog to close completely
    await expect(page.getByRole('dialog', { name: 'Register student' })).toBeHidden();

    // 15. Verify Student successfully created and listed
    await page.waitForSelector('tbody tr:has-text("Jane Doe") >> visible=true');
    console.log('Student Jane Doe successfully created and linked.');

    // 16. Seed a test class and enrollment for Jane Doe via the backend script
    console.log('Seeding session, class, and enrollment for student...');
    const backendDir = path.resolve(__dirname, '../../apps/backend');
    try {
      const output = execSync(`npx tsx src/seed-test-class.ts ${subdomain}`, { cwd: backendDir, encoding: 'utf8' });
      console.log(output);
    } catch (err: any) {
      console.error('Failed to seed class/enrollment:', err.stdout || err.stderr || err.message);
      throw err;
    }

    // 17. Navigate to Attendance Page
    console.log('Navigating to Attendance Page...');
    await page.goto(`http://${subdomain}.localhost:5173/attendance`);
    await page.waitForLoadState('networkidle');

    // 18. Select Class in filters
    await page.waitForSelector('#filter-class >> visible=true');
    await page.selectOption('#filter-class >> visible=true', { label: 'Morning Quran Class' });
    await page.waitForLoadState('networkidle');

    // 19. Verify Jane Doe is listed in the roster
    await page.waitForSelector('text=Jane Doe >> visible=true');
    console.log('Jane Doe is visible in the class attendance list.');

    // 20. Click submit attendance button
    await page.click('button:has-text("Submit Attendance") >> visible=true');

    // 21. Assert submitted success badge is visible
    await page.waitForSelector('text=Submitted >> visible=true');
    console.log('Attendance successfully marked and submitted.');
  });
});

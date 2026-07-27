import { test, expect, type Page } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { assertModuleTierSmoke, loginTenant } from '../helpers/moduleTiers.js';

// Ensure JWT_SECRET and NODE_ENV are set for backend DB CLI scripts in CI/test environments
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'e2e-test-jwt-secret-key-at-least-32-chars-long';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function waitForToastOverlayToClear(page: Page, context: string): Promise<void> {
  await page
    .waitForFunction(() => !document.querySelector('.fixed [data-state="open"]'), null, { timeout: 10000 })
    .catch(() => console.log(`Toast overlay still visible ${context}.`));
}

test.describe.serial('Platform Onboarding and Tenant Login E2E Flow', () => {
  // Generate a unique subdomain for each test run to prevent tenant conflicts in the database
  const subdomain = `testmadrasa${Date.now()}`;
  const adminEmail = `admin@${subdomain}.com`;
  const adminPassword = 'Madrasa@1234'; // Must be at least 12 characters per password policy
  const changedAdminPassword = 'Madrasa@5678'; // Must be at least 12 characters per password policy
  const platformEmail = 'platform@test.com';
  const platformPassword = 'Pa$$w0rd123';
  const tenantOrigin = `http://${subdomain}.localhost:5173`;

  test.beforeAll(async () => {
    console.log('Resetting platform users database state...');
    const backendDir = path.resolve(__dirname, '../../apps/backend');
    try {
      const output = execSync('npx tsx src/scripts/reset-platform-users.ts', { cwd: backendDir, encoding: 'utf8' });
      console.log(output);
    } catch (err: unknown) {
      const errorObj = err as { stdout?: string; stderr?: string; message?: string };
      console.error('Failed to reset platform users:', errorObj.stdout || errorObj.stderr || errorObj.message);
      throw err;
    }
  });

  test('should setup platform, onboard a new madrasa, force the first password change, and log in to the new tenant dashboard', async ({ page }) => {
    test.setTimeout(120_000);
    const browserFailures: string[] = [];

    // Add console log listeners to capture errors in the page
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('error')) {
        console.log(`[BROWSER CONSOLE ERROR] ${msg.text()}`);
      } else {
        console.log(`[BROWSER CONSOLE] ${msg.text()}`);
      }
    });
    page.on('pageerror', err => {
      browserFailures.push(`Unhandled browser exception: ${err.message}`);
      console.log(`[BROWSER UNHANDLED EXCEPTION] ${err.message}`);
    });
    page.on('requestfailed', request => {
      const failure = request.failure()?.errorText ?? 'unknown network error';
      if (failure === 'net::ERR_ABORTED') return;
      browserFailures.push(`Request failed: ${request.method()} ${request.url()} (${failure})`);
    });
    page.on('response', response => {
      if (response.status() >= 500) {
        const url = response.url();
        if (
          response.status() === 502 &&
          (url.includes('/api/platform/auth/setup/status') || url.includes('/api/public/deployment-config'))
        ) {
          return;
        }
        browserFailures.push(`HTTP ${response.status()}: ${response.request().method()} ${url}`);
      }
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
    await page.selectOption('#onboarding-country', 'United Kingdom');
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
    await page.waitForSelector('input[name="firstName"]');
    
    // Fill first name and last name
    await page.fill('input[name="firstName"]', 'Jane');
    await page.fill('input[name="lastName"]', 'Doe');

    // Fill gender
    await page.click('#cf-new-gender');
    await page.click('role=option[name="Female"]');

    // Fill date of birth and trigger blur
    await page.fill('input[name="dob"]', '15/05/2015');
    await page.locator('input[name="dob"]').blur();

    // Phone required for Messaging recipient eligibility
    const janeDialog = page.getByRole('dialog', { name: 'Add New Contact' });
    await janeDialog.getByRole('tab', { name: 'Phones' }).click();
    await janeDialog.locator('#phone-number-0').fill('3001234567');
    await janeDialog.locator('#phone-number-0').blur();

    await page.click('button:has-text("Save")');
    
    // Wait for the modal dialog to close completely
    await expect(janeDialog).toBeHidden();
    
    // Verify contact Jane Doe is listed and visible in the active contacts tab
    await page.waitForSelector('tbody tr:has-text("Jane Doe") >> visible=true');
    console.log('Contact Jane Doe successfully created.');
    await waitForToastOverlayToClear(page, 'after creating Jane Doe; continuing with contact flow');

    // Create Father Contact (John Doe)
    console.log('Creating contact John Doe...');
    await page.click('button:has-text("Add Contact")');
    await page.waitForSelector('input[name="firstName"]');
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.click('#cf-new-gender');
    await page.click('role=option[name="Male"]');
    await waitForToastOverlayToClear(page, 'before saving John Doe');
    await page.click('button:has-text("Save")');
    await expect(page.getByRole('dialog', { name: 'Add New Contact' })).toBeHidden();
    await page.waitForSelector('tbody tr:has-text("John Doe") >> visible=true');
    console.log('Contact John Doe successfully created.');

    // 15. Navigate to Students Page
    console.log('Navigating to Students Page...');
    await page.goto(`http://${subdomain}.localhost:5173/students`);
    await page.waitForLoadState('networkidle');

    // 16. Create a new Student linking to the Contact
    await page.click('button:has-text("Add Student")');
    const registerDialog = page.getByRole('dialog', { name: 'Register student' });
    await expect(registerDialog).toBeVisible();

    const studentContactSearch = registerDialog.getByLabel('Student contact');
    await studentContactSearch.fill('Jane Doe');
    const janeOption = page.getByRole('option', { name: /Jane Doe/ }).first();
    await expect(janeOption).toBeVisible({ timeout: 15_000 });
    await janeOption.click();

    // Link Father guardian (John Doe) — accessible name includes avatar initials (e.g. "JD John Doe —")
    const fatherSearch = registerDialog.getByLabel('Father');
    await fatherSearch.scrollIntoViewIfNeeded();
    await fatherSearch.fill('John Doe');
    const johnOption = page.getByRole('option', { name: /John Doe/ }).first();
    await expect(johnOption).toBeVisible({ timeout: 15_000 });
    await johnOption.click();

    // Wait for the next GR number query to resolve and populate the input field
    await expect(page.locator('input[placeholder="e.g. 0001-2026"]')).not.toHaveValue('');

    await registerDialog.getByRole('button', { name: 'Register student' }).click();

    // Wait for the modal dialog to close completely
    await expect(registerDialog).toBeHidden();

    // 17. Verify Student successfully created and listed
    await page.waitForSelector('tbody tr:has-text("Jane Doe") >> visible=true');
    console.log('Student Jane Doe successfully created and linked.');

    // 18. Seed a test class and enrollment for Jane Doe via the backend script
    console.log('Seeding session, class, and enrollment for student...');
    const backendDir = path.resolve(__dirname, '../../apps/backend');
    try {
      const output = execSync(`npx tsx src/scripts/seed-test-class.ts ${subdomain}`, { cwd: backendDir, encoding: 'utf8' });
      console.log(output);
    } catch (err: unknown) {
      const errorObj = err as { stdout?: string; stderr?: string; message?: string };
      console.error('Failed to seed class/enrollment:', errorObj.stdout || errorObj.stderr || errorObj.message);
      throw err;
    }

    // 19. Navigate to Attendance Page
    console.log('Navigating to Attendance Page...');
    await page.goto(`http://${subdomain}.localhost:5173/attendance`);
    await page.waitForLoadState('networkidle');

    // 20. Select Class in filters
    await page.waitForSelector('#filter-class >> visible=true');
    await page.selectOption('#filter-class >> visible=true', { label: 'Morning Quran Class' });
    await page.waitForLoadState('networkidle');

    // 21. Verify Jane Doe is listed in the roster
    await page.waitForSelector('text=Jane Doe >> visible=true');
    console.log('Jane Doe is visible in the class attendance list.');

    // 22. Submit attendance and require a successful bulk save
    const bulkSave = page.waitForResponse(
      (response) =>
        response.url().includes('/api/attendance/bulk') && response.request().method() === 'PUT',
      { timeout: 30_000 },
    );
    await page.click('button:has-text("Submit Attendance") >> visible=true');
    const bulkResponse = await bulkSave;
    if (!bulkResponse.ok()) {
      const body = await bulkResponse.text();
      throw new Error(`Attendance bulk save failed: HTTP ${bulkResponse.status()} ${body}`);
    }

    // 23. Assert submitted success badge is visible
    await page.waitForSelector('text=Submitted >> visible=true');

    console.log('Attendance successfully marked and submitted.');

    expect(browserFailures, browserFailures.join('\n')).toEqual([]);
  });

  test('should expose module shells and create teacher, invoice, session, enrollment, payment, message template, and campaign', async ({ page }) => {
    test.setTimeout(210_000);

    await loginTenant(page, tenantOrigin, adminEmail, changedAdminPassword);
    await expect(page.locator('h1')).toContainText('Assalamu Alaikum');

    for (const modulePath of ['/teachers', '/finance', '/sessions', '/messaging', '/users'] as const) {
      await assertModuleTierSmoke(page, modulePath, tenantOrigin);
    }

    // Soft-delete trash toggle on Students (Contacts-style Work trash)
    await page.goto(`${tenantOrigin}/students`);
    await page.waitForLoadState('networkidle');
    const trashToggle = page.getByRole('button', { name: /Show deleted|Show active/i });
    await expect(trashToggle).toBeVisible({ timeout: 20_000 });
    await trashToggle.click();
    await expect(page.getByRole('button', { name: /Show active/i })).toBeVisible();
    await page.getByRole('button', { name: /Show active/i }).click();

    // Settings shell
    await page.goto(`${tenantOrigin}/settings`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible({
      timeout: 20_000,
    });

    // Teacher from existing John Doe contact
    await page.goto(`${tenantOrigin}/teachers`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Add Teacher' }).click();
    const teacherDialog = page.getByRole('dialog', { name: 'Add teacher' });
    await expect(teacherDialog).toBeVisible();

    const teacherContactSearch = teacherDialog.getByRole('combobox', { name: 'Contact' });
    await teacherContactSearch.fill('John Doe');
    const johnTeacherOption = page.getByRole('option', { name: /John Doe/ }).first();
    await expect(johnTeacherOption).toBeVisible({ timeout: 15_000 });
    await johnTeacherOption.click();

    await expect(teacherDialog.getByLabel('Employee ID')).not.toHaveValue('', { timeout: 15_000 });

    const teacherCreate = page.waitForResponse(
      (response) =>
        response.url().includes('/api/teachers') &&
        response.request().method() === 'POST' &&
        !response.url().includes('/bulk'),
      { timeout: 30_000 },
    );
    await teacherDialog.getByRole('button', { name: 'Save' }).click();
    const teacherResponse = await teacherCreate;
    if (!teacherResponse.ok()) {
      throw new Error(`Teacher create failed: HTTP ${teacherResponse.status()} ${await teacherResponse.text()}`);
    }
    await expect(teacherDialog).toBeHidden({ timeout: 20_000 });
    await expect(
      page.locator('table:visible tbody tr').filter({ hasText: 'John Doe' }),
    ).toBeVisible({ timeout: 20_000 });

    // Finance invoice for Jane Doe
    await page.goto(`${tenantOrigin}/finance`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'New Invoice' }).click();
    const invoiceDialog = page.getByRole('dialog', { name: 'New Invoice' });
    await expect(invoiceDialog).toBeVisible();

    await invoiceDialog.locator('#invoice-student-name').fill('Jane Doe');
    await invoiceDialog.locator('#invoice-class').fill('Morning Quran Class');
    await invoiceDialog.locator('#invoice-session').fill('Hifz 2026');
    await invoiceDialog.locator('#invoice-base-fee').fill('1500');

    const invoiceCreate = page.waitForResponse(
      (response) =>
        response.url().includes('/api/finance/invoices') &&
        response.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await invoiceDialog.getByRole('button', { name: 'Create Invoice' }).click();
    const invoiceResponse = await invoiceCreate;
    if (!invoiceResponse.ok()) {
      throw new Error(`Invoice create failed: HTTP ${invoiceResponse.status()} ${await invoiceResponse.text()}`);
    }
    await expect(invoiceDialog).toBeHidden({ timeout: 20_000 });
    await expect(
      page.locator('table:visible tbody tr').filter({ hasText: 'Jane Doe' }),
    ).toBeVisible({ timeout: 20_000 });

    // Session create (server-assigned shape via client sess-* id)
    await page.goto(`${tenantOrigin}/sessions`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'New session' }).click();
    const sessionDialog = page.getByRole('dialog', { name: 'New session' });
    await expect(sessionDialog).toBeVisible();

    await sessionDialog.getByLabel('Session name').fill('Afternoon Tajweed 2026');
    // DatePicker inputs use format-based aria-labels (start already defaults to today)
    const endDate = sessionDialog.getByLabel(/Enter date in DD\/MM\/YYYY format/).nth(1);
    await endDate.fill('31/12/2026');
    await endDate.blur();

    const sessionCreate = page.waitForResponse(
      (response) =>
        response.url().includes('/api/sessions') &&
        response.request().method() === 'POST' &&
        !response.url().includes('/bulk'),
      { timeout: 30_000 },
    );
    await sessionDialog.getByRole('button', { name: 'Create session' }).click();
    const sessionResponse = await sessionCreate;
    if (!sessionResponse.ok()) {
      throw new Error(`Session create failed: HTTP ${sessionResponse.status()} ${await sessionResponse.text()}`);
    }
    await expect(sessionDialog).toBeHidden({ timeout: 20_000 });
    await expect(
      page.getByRole('heading', { name: 'Afternoon Tajweed 2026' }).first(),
    ).toBeVisible({ timeout: 20_000 });

    // Add a class on the new session (detail drawer opens on create)
    await page.getByRole('button', { name: 'Add class' }).click();
    const classDialog = page.getByRole('dialog', { name: 'Add class' });
    await expect(classDialog).toBeVisible();
    // Wait for async teacher options so ClassModal does not remount/reset mid-fill
    await expect(classDialog.locator('#class-teacher')).toContainText('John Doe', { timeout: 15_000 });
    const className = classDialog.getByRole('textbox', { name: /Class name/ });
    await className.fill('Tajweed A');
    await expect(className).toHaveValue('Tajweed A');
    await expect(classDialog.getByRole('button', { name: 'Save' })).toBeEnabled();

    const sessionUpdate = page.waitForResponse(
      (response) =>
        response.url().includes('/api/sessions/') &&
        response.request().method() === 'PUT',
      { timeout: 30_000 },
    );
    await classDialog.getByRole('button', { name: 'Save' }).click();
    const sessionUpdateResponse = await sessionUpdate;
    if (!sessionUpdateResponse.ok()) {
      throw new Error(
        `Session class save failed: HTTP ${sessionUpdateResponse.status()} ${await sessionUpdateResponse.text()}`,
      );
    }
    await expect(classDialog).toBeHidden({ timeout: 20_000 });
    await expect(page.getByText(/Tajweed a/i).first()).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Close' }).click();

    // Enrollment wizard: Jane Doe → Afternoon Tajweed 2026
    await page.goto(`${tenantOrigin}/enrollments`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'New Enrollment' }).click();
    const enrollmentDialog = page.getByRole('dialog', { name: 'New Enrollment' });
    await expect(enrollmentDialog).toBeVisible();

    await enrollmentDialog.getByPlaceholder('Search students by name…').fill('Jane Doe');
    const janeStudent = enrollmentDialog.getByRole('radio', { name: /Jane Doe/ }).first();
    await expect(janeStudent).toBeVisible({ timeout: 15_000 });
    await janeStudent.click();
    await enrollmentDialog.getByRole('button', { name: 'Next' }).click();

    const afternoonSession = enrollmentDialog.getByRole('radio', { name: /Afternoon Tajweed 2026/ }).first();
    await expect(afternoonSession).toBeVisible({ timeout: 15_000 });
    await afternoonSession.click();
    await enrollmentDialog.getByRole('button', { name: 'Next' }).click();

    // Eligibility
    await expect(
      enrollmentDialog.getByText('Student is eligible — you may proceed to class assignment.'),
    ).toBeVisible({ timeout: 10_000 });
    await enrollmentDialog.getByRole('button', { name: 'Next' }).click();

    // Class assignment (auto-suggested; Title Case may yield "Tajweed a")
    await expect(enrollmentDialog.getByRole('radio', { name: /Tajweed a/i }).first()).toBeVisible({
      timeout: 10_000,
    });
    await enrollmentDialog.getByRole('button', { name: 'Next' }).click();

    // Fee
    await enrollmentDialog.getByRole('button', { name: 'Next' }).click();

    const enrollmentCreate = page.waitForResponse(
      (response) =>
        response.url().includes('/api/enrollments') &&
        response.request().method() === 'POST' &&
        !response.url().includes('/bulk'),
      { timeout: 30_000 },
    );
    await enrollmentDialog.getByRole('button', { name: 'New Enrollment' }).click();
    const enrollmentResponse = await enrollmentCreate;
    if (!enrollmentResponse.ok()) {
      throw new Error(
        `Enrollment create failed: HTTP ${enrollmentResponse.status()} ${await enrollmentResponse.text()}`,
      );
    }
    await expect(enrollmentDialog).toBeHidden({ timeout: 20_000 });
    await expect(
      page.locator('table:visible tbody tr').filter({ hasText: 'Afternoon Tajweed 2026' }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.locator('table:visible tbody tr').filter({ hasText: 'Afternoon Tajweed 2026' }).filter({
        hasText: 'Jane Doe',
      }),
    ).toBeVisible({ timeout: 20_000 });

    // Record payment against the Jane Doe invoice
    await page.goto(`${tenantOrigin}/finance`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Record payment for/i }).first().click();
    const paymentDialog = page.getByRole('dialog', { name: 'Record payment' });
    await expect(paymentDialog).toBeVisible();
    await expect(paymentDialog.locator('#payment-amount-input')).not.toHaveValue('', { timeout: 10_000 });
    await expect(paymentDialog.locator('#payment-amount-input')).not.toHaveValue('0');

    const paymentCreate = page.waitForResponse(
      (response) =>
        response.url().includes('/api/finance/payments') &&
        response.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await paymentDialog.getByRole('button', { name: 'Record payment' }).click();
    const paymentResponse = await paymentCreate;
    if (!paymentResponse.ok()) {
      throw new Error(`Payment create failed: HTTP ${paymentResponse.status()} ${await paymentResponse.text()}`);
    }
    await expect(paymentDialog).toBeHidden({ timeout: 20_000 });
    await expect(page.getByText('Paid', { exact: true }).first()).toBeVisible({ timeout: 20_000 });

    // Messaging Setup — create a custom template preset
    await page.goto(`${tenantOrigin}/messaging`);
    await page.waitForLoadState('networkidle');
    const messagingNav = page
      .locator('div.hidden.lg\\:block')
      .filter({ has: page.getByRole('button', { name: 'Setup', exact: true }) })
      .first();
    await messagingNav.getByRole('button', { name: 'Setup', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Create Preset Template' })).toBeVisible({
      timeout: 15_000,
    });

    await page.locator('#tplLabel').locator('visible=true').fill('E2E Fee Reminder');
    await page.locator('#tplBody').locator('visible=true').fill(
      'Assalamu Alaikum {name}, your fee balance is due. JazakAllah Khair.',
    );

    const templateCreate = page.waitForResponse(
      (response) =>
        response.url().includes('/api/messaging/templates') &&
        response.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await page.getByRole('button', { name: 'Save New Template' }).locator('visible=true').click();
    const templateResponse = await templateCreate;
    if (!templateResponse.ok()) {
      throw new Error(
        `Messaging template create failed: HTTP ${templateResponse.status()} ${await templateResponse.text()}`,
      );
    }
    // applyTitleCaseRecursive stores "E2e Fee Reminder"; desktop+mobile lists may both render.
    await expect(page.getByText('E2e Fee Reminder').locator('visible=true').first()).toBeVisible({
      timeout: 20_000,
    });

    // Work — select Jane and dispatch an SMS campaign (logs via POST even when device SMS URI opens)
    const messagingWorkNav = page
      .locator('div.hidden.lg\\:block')
      .filter({ has: page.getByRole('button', { name: 'Work', exact: true }) })
      .first();
    await messagingWorkNav.getByRole('button', { name: 'Work', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Select Recipients' })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByPlaceholder('Search by recipient or content...').locator('visible=true').fill('Jane Doe');
    const janeRecipient = page.getByRole('checkbox', { name: 'Select Jane Doe' });
    await expect(janeRecipient).toBeVisible({ timeout: 15_000 });
    await janeRecipient.check();

    await page.getByRole('button', { name: 'Send SMS Campaign' }).click();
    const smsDialog = page.getByRole('dialog').filter({ hasText: /Jane Doe/ });
    await expect(smsDialog).toBeVisible({ timeout: 15_000 });

    // Prefer the custom preset when available in the native template select
    const templateSelect = smsDialog.locator('#messageTemplate');
    const feeTemplateValue = await templateSelect.locator('option', { hasText: /E2e Fee Reminder/i }).getAttribute('value');
    if (feeTemplateValue) {
      await templateSelect.selectOption(feeTemplateValue);
    } else {
      await smsDialog.locator('#messageBody').fill(
        'Assalamu Alaikum {name}, your fee balance is due.',
      );
    }
    await expect(smsDialog.locator('#messageBody')).not.toHaveValue('', { timeout: 10_000 });

    const logCreate = page.waitForResponse(
      (response) =>
        response.url().includes('/api/messaging/logs') &&
        response.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await smsDialog.getByRole('button', { name: 'Open Messages' }).click();
    const logResponse = await logCreate;
    if (!logResponse.ok()) {
      throw new Error(
        `Messaging log create failed: HTTP ${logResponse.status()} ${await logResponse.text()}`,
      );
    }
    await expect(smsDialog).toBeHidden({ timeout: 20_000 });

    const messagingReportsNav = page
      .locator('div.hidden.lg\\:block')
      .filter({ has: page.getByRole('button', { name: 'Reports', exact: true }) })
      .first();
    await messagingReportsNav.getByRole('button', { name: 'Reports', exact: true }).click();
    await expect(
      page.locator('table:visible tbody tr').filter({ hasText: 'Jane Doe' }).first(),
    ).toBeVisible({ timeout: 20_000 });
  });
});

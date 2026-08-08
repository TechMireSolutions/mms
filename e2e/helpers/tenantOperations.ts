import { expect, type Page } from '@playwright/test';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '../../apps/backend');

export async function waitForToastOverlayToClear(page: Page, context: string): Promise<void> {
  await page
    .waitForFunction(() => !document.querySelector('.fixed [data-state="open"]'), null, { timeout: 10000 })
    .catch(() => console.log(`Toast overlay still visible ${context}.`));
}

/**
 * Creates Jane Doe (Female contact with phone)
 */
export async function createTestContactJaneDoe(page: Page): Promise<void> {
  await page.click('button:has-text("Add Contact")');
  await page.waitForSelector('input[name="firstName"]');
  const janeDialog = page.getByRole('dialog', { name: 'Add New Contact' });
  
  await janeDialog.locator('input[name="firstName"]').fill('Jane');
  await janeDialog.locator('input[name="lastName"]').fill('Doe');

  await janeDialog.locator('#cf-new-gender').click();
  await page.locator('[role="option"]').filter({ hasText: /^Female$/i }).click();

  await janeDialog.locator('input[name="dob"]').fill('15/05/2015');
  await janeDialog.locator('input[name="dob"]').blur();

  await janeDialog.getByRole('tab', { name: 'Phones' }).click();
  await janeDialog.locator('#phone-number-0').fill('3001234567');
  await janeDialog.locator('#phone-number-0').blur();

  await page.click('button:has-text("Save")');
  await expect(janeDialog).toBeHidden();
  await page.waitForSelector('tbody tr:has-text("Jane Doe") >> visible=true');
  await waitForToastOverlayToClear(page, 'after creating Jane Doe');
}

/**
 * Creates John Doe (Male contact with email)
 */
export async function createTestContactJohnDoe(page: Page): Promise<void> {
  await page.click('button:has-text("Add Contact")');
  await page.waitForSelector('input[name="firstName"]');
  const johnDialog = page.getByRole('dialog', { name: 'Add New Contact' });
  await johnDialog.locator('input[name="firstName"]').fill('John');
  await johnDialog.locator('input[name="lastName"]').fill('Doe');
  await johnDialog.locator('#cf-new-gender').click();
  await page.locator('[role="option"]').filter({ hasText: /^Male$/i }).click();
  await johnDialog.getByRole('tab', { name: 'Emails' }).click();
  await johnDialog.locator('#email-address-0').fill('john.doe.e2e@example.com');
  await johnDialog.locator('#email-address-0').blur();
  await waitForToastOverlayToClear(page, 'before saving John Doe');
  await johnDialog.getByRole('button', { name: 'Save' }).click();
  await expect(johnDialog).toBeHidden();
  await page.waitForSelector('tbody tr:has-text("John Doe") >> visible=true');
}

/**
 * Registers student Jane Doe and links John Doe as Parent
 */
export async function registerStudentJaneDoe(page: Page): Promise<void> {
  await page.click('button:has-text("Add Student")');
  const registerDialog = page.getByRole('dialog', { name: 'Register student' });
  await expect(registerDialog).toBeVisible();

  const studentContactSearch = registerDialog.getByLabel('Student contact');
  await studentContactSearch.fill('Jane Doe');
  const janeOption = page.getByRole('option', { name: /Jane Doe/ }).first();
  await expect(janeOption).toBeVisible({ timeout: 15_000 });
  await janeOption.click();

  const editRelationshipsCta = registerDialog.getByRole('button', { name: /Edit contact relationships/i });
  await expect(editRelationshipsCta).toBeVisible({ timeout: 15_000 });
  await editRelationshipsCta.click();

  const editJaneDialog = page.getByRole('dialog', { name: /Edit Contact/i });
  await expect(editJaneDialog).toBeVisible({ timeout: 15_000 });
  await editJaneDialog.getByRole('tab', { name: 'Relationship' }).click();
  await editJaneDialog.getByRole('button', { name: /Add relationship/i }).click();
  // Link contact John Doe
  const relContactPicker = editJaneDialog.getByRole('combobox', { name: /Link contact/i }).first();
  await relContactPicker.fill('John Doe');
  const johnRelOption = page.getByRole('option', { name: /John Doe/ }).first();
  await expect(johnRelOption).toBeVisible({ timeout: 15_000 });
  await johnRelOption.click();

  // Set relationship type to Parent (system catalog FormSelect)
  const relTypeSelect = editJaneDialog.locator('#relationship-type-0');
  await relTypeSelect.selectOption('Parent');

  await waitForToastOverlayToClear(page, 'before saving Jane relationship');

  const savePromise = page
    .waitForResponse(
      (response) =>
        response.url().includes('/api/contacts') &&
        (response.request().method() === 'PUT' || response.request().method() === 'POST'),
      { timeout: 15_000 },
    )
    .catch(() => null);

  await editJaneDialog.getByRole('button', { name: 'Save' }).click({ force: true });
  await savePromise;
  await expect(editJaneDialog).toBeHidden();
  await expect(registerDialog.getByText(/John Doe/i).first()).toBeVisible({ timeout: 25_000 });

  await waitForToastOverlayToClear(page, 'before registering student Jane Doe');

  const saveButton = registerDialog.getByRole('button', { name: /Register student|Save/i }).first();
  await expect(saveButton).toBeEnabled({ timeout: 15_000 });

  const studentCreatePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/students') &&
      response.request().method() === 'POST' &&
      !response.url().includes('/duplicate-check') &&
      !response.url().includes('/bulk'),
    { timeout: 30_000 },
  ).catch(() => null);

  await saveButton.click();

  const saveAnywayButton = page.getByRole('button', { name: /Save anyway/i });
  if (await saveAnywayButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await saveAnywayButton.click();
  }

  await studentCreatePromise;
  await expect(registerDialog).toBeHidden({ timeout: 20_000 });
  await expect(
    page.locator('table:visible tbody tr').filter({ hasText: 'Jane Doe' }).first(),
  ).toBeVisible({ timeout: 20_000 });
}

/**
 * Executes backend class & enrollment seed script for a given subdomain
 */
export function seedTestClassAndEnrollment(subdomain: string): void {
  if (process.env.E2E_TARGET === 'production' || process.env.NODE_ENV === 'production') {
    console.warn('[E2E SAFEGUARD] Skipping class seed on production environment.');
    return;
  }
  try {
    const output = execSync(`npx tsx src/scripts/seed-test-class.ts ${subdomain}`, {
      cwd: backendDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || 'test',
        JWT_SECRET: process.env.JWT_SECRET || 'e2e-test-jwt-secret-key-at-least-32-chars-long',
      },
    });
    console.log(output);
  } catch (err: unknown) {
    const errorObj = err as { stdout?: string; stderr?: string; message?: string };
    console.error('Failed to seed class/enrollment:', errorObj.stdout || errorObj.stderr || errorObj.message);
    throw err;
  }
}

/**
 * Creates Teacher record for existing John Doe contact
 */
export async function createTeacherFromContact(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Add Teacher' }).first().click();
  const teacherDialog = page.getByRole('dialog', { name: 'Add teacher' });
  await expect(teacherDialog).toBeVisible();

  const teacherContactSearch = teacherDialog.getByRole('combobox', { name: 'Contact' });
  await teacherContactSearch.fill('John Doe');
  const johnTeacherOption = page.getByRole('option', { name: /John Doe/ }).first();
  await expect(johnTeacherOption).toBeVisible({ timeout: 15_000 });
  await johnTeacherOption.click();

  const employmentTab = teacherDialog.getByRole('tab', { name: /Employment/i });
  await expect(employmentTab).toBeVisible({ timeout: 15_000 });
  await employmentTab.click();

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
}

/**
 * Creates Finance Invoice for Jane Doe
 */
export async function createFinanceInvoice(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'New Invoice' }).first().click();
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
}

/**
 * Creates Session and adds a Class ('Tajweed A') assigned to John Doe
 */
export async function createSessionAndClass(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'New session' }).first().click();
  const sessionDialog = page.getByRole('dialog', { name: 'New session' });
  await expect(sessionDialog).toBeVisible();

  await sessionDialog.getByLabel('Session name').fill('Afternoon Tajweed 2026');
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

  await page.getByRole('button', { name: 'Add class' }).first().click();
  const classDialog = page.getByRole('dialog', { name: 'Add class' });
  await expect(classDialog).toBeVisible();

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
  await page.waitForLoadState('domcontentloaded');
  await page.getByRole('button', { name: 'Close' }).click();
}

/**
 * Completes Enrollment wizard for Jane Doe -> Afternoon Tajweed 2026
 */
export async function createStudentEnrollment(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'New Enrollment' }).first().click();
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

  await expect(
    enrollmentDialog.getByText('Student is eligible — you may proceed to class assignment.'),
  ).toBeVisible({ timeout: 10_000 });
  await enrollmentDialog.getByRole('button', { name: 'Next' }).click();

  await expect(enrollmentDialog.getByRole('radio', { name: /Tajweed a/i }).first()).toBeVisible({
    timeout: 10_000,
  });
  await enrollmentDialog.getByRole('button', { name: 'Next' }).click();
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
}

/**
 * Records payment for invoice
 */
export async function recordInvoicePayment(page: Page): Promise<void> {
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
}

/**
 * Creates Messaging Preset Template & dispatches SMS Campaign
 */
export async function createMessagingTemplateAndCampaign(page: Page): Promise<void> {
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
  await expect(page.getByText('E2e Fee Reminder').locator('visible=true').first()).toBeVisible({
    timeout: 20_000,
  });

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

  const templateSelect = smsDialog.locator('#messageTemplate');
  const targetOption = templateSelect.locator('option', { hasText: /E2e Fee Reminder/i });
  const hasOption = await targetOption.isVisible({ timeout: 5_000 }).catch(() => false);
  if (hasOption) {
    const feeTemplateValue = await targetOption.getAttribute('value');
    if (feeTemplateValue) {
      await templateSelect.selectOption(feeTemplateValue);
    }
  } else {
    await smsDialog.locator('#messageBody').fill('Assalamu Alaikum {name}, your fee balance is due.');
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
}

/**
 * Creates Chart of Accounts accounts & balanced journal entry
 */
export async function createAccountsAndJournalEntry(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Chart of Accounts', exact: true }).first().click();
  await expect(page.getByRole('region', { name: 'Chart of Accounts' })).toBeVisible({
    timeout: 15_000,
  });

  for (const account of [
    { code: '1100', name: 'E2E Cash', type: 'Asset' },
    { code: '4100', name: 'E2E Tuition Income', type: 'Revenue' },
  ] as const) {
    await page.getByRole('button', { name: 'Add Account' }).first().click();
    const accountDialog = page.getByRole('dialog', { name: 'Add Account' });
    await expect(accountDialog).toBeVisible();
    await accountDialog.locator('#account-type').selectOption(account.type);
    await accountDialog.locator('#account-code').fill(account.code);
    await accountDialog.locator('#account-name').fill(account.name);
    await expect(accountDialog.locator('#account-code')).toHaveValue(account.code);

    const accountSave = page.waitForResponse(
      (response) =>
        response.url().includes('/api/accounting/accounts/bulk') &&
        response.request().method() === 'PUT',
      { timeout: 30_000 },
    );
    await accountDialog.getByRole('button', { name: 'Save' }).click();
    const accountResponse = await accountSave;
    if (!accountResponse.ok()) {
      throw new Error(
        `Accounting account save failed: HTTP ${accountResponse.status()} ${await accountResponse.text()}`,
      );
    }
    await expect(accountDialog).toBeHidden({ timeout: 20_000 });
    await expect(page.getByText(account.name).locator('visible=true').first()).toBeVisible({
      timeout: 20_000,
    });
  }

  await page.getByRole('button', { name: 'Journal Entries', exact: true }).first().click();
  await page.getByRole('button', { name: 'Advanced', exact: true }).first().click();
  await expect(page.getByRole('region', { name: 'Advanced Journal Entries' })).toBeVisible({
    timeout: 15_000,
  });

  await page.getByRole('region', { name: 'Advanced Journal Entries' }).getByRole('button', { name: 'New Entry' }).click();
  const entryDialog = page.getByRole('dialog', { name: 'New Journal Entry' });
  await expect(entryDialog).toBeVisible();
  await entryDialog.locator('#journal-entry-description').fill('E2E fee collection journal');

  const line1Account = entryDialog.locator('select[aria-label="Account for line 1"]:visible');
  const cashAccountValue = await line1Account.locator('option', { hasText: /1100.*E2e Cash/i }).first().getAttribute('value');
  if (!cashAccountValue) throw new Error('E2E Cash account option not found in journal form');
  await line1Account.selectOption(cashAccountValue);
  await entryDialog.locator('[aria-label="Debit amount for line 1"]:visible').fill('2500');

  const line2Account = entryDialog.locator('select[aria-label="Account for line 2"]:visible');
  const incomeAccountValue = await line2Account.locator('option', { hasText: /4100.*E2e Tuition Income/i }).first().getAttribute('value');
  if (!incomeAccountValue) throw new Error('E2E Tuition Income account option not found in journal form');
  await line2Account.selectOption(incomeAccountValue);
  await entryDialog.locator('[aria-label="Credit amount for line 2"]:visible').fill('2500');

  const entrySave = page.waitForResponse(
    (response) =>
      response.url().includes('/api/accounting/entries/bulk') &&
      response.request().method() === 'PUT',
    { timeout: 30_000 },
  );
  await entryDialog.getByRole('button', { name: 'Post Entry' }).click();
  const entryResponse = await entrySave;
  if (!entryResponse.ok()) {
    throw new Error(
      `Accounting entry save failed: HTTP ${entryResponse.status()} ${await entryResponse.text()}`,
    );
  }
  await expect(entryDialog).toBeHidden({ timeout: 20_000 });
  await expect(
    page.getByText('E2e Fee Collection Journal').locator('visible=true').first(),
  ).toBeVisible({ timeout: 20_000 });
}

/**
 * Creates User record from John Doe contact with Teacher role
 */
export async function createUserFromContact(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Add User' }).first().click();
  const userDialog = page.getByRole('dialog', { name: 'Add new user' });
  await expect(userDialog).toBeVisible({ timeout: 15_000 });

  const userContactSearch = userDialog.getByRole('combobox', { name: 'Search contact' });
  await userContactSearch.fill('John Doe');
  const johnUserOption = page.getByRole('option', { name: /John Doe/ }).first();
  await expect(johnUserOption).toBeVisible({ timeout: 15_000 });
  await johnUserOption.click();
  await expect(userDialog.getByText('john.doe.e2e@example.com').first()).toBeVisible({
    timeout: 10_000,
  });

  await userDialog.getByRole('button', { name: 'Next' }).click();
  await userDialog.locator('div.rounded-xl.border-2').filter({ hasText: /^Teacher/ }).first().click();
  await userDialog.getByRole('button', { name: 'Next' }).click();

  const userCreate = page.waitForResponse(
    (response) =>
      response.url().includes('/api/users/bulk') &&
      response.request().method() === 'PUT',
    { timeout: 30_000 },
  );
  await userDialog.getByRole('button', { name: 'Create user' }).click();
  const userResponse = await userCreate;
  if (!userResponse.ok()) {
    throw new Error(
      `User create failed: HTTP ${userResponse.status()} ${await userResponse.text()}`,
    );
  }
  await expect(userDialog).toBeHidden({ timeout: 20_000 });
  await expect(
    page.locator('table:visible tbody tr').filter({ hasText: 'John Doe' }).filter({
      hasText: 'john.doe.e2e@example.com',
    }),
  ).toBeVisible({ timeout: 20_000 });
}

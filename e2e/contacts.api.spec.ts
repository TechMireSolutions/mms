import { test, expect, type APIRequestContext } from '@playwright/test';
import { provisionE2ETenant, tenantHeaders, API_BASE, type E2ETenantSession } from './helpers/tenantApi';
import { contactsFromListBody } from './helpers/contactsApi';
import { isBackendReachable } from './helpers/tenantUi';

test.describe('Contacts API (globle1 Work flow)', () => {
  test.describe.configure({ mode: 'serial' });

  let apiContext: APIRequestContext;
  let tenant: E2ETenantSession;
  let contactId: string;

  test.beforeAll(async ({ playwright }) => {
    if (!(await isBackendReachable())) {
      test.skip(true, 'Backend not reachable — start backend or set E2E_API_URL');
      return;
    }

    apiContext = await playwright.request.newContext();
    tenant = await provisionE2ETenant(apiContext);
  });

  test.afterAll(async () => {
    if (apiContext) {
      await apiContext.dispose();
    }
  });

  test('POST /api/contacts creates a contact', async () => {
    const res = await apiContext.post(`${API_BASE}/api/contacts`, {
      headers: tenantHeaders(tenant.tenantHost),
      data: {
        firstName: 'Playwright',
        lastName: 'Contact',
        phones: [{ label: 'Mobile', number: '3001112233', countryCode: '+92' }],
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.contact).toMatchObject({
      firstName: 'Playwright',
      lastName: 'Contact',
    });
    contactId = String(body.contact.id);
  });

  test('GET /api/contacts lists active contacts', async () => {
    const res = await apiContext.get(`${API_BASE}/api/contacts`, {
      headers: tenantHeaders(tenant.tenantHost),
    });
    expect(res.ok()).toBeTruthy();
    const list = contactsFromListBody(await res.json());
    expect(list.some((c) => String(c.id) === contactId)).toBeTruthy();
  });

  test('PUT /api/contacts/:id updates a contact', async () => {
    const res = await apiContext.put(`${API_BASE}/api/contacts/${contactId}`, {
      headers: tenantHeaders(tenant.tenantHost),
      data: {
        id: contactId,
        firstName: 'Playwright',
        lastName: 'Updated',
        lifecycleStage: 'Lead',
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.contact).toMatchObject({ lastName: 'Updated' });
  });

  test('DELETE /api/contacts/:id soft-deletes with deletionReason', async () => {
    const res = await apiContext.delete(`${API_BASE}/api/contacts/${contactId}`, {
      headers: tenantHeaders(tenant.tenantHost),
      data: { deletionReason: 'E2E archive test' },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('GET /api/contacts?includeDeleted=true returns archived contact with reason', async () => {
    const res = await apiContext.get(`${API_BASE}/api/contacts?includeDeleted=true`, {
      headers: tenantHeaders(tenant.tenantHost),
    });
    expect(res.ok()).toBeTruthy();
    const list = contactsFromListBody(await res.json());
    const archived = list.find((c) => String(c.id) === contactId);
    expect(archived).toBeTruthy();
    expect(archived?.deletedAt).toBeTruthy();
    expect(archived?.deletionReason).toBe('E2E archive test');
  });

  test('GET /api/contacts excludes deleted from Work list', async () => {
    const res = await apiContext.get(`${API_BASE}/api/contacts`, {
      headers: tenantHeaders(tenant.tenantHost),
    });
    expect(res.ok()).toBeTruthy();
    const list = contactsFromListBody(await res.json());
    expect(list.some((c) => String(c.id) === contactId)).toBeFalsy();
  });

  test('POST /api/contacts/:id/restore returns contact to active directory', async () => {
    const res = await apiContext.post(`${API_BASE}/api/contacts/${contactId}/restore`, {
      headers: tenantHeaders(tenant.tenantHost),
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.contact).toMatchObject({ id: contactId });
    expect(body.contact.deletedAt).toBeFalsy();

    const listRes = await apiContext.get(`${API_BASE}/api/contacts`, {
      headers: tenantHeaders(tenant.tenantHost),
    });
    const list = contactsFromListBody(await listRes.json());
    expect(list.some((c) => String(c.id) === contactId)).toBeTruthy();
  });

  test('PUT /api/contacts/column-prefs persists Work column layout', async () => {
    const prefs = [
      { key: 'name', enabled: true, order: 0 },
      { key: 'phone', enabled: false, order: 1 },
    ];
    const putRes = await apiContext.put(`${API_BASE}/api/contacts/column-prefs`, {
      headers: tenantHeaders(tenant.tenantHost),
      data: { prefs },
    });
    expect(putRes.ok()).toBeTruthy();

    const getRes = await apiContext.get(`${API_BASE}/api/contacts/column-prefs`, {
      headers: tenantHeaders(tenant.tenantHost),
    });
    expect(getRes.ok()).toBeTruthy();
    expect(await getRes.json()).toEqual({ prefs });
  });

  test('saved-reports CRUD and run updates lastRunAt', async () => {
    const createRes = await apiContext.post(`${API_BASE}/api/contacts/saved-reports`, {
      headers: tenantHeaders(tenant.tenantHost),
      data: {
        name: 'E2E Leads preset',
        drillDown: { lifecycleStage: 'Lead', search: 'playwright' },
      },
    });
    expect(createRes.status()).toBe(201);
    const { report } = await createRes.json();
    expect(report).toMatchObject({
      name: 'E2E Leads preset',
      drillDown: { lifecycleStage: 'Lead', search: 'playwright' },
    });

    const listRes = await apiContext.get(`${API_BASE}/api/contacts/saved-reports`, {
      headers: tenantHeaders(tenant.tenantHost),
    });
    const { reports } = await listRes.json();
    expect(reports.some((r: { id: string }) => r.id === report.id)).toBeTruthy();

    const runRes = await apiContext.post(`${API_BASE}/api/contacts/saved-reports/${report.id}/run`, {
      headers: tenantHeaders(tenant.tenantHost),
    });
    expect(runRes.ok()).toBeTruthy();
    expect((await runRes.json()).report.lastRunAt).toBeTruthy();

    const deleteRes = await apiContext.delete(`${API_BASE}/api/contacts/saved-reports/${report.id}`, {
      headers: tenantHeaders(tenant.tenantHost),
    });
    expect(deleteRes.ok()).toBeTruthy();
  });
});

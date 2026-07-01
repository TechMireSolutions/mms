import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../db/database.js', () => ({
  initDb: vi.fn().mockResolvedValue(undefined),
  pingDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock('../services/auth/authArtifactService.js', () => ({
  purgeExpiredAuthArtifacts: vi.fn().mockResolvedValue(undefined),
  putAuthArtifact: vi.fn(),
  takeAuthArtifact: vi.fn(),
}));

vi.mock('../services/workspaceService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/workspaceService.js')>();
  const demoWorkspace = {
    id: 'ws-demo',
    subdomain: 'demo',
    madrasaName: 'Demo Madrasa',
    createdAt: '2026-01-01T00:00:00.000Z',
    enabled: true,
  };
  return {
    ...actual,
    getWorkspaceBySubdomain: vi.fn().mockImplementation(async (subdomain: string) =>
      subdomain === 'demo' ? demoWorkspace : null,
    ),
  };
});

const mockLoadContacts = vi.fn();
const mockLoadContactsPage = vi.fn();
const mockGetContactById = vi.fn();
const mockUpsertContact = vi.fn();
const mockUpdateContactById = vi.fn();
const mockSoftDeleteContactById = vi.fn();
const mockRestoreContactById = vi.fn();
const mockBulkSoftDeleteContacts = vi.fn();
const mockBulkRestoreContacts = vi.fn();
const mockGetUserColumnPreferences = vi.fn();
const mockSetUserColumnPreferences = vi.fn();
const mockListContactsSavedReports = vi.fn();
const mockCreateContactsSavedReport = vi.fn();
const mockDeleteContactsSavedReport = vi.fn();
const mockTouchContactsSavedReportRun = vi.fn();
const mockRecordAudit = vi.fn();
const mockEnqueueBackgroundJob = vi.fn();

vi.mock('../services/contactService.js', () => ({
  loadContacts: (...args: unknown[]) => mockLoadContacts(...args),
  loadContactsPage: (...args: unknown[]) => mockLoadContactsPage(...args),
  getContactById: (...args: unknown[]) => mockGetContactById(...args),
  upsertContact: (...args: unknown[]) => mockUpsertContact(...args),
  updateContactById: (...args: unknown[]) => mockUpdateContactById(...args),
  softDeleteContactById: (...args: unknown[]) => mockSoftDeleteContactById(...args),
  restoreContactById: (...args: unknown[]) => mockRestoreContactById(...args),
  bulkSoftDeleteContacts: (...args: unknown[]) => mockBulkSoftDeleteContacts(...args),
  bulkRestoreContacts: (...args: unknown[]) => mockBulkRestoreContacts(...args),
}));

vi.mock('../services/contactPreferencesService.js', () => ({
  getUserColumnPreferences: (...args: unknown[]) => mockGetUserColumnPreferences(...args),
  setUserColumnPreferences: (...args: unknown[]) => mockSetUserColumnPreferences(...args),
  listContactsSavedReports: (...args: unknown[]) => mockListContactsSavedReports(...args),
  createContactsSavedReport: (...args: unknown[]) => mockCreateContactsSavedReport(...args),
  deleteContactsSavedReport: (...args: unknown[]) => mockDeleteContactsSavedReport(...args),
  touchContactsSavedReportRun: (...args: unknown[]) => mockTouchContactsSavedReportRun(...args),
}));

vi.mock('../services/contactConfigService.js', () => ({
  loadContactFieldConfig: vi.fn().mockResolvedValue(null),
}));

vi.mock('../services/auth/userService.js', () => ({
  getLinkedContactId: vi.fn().mockResolvedValue(null),
}));

vi.mock('../services/auditService.js', () => ({
  recordAudit: (...args: unknown[]) => mockRecordAudit(...args),
}));

vi.mock('../services/backgroundJobWorkerService.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    enqueueBackgroundJob: (...args: unknown[]) => mockEnqueueBackgroundJob(...args),
  };
});

import { buildApp } from '../app.js';

const sampleContact = {
  id: 'c1',
  firstName: 'Ali',
  lastName: 'Khan',
  name: 'Ali Khan',
  phones: [{ label: 'Mobile', number: '3001234567', countryCode: '+92' }],
};

function teacherToken(app: Awaited<ReturnType<typeof buildApp>>): string {
  return app.jwt.sign({
    id: 'u-teacher',
    email: 'teacher@test.com',
    name: 'Teacher',
    role: 'teacher',
    workspaceSubdomain: 'demo',
    twoFactorVerified: true,
    tokenType: 'access',
  });
}

function viewerToken(app: Awaited<ReturnType<typeof buildApp>>): string {
  return app.jwt.sign({
    id: 'u-viewer',
    email: 'viewer@test.com',
    name: 'Viewer',
    role: 'viewer',
    workspaceSubdomain: 'demo',
    twoFactorVerified: true,
    tokenType: 'access',
  });
}

function adminToken(app: Awaited<ReturnType<typeof buildApp>>): string {
  return app.jwt.sign({
    id: 'u-admin',
    email: 'admin@test.com',
    name: 'Admin',
    role: 'admin',
    workspaceSubdomain: 'demo',
    twoFactorVerified: true,
    tokenType: 'access',
  });
}

function accountantToken(app: Awaited<ReturnType<typeof buildApp>>): string {
  return app.jwt.sign({
    id: 'u-accountant',
    email: 'accountant@test.com',
    name: 'Accountant',
    role: 'accountant',
    workspaceSubdomain: 'demo',
    twoFactorVerified: true,
    tokenType: 'access',
  });
}

describe('contacts REST routes', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    mockLoadContacts.mockReset().mockResolvedValue([sampleContact]);
    mockGetContactById.mockReset().mockResolvedValue(sampleContact);
    mockLoadContactsPage.mockReset().mockResolvedValue({
      contacts: [sampleContact],
      total: 1,
      page: 1,
      limit: 50,
      hasMore: false,
    });
    mockUpsertContact.mockReset().mockResolvedValue({ contact: sampleContact, created: true });
    mockUpdateContactById.mockReset().mockResolvedValue(sampleContact);
    mockSoftDeleteContactById.mockReset().mockResolvedValue(true);
    mockRestoreContactById.mockReset().mockResolvedValue({ ...sampleContact, deletedAt: undefined });
    mockBulkSoftDeleteContacts.mockReset().mockResolvedValue({ succeeded: 1, failed: 0 });
    mockBulkRestoreContacts.mockReset().mockResolvedValue({ succeeded: 1, failed: 0 });
    mockGetUserColumnPreferences.mockReset().mockResolvedValue([]);
    mockSetUserColumnPreferences.mockReset().mockResolvedValue(undefined);
    mockListContactsSavedReports.mockReset().mockResolvedValue([]);
    mockCreateContactsSavedReport.mockReset().mockResolvedValue({
      id: 'csr_test',
      name: 'Leads',
      drillDown: { gender: 'male' },
      createdBy: 'u-teacher',
      createdByName: 'Teacher',
      createdAt: '2026-06-21T00:00:00.000Z',
    });
    mockDeleteContactsSavedReport.mockReset().mockResolvedValue(true);
    mockRecordAudit.mockReset().mockResolvedValue(undefined);
    mockEnqueueBackgroundJob.mockReset().mockResolvedValue({
      id: 'job_contacts_export',
      moduleId: 'contacts',
      kind: 'export',
      status: 'running',
      label: 'Contacts CSV',
      createdAt: '2026-06-21T00:00:00.000Z',
    });
    mockTouchContactsSavedReportRun.mockReset().mockResolvedValue({
      id: 'csr_test',
      name: 'Leads',
      drillDown: { gender: 'male' },
      createdBy: 'u-teacher',
      createdAt: '2026-06-21T00:00:00.000Z',
      lastRunAt: '2026-06-21T12:00:00.000Z',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/contacts requires auth', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/contacts',
      headers: { host: 'demo.localhost' },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('GET /api/contacts returns 403 for roles without read access', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/contacts',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${viewerToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({ type: 'forbidden' });
    await app.close();
  });

  it('GET /api/contacts lists contacts for authorized roles', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/contacts',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ contacts: [sampleContact] });
    expect(mockLoadContacts).toHaveBeenCalled();
    await app.close();
  });

  it('GET /api/contacts/count returns count', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/contacts/count',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ count: 1 });
    await app.close();
  });

  it('POST /api/contacts returns 403 for roles without write access', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${viewerToken(app)}`,
      },
      payload: { firstName: 'Test', lastName: 'Contact' },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  it('POST /api/contacts validates body shape', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
      payload: { lastName: 'MissingFirstName' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ type: 'validation_error' });
    await app.close();
  });

  it('GET /api/contacts?includeDeleted=true returns 403 without contacts.delete', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/contacts?includeDeleted=true',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  it('GET /api/contacts?includeDeleted=true lists deleted for admin', async () => {
    mockLoadContacts.mockResolvedValueOnce([{ ...sampleContact, deletedAt: '2026-01-02T00:00:00.000Z' }]);
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/contacts?includeDeleted=true',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(mockLoadContacts).toHaveBeenCalledWith({ includeDeleted: true });
    await app.close();
  });

  it('POST /api/contacts returns 403 for accountant without contacts.write', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${accountantToken(app)}`,
      },
      payload: { firstName: 'Test', lastName: 'Contact' },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  it('POST /api/contacts creates a contact', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
      payload: {
        firstName: 'Sara',
        lastName: 'Ahmed',
        phones: [{ label: 'Mobile', number: '3001112233', countryCode: '+92' }],
      },
    });
    expect(res.statusCode).toBe(201);
    expect(mockUpsertContact).toHaveBeenCalled();
    expect(res.json()).toMatchObject({ success: true, contact: sampleContact });
    await app.close();
  });

  it('PUT /api/contacts/:id updates a contact', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/contacts/c1',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
      payload: { id: 'c1', firstName: 'Ali', lastName: 'Updated' },
    });
    expect(res.statusCode).toBe(200);
    expect(mockUpdateContactById).toHaveBeenCalledWith('c1', expect.objectContaining({ firstName: 'Ali' }));
    await app.close();
  });

  it('DELETE /api/contacts/:id returns 403 for teacher without contacts.delete', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/contacts/c1',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(403);
    expect(mockSoftDeleteContactById).not.toHaveBeenCalled();
    await app.close();
  });

  it('DELETE /api/contacts/:id soft-deletes for admin', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/contacts/c1',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(mockSoftDeleteContactById).toHaveBeenCalledWith('c1', 'u-admin', undefined);
    await app.close();
  });

  it('DELETE /api/contacts/:id persists optional deletionReason', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/contacts/c1',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
      payload: { deletionReason: 'Duplicate entry' },
    });
    expect(res.statusCode).toBe(200);
    expect(mockSoftDeleteContactById).toHaveBeenCalledWith('c1', 'u-admin', 'Duplicate entry');
    await app.close();
  });

  it('POST /api/contacts/bulk-delete returns 403 for teacher', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts/bulk-delete',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
      payload: { ids: ['c1', 'c2'] },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  it('POST /api/contacts/bulk-delete soft-deletes multiple contacts for admin', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts/bulk-delete',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
      payload: { ids: ['c1', 'c2'] },
    });
    expect(res.statusCode).toBe(200);
    expect(mockBulkSoftDeleteContacts).toHaveBeenCalledWith(['c1', 'c2'], 'u-admin', undefined);
    expect(res.json()).toMatchObject({ success: true, succeeded: 1, failed: 0 });
    await app.close();
  });

  it('POST /api/contacts/bulk-delete persists optional deletionReason', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts/bulk-delete',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
      payload: { ids: ['c1', 'c2'], deletionReason: 'Cleanup import' },
    });
    expect(res.statusCode).toBe(200);
    expect(mockBulkSoftDeleteContacts).toHaveBeenCalledWith(['c1', 'c2'], 'u-admin', 'Cleanup import');
    await app.close();
  });

  it('POST /api/contacts/:id/restore returns 403 for teacher', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts/c1/restore',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  it('POST /api/contacts/:id/restore restores for admin', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts/c1/restore',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(mockRestoreContactById).toHaveBeenCalledWith('c1', 'u-admin');
    expect(res.json()).toMatchObject({ success: true, contact: expect.objectContaining({ id: 'c1' }) });
    await app.close();
  });

  it('POST /api/contacts/bulk-restore restores multiple contacts for admin', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts/bulk-restore',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
      payload: { ids: ['c1', 'c2'] },
    });
    expect(res.statusCode).toBe(200);
    expect(mockBulkRestoreContacts).toHaveBeenCalledWith(['c1', 'c2'], 'u-admin');
    expect(res.json()).toMatchObject({ success: true, succeeded: 1, failed: 0 });
    await app.close();
  });

  it('POST /api/contacts/export-audit records export audit for read roles', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts/export-audit',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
      payload: { count: 12, scope: 'filtered' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ success: true });
    await app.close();
  });

  it('POST /api/contacts/export/csv queues and audits exports on the server', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts/export/csv',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
      payload: {
        label: 'Contacts CSV',
        columns: [{ id: 'name', label: 'Name' }],
      },
    });
    expect(res.statusCode).toBe(202);
    expect(mockEnqueueBackgroundJob).toHaveBeenCalledWith(
      'demo',
      'u-teacher',
      expect.objectContaining({ moduleId: 'contacts', kind: 'export', label: 'Contacts CSV' }),
      expect.objectContaining({
        columns: [{ id: 'name', label: 'Name' }],
        label: 'Contacts CSV',
        viewerRole: 'teacher',
      }),
    );
    expect(mockRecordAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: 'contact.export.queue',
      entityId: expect.any(String),
    }));
    await app.close();
  });

  it('POST /api/contacts/export-audit returns 403 for viewer', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts/export-audit',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${viewerToken(app)}`,
      },
      payload: { count: 3, scope: 'filtered' },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  it('POST /api/contacts/merge-audit records merge audit for write roles', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts/merge-audit',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
      payload: { keepId: 'c1', deleteId: 'c2', mergedName: 'Merged Person' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ success: true });
    await app.close();
  });

  it('POST /api/contacts/merge-audit returns 403 for viewer', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts/merge-audit',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${viewerToken(app)}`,
      },
      payload: { keepId: 'c1', deleteId: 'c2' },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  it('GET /api/contacts/column-preferences returns user layout', async () => {
    mockGetUserColumnPreferences.mockResolvedValue([{ key: 'name', enabled: true, order: 0 }]);
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/contacts/column-preferences',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ preferences: [{ key: 'name', enabled: true, order: 0 }] });
    expect(mockGetUserColumnPreferences).toHaveBeenCalledWith('u-teacher');
    await app.close();
  });

  it('PUT /api/contacts/column-preferences persists layout', async () => {
    const preferences = [{ key: 'email', enabled: false, order: 2 }];
    const app = await buildApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/contacts/column-preferences',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
      payload: { preferences },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ success: true, preferences });
    expect(mockSetUserColumnPreferences).toHaveBeenCalledWith('u-teacher', preferences);
    await app.close();
  });

  it('POST /api/contacts/saved-reports creates preset', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts/saved-reports',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
      payload: { name: 'Leads', drillDown: { gender: 'male' } },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().report).toMatchObject({ id: 'csr_test', name: 'Leads' });
    await app.close();
  });

  it('POST /api/contacts/saved-reports/:id/run updates last run', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts/saved-reports/csr_test/run',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(mockTouchContactsSavedReportRun).toHaveBeenCalledWith('csr_test', expect.objectContaining({ id: 'u-teacher', role: 'teacher' }));
    expect(res.json().report.lastRunAt).toBeTruthy();
    await app.close();
  });

  it('POST /api/contacts/setup-audit requires setup write permission', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts/setup-audit',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
      payload: { area: 'fields', summary: 'Changed fields' },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  it('POST /api/contacts/setup-audit records setup changes for admin', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts/setup-audit',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
      payload: { area: 'fields', summary: 'Changed fields' },
    });
    expect(res.statusCode).toBe(200);
    expect(mockRecordAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'contact.setup' }));
    await app.close();
  });
});

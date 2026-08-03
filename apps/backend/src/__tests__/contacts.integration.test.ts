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
const mockCountContacts = vi.fn();
const mockGetContactById = vi.fn();
const mockUpsertContact = vi.fn();
const mockUpdateContactById = vi.fn();
const mockSoftDeleteContactById = vi.fn();
const mockRestoreContactById = vi.fn();
const mockBulkSoftDeleteContacts = vi.fn();
const mockBulkRestoreContacts = vi.fn();
const mockMergeContactsById = vi.fn();
const mockGetUserColumnPreferences = vi.fn();
const mockSetUserColumnPreferences = vi.fn();
const mockGetUserColumnPreferencesForModule = vi.fn();
const mockSetUserColumnPreferencesForModule = vi.fn();
const mockListContactsSavedReports = vi.fn();

const mockCreateContactsSavedReport = vi.fn();
const mockDeleteContactsSavedReport = vi.fn();
const mockTouchContactsSavedReportRun = vi.fn();
const mockRecordAudit = vi.fn();
const mockEnqueueBackgroundJob = vi.fn();
const mockGetUserBackgroundJob = vi.fn();
const mockLoadContactFieldUsageCount = vi.fn();
const mockLoadContactFieldUsageCounts = vi.fn();
const mockLoadContactsCommandMetrics = vi.fn();
const mockLoadContactsReportAnalytics = vi.fn();
const mockLoadContactsWidgetAggregates = vi.fn();
const mockGetLinkedContactId = vi.fn().mockResolvedValue(null);
const mockGetContactGoogleSyncConfig = vi.fn();
const mockRedactGoogleSyncConfigForClient = vi.fn((...args: unknown[]) => args[0]);
const mockMatchContactIdentityIndex = vi.fn().mockResolvedValue({
  phones: [],
  emails: [],
  names: [],
});

vi.mock('../services/contactIdentityMatchService.js', () => ({
  matchContactIdentityIndex: (...args: unknown[]) => mockMatchContactIdentityIndex(...args),
}));

vi.mock('../services/contactService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/contactService.js')>();
  return {
    ...actual,
    loadContacts: (...args: unknown[]) => mockLoadContacts(...args),
    loadContactsPage: (...args: unknown[]) => mockLoadContactsPage(...args),
    countContacts: (...args: unknown[]) => mockCountContacts(...args),
    getContactById: (...args: unknown[]) => mockGetContactById(...args),
    upsertContact: (...args: unknown[]) => mockUpsertContact(...args),
    updateContactById: (...args: unknown[]) => mockUpdateContactById(...args),
    softDeleteContactById: (...args: unknown[]) => mockSoftDeleteContactById(...args),
    restoreContactById: (...args: unknown[]) => mockRestoreContactById(...args),
    bulkSoftDeleteContacts: (...args: unknown[]) => mockBulkSoftDeleteContacts(...args),
    bulkRestoreContacts: (...args: unknown[]) => mockBulkRestoreContacts(...args),
    mergeContactsById: (...args: unknown[]) => mockMergeContactsById(...args),
    loadContactsCommandMetrics: (...args: unknown[]) => mockLoadContactsCommandMetrics(...args),
    loadContactsReportAnalytics: (...args: unknown[]) => mockLoadContactsReportAnalytics(...args),
    loadContactsWidgetAggregates: (...args: unknown[]) => mockLoadContactsWidgetAggregates(...args),
    loadContactsByIds: vi.fn(),
    loadContactFieldUsageCount: (...args: unknown[]) => mockLoadContactFieldUsageCount(...args),
    loadContactFieldUsageCounts: (...args: unknown[]) => mockLoadContactFieldUsageCounts(...args),
    loadContactDuplicatePairsPage: vi.fn(),
    prepareContactRecord: vi.fn(),
  };
});

const mockLoadContactFieldConfig = vi.fn();
const mockSaveContactFieldConfig = vi.fn();
const mockLoadContactPreferences = vi.fn();
const mockSaveContactPreferences = vi.fn();

vi.mock('../services/contactPreferencesService.js', () => ({
  getUserColumnPreferences: (...args: unknown[]) => mockGetUserColumnPreferences(...args),
  setUserColumnPreferences: (...args: unknown[]) => mockSetUserColumnPreferences(...args),
  loadContactPreferences: (...args: unknown[]) => mockLoadContactPreferences(...args),
  saveContactPreferences: (...args: unknown[]) => mockSaveContactPreferences(...args),
  listContactsSavedReports: (...args: unknown[]) => mockListContactsSavedReports(...args),
  createContactsSavedReport: (...args: unknown[]) => mockCreateContactsSavedReport(...args),
  deleteContactsSavedReport: (...args: unknown[]) => mockDeleteContactsSavedReport(...args),
  touchContactsSavedReportRun: (...args: unknown[]) => mockTouchContactsSavedReportRun(...args),
}));

vi.mock('../services/userColumnPreferencesService.js', () => ({
  getUserColumnPreferencesForModule: (...args: unknown[]) => mockGetUserColumnPreferencesForModule(...args),
  setUserColumnPreferencesForModule: (...args: unknown[]) => mockSetUserColumnPreferencesForModule(...args),
}));


vi.mock('../services/contactConfigService.js', () => ({
  loadContactFieldConfig: (...args: unknown[]) => mockLoadContactFieldConfig(...args),
  saveContactFieldConfig: (...args: unknown[]) => mockSaveContactFieldConfig(...args),
}));

const mockLoadContactLookupsMap = vi.fn();
const mockReplaceContactLookupKind = vi.fn();

vi.mock('../services/contactLookupsService.js', () => ({
  loadContactLookupsMap: (...args: unknown[]) => mockLoadContactLookupsMap(...args),
  loadContactLookupKind: vi.fn(),
  replaceContactLookupKind: (...args: unknown[]) => mockReplaceContactLookupKind(...args),
}));

vi.mock('../services/auth/userService.js', () => ({
  getLinkedContactId: (...args: unknown[]) => mockGetLinkedContactId(...args),
}));

vi.mock('../services/contactGoogleSyncService.js', () => ({
  getContactGoogleSyncConfig: (...args: unknown[]) => mockGetContactGoogleSyncConfig(...args),
  setContactGoogleSyncConfig: vi.fn(),
  clearContactGoogleSyncConfig: vi.fn(),
  clearGoogleSyncTokens: vi.fn(),
  redactGoogleSyncConfigForClient: (...args: unknown[]) => mockRedactGoogleSyncConfigForClient(...args),
  exchangeGoogleContactsOAuthCode: vi.fn(),
  runGoogleContactsSync: vi.fn(),
  GoogleOAuthExchangeError: class GoogleOAuthExchangeError extends Error {},
  GoogleSyncError: class GoogleSyncError extends Error {
    code = 'api_error';
  },
}));

vi.mock('../services/auditService.js', () => ({
  recordAudit: (...args: unknown[]) => mockRecordAudit(...args),
}));

vi.mock('../services/backgroundJobWorkerService.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    enqueueBackgroundJob: (...args: unknown[]) => mockEnqueueBackgroundJob(...args),
    getUserBackgroundJob: (...args: unknown[]) => mockGetUserBackgroundJob(...args),
  };
});

import { buildApp } from '../app.js';
import { CONTACTS_MODULE_MANIFEST } from '@mms/shared';
import { ContactUniqueFieldError } from '../services/contactUniqueValidationService.js';
import { accountantToken, adminToken, teacherToken, viewerToken } from './helpers/tokens.js';


const sampleContact = {
  id: 'c1',
  firstName: 'Ali',
  lastName: 'Khan',
  name: 'Ali Khan',
  phones: [{ label: 'Mobile', number: '3001234567', countryCode: '+92' }],
};

describe('contacts REST routes', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    mockGetLinkedContactId.mockReset().mockResolvedValue(null);
    mockGetContactGoogleSyncConfig.mockReset().mockResolvedValue({
      clientId: 'cid',
      isConfigured: true,
      isConnected: false,
    });
    mockRedactGoogleSyncConfigForClient.mockReset().mockImplementation((config: unknown) => config);
    mockLoadContacts.mockReset().mockResolvedValue([sampleContact]);
    mockCountContacts.mockReset().mockResolvedValue(1);
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
    mockMergeContactsById.mockReset().mockResolvedValue({
      ...sampleContact,
      id: 'c1',
      name: 'Merged Person',
    });
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
    mockGetUserBackgroundJob.mockReset().mockResolvedValue(null);
    mockMatchContactIdentityIndex.mockReset().mockResolvedValue({
      phones: [],
      emails: [],
      names: [],
    });
    mockLoadContactFieldUsageCount.mockReset().mockResolvedValue(0);
    mockLoadContactFieldUsageCounts.mockReset().mockResolvedValue({ customNotes: 0 });
    mockLoadContactsCommandMetrics.mockReset().mockResolvedValue({
      total: 10,
      newThisPeriod: 2,
      whatsappCount: 5,
      incompleteCount: 1,
      duplicatePairCount: 0,
    });
    mockLoadContactsReportAnalytics.mockReset().mockResolvedValue({
      analytics: {
        total: 10,
        activeCount: 10,
        whatsappCount: 5,
        whatsappRate: 50,
        missingInfoCount: 1,
        newLast30Days: 2,
        newPrior30Days: 1,
        newThisPeriod: 2,
        hasSignupDates: true,
        growthRecentSignups30d: 2,
        growthPriorSignups30d: 1,
      },
    });
    mockLoadContactsWidgetAggregates.mockReset().mockResolvedValue({
      'w1': { value: 10, totalCount: 10, chartData: [{ name: 'Male', value: 6 }] },
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

  it('GET /api/contacts lists a page for authorized roles', async () => {
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
    expect(res.json()).toEqual({
      contacts: [sampleContact],
      total: 1,
      page: 1,
      limit: 50,
      hasMore: false,
    });
    expect(mockLoadContactsPage).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, includeDeleted: false }),
    );
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
    expect(mockCountContacts).toHaveBeenCalled();
    await app.close();
  });

  it('GET /api/contacts/metrics loads command metrics for authorized roles', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/contacts/metrics',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      metrics: {
        total: 10,
        newThisPeriod: 2,
        whatsappCount: 5,
        incompleteCount: 1,
        duplicatePairCount: 0,
      },
    });
    expect(mockLoadContactsCommandMetrics).toHaveBeenCalled();
    await app.close();
  });

  it('GET /api/contacts/metrics returns 403 for roles without read access', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/contacts/metrics',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${viewerToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({ type: 'forbidden' });
    expect(mockLoadContactsCommandMetrics).not.toHaveBeenCalled();
    await app.close();
  });

  it('GET /api/contacts/report-analytics loads analytics for authorized roles', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/contacts/report-analytics',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      analytics: expect.objectContaining({ total: 10, whatsappRate: 50 }),
    });
    expect(mockLoadContactsReportAnalytics).toHaveBeenCalled();
    await app.close();
  });

  it('GET /api/contacts/report-analytics returns 403 for roles without read access', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/contacts/report-analytics',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${viewerToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({ type: 'forbidden' });
    expect(mockLoadContactsReportAnalytics).not.toHaveBeenCalled();
    await app.close();
  });

  it('POST /api/contacts/widget-aggregates loads aggregates for authorized roles', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts/widget-aggregates',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
        'content-type': 'application/json',
      },
      payload: {
        widgets: [{ id: 'w1', operation: 'count', xAxisField: 'gender' }],
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      results: {
        w1: { value: 10, totalCount: 10, chartData: [{ name: 'Male', value: 6 }] },
      },
    });
    expect(mockLoadContactsWidgetAggregates).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'w1', operation: 'count', xAxisField: 'gender' }),
    ]);
    await app.close();
  });

  it('POST /api/contacts/widget-aggregates returns 403 for roles without read access', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts/widget-aggregates',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${viewerToken(app)}`,
        'content-type': 'application/json',
      },
      payload: {
        widgets: [{ id: 'w1', operation: 'count' }],
      },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({ type: 'forbidden' });
    expect(mockLoadContactsWidgetAggregates).not.toHaveBeenCalled();
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
    const deletedContact = { ...sampleContact, deletedAt: '2026-01-02T00:00:00.000Z' };
    mockLoadContactsPage.mockResolvedValueOnce({
      contacts: [deletedContact],
      total: 1,
      page: 1,
      limit: 50,
      hasMore: false,
    });
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
    expect(res.json()).toEqual({
      contacts: [deletedContact],
      total: 1,
      page: 1,
      limit: 50,
      hasMore: false,
    });
    expect(mockLoadContactsPage).toHaveBeenCalledWith(
      expect.objectContaining({ includeDeleted: true, page: 1 }),
    );
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
    expect(mockUpdateContactById).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ firstName: 'Ali' }),
      expect.objectContaining({ applyRelationshipInference: true, language: expect.any(String) }),
    );
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
        allowDeleted: false,
      }),
    );
    expect(mockRecordAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: 'contact.export.queue',
      entityId: expect.any(String),
    }));
    await app.close();
  });

  it('POST /api/contacts/export/csv accepts selection ids', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts/export/csv',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
      payload: {
        label: 'Selection CSV',
        columns: [{ id: 'name', label: 'Name' }],
        ids: ['c1', 'c2'],
      },
    });
    expect(res.statusCode).toBe(202);
    expect(mockEnqueueBackgroundJob).toHaveBeenCalledWith(
      'demo',
      'u-teacher',
      expect.objectContaining({ moduleId: 'contacts', kind: 'export', label: 'Selection CSV' }),
      expect.objectContaining({
        query: expect.objectContaining({ includeIds: ['c1', 'c2'] }),
      }),
    );
    await app.close();
  });

  it('POST /api/contacts/export/vcf queues a VCF export job', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts/export/vcf',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
      payload: {
        label: 'Apple VCF',
        filename: 'contacts.vcf',
      },
    });
    expect(res.statusCode).toBe(202);
    expect(mockEnqueueBackgroundJob).toHaveBeenCalledWith(
      'demo',
      'u-teacher',
      expect.objectContaining({ moduleId: 'contacts', kind: 'export-vcf', label: 'Apple VCF' }),
      expect.objectContaining({ filename: 'contacts.vcf' }),
    );
    await app.close();
  });

  it('POST /api/contacts/identity-match returns scoped matches for readers', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts/identity-match',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
      payload: {
        phones: ['923001234567'],
        emails: ['a@example.com'],
        names: ['syed ali'],
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      phones: expect.any(Array),
      emails: expect.any(Array),
      names: expect.any(Array),
    });
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

  it('POST /api/contacts/merge merges contacts for roles with write+delete', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts/merge',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
      payload: { keepId: 'c1', deleteId: 'c2' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      success: true,
      contact: expect.objectContaining({ id: 'c1', name: 'Merged Person' }),
    });
    expect(mockMergeContactsById).toHaveBeenCalledWith('c1', 'c2', undefined, 'u-admin');
    expect(mockRecordAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: 'contact.merge',
      entityId: 'c1',
    }));
    await app.close();
  });

  it('POST /api/contacts/merge returns 403 for viewer', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts/merge',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${viewerToken(app)}`,
      },
      payload: { keepId: 'c1', deleteId: 'c2' },
    });
    expect(res.statusCode).toBe(403);
    expect(mockMergeContactsById).not.toHaveBeenCalled();
    await app.close();
  });

  it('POST /api/contacts/merge returns 403 when role lacks delete', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts/merge',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
      payload: { keepId: 'c1', deleteId: 'c2' },
    });
    expect(res.statusCode).toBe(403);
    expect(mockMergeContactsById).not.toHaveBeenCalled();
    await app.close();
  });

  it('GET /api/contacts/column-preferences returns user layout', async () => {
    mockGetUserColumnPreferencesForModule.mockResolvedValue([{ key: 'name', enabled: true, order: 0 }]);
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
    expect(mockGetUserColumnPreferencesForModule).toHaveBeenCalledWith(
      CONTACTS_MODULE_MANIFEST.columnPreferencesObjectKey,
      'u-teacher',
    );
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
    expect(mockSetUserColumnPreferencesForModule).toHaveBeenCalledWith(
      CONTACTS_MODULE_MANIFEST.columnPreferencesObjectKey,
      'u-teacher',
      preferences,
    );
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

  it('GET /api/contacts/field-usage/:fieldKey returns 403 without read access', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/contacts/field-usage/customNotes',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${viewerToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(403);
    expect(mockLoadContactFieldUsageCount).not.toHaveBeenCalled();
    await app.close();
  });

  it('GET /api/contacts/field-usage/:fieldKey returns count for authorized roles', async () => {
    mockLoadContactFieldUsageCount.mockResolvedValueOnce(4);
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/contacts/field-usage/customNotes',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ count: 4 });
    expect(mockLoadContactFieldUsageCount).toHaveBeenCalledWith('customNotes');
    await app.close();
  });

  it('POST /api/contacts/field-usage returns 403 without read access', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts/field-usage',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${viewerToken(app)}`,
      },
      payload: { fieldKeys: ['customNotes', 'city'] },
    });
    expect(res.statusCode).toBe(403);
    expect(mockLoadContactFieldUsageCounts).not.toHaveBeenCalled();
    await app.close();
  });

  it('POST /api/contacts/field-usage returns batch counts for authorized roles', async () => {
    mockLoadContactFieldUsageCounts.mockResolvedValueOnce({ customNotes: 2, city: 0 });
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts/field-usage',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
      payload: { fieldKeys: ['customNotes', 'city'] },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ counts: { customNotes: 2, city: 0 } });
    expect(mockLoadContactFieldUsageCounts).toHaveBeenCalledWith(['customNotes', 'city']);
    await app.close();
  });

  it('GET /api/contacts returns 403 for wrong tenant host', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/contacts?page=1',
      headers: {
        host: 'other.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  it('POST /api/contacts/export/csv strips includeDeleted without contacts.delete', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts/export/csv',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
      payload: {
        label: 'Trash CSV',
        query: { includeDeleted: 'true', search: 'ali' },
      },
    });
    expect(res.statusCode).toBe(202);
    expect(mockEnqueueBackgroundJob).toHaveBeenCalledWith(
      'demo',
      'u-teacher',
      expect.objectContaining({ kind: 'export' }),
      expect.objectContaining({
        allowDeleted: false,
        query: { search: 'ali' },
      }),
    );
    await app.close();
  });

  it('POST /api/db/collections/contacts rejects REST-only entity ghost writes', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/db/collections/contacts',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
      payload: [{ id: 'ghost', firstName: 'Ghost', lastName: 'Contact' }],
    });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ type: 'not_found' });
    await app.close();
  });

  it('GET /api/db/collections/contacts rejects REST-only entity ghost reads', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/db/collections/contacts',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ type: 'not_found' });
    await app.close();
  });

  it('PUT /api/contacts/:id allows self-service update without contacts.write and skips inference', async () => {
    mockGetLinkedContactId.mockResolvedValue('c1');
    const app = await buildApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/contacts/c1',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${accountantToken(app)}`,
      },
      payload: {
        id: 'c1',
        firstName: 'Ali',
        lastName: 'Khan',
        relationshipContacts: [{ contactId: 'peer-1', relationship: 'Father' }],
      },
    });
    expect(res.statusCode).toBe(200);
    expect(mockUpdateContactById).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({
        relationshipContacts: [{ contactId: 'peer-1', relationship: 'Father' }],
      }),
      expect.objectContaining({ applyRelationshipInference: false }),
    );
    await app.close();
  });

  it('PUT /api/contacts/:id denies non-writers updating another contact', async () => {
    mockGetLinkedContactId.mockResolvedValue('linked-other');
    const app = await buildApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/contacts/c1',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${accountantToken(app)}`,
      },
      payload: {
        id: 'c1',
        firstName: 'Ali',
        lastName: 'Khan',
      },
    });
    expect(res.statusCode).toBe(403);
    expect(mockUpdateContactById).not.toHaveBeenCalled();
    await app.close();
  });

  it('POST /api/contacts returns validation_error on unique field conflict', async () => {
    mockUpsertContact.mockRejectedValueOnce(
      new ContactUniqueFieldError([
        { fieldId: 'number', tabId: 'phones', message: 'Phone Number must be unique' },
      ]),
    );
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
      payload: sampleContact,
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({
      type: 'validation_error',
      errors: [{ fieldId: 'number', tabId: 'phones' }],
    });
    await app.close();
  });

  it('GET /api/contacts/google-sync allows contacts.write and denies readers', async () => {
    const app = await buildApp();
    const allow = await app.inject({
      method: 'GET',
      url: '/api/contacts/google-sync',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
    });
    expect(allow.statusCode).toBe(200);
    expect(mockGetContactGoogleSyncConfig).toHaveBeenCalled();

    const deny = await app.inject({
      method: 'GET',
      url: '/api/contacts/google-sync',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${accountantToken(app)}`,
      },
    });
    expect(deny.statusCode).toBe(403);
    expect(deny.json()).toMatchObject({ type: 'forbidden' });
    await app.close();
  });

  it('POST /api/contacts/google-sync/run denies roles without contacts.write', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts/google-sync/run',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${accountantToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({ type: 'forbidden' });
    await app.close();
  });

  it('GET /api/contacts/lookups allows readers and PUT requires setup write', async () => {
    mockLoadContactLookupsMap.mockResolvedValue({
      genders: ['male', 'female'],
      socialPlatforms: [],
      relationships: [],
      phoneLabels: ['Mobile'],
      emailLabels: [],
      addressLabels: [],
      countryCodes: [{ country: 'Pakistan', code: '+92' }],
    });
    mockReplaceContactLookupKind.mockResolvedValue(['male', 'female', 'other']);

    const app = await buildApp();
    const readOk = await app.inject({
      method: 'GET',
      url: '/api/contacts/lookups',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
    });
    expect(readOk.statusCode).toBe(200);
    expect(readOk.json()).toMatchObject({
      lookups: { genders: ['male', 'female'] },
    });

    const writeDenied = await app.inject({
      method: 'PUT',
      url: '/api/contacts/lookups/genders',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
      payload: { items: ['male', 'female', 'other'] },
    });
    expect(writeDenied.statusCode).toBe(403);

    const writeOk = await app.inject({
      method: 'PUT',
      url: '/api/contacts/lookups/genders',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
      payload: { items: ['male', 'female', 'other'] },
    });
    expect(writeOk.statusCode).toBe(200);
    expect(mockReplaceContactLookupKind).toHaveBeenCalledWith(
      'genders',
      ['male', 'female', 'other'],
    );
    await app.close();
  });

  it('GET/PUT /api/contacts/field-config and /preferences require setup permissions', async () => {
    mockLoadContactFieldConfig.mockResolvedValue({ version: 1, enabledTabs: ['basic'], fields: {} });
    mockSaveContactFieldConfig.mockResolvedValue({ version: 1, enabledTabs: ['basic'], fields: {} });
    mockLoadContactPreferences.mockResolvedValue({ defaultCountry: 'PK' });
    mockSaveContactPreferences.mockResolvedValue({ defaultCountry: 'PK' });

    const app = await buildApp();

    const fieldReadDenied = await app.inject({
      method: 'GET',
      url: '/api/contacts/field-config',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${viewerToken(app)}`,
      },
    });
    expect(fieldReadDenied.statusCode).toBe(403);

    const fieldReadOk = await app.inject({
      method: 'GET',
      url: '/api/contacts/field-config',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
    });
    expect(fieldReadOk.statusCode).toBe(200);

    const fieldWriteDenied = await app.inject({
      method: 'PUT',
      url: '/api/contacts/field-config',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
      payload: { version: 1, enabledTabs: ['basic'], fields: {} },
    });
    expect(fieldWriteDenied.statusCode).toBe(403);

    const fieldWriteOk = await app.inject({
      method: 'PUT',
      url: '/api/contacts/field-config',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
      payload: { version: 1, enabledTabs: ['basic'], fields: {} },
    });
    expect(fieldWriteOk.statusCode).toBe(200);
    expect(mockSaveContactFieldConfig).toHaveBeenCalled();

    const prefsWriteDenied = await app.inject({
      method: 'PUT',
      url: '/api/contacts/preferences',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
      payload: { defaultCountry: 'PK' },
    });
    expect(prefsWriteDenied.statusCode).toBe(403);

    const prefsWriteOk = await app.inject({
      method: 'PUT',
      url: '/api/contacts/preferences',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
      payload: { defaultCountry: 'PK' },
    });
    expect(prefsWriteOk.statusCode).toBe(200);
    expect(mockSaveContactPreferences).toHaveBeenCalled();
    await app.close();
  });
});

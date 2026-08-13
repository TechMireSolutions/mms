import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app.js';
import { accountantToken, guardianToken } from './helpers/tokens.js';
import type { Account, JournalEntry, FiscalYear } from '@mms/shared';

/** Returns an ISO date string for N days before today (time-independent). */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

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

const mockLoadAccounts = vi.fn();
const mockLoadAccountsPage = vi.fn();
const mockUpsertAccounts = vi.fn();
const mockLoadEntries = vi.fn();
const mockLoadEntriesPage = vi.fn();
const mockUpsertEntries = vi.fn();
const mockLoadFiscalYears = vi.fn();
const mockLoadFiscalYearsPage = vi.fn();
const mockUpsertFiscalYears = vi.fn();
const mockDeleteJournalEntryById = vi.fn();
const mockRestoreJournalEntryById = vi.fn();
const mockBulkSoftDeleteJournalEntries = vi.fn();
const mockBulkRestoreJournalEntries = vi.fn();

vi.mock('../services/accountingService.js', () => ({
  loadAccounts: (...args: unknown[]) => mockLoadAccounts(...args),
  loadAccountsPage: (...args: unknown[]) => mockLoadAccountsPage(...args),
  upsertAccounts: (...args: unknown[]) => mockUpsertAccounts(...args),
  loadEntries: (...args: unknown[]) => mockLoadEntries(...args),
  loadEntriesPage: (...args: unknown[]) => mockLoadEntriesPage(...args),
  upsertEntries: (...args: unknown[]) => mockUpsertEntries(...args),
  loadFiscalYears: (...args: unknown[]) => mockLoadFiscalYears(...args),
  loadFiscalYearsPage: (...args: unknown[]) => mockLoadFiscalYearsPage(...args),
  upsertFiscalYears: (...args: unknown[]) => mockUpsertFiscalYears(...args),
  deleteJournalEntryById: (...args: unknown[]) => mockDeleteJournalEntryById(...args),
  restoreJournalEntryById: (...args: unknown[]) => mockRestoreJournalEntryById(...args),
  bulkSoftDeleteJournalEntries: (...args: unknown[]) => mockBulkSoftDeleteJournalEntries(...args),
  bulkRestoreJournalEntries: (...args: unknown[]) => mockBulkRestoreJournalEntries(...args),
}));

const mockGetUserColumnPreferencesForModule = vi.fn();
const mockSetUserColumnPreferencesForModule = vi.fn();

vi.mock('../services/userColumnPreferencesService.js', () => ({
  getUserColumnPreferencesForModule: (...args: unknown[]) => mockGetUserColumnPreferencesForModule(...args),
  setUserColumnPreferencesForModule: (...args: unknown[]) => mockSetUserColumnPreferencesForModule(...args),
}));

const sampleAccount: Account = {
  id: 'acc-1',
  code: '1000',
  name: 'Cash',
  type: 'Asset',
  subtype: 'Current Asset',
  description: 'Main Cash',
  isActive: true,
};

const sampleEntry: JournalEntry = {
  id: 'je-1',
  date: daysAgo(5),
  ref: 'JE-0001',
  description: 'Initial Seed',
  status: 'posted',
  created_by: 'System',
  tags: ['Opening'],
  attachments: [],
  fiscal_year: 'fy-2026',
  lines: [
    {
      id: 'l1',
      account_id: 'acc-1',
      debit: 100,
      credit: 0,
      description: 'Debit Cash',
    },
    {
      id: 'l2',
      account_id: 'acc-2',
      debit: 0,
      credit: 100,
      description: 'Credit Capital',
    },
  ],
};

const sampleFiscalYear: FiscalYear = {
  id: 'fy-2026',
  label: 'FY 2026',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  status: 'active',
};

describe('accounting REST routes', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    mockLoadAccounts.mockReset().mockResolvedValue([sampleAccount]);
    mockUpsertAccounts.mockReset().mockResolvedValue([sampleAccount]);
    mockLoadEntries.mockReset().mockResolvedValue([sampleEntry]);
    mockUpsertEntries.mockReset().mockResolvedValue([sampleEntry]);
    mockLoadFiscalYears.mockReset().mockResolvedValue([sampleFiscalYear]);
    mockUpsertFiscalYears.mockReset().mockResolvedValue([sampleFiscalYear]);
    mockDeleteJournalEntryById.mockReset().mockResolvedValue(true);
    mockRestoreJournalEntryById.mockReset().mockResolvedValue(true);
    mockBulkSoftDeleteJournalEntries.mockReset().mockResolvedValue({ succeeded: 1, failed: 0 });
    mockBulkRestoreJournalEntries.mockReset().mockResolvedValue({ succeeded: 1, failed: 0 });
    mockGetUserColumnPreferencesForModule.mockReset().mockResolvedValue([]);
    mockSetUserColumnPreferencesForModule.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/accounting/accounts requires auth', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/accounting/accounts',
      headers: { host: 'demo.localhost' },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('GET /api/accounting/accounts returns 403 for unauthorized roles', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/accounting/accounts',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${guardianToken(app, {
          id: 'u-unauthorized',
          email: 'unauth@test.com',
          name: 'Unauthorized',
        })}`,
      },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  it('GET /api/accounting/accounts loads accounts for authorized users', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/accounting/accounts',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${accountantToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ accounts: [sampleAccount] });
    expect(mockLoadAccounts).toHaveBeenCalled();
    await app.close();
  });

  it('PUT /api/accounting/accounts/bulk updates accounts', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/accounting/accounts/bulk',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${accountantToken(app)}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify([sampleAccount]),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ accounts: [sampleAccount] });
    expect(mockUpsertAccounts).toHaveBeenCalledWith([sampleAccount]);
    await app.close();
  });

  it('GET /api/accounting/entries loads journal entries', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/accounting/entries',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${accountantToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ entries: [sampleEntry] });
    expect(mockLoadEntries).toHaveBeenCalled();
    await app.close();
  });

  it('PUT /api/accounting/entries/bulk updates journal entries', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/accounting/entries/bulk',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${accountantToken(app)}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify([sampleEntry]),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ entries: [sampleEntry] });
    expect(mockUpsertEntries).toHaveBeenCalledWith([sampleEntry]);
    await app.close();
  });

  it('GET /api/accounting/fiscal-years loads fiscal years', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/accounting/fiscal-years',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${accountantToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ fiscalYears: [sampleFiscalYear] });
    expect(mockLoadFiscalYears).toHaveBeenCalled();
    await app.close();
  });

  it('PUT /api/accounting/fiscal-years/bulk updates fiscal years', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/accounting/fiscal-years/bulk',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${accountantToken(app)}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify([sampleFiscalYear]),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ fiscalYears: [sampleFiscalYear] });
    expect(mockUpsertFiscalYears).toHaveBeenCalledWith([sampleFiscalYear]);
    await app.close();
  });

  it('GET /api/accounting/metrics loads metrics', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/accounting/metrics',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${accountantToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      metrics: {
        activeAccounts: 1,
        assets: 100,
        draft: 0,
        expenses: 0,
        inactiveAccounts: 0,
        liabilities: 0,
        newThisPeriod: 1,
        posted: 1,
        postedVolume: 100,
        revenue: 0,
        surplus: 0,
        totalEntries: 1,
      },
    });
    expect(mockLoadEntries).toHaveBeenCalled();
    expect(mockLoadAccounts).toHaveBeenCalled();
    await app.close();
  });

  it('GET /api/accounting/journal/column-prefs loads column preferences', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/accounting/journal/column-prefs',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${accountantToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ preferences: [] });
    expect(mockGetUserColumnPreferencesForModule).toHaveBeenCalled();
    await app.close();
  });

  it('PUT /api/accounting/journal/column-prefs saves column preferences', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/accounting/journal/column-prefs',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${accountantToken(app)}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ preferences: [{ key: 'ref', enabled: true, order: 0 }] }),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ success: true, preferences: [{ key: 'ref', enabled: true, order: 0 }] });
    expect(mockSetUserColumnPreferencesForModule).toHaveBeenCalled();
    await app.close();
  });

  it('DELETE /api/accounting/entries/:id soft-deletes journal entry', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/accounting/entries/je-1',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${accountantToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(mockDeleteJournalEntryById).toHaveBeenCalledWith('je-1', 'u-accountant');
    await app.close();
  });

  it('POST /api/accounting/entries/:id/restore restores journal entry', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/accounting/entries/je-1/restore',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${accountantToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(mockRestoreJournalEntryById).toHaveBeenCalledWith('je-1');
    await app.close();
  });
});

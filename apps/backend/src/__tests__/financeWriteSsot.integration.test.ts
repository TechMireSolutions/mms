import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app.js';
import { adminToken, viewerToken } from './helpers/tokens.js';

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

const mockBulkUpdateInvoicesStatus = vi.fn();
const mockLoadInvoicesPage = vi.fn();

vi.mock('../services/financeService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/financeService.js')>();
  return {
    ...actual,
    bulkUpdateInvoicesStatus: (...args: unknown[]) => mockBulkUpdateInvoicesStatus(...args),
    loadInvoicesPage: (...args: unknown[]) => mockLoadInvoicesPage(...args),
  };
});

describe('finance API & bulk invoice status write integration tests', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    vi.clearAllMocks();
  });

  it('POST /api/finance/invoices/bulk-status denies unauthenticated request', async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/finance/invoices/bulk-status',
      headers: { host: 'demo.localhost' },
      payload: { ids: ['inv-1'], status: 'paid' },
    });

    expect(response.statusCode).toBe(401);
  });

  it('POST /api/finance/invoices/bulk-status denies viewer role (write forbidden)', async () => {
    const app = await buildApp();
    const token = viewerToken(app);
    const response = await app.inject({
      method: 'POST',
      url: '/api/finance/invoices/bulk-status',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${token}`,
      },
      payload: { ids: ['inv-1'], status: 'paid' },
    });

    expect(response.statusCode).toBe(403);
  });

  it('POST /api/finance/invoices/bulk-status validates schema (rejects empty ids)', async () => {
    const app = await buildApp();
    const token = adminToken(app);
    const response = await app.inject({
      method: 'POST',
      url: '/api/finance/invoices/bulk-status',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${token}`,
      },
      payload: { ids: [], status: 'paid' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('POST /api/finance/invoices/bulk-status validates schema (rejects invalid status)', async () => {
    const app = await buildApp();
    const token = adminToken(app);
    const response = await app.inject({
      method: 'POST',
      url: '/api/finance/invoices/bulk-status',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${token}`,
      },
      payload: { ids: ['inv-1'], status: 'invalid-status' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('POST /api/finance/invoices/bulk-status allows admin and returns result', async () => {
    mockBulkUpdateInvoicesStatus.mockResolvedValueOnce({ succeeded: 2, failed: 0 });

    const app = await buildApp();
    const token = adminToken(app);
    const response = await app.inject({
      method: 'POST',
      url: '/api/finance/invoices/bulk-status',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${token}`,
      },
      payload: { ids: ['inv-1', 'inv-2'], status: 'paid' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toEqual({ success: true, succeeded: 2, failed: 0 });
    expect(mockBulkUpdateInvoicesStatus).toHaveBeenCalledWith(['inv-1', 'inv-2'], 'paid');
  });

  it('POST /api/finance/invoices/bulk-status handles partial success', async () => {
    mockBulkUpdateInvoicesStatus.mockResolvedValueOnce({ succeeded: 1, failed: 1 });

    const app = await buildApp();
    const token = adminToken(app);
    const response = await app.inject({
      method: 'POST',
      url: '/api/finance/invoices/bulk-status',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${token}`,
      },
      payload: { ids: ['inv-1', 'inv-99'], status: 'overdue' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toEqual({ success: true, succeeded: 1, failed: 1 });
  });
});

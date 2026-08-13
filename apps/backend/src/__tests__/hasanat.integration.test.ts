import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app.js';
import { adminToken, assistantTeacherToken, viewerToken } from './helpers/tokens.js';

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
  return {
    ...actual,
    getWorkspaceBySubdomain: vi.fn().mockImplementation(async (subdomain: string) =>
      subdomain === 'demo' ? { id: 'ws-demo', subdomain: 'demo', madrasaName: 'Demo Madrasa', enabled: true } : null,
    ),
  };
});

const mockLoadHasanatReportAggregates = vi.fn();
const mockLoadDistributionsPage = vi.fn();

vi.mock('../services/hasanatService.js', () => ({
  loadDenoms: vi.fn().mockResolvedValue([]),
  upsertDenoms: vi.fn(),
  loadBatches: vi.fn().mockResolvedValue([]),
  upsertBatches: vi.fn(),
  loadDistributions: vi.fn().mockResolvedValue([]),
  upsertDistributions: vi.fn(),
  loadRedemptions: vi.fn().mockResolvedValue([]),
  upsertRedemptions: vi.fn(),
  deleteDistributionById: vi.fn(),
  restoreDistributionById: vi.fn(),
  bulkSoftDeleteDistributions: vi.fn(),
  bulkRestoreDistributions: vi.fn(),
  loadDistributionsPage: (...args: unknown[]) => mockLoadDistributionsPage(...args),
  loadHasanatReportAggregates: (...args: unknown[]) => mockLoadHasanatReportAggregates(...args),
}));

describe('hasanat report-aggregates REST', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    mockLoadHasanatReportAggregates.mockReset().mockResolvedValue({
      comparison: { sessions: [], monthly: { a: [], b: [] } },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/hasanat/report-aggregates loads comparison for authorized roles', async () => {
    mockLoadHasanatReportAggregates.mockResolvedValueOnce({
      comparison: {
        sessions: [{ sessionId: 's1', hasanat: 250 }],
        monthly: {
          a: [{ monthKey: '2026-01', points: 100 }],
          b: [{ monthKey: '2026-04', points: 150 }],
        },
      },
    });
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/hasanat/report-aggregates?sessionIds=s1,s2&rangeAFrom=2026-01-01&rangeATo=2026-03-31&rangeBFrom=2026-04-01&rangeBTo=2026-06-30',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(mockLoadHasanatReportAggregates).toHaveBeenCalledWith({
      sessionIds: ['s1', 's2'],
      rangeAFrom: '2026-01-01',
      rangeATo: '2026-03-31',
      rangeBFrom: '2026-04-01',
      rangeBTo: '2026-06-30',
    });
    expect(res.json().comparison?.sessions?.[0]?.hasanat).toBe(250);
    await app.close();
  });

  it('GET /api/hasanat/report-aggregates returns 403 for roles without read access', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/hasanat/report-aggregates',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${viewerToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(403);
    expect(mockLoadHasanatReportAggregates).not.toHaveBeenCalled();
    await app.close();
  });
});

describe('hasanat distributions pagination', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    mockLoadDistributionsPage.mockReset().mockResolvedValue({
      distributions: [],
      total: 0,
      page: 1,
      limit: 15,
      hasMore: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/hasanat/distributions returns paginated shape and forwards filters', async () => {
    mockLoadDistributionsPage.mockResolvedValueOnce({
      distributions: [{ id: 'd-1', recipientName: 'Ali', status: 'active' }],
      total: 1,
      page: 1,
      limit: 10,
      hasMore: false,
    });
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/hasanat/distributions?page=1&limit=10&search=ali&status=active',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      distributions: [{ id: 'd-1', recipientName: 'Ali', status: 'active' }],
      total: 1,
      page: 1,
      limit: 10,
      hasMore: false,
    });
    expect(mockLoadDistributionsPage).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 10,
        search: 'ali',
        status: 'active',
        includeDeleted: false,
      }),
    );
    await app.close();
  });

  it('includeDeleted=true forwards deleted-only request for admins', async () => {
    mockLoadDistributionsPage.mockResolvedValueOnce({
      distributions: [{ id: 'd-2', recipientName: 'Archived', deletedAt: '2026-07-27T12:00:00.000Z' }],
      total: 1,
      page: 1,
      limit: 15,
      hasMore: false,
    });
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/hasanat/distributions?page=1&includeDeleted=true',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(mockLoadDistributionsPage).toHaveBeenCalledWith(expect.objectContaining({ includeDeleted: true }));
    expect(res.json().distributions[0]?.deletedAt).toBeTruthy();
    await app.close();
  });

  it('forbids includeDeleted for roles without delete access', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/hasanat/distributions?page=1&includeDeleted=true',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${assistantTeacherToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(403);
    expect(mockLoadDistributionsPage).not.toHaveBeenCalled();
    await app.close();
  });
});

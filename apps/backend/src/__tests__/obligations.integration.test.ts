import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app.js';
import { adminToken, teacherToken } from './helpers/tokens.js';

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

const mockLoadObligationsCommandMetrics = vi.fn();

vi.mock('../obligations/use-cases/obligationsUseCases.js', () => ({
  obligationsUseCases: {
    loadObligationTypes: vi.fn().mockResolvedValue([]),
    upsertObligationTypes: vi.fn(),
    loadMujtahids: vi.fn().mockResolvedValue([]),
    upsertMujtahids: vi.fn(),
    loadMujtahidReps: vi.fn().mockResolvedValue([]),
    upsertMujtahidReps: vi.fn(),
    loadWakalaTypes: vi.fn().mockResolvedValue([]),
    upsertWakalaTypes: vi.fn(),
    loadObligationDistributions: vi.fn().mockResolvedValue([]),
    upsertObligationDistributions: vi.fn(),
    loadObligationCollections: vi.fn().mockResolvedValue([]),
    upsertObligationCollections: vi.fn(),
    deleteObligationCollectionById: vi.fn(),
    restoreObligationCollectionById: vi.fn(),
    bulkSoftDeleteObligationCollections: vi.fn(),
    bulkRestoreObligationCollections: vi.fn(),
    loadObligationsCommandMetrics: (...args: unknown[]) => mockLoadObligationsCommandMetrics(...args),
    loadObligationsReportAggregates: vi.fn().mockResolvedValue({}),
    replaceObligationTypes: vi.fn(),
    replaceMujtahids: vi.fn(),
    replaceMujtahidReps: vi.fn(),
    replaceWakalaTypes: vi.fn(),
    replaceObligationDistributions: vi.fn(),
    replaceObligationCollections: vi.fn(),
  },
}));

describe('obligations metrics REST', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    mockLoadObligationsCommandMetrics.mockReset().mockResolvedValue({
      total: 2,
      totalAmount: 250,
      cash: 1,
      online: 1,
      newThisPeriod: 1,
      obligationTypes: 3,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/obligations/metrics loads SQL metrics for authorized roles', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/obligations/metrics',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      metrics: {
        total: 2,
        totalAmount: 250,
        cash: 1,
        online: 1,
        newThisPeriod: 1,
        obligationTypes: 3,
      },
    });
    expect(mockLoadObligationsCommandMetrics).toHaveBeenCalled();
    await app.close();
  });

  it('GET /api/obligations/metrics returns 403 for roles without read access', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/obligations/metrics',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(403);
    expect(mockLoadObligationsCommandMetrics).not.toHaveBeenCalled();
    await app.close();
  });
});
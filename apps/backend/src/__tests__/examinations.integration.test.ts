import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app.js';
import { teacherToken } from './helpers/tokens.js';

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

const mockLoadExams = vi.fn();

vi.mock('../services/examinationService.js', () => ({
  loadExams: (...args: unknown[]) => mockLoadExams(...args),
  upsertExams: vi.fn().mockResolvedValue([]),
  replaceExams: vi.fn(),
  loadExamResults: vi.fn().mockResolvedValue([]),
  upsertExamResults: vi.fn().mockResolvedValue([]),
  replaceExamResults: vi.fn(),
  deleteExamById: vi.fn(),
  restoreExamById: vi.fn(),
  bulkSoftDeleteExams: vi.fn(),
  bulkRestoreExams: vi.fn(),
}));

describe('examinations REST routes integration', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    mockLoadExams.mockReset().mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/examinations/exams requires auth header', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/examinations/exams',
      headers: { host: 'demo.localhost' },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('GET /api/examinations/exams returns 200 for authorized teacher', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/examinations/exams',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app, { name: 'Teacher User' })}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ exams: [] });
    await app.close();
  });
});

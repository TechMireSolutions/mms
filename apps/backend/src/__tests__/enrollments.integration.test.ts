import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app.js';

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

const mockLoadEnrollments = vi.fn();

vi.mock('../services/enrollmentService.js', () => ({
  loadEnrollments: (...args: unknown[]) => mockLoadEnrollments(...args),
  createEnrollment: vi.fn(),
  updateEnrollmentById: vi.fn(),
  deleteEnrollmentById: vi.fn(),
  restoreEnrollmentById: vi.fn(),
}));

function adminToken(app: Awaited<ReturnType<typeof buildApp>>): string {
  return app.jwt.sign({
    id: 'u-admin',
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'admin',
    workspaceSubdomain: 'demo',
    twoFactorVerified: true,
    tokenType: 'access',
  });
}

describe('enrollments REST routes integration', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    mockLoadEnrollments.mockReset().mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/enrollments requires auth header', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/enrollments',
      headers: { host: 'demo.localhost' },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('GET /api/enrollments returns 200 for authorized admin', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/enrollments',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ enrollments: [] });
    await app.close();
  });
});

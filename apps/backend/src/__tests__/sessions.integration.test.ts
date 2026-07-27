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

const mockLoadSessions = vi.fn();
const mockLoadSessionsPage = vi.fn();

vi.mock('../services/sessionService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/sessionService.js')>();
  return {
    ...actual,
    loadSessions: (...args: unknown[]) => mockLoadSessions(...args),
    loadSessionsPage: (...args: unknown[]) => mockLoadSessionsPage(...args),
  };
});

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

describe('sessions REST routes integration', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    mockLoadSessions.mockReset().mockResolvedValue([]);
    mockLoadSessionsPage.mockReset().mockResolvedValue({
      sessions: [],
      total: 0,
      page: 1,
      limit: 20,
      hasMore: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/sessions requires auth header', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/sessions',
      headers: { host: 'demo.localhost' },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('GET /api/sessions returns sessions list for authorized admin', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/sessions',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      sessions: [],
      total: 0,
      page: 1,
      limit: 20,
      hasMore: false,
    });
    await app.close();
  });
});

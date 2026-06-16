import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hashRefreshToken } from '../services/auth/authCookieService.js';

vi.mock('../db/database.js', () => ({
  initDb: vi.fn().mockResolvedValue(undefined),
  pingDatabase: vi.fn().mockResolvedValue(true),
}));

const mockFindRefreshTokenByHash = vi.fn();
const mockDeleteAuthArtifact = vi.fn();
const mockPutAuthArtifact = vi.fn();
const mockGetPublicUserById = vi.fn();
const mockGetJwtExpiresIn = vi.fn();

vi.mock('../services/auth/authArtifactService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/auth/authArtifactService.js')>();
  return {
    ...actual,
    purgeExpiredAuthArtifacts: vi.fn().mockResolvedValue(undefined),
    findRefreshTokenByHash: (...args: unknown[]) => mockFindRefreshTokenByHash(...args),
    deleteAuthArtifact: (...args: unknown[]) => mockDeleteAuthArtifact(...args),
    putAuthArtifact: (...args: unknown[]) => mockPutAuthArtifact(...args),
  };
});

vi.mock('../services/auth/userService.js', () => ({
  getPublicUserById: (...args: unknown[]) => mockGetPublicUserById(...args),
}));

vi.mock('../services/globalSettingsService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/globalSettingsService.js')>();
  return {
    ...actual,
    getJwtExpiresIn: (...args: unknown[]) => mockGetJwtExpiresIn(...args),
    loadGlobalSettings: vi.fn().mockResolvedValue({}),
  };
});

const mockValidatePlatformCredentials = vi.fn();

vi.mock('../services/platform/platformUserService.js', () => ({
  validatePlatformCredentials: (...args: unknown[]) => mockValidatePlatformCredentials(...args),
  ensurePlatformSuperUserFromEnv: vi.fn().mockResolvedValue(undefined),
  findPlatformUserByEmail: vi.fn(),
  getPublicPlatformUserById: vi.fn(),
}));

import { buildApp } from '../app.js';
import { PLATFORM_ACCESS_COOKIE } from '../services/platform/platformCookieService.js';

describe('auth routes', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    mockFindRefreshTokenByHash.mockReset();
    mockDeleteAuthArtifact.mockReset().mockResolvedValue(undefined);
    mockPutAuthArtifact.mockReset().mockResolvedValue('new-artifact-id');
    mockGetPublicUserById.mockReset();
    mockGetJwtExpiresIn.mockReset().mockResolvedValue('15m');
    mockValidatePlatformCredentials.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POST /api/auth/login rejects apex host without subdomain', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { host: 'localhost' },
      payload: { email: 'admin@test.com', password: 'password123' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ type: 'invalid_credentials' });
    await app.close();
  });

  it('POST /api/auth/refresh rejects missing cookie', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      headers: { host: 'demo.localhost' },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('POST /api/auth/refresh rejects unknown opaque token', async () => {
    mockFindRefreshTokenByHash.mockResolvedValue(null);
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      headers: { host: 'demo.localhost' },
      cookies: { mms_refresh: 'invalid-refresh-token' },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('POST /api/auth/refresh rotates session with valid artifact', async () => {
    const token = 'valid-refresh-token-value';
    mockFindRefreshTokenByHash.mockResolvedValue({
      id: 'artifact-1',
      kind: 'refresh_token',
      payload: {
        userId: 'u1',
        workspaceSubdomain: 'demo',
        tokenHash: hashRefreshToken(token),
      },
      expiresAt: new Date(Date.now() + 60_000),
    });
    mockGetPublicUserById.mockResolvedValue({
      id: 'u1',
      email: 'admin@test.com',
      name: 'Admin',
      role: 'admin',
      workspaceSubdomain: 'demo',
    });

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      headers: { host: 'demo.localhost' },
      cookies: { mms_refresh: token },
    });
    expect(res.statusCode).toBe(200);
    expect(mockDeleteAuthArtifact).toHaveBeenCalledWith('artifact-1');
    expect(res.json()).toMatchObject({ user: { email: 'admin@test.com' } });
    await app.close();
  });

  it('GET /api/auth/me rejects unauthenticated requests', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { host: 'demo.localhost' },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('GET /api/auth/me rejects JWT bound to a different tenant', async () => {
    const app = await buildApp();
    const token = app.jwt.sign({
      id: 'u1',
      email: 'admin@test.com',
      name: 'Admin',
      role: 'admin',
      workspaceSubdomain: 'other',
      twoFactorVerified: true,
      tokenType: 'access',
    });
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${token}`,
      },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  it('GET /api/auth/me rejects access token when 2FA is not verified', async () => {
    const app = await buildApp();
    const token = app.jwt.sign({
      id: 'u1',
      email: 'admin@test.com',
      name: 'Admin',
      role: 'admin',
      workspaceSubdomain: 'demo',
      twoFactorVerified: false,
      tokenType: 'access',
    });
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${token}`,
      },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({ type: 'two_factor_required' });
    await app.close();
  });

  it('POST /api/students returns 403 for roles without write access', async () => {
    const app = await buildApp();
    const token = app.jwt.sign({
      id: 'u1',
      email: 'viewer@test.com',
      name: 'Viewer',
      role: 'viewer',
      workspaceSubdomain: 'demo',
      twoFactorVerified: true,
      tokenType: 'access',
    });
    const res = await app.inject({
      method: 'POST',
      url: '/api/students',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${token}`,
      },
      payload: { id: 's1', name: 'Test Student', status: 'active', gender: 'male' },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  it('GET /api/students returns 403 for roles without read access', async () => {
    const app = await buildApp();
    const token = app.jwt.sign({
      id: 'u1',
      email: 'viewer@test.com',
      name: 'Viewer',
      role: 'viewer',
      workspaceSubdomain: 'demo',
      twoFactorVerified: true,
      tokenType: 'access',
    });
    const res = await app.inject({
      method: 'GET',
      url: '/api/students',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${token}`,
      },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  it('POST /api/auth/refresh rejects replay after rotation', async () => {
    const token = 'replay-refresh-token';
    mockFindRefreshTokenByHash.mockResolvedValueOnce({
      id: 'artifact-replay',
      kind: 'refresh_token',
      payload: {
        userId: 'u1',
        workspaceSubdomain: 'demo',
        tokenHash: hashRefreshToken(token),
      },
      expiresAt: new Date(Date.now() + 60_000),
    });
    mockGetPublicUserById.mockResolvedValue({
      id: 'u1',
      email: 'admin@test.com',
      name: 'Admin',
      role: 'admin',
      workspaceSubdomain: 'demo',
    });

    const app = await buildApp();
    const first = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      headers: { host: 'demo.localhost' },
      cookies: { mms_refresh: token },
    });
    expect(first.statusCode).toBe(200);

    mockFindRefreshTokenByHash.mockResolvedValue(null);
    const second = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      headers: { host: 'demo.localhost' },
      cookies: { mms_refresh: token },
    });
    expect(second.statusCode).toBe(401);
    await app.close();
  });

  it('POST /api/contacts returns 403 for roles without write access', async () => {
    const app = await buildApp();
    const token = app.jwt.sign({
      id: 'u1',
      email: 'viewer@test.com',
      name: 'Viewer',
      role: 'viewer',
      workspaceSubdomain: 'demo',
      twoFactorVerified: true,
      tokenType: 'access',
    });
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${token}`,
      },
      payload: { id: 'c1', firstName: 'Test', lastName: 'Contact' },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });
});

describe('platform auth routes', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    mockValidatePlatformCredentials.mockReset();
    mockGetJwtExpiresIn.mockReset().mockResolvedValue('15m');
  });

  it('POST /api/platform/auth/login rejects tenant subdomain host', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/platform/auth/login',
      headers: { host: 'demo.localhost' },
      payload: { email: 'platform@test.com', password: 'password123' },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  it('POST /api/platform/auth/login sets platform cookie on apex', async () => {
    mockValidatePlatformCredentials.mockResolvedValue({
      id: 'p1',
      email: 'platform@test.com',
      name: 'Platform Admin',
    });
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/platform/auth/login',
      headers: { host: 'localhost' },
      payload: { email: 'platform@test.com', password: 'password123' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ user: { email: 'platform@test.com' } });
    expect(res.cookies.some((c) => c.name === PLATFORM_ACCESS_COOKIE)).toBe(true);
    await app.close();
  });

  it('GET /api/platform/auth/me requires platform session on apex', async () => {
    const app = await buildApp();
    const unauth = await app.inject({
      method: 'GET',
      url: '/api/platform/auth/me',
      headers: { host: 'localhost' },
    });
    expect(unauth.statusCode).toBe(401);

    const token = app.jwt.sign({
      id: 'p1',
      email: 'platform@test.com',
      name: 'Platform Admin',
      role: 'platform_super',
      tokenType: 'platform_access',
    });
    const authed = await app.inject({
      method: 'GET',
      url: '/api/platform/auth/me',
      headers: { host: 'localhost' },
      cookies: { [PLATFORM_ACCESS_COOKIE]: token },
    });
    expect(authed.statusCode).toBe(200);
    expect(authed.json()).toMatchObject({ user: { email: 'platform@test.com' } });
    await app.close();
  });

  it('POST /api/auth/onboard requires platform authentication on apex', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/onboard',
      headers: { host: 'localhost' },
      payload: {
        madrasaName: 'Test Madrasa',
        adminName: 'Admin',
        email: 'admin@test.com',
        password: 'password123',
        subdomain: 'testmadrasa',
      },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });
});

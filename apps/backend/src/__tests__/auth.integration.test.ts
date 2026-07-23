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
const mockHasPlatformUsers = vi.fn();
const mockFindPlatformUserByEmail = vi.fn();
const mockUpdatePlatformUserPassword = vi.fn();
const mockGetStoredPlatformUserById = vi.fn();
const mockListPlatformWorkspaces = vi.fn();
const mockGetPlatformUserProfile = vi.fn().mockImplementation(async (id: string) => {
  const stored = await mockGetStoredPlatformUserById(id);
  if (!stored) return null;
  return {
    id: stored.id,
    email: stored.email,
    name: stored.name,
    role: stored.role,
    createdAt: stored.createdAt,
    emailVerifiedAt: stored.emailVerifiedAt,
  };
});

vi.mock('../services/platform/platformUserService.js', () => ({
  validatePlatformCredentials: (...args: unknown[]) => mockValidatePlatformCredentials(...args),
  ensurePlatformSuperUserFromEnv: vi.fn().mockResolvedValue(undefined),
  findPlatformUserByEmail: (...args: unknown[]) => mockFindPlatformUserByEmail(...args),
  getStoredPlatformUserById: (...args: unknown[]) => mockGetStoredPlatformUserById(...args),
  hasPlatformUsers: (...args: unknown[]) => mockHasPlatformUsers(...args),
  countPlatformUsers: vi.fn(),
  createVerifiedPlatformUser: vi.fn(),
  updatePlatformUserPassword: (...args: unknown[]) => mockUpdatePlatformUserPassword(...args),
  updatePlatformUserName: vi.fn(),
  changePlatformUserPassword: vi.fn(),
  getPlatformUserProfile: (...args: unknown[]) => mockGetPlatformUserProfile(...args),
  updatePlatformUserProfile: vi.fn(),
  toPlatformUserProfile: (stored: Record<string, unknown>) => ({
    id: stored.id,
    email: stored.email,
    name: stored.name,
    role: stored.role,
    createdAt: stored.createdAt,
    emailVerifiedAt: stored.emailVerifiedAt,
  }),
  toPublicPlatformUser: (user: Record<string, unknown>) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }),
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
    listPlatformWorkspaces: (...args: unknown[]) => mockListPlatformWorkspaces(...args),
  };
});

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
    mockHasPlatformUsers.mockReset().mockResolvedValue(true);
    mockFindPlatformUserByEmail.mockReset().mockResolvedValue(null);
    mockGetStoredPlatformUserById.mockReset().mockResolvedValue({
      id: 'p1',
      email: 'platform@test.com',
      name: 'Platform Admin',
      passwordHash: 'hash',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    mockUpdatePlatformUserPassword.mockReset();
    mockListPlatformWorkspaces.mockReset().mockResolvedValue([]);
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
    mockHasPlatformUsers.mockReset().mockResolvedValue(true);
    mockFindPlatformUserByEmail.mockReset().mockResolvedValue(null);
    mockGetStoredPlatformUserById.mockReset().mockResolvedValue({
      id: 'p1',
      email: 'platform@test.com',
      name: 'Platform Admin',
      passwordHash: 'hash',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    mockGetJwtExpiresIn.mockReset().mockResolvedValue('15m');
  });

  it('POST /api/platform/auth/password/forgot accepts unknown email without leaking', async () => {
    mockFindPlatformUserByEmail.mockResolvedValueOnce(null);
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/platform/auth/password/forgot',
      headers: { host: 'localhost' },
      payload: { email: 'unknown@example.com' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ accepted: true });
    expect(mockPutAuthArtifact).not.toHaveBeenCalled();
    await app.close();
  });

  it('POST /api/platform/auth/password/forgot sends reset for existing platform user', async () => {
    mockFindPlatformUserByEmail.mockResolvedValue({
      id: 'p1',
      email: 'admin@example.com',
      name: 'Admin',
      passwordHash: 'hash',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/platform/auth/password/forgot',
      headers: { host: 'localhost' },
      payload: { email: 'admin@example.com' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ accepted: true });
    expect(mockPutAuthArtifact).toHaveBeenCalled();
    await app.close();
  });

  it('GET /api/platform/auth/setup/status reports first-run when empty', async () => {
    mockHasPlatformUsers.mockResolvedValueOnce(false);
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/platform/auth/setup/status',
      headers: { host: 'localhost' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ needsSetup: true });
    await app.close();
  });

  it('POST /api/platform/auth/setup/register starts verification when no users exist', async () => {
    mockHasPlatformUsers.mockResolvedValue(false);
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/platform/auth/setup/register',
      headers: { host: 'localhost' },
      payload: {
        name: 'Platform Admin',
        email: 'admin@example.com',
        password: 'SecurePass1',
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { setupId: string; email: string; devCode?: string };
    expect(body.email).toBe('admin@example.com');
    expect(body.setupId).toBeTruthy();
    expect(body.devCode).toMatch(/^\d{6}$/);
    expect(mockPutAuthArtifact).toHaveBeenCalled();
    await app.close();
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

  it('POST /api/platform/auth/login sets platform session cookie on apex', async () => {
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
    const platformCookie = res.cookies.find((c) => c.name === PLATFORM_ACCESS_COOKIE);
    expect(platformCookie).toBeTruthy();
    expect(platformCookie?.maxAge).toBeUndefined();
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

  it('POST /api/auth/onboard rejects non-super-user platform sessions', async () => {
    const app = await buildApp();
    const token = app.jwt.sign({
      id: 'p-admin',
      email: 'operator@test.com',
      name: 'Platform Operator',
      role: 'admin',
      tokenType: 'platform_access',
    });
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/onboard',
      headers: { host: 'localhost' },
      cookies: { [PLATFORM_ACCESS_COOKIE]: token },
      payload: {
        madrasaName: 'Test Madrasa',
        adminName: 'Admin',
        email: 'admin@test.com',
        password: 'password123',
        subdomain: 'testmadrasa',
      },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({ type: 'forbidden' });
    await app.close();
  });

  it('GET /api/platform/workspaces rejects non-super-user platform sessions', async () => {
    const app = await buildApp();
    const token = app.jwt.sign({
      id: 'p-admin',
      email: 'operator@test.com',
      name: 'Platform Operator',
      role: 'admin',
      tokenType: 'platform_access',
    });
    const res = await app.inject({
      method: 'GET',
      url: '/api/platform/workspaces',
      headers: { host: 'localhost' },
      cookies: { [PLATFORM_ACCESS_COOKIE]: token },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({ type: 'forbidden' });
    expect(mockListPlatformWorkspaces).not.toHaveBeenCalled();
    await app.close();
  });

  it('GET /api/platform/auth/me rejects tenant access token on apex', async () => {
    const app = await buildApp();
    const token = app.jwt.sign({
      id: 'u1',
      email: 'admin@test.com',
      name: 'Admin',
      role: 'admin',
      workspaceSubdomain: 'demo',
      twoFactorVerified: true,
      tokenType: 'access',
    });
    const res = await app.inject({
      method: 'GET',
      url: '/api/platform/auth/me',
      headers: { host: 'localhost' },
      cookies: { mms_access: token },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('GET /api/auth/me rejects platform access token on tenant host', async () => {
    const app = await buildApp();
    const token = app.jwt.sign({
      id: 'p1',
      email: 'platform@test.com',
      name: 'Platform Admin',
      role: 'platform_super',
      tokenType: 'platform_access',
    });
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { host: 'demo.localhost' },
      cookies: { [PLATFORM_ACCESS_COOKIE]: token },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('GET /api/auth/me rejects tenant session on apex host', async () => {
    const app = await buildApp();
    const token = app.jwt.sign({
      id: 'u1',
      email: 'admin@test.com',
      name: 'Admin',
      role: 'admin',
      workspaceSubdomain: 'demo',
      twoFactorVerified: true,
      tokenType: 'access',
    });
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { host: 'localhost' },
      cookies: { mms_access: token },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });
});

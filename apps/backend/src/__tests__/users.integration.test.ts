import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app.js';
import type { WorkspaceUser, ActivityLog } from '@mms/shared';

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

const mockLoadWorkspaceUsers = vi.fn();
const mockUpsertWorkspaceUsers = vi.fn();
const mockLoadLogs = vi.fn();
const mockReplaceLogs = vi.fn();
const mockDeleteUserById = vi.fn();
const mockRestoreUserById = vi.fn();
const mockBulkSoftDeleteUsers = vi.fn();
const mockBulkRestoreUsers = vi.fn();

vi.mock('../services/usersService.js', () => ({
  loadWorkspaceUsers: (...args: unknown[]) => mockLoadWorkspaceUsers(...args),
  upsertWorkspaceUsers: (...args: unknown[]) => mockUpsertWorkspaceUsers(...args),
  loadLogs: (...args: unknown[]) => mockLoadLogs(...args),
  replaceLogs: (...args: unknown[]) => mockReplaceLogs(...args),
  deleteUserById: (...args: unknown[]) => mockDeleteUserById(...args),
  restoreUserById: (...args: unknown[]) => mockRestoreUserById(...args),
  bulkSoftDeleteUsers: (...args: unknown[]) => mockBulkSoftDeleteUsers(...args),
  bulkRestoreUsers: (...args: unknown[]) => mockBulkRestoreUsers(...args),
}));

const mockGetUserColumnPreferencesForModule = vi.fn();
const mockSetUserColumnPreferencesForModule = vi.fn();

vi.mock('../services/userColumnPreferencesService.js', () => ({
  getUserColumnPreferencesForModule: (...args: unknown[]) => mockGetUserColumnPreferencesForModule(...args),
  setUserColumnPreferencesForModule: (...args: unknown[]) => mockSetUserColumnPreferencesForModule(...args),
}));

const sampleUser: WorkspaceUser = {
  id: 'u-1',
  contactId: 'c-1',
  name: 'Ahmed User',
  email: 'ahmed@test.com',
  loginEmail: 'ahmed@test.com',
  phone: '3001234567',
  role: 'teacher',
  status: 'active',
  twoFactorEnabled: false,
  lastLogin: '2026-06-26T12:00:00.000Z',
  createdDate: '2026-06-26',
  failedLoginAttempts: 0,
  activeSessions: 1,
  avatarInitials: 'AU',
};

const sampleLog: ActivityLog = {
  id: 'log-1',
  userId: 'u-1',
  userName: 'Ahmed User',
  action: 'login',
  module: 'auth',
  detail: 'User logged in',
  ts: '2026-06-26T12:00:00.000Z',
  ip: '127.0.0.1',
};

function adminToken(app: Awaited<ReturnType<typeof buildApp>>): string {
  return app.jwt.sign({
    id: 'u-admin',
    email: 'admin@test.com',
    name: 'Admin',
    role: 'admin',
    workspaceSubdomain: 'demo',
    twoFactorVerified: true,
    tokenType: 'access',
  });
}

function teacherToken(app: Awaited<ReturnType<typeof buildApp>>): string {
  return app.jwt.sign({
    id: 'u-teacher',
    email: 'teacher@test.com',
    name: 'Teacher',
    role: 'teacher',
    workspaceSubdomain: 'demo',
    twoFactorVerified: true,
    tokenType: 'access',
  });
}

describe('users REST routes', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    mockLoadWorkspaceUsers.mockReset().mockResolvedValue([sampleUser]);
    mockUpsertWorkspaceUsers.mockReset().mockResolvedValue([sampleUser]);
    mockLoadLogs.mockReset().mockResolvedValue([sampleLog]);
    mockReplaceLogs.mockReset().mockResolvedValue([sampleLog]);
    mockDeleteUserById.mockReset().mockResolvedValue(true);
    mockRestoreUserById.mockReset().mockResolvedValue(true);
    mockBulkSoftDeleteUsers.mockReset().mockResolvedValue({ succeeded: 1, failed: 0 });
    mockBulkRestoreUsers.mockReset().mockResolvedValue({ succeeded: 1, failed: 0 });
    mockGetUserColumnPreferencesForModule.mockReset().mockResolvedValue([]);
    mockSetUserColumnPreferencesForModule.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/users requires auth', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/users',
      headers: { host: 'demo.localhost' },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('GET /api/users returns 403 for unauthorized roles', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/users',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  it('GET /api/users loads users for admin', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/users',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ users: [sampleUser] });
    expect(mockLoadWorkspaceUsers).toHaveBeenCalledWith({ includeDeleted: false });
    await app.close();
  });

  it('GET /api/users?includeDeleted=true loads trash for admin', async () => {
    const deletedUser = {
      ...sampleUser,
      deletedAt: '2026-07-01T00:00:00.000Z',
      deletedBy: 'u-admin',
    };
    mockLoadWorkspaceUsers.mockResolvedValueOnce([deletedUser]);
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/users?includeDeleted=true',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ users: [deletedUser] });
    expect(mockLoadWorkspaceUsers).toHaveBeenCalledWith({ includeDeleted: true });
    await app.close();
  });

  it('PUT /api/users/bulk updates users', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/users/bulk',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify([sampleUser]),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ users: [sampleUser] });
    expect(mockUpsertWorkspaceUsers).toHaveBeenCalledWith([sampleUser]);
    await app.close();
  });

  it('DELETE /api/users/:id soft-deletes a user', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/users/u-1',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ success: true });
    expect(mockDeleteUserById).toHaveBeenCalledWith('u-1', 'u-admin');
    await app.close();
  });

  it('POST /api/users/:id/restore restores a user', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/users/u-1/restore',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ success: true });
    expect(mockRestoreUserById).toHaveBeenCalledWith('u-1');
    await app.close();
  });

  it('POST /api/users/bulk-restore restores multiple users', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/users/bulk-restore',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ ids: ['u-1'] }),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ success: true, succeeded: 1, failed: 0 });
    expect(mockBulkRestoreUsers).toHaveBeenCalledWith(['u-1']);
    await app.close();
  });

  it('GET /api/users/activity loads logs', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/users/activity',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`, // activity log is read-accessible to staff
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ logs: [sampleLog] });
    expect(mockLoadLogs).toHaveBeenCalled();
    await app.close();
  });

  it('PUT /api/users/activity/bulk updates logs', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/users/activity/bulk',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${teacherToken(app)}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify([sampleLog]),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ logs: [sampleLog] });
    expect(mockReplaceLogs).toHaveBeenCalledWith([sampleLog]);
    await app.close();
  });

  it('GET /api/users/column-prefs loads column preferences', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/users/column-prefs',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ preferences: [] });
    expect(mockGetUserColumnPreferencesForModule).toHaveBeenCalled();
    await app.close();
  });
});

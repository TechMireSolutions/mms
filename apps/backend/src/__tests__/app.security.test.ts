import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../db/database.js', () => ({
  initDb: vi.fn().mockResolvedValue(undefined),
  pingDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock('../services/auth/authArtifactService.js', () => ({
  purgeExpiredAuthArtifacts: vi.fn().mockResolvedValue(undefined),
  putAuthArtifact: vi.fn(),
  takeAuthArtifact: vi.fn(),
}));

import { buildApp } from '../app.js';
import { canDownloadBulkSync } from '../services/rbacService.js';

describe('rbac bulk sync download', () => {
  it('allows admin only', () => {
    expect(canDownloadBulkSync({ id: '1', email: 'a@b.c', name: 'A', role: 'admin', workspaceSubdomain: 'x' })).toBe(true);
    expect(canDownloadBulkSync({ id: '1', email: 'a@b.c', name: 'A', role: 'teacher', workspaceSubdomain: 'x' })).toBe(false);
  });
});

describe('tenant JWT binding', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects db sync without auth', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/db/sync',
      headers: { host: 'demo.localhost' },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('rejects contacts write without auth', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contacts',
      headers: { host: 'demo.localhost' },
      payload: { firstName: 'Test' },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toMatchObject({ type: 'auth_required' });
    await app.close();
  });

  it('rejects email integration for non-admin', async () => {
    const app = await buildApp();
    const token = app.jwt.sign({
      id: 'u1',
      email: 'teacher@test.com',
      name: 'Teacher',
      role: 'teacher',
      workspaceSubdomain: 'demo',
      twoFactorVerified: true,
      tokenType: 'access',
    });
    const res = await app.inject({
      method: 'GET',
      url: '/api/email/integration',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${token}`,
      },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({ type: 'forbidden' });
    await app.close();
  });

  it('rejects db reset for non-admin', async () => {
    const app = await buildApp();
    const token = app.jwt.sign({
      id: 'u1',
      email: 'teacher@test.com',
      name: 'Teacher',
      role: 'teacher',
      workspaceSubdomain: 'demo',
      twoFactorVerified: true,
      tokenType: 'access',
    });
    const res = await app.inject({
      method: 'POST',
      url: '/api/db/reset',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${token}`,
      },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({ type: 'forbidden' });
    await app.close();
  });

  it('rejects collection read for roles without access', async () => {
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
      url: '/api/db/collections/students',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${token}`,
      },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({ type: 'forbidden' });
    await app.close();
  });

  it('sets security headers and request id', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { host: 'localhost' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-request-id']).toBeTruthy();
    await app.close();
  });

  it('returns stable not found shape', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/does-not-exist',
      headers: { host: 'localhost' },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ type: 'not_found' });
    await app.close();
  });
});

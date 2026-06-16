import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./db/database.js', () => ({
  initDb: vi.fn().mockResolvedValue(undefined),
  pingDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock('./services/authArtifactService.js', () => ({
  purgeExpiredAuthArtifacts: vi.fn().mockResolvedValue(undefined),
  putAuthArtifact: vi.fn(),
  takeAuthArtifact: vi.fn(),
}));

import { buildApp } from './app.js';
import { canDownloadBulkSync } from './services/rbacService.js';

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
});

import { describe, expect, it, vi } from 'vitest';
import { createUsersUseCases } from '../users/use-cases/usersUseCases.js';
import type { UsersRepository } from '../users/repository/usersRepository.js';
import { runWithTenant } from '../lib/tenantContext.js';

vi.mock('../services/auth/userService.js', () => ({
  getHydratedUsers: vi.fn().mockResolvedValue([]),
  saveUsers: vi.fn(),
}));
vi.mock('../services/auth/userServiceShared.js', () => ({
  getRawUsers: vi.fn().mockResolvedValue([]),
}));
vi.mock('../services/websocketService.js', () => ({
  broadcastCollection: vi.fn(),
  broadcastTenantUpdate: vi.fn(),
}));

function createFakeRepo(): UsersRepository {
  return {
    listTenantUsersPage: vi.fn().mockResolvedValue({ rows: [], total: 0, page: 1, limit: 50, hasMore: false }),
    countTenantUsersActive: vi.fn().mockResolvedValue(3),
    aggregateUsersCommandMetrics: vi.fn().mockResolvedValue({
      total: 3,
      active: 2,
      suspended: 0,
      admins: 1,
      twoFaEnabled: 1,
      activeSessions: 2,
    }),
    listTenantUsersByIds: vi.fn().mockResolvedValue([]),
    findTenantUserRowById: vi.fn().mockResolvedValue(null),
    softDeleteTenantUserRow: vi.fn().mockResolvedValue(true),
    restoreTenantUserRow: vi.fn().mockResolvedValue(true),
    verifyTenantUserEmailRow: vi.fn().mockResolvedValue(true),
    resetTenantUserPasswordRow: vi.fn().mockResolvedValue(true),
    listActivityLogsByWorkspace: vi.fn().mockResolvedValue([]),
    bulkSaveActivityLogs: vi.fn().mockResolvedValue(undefined),
    replaceActivityLogsForWorkspace: vi.fn().mockResolvedValue(undefined),
  };
}

describe('users use-cases (DI with fake repository)', () => {
  it('countUsers delegates to the injected repository with the active tenant', async () => {
    const repo = createFakeRepo();
    const useCases = createUsersUseCases(repo);

    const result = await runWithTenant('demo', () => useCases.countUsers());

    expect(result).toBe(3);
    expect(repo.countTenantUsersActive).toHaveBeenCalledWith('demo');
  });

  it('loadUsersCommandMetrics delegates to the injected repository', async () => {
    const repo = createFakeRepo();
    const useCases = createUsersUseCases(repo);

    const result = await runWithTenant('demo', () => useCases.loadUsersCommandMetrics());

    expect(result.total).toBe(3);
    expect(repo.aggregateUsersCommandMetrics).toHaveBeenCalledWith('demo');
  });

  it('upsertLogs delegates to the injected repository', async () => {
    const repo = createFakeRepo();
    const useCases = createUsersUseCases(repo);
    const log = {
      id: 'log-1',
      userId: 'u-1',
      action: 'create' as const,
      module: 'users',
      detail: 'Created user',
      ts: '2026-01-01T00:00:00.000Z',
      ip: '127.0.0.1',
    };

    const result = await runWithTenant('demo', () => useCases.upsertLogs([log]));

    expect(result).toEqual([log]);
    expect(repo.bulkSaveActivityLogs).toHaveBeenCalledWith('demo', [log]);
  });

  it('returns empty defaults when no tenant context is bound', async () => {
    const repo = createFakeRepo();
    const useCases = createUsersUseCases(repo);

    const count = await useCases.countUsers();
    const metrics = await useCases.loadUsersCommandMetrics();

    expect(count).toBe(0);
    expect(metrics.total).toBe(0);
    expect(repo.countTenantUsersActive).not.toHaveBeenCalled();
    expect(repo.aggregateUsersCommandMetrics).not.toHaveBeenCalled();
  });
});

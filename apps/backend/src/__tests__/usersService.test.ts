import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runWithTenant } from '../lib/tenantContext.js';

const bulkSaveActivityLogs = vi.fn();
const replaceActivityLogsForWorkspace = vi.fn();

vi.mock('../db/repositories/logsRepository.js', () => ({
  listActivityLogsByWorkspace: vi.fn().mockResolvedValue([]),
  bulkSaveActivityLogs,
  replaceActivityLogsForWorkspace,
}));

vi.mock('../services/websocketService.js', () => ({
  broadcastCollection: vi.fn(),
  broadcastTenantUpdate: vi.fn(),
}));

vi.mock('../services/auth/userService.js', () => ({
  getHydratedUsers: vi.fn().mockResolvedValue([]),
  saveUsers: vi.fn(),
}));

vi.mock('../db/repositories/tenantUserRepository.js', () => ({
  softDeleteTenantUserRow: vi.fn(),
  restoreTenantUserRow: vi.fn(),
  verifyTenantUserEmailRow: vi.fn().mockResolvedValue(true),
  findTenantUserRowById: vi.fn(),
}));

vi.mock('../services/auth/authArtifactService.js', () => ({
  deleteRefreshTokensForUser: vi.fn(),
}));

describe('usersService activity log upsert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('bulk saves supplied logs without replacing the workspace collection', async () => {
    const { upsertLogs } = await import('../services/usersService.js');
    const log = {
      id: 'log-1',
      userId: 'u-1',
      userName: 'Ahmed User',
      action: 'login' as const,
      module: 'auth',
      detail: 'User logged in',
      ts: '2026-06-26T12:00:00.000Z',
      ip: '127.0.0.1',
    };

    const result = await runWithTenant('demo', () => upsertLogs([log]));

    expect(result).toEqual([log]);
    expect(bulkSaveActivityLogs).toHaveBeenCalledWith('demo', [log]);
    expect(replaceActivityLogsForWorkspace).not.toHaveBeenCalled();
  });

  it('verifies user email and broadcasts collection update', async () => {
    const { verifyUserEmailById } = await import('../services/usersService.js');
    const { verifyTenantUserEmailRow } = await import('../db/repositories/tenantUserRepository.js');
    const { broadcastCollection } = await import('../services/websocketService.js');

    const result = await verifyUserEmailById('u-123');

    expect(result).toBe(true);
    expect(verifyTenantUserEmailRow).toHaveBeenCalledWith('u-123');
    expect(broadcastCollection).toHaveBeenCalledWith('users');
  });
});


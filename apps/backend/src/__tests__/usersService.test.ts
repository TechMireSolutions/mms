import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runWithTenant } from '../lib/tenantContext.js';
import { verifyPassword } from '../services/auth/passwordService.js';

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
  resetTenantUserPasswordRow: vi.fn(),
}));

vi.mock('../services/auth/authArtifactService.js', () => ({
  deleteRefreshTokensForUser: vi.fn(),
}));

vi.mock('../services/globalSettingsService.js', () => ({
  assertPasswordMeetsPolicy: vi.fn(),
}));

vi.mock('../services/session.service.js', () => ({
  revokeAllUserSessions: vi.fn(),
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

  it('resets a user password, forces a change, and revokes every session', async () => {
    const { resetUserPasswordById } = await import('../services/usersService.js');
    const {
      findTenantUserRowById,
      resetTenantUserPasswordRow,
    } = await import('../db/repositories/tenantUserRepository.js');
    const { assertPasswordMeetsPolicy } = await import('../services/globalSettingsService.js');
    const { deleteRefreshTokensForUser } = await import('../services/auth/authArtifactService.js');
    const { revokeAllUserSessions } = await import('../services/session.service.js');
    const { broadcastCollection } = await import('../services/websocketService.js');

    vi.mocked(findTenantUserRowById).mockResolvedValue({
      id: 'u-123',
      workspaceSubdomain: 'demo',
      passwordHash: 'old-hash',
      loginEmail: 'user@demo.local',
      name: 'Demo User',
      role: 'teacher',
      deletedAt: null,
    });
    vi.mocked(resetTenantUserPasswordRow).mockResolvedValue(true);

    const result = await resetUserPasswordById('u-123', 'TemporaryPass1!');

    expect(result).toBe(true);
    expect(assertPasswordMeetsPolicy).toHaveBeenCalledWith('TemporaryPass1!');
    const passwordHash = vi.mocked(resetTenantUserPasswordRow).mock.calls[0]?.[1];
    expect(passwordHash).toBeTruthy();
    await expect(verifyPassword('TemporaryPass1!', passwordHash!)).resolves.toBe(true);
    expect(deleteRefreshTokensForUser).toHaveBeenCalledWith('u-123');
    expect(revokeAllUserSessions).toHaveBeenCalledWith('u-123');
    expect(broadcastCollection).toHaveBeenCalledWith('users');
  });
});

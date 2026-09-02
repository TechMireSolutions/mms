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
  listTenantUsersByIds: vi.fn().mockResolvedValue([]),
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

vi.mock('../db/tenant-context.js', () => ({
  withTenant: vi.fn().mockImplementation(
    async (_tenant: string, callback: () => Promise<unknown>) => callback(),
  ),
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
    const { findTenantUserRowById, verifyTenantUserEmailRow } = await import(
      '../db/repositories/tenantUserRepository.js'
    );
    const { broadcastCollection } = await import('../services/websocketService.js');

    vi.mocked(findTenantUserRowById).mockResolvedValue({
      id: 'u-123',
      workspaceSubdomain: 'demo',
      passwordHash: 'hash',
      loginEmail: 'user@demo.local',
      name: 'Demo User',
      role: 'teacher',
      deletedAt: null,
    });

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

    const result = await runWithTenant('demo', () =>
      resetUserPasswordById('u-123', 'TemporaryPass1!'),
    );

    expect(result).toBe(true);
    expect(assertPasswordMeetsPolicy).toHaveBeenCalledWith('TemporaryPass1!');
    const passwordHash = vi.mocked(resetTenantUserPasswordRow).mock.calls[0]?.[1];
    expect(typeof passwordHash).toBe('string');
    expect(passwordHash).not.toBe('old-hash');
    expect(passwordHash!.length).toBeGreaterThan(20);
    await expect(verifyPassword('TemporaryPass1!', passwordHash!)).resolves.toBe(true);
    expect(deleteRefreshTokensForUser).toHaveBeenCalledWith('u-123');
    expect(revokeAllUserSessions).toHaveBeenCalledWith('u-123');
    expect(broadcastCollection).toHaveBeenCalledWith('users');
  });

  it('does not report a completed password reset as failed when activity logging fails', async () => {
    const { resetUserPasswordById } = await import('../services/usersService.js');
    const { findTenantUserRowById, resetTenantUserPasswordRow } = await import(
      '../db/repositories/tenantUserRepository.js'
    );
    const auxiliaryError = new Error('activity log unavailable');
    const onAuxiliaryError = vi.fn();

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
    bulkSaveActivityLogs.mockRejectedValueOnce(auxiliaryError);

    const result = await runWithTenant('demo', () =>
      resetUserPasswordById(
        'u-123',
        'TemporaryPass1!',
        'admin',
        'u-admin',
        '127.0.0.1',
        onAuxiliaryError,
      ),
    );

    expect(result).toBe(true);
    expect(onAuxiliaryError).toHaveBeenCalledWith('activity_log', auxiliaryError);
  });

  it('labels persistent credential or refresh-token failures for server diagnostics', async () => {
    const { resetUserPasswordById } = await import('../services/usersService.js');
    const { findTenantUserRowById, resetTenantUserPasswordRow } = await import(
      '../db/repositories/tenantUserRepository.js'
    );
    const { deleteRefreshTokensForUser } = await import('../services/auth/authArtifactService.js');

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
    vi.mocked(deleteRefreshTokensForUser).mockRejectedValueOnce(
      new Error('auth artifact delete failed'),
    );

    await expect(
      runWithTenant('demo', () =>
        resetUserPasswordById('u-123', 'TemporaryPass1!', 'admin', 'u-admin'),
      ),
    ).rejects.toMatchObject({
      type: 'password_reset_failed',
      passwordResetStage: 'credential_persistence',
    });
  });

  it('does not reset a user belonging to another tenant', async () => {
    const { resetUserPasswordById } = await import('../services/usersService.js');
    const { findTenantUserRowById, resetTenantUserPasswordRow } = await import(
      '../db/repositories/tenantUserRepository.js'
    );

    vi.mocked(findTenantUserRowById).mockResolvedValue({
      id: 'u-other',
      workspaceSubdomain: 'other',
      passwordHash: 'old-hash',
      loginEmail: 'user@other.local',
      name: 'Other User',
      role: 'teacher',
      deletedAt: null,
    });

    const result = await runWithTenant('demo', () =>
      resetUserPasswordById('u-other', 'TemporaryPass1!', 'admin', 'u-admin'),
    );

    expect(result).toBe(false);
    expect(resetTenantUserPasswordRow).not.toHaveBeenCalled();
  });

  it('rejects password reset of a super_admin user by a regular admin', async () => {
    const { resetUserPasswordById } = await import('../services/usersService.js');
    const { findTenantUserRowById } = await import('../db/repositories/tenantUserRepository.js');

    vi.mocked(findTenantUserRowById).mockResolvedValue({
      id: 'u-super',
      workspaceSubdomain: 'demo',
      passwordHash: 'old-hash',
      loginEmail: 'super@demo.local',
      name: 'Super Admin',
      role: 'super_admin',
      deletedAt: null,
    });

    await expect(
      runWithTenant('demo', () =>
        resetUserPasswordById('u-super', 'TemporaryPass1!', 'admin'),
      ),
    ).rejects.toThrow(
      'Cannot reset password of a Super Admin user account',
    );
  });

  it('allows password reset of a super_admin user by another super_admin', async () => {
    const { resetUserPasswordById } = await import('../services/usersService.js');
    const {
      findTenantUserRowById,
      resetTenantUserPasswordRow,
    } = await import('../db/repositories/tenantUserRepository.js');

    vi.mocked(findTenantUserRowById).mockResolvedValue({
      id: 'u-super',
      workspaceSubdomain: 'demo',
      passwordHash: 'old-hash',
      loginEmail: 'super@demo.local',
      name: 'Super Admin',
      role: 'super_admin',
      deletedAt: null,
    });
    vi.mocked(resetTenantUserPasswordRow).mockResolvedValue(true);

    const result = await runWithTenant('demo', () =>
      resetUserPasswordById('u-super', 'TemporaryPass1!', 'super_admin'),
    );
    expect(result).toBe(true);
  });

  it('rejects deleting a super_admin user by a regular admin', async () => {
    const { deleteUserById } = await import('../services/usersService.js');
    const { findTenantUserRowById } = await import('../db/repositories/tenantUserRepository.js');

    vi.mocked(findTenantUserRowById).mockResolvedValue({
      id: 'u-super',
      workspaceSubdomain: 'demo',
      passwordHash: 'old-hash',
      loginEmail: 'super@demo.local',
      name: 'Super Admin',
      role: 'super_admin',
      deletedAt: null,
    });

    await expect(deleteUserById('u-super', 'u-admin', 'admin')).rejects.toThrow(
      'Cannot delete a Super Admin user account',
    );
  });

  it('rejects assigning super_admin role by a regular admin in upsertWorkspaceUsers', async () => {
    const { upsertWorkspaceUsers } = await import('../services/usersService.js');
    const superAdminUser = {
      id: 'u-new',
      contactId: 'c-1',
      name: 'New Super',
      email: 'new@demo.local',
      loginEmail: 'new@demo.local',
      phone: '3001234567',
      role: 'super_admin',
      status: 'active' as const,
      twoFactorEnabled: false,
      lastLogin: '2026-06-26T12:00:00.000Z',
      createdDate: '2026-06-26',
      failedLoginAttempts: 0,
      activeSessions: 1,
      avatarInitials: 'NS',
    };

    await expect(upsertWorkspaceUsers([superAdminUser], 'admin')).rejects.toThrow(
      'Only Super Admin can assign the Super Admin role',
    );
  });
});

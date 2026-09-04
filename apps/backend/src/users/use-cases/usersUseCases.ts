import { randomBytes } from 'node:crypto';
import type { UsersRepository } from '../repository/usersRepository.js';
import { usersRepository } from '../repository/usersRepositoryAdapter.js';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { withTenant } from '../../db/tenant-context.js';
import { defineTenantBulkCollectionService } from '../../services/tenantBulkService.js';
import { broadcastCollection } from '../../services/websocketService.js';
import { getHydratedUsers, saveUsers } from '../../services/auth/userService.js';
import { getRawUsers, type PersistedUser } from '../../services/auth/userServiceShared.js';
import { deleteRefreshTokensForUser } from '../../services/auth/authArtifactService.js';
import { hashPassword } from '../../services/auth/passwordService.js';
import { assertPasswordMeetsPolicy } from '../../services/globalSettingsService.js';
import { revokeAllUserSessions } from '../../services/session.service.js';
import { loadContactsByIds } from '../../services/contactService.js';
import {
  type WorkspaceUser,
  type ActivityLog,
  type Contact,
  type ContactLike,
  type UsersListQuery,
  type UsersListPageResult,
  type CreateWorkspaceUserInput,
  type EditWorkspaceUserInput,
  type InviteWorkspaceUserInput,
  normalizeWorkspaceUser,
  workspaceUserListSchema,
  activityLogListSchema,
  canAssignRole,
  canManageTargetUser,
  getDisplayName,
  getPrimaryEmail,
  getPrimaryPhone,
  todayISO,
  computeUserInitials,
  createContactLookupMap,
  hydrateWorkspaceUserProfile,
} from '@mms/shared';

function createHttpError(statusCode: number, type: string, message: string): Error & { statusCode: number; type: string } {
  const err = new Error(message) as Error & { statusCode: number; type: string };
  err.statusCode = statusCode;
  err.type = type;
  return err;
}

export type UserPasswordResetFailureStage =
  | 'load_user'
  | 'password_policy'
  | 'password_hash'
  | 'credential_transaction'
  | 'credential_update'
  | 'refresh_token_revocation'
  | 'session_revocation';

export type UserPasswordResetAuxiliaryStage = 'users_broadcast' | 'activity_log';

type UserPasswordResetAuxiliaryErrorHandler = (
  stage: UserPasswordResetAuxiliaryStage,
  error: unknown,
) => void;

class UserPasswordResetError extends Error {
  readonly type = 'password_reset_failed';

  constructor(
    readonly passwordResetStage: UserPasswordResetFailureStage,
    cause: unknown,
  ) {
    super(`Password reset failed during ${passwordResetStage}`, { cause });
    this.name = 'UserPasswordResetError';
  }
}

async function runPasswordResetStage<T>(
  stage: UserPasswordResetFailureStage,
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    if (error instanceof UserPasswordResetError) throw error;
    const statusCode = (error as { statusCode?: number })?.statusCode;
    if (typeof statusCode === 'number' && statusCode < 500) throw error;
    throw new UserPasswordResetError(stage, error);
  }
}

async function runPasswordResetAuxiliaryStep(
  stage: UserPasswordResetAuxiliaryStage,
  operation: () => Promise<void>,
  onError?: UserPasswordResetAuxiliaryErrorHandler,
): Promise<void> {
  try {
    await operation();
  } catch (error: unknown) {
    onError?.(stage, error);
  }
}

/**
 * Users use-cases — composition root binding a {@link UsersRepository} to every
 * operation. Production uses the default Drizzle-backed `usersUseCases`; tests
 * can pass a fake repository to exercise orchestration in isolation.
 */
export function createUsersUseCases(repo: UsersRepository = usersRepository) {
  const logService = defineTenantBulkCollectionService<ActivityLog>(
    { listByWorkspace: repo.listActivityLogsByWorkspace, replaceForWorkspace: repo.replaceActivityLogsForWorkspace },
    activityLogListSchema,
    'user_activity_logs',
  );

  async function recordUserActivityLog(
    tenant: string,
    userId: string,
    action: ActivityLog['action'],
    detail: string,
    ip = '127.0.0.1',
  ): Promise<void> {
    const log: ActivityLog = {
      id: `log_${randomBytes(8).toString('hex')}`,
      userId,
      action,
      module: 'users',
      detail,
      ts: new Date().toISOString(),
      ip,
    };
    await repo.bulkSaveActivityLogs(tenant, [log]);
    await broadcastCollection('user_activity_logs');
  }

  async function hydrateUserRows(rows: Awaited<ReturnType<UsersRepository['listTenantUsersByIds']>>): Promise<WorkspaceUser[]> {
    const contactIds = [
      ...new Set(
        rows
          .map((row) => row.contactId)
          .filter((id): id is string | number => id != null && id !== '')
          .map(String),
      ),
    ];
    const contacts =
      contactIds.length > 0 ? (await loadContactsByIds(contactIds)) as ContactLike[] : [];
    const contactMap = createContactLookupMap(contacts);
    return rows.map((row) =>
      normalizeWorkspaceUser(
        hydrateWorkspaceUserProfile(row, contactMap) as Partial<WorkspaceUser>,
      ),
    );
  }

  const loadWorkspaceUsers = async (options?: { includeDeleted?: boolean }): Promise<WorkspaceUser[]> => {
    const users = await getHydratedUsers({ includeDeleted: options?.includeDeleted });
    return users.map((u) => normalizeWorkspaceUser(u));
  };

  const createWorkspaceUser = async (
    input: (CreateWorkspaceUserInput | WorkspaceUser) & Record<string, unknown>,
    actorId: string,
    actorRole?: string,
    ip = '127.0.0.1',
  ): Promise<WorkspaceUser> => {
    const tenant = getRequestTenant();
    if (!tenant) throw new Error('Tenant context required');

    if (actorRole && !canAssignRole(actorRole, input.role)) {
      throw createHttpError(403, 'forbidden_super_admin_assignment', 'Only Super Admin can assign the Super Admin role');
    }

    let name = String(input.name || '').trim();
    let email = String(input.email || '').trim().toLowerCase();
    let phone = String(input.phone || '').trim();
    const contactId = input.contactId;

    if (contactId != null && contactId !== '') {
      const contacts = (await loadContactsByIds([String(contactId)])) as ContactLike[];
      if (contacts.length > 0) {
        const c = contacts[0] as unknown as Contact;
        name = name || getDisplayName(c);
        email = email || (getPrimaryEmail(c) || '').toLowerCase();
        phone = phone || getPrimaryPhone(c) || '';
      }
    }

    if (!email) {
      throw createHttpError(400, 'validation_error', 'User email is required');
    }

    const existing = await getHydratedUsers();
    if (existing.some((u) => u.loginEmail?.toLowerCase() === email || u.email?.toLowerCase() === email)) {
      throw createHttpError(400, 'duplicate_user_email', `User with email "${email}" already exists`);
    }

    let passwordHash = '';
    let mustChangePassword = false;
    const setupMethod = (input as { setupMethod?: string }).setupMethod;
    const password = (input as { password?: string }).password;
    const forceReset = (input as { forceReset?: boolean }).forceReset;

    if (setupMethod === 'password' && password) {
      await assertPasswordMeetsPolicy(password);
      passwordHash = await hashPassword(password);
      mustChangePassword = forceReset !== false;
    }

    const userId = 'id' in input && input.id ? String(input.id) : randomBytes(8).toString('hex');
    const userRecord: PersistedUser = {
      id: userId,
      contactId: contactId != null ? String(contactId) : undefined,
      name: name || email,
      email,
      loginEmail: email,
      phone,
      role: input.role,
      status: setupMethod === 'invite' ? 'inactive' : (input.status ?? 'active'),
      twoFactorEnabled: input.twoFactorEnabled ?? false,
      lastLogin: '',
      createdDate: todayISO(),
      createdAt: new Date().toISOString(),
      failedLoginAttempts: 0,
      activeSessions: 0,
      avatarInitials: computeUserInitials(name || email),
      passwordHash,
      mustChangePassword,
      workspaceSubdomain: tenant,
    };

    const users = await getRawUsers();
    users.push(userRecord);
    await saveUsers(users);
    await broadcastCollection('users');

    await recordUserActivityLog(
      tenant,
      actorId,
      'create',
      `Created user ${name} (${email}) with role ${input.role}`,
      ip,
    );

    const reloaded = await loadWorkspaceUsers();
    const created = reloaded.find((u) => String(u.id) === userId);
    return created ?? normalizeWorkspaceUser(userRecord);
  };

  const deleteUserById = async (
    id: string,
    deletedBy: string,
    actorRole?: string,
    ip = '127.0.0.1',
  ): Promise<boolean> => {
    if (id === deletedBy) {
      throw createHttpError(400, 'self_delete', 'Cannot delete your own account');
    }

    const existing = await repo.findTenantUserRowById(id);
    if (!existing || existing.deletedAt) return false;

    if (actorRole && !canManageTargetUser(actorRole, existing.role)) {
      throw createHttpError(403, 'forbidden_super_admin_deletion', 'Cannot delete a Super Admin user account');
    }

    const ok = await repo.softDeleteTenantUserRow(id, deletedBy);
    if (ok) {
      await deleteRefreshTokensForUser(id);
      await broadcastCollection('users');

      const tenant = getRequestTenant();
      if (tenant) {
        await recordUserActivityLog(
          tenant,
          deletedBy,
          'delete',
          `Deleted user ${existing.name || id}`,
          ip,
        );
      }
    }
    return ok;
  };

  const restoreUserById = async (
    id: string,
    actorRole?: string,
    actorId = 'system',
    ip = '127.0.0.1',
  ): Promise<boolean> => {
    const existing = await repo.findTenantUserRowById(id);
    if (!existing) return false;

    if (actorRole && !canManageTargetUser(actorRole, existing.role)) {
      throw createHttpError(403, 'forbidden_super_admin_mutation', 'Cannot restore a Super Admin user account');
    }

    const ok = await repo.restoreTenantUserRow(id);
    if (ok) {
      await broadcastCollection('users');

      const tenant = getRequestTenant();
      if (tenant) {
        await recordUserActivityLog(
          tenant,
          actorId,
          'update',
          `Restored user ${existing.name || id}`,
          ip,
        );
      }
    }
    return ok;
  };

  return {
    loadUsersPage: async (
      query: UsersListQuery & { includeDeleted?: boolean },
    ): Promise<UsersListPageResult> => {
      const tenant = getRequestTenant();
      if (!tenant) {
        return { users: [], total: 0, page: query.page ?? 1, limit: query.limit ?? 50, hasMore: false };
      }
      const page = await repo.listTenantUsersPage(tenant, query);
      const ids = page.rows.map((row) => String(row.id));
      const rows = ids.length > 0 ? await repo.listTenantUsersByIds(ids) : [];
      const byId = new Map(rows.map((row) => [String(row.id), row]));
      const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as typeof rows;
      const users = await hydrateUserRows(ordered);
      return {
        users,
        total: page.total,
        page: page.page,
        limit: page.limit,
        hasMore: page.hasMore,
      };
    },

    loadUsersByIds: async (ids: string[]): Promise<WorkspaceUser[]> => {
      const uniqueIds = [...new Set(ids.map(String).filter(Boolean))];
      if (uniqueIds.length === 0) return [];
      const rows = await repo.listTenantUsersByIds(uniqueIds);
      return hydrateUserRows(rows);
    },

    countUsers: async (): Promise<number> => {
      const tenant = getRequestTenant();
      if (!tenant) return 0;
      return repo.countTenantUsersActive(tenant);
    },

    loadUsersCommandMetrics: async () => {
      const tenant = getRequestTenant();
      if (!tenant) {
        return {
          total: 0,
          active: 0,
          suspended: 0,
          admins: 0,
          twoFaEnabled: 0,
          activeSessions: 0,
        };
      }
      return repo.aggregateUsersCommandMetrics(tenant);
    },

    // --- Users ---
    loadWorkspaceUsers,

    upsertWorkspaceUsers: async (
      records: WorkspaceUser[],
      actorRole?: string,
    ): Promise<WorkspaceUser[]> => {
      const parsed = workspaceUserListSchema.parse(records);
      const existing = await getHydratedUsers();

      const existingById = new Map(existing.map((u) => [String(u.id), u] as const));
      const updatesById = new Map(parsed.map((u) => [String(u.id), u] as const));

      if (actorRole) {
        for (const update of parsed) {
          const existingUser = existingById.get(String(update.id));
          if (existingUser && !canManageTargetUser(actorRole, existingUser.role)) {
            throw createHttpError(403, 'forbidden_super_admin_mutation', 'Cannot modify a Super Admin user account');
          }
          if (update.role && !canAssignRole(actorRole, update.role)) {
            throw createHttpError(403, 'forbidden_super_admin_assignment', 'Only Super Admin can assign the Super Admin role');
          }
        }
      }

      const merged = existing.map((u) => updatesById.get(String(u.id)) ?? u);
      for (const update of parsed) {
        if (!existingById.has(String(update.id))) {
          merged.push(update as unknown as (typeof existing)[number]);
        }
      }

      await saveUsers(merged as unknown as Parameters<typeof saveUsers>[0]);
      await broadcastCollection('users');
      return loadWorkspaceUsers();
    },

    createWorkspaceUser,

    updateWorkspaceUser: async (
      id: string,
      input: Partial<EditWorkspaceUserInput> & Record<string, unknown>,
      actorId: string,
      actorRole?: string,
      ip = '127.0.0.1',
    ): Promise<WorkspaceUser> => {
      const tenant = getRequestTenant();
      if (!tenant) throw new Error('Tenant context required');

      const existingRow = await repo.findTenantUserRowById(id);
      if (!existingRow || existingRow.deletedAt) {
        throw createHttpError(404, 'not_found', 'User not found');
      }

      if (actorRole && !canManageTargetUser(actorRole, existingRow.role)) {
        throw createHttpError(403, 'forbidden_super_admin_mutation', 'Cannot modify a Super Admin user account');
      }

      if (input.role && actorRole && !canAssignRole(actorRole, input.role)) {
        throw createHttpError(403, 'forbidden_super_admin_assignment', 'Only Super Admin can assign the Super Admin role');
      }

      const rawUsers = await getRawUsers();
      const target = rawUsers.find((u) => String(u.id) === id);
      if (!target) {
        throw createHttpError(404, 'not_found', 'User not found');
      }

      if (input.contactId !== undefined) {
        target.contactId = input.contactId != null && input.contactId !== '' ? String(input.contactId) : undefined;
      }
      if (input.role !== undefined) target.role = input.role;
      if (input.status !== undefined) target.status = input.status;
      if (input.twoFactorEnabled !== undefined) target.twoFactorEnabled = input.twoFactorEnabled;

      for (const [k, v] of Object.entries(input)) {
        if (!['contactId', 'role', 'status', 'twoFactorEnabled'].includes(k)) {
          (target as Record<string, unknown>)[k] = v;
        }
      }

      await saveUsers(rawUsers);
      await broadcastCollection('users');

      await recordUserActivityLog(
        tenant,
        actorId,
        'update',
        `Updated user ${target.name || id}`,
        ip,
      );

      const reloaded = await loadWorkspaceUsers();
      const updated = reloaded.find((u) => String(u.id) === id);
      return updated ?? normalizeWorkspaceUser(target);
    },

    inviteWorkspaceUser: async (
      input: InviteWorkspaceUserInput,
      actorId: string,
      actorRole?: string,
      ip = '127.0.0.1',
    ): Promise<WorkspaceUser> => {
      return createWorkspaceUser(
        {
          ...input,
          status: input.status ?? 'inactive',
          setupMethod: 'invite',
          twoFactorEnabled: false,
        },
        actorId,
        actorRole,
        ip,
      );
    },

    deleteUserById,

    restoreUserById,

    verifyUserEmailById: async (id: string, actorRole?: string): Promise<boolean> => {
      const existing = await repo.findTenantUserRowById(id);
      if (!existing) return false;

      if (actorRole && !canManageTargetUser(actorRole, existing.role)) {
        throw createHttpError(403, 'forbidden_super_admin_mutation', 'Cannot modify a Super Admin user account');
      }

      const ok = await repo.verifyTenantUserEmailRow(id);
      if (ok) await broadcastCollection('users');
      return ok;
    },

    resetUserPasswordById: async (
      id: string,
      temporaryPassword: string,
      actorRole?: string,
      actorId = 'system',
      ip = '127.0.0.1',
      onAuxiliaryError?: UserPasswordResetAuxiliaryErrorHandler,
    ): Promise<boolean> => {
      const tenant = getRequestTenant()?.trim().toLowerCase();
      if (!tenant) {
        throw createHttpError(400, 'tenant_context_required', 'Tenant context required');
      }

      const existing = await runPasswordResetStage('load_user', () => repo.findTenantUserRowById(id));
      if (
        !existing ||
        existing.deletedAt ||
        String(existing.workspaceSubdomain).trim().toLowerCase() !== tenant
      ) {
        return false;
      }

      if (actorRole && !canManageTargetUser(actorRole, existing.role)) {
        throw createHttpError(403, 'forbidden_super_admin_mutation', 'Cannot reset password of a Super Admin user account');
      }

      await runPasswordResetStage('password_policy', () =>
        assertPasswordMeetsPolicy(temporaryPassword),
      );
      const passwordHash = await runPasswordResetStage('password_hash', () =>
        hashPassword(temporaryPassword),
      );
      const updated = await runPasswordResetStage('credential_transaction', () =>
        withTenant(tenant, async () => {
          const passwordUpdated = await runPasswordResetStage('credential_update', () =>
            repo.resetTenantUserPasswordRow(id, passwordHash),
          );
          if (!passwordUpdated) return false;

          // Keep the credential update and persistent refresh-token revocation atomic.
          await runPasswordResetStage('refresh_token_revocation', () =>
            deleteRefreshTokensForUser(id),
          );
          return true;
        }),
      );
      if (!updated) return false;

      await runPasswordResetStage('session_revocation', () => revokeAllUserSessions(id));
      await runPasswordResetAuxiliaryStep(
        'users_broadcast',
        () => broadcastCollection('users'),
        onAuxiliaryError,
      );

      await runPasswordResetAuxiliaryStep(
        'activity_log',
        () => recordUserActivityLog(
          tenant,
          actorId,
          'update',
          `Reset password for user ${existing.name || id}`,
          ip,
        ),
        onAuxiliaryError,
      );
      return true;
    },

    bulkSoftDeleteUsers: async (
      ids: string[],
      deletedBy: string,
      actorRole?: string,
    ): Promise<{ succeeded: number; failed: number }> => {
      let succeeded = 0;
      let failed = 0;
      for (const id of ids) {
        try {
          const ok = await deleteUserById(id, deletedBy, actorRole);
          if (ok) succeeded += 1;
          else failed += 1;
        } catch {
          failed += 1;
        }
      }
      return { succeeded, failed };
    },

    bulkRestoreUsers: async (
      ids: string[],
      actorRole?: string,
    ): Promise<{ succeeded: number; failed: number }> => {
      let succeeded = 0;
      let failed = 0;
      for (const id of ids) {
        try {
          const ok = await restoreUserById(id, actorRole);
          if (ok) succeeded += 1;
          else failed += 1;
        } catch {
          failed += 1;
        }
      }
      return { succeeded, failed };
    },

    // --- Activity Logs ---
    loadLogs: logService.load,

    upsertLogs: async (records: ActivityLog[]): Promise<ActivityLog[]> => {
      const tenant = getRequestTenant();
      if (!tenant) throw new Error('Tenant context required');
      const parsed = activityLogListSchema.parse(records);
      await repo.bulkSaveActivityLogs(tenant, parsed);
      await broadcastCollection('user_activity_logs');
      return parsed;
    },
  };
}

export const usersUseCases = createUsersUseCases();

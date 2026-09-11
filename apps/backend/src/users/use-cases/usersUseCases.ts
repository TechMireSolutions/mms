import { randomBytes } from 'node:crypto';
import type { UsersRepository } from '../repository/usersRepository.js';
import { usersRepository } from '../repository/usersRepositoryAdapter.js';
import { getRequestTenant, requireTenant } from '../../lib/tenantContext.js';
import { broadcastCollection } from '../../services/websocketService.js';
import { getHydratedUsers, saveUsers } from '../../services/auth/userService.js';
import { getRawUsers, type PersistedUser } from '../../services/auth/userServiceShared.js';
import { deleteRefreshTokensForUser } from '../../services/auth/authArtifactService.js';
import { hashPassword } from '../../services/auth/passwordService.js';
import { assertPasswordMeetsPolicy } from '../../services/globalSettingsService.js';
import { loadContactsByIds } from '../../services/contactService.js';
import { HttpDomainError } from '../../lib/httpErrors.js';
import {
  type WorkspaceUser,
  type Contact,
  type ContactLike,
  type UsersListQuery,
  type UsersListPageResult,
  type CreateWorkspaceUserInput,
  type EditWorkspaceUserInput,
  type InviteWorkspaceUserInput,
  normalizeWorkspaceUser,
  workspaceUserListSchema,
  canAssignRole,
  canManageTargetUser,
  getDisplayName,
  getPrimaryEmail,
  getPrimaryPhone,
  todayISO,
  computeUserInitials,
  createContactLookupMap,
  hydrateWorkspaceUserProfile,
  dedupeTrimmedIds,
} from '@mms/shared';
import {
  createUserActivityLogService,
  recordUserActivityLog,
} from './userActivityLogUseCases.js';
import {
  executeUserPasswordReset,
  type UserPasswordResetFailureStage,
  type UserPasswordResetAuxiliaryStage,
  type UserPasswordResetAuxiliaryErrorHandler,
  UserPasswordResetError,
  runPasswordResetStage,
  runPasswordResetAuxiliaryStep,
} from './userPasswordUseCases.js';

export type {
  UserPasswordResetFailureStage,
  UserPasswordResetAuxiliaryStage,
  UserPasswordResetAuxiliaryErrorHandler,
};
export { UserPasswordResetError, runPasswordResetStage, runPasswordResetAuxiliaryStep };

/**
 * Users use-cases — composition root binding a {@link UsersRepository} to every
 * operation. Production uses the default Drizzle-backed `usersUseCases`; tests
 * can pass a fake repository to exercise orchestration in isolation.
 */
export function createUsersUseCases(repo: UsersRepository = usersRepository) {
  const logService = createUserActivityLogService(repo);

  async function hydrateUserRows(
    rows: Awaited<ReturnType<UsersRepository['listTenantUsersByIds']>>,
  ): Promise<WorkspaceUser[]> {
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
    const tenant = requireTenant();

    if (actorRole && !canAssignRole(actorRole, input.role)) {
      throw new HttpDomainError(403, 'forbidden_super_admin_assignment', 'Only Super Admin can assign the Super Admin role');
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
      throw new HttpDomainError(400, 'validation_error', 'User email is required');
    }

    const existing = await getHydratedUsers();
    if (existing.some((u) => u.loginEmail?.toLowerCase() === email || u.email?.toLowerCase() === email)) {
      throw new HttpDomainError(400, 'duplicate_user_email', `User with email "${email}" already exists`);
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
      repo,
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
      throw new HttpDomainError(400, 'self_delete', 'Cannot delete your own account');
    }

    const existing = await repo.findTenantUserRowById(id);
    if (!existing || existing.deletedAt) return false;

    if (actorRole && !canManageTargetUser(actorRole, existing.role)) {
      throw new HttpDomainError(403, 'forbidden_super_admin_deletion', 'Cannot delete a Super Admin user account');
    }

    const ok = await repo.softDeleteTenantUserRow(id, deletedBy);
    if (ok) {
      await deleteRefreshTokensForUser(id);
      await broadcastCollection('users');

      const tenant = getRequestTenant();
      if (tenant) {
        await recordUserActivityLog(
          repo,
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
      throw new HttpDomainError(403, 'forbidden_super_admin_mutation', 'Cannot restore a Super Admin user account');
    }

    const ok = await repo.restoreTenantUserRow(id);
    if (ok) {
      await broadcastCollection('users');

      const tenant = getRequestTenant();
      if (tenant) {
        await recordUserActivityLog(
          repo,
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

    loadUsersByIds: async (ids: string[], includeDeleted = false): Promise<WorkspaceUser[]> => {
      const uniqueIds = dedupeTrimmedIds(ids);
      if (uniqueIds.length === 0) return [];
      const rows = await repo.listTenantUsersByIds(uniqueIds);
      const filtered = includeDeleted ? rows : rows.filter((r) => !r.deletedAt);
      return hydrateUserRows(filtered);
    },

    loadUserById: async (id: string, includeDeleted = false): Promise<WorkspaceUser | null> => {
      const cleanId = id?.trim();
      if (!cleanId) return null;
      const rows = await repo.listTenantUsersByIds([cleanId]);
      const row = rows[0];
      if (!row) return null;
      if (!includeDeleted && row.deletedAt) return null;
      const [user] = await hydrateUserRows([row]);
      return user ?? null;
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
            throw new HttpDomainError(403, 'forbidden_super_admin_mutation', 'Cannot modify a Super Admin user account');
          }
          if (update.role && !canAssignRole(actorRole, update.role)) {
            throw new HttpDomainError(403, 'forbidden_super_admin_assignment', 'Only Super Admin can assign the Super Admin role');
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
      const tenant = requireTenant();

      const existingRow = await repo.findTenantUserRowById(id);
      if (!existingRow || existingRow.deletedAt) {
        throw new HttpDomainError(404, 'not_found', 'User not found');
      }

      if (actorRole && !canManageTargetUser(actorRole, existingRow.role)) {
        throw new HttpDomainError(403, 'forbidden_super_admin_mutation', 'Cannot modify a Super Admin user account');
      }

      if (input.role && actorRole && !canAssignRole(actorRole, input.role)) {
        throw new HttpDomainError(403, 'forbidden_super_admin_assignment', 'Only Super Admin can assign the Super Admin role');
      }

      const rawUsers = await getRawUsers();
      const target = rawUsers.find((u) => String(u.id) === id);
      if (!target) {
        throw new HttpDomainError(404, 'not_found', 'User not found');
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
        repo,
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
        throw new HttpDomainError(403, 'forbidden_super_admin_mutation', 'Cannot modify a Super Admin user account');
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
      return executeUserPasswordReset(repo, {
        id,
        temporaryPassword,
        actorRole,
        actorId,
        ip,
        onAuxiliaryError,
      });
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
      actorId = 'system',
      ip = '127.0.0.1',
    ): Promise<{ succeeded: number; failed: number }> => {
      let succeeded = 0;
      let failed = 0;
      for (const id of ids) {
        try {
          const ok = await restoreUserById(id, actorRole, actorId, ip);
          if (ok) succeeded += 1;
          else failed += 1;
        } catch {
          failed += 1;
        }
      }
      return { succeeded, failed };
    },

    // --- Activity Logs ---
    loadLogs: logService.loadLogs,
    loadLogById: logService.loadLogById,
    loadLogsByIds: logService.loadLogsByIds,
    saveLog: logService.saveLog,
    upsertLogs: logService.upsertLogs,
  };
}

export const usersUseCases = createUsersUseCases();

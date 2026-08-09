import { useCallback } from 'react';
import type { ActivityLog, SystemUser } from '@mms/shared';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import { notify } from '@/lib/notify';
import { useUsersMutations } from '@/tenant/features/users/hooks/useUsersApi';

interface UseUsersPageActionsParams {
  users: SystemUser[];
  logs: ActivityLog[];
  actorId: string;
  t: TranslationFunction;
}

export function useUsersPageActions({
  users,
  logs,
  actorId,
  t,
}: UseUsersPageActionsParams) {
  const {
    replaceUsers,
    replaceLogs,
    deleteUser,
    restoreUser,
    bulkDeleteUsers,
    bulkRestoreUsers,
  } = useUsersMutations();

  const saveUsers = useCallback(
    async (updater: SystemUser[] | ((prev: SystemUser[]) => SystemUser[])) => {
      const nextUsers = typeof updater === 'function' ? updater(users) : updater;
      await replaceUsers.mutateAsync(nextUsers);
    },
    [users, replaceUsers],
  );

  const saveLogs = useCallback(
    async (updater: ActivityLog[] | ((prev: ActivityLog[]) => ActivityLog[])) => {
      const nextLogs = typeof updater === 'function' ? updater(logs) : updater;
      await replaceLogs.mutateAsync(nextLogs);
    },
    [logs, replaceLogs],
  );

  const addLog = useCallback(
    async (entry: Partial<ActivityLog> & { action: ActivityLog['action']; module: string; detail: string }) => {
      await saveLogs((prev) => [
        {
          id: `log${crypto.randomUUID()}`,
          userId: entry.userId ?? actorId,
          action: entry.action,
          module: entry.module,
          detail: entry.detail,
          ts: new Date().toISOString(),
          ip: entry.ip ?? 'local',
        },
        ...prev,
      ]);
    },
    [actorId, saveLogs],
  );

  const handleDeleteUser = async (id: string): Promise<void> => {
    try {
      await deleteUser.mutateAsync(id);
      notify.success(t('users.trash.deleted'));
      await addLog({ action: 'delete', module: 'users', detail: t('users.logDeleted', { id }) });
    } catch (error: unknown) {
      notify.error(t('users.trash.actionFailed'), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleRestoreUser = async (id: string): Promise<void> => {
    try {
      await restoreUser.mutateAsync(id);
      notify.success(t('users.trash.restored'));
      await addLog({ action: 'update', module: 'users', detail: t('users.logRestored', { id }) });
    } catch (error: unknown) {
      notify.error(t('users.trash.actionFailed'), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleBulkDelete = async (ids: string[]): Promise<void> => {
    try {
      const result = await bulkDeleteUsers.mutateAsync(ids);
      if (result.failed > 0) {
        notify.warning(t('users.trash.bulkPartial', {
          succeeded: result.succeeded,
          failed: result.failed,
        }));
      } else {
        notify.success(t('users.trash.deleted'));
      }
    } catch (error: unknown) {
      notify.error(t('users.trash.actionFailed'), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleBulkRestore = async (ids: string[]): Promise<void> => {
    try {
      const result = await bulkRestoreUsers.mutateAsync(ids);
      if (result.failed > 0) {
        notify.warning(t('users.trash.bulkPartial', {
          succeeded: result.succeeded,
          failed: result.failed,
        }));
      } else {
        notify.success(t('users.trash.restored'));
      }
    } catch (error: unknown) {
      notify.error(t('users.trash.actionFailed'), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleResetPassword = (user: SystemUser): void => {
    void addLog({
      action: 'update',
      module: 'users',
      detail: t('users.logPasswordReset', { name: user.name }),
      ip: 'local',
    });
    notify.info(t('users.resetPasswordToast'), {
      description: t('users.resetPasswordToastDesc', { email: user.email }),
    });
  };

  const handleSaveEdit = async (updated: SystemUser): Promise<void> => {
    await saveUsers((prev) => prev.map((user) => (user.id === updated.id ? updated : user)));
    await addLog({ action: 'update', module: 'users', detail: t('users.logUpdated', { name: updated.name }) });
  };

  const handleInvite = async (user: SystemUser): Promise<void> => {
    await saveUsers((prev) => [user, ...prev]);
    await addLog({
      action: 'create',
      module: 'users',
      detail: t('users.logInvited', { name: user.name, email: user.email }),
      ip: 'local',
    });
  };

  const handleAddUser = async (user: SystemUser): Promise<void> => {
    await saveUsers((prev) => [user, ...prev]);
    await addLog({
      action: 'create',
      module: 'users',
      detail: t('users.logCreated', { name: user.name, email: user.email, role: user.role }),
    });
  };

  return {
    handleDeleteUser,
    handleRestoreUser,
    handleBulkDelete,
    handleBulkRestore,
    handleResetPassword,
    handleSaveEdit,
    handleInvite,
    handleAddUser,
  };
}

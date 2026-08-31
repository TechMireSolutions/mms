import { useQueryClient } from '@tanstack/react-query';
import type { WorkspaceUser, ActivityLog, UsersCommandMetricsSnapshot } from '@mms/shared';
import { USERS_MODULE_MANIFEST, normalizeWorkspaceUser, type SystemUser } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import {
  ACTIVITY_LOGS_QUERY_KEY,
  USERS_LIST_QUERY_KEY,
  USERS_METRICS_QUERY_KEY,
} from '@/tenant/features/users/hooks/usersQueryKeys';
import { tsrClient } from '@/lib/api';

const USERS_API = USERS_MODULE_MANIFEST.restBasePath;

export { USERS_LIST_QUERY_KEY, USERS_METRICS_QUERY_KEY, ACTIVITY_LOGS_QUERY_KEY };

function useUsers(options?: { enabled?: boolean; includeDeleted?: boolean }) {
  const { isAuthenticated } = useAuth();
  const includeDeleted = options?.includeDeleted ?? false;
  const enabled = options?.enabled ?? true;
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.users.list.useQuery({
    queryKey: [...USERS_LIST_QUERY_KEY, 'all', { includeDeleted }] as const,
    queryData: { query: { includeDeleted: includeDeleted ? 'true' : undefined } },
    staleTime: 30_000,
    enabled: isAuthenticated && enabled,
  });
}

export function useUsersCollection(options?: {
  enabled?: boolean;
  includeDeleted?: boolean;
}): WorkspaceUser[] {
  const query = useUsers(options);
  if (!query.data || query.data.status !== 200) return [];
  const responseData = query.data.body as any;
  const users = Array.isArray(responseData) ? responseData : (responseData?.users ?? []);
  return users.map((user: any) =>
    normalizeWorkspaceUser(user as Partial<SystemUser> & { roles?: string[]; role?: string }),
  );
}

export function useUsersMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<UsersCommandMetricsSnapshot>({
    moduleId: USERS_MODULE_MANIFEST.moduleId,
    apiPath: USERS_API,
    enabled: options?.enabled,
  });
}

export function useActivityLogs(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.users.activity.useQuery({
    queryKey: ACTIVITY_LOGS_QUERY_KEY,
    enabled,
    staleTime: 15_000,
  });
}

export function useActivityLogsCollection(options?: { enabled?: boolean }): ActivityLog[] {
  const query = useActivityLogs(options);
  if (!query.data || query.data.status !== 200) return [];
  const body = query.data.body as any;
  if (Array.isArray(body)) return body;
  return Array.isArray(body?.logs) ? body.logs : [];
}

export function useUsersMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: USERS_LIST_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: USERS_METRICS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ACTIVITY_LOGS_QUERY_KEY });
  };

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const replaceUsers = tsrClient.users.bulkUpdate.useMutation({
    onSuccess: () => {
      invalidate();
    },
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const replaceLogs = tsrClient.users.activityBulkUpdate.useMutation({
    onSuccess: () => {
      invalidate();
    },
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const deleteUser = tsrClient.users.delete.useMutation({
    onSuccess: () => invalidate(),
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const restoreUser = tsrClient.users.restore.useMutation({
    onSuccess: () => invalidate(),
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const bulkDeleteUsers = tsrClient.users.bulkDelete.useMutation({
    onSuccess: () => invalidate(),
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const bulkRestoreUsers = tsrClient.users.bulkRestore.useMutation({
    onSuccess: () => invalidate(),
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const resetPassword = tsrClient.users.resetPassword.useMutation({
    onSuccess: () => invalidate(),
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const logExportAudit = tsrClient.users.exportAudit.useMutation();

  return {
    replaceUsers: {
      ...replaceUsers,
      mutate: (users: WorkspaceUser[], opts?: any) => replaceUsers.mutate({ body: users as any }, opts),
      mutateAsync: (users: WorkspaceUser[]) => replaceUsers.mutateAsync({ body: users as any }),
    },
    replaceLogs: {
      ...replaceLogs,
      mutate: (logs: ActivityLog[], opts?: any) => replaceLogs.mutate({ body: logs as any }, opts),
      mutateAsync: (logs: ActivityLog[]) => replaceLogs.mutateAsync({ body: logs as any }),
    },
    deleteUser: {
      ...deleteUser,
      mutate: (id: string, opts?: any) => deleteUser.mutate({ params: { id }, body: {} }, opts),
      mutateAsync: (id: string) => deleteUser.mutateAsync({ params: { id }, body: {} }),
    },
    restoreUser: {
      ...restoreUser,
      mutate: (id: string, opts?: any) => restoreUser.mutate({ params: { id }, body: {} }, opts),
      mutateAsync: (id: string) => restoreUser.mutateAsync({ params: { id }, body: {} }),
    },
    bulkDeleteUsers: {
      ...bulkDeleteUsers,
      mutate: (ids: string[], opts?: any) => bulkDeleteUsers.mutate({ body: { ids } }, opts),
      mutateAsync: (ids: string[]) => bulkDeleteUsers.mutateAsync({ body: { ids } }),
    },
    bulkRestoreUsers: {
      ...bulkRestoreUsers,
      mutate: (ids: string[], opts?: any) => bulkRestoreUsers.mutate({ body: { ids } }, opts),
      mutateAsync: (ids: string[]) => bulkRestoreUsers.mutateAsync({ body: { ids } }),
    },
    resetPassword: {
      ...resetPassword,
      mutateAsync: async (input: { userId: string; temporaryPassword: string }) => {
        const response = await resetPassword.mutateAsync({
          params: { id: input.userId },
          body: { temporaryPassword: input.temporaryPassword },
        });
        if (response.status !== 200) {
          const body = response.body as { message?: string };
          throw new Error(body?.message ?? '');
        }
        return response.body;
      },
    },
    logExportAudit: {
      ...logExportAudit,
      mutate: (payload: { count: number; scope: string }, opts?: any) => logExportAudit.mutate({ body: payload }, opts),
      mutateAsync: (payload: { count: number; scope: string }) => logExportAudit.mutateAsync({ body: payload }),
    },
  };
}

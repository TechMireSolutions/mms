import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { WorkspaceUser, ActivityLog, UsersCommandMetricsSnapshot } from '@mms/shared';
import { USERS_MODULE_MANIFEST } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { useCollectionSync } from '@/hooks/useCollectionSync';
import { useServerMetrics } from '@/hooks/useServerMetrics';

const USERS_API = USERS_MODULE_MANIFEST.restBasePath;

export const USERS_LIST_QUERY_KEY = [USERS_MODULE_MANIFEST.moduleId, 'users', 'list'] as const;
export const USERS_METRICS_QUERY_KEY = [USERS_MODULE_MANIFEST.moduleId, 'metrics'] as const;
export const ACTIVITY_LOGS_QUERY_KEY = [USERS_MODULE_MANIFEST.moduleId, 'logs', 'list'] as const;

export function useUsers(options?: { enabled?: boolean; includeDeleted?: boolean }) {
  const includeDeleted = options?.includeDeleted ?? false;
  return useCollectionSync<WorkspaceUser>({
    queryKey: [...USERS_LIST_QUERY_KEY, { includeDeleted }],
    apiPath: `${USERS_API}?includeDeleted=${includeDeleted}`,
    responseKey: 'users',
    collectionName: 'users',
    enabled: options?.enabled,
    mirrorToLocalCache: false,
  });
}

export function useUsersCollection(options?: {
  enabled?: boolean;
  includeDeleted?: boolean;
}): WorkspaceUser[] {
  return useUsers(options).syncedData;
}

export function useUsersMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<UsersCommandMetricsSnapshot>({
    moduleId: USERS_MODULE_MANIFEST.moduleId,
    apiPath: USERS_API,
    enabled: options?.enabled,
  });
}

export function useActivityLogs(options?: { enabled?: boolean }) {
  return useCollectionSync<ActivityLog>({
    queryKey: ACTIVITY_LOGS_QUERY_KEY,
    apiPath: `${USERS_API}/activity`,
    responseKey: 'logs',
    collectionName: 'user_activity_logs',
    staleTime: 15_000,
    enabled: options?.enabled,
    mirrorToLocalCache: false,
  });
}

export function useActivityLogsCollection(options?: { enabled?: boolean }): ActivityLog[] {
  return useActivityLogs(options).syncedData;
}

export function useUsersMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: USERS_LIST_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: USERS_METRICS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ACTIVITY_LOGS_QUERY_KEY });
  };

  const replaceUsers = useMutation({
    mutationFn: async (users: WorkspaceUser[]) =>
      apiJson<{ users: WorkspaceUser[] }>(`${USERS_API}/bulk`, {
        method: 'PUT',
        body: JSON.stringify(users),
      }),
    onSuccess: () => {
      invalidate();
    },
  });

  const replaceLogs = useMutation({
    mutationFn: async (logs: ActivityLog[]) =>
      apiJson<{ logs: ActivityLog[] }>(`${USERS_API}/activity/bulk`, {
        method: 'PUT',
        body: JSON.stringify(logs),
      }),
    onSuccess: () => {
      invalidate();
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) =>
      apiJson<{ success: boolean }>(`${USERS_API}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    onSuccess: () => invalidate(),
  });

  const restoreUser = useMutation({
    mutationFn: async (id: string) =>
      apiJson<{ success: boolean }>(
        `${USERS_API}/${encodeURIComponent(id)}/restore`,
        { method: 'POST' },
      ),
    onSuccess: () => invalidate(),
  });

  const bulkDeleteUsers = useMutation({
    mutationFn: async (ids: string[]) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(
        `${USERS_API}/bulk-delete`,
        { method: 'POST', body: JSON.stringify({ ids }) },
      ),
    onSuccess: () => invalidate(),
  });

  const bulkRestoreUsers = useMutation({
    mutationFn: async (ids: string[]) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(
        `${USERS_API}/bulk-restore`,
        { method: 'POST', body: JSON.stringify({ ids }) },
      ),
    onSuccess: () => invalidate(),
  });

  return {
    replaceUsers,
    replaceLogs,
    deleteUser,
    restoreUser,
    bulkDeleteUsers,
    bulkRestoreUsers,
  };
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WorkspaceUser, ActivityLog, UsersCommandMetricsSnapshot } from '@mms/shared';
import { USERS_MODULE_MANIFEST, normalizeWorkspaceUser, type SystemUser } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import {
  ACTIVITY_LOGS_QUERY_KEY,
  USERS_LIST_QUERY_KEY,
  USERS_METRICS_QUERY_KEY,
} from '@/tenant/features/users/hooks/usersQueryKeys';
import { fetchAllUsersForQuery } from '@/tenant/features/users/hooks/useUsersListQueries';

const USERS_API = USERS_MODULE_MANIFEST.restBasePath;

export { USERS_LIST_QUERY_KEY, USERS_METRICS_QUERY_KEY, ACTIVITY_LOGS_QUERY_KEY };

export function useUsers(options?: { enabled?: boolean; includeDeleted?: boolean }) {
  const { isAuthenticated } = useAuth();
  const includeDeleted = options?.includeDeleted ?? false;
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: [...USERS_LIST_QUERY_KEY, 'all', { includeDeleted }] as const,
    queryFn: async ({ signal }) => {
      const users = await fetchAllUsersForQuery({ includeDeleted }, undefined);
      void signal;
      return users.map((user) =>
        normalizeWorkspaceUser(user as Partial<SystemUser> & { roles?: string[]; role?: string }),
      );
    },
    enabled: isAuthenticated && enabled,
    staleTime: 30_000,
  });
}

export function useUsersCollection(options?: {
  enabled?: boolean;
  includeDeleted?: boolean;
}): WorkspaceUser[] {
  const query = useUsers(options);
  return query.data ?? [];
}

export function useUsersMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<UsersCommandMetricsSnapshot>({
    moduleId: USERS_MODULE_MANIFEST.moduleId,
    apiPath: USERS_API,
    enabled: options?.enabled,
  });
}

export function useActivityLogs(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: ACTIVITY_LOGS_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const response = await apiJson<{ logs: ActivityLog[] }>(`${USERS_API}/activity`, { signal });
      return response.logs ?? [];
    },
    enabled: isAuthenticated && enabled,
    staleTime: 15_000,
  });
}

export function useActivityLogsCollection(options?: { enabled?: boolean }): ActivityLog[] {
  return useActivityLogs(options).data ?? [];
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

  const logExportAudit = useMutation({
    mutationFn: async (payload: { count: number; scope: string }) =>
      apiJson(`${USERS_API}/export-audit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  });

  return {
    replaceUsers,
    replaceLogs,
    deleteUser,
    restoreUser,
    bulkDeleteUsers,
    bulkRestoreUsers,
    logExportAudit,
  };
}

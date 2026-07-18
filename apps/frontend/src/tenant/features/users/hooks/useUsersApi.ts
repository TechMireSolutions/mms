import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { WorkspaceUser, ActivityLog } from '@mms/shared';
import { USERS_MODULE_CONTRACT } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { saveCollection } from '@/lib/db';
import { useCollectionSync } from '@/hooks/useCollectionSync';

const USERS_API = USERS_MODULE_CONTRACT.restBasePath;

export const USERS_LIST_QUERY_KEY = [USERS_MODULE_CONTRACT.moduleId, 'users', 'list'] as const;
export const ACTIVITY_LOGS_QUERY_KEY = [USERS_MODULE_CONTRACT.moduleId, 'logs', 'list'] as const;

export function useUsers(options?: { enabled?: boolean }) {
  return useCollectionSync<WorkspaceUser>({
    queryKey: USERS_LIST_QUERY_KEY,
    apiPath: USERS_API,
    responseKey: 'users',
    collectionName: 'users',
    enabled: options?.enabled,
  });
}

export function useUsersCollection(options?: { enabled?: boolean }): WorkspaceUser[] {
  return useUsers(options).syncedData;
}

export function useActivityLogs(options?: { enabled?: boolean }) {
  return useCollectionSync<ActivityLog>({
    queryKey: ACTIVITY_LOGS_QUERY_KEY,
    apiPath: `${USERS_API}/activity`,
    responseKey: 'logs',
    collectionName: 'user_activity_logs',
    staleTime: 15_000,
    enabled: options?.enabled,
  });
}

export function useActivityLogsCollection(options?: { enabled?: boolean }): ActivityLog[] {
  return useActivityLogs(options).syncedData;
}

export function useUsersMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: USERS_LIST_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ACTIVITY_LOGS_QUERY_KEY });
  };

  const replaceUsers = useMutation({
    mutationFn: async (users: WorkspaceUser[]) =>
      apiJson<{ users: WorkspaceUser[] }>(`${USERS_API}/bulk`, {
        method: 'PUT',
        body: JSON.stringify(users),
      }),
    onSuccess: (usersResponse) => {
      saveCollection('users', usersResponse.users);
      invalidate();
    },
  });

  const replaceLogs = useMutation({
    mutationFn: async (logs: ActivityLog[]) =>
      apiJson<{ logs: ActivityLog[] }>(`${USERS_API}/activity/bulk`, {
        method: 'PUT',
        body: JSON.stringify(logs),
      }),
    onSuccess: (logsResponse) => {
      saveCollection('user_activity_logs', logsResponse.logs);
      invalidate();
    },
  });

  return { replaceUsers, replaceLogs };
}

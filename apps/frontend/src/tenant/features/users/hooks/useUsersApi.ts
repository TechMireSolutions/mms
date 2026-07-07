import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WorkspaceUser, ActivityLog } from '@mms/shared';
import { USERS_MODULE_CONTRACT } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';
import { saveCollection } from '@/lib/db';
import { useSyncedCollection } from '@/hooks/useSyncedCollection';

const USERS_API = USERS_MODULE_CONTRACT.restBasePath;

export const USERS_LIST_QUERY_KEY = [USERS_MODULE_CONTRACT.moduleId, 'users', 'list'] as const;
export const ACTIVITY_LOGS_QUERY_KEY = [USERS_MODULE_CONTRACT.moduleId, 'logs', 'list'] as const;

async function fetchUsers(): Promise<WorkspaceUser[]> {
  const usersResponse = await apiJson<{ users: WorkspaceUser[] }>(USERS_API);
  saveCollection('users', usersResponse.users);
  return usersResponse.users;
}

export function useUsers(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: USERS_LIST_QUERY_KEY,
    queryFn: fetchUsers,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 30_000,
  });
}

export function useUsersCollection(options?: { enabled?: boolean }): WorkspaceUser[] {
  const enabled = options?.enabled ?? true;
  const queryResult = useUsers({ enabled });
  return useSyncedCollection<WorkspaceUser>({
    queryData: queryResult.data,
    isSuccess: queryResult.isSuccess,
    collectionName: 'users',
    enabled,
  });
}

async function fetchLogs(): Promise<ActivityLog[]> {
  const logsResponse = await apiJson<{ logs: ActivityLog[] }>(`${USERS_API}/activity`);
  saveCollection('user_activity_logs', logsResponse.logs);
  return logsResponse.logs;
}

export function useActivityLogs(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ACTIVITY_LOGS_QUERY_KEY,
    queryFn: fetchLogs,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 15_000,
  });
}

export function useActivityLogsCollection(options?: { enabled?: boolean }): ActivityLog[] {
  const enabled = options?.enabled ?? true;
  const queryResult = useActivityLogs({ enabled });
  return useSyncedCollection<ActivityLog>({
    queryData: queryResult.data,
    isSuccess: queryResult.isSuccess,
    collectionName: 'user_activity_logs',
    enabled,
  });
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

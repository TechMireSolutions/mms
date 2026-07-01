import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WorkspaceUser, ActivityLog, ModuleColumnPref } from '@mms/shared';
import { USERS_MODULE_CONTRACT } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';
import { getCollection, saveCollection } from '@/lib/db';
import { useLiveCollection } from '@/hooks/useLiveCollection';
import { readModuleColumnPreferences, writeModuleColumnPreferences, type ModuleColumnPreferencesResponse } from '@/lib/moduleColumnPreferencesApi';

const USERS_API = USERS_MODULE_CONTRACT.restBasePath;

export const USERS_LIST_QUERY_KEY = [USERS_MODULE_CONTRACT.moduleId, 'users', 'list'] as const;
export const ACTIVITY_LOGS_QUERY_KEY = [USERS_MODULE_CONTRACT.moduleId, 'logs', 'list'] as const;
export const USERS_COLUMN_PREFS_QUERY_KEY = [USERS_MODULE_CONTRACT.moduleId, 'column-preferences'] as const;

async function fetchUsers(): Promise<WorkspaceUser[]> {
  const usersResponse = await apiJson<{ users: WorkspaceUser[] }>(USERS_API);
  saveCollection('users', usersResponse.users);
  return getCollection<WorkspaceUser>('users', []);
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
  const { data: queryUsers = [] } = useUsers({ enabled });
  const localUsers = useLiveCollection<WorkspaceUser>('users', [], { enabled });
  if (!enabled) return [];
  if (queryUsers.length > 0) {
    return queryUsers;
  }
  return localUsers;
}

async function fetchLogs(): Promise<ActivityLog[]> {
  const logsResponse = await apiJson<{ logs: ActivityLog[] }>(`${USERS_API}/activity`);
  saveCollection('user_activity_logs', logsResponse.logs);
  return getCollection<ActivityLog>('user_activity_logs', []);
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
  const { data: queryLogs = [] } = useActivityLogs({ enabled });
  const localLogs = useLiveCollection<ActivityLog>('user_activity_logs', [], { enabled });
  if (!enabled) return [];
  if (queryLogs.length > 0) {
    return queryLogs;
  }
  return localLogs;
}

export function useUsersColumnPrefs() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: USERS_COLUMN_PREFS_QUERY_KEY,
    queryFn: async () => {
      const preferencesResponse = await apiJson<ModuleColumnPreferencesResponse>(`${USERS_API}/column-preferences`);
      return readModuleColumnPreferences(preferencesResponse);
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useUsersColumnPrefsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: ModuleColumnPref[]) =>
      apiJson<ModuleColumnPreferencesResponse>(`${USERS_API}/column-preferences`, {
        method: 'PUT',
        body: writeModuleColumnPreferences(preferences),
      }),
    onSuccess: (preferencesResponse) => {
      queryClient.setQueryData(USERS_COLUMN_PREFS_QUERY_KEY, readModuleColumnPreferences(preferencesResponse));
    },
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

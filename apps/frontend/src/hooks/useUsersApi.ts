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
  const body = await apiJson<{ users: WorkspaceUser[] }>(USERS_API);
  saveCollection('users', body.users);
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
  const { data: fromQuery = [] } = useUsers({ enabled });
  const fromLocal = useLiveCollection<WorkspaceUser>('users', [], { enabled });
  if (!enabled) return [];
  if (fromQuery.length > 0) {
    return fromQuery;
  }
  return fromLocal;
}

async function fetchLogs(): Promise<ActivityLog[]> {
  const body = await apiJson<{ logs: ActivityLog[] }>(`${USERS_API}/activity`);
  saveCollection('user_activity_logs', body.logs);
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
  const { data: fromQuery = [] } = useActivityLogs({ enabled });
  const fromLocal = useLiveCollection<ActivityLog>('user_activity_logs', [], { enabled });
  if (!enabled) return [];
  if (fromQuery.length > 0) {
    return fromQuery;
  }
  return fromLocal;
}

export function useUsersColumnPrefs() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: USERS_COLUMN_PREFS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<ModuleColumnPreferencesResponse>(`${USERS_API}/column-preferences`);
      return readModuleColumnPreferences(body);
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
    onSuccess: (data) => {
      queryClient.setQueryData(USERS_COLUMN_PREFS_QUERY_KEY, readModuleColumnPreferences(data));
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
    onSuccess: (data) => {
      saveCollection('users', data.users);
      invalidate();
    },
  });

  const replaceLogs = useMutation({
    mutationFn: async (logs: ActivityLog[]) =>
      apiJson<{ logs: ActivityLog[] }>(`${USERS_API}/activity/bulk`, {
        method: 'PUT',
        body: JSON.stringify(logs),
      }),
    onSuccess: (data) => {
      saveCollection('user_activity_logs', data.logs);
      invalidate();
    },
  });

  return { replaceUsers, replaceLogs };
}

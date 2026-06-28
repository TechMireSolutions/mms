import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ModuleColumnPref, SessionsCommandMetricsSnapshot } from '@mms/shared';
import { SESSIONS_MODULE_CONTRACT } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { getCollection, saveCollection } from '@/lib/db';
import { useLiveCollection } from '@/hooks/useLiveCollection';
import { SESSIONS_DATA, type Session } from '@/lib/data/sessionsData';
import { readModuleColumnPreferences, writeModuleColumnPreferences, type ModuleColumnPreferencesResponse } from '@/lib/moduleColumnPreferencesApi';

export const SESSIONS_QUERY_KEY = ['sessions', 'list'] as const;
export const SESSIONS_METRICS_QUERY_KEY = ['sessions', 'metrics'] as const;
export const SESSION_COLUMN_PREFS_QUERY_KEY = [
  SESSIONS_MODULE_CONTRACT.collectionKey,
  'column-preferences',
] as const;

const SESSIONS_API = SESSIONS_MODULE_CONTRACT.restBasePath;

export interface SessionRecord {
  id: string | number;
  [key: string]: unknown;
}

async function fetchSessions(): Promise<SessionRecord[]> {
  const body = await apiJson<{ sessions: SessionRecord[] }>(SESSIONS_API);
  saveCollection('sessions', body.sessions);
  return getCollection<SessionRecord>('sessions', []);
}

export function useSessions(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: SESSIONS_QUERY_KEY,
    queryFn: fetchSessions,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 30_000,
  });
}

export function useSessionMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: SESSIONS_METRICS_QUERY_KEY });
  };

  const createSession = useMutation({
    mutationFn: async (session: SessionRecord) =>
      apiJson<{ session: SessionRecord }>(SESSIONS_API, {
        method: 'POST',
        body: JSON.stringify(session),
      }),
    onSuccess: invalidate,
  });

  const updateSession = useMutation({
    mutationFn: async ({ id, session }: { id: string; session: SessionRecord }) =>
      apiJson<{ session: SessionRecord }>(`${SESSIONS_API}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(session),
      }),
    onSuccess: invalidate,
  });

  const deleteSession = useMutation({
    mutationFn: async (id: string) => apiFetch(`${SESSIONS_API}/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  return { createSession, updateSession, deleteSession };
}

/** Query-first sessions; falls back to localStorage cache (hydrated). */
export function useSessionsCollection(options?: { enabled?: boolean }): Session[] {
  const enabled = options?.enabled ?? true;
  const { data: querySessions = [] } = useSessions({ enabled });
  const localSessions = useLiveCollection<Session>('sessions', SESSIONS_DATA, { enabled });
  if (!enabled) return [];
  if (querySessions.length > 0) {
    return querySessions as Session[];
  }
  return localSessions;
}

export function useSessionsMetrics() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: SESSIONS_METRICS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ metrics: SessionsCommandMetricsSnapshot }>(`${SESSIONS_API}/metrics`);
      return body.metrics;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useSessionColumnPrefs() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: SESSION_COLUMN_PREFS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<ModuleColumnPreferencesResponse>(
        `${SESSIONS_API}/column-preferences`,
      );
      return readModuleColumnPreferences(body);
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useSessionColumnPrefsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: ModuleColumnPref[]) =>
      apiJson<ModuleColumnPreferencesResponse>(`${SESSIONS_API}/column-preferences`, {
        method: 'PUT',
        body: writeModuleColumnPreferences(preferences),
      }),
    onSuccess: (response) => {
      queryClient.setQueryData(SESSION_COLUMN_PREFS_QUERY_KEY, readModuleColumnPreferences(response));
    },
  });
}

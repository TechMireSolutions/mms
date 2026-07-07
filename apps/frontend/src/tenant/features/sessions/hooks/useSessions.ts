import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SessionsCommandMetricsSnapshot } from '@mms/shared';
import { SESSIONS_MODULE_CONTRACT } from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { saveCollection } from '@/lib/db';
import { useSyncedCollection } from '@/hooks/useSyncedCollection';
import { SESSIONS_DATA, type Session } from '@/lib/data/sessionsData';

export const SESSIONS_QUERY_KEY = ['sessions', 'list'] as const;
export const SESSIONS_METRICS_QUERY_KEY = ['sessions', 'metrics'] as const;

const SESSIONS_API = SESSIONS_MODULE_CONTRACT.restBasePath;

async function fetchSessions(): Promise<Session[]> {
  const sessionsResponse = await apiJson<{ sessions: Session[] }>(SESSIONS_API);
  saveCollection('sessions', sessionsResponse.sessions);
  return sessionsResponse.sessions;
}

export function useSessions(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: SESSIONS_QUERY_KEY,
    queryFn: fetchSessions,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 15_000,
  });
}

export function useSessionMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: SESSIONS_METRICS_QUERY_KEY });
  };

  const createSession = useMutation({
    mutationFn: async (session: Session) =>
      apiJson<{ session: Session }>(SESSIONS_API, {
        method: 'POST',
        body: JSON.stringify(session),
      }),
    onSuccess: invalidate,
  });

  const updateSession = useMutation({
    mutationFn: async ({ id, session }: { id: string; session: Session }) =>
      apiJson<{ session: Session }>(`${SESSIONS_API}/${id}`, {
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
  const queryResult = useSessions({ enabled });
  return useSyncedCollection<Session>({
    queryData: queryResult.data,
    isSuccess: queryResult.isSuccess,
    collectionName: 'sessions',
    defaultData: SESSIONS_DATA,
    enabled,
  });
}

export function useSessionsMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<SessionsCommandMetricsSnapshot>({
    moduleId: SESSIONS_MODULE_CONTRACT.moduleId,
    apiPath: SESSIONS_MODULE_CONTRACT.restBasePath,
    enabled: options?.enabled,
  });
}

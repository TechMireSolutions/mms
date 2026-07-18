import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SessionsCommandMetricsSnapshot } from '@mms/shared';
import { SESSIONS_MODULE_CONTRACT } from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { useCollectionSync } from '@/hooks/useCollectionSync';
import { SESSIONS_DATA, type Session } from '@/lib/data/sessionsData';

export const SESSIONS_QUERY_KEY = ['sessions', 'list'] as const;
export const SESSIONS_METRICS_QUERY_KEY = ['sessions', 'metrics'] as const;

const SESSIONS_API = SESSIONS_MODULE_CONTRACT.restBasePath;

export function useSessions(options?: { enabled?: boolean }) {
  return useCollectionSync<Session>({
    queryKey: SESSIONS_QUERY_KEY,
    apiPath: SESSIONS_API,
    responseKey: 'sessions',
    collectionName: 'sessions',
    defaultData: SESSIONS_DATA,
    staleTime: 15_000,
    enabled: options?.enabled,
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
  return useSessions(options).syncedData;
}

export function useSessionsMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<SessionsCommandMetricsSnapshot>({
    moduleId: SESSIONS_MODULE_CONTRACT.moduleId,
    apiPath: SESSIONS_MODULE_CONTRACT.restBasePath,
    enabled: options?.enabled,
  });
}

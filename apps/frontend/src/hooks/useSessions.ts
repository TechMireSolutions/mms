import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { getCollection, saveCollection } from '@/lib/db';
import { useLiveCollection } from '@/hooks/useLiveCollection';
import { SESSIONS_DATA, type Session } from '@/lib/data/sessionsData';

export const SESSIONS_QUERY_KEY = ['sessions', 'list'] as const;

export interface SessionRecord {
  id: string | number;
  [key: string]: unknown;
}

async function fetchSessions(): Promise<SessionRecord[]> {
  const body = await apiJson<{ sessions: SessionRecord[] }>('/api/sessions');
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
  };

  const createSession = useMutation({
    mutationFn: async (session: SessionRecord) =>
      apiJson<{ session: SessionRecord }>('/api/sessions', {
        method: 'POST',
        body: JSON.stringify(session),
      }),
    onSuccess: invalidate,
  });

  const updateSession = useMutation({
    mutationFn: async ({ id, session }: { id: string; session: SessionRecord }) =>
      apiJson<{ session: SessionRecord }>(`/api/sessions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(session),
      }),
    onSuccess: invalidate,
  });

  const deleteSession = useMutation({
    mutationFn: async (id: string) => apiFetch(`/api/sessions/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  return { createSession, updateSession, deleteSession };
}

/** Query-first sessions; falls back to localStorage cache (hydrated). */
export function useSessionsCollection(options?: { enabled?: boolean }): Session[] {
  const enabled = options?.enabled ?? true;
  const { data: fromQuery = [] } = useSessions({ enabled });
  const fromLocal = useLiveCollection<Session>('sessions', SESSIONS_DATA, { enabled });
  if (!enabled) return [];
  if (fromQuery.length > 0) {
    return fromQuery as Session[];
  }
  return fromLocal;
}

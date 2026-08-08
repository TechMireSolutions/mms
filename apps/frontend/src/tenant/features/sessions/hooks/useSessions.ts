import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  SessionsCommandMetricsSnapshot,
  SessionsListPageResult,
  SessionsReportAggregates,
  SessionsWidgetAggregateResult,
} from '@mms/shared';
import { SESSIONS_MODULE_MANIFEST, sessionsWidgetQueryFromWidget } from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { apiJson } from '@/lib/apiClient';
import { useCollectionSync } from '@/hooks/useCollectionSync';
import { useAuth } from '@/lib/contexts/AuthContext';
import { SESSIONS_DATA, type Session } from '@/lib/data/sessionsData';
import { invalidateSessionsQueries } from '@/tenant/features/sessions/hooks/invalidateSessionsQueries';

export const SESSIONS_QUERY_KEY = ['sessions', 'list'] as const;
export const SESSIONS_METRICS_QUERY_KEY = ['sessions', 'metrics'] as const;
export const SESSIONS_WIDGET_AGGREGATES_QUERY_KEY = [
  SESSIONS_MODULE_MANIFEST.collectionKey,
  'widget-aggregates',
] as const;
export const SESSIONS_REPORT_AGGREGATES_QUERY_KEY = [
  SESSIONS_MODULE_MANIFEST.collectionKey,
  'report-aggregates',
] as const;

const SESSIONS_API = SESSIONS_MODULE_MANIFEST.restBasePath;

export interface SessionsPaginatedParams {
  page: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  includeDeleted?: boolean;
  enabled?: boolean;
}

export interface SessionsWidgetAggregateWidgetInput {
  id: string;
  collection: string;
  operation: 'count' | 'sum' | 'avg' | 'percentage';
  targetField?: string;
  filterField?: string;
  filterOperator?: 'equals' | 'contains' | 'gt' | 'lt';
  filterValue?: string;
  xAxisField?: string;
}

function buildSessionsPageUrl(params: SessionsPaginatedParams): string {
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(params.page));
  queryParams.set('limit', String(params.limit ?? SESSIONS_MODULE_MANIFEST.defaultPageSize));
  if (params.search?.trim()) queryParams.set('search', params.search.trim());
  if (params.status?.trim()) queryParams.set('status', params.status.trim());
  if (params.type?.trim()) queryParams.set('type', params.type.trim());
  if (params.sortField?.trim()) queryParams.set('sortField', params.sortField.trim());
  if (params.sortDir) queryParams.set('sortDir', params.sortDir);
  if (params.includeDeleted) queryParams.set('includeDeleted', 'true');
  return `${SESSIONS_API}?${queryParams.toString()}`;
}

export function useSessionsPaginated(params: SessionsPaginatedParams) {
  const { isAuthenticated } = useAuth();
  const enabled = params.enabled ?? true;
  return useQuery({
    queryKey: [...SESSIONS_QUERY_KEY, 'page', params] as const,
    queryFn: async ({ signal }) => apiJson<SessionsListPageResult>(buildSessionsPageUrl(params), { signal }),
    enabled: isAuthenticated && enabled,
    staleTime: 15_000,
    placeholderData: (previousData) => previousData,
  });
}

export function useSessions(options?: { enabled?: boolean }) {
  return useCollectionSync<Session>({
    queryKey: SESSIONS_QUERY_KEY,
    apiPath: `${SESSIONS_API}?page=1&limit=${SESSIONS_MODULE_MANIFEST.maxPageSize}`,
    responseKey: 'sessions',
    collectionName: 'sessions',
    defaultData: SESSIONS_DATA,
    staleTime: 15_000,
    enabled: options?.enabled,
    mirrorToLocalCache: false,
  });
}

export function useSessionMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    invalidateSessionsQueries(queryClient);
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
    mutationFn: async ({ id, deletionReason }: { id: string; deletionReason?: string }) =>
      apiJson<{ success: boolean }>(`${SESSIONS_API}/${id}`, {
        method: 'DELETE',
        body: JSON.stringify(deletionReason ? { deletionReason } : {}),
      }),
    onSuccess: invalidate,
  });

  const restoreSession = useMutation({
    mutationFn: async (id: string) =>
      apiJson<{ success: boolean }>(`${SESSIONS_API}/${encodeURIComponent(id)}/restore`, {
        method: 'POST',
      }),
    onSuccess: invalidate,
  });

  const bulkDeleteSessions = useMutation({
    mutationFn: async ({ ids, deletionReason }: { ids: string[]; deletionReason?: string }) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(`${SESSIONS_API}/bulk-delete`, {
        method: 'POST',
        body: JSON.stringify({
          ids,
          ...(deletionReason ? { deletionReason } : {}),
        }),
      }),
    onSuccess: invalidate,
  });

  const bulkRestoreSessions = useMutation({
    mutationFn: async (ids: string[]) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(`${SESSIONS_API}/bulk-restore`, {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }),
    onSuccess: invalidate,
  });

  const logExportAudit = useMutation({
    mutationFn: async (payload: { count: number; scope: 'all' | 'filtered' | 'selection' }) =>
      apiJson<{ success: boolean }>(`${SESSIONS_API}/export-audit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  });

  return {
    createSession,
    updateSession,
    deleteSession,
    restoreSession,
    bulkDeleteSessions,
    bulkRestoreSessions,
    logExportAudit,
  };
}

/** Query-first sessions; falls back to localStorage cache (hydrated). */
export function useSessionsCollection(options?: { enabled?: boolean }): Session[] {
  return useSessions(options).syncedData;
}

export function useSessionsWidgetAggregates(
  widgets: SessionsWidgetAggregateWidgetInput[],
  options?: { enabled?: boolean },
) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  const sessionQueries = widgets
    .filter((widget) => widget.collection === 'sessions')
    .map((widget) => sessionsWidgetQueryFromWidget(widget));
  const querySignature = sessionQueries.map((query) => query.id).sort().join(',');

  return useQuery({
    queryKey: [...SESSIONS_WIDGET_AGGREGATES_QUERY_KEY, querySignature] as const,
    queryFn: async ({ signal }) => {
      const aggregateResponse = await apiJson<{ results: Record<string, SessionsWidgetAggregateResult> }>(
        `${SESSIONS_API}/widget-aggregates`,
        {
          method: 'POST',
          body: JSON.stringify({ widgets: sessionQueries }),
          signal,
        },
      );
      return aggregateResponse?.results ?? {};
    },
    enabled: isAuthenticated && enabled && sessionQueries.length > 0,
    staleTime: 30_000,
  });
}

export function useSessionsMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<SessionsCommandMetricsSnapshot>({
    moduleId: SESSIONS_MODULE_MANIFEST.moduleId,
    apiPath: SESSIONS_MODULE_MANIFEST.restBasePath,
    enabled: options?.enabled,
  });
}

export function useSessionsReportAggregates(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: SESSIONS_REPORT_AGGREGATES_QUERY_KEY,
    queryFn: async ({ signal }): Promise<SessionsReportAggregates> =>
      apiJson<SessionsReportAggregates>(`${SESSIONS_API}/report-aggregates`, { signal }),
    enabled: isAuthenticated && enabled,
    staleTime: 30_000,
  });
}

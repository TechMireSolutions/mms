import { useQueryClient, useQuery } from '@tanstack/react-query';
import type {
  SessionsCommandMetricsSnapshot,
} from '@mms/shared';
import { SESSIONS_MODULE_MANIFEST, sessionsWidgetQueryFromWidget } from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { useAuth } from '@/lib/contexts/AuthContext';
import { tsrClient, apiContract } from '@/lib/api';
import type { Session } from '@/lib/data/sessionsData';
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

export function useSessionsPaginated(params: SessionsPaginatedParams) {
  const { isAuthenticated } = useAuth();
  const enabled = params.enabled ?? true;
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.sessions.list.useQuery({
    queryKey: [...SESSIONS_QUERY_KEY, 'page', params] as any,
    queryData: { query: { 
      page: params.page, 
      limit: params.limit ?? SESSIONS_MODULE_MANIFEST.defaultPageSize,
      search: params.search?.trim(),
      status: params.status?.trim(),
      type: params.type?.trim(),
      sortField: params.sortField?.trim(),
      sortDir: params.sortDir,
      includeDeleted: params.includeDeleted ? 'true' : undefined
    } as any },
    enabled: isAuthenticated && enabled,
    staleTime: 15_000,
    placeholderData: (previousData: unknown) => previousData,
  });
}

export function useSessions(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.sessions.list.useQuery({
    queryKey: SESSIONS_QUERY_KEY,
    queryData: { query: { page: 1, limit: 100, sortField: 'createdAt', sortDir: 'desc' } as any },
    enabled: isAuthenticated && enabled,
    staleTime: 15_000,
  });
}
export function useSessionMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    invalidateSessionsQueries(queryClient);
  };

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const createSession = tsrClient.sessions.create.useMutation({
    onSuccess: invalidate,
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const updateSession = tsrClient.sessions.update.useMutation({
    onSuccess: invalidate,
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const deleteSession = tsrClient.sessions.delete.useMutation({
    onSuccess: invalidate,
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const restoreSession = tsrClient.sessions.restore.useMutation({
    onSuccess: invalidate,
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const bulkDeleteSessions = tsrClient.sessions.bulkDelete.useMutation({
    onSuccess: invalidate,
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const bulkRestoreSessions = tsrClient.sessions.bulkRestore.useMutation({
    onSuccess: invalidate,
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const bulkUpdateSessionStatus = tsrClient.sessions.bulkStatus.useMutation({
    onSuccess: invalidate,
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const logExportAudit = tsrClient.sessions.exportAudit.useMutation({});

  return {
    createSession: {
      ...createSession,
      mutate: (session: Session, opts?: any) => createSession.mutate({ body: session }, opts),
      mutateAsync: (session: Session) => createSession.mutateAsync({ body: session }),
    },
    updateSession: {
      ...updateSession,
      mutate: ({ id, session }: { id: string; session: Session }, opts?: any) => updateSession.mutate({ params: { id }, body: session }, opts),
      mutateAsync: ({ id, session }: { id: string; session: Session }) => updateSession.mutateAsync({ params: { id }, body: session }),
    },
    deleteSession: {
      ...deleteSession,
      mutate: ({ id, deletionReason }: { id: string; deletionReason?: string }, opts?: any) => deleteSession.mutate({ params: { id }, body: deletionReason ? { deletionReason } : {} }, opts),
      mutateAsync: ({ id, deletionReason }: { id: string; deletionReason?: string }) => deleteSession.mutateAsync({ params: { id }, body: deletionReason ? { deletionReason } : {} }),
    },
    restoreSession: {
      ...restoreSession,
      mutate: (id: string, opts?: any) => restoreSession.mutate({ params: { id }, body: {} }, opts),
      mutateAsync: (id: string) => restoreSession.mutateAsync({ params: { id }, body: {} }),
    },
    bulkDeleteSessions: {
      ...bulkDeleteSessions,
      mutate: ({ ids, deletionReason }: { ids: string[]; deletionReason?: string }, opts?: any) => bulkDeleteSessions.mutate({ body: { ids, ...(deletionReason ? { deletionReason } : {}) } }, opts),
      mutateAsync: ({ ids, deletionReason }: { ids: string[]; deletionReason?: string }) => bulkDeleteSessions.mutateAsync({ body: { ids, ...(deletionReason ? { deletionReason } : {}) } }),
    },
    bulkRestoreSessions: {
      ...bulkRestoreSessions,
      mutate: (ids: string[], opts?: any) => bulkRestoreSessions.mutate({ body: { ids } }, opts),
      mutateAsync: (ids: string[]) => bulkRestoreSessions.mutateAsync({ body: { ids } }),
    },
    bulkUpdateSessionStatus: {
      ...bulkUpdateSessionStatus,
      mutate: ({ ids, status }: { ids: string[]; status: string }, opts?: any) => bulkUpdateSessionStatus.mutate({ body: { ids, status } }, opts),
      mutateAsync: ({ ids, status }: { ids: string[]; status: string }) => bulkUpdateSessionStatus.mutateAsync({ body: { ids, status } }),
    },
    logExportAudit: {
      ...logExportAudit,
      mutate: (payload: { count: number; scope: 'all' | 'filtered' | 'selection' }, opts?: any) => logExportAudit.mutate({ body: payload }, opts),
      mutateAsync: (payload: { count: number; scope: 'all' | 'filtered' | 'selection' }) => logExportAudit.mutateAsync({ body: payload }),
    },
  };
}

export function useSessionsCollection(options?: { enabled?: boolean }): Session[] {
  const query = useSessions(options);
  if (!query.data || query.data.status !== 200) return [];
  const body = query.data.body as any;
  return Array.isArray(body) ? body : (body?.sessions ?? []);
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

  const query = useQuery({
    queryKey: [...SESSIONS_WIDGET_AGGREGATES_QUERY_KEY, querySignature] as const,
    queryFn: async () => {
      const res = await apiContract.sessions.widgetAggregates({ body: { widgets: sessionQueries } });
      return (res.body as any)?.results ?? {};
    },
    enabled: isAuthenticated && enabled && sessionQueries.length > 0,
    staleTime: 30_000,
  });

  return { ...query, data: query.data ?? {} };
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
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.sessions.reportAggregates.useQuery({
    queryKey: SESSIONS_REPORT_AGGREGATES_QUERY_KEY,
    enabled: isAuthenticated && enabled,
    staleTime: 30_000,
  });
}

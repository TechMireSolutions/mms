import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Enrollment,
  EnrollmentsCommandMetricsSnapshot,
  EnrollmentsListPageResult,
  EnrollmentsReportAggregates,
  EnrollmentsReportComparisonQuery,
  EnrollmentsWidgetAggregateResult,
  EnrollmentsWidgetOperation,
  EnrollmentsWidgetFilterOperator,
} from '@mms/shared';
import {
  ENROLLMENTS_MODULE_MANIFEST,
  enrollmentsWidgetQueryFromWidget,
  normalizeEnrollmentsReportComparisonQuery,
} from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { apiJson } from '@/lib/apiClient';
import { useAuth } from '@/lib/contexts/AuthContext';
import { invalidateEnrollmentsQueries } from '@/tenant/features/enrollments/hooks/invalidateEnrollmentsQueries';

export const ENROLLMENTS_QUERY_KEY = ['enrollments', 'list'] as const;
export const ENROLLMENTS_METRICS_QUERY_KEY = ['enrollments', 'metrics'] as const;
export const ENROLLMENTS_REPORT_AGGREGATES_QUERY_KEY = [
  ENROLLMENTS_MODULE_MANIFEST.collectionKey,
  'report-aggregates',
] as const;
export const ENROLLMENTS_WIDGET_AGGREGATES_QUERY_KEY = [
  ENROLLMENTS_MODULE_MANIFEST.collectionKey,
  'widget-aggregates',
] as const;

export interface EnrollmentsWidgetAggregateWidgetInput {
  id: string;
  collection: string;
  operation: EnrollmentsWidgetOperation;
  targetField?: string;
  filterField?: string;
  filterOperator?: EnrollmentsWidgetFilterOperator;
  filterValue?: string;
  xAxisField?: string;
}

const ENROLLMENTS_API = ENROLLMENTS_MODULE_MANIFEST.restBasePath;

export interface EnrollmentsPaginatedParams {
  page: number;
  limit?: number;
  search?: string;
  status?: string;
  sessionId?: string;
  includeDeleted?: boolean;
  enabled?: boolean;
}

function buildEnrollmentsPageUrl(params: EnrollmentsPaginatedParams): string {
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(params.page));
  queryParams.set('limit', String(params.limit ?? ENROLLMENTS_MODULE_MANIFEST.defaultPageSize));
  if (params.search?.trim()) queryParams.set('search', params.search.trim());
  if (params.status?.trim() && params.status !== 'all') queryParams.set('status', params.status.trim());
  if (params.sessionId?.trim() && params.sessionId !== 'all') queryParams.set('sessionId', params.sessionId.trim());
  if (params.includeDeleted) queryParams.set('includeDeleted', 'true');
  return `${ENROLLMENTS_API}?${queryParams.toString()}`;
}

export function useEnrollmentsPaginated(params: EnrollmentsPaginatedParams) {
  const { isAuthenticated } = useAuth();
  const enabled = params.enabled ?? true;
  return useQuery({
    queryKey: [...ENROLLMENTS_QUERY_KEY, 'page', params] as const,
    queryFn: async ({ signal }) => apiJson<EnrollmentsListPageResult>(buildEnrollmentsPageUrl(params), { signal }),
    enabled: isAuthenticated && enabled,
    staleTime: 15_000,
    placeholderData: (previousData) => previousData,
  });
}

export function useEnrollments(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  return useQuery<Enrollment[]>({
    queryKey: ENROLLMENTS_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const res = await apiJson<{ enrollments: Enrollment[] }>(
        `${ENROLLMENTS_API}?page=1&limit=${ENROLLMENTS_MODULE_MANIFEST.maxPageSize}`,
        { signal },
      );
      return res?.enrollments ?? [];
    },
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 15_000,
  });
}

export function useEnrollmentsCollection(options?: { enabled?: boolean }): Enrollment[] {
  return useEnrollments(options).data ?? [];
}

export function useEnrollmentsMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<EnrollmentsCommandMetricsSnapshot>({
    moduleId: ENROLLMENTS_MODULE_MANIFEST.moduleId,
    apiPath: ENROLLMENTS_MODULE_MANIFEST.restBasePath,
    enabled: options?.enabled,
  });
}

export function useEnrollmentsReportAggregates(
  options?: { enabled?: boolean; comparison?: EnrollmentsReportComparisonQuery },
) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  const comparison = normalizeEnrollmentsReportComparisonQuery(options?.comparison);
  const queryParams = new URLSearchParams();
  if (comparison?.sessionIds?.length) queryParams.set('sessionIds', comparison.sessionIds.join(','));
  if (comparison?.rangeAFrom) queryParams.set('rangeAFrom', comparison.rangeAFrom);
  if (comparison?.rangeATo) queryParams.set('rangeATo', comparison.rangeATo);
  if (comparison?.rangeBFrom) queryParams.set('rangeBFrom', comparison.rangeBFrom);
  if (comparison?.rangeBTo) queryParams.set('rangeBTo', comparison.rangeBTo);
  const queryString = queryParams.toString();

  return useQuery({
    queryKey: [...ENROLLMENTS_REPORT_AGGREGATES_QUERY_KEY, comparison ?? null] as const,
    queryFn: async ({ signal }): Promise<EnrollmentsReportAggregates> =>
      apiJson<EnrollmentsReportAggregates>(
        `${ENROLLMENTS_API}/report-aggregates${queryString ? `?${queryString}` : ''}`,
        { signal },
      ),
    enabled: isAuthenticated && enabled,
    staleTime: 30_000,
  });
}

export function useEnrollmentsWidgetAggregates(
  widgets: EnrollmentsWidgetAggregateWidgetInput[],
  options?: { enabled?: boolean },
) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  const enrollmentQueries = widgets
    .filter((widget) => widget.collection === 'enrollments')
    .map((widget) => enrollmentsWidgetQueryFromWidget(widget));
  const querySignature = enrollmentQueries.map((query) => query.id).sort().join(',');

  return useQuery({
    queryKey: [...ENROLLMENTS_WIDGET_AGGREGATES_QUERY_KEY, querySignature] as const,
    queryFn: async ({ signal }) => {
      const aggregateResponse = await apiJson<{
        results: Record<string, EnrollmentsWidgetAggregateResult>;
      }>(`${ENROLLMENTS_API}/widget-aggregates`, {
        method: 'POST',
        body: JSON.stringify({ widgets: enrollmentQueries }),
        signal,
      });
      return aggregateResponse?.results ?? {};
    },
    enabled: isAuthenticated && enabled && enrollmentQueries.length > 0,
    staleTime: 30_000,
  });
}

export function useEnrollmentMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    invalidateEnrollmentsQueries(queryClient);
  };

  const createEnrollment = useMutation({
    mutationFn: async (enrollment: Enrollment) =>
      apiJson<{ enrollment: Enrollment }>(ENROLLMENTS_API, {
        method: 'POST',
        body: JSON.stringify(enrollment),
      }),
    onSuccess: invalidate,
  });

  const updateEnrollment = useMutation({
    mutationFn: async ({ id, enrollment }: { id: string; enrollment: Enrollment }) =>
      apiJson<{ enrollment: Enrollment }>(`${ENROLLMENTS_API}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(enrollment),
      }),
    onSuccess: invalidate,
  });

  const deleteEnrollment = useMutation({
    mutationFn: async ({ id, deletionReason }: { id: string; deletionReason?: string }) =>
      apiJson<{ success: boolean }>(`${ENROLLMENTS_API}/${id}`, {
        method: 'DELETE',
        body: JSON.stringify(deletionReason ? { deletionReason } : {}),
      }),
    onSuccess: invalidate,
  });

  const restoreEnrollment = useMutation({
    mutationFn: async (id: string) =>
      apiJson<{ success: boolean }>(`${ENROLLMENTS_API}/${encodeURIComponent(id)}/restore`, {
        method: 'POST',
      }),
    onSuccess: invalidate,
  });

  const bulkDeleteEnrollments = useMutation({
    mutationFn: async ({ ids, deletionReason }: { ids: string[]; deletionReason?: string }) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(`${ENROLLMENTS_API}/bulk-delete`, {
        method: 'POST',
        body: JSON.stringify({
          ids,
          ...(deletionReason ? { deletionReason } : {}),
        }),
      }),
    onSuccess: invalidate,
  });

  const bulkRestoreEnrollments = useMutation({
    mutationFn: async (ids: string[]) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(`${ENROLLMENTS_API}/bulk-restore`, {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }),
    onSuccess: invalidate,
  });

  const logExportAudit = useMutation({
    mutationFn: async (payload: {
      count: number;
      scope: 'all' | 'filtered' | 'selection';
    }) =>
      apiJson<{ success: boolean }>(`${ENROLLMENTS_API}/export-audit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  });

  return {
    createEnrollment,
    updateEnrollment,
    deleteEnrollment,
    restoreEnrollment,
    bulkDeleteEnrollments,
    bulkRestoreEnrollments,
    logExportAudit,
  };
}

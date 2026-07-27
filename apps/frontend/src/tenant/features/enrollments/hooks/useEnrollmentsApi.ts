import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Enrollment, EnrollmentsCommandMetricsSnapshot, EnrollmentsListPageResult } from '@mms/shared';
import { ENROLLMENTS_MODULE_MANIFEST } from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { apiJson } from '@/lib/apiClient';
import { useCollectionSync } from '@/hooks/useCollectionSync';
import { useAuth } from '@/lib/contexts/AuthContext';

export const ENROLLMENTS_QUERY_KEY = ['enrollments', 'list'] as const;
export const ENROLLMENTS_METRICS_QUERY_KEY = ['enrollments', 'metrics'] as const;

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
    queryFn: async () => apiJson<EnrollmentsListPageResult>(buildEnrollmentsPageUrl(params)),
    enabled: isAuthenticated && enabled,
    staleTime: 15_000,
    placeholderData: (previousData) => previousData,
  });
}

export function useEnrollments(options?: { enabled?: boolean }) {
  return useCollectionSync<Enrollment>({
    queryKey: ENROLLMENTS_QUERY_KEY,
    apiPath: `${ENROLLMENTS_API}?page=1&limit=${ENROLLMENTS_MODULE_MANIFEST.maxPageSize}`,
    responseKey: 'enrollments',
    collectionName: 'enrollments',
    staleTime: 15_000,
    enabled: options?.enabled,
    isSuccessQuery: (res) => res.isSuccess && (res.data?.length ?? 0) > 0,
  });
}

export function useEnrollmentsCollection(options?: { enabled?: boolean }): Enrollment[] {
  return useEnrollments(options).syncedData;
}

export function useEnrollmentsMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<EnrollmentsCommandMetricsSnapshot>({
    moduleId: ENROLLMENTS_MODULE_MANIFEST.moduleId,
    apiPath: ENROLLMENTS_MODULE_MANIFEST.restBasePath,
    enabled: options?.enabled,
  });
}

export function useEnrollmentMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ENROLLMENTS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ENROLLMENTS_METRICS_QUERY_KEY });
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
    mutationFn: async (id: string) =>
      apiJson<{ success: boolean }>(`${ENROLLMENTS_API}/${id}`, { method: 'DELETE' }),
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
    mutationFn: async (ids: string[]) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(`${ENROLLMENTS_API}/bulk-delete`, {
        method: 'POST',
        body: JSON.stringify({ ids }),
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

  return {
    createEnrollment,
    updateEnrollment,
    deleteEnrollment,
    restoreEnrollment,
    bulkDeleteEnrollments,
    bulkRestoreEnrollments,
  };
}

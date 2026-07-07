import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Enrollment, EnrollmentsCommandMetricsSnapshot } from '@mms/shared';
import { ENROLLMENTS_MODULE_CONTRACT } from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { useCollectionSync } from '@/hooks/useCollectionSync';

export const ENROLLMENTS_QUERY_KEY = ['enrollments', 'list'] as const;
export const ENROLLMENTS_METRICS_QUERY_KEY = ['enrollments', 'metrics'] as const;

const ENROLLMENTS_API = ENROLLMENTS_MODULE_CONTRACT.restBasePath;

export function useEnrollments(options?: { enabled?: boolean }) {
  return useCollectionSync<Enrollment>({
    queryKey: ENROLLMENTS_QUERY_KEY,
    apiPath: ENROLLMENTS_API,
    responseKey: 'enrollments',
    collectionName: 'enrollments',
    staleTime: 15_000,
    enabled: options?.enabled,
  }).queryResult;
}

export function useEnrollmentsCollection(options?: { enabled?: boolean }): Enrollment[] {
  return useCollectionSync<Enrollment>({
    queryKey: ENROLLMENTS_QUERY_KEY,
    apiPath: ENROLLMENTS_API,
    responseKey: 'enrollments',
    collectionName: 'enrollments',
    staleTime: 15_000,
    enabled: options?.enabled,
    isSuccessQuery: (res) => res.isSuccess && (res.data?.length ?? 0) > 0,
  }).syncedData;
}

export function useEnrollmentsMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<EnrollmentsCommandMetricsSnapshot>({
    moduleId: ENROLLMENTS_MODULE_CONTRACT.moduleId,
    apiPath: ENROLLMENTS_MODULE_CONTRACT.restBasePath,
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
      apiFetch(`${ENROLLMENTS_API}/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  return { createEnrollment, updateEnrollment, deleteEnrollment };
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Enrollment, EnrollmentsCommandMetricsSnapshot } from '@mms/shared';
import { ENROLLMENTS_MODULE_CONTRACT } from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { getCollection, saveCollection } from '@/lib/db';
import { useSyncedCollection } from '@/hooks/useSyncedCollection';

export const ENROLLMENTS_QUERY_KEY = ['enrollments', 'list'] as const;
export const ENROLLMENTS_METRICS_QUERY_KEY = ['enrollments', 'metrics'] as const;

const ENROLLMENTS_API = ENROLLMENTS_MODULE_CONTRACT.restBasePath;

async function fetchEnrollments(): Promise<Enrollment[]> {
  const enrollmentsResponse = await apiJson<{ enrollments: Enrollment[] }>(ENROLLMENTS_API);
  saveCollection('enrollments', enrollmentsResponse.enrollments);
  return getCollection<Enrollment>('enrollments', []);
}

export function useEnrollments(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ENROLLMENTS_QUERY_KEY,
    queryFn: fetchEnrollments,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 15_000,
  });
}

export function useEnrollmentsCollection(options?: { enabled?: boolean }): Enrollment[] {
  const enabled = options?.enabled ?? true;
  const queryResult = useEnrollments({ enabled });
  return useSyncedCollection<Enrollment>({
    queryData: queryResult.data,
    isSuccess: queryResult.isSuccess && (queryResult.data?.length ?? 0) > 0,
    collectionName: 'enrollments',
    enabled,
  });
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

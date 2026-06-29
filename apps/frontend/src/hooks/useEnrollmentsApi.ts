import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Enrollment, ModuleColumnPref, EnrollmentsCommandMetricsSnapshot } from '@mms/shared';
import { ENROLLMENTS_MODULE_CONTRACT } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { getCollection, saveCollection } from '@/lib/db';
import { useLiveCollection } from '@/hooks/useLiveCollection';
import { readModuleColumnPreferences, writeModuleColumnPreferences, type ModuleColumnPreferencesResponse } from '@/lib/moduleColumnPreferencesApi';

export const ENROLLMENTS_QUERY_KEY = ['enrollments', 'list'] as const;
export const ENROLLMENTS_METRICS_QUERY_KEY = ['enrollments', 'metrics'] as const;
export const ENROLLMENTS_COLUMN_PREFS_QUERY_KEY = [
  ENROLLMENTS_MODULE_CONTRACT.collectionKey,
  'column-preferences',
] as const;

const ENROLLMENTS_API = ENROLLMENTS_MODULE_CONTRACT.restBasePath;

async function fetchEnrollments(): Promise<Enrollment[]> {
  const body = await apiJson<{ enrollments: Enrollment[] }>(ENROLLMENTS_API);
  saveCollection('enrollments', body.enrollments);
  return getCollection<Enrollment>('enrollments', []);
}

export function useEnrollments(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ENROLLMENTS_QUERY_KEY,
    queryFn: fetchEnrollments,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 30_000,
  });
}

export function useEnrollmentsCollection(options?: { enabled?: boolean }): Enrollment[] {
  const enabled = options?.enabled ?? true;
  const { data: queryEnrollments = [] } = useEnrollments({ enabled });
  const localEnrollments = useLiveCollection<Enrollment>('enrollments', [], { enabled });
  if (!enabled) return [];
  if (queryEnrollments.length > 0) {
    return queryEnrollments;
  }
  return localEnrollments;
}

export function useEnrollmentsMetrics() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ENROLLMENTS_METRICS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ metrics: EnrollmentsCommandMetricsSnapshot }>(`${ENROLLMENTS_API}/metrics`);
      return body.metrics;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useEnrollmentColumnPreferences() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ENROLLMENTS_COLUMN_PREFS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<ModuleColumnPreferencesResponse>(
        `${ENROLLMENTS_API}/column-preferences`,
      );
      return readModuleColumnPreferences(body);
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useEnrollmentColumnPreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: ModuleColumnPref[]) =>
      apiJson<ModuleColumnPreferencesResponse>(`${ENROLLMENTS_API}/column-preferences`, {
        method: 'PUT',
        body: writeModuleColumnPreferences(preferences),
      }),
    onSuccess: (response) => {
      queryClient.setQueryData(ENROLLMENTS_COLUMN_PREFS_QUERY_KEY, readModuleColumnPreferences(response));
    },
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

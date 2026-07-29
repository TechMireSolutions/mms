import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  GenericSavedReport,
  GenericSavedReportCategory,
  GenericSavedReportCreateInput,
} from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { getCollection, saveCollectionCacheOnly } from '@/lib/db';
import {
  LEGACY_SAVED_REPORTS_COLLECTION_KEY,
  planLegacySavedReportsMigration,
  removeMigratedLocalReports,
} from '@/lib/reports/legacySavedReportsMigration';

export interface SavedReportsSource<TReport, TCreateInput> {
  reports: TReport[];
  isLoading: boolean;
  isError: boolean;
  retry: () => void;
  createReport: (input: TCreateInput) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  runReport: (id: string) => Promise<void>;
}

/** Tuple query key factory scoped by generic saved-report category. */
export function genericSavedReportsQueryKey(category: GenericSavedReportCategory) {
  return ['saved-reports', category] as const;
}

const legacyMigrationInFlight = new Map<GenericSavedReportCategory, Promise<void>>();

/**
 * Query-backed source for module saved-report presets (`/api/saved-reports`).
 * Best-effort migrates legacy `reports_saved_reports` local presets once per category.
 */
export function useGenericSavedReportsSource(
  category: GenericSavedReportCategory,
): SavedReportsSource<GenericSavedReport, GenericSavedReportCreateInput> {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = genericSavedReportsQueryKey(category);

  const reportsQuery = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const response = await apiJson<{ reports: GenericSavedReport[] }>(
        `/api/saved-reports?category=${encodeURIComponent(category)}`,
        { signal },
      );
      return response.reports;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const invalidateCategory = () => {
    void queryClient.invalidateQueries({ queryKey });
  };

  const createSavedReport = useMutation({
    mutationFn: async (input: GenericSavedReportCreateInput) =>
      apiJson<{ report: GenericSavedReport }>('/api/saved-reports', {
        method: 'POST',
        body: JSON.stringify({
          name: input.name,
          category,
          filters: input.filters,
        }),
      }),
    onSuccess: invalidateCategory,
  });

  const deleteSavedReport = useMutation({
    mutationFn: async (id: string) =>
      apiFetch(
        `/api/saved-reports/${encodeURIComponent(id)}?category=${encodeURIComponent(category)}`,
        { method: 'DELETE' },
      ),
    onSuccess: invalidateCategory,
  });

  const runSavedReport = useMutation({
    mutationFn: async (id: string) =>
      apiJson<{ report: GenericSavedReport }>(
        `/api/saved-reports/${encodeURIComponent(id)}/run?category=${encodeURIComponent(category)}`,
        { method: 'POST' },
      ),
    onSuccess: invalidateCategory,
  });

  const createMutateAsync = createSavedReport.mutateAsync;
  const serverReports = reportsQuery.data;
  const querySucceeded = reportsQuery.isSuccess;

  useEffect(() => {
    if (!isAuthenticated || !querySucceeded || !serverReports) return;

    const existing = legacyMigrationInFlight.get(category);
    if (existing) return;

    const migrationPromise = (async () => {
      const localReports = getCollection<unknown>(LEGACY_SAVED_REPORTS_COLLECTION_KEY, []);
      const plan = planLegacySavedReportsMigration({
        category,
        localReports,
        serverReports,
      });

      if (plan.toImport.length === 0 && plan.categoryIdsToRemove.length === 0) {
        return;
      }

      try {
        for (const item of plan.toImport) {
          await createMutateAsync({
            name: item.name,
            category,
            filters: item.filters,
          });
        }

        const latestLocal = getCollection<unknown>(LEGACY_SAVED_REPORTS_COLLECTION_KEY, []);
        saveCollectionCacheOnly(
          LEGACY_SAVED_REPORTS_COLLECTION_KEY,
          removeMigratedLocalReports(latestLocal, plan.categoryIdsToRemove),
        );
      } catch {
        // Leave local presets for a later retry; do not mask Query error state.
      }
    })();

    legacyMigrationInFlight.set(category, migrationPromise);
    void migrationPromise.finally(() => {
      if (legacyMigrationInFlight.get(category) === migrationPromise) {
        legacyMigrationInFlight.delete(category);
      }
    });
  }, [category, createMutateAsync, isAuthenticated, querySucceeded, serverReports]);

  return {
    reports: serverReports ?? [],
    isLoading: reportsQuery.isLoading,
    isError: reportsQuery.isError,
    retry: () => {
      void reportsQuery.refetch();
    },
    createReport: async (input) => {
      await createMutateAsync({
        name: input.name,
        category,
        filters: input.filters,
      });
    },
    deleteReport: async (id) => {
      await deleteSavedReport.mutateAsync(id);
    },
    runReport: async (id) => {
      await runSavedReport.mutateAsync(id);
    },
  };
}

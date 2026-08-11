import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ContactColumnPreference,
  ContactsSavedReport,
  ContactsSavedReportShareScope,
  ContactsWorkDrillDown,
} from '@mms/shared';
import { clampModuleColumnWidth } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiFetch, apiJson } from '@/lib/apiClient';
import {
  CONTACTS_API,
  CONTACT_COLUMN_PREFERENCES_QUERY_KEY,
  CONTACTS_SAVED_REPORTS_QUERY_KEY,
} from '@/tenant/features/contacts/hooks/contactsQueryKeys';
import type { SavedReportsSource } from '@/hooks/useSavedReportsSource';

interface ContactsSavedReportCreateInput {
  name: string;
  drillDown: ContactsWorkDrillDown;
  shareScope?: ContactsSavedReportShareScope;
  sharedWithRoles?: string[];
  sharedWithUserIds?: string[];
}

export function useContactColumnPrefs(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: CONTACT_COLUMN_PREFERENCES_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const preferencesResponse = await apiJson<{ preferences: ContactColumnPreference[] }>(
        `${CONTACTS_API}/column-preferences`,
        { signal },
      );
      return preferencesResponse.preferences ?? [];
    },
    enabled: isAuthenticated && enabled,
    staleTime: 60_000,
  });
}

export function useContactColumnPrefsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rawPreferences: ContactColumnPreference[]) => {
      const preferences: ContactColumnPreference[] = rawPreferences
        .filter((columnPreference) => columnPreference && typeof columnPreference.key === 'string' && columnPreference.key.trim().length > 0)
        .map((columnPreference, index) => {
          const floored = Math.floor(
            typeof columnPreference.order === 'number' ? columnPreference.order : Number(columnPreference.order),
          );
          const preference: ContactColumnPreference = {
            key: columnPreference.key.trim(),
            enabled: Boolean(columnPreference.enabled),
            order: Number.isSafeInteger(floored) && floored >= 0 ? floored : index,
          };
          if (typeof columnPreference.width === 'number') {
            preference.width = clampModuleColumnWidth(columnPreference.width);
          }
          return preference;
        });
      return apiJson<{ success: boolean; preferences: ContactColumnPreference[] }>(
        `${CONTACTS_API}/column-preferences`,
        {
          method: 'PUT',
          body: JSON.stringify({ preferences }),
        },
      );
    },
    onSuccess: (preferencesResponse) => {
      queryClient.setQueryData(
        CONTACT_COLUMN_PREFERENCES_QUERY_KEY,
        preferencesResponse.preferences ?? [],
      );
    },
  });
}

function useContactsSavedReports() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: CONTACTS_SAVED_REPORTS_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const reportsResponse = await apiJson<{ reports: ContactsSavedReport[] }>(
        `${CONTACTS_API}/saved-reports`,
        { signal },
      );
      return reportsResponse.reports;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

function useContactsSavedReportMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: CONTACTS_SAVED_REPORTS_QUERY_KEY });
  };

  const createSavedReport = useMutation({
    mutationFn: async (payload: ContactsSavedReportCreateInput) =>
      apiJson<{ report: ContactsSavedReport }>(`${CONTACTS_API}/saved-reports`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: invalidate,
  });

  const deleteSavedReport = useMutation({
    mutationFn: async (id: string) =>
      apiFetch(`${CONTACTS_API}/saved-reports/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  const runSavedReport = useMutation({
    mutationFn: async (id: string) =>
      apiJson<{ report: ContactsSavedReport }>(
        `${CONTACTS_API}/saved-reports/${encodeURIComponent(id)}/run`,
        { method: 'POST' },
      ),
    onSuccess: invalidate,
  });

  return { createSavedReport, deleteSavedReport, runSavedReport };
}

export function useContactsSavedReportsSource(): SavedReportsSource<
  ContactsSavedReport,
  ContactsSavedReportCreateInput
> {
  const reportsQuery = useContactsSavedReports();
  const { createSavedReport, deleteSavedReport, runSavedReport } = useContactsSavedReportMutations();

  return {
    reports: reportsQuery.data ?? [],
    isLoading: reportsQuery.isLoading,
    isError: reportsQuery.isError,
    retry: () => {
      void reportsQuery.refetch();
    },
    createReport: async (input) => {
      await createSavedReport.mutateAsync(input);
    },
    deleteReport: async (id) => {
      await deleteSavedReport.mutateAsync(id);
    },
    runReport: async (id) => {
      await runSavedReport.mutateAsync(id);
    },
  };
}

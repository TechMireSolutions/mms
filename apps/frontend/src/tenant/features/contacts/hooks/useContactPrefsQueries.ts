import { useQueryClient } from '@tanstack/react-query';
import type {
  ContactColumnPreference,
  ContactsSavedReport,
  ContactsSavedReportShareScope,
  ContactsWorkDrillDown,
} from '@mms/shared';
import { clampModuleColumnWidth } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { tsrClient } from '@/lib/api';
import {
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
  
  // @ts-expect-error - TS union discrimination limit with ts-rest
  const query = tsrClient.contacts.getColumnPreferences.useQuery({
    queryKey: CONTACT_COLUMN_PREFERENCES_QUERY_KEY,
    queryData: {},
    enabled: isAuthenticated && enabled,
    staleTime: 60_000,
  });

  return {
    ...query,
    data: query.data?.body ? ((query.data.body as any)?.preferences ?? []) : (Array.isArray(query.data) ? query.data : undefined),
  };
}

export function useContactColumnPrefsMutation() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  const mutation = tsrClient.contacts.updateColumnPreferences.useMutation({
    onSuccess: (response: any) => {
      queryClient.setQueryData(
        CONTACT_COLUMN_PREFERENCES_QUERY_KEY,
        response?.body?.preferences ?? [],
      );
    },
  });

  const sanitizePrefs = (rawPreferences: ContactColumnPreference[]) => {
    return rawPreferences
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
  };

  return {
    ...mutation,
    mutate: (rawPreferences: any, mutateOptions?: any) => {
      const prefs = Array.isArray(rawPreferences)
        ? rawPreferences
        : (Array.isArray(rawPreferences?.body?.preferences) ? rawPreferences.body.preferences : []);
      return mutation.mutate({ body: { preferences: sanitizePrefs(prefs) } }, mutateOptions);
    },
    mutateAsync: async (rawPreferences: any, mutateOptions?: any) => {
      const prefs = Array.isArray(rawPreferences)
        ? rawPreferences
        : (Array.isArray(rawPreferences?.body?.preferences) ? rawPreferences.body.preferences : []);
      return mutation.mutateAsync({ body: { preferences: sanitizePrefs(prefs) } }, mutateOptions);
    },
  };
}

function useContactsSavedReports() {
  const { isAuthenticated } = useAuth();
  
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.contacts.getSavedReports.useQuery({
    queryKey: CONTACTS_SAVED_REPORTS_QUERY_KEY,
    queryData: {},
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

function useContactsSavedReportMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: CONTACTS_SAVED_REPORTS_QUERY_KEY });
  };

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const createSavedReport = tsrClient.contacts.createSavedReport.useMutation({
    onSuccess: invalidate,
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const deleteSavedReport = tsrClient.contacts.deleteSavedReport.useMutation({
    onSuccess: invalidate,
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const runSavedReport = tsrClient.contacts.runSavedReport.useMutation({
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
    reports: reportsQuery.data?.body ? ((reportsQuery.data.body as any)?.reports ?? []) : [],
    isLoading: reportsQuery.isLoading,
    isError: reportsQuery.isError,
    retry: () => {
      void reportsQuery.refetch();
    },
    createReport: async (input) => {
      await createSavedReport.mutateAsync({ body: input });
    },
    deleteReport: async (id) => {
      await deleteSavedReport.mutateAsync({ params: { id } });
    },
    runReport: async (id) => {
      await runSavedReport.mutateAsync({ params: { id }, body: {} });
    },
  };
}

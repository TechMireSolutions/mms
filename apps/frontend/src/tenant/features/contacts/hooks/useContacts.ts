import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  CONTACTS_MODULE_CONTRACT,
  filterActiveContacts,
  type Contact,
  type ContactColumnPreference,
  type ContactsCommandMetricsSnapshot,
  type ContactsDuplicatePairsPageResult,
  type ContactsListPageResult,
  type ContactsMonthlyYearCounts,
  type ContactsReportAnalyticsSnapshot,
  type ContactsWidgetAggregateResult,
  type ContactsWidgetQuery,
  contactsWidgetQueryFromWidget,
  type ContactsSavedReport,
  type ContactsSavedReportShareScope,
  type ContactsWorkDrillDown,
} from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { saveCollection } from '@/lib/db';
import { useSyncedCollection } from '@/hooks/useSyncedCollection';
import { enqueueContactsOutbox } from '@/lib/contacts/contactsSyncOutbox';

const CONTACTS_API = CONTACTS_MODULE_CONTRACT.restBasePath;

export const CONTACTS_QUERY_KEY = [CONTACTS_MODULE_CONTRACT.collectionKey, 'list'] as const;
export const CONTACT_COLUMN_PREFERENCES_QUERY_KEY = [CONTACTS_MODULE_CONTRACT.collectionKey, 'column-preferences'] as const;
export const CONTACTS_SAVED_REPORTS_QUERY_KEY = [CONTACTS_MODULE_CONTRACT.collectionKey, 'saved-reports'] as const;
export const CONTACTS_GOOGLE_SYNC_QUERY_KEY = [CONTACTS_MODULE_CONTRACT.collectionKey, 'google-sync'] as const;
export const CONTACTS_METRICS_QUERY_KEY = [CONTACTS_MODULE_CONTRACT.collectionKey, 'metrics'] as const;
export const CONTACTS_REPORT_ANALYTICS_QUERY_KEY = [CONTACTS_MODULE_CONTRACT.collectionKey, 'report-analytics'] as const;
export const CONTACTS_WIDGET_AGGREGATES_QUERY_KEY = [CONTACTS_MODULE_CONTRACT.collectionKey, 'widget-aggregates'] as const;
export const CONTACTS_DUPLICATES_QUERY_KEY = [CONTACTS_MODULE_CONTRACT.collectionKey, 'duplicates'] as const;

export interface ContactsPaginatedParams {
  page: number;
  limit?: number;
  search?: string;
  gender?: string;
  includeDeleted?: boolean;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  hasPhone?: boolean;
  enabled?: boolean;
}

function buildContactsPageUrl(params: ContactsPaginatedParams): string {
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(params.page));
  queryParams.set('limit', String(params.limit ?? CONTACTS_MODULE_CONTRACT.defaultPageSize));
  if (params.search?.trim()) queryParams.set('search', params.search.trim());
  if (params.gender) queryParams.set('gender', params.gender);
  if (params.includeDeleted) queryParams.set('includeDeleted', 'true');
  if (params.hasPhone) queryParams.set('hasPhone', 'true');
  if (params.sortField) queryParams.set('sortField', params.sortField);
  if (params.sortDir) queryParams.set('sortDir', params.sortDir);
  return `${CONTACTS_API}?${queryParams.toString()}`;
}

export function contactsPaginatedQueryKey(params: ContactsPaginatedParams) {
  return [...CONTACTS_QUERY_KEY, 'page', params] as const;
}

export function useContactsPaginated(params: ContactsPaginatedParams) {
  const { isAuthenticated } = useAuth();
  const enabled = params.enabled ?? true;
  return useQuery({
    queryKey: contactsPaginatedQueryKey(params),
    queryFn: async () => apiJson<ContactsListPageResult>(buildContactsPageUrl(params)),
    enabled: isAuthenticated && enabled,
    staleTime: 15_000,
    placeholderData: (previousData) => previousData,
  });
}

/** Fetches all pages matching Work filters for export (globle1 §8). */
export async function fetchAllContactsForQuery(
  params: Omit<ContactsPaginatedParams, 'page' | 'enabled'>,
  onProgress?: (fetched: number, total: number) => void,
): Promise<Contact[]> {
  const limit = CONTACTS_MODULE_CONTRACT.maxPageSize;
  const all: Contact[] = [];
  let page = 1;
  let total = 0;

  for (;;) {
    const contactsPage = await apiJson<ContactsListPageResult>(buildContactsPageUrl({ ...params, page, limit }));
    all.push(...contactsPage.contacts);
    total = contactsPage.total;
    onProgress?.(all.length, total);
    if (!contactsPage.hasMore || page >= 200) break;
    page += 1;
  }

  return all;
}

export function useContactsMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<ContactsCommandMetricsSnapshot>({
    moduleId: CONTACTS_MODULE_CONTRACT.moduleId,
    apiPath: CONTACTS_MODULE_CONTRACT.restBasePath,
    enabled: options?.enabled,
  });
}

export interface ContactsReportAnalyticsParams {
  enabled?: boolean;
  compareYears?: number[];
}

export interface ContactsReportAnalyticsResult {
  analytics: ContactsReportAnalyticsSnapshot;
  monthlyByYear?: ContactsMonthlyYearCounts[];
}

export function useContactsReportAnalytics(params: ContactsReportAnalyticsParams = {}) {
  const { isAuthenticated } = useAuth();
  const enabled = params.enabled ?? true;
  const yearsKey = params.compareYears?.filter(Boolean).join(',') ?? '';
  return useQuery({
    queryKey: [...CONTACTS_REPORT_ANALYTICS_QUERY_KEY, yearsKey] as const,
    queryFn: async () => {
      const queryString = yearsKey ? `?years=${encodeURIComponent(yearsKey)}` : '';
      return apiJson<ContactsReportAnalyticsResult>(`${CONTACTS_API}/report-analytics${queryString}`);
    },
    enabled: isAuthenticated && enabled,
    staleTime: 30_000,
  });
}

export interface ContactsWidgetAggregateWidgetInput {
  id: string;
  collection: string;
  operation: ContactsWidgetQuery['operation'];
  targetField?: string;
  filterField?: string;
  filterOperator?: ContactsWidgetQuery['filterOperator'];
  filterValue?: string;
  xAxisField?: string;
}

export function useContactsWidgetAggregates(
  widgets: ContactsWidgetAggregateWidgetInput[],
  options?: { enabled?: boolean },
) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  const contactQueries = widgets
    .filter((widget) => widget.collection === 'contacts')
    .map((widget) => contactsWidgetQueryFromWidget(widget));
  const querySignature = contactQueries.map((query) => query.id).sort().join(',');

  return useQuery({
    queryKey: [...CONTACTS_WIDGET_AGGREGATES_QUERY_KEY, querySignature] as const,
    queryFn: async () => {
      const aggregateResponse = await apiJson<{ results: Record<string, ContactsWidgetAggregateResult> }>(
        `${CONTACTS_API}/widget-aggregates`,
        {
          method: 'POST',
          body: JSON.stringify({ widgets: contactQueries }),
        },
      );
      return aggregateResponse?.results ?? {};
    },
    enabled: isAuthenticated && enabled && contactQueries.length > 0,
    staleTime: 30_000,
  });
}

export interface ContactsDuplicatesParams {
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export function useContactsDuplicatePairs(params: ContactsDuplicatesParams = {}) {
  const { isAuthenticated } = useAuth();
  const enabled = params.enabled ?? true;
  const page = params.page ?? 1;
  const limit = params.limit ?? 100;
  return useQuery({
    queryKey: [...CONTACTS_DUPLICATES_QUERY_KEY, page, limit] as const,
    queryFn: async () => {
      const queryParams = new URLSearchParams({ page: String(page), limit: String(limit) });
      return apiJson<ContactsDuplicatePairsPageResult>(`${CONTACTS_API}/duplicates?${queryParams.toString()}`);
    },
    enabled: isAuthenticated && enabled,
    staleTime: 30_000,
  });
}

export function useContactById(contactId: string | undefined, enabled = true) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: [...CONTACTS_QUERY_KEY, 'detail', contactId] as const,
    queryFn: async () => {
      const contactResponse = await apiJson<{ contact: Contact }>(`${CONTACTS_API}/${contactId}`);
      return contactResponse.contact;
    },
    enabled: isAuthenticated && enabled && Boolean(contactId),
    staleTime: 10_000,
  });
}

/** Batch-resolve contact labels by id (globle2 §10 — pickers & cross-module links). */
export function useContactsByIds(ids: (string | number | null | undefined)[]) {
  const { isAuthenticated } = useAuth();
  const normalized = useMemo(
    () => [...new Set(ids.filter((id) => id !== null && id !== undefined && String(id).length > 0).map(String))].sort(),
    [ids],
  );
  const signature = normalized.join(',');

  return useQuery({
    queryKey: [...CONTACTS_QUERY_KEY, 'resolve', signature] as const,
    queryFn: async () => {
      const contactsResponse = await apiJson<{ contacts: Contact[] }>(`${CONTACTS_API}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ ids: normalized }),
      });
      return contactsResponse.contacts;
    },
    enabled: isAuthenticated && normalized.length > 0,
    staleTime: 30_000,
  });
}

export interface ContactGoogleSyncConfigClient {
  clientId?: string;
  clientSecret?: string;
  clearTokens?: boolean;
  updatedAt?: string;
  hasClientSecret?: boolean;
  hasRefreshToken?: boolean;
  isConnected?: boolean;
}

export interface GoogleContactsSyncRunResult {
  contacts: Contact[];
  total: number;
  imported: number;
  skipped: number;
}

export function useContactGoogleSyncConfig() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: CONTACTS_GOOGLE_SYNC_QUERY_KEY,
    queryFn: async () => {
      const googleSyncResponse = await apiJson<{ config: ContactGoogleSyncConfigClient }>(`${CONTACTS_API}/google-sync`);
      return googleSyncResponse.config;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useContactGoogleSyncMutations() {
  const queryClient = useQueryClient();
  const saveConfig = useMutation({
    mutationFn: async (config: ContactGoogleSyncConfigClient) =>
      apiJson<{ config: ContactGoogleSyncConfigClient }>(`${CONTACTS_API}/google-sync`, {
        method: 'PUT',
        body: JSON.stringify(config),
      }),
    onSuccess: (configResponse) => {
      queryClient.setQueryData(CONTACTS_GOOGLE_SYNC_QUERY_KEY, configResponse.config);
    },
  });
  const clearConfig = useMutation({
    mutationFn: async () => apiFetch(`${CONTACTS_API}/google-sync`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.setQueryData(CONTACTS_GOOGLE_SYNC_QUERY_KEY, {});
    },
  });
  const logSyncAudit = useMutation({
    mutationFn: async (auditPayload: {
      action: 'credentials_saved' | 'oauth_connected' | 'sync_complete' | 'disconnected';
      imported?: number;
      total?: number;
      skipped?: number;
    }) =>
      apiJson<{ success: boolean }>(`${CONTACTS_API}/google-sync/audit`, {
        method: 'POST',
        body: JSON.stringify(auditPayload),
      }),
  });
  const exchangeOAuth = useMutation({
    mutationFn: async (oauthPayload: { code: string; redirectUri: string }) =>
      apiJson<{ config: ContactGoogleSyncConfigClient }>(`${CONTACTS_API}/google-sync/exchange`, {
        method: 'POST',
        body: JSON.stringify(oauthPayload),
      }),
    onSuccess: (configResponse) => {
      queryClient.setQueryData(CONTACTS_GOOGLE_SYNC_QUERY_KEY, configResponse.config);
    },
  });
  const runGoogleSync = useMutation({
    mutationFn: async () =>
      apiJson<GoogleContactsSyncRunResult>(`${CONTACTS_API}/google-sync/run`, {
        method: 'POST',
      }),
  });
  return { saveConfig, clearConfig, logSyncAudit, exchangeOAuth, runGoogleSync };
}

export function contactsListQueryKey(includeDeleted = false) {
  return includeDeleted
    ? ([...CONTACTS_QUERY_KEY, 'with-deleted'] as const)
    : CONTACTS_QUERY_KEY;
}

async function fetchContacts(includeDeleted = false): Promise<Contact[]> {
  const url = includeDeleted ? `${CONTACTS_API}?includeDeleted=true` : CONTACTS_API;
  const contactsResponse = await apiJson<{ contacts: Contact[] }>(url);
  saveCollection(CONTACTS_MODULE_CONTRACT.collectionKey, filterActiveContacts(contactsResponse.contacts));
  return contactsResponse.contacts;
}

export function useContacts(options?: { enabled?: boolean; includeDeleted?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const includeDeleted = options?.includeDeleted ?? false;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: contactsListQueryKey(includeDeleted),
    queryFn: () => fetchContacts(includeDeleted),
    enabled: isAuthenticated && queryEnabled,
    staleTime: 30_000,
  });
}

export function useContactMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: [...CONTACTS_QUERY_KEY, 'with-deleted'] });
    void queryClient.invalidateQueries({ queryKey: CONTACTS_METRICS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: CONTACTS_REPORT_ANALYTICS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: CONTACTS_WIDGET_AGGREGATES_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: CONTACTS_DUPLICATES_QUERY_KEY });
  };

  const upsertContact = useMutation({
    mutationFn: async (contact: Contact) =>
      apiJson<{ contact: Contact }>(CONTACTS_API, {
        method: 'POST',
        body: JSON.stringify(contact),
      }),
    onSuccess: invalidate,
    onError: (_err, contact) => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        enqueueContactsOutbox({ kind: 'upsert', contact });
      }
    },
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, contact }: { id: string; contact: Contact }) =>
      apiJson<{ contact: Contact }>(`${CONTACTS_API}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(contact),
      }),
    onSuccess: invalidate,
    onError: (_err, { id, contact }) => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        enqueueContactsOutbox({ kind: 'update', contactId: id, contact });
      }
    },
  });

  const deleteContact = useMutation({
    mutationFn: async ({ id, deletionReason }: { id: string; deletionReason?: string }) =>
      apiFetch(`${CONTACTS_API}/${id}`, {
        method: 'DELETE',
        body: JSON.stringify(deletionReason ? { deletionReason } : {}),
      }),
    onSuccess: invalidate,
    onError: (_err, { id, deletionReason }) => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        enqueueContactsOutbox({ kind: 'delete', contactId: id, deletionReason });
      }
    },
  });

  const bulkDeleteContacts = useMutation({
    mutationFn: async ({ ids, deletionReason }: { ids: (string | number)[]; deletionReason?: string }) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(`${CONTACTS_API}/bulk-delete`, {
        method: 'POST',
        body: JSON.stringify({ ids, ...(deletionReason ? { deletionReason } : {}) }),
      }),
    onSuccess: invalidate,
  });

  const restoreContact = useMutation({
    mutationFn: async (id: string) =>
      apiJson<{ success: boolean; contact: Contact }>(
        `${CONTACTS_API}/${encodeURIComponent(id)}/restore`,
        { method: 'POST' },
      ),
    onSuccess: invalidate,
  });

  const bulkRestoreContacts = useMutation({
    mutationFn: async (ids: (string | number)[]) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(`${CONTACTS_API}/bulk-restore`, {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }),
    onSuccess: invalidate,
  });

  const logExportAudit = useMutation({
    mutationFn: async (payload: { count: number; scope: 'all' | 'filtered' | 'selection' }) =>
      apiJson<{ success: boolean }>(`${CONTACTS_API}/export-audit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  });

  const logMergeAudit = useMutation({
    mutationFn: async (payload: { keepId: string | number; deleteId: string | number; mergedName?: string }) =>
      apiJson<{ success: boolean }>(`${CONTACTS_API}/merge-audit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  });

  const logSetupAudit = useMutation({
    mutationFn: async (payload: { area: 'fields' | 'preferences' | 'sync'; summary: string }) =>
      apiJson<{ success: boolean }>(`${CONTACTS_API}/setup-audit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  });

  return {
    upsertContact,
    updateContact,
    deleteContact,
    bulkDeleteContacts,
    bulkRestoreContacts,
    restoreContact,
    logExportAudit,
    logMergeAudit,
    logSetupAudit,
  };
}

export function useContactColumnPrefs(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: CONTACT_COLUMN_PREFERENCES_QUERY_KEY,
    queryFn: async () => {
      const preferencesResponse = await apiJson<{ preferences: ContactColumnPreference[]; prefs?: ContactColumnPreference[] }>(
        `${CONTACTS_API}/column-preferences`,
      );
      return preferencesResponse.preferences ?? preferencesResponse.prefs ?? [];
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
          return {
            key: columnPreference.key.trim(),
            enabled: Boolean(columnPreference.enabled),
            order: Number.isSafeInteger(floored) && floored >= 0 ? floored : index,
          };
        });
      return apiJson<{ success: boolean; preferences: ContactColumnPreference[]; prefs?: ContactColumnPreference[] }>(
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
        preferencesResponse.preferences ?? preferencesResponse.prefs ?? [],
      );
    },
  });
}

export function useContactsSavedReports() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: CONTACTS_SAVED_REPORTS_QUERY_KEY,
    queryFn: async () => {
      const reportsResponse = await apiJson<{ reports: ContactsSavedReport[] }>(`${CONTACTS_API}/saved-reports`);
      return reportsResponse.reports;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useContactsSavedReportMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: CONTACTS_SAVED_REPORTS_QUERY_KEY });
  };

  const createSavedReport = useMutation({
    mutationFn: async (payload: {
      name: string;
      drillDown: ContactsWorkDrillDown;
      shareScope?: ContactsSavedReportShareScope;
      sharedWithRoles?: string[];
      sharedWithUserIds?: string[];
    }) =>
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

export interface UseContactsCollectionResult {
  contacts: Contact[];
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
}

/** Query-first contacts; falls back to localStorage only before the first successful fetch. */
export function useContactsCollection(options?: { enabled?: boolean; includeDeleted?: boolean }): Contact[] {
  const enabled = options?.enabled ?? true;
  const includeDeleted = options?.includeDeleted ?? false;
  const queryResult = useContacts({ enabled, includeDeleted });
  return useSyncedCollection<Contact>({
    queryData: queryResult.data,
    isSuccess: queryResult.isSuccess,
    collectionName: CONTACTS_MODULE_CONTRACT.collectionKey,
    enabled,
  });
}

/** Returns synced contacts along with query loading and fetching state. */
export function useContactsCollectionState(options?: { enabled?: boolean; includeDeleted?: boolean }): UseContactsCollectionResult {
  const enabled = options?.enabled ?? true;
  const includeDeleted = options?.includeDeleted ?? false;
  const queryResult = useContacts({ enabled, includeDeleted });
  const contacts = useSyncedCollection<Contact>({
    queryData: queryResult.data,
    isSuccess: queryResult.isSuccess,
    collectionName: CONTACTS_MODULE_CONTRACT.collectionKey,
    enabled,
  });
  return {
    contacts,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    isFetching: queryResult.isFetching,
  };
}


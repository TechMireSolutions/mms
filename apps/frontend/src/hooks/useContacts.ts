import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  CONTACTS_MODULE_CONTRACT,
  filterActiveContacts,
  type Contact,
  type ContactColumnPref,
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
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { saveCollection } from '@/lib/db';
import { useLiveCollection } from '@/hooks/useLiveCollection';
import { enqueueContactsOutbox } from '@/lib/contacts/contactsSyncOutbox';

const CONTACTS_API = CONTACTS_MODULE_CONTRACT.restBasePath;

export const CONTACTS_QUERY_KEY = [CONTACTS_MODULE_CONTRACT.collectionKey, 'list'] as const;
export const CONTACT_COLUMN_PREFS_QUERY_KEY = [CONTACTS_MODULE_CONTRACT.collectionKey, 'column-prefs'] as const;
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
  lifecycleStage?: string;
  gender?: string;
  includeDeleted?: boolean;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  enabled?: boolean;
}

function buildContactsPageUrl(params: ContactsPaginatedParams): string {
  const q = new URLSearchParams();
  q.set('page', String(params.page));
  q.set('limit', String(params.limit ?? CONTACTS_MODULE_CONTRACT.defaultPageSize));
  if (params.search?.trim()) q.set('search', params.search.trim());
  if (params.lifecycleStage) q.set('lifecycleStage', params.lifecycleStage);
  if (params.gender) q.set('gender', params.gender);
  if (params.includeDeleted) q.set('includeDeleted', 'true');
  if (params.sortField) q.set('sortField', params.sortField);
  if (params.sortDir) q.set('sortDir', params.sortDir);
  return `${CONTACTS_API}?${q.toString()}`;
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
    placeholderData: (prev) => prev,
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
    const body = await apiJson<ContactsListPageResult>(buildContactsPageUrl({ ...params, page, limit }));
    all.push(...body.contacts);
    total = body.total;
    onProgress?.(all.length, total);
    if (!body.hasMore || page >= 200) break;
    page += 1;
  }

  return all;
}

export function useContactsMetrics(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: CONTACTS_METRICS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ metrics: ContactsCommandMetricsSnapshot }>(`${CONTACTS_API}/metrics`);
      return body.metrics;
    },
    enabled: isAuthenticated && enabled,
    staleTime: 30_000,
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
      const q = yearsKey ? `?years=${encodeURIComponent(yearsKey)}` : '';
      return apiJson<ContactsReportAnalyticsResult>(`${CONTACTS_API}/report-analytics${q}`);
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
      const body = await apiJson<{ results: Record<string, ContactsWidgetAggregateResult> }>(
        `${CONTACTS_API}/widget-aggregates`,
        {
          method: 'POST',
          body: JSON.stringify({ widgets: contactQueries }),
        },
      );
      return body.results;
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
      const q = new URLSearchParams({ page: String(page), limit: String(limit) });
      return apiJson<ContactsDuplicatePairsPageResult>(`${CONTACTS_API}/duplicates?${q.toString()}`);
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
      const body = await apiJson<{ contact: Contact }>(`${CONTACTS_API}/${contactId}`);
      return body.contact;
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
      const body = await apiJson<{ contacts: Contact[] }>(`${CONTACTS_API}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ ids: normalized }),
      });
      return body.contacts;
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
      const body = await apiJson<{ config: ContactGoogleSyncConfigClient }>(`${CONTACTS_API}/google-sync`);
      return body.config;
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
    onSuccess: (data) => {
      queryClient.setQueryData(CONTACTS_GOOGLE_SYNC_QUERY_KEY, data.config);
    },
  });
  const clearConfig = useMutation({
    mutationFn: async () => apiFetch(`${CONTACTS_API}/google-sync`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.setQueryData(CONTACTS_GOOGLE_SYNC_QUERY_KEY, {});
    },
  });
  const logSyncAudit = useMutation({
    mutationFn: async (body: {
      action: 'credentials_saved' | 'oauth_connected' | 'sync_complete' | 'disconnected';
      imported?: number;
      total?: number;
      skipped?: number;
    }) =>
      apiJson<{ success: boolean }>(`${CONTACTS_API}/google-sync/audit`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  });
  const exchangeOAuth = useMutation({
    mutationFn: async (body: { code: string; redirectUri: string }) =>
      apiJson<{ config: ContactGoogleSyncConfigClient }>(`${CONTACTS_API}/google-sync/exchange`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(CONTACTS_GOOGLE_SYNC_QUERY_KEY, data.config);
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
  const body = await apiJson<{ contacts: Contact[] }>(url);
  saveCollection(CONTACTS_MODULE_CONTRACT.collectionKey, filterActiveContacts(body.contacts));
  return body.contacts;
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

export function useContactColumnPrefs() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: CONTACT_COLUMN_PREFS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ prefs: ContactColumnPref[] }>(`${CONTACTS_API}/column-prefs`);
      return body.prefs;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useContactColumnPrefsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rawPrefs: ContactColumnPref[]) => {
      const prefs: ContactColumnPref[] = rawPrefs
        .filter((p) => p && typeof p.key === 'string' && p.key.trim().length > 0)
        .map((p, i) => {
          const floored = Math.floor(typeof p.order === 'number' ? p.order : Number(p.order));
          return {
            key: p.key.trim(),
            enabled: Boolean(p.enabled),
            order: Number.isSafeInteger(floored) && floored >= 0 ? floored : i,
          };
        });
      return apiJson<{ success: boolean; prefs: ContactColumnPref[] }>(`${CONTACTS_API}/column-prefs`, {
        method: 'PUT',
        body: JSON.stringify({ prefs }),
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(CONTACT_COLUMN_PREFS_QUERY_KEY, data.prefs);
    },
  });
}

export function useContactsSavedReports() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: CONTACTS_SAVED_REPORTS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ reports: ContactsSavedReport[] }>(`${CONTACTS_API}/saved-reports`);
      return body.reports;
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

/** Query-first contacts; falls back to localStorage only before the first successful fetch. */
export function useContactsCollection(options?: { enabled?: boolean; includeDeleted?: boolean }): Contact[] {
  const enabled = options?.enabled ?? true;
  const includeDeleted = options?.includeDeleted ?? false;
  const { data: fromQuery, isSuccess } = useContacts({ enabled, includeDeleted });
  const fromLocal = useLiveCollection<Contact>(CONTACTS_MODULE_CONTRACT.collectionKey, [], { enabled });
  if (!enabled) return [];
  if (isSuccess) {
    return fromQuery ?? [];
  }
  return fromLocal;
}

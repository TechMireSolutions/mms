import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CONTACTS_MODULE_MANIFEST,
  type Contact,
  type ContactsListPageResult,
  type ContactsQuickFilter,
} from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';
import {
  CONTACTS_API,
  CONTACTS_QUERY_KEY,
  contactDetailQueryKey,
  contactsListQueryKey,
} from '@/tenant/features/contacts/hooks/contactsQueryKeys';

export interface ContactsPaginatedParams {
  page: number;
  limit?: number;
  search?: string;
  gender?: string;
  includeDeleted?: boolean;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  hasPhone?: boolean;
  quickFilter?: ContactsQuickFilter;
  excludeIds?: Array<string | number>;
  enabled?: boolean;
}

function buildContactsPageUrl(params: ContactsPaginatedParams): string {
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(params.page));
  queryParams.set('limit', String(params.limit ?? CONTACTS_MODULE_MANIFEST.defaultPageSize));
  if (params.search?.trim()) queryParams.set('search', params.search.trim());
  if (params.gender) queryParams.set('gender', params.gender);
  if (params.includeDeleted) queryParams.set('includeDeleted', 'true');
  if (params.hasPhone) queryParams.set('hasPhone', 'true');
  if (params.quickFilter && params.quickFilter !== 'all') {
    queryParams.set('quickFilter', params.quickFilter);
  }
  if (params.excludeIds && params.excludeIds.length > 0) {
    queryParams.set('excludeIds', params.excludeIds.map(String).join(','));
  }
  if (params.sortField) queryParams.set('sortField', params.sortField);
  if (params.sortDir) queryParams.set('sortDir', params.sortDir);
  return `${CONTACTS_API}?${queryParams.toString()}`;
}

function contactsListQueryKeyParams(params: ContactsPaginatedParams) {
  return {
    page: params.page,
    limit: params.limit ?? CONTACTS_MODULE_MANIFEST.defaultPageSize,
    search: params.search?.trim() || '',
    gender: params.gender || '',
    includeDeleted: Boolean(params.includeDeleted),
    hasPhone: Boolean(params.hasPhone),
    quickFilter: params.quickFilter ?? 'all',
    excludeIds: (params.excludeIds ?? []).map(String).join(','),
    sortField: params.sortField || '',
    sortDir: params.sortDir || 'asc',
  };
}

export function contactsPaginatedQueryKey(params: ContactsPaginatedParams) {
  return [...CONTACTS_QUERY_KEY, 'page', contactsListQueryKeyParams(params)] as const;
}

function sameContactsListFilters(
  previous: ReturnType<typeof contactsListQueryKeyParams> | undefined,
  next: ReturnType<typeof contactsListQueryKeyParams>,
): boolean {
  if (!previous) return false;
  return (
    previous.search === next.search &&
    previous.gender === next.gender &&
    previous.includeDeleted === next.includeDeleted &&
    previous.hasPhone === next.hasPhone &&
    previous.quickFilter === next.quickFilter &&
    previous.excludeIds === next.excludeIds &&
    previous.sortField === next.sortField &&
    previous.sortDir === next.sortDir &&
    previous.limit === next.limit
  );
}

export function useContactsPaginated(params: ContactsPaginatedParams) {
  const { isAuthenticated } = useAuth();
  const enabled = params.enabled ?? true;
  const keyParams = contactsListQueryKeyParams(params);
  return useQuery({
    queryKey: contactsPaginatedQueryKey(params),
    queryFn: async () => apiJson<ContactsListPageResult>(buildContactsPageUrl(params)),
    enabled: isAuthenticated && enabled,
    staleTime: 15_000,
    placeholderData: (previousData, previousQuery) => {
      const previousParams = previousQuery?.queryKey.at(-1) as ReturnType<typeof contactsListQueryKeyParams> | undefined;
      return sameContactsListFilters(previousParams, keyParams) ? previousData : undefined;
    },
  });
}

/** Fetches all pages matching Work filters for export. */
export async function fetchAllContactsForQuery(
  params: Omit<ContactsPaginatedParams, 'page' | 'enabled'>,
  onProgress?: (fetched: number, total: number) => void,
): Promise<Contact[]> {
  const limit = CONTACTS_MODULE_MANIFEST.maxPageSize;
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

export async function fetchContactById(contactId: string): Promise<Contact> {
  const contactResponse = await apiJson<{ contact: Contact }>(`${CONTACTS_API}/${contactId}`);
  return contactResponse.contact;
}

async function fetchContacts(includeDeleted = false): Promise<Contact[]> {
  const url = includeDeleted ? `${CONTACTS_API}?includeDeleted=true` : CONTACTS_API;
  const contactsResponse = await apiJson<{ contacts: Contact[] }>(url);
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

export function useContactById(contactId: string | undefined, enabled = true) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: contactDetailQueryKey(contactId ?? ''),
    queryFn: () => fetchContactById(contactId!),
    enabled: isAuthenticated && enabled && Boolean(contactId),
    staleTime: 10_000,
  });
}

/** Batch-resolve contact labels by id (pickers & cross-module links). */
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

export interface UseContactsCollectionResult {
  contacts: Contact[];
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
}

/** Query-only contacts list (no localStorage hybrid). Prefer paginated hooks for Work directories. */
export function useContactsCollection(options?: { enabled?: boolean; includeDeleted?: boolean }): Contact[] {
  return useContactsCollectionState(options).contacts;
}

/** Returns REST contacts along with query loading and fetching state. */
export function useContactsCollectionState(options?: { enabled?: boolean; includeDeleted?: boolean }): UseContactsCollectionResult {
  const enabled = options?.enabled ?? true;
  const includeDeleted = options?.includeDeleted ?? false;
  const queryResult = useContacts({ enabled, includeDeleted });
  return {
    contacts: queryResult.data ?? [],
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    isFetching: queryResult.isFetching,
  };
}

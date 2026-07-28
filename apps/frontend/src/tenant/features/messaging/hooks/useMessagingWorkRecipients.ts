import type { Contact, MessagingRoleFilter, MessagingGenderFilter, ContactsListPageResult } from '@mms/shared';
import { CONTACTS_MODULE_MANIFEST } from '@mms/shared';
import { useQuery } from '@tanstack/react-query';
import { apiJson } from '@/lib/apiClient';
import { useAuth } from '@/lib/contexts/AuthContext';

export const MESSAGING_RECIPIENTS_QUERY_KEY = ['messaging', 'recipients'] as const;

const SELECT_ALL_PAGE_SIZE = 200;
const SELECT_ALL_MAX_PAGES = 50;

export interface UseMessagingWorkRecipientsParams {
  roleFilter: MessagingRoleFilter;
  genderFilter: MessagingGenderFilter;
  search: string;
  page: number;
  pageSize?: number;
  enabled?: boolean;
}

export interface MessagingWorkRecipientsResult {
  contacts: Contact[];
  page: number;
  total: number;
  limit: number;
  hasMore: boolean;
  isError: boolean;
  isPending: boolean;
  refetch: () => void;
}

function buildRecipientsQuery(params: {
  role: MessagingRoleFilter;
  gender: MessagingGenderFilter;
  search: string;
  page: number;
  pageSize: number;
  hasPhone?: boolean;
  hasEmail?: boolean;
}): string {
  const queryParams = new URLSearchParams();
  queryParams.set('role', params.role);
  queryParams.set('page', String(params.page));
  queryParams.set('pageSize', String(params.pageSize));
  if (params.gender !== 'all') queryParams.set('gender', params.gender);
  if (params.search) queryParams.set('search', params.search);
  if (params.hasPhone) queryParams.set('hasPhone', 'true');
  if (params.hasEmail) queryParams.set('hasEmail', 'true');
  return queryParams.toString();
}

/**
 * Loads every matching recipient across pages for “Select All With Phone/Email”.
 */
export async function loadMatchingRecipients(params: {
  roleFilter: MessagingRoleFilter;
  genderFilter: MessagingGenderFilter;
  search: string;
  kind: 'phone' | 'email';
}): Promise<{ contacts: Contact[]; truncated: boolean }> {
  const search = params.search.trim();
  const contacts: Contact[] = [];
  let page = 1;
  let hasMore = true;
  while (hasMore && page <= SELECT_ALL_MAX_PAGES) {
    const query = buildRecipientsQuery({
      role: params.roleFilter,
      gender: params.genderFilter,
      search,
      page,
      pageSize: SELECT_ALL_PAGE_SIZE,
      hasPhone: params.kind === 'phone',
      hasEmail: params.kind === 'email',
    });
    const response = await apiJson<ContactsListPageResult>(`/api/messaging/recipients?${query}`);
    contacts.push(...(response.contacts ?? []));
    hasMore = Boolean(response.hasMore);
    page += 1;
  }
  return { contacts, truncated: hasMore };
}

/**
 * Work-tab recipients via GET /api/messaging/recipients (messaging RBAC + server pagination).
 */
export function useMessagingWorkRecipients(
  params: UseMessagingWorkRecipientsParams,
): MessagingWorkRecipientsResult {
  const { isAuthenticated } = useAuth();
  const pageSize = params.pageSize ?? CONTACTS_MODULE_MANIFEST.defaultPageSize;
  const enabled = params.enabled !== false && isAuthenticated;
  const role = params.roleFilter;
  const gender = params.genderFilter;
  const search = params.search.trim();
  const page = params.page;

  const queryString = buildRecipientsQuery({
    role,
    gender,
    search,
    page,
    pageSize,
  });

  const query = useQuery({
    queryKey: [...MESSAGING_RECIPIENTS_QUERY_KEY, role, gender, search, page, pageSize] as const,
    queryFn: async () => apiJson<ContactsListPageResult>(`/api/messaging/recipients?${queryString}`),
    enabled,
    staleTime: 15_000,
    placeholderData: (previousData, previousQuery) => {
      const previousKey = previousQuery?.queryKey;
      if (!previousKey || previousKey.length < 6) return undefined;
      const [, , prevRole, prevGender, prevSearch, , prevPageSize] = previousKey;
      if (
        prevRole === role
        && prevGender === gender
        && prevSearch === search
        && prevPageSize === pageSize
      ) {
        return previousData;
      }
      return undefined;
    },
  });

  return {
    contacts: query.data?.contacts ?? [],
    page: query.data?.page ?? page,
    total: query.data?.total ?? 0,
    limit: query.data?.limit ?? pageSize,
    hasMore: Boolean(query.data?.hasMore),
    isError: query.isError,
    isPending: query.isPending,
    refetch: () => {
      void query.refetch();
    },
  };
}

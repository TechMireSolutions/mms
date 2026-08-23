import type {
  Contact,
  MessagingRoleFilter,
  MessagingGenderFilter,
  ContactsListPageResult,
  MessagingRecipientsMatchResponseDto,
  StandardMessagingRecipient,
} from '@mms/shared';
import { CONTACTS_MODULE_MANIFEST } from '@mms/shared';
import { tsrClient } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';

export const MESSAGING_RECIPIENTS_QUERY_KEY = ['messaging', 'recipients'] as const;

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
  isFetching: boolean;
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
 * Loads matching lean recipients for “Select All With Phone/Email” via one server call.
 */
export async function loadMatchingRecipients(params: {
  roleFilter: MessagingRoleFilter;
  genderFilter: MessagingGenderFilter;
  search: string;
  kind: 'phone' | 'email';
  signal?: AbortSignal;
}): Promise<{ recipients: StandardMessagingRecipient[]; truncated: boolean }> {
  const queryParams = new URLSearchParams();
  queryParams.set('role', params.roleFilter);
  queryParams.set('kind', params.kind);
  if (params.genderFilter !== 'all') queryParams.set('gender', params.genderFilter);
  const search = params.search.trim();
  if (search) queryParams.set('search', search);

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const response = await tsrClient.messaging.matchRecipients.query({
    query: {
      role: params.roleFilter,
      kind: params.kind,
      gender: params.genderFilter !== 'all' ? params.genderFilter : undefined,
      search: search || undefined,
    },
  });
  const data = response.body as MessagingRecipientsMatchResponseDto;
  return {
    recipients: data.recipients ?? [],
    truncated: Boolean(data.truncated),
  };
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

  // @ts-expect-error - TS union discrimination limit with ts-rest

  const query = tsrClient.messaging.listRecipients.useQuery({
    queryKey: [...MESSAGING_RECIPIENTS_QUERY_KEY, role, gender, search, page, pageSize] as const,
    queryData: {
      query: {
        role,
        page,
        pageSize,
        gender: gender !== 'all' ? gender : undefined,
        search: search || undefined,
      } as any,
    },
    enabled,
    staleTime: 15_000,
    placeholderData: (previousData: any, previousQuery: any) => {
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
  
  const data = query.data?.body as ContactsListPageResult | undefined;

  return {
    contacts: data?.contacts ?? [],
    page: data?.page ?? page,
    total: data?.total ?? 0,
    limit: data?.limit ?? pageSize,
    hasMore: Boolean(data?.hasMore),
    isError: query.isError,
    isPending: query.isPending,
    isFetching: query.isFetching,
    refetch: () => {
      void query.refetch();
    },
  };
}

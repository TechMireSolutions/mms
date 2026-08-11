import { useQuery } from '@tanstack/react-query';
import {
  CONTACTS_MODULE_MANIFEST,
  type ContactsCommandMetricsSnapshot,
  type ContactsDuplicatePairsPageResult,
  type ContactsMonthlyYearCounts,
  type ContactsReportAnalyticsSnapshot,
  type ContactsWidgetAggregateResult,
  type ContactsWidgetQuery,
  contactsWidgetQueryFromWidget,
} from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';
import { createModuleWidgetAggregatesQuery } from '@/lib/query/createModuleWidgetAggregatesQuery';
import {
  CONTACTS_API,
  CONTACTS_DUPLICATES_QUERY_KEY,
  CONTACTS_REPORT_ANALYTICS_QUERY_KEY,
  CONTACTS_WIDGET_AGGREGATES_QUERY_KEY,
} from '@/tenant/features/contacts/hooks/contactsQueryKeys';

export function useContactsMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<ContactsCommandMetricsSnapshot>({
    moduleId: CONTACTS_MODULE_MANIFEST.moduleId,
    apiPath: CONTACTS_MODULE_MANIFEST.restBasePath,
    enabled: options?.enabled,
  });
}

export interface ContactsReportAnalyticsParams {
  enabled?: boolean;
  compareYears?: number[];
  language?: string;
}

export interface ContactsReportAnalyticsResult {
  analytics: ContactsReportAnalyticsSnapshot;
  monthlyByYear?: ContactsMonthlyYearCounts[];
}

export function useContactsReportAnalytics(params: ContactsReportAnalyticsParams = {}) {
  const { isAuthenticated } = useAuth();
  const enabled = params.enabled ?? true;
  const yearsKey = params.compareYears?.filter(Boolean).join(',') ?? '';
  const language = params.language ?? 'en';
  return useQuery({
    queryKey: [...CONTACTS_REPORT_ANALYTICS_QUERY_KEY, yearsKey, language] as const,
    queryFn: async ({ signal }) => {
      const query = new URLSearchParams();
      if (yearsKey) query.set('years', yearsKey);
      if (language) query.set('lang', language);
      const queryString = query.toString() ? `?${query.toString()}` : '';
      return apiJson<ContactsReportAnalyticsResult>(
        `${CONTACTS_API}/report-analytics${queryString}`,
        { signal },
      );
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
  filters?: ContactsWidgetQuery['filters'];
  chartLimit?: number;
}

const buildContactsWidgetAggregatesQuery = createModuleWidgetAggregatesQuery<
  ContactsWidgetQuery,
  ContactsWidgetAggregateResult
>({
  apiBase: CONTACTS_API,
  queryKey: CONTACTS_WIDGET_AGGREGATES_QUERY_KEY,
  collection: 'contacts',
  toWidgetQuery: contactsWidgetQueryFromWidget,
});

export function useContactsWidgetAggregates(
  widgets: ContactsWidgetAggregateWidgetInput[],
  options?: { enabled?: boolean },
) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  return useQuery(buildContactsWidgetAggregatesQuery(widgets, isAuthenticated && enabled));
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
    queryFn: async ({ signal }) => {
      const queryParams = new URLSearchParams({ page: String(page), limit: String(limit) });
      return apiJson<ContactsDuplicatePairsPageResult>(
        `${CONTACTS_API}/duplicates?${queryParams.toString()}`,
        { signal },
      );
    },
    enabled: isAuthenticated && enabled,
    staleTime: 30_000,
  });
}

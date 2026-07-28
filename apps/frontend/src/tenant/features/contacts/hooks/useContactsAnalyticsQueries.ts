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

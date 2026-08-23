import {
  CONTACTS_MODULE_MANIFEST,
  type ContactsCommandMetricsSnapshot,
  type ContactsMonthlyYearCounts,
  type ContactsReportAnalyticsSnapshot,
  type ContactsWidgetQuery,
  contactsWidgetQueryFromWidget,
} from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiContract, tsrClient } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
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

interface ContactsReportAnalyticsParams {
  enabled?: boolean;
  compareYears?: number[];
  language?: string;
}

interface ContactsReportAnalyticsResult {
  analytics: ContactsReportAnalyticsSnapshot;
  monthlyByYear?: ContactsMonthlyYearCounts[];
}

export function useContactsReportAnalytics(params: ContactsReportAnalyticsParams = {}) {
  const { isAuthenticated } = useAuth();
  const enabled = params.enabled ?? true;
  const compareYears = params.compareYears?.filter(Boolean) ?? [];
  const language = params.language ?? 'en';
  
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.contacts.reportAnalytics.useQuery({
    queryKey: [...CONTACTS_REPORT_ANALYTICS_QUERY_KEY, compareYears.join(','), language] as const,
    queryData: { query: { years: compareYears, lang: language } },
    enabled: isAuthenticated && enabled,
    staleTime: 30_000,
  });
}

interface ContactsWidgetAggregateWidgetInput {
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

export function useContactsWidgetAggregates(
  widgets: ContactsWidgetAggregateWidgetInput[],
  options?: { enabled?: boolean },
) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;

  const queries = useMemo(
    () =>
      widgets
        .filter((widget) => widget.collection === 'contacts')
        .map((widget) => contactsWidgetQueryFromWidget(widget)),
    [widgets],
  );

  const querySignature = useMemo(() => {
    return JSON.stringify(
      [...queries]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((query) => ({
          id: query.id,
          target: query.targetField,
          filter: query.filterValue,
          filterOperator: query.filterOperator,
          xAxis: query.xAxisField,
        })),
    );
  }, [queries]);

  const query = useQuery({
    queryKey: [...CONTACTS_WIDGET_AGGREGATES_QUERY_KEY, querySignature] as const,
    queryFn: async () => {
      const res = await apiContract.contacts.widgetAggregates({ body: { widgets: queries } });
      return (res.body as any)?.results ?? {};
    },
    enabled: isAuthenticated && enabled && queries.length > 0,
    staleTime: 30_000,
  });
  
  return { ...query, data: query.data ?? {} };
}

interface ContactsDuplicatesParams {
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export function useContactsDuplicatePairs(params: ContactsDuplicatesParams = {}) {
  const { isAuthenticated } = useAuth();
  const enabled = params.enabled ?? true;
  const page = params.page ?? 1;
  const limit = params.limit ?? 100;
  
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.contacts.getDuplicates.useQuery({
    queryKey: [...CONTACTS_DUPLICATES_QUERY_KEY, page, limit] as const,
    queryData: { query: { page, limit } },
    enabled: isAuthenticated && enabled,
    staleTime: 30_000,
  });
}

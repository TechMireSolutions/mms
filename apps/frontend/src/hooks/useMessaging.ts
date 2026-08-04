import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import {
  MESSAGE_LOG_RECORD_BATCH_MAX,
  MESSAGE_LOGS_DEFAULT_PAGE_SIZE,
  type MessageTemplate,
  type Message,
  type MessageLogCreateDto,
  type MessageTemplateInputDto,
  type MessagingMetricsDto,
} from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { notifyApiFailure } from '@/lib/apiErrorNotify';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';

export const MESSAGING_TEMPLATES_QUERY_KEY = ['messaging', 'templates'] as const;
export const MESSAGING_LOGS_QUERY_KEY = ['messaging', 'logs'] as const;
export const MESSAGING_METRICS_QUERY_KEY = ['messaging', 'metrics'] as const;

export interface MessageLogsPageResult {
  logs: Message[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface RecordDispatchesInput {
  logs: MessageLogCreateDto[];
  /** Final per-batch key from the caller (already chunked); forwarded unchanged. */
  idempotencyKey?: string;
}

export function messagingTemplatesQueryOptions(enabled: boolean) {
  return queryOptions({
    queryKey: MESSAGING_TEMPLATES_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const res = await apiJson<{ templates: MessageTemplate[] }>('/api/messaging/templates', { signal });
      return res.templates || [];
    },
    staleTime: 30_000,
    enabled,
  });
}

export function messagingLogsQueryOptions(params: {
  enabled: boolean;
  channel?: string;
  category?: string;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  pageSize: number;
}) {
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(params.page));
  queryParams.set('pageSize', String(params.pageSize));
  if (params.channel && params.channel !== 'all') queryParams.set('channel', params.channel);
  if (params.category && params.category !== 'all') queryParams.set('category', params.category);
  if (params.search?.trim()) queryParams.set('search', params.search.trim());
  if (params.status && params.status !== 'all') queryParams.set('status', params.status);
  if (params.startDate?.trim()) queryParams.set('startDate', params.startDate.trim());
  if (params.endDate?.trim()) queryParams.set('endDate', params.endDate.trim());
  const endpoint = `/api/messaging/logs?${queryParams.toString()}`;

  return queryOptions({
    queryKey: [
      ...MESSAGING_LOGS_QUERY_KEY,
      params.channel,
      params.category,
      params.search,
      params.status,
      params.startDate,
      params.endDate,
      params.page,
      params.pageSize,
    ] as const,
    queryFn: async ({ signal }) => {
      const res = await apiJson<MessageLogsPageResult>(endpoint, { signal });
      return {
        logs: res.logs || [],
        total: res.total ?? res.logs?.length ?? 0,
        page: res.page ?? params.page,
        pageSize: res.pageSize ?? params.pageSize,
        hasMore: Boolean(res.hasMore),
      } satisfies MessageLogsPageResult;
    },
    staleTime: 15_000,
    enabled: params.enabled,
    placeholderData: (previous) => previous,
  });
}

export function messagingMetricsQueryOptions(params: {
  enabled: boolean;
  startDate?: string;
  endDate?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params.startDate?.trim()) queryParams.set('startDate', params.startDate.trim());
  if (params.endDate?.trim()) queryParams.set('endDate', params.endDate.trim());
  const qs = queryParams.toString();
  const endpoint = qs ? `/api/messaging/metrics?${qs}` : '/api/messaging/metrics';

  return queryOptions({
    queryKey: [...MESSAGING_METRICS_QUERY_KEY, params.startDate, params.endDate] as const,
    queryFn: async ({ signal }) => {
      const res = await apiJson<{ metrics: MessagingMetricsDto }>(endpoint, { signal });
      return res.metrics;
    },
    staleTime: 15_000,
    enabled: params.enabled,
  });
}

export function useMessageTemplates(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  const query = useQuery(
    messagingTemplatesQueryOptions(options?.enabled !== false && isAuthenticated),
  );
  return { ...query, templates: query.data ?? [] };
}

export function useMessageLogs(options?: {
  enabled?: boolean;
  channel?: string;
  category?: string;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}) {
  const { isAuthenticated } = useAuth();
  const page = options?.page && options.page > 0 ? options.page : 1;
  const pageSize = options?.pageSize && options.pageSize > 0
    ? options.pageSize
    : MESSAGE_LOGS_DEFAULT_PAGE_SIZE;

  const query = useQuery(
    messagingLogsQueryOptions({
      enabled: options?.enabled !== false && isAuthenticated,
      channel: options?.channel,
      category: options?.category,
      search: options?.search,
      status: options?.status,
      startDate: options?.startDate,
      endDate: options?.endDate,
      page,
      pageSize,
    }),
  );

  return {
    ...query,
    logs: query.data?.logs ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? page,
    pageSize: query.data?.pageSize ?? pageSize,
    hasMore: query.data?.hasMore ?? false,
  };
}

export function useMessagingMetrics(options?: {
  enabled?: boolean;
  startDate?: string;
  endDate?: string;
}) {
  const { isAuthenticated } = useAuth();
  return useQuery(
    messagingMetricsQueryOptions({
      enabled: options?.enabled !== false && isAuthenticated,
      startDate: options?.startDate,
      endDate: options?.endDate,
    }),
  );
}

export function useMessagingMutations() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: MESSAGING_TEMPLATES_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: MESSAGING_LOGS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: MESSAGING_METRICS_QUERY_KEY });
  };

  const onError = (error: unknown) => {
    notifyApiFailure(error, t);
  };

  const saveTemplate = useMutation({
    mutationFn: async (template: MessageTemplateInputDto) => {
      return apiJson<{ template: MessageTemplate }>('/api/messaging/templates', {
        method: 'POST',
        body: JSON.stringify(template),
      });
    },
    onSuccess: () => invalidate(),
    onError,
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      return apiJson<{ success: boolean }>(`/api/messaging/templates/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => invalidate(),
    onError,
  });

  const recordDispatches = useMutation({
    mutationFn: async (input: RecordDispatchesInput | MessageLogCreateDto[]) => {
      const logs = Array.isArray(input) ? input : input.logs;
      const idempotencyKey = Array.isArray(input) ? undefined : input.idempotencyKey;
      // Caller owns batching when an idempotency key is supplied — forward it unchanged.
      if (idempotencyKey) {
        const response = await apiJson<{ recorded: number }>('/api/messaging/logs', {
          method: 'POST',
          headers: { 'Idempotency-Key': idempotencyKey },
          body: JSON.stringify({ logs, idempotencyKey }),
        });
        return { recorded: response.recorded };
      }
      let recorded = 0;
      for (let index = 0; index < logs.length; index += MESSAGE_LOG_RECORD_BATCH_MAX) {
        const chunk = logs.slice(index, index + MESSAGE_LOG_RECORD_BATCH_MAX);
        const response = await apiJson<{ recorded: number }>('/api/messaging/logs', {
          method: 'POST',
          body: JSON.stringify({ logs: chunk }),
        });
        recorded += response.recorded;
      }
      return { recorded };
    },
    onSuccess: () => invalidate(),
    onError,
  });

  const clearLogs = useMutation({
    mutationFn: async () => {
      return apiJson<{ success: boolean }>('/api/messaging/logs', {
        method: 'DELETE',
      });
    },
    onSuccess: () => invalidate(),
    onError,
  });

  return {
    saveTemplate,
    deleteTemplate,
    recordDispatches,
    clearLogs,
  };
}

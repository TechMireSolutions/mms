import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MESSAGE_LOG_RECORD_BATCH_MAX,
  MESSAGE_LOGS_DEFAULT_PAGE_SIZE,
  type MessageTemplate,
  type Message,
  type MessageLogCreateDto,
  type MessagingMetricsDto,
} from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { useAuth } from '@/lib/contexts/AuthContext';
import { notify } from '@/lib/notify';
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

export function useMessageTemplates(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: MESSAGING_TEMPLATES_QUERY_KEY,
    queryFn: async () => {
      const res = await apiJson<{ templates: MessageTemplate[] }>('/api/messaging/templates');
      return res.templates || [];
    },
    staleTime: 30_000,
    enabled: options?.enabled !== false && isAuthenticated,
  });

  return { ...query, templates: query.data ?? [] };
}

export function useMessageLogs(options?: {
  enabled?: boolean;
  channel?: string;
  category?: string;
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const { isAuthenticated } = useAuth();
  const page = options?.page && options.page > 0 ? options.page : 1;
  const pageSize = options?.pageSize && options.pageSize > 0
    ? options.pageSize
    : MESSAGE_LOGS_DEFAULT_PAGE_SIZE;

  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('pageSize', String(pageSize));
  if (options?.channel && options.channel !== 'all') queryParams.set('channel', options.channel);
  if (options?.category && options.category !== 'all') queryParams.set('category', options.category);
  if (options?.search?.trim()) queryParams.set('search', options.search.trim());
  if (options?.status && options.status !== 'all') queryParams.set('status', options.status);
  const endpoint = `/api/messaging/logs?${queryParams.toString()}`;

  const query = useQuery({
    queryKey: [
      ...MESSAGING_LOGS_QUERY_KEY,
      options?.channel,
      options?.category,
      options?.search,
      options?.status,
      page,
      pageSize,
    ],
    queryFn: async () => {
      const res = await apiJson<MessageLogsPageResult>(endpoint);
      return {
        logs: res.logs || [],
        total: res.total ?? res.logs?.length ?? 0,
        page: res.page ?? page,
        pageSize: res.pageSize ?? pageSize,
        hasMore: Boolean(res.hasMore),
      } satisfies MessageLogsPageResult;
    },
    staleTime: 15_000,
    enabled: options?.enabled !== false && isAuthenticated,
    placeholderData: (previous) => previous,
  });

  return {
    ...query,
    logs: query.data?.logs ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? page,
    pageSize: query.data?.pageSize ?? pageSize,
    hasMore: query.data?.hasMore ?? false,
  };
}

export function useMessagingMetrics(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: MESSAGING_METRICS_QUERY_KEY,
    queryFn: async () => {
      const res = await apiJson<{ metrics: MessagingMetricsDto }>('/api/messaging/metrics');
      return res.metrics;
    },
    staleTime: 15_000,
    enabled: options?.enabled !== false && isAuthenticated,
  });
}

export function useMessagingMutations() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: MESSAGING_TEMPLATES_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: MESSAGING_LOGS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: MESSAGING_METRICS_QUERY_KEY });
  };

  const onError = () => {
    notify.error(t('settings.serverSaveFailed'));
  };

  const saveTemplate = useMutation({
    mutationFn: async (template: Partial<MessageTemplate> & { label: string; body: string }) => {
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
    mutationFn: async (logs: MessageLogCreateDto[]) => {
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

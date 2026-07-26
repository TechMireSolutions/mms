import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type MessageTemplate, type Message, type MessagingMetricsDto } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { useAuth } from '@/lib/contexts/AuthContext';
import { notify } from '@/lib/notify';
import { useTranslation } from '@/hooks/useTranslation';

export const MESSAGING_TEMPLATES_QUERY_KEY = ['messaging', 'templates'] as const;
export const MESSAGING_LOGS_QUERY_KEY = ['messaging', 'logs'] as const;
export const MESSAGING_METRICS_QUERY_KEY = ['messaging', 'metrics'] as const;

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
}) {
  const { isAuthenticated } = useAuth();

  const queryParams = new URLSearchParams();
  if (options?.channel && options.channel !== 'all') queryParams.set('channel', options.channel);
  if (options?.category && options.category !== 'all') queryParams.set('category', options.category);
  if (options?.search) queryParams.set('search', options.search);
  if (options?.status && options.status !== 'all') queryParams.set('status', options.status);
  const queryString = queryParams.toString();
  const endpoint = `/api/messaging/logs${queryString ? `?${queryString}` : ''}`;

  const query = useQuery({
    queryKey: [...MESSAGING_LOGS_QUERY_KEY, options?.channel, options?.category, options?.search, options?.status],
    queryFn: async () => {
      const res = await apiJson<{ logs: Message[] }>(endpoint);
      return res.logs || [];
    },
    staleTime: 15_000,
    enabled: options?.enabled !== false && isAuthenticated,
  });

  return { ...query, logs: query.data ?? [] };
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
    mutationFn: async (logs: Message[]) => {
      return apiJson<{ recorded: number }>('/api/messaging/logs', {
        method: 'POST',
        body: JSON.stringify({ logs }),
      });
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

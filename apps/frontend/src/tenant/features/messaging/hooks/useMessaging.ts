import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type MessageTemplate, type Message, type MessagingMetricsDto, getMessagesDbKey, getMessageTemplatesDbKey } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { getCollection, saveCollection } from '@/lib/db';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useMemo } from 'react';

const MESSAGING_TEMPLATES_QUERY_KEY = ['messaging', 'templates'] as const;
const MESSAGING_LOGS_QUERY_KEY = ['messaging', 'logs'] as const;
const MESSAGING_METRICS_QUERY_KEY = ['messaging', 'metrics'] as const;

export function useMessageTemplates(options?: { enabled?: boolean }) {
  const { user } = useAuth();
  const dbKey = user ? getMessageTemplatesDbKey(user.id) : null;

  const query = useQuery({
    queryKey: MESSAGING_TEMPLATES_QUERY_KEY,
    queryFn: async () => {
      try {
        const res = await apiJson<{ templates: MessageTemplate[] }>('/api/messaging/templates');
        if (dbKey && res.templates) {
          saveCollection(dbKey, res.templates);
        }
        return res.templates || [];
      } catch (err) {
        if (dbKey) {
          return getCollection<MessageTemplate>(dbKey) || [];
        }
        return [];
      }
    },
    staleTime: 30_000,
    enabled: options?.enabled !== false && Boolean(user),
  });

  const templates = useMemo(() => {
    if (query.data !== undefined) return query.data;
    if (dbKey) return getCollection<MessageTemplate>(dbKey) || [];
    return [];
  }, [query.data, dbKey]);

  return { ...query, templates };
}

export function useMessageLogs(options?: {
  enabled?: boolean;
  channel?: string;
  category?: string;
  search?: string;
  status?: string;
}) {
  const { user } = useAuth();
  const dbKey = user ? getMessagesDbKey(user.id) : null;

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
      try {
        const res = await apiJson<{ logs: Message[] }>(endpoint);
        if (dbKey && res.logs && !queryString) {
          saveCollection(dbKey, res.logs);
        }
        return res.logs || [];
      } catch (err) {
        if (dbKey) {
          return getCollection<Message>(dbKey) || [];
        }
        return [];
      }
    },
    staleTime: 15_000,
    enabled: options?.enabled !== false && Boolean(user),
  });

  const logs = useMemo(() => {
    if (query.data !== undefined) return query.data;
    if (dbKey && !queryString) return getCollection<Message>(dbKey) || [];
    return [];
  }, [query.data, dbKey, queryString]);

  return { ...query, logs };
}

export function useMessagingMetrics(options?: { enabled?: boolean }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: MESSAGING_METRICS_QUERY_KEY,
    queryFn: async () => {
      try {
        const res = await apiJson<{ metrics: MessagingMetricsDto }>('/api/messaging/metrics');
        return res.metrics;
      } catch (err) {
        return null;
      }
    },
    staleTime: 15_000,
    enabled: options?.enabled !== false && Boolean(user),
  });
}

export function useMessagingMutations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: MESSAGING_TEMPLATES_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: MESSAGING_LOGS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: MESSAGING_METRICS_QUERY_KEY });
  };

  const saveTemplate = useMutation({
    mutationFn: async (template: Partial<MessageTemplate> & { label: string; body: string }) => {
      return apiJson<{ template: MessageTemplate }>('/api/messaging/templates', {
        method: 'POST',
        body: JSON.stringify(template),
      });
    },
    onSuccess: (res) => {
      if (user && res.template) {
        const dbKey = getMessageTemplatesDbKey(user.id);
        const current = getCollection<MessageTemplate>(dbKey) || [];
        const updated = [...current.filter((t) => t.id !== res.template.id), res.template];
        saveCollection(dbKey, updated);
      }
      invalidate();
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      return apiJson<{ success: boolean }>(`/api/messaging/templates/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: (_, id) => {
      if (user) {
        const dbKey = getMessageTemplatesDbKey(user.id);
        const current = getCollection<MessageTemplate>(dbKey) || [];
        saveCollection(dbKey, current.filter((t) => t.id !== id));
      }
      invalidate();
    },
  });

  const recordDispatches = useMutation({
    mutationFn: async (logs: Message[]) => {
      return apiJson<{ recorded: number }>('/api/messaging/logs', {
        method: 'POST',
        body: JSON.stringify({ logs }),
      });
    },
    onSuccess: (_, logs) => {
      if (user) {
        const dbKey = getMessagesDbKey(user.id);
        const current = getCollection<Message>(dbKey) || [];
        saveCollection(dbKey, [...logs, ...current]);
      }
      invalidate();
    },
  });

  const clearLogs = useMutation({
    mutationFn: async () => {
      return apiJson<{ success: boolean }>('/api/messaging/logs', {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      if (user) {
        saveCollection(getMessagesDbKey(user.id), []);
      }
      invalidate();
    },
  });

  return {
    saveTemplate,
    deleteTemplate,
    recordDispatches,
    clearLogs,
  };
}


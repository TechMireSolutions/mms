/**
 * Phase 7: Contract-driven query/mutation hooks for the Messaging module.
 * Uses tsrClient (@ts-rest/react-query v5) for contract schema enforcement.
 */
import { tsrClient } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import {
  MESSAGING_TEMPLATES_QUERY_KEY,
  MESSAGING_LOGS_QUERY_KEY,
} from '@/tenant/features/messaging/hooks/useMessaging';
import { invalidateMessagingQueries } from '@/tenant/features/messaging/hooks/invalidateMessagingQueries';

export function useMessagingContractListLogs(
  query: { page?: number; limit?: number; search?: string; [key: string]: unknown },
  enabled = true,
) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.messaging.listLogs.useQuery({
    queryKey: [...MESSAGING_LOGS_QUERY_KEY, 'contract', query],
    queryData: { query },
    staleTime: 15_000,
    enabled,
  });
}

export function useMessagingContractListTemplates(
  query: { page?: number; limit?: number; search?: string; [key: string]: unknown } = {},
  enabled = true,
) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.messaging.listTemplates.useQuery({
    queryKey: [...MESSAGING_TEMPLATES_QUERY_KEY, 'contract', query],
    queryData: { query },
    staleTime: 30_000,
    enabled,
  });
}

export function useMessagingContractListRecipients(
  query: { page?: number; limit?: number; search?: string; [key: string]: unknown } = {},
  enabled = true,
) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.messaging.listRecipients.useQuery({
    queryKey: ['messaging', 'recipients', 'contract', query],
    queryData: { query },
    staleTime: 30_000,
    enabled,
  });
}

export function useMessagingContractSaveTemplate() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.messaging.saveTemplate.useMutation({
    onSuccess: () => invalidateMessagingQueries(queryClient),
  });
}

export function useMessagingContractDeleteTemplate() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.messaging.deleteTemplate.useMutation({
    onSuccess: () => invalidateMessagingQueries(queryClient),
  });
}

export function useMessagingContractRecordLogs() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.messaging.recordLogs.useMutation({
    onSuccess: () => invalidateMessagingQueries(queryClient),
  });
}

export function useMessagingContractClearLogs() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.messaging.clearLogs.useMutation({
    onSuccess: () => invalidateMessagingQueries(queryClient),
  });
}

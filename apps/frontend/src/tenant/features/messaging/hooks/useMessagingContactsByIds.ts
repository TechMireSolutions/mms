import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { MessagingResolveResponseDto, StandardMessagingRecipient } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { useAuth } from '@/lib/contexts/AuthContext';

/** Kept stable so contact mutations keep invalidating Reports hydrate. */
export const MESSAGING_CONTACTS_RESOLVE_QUERY_KEY = ['messaging', 'contacts', 'resolve'] as const;
const RESOLVE_BATCH_SIZE = 100;

/**
 * Resolve lean messaging recipients under messaging.read (not contacts.read).
 */
export function useMessagingRecipientsByIds(ids: (string | number | null | undefined)[]) {
  const { isAuthenticated } = useAuth();
  const normalized = useMemo(
    () =>
      [
        ...new Set(
          ids
            .filter((id) => id !== null && id !== undefined && String(id).length > 0)
            .map(String),
        ),
      ].sort(),
    [ids],
  );
  const signature = normalized.join(',');

  return useQuery({
    queryKey: [...MESSAGING_CONTACTS_RESOLVE_QUERY_KEY, signature] as const,
    queryFn: async ({ signal }) => {
      const recipients: StandardMessagingRecipient[] = [];
      for (let index = 0; index < normalized.length; index += RESOLVE_BATCH_SIZE) {
        const chunk = normalized.slice(index, index + RESOLVE_BATCH_SIZE);
        const response = await apiJson<MessagingResolveResponseDto>('/api/messaging/contacts/resolve', {
          method: 'POST',
          body: JSON.stringify({ ids: chunk }),
          signal,
        });
        recipients.push(...(response.recipients ?? []));
      }
      return recipients;
    },
    enabled: isAuthenticated && normalized.length > 0,
    staleTime: 30_000,
  });
}

/** @deprecated Use useMessagingRecipientsByIds */
export const useMessagingContactsByIds = useMessagingRecipientsByIds;

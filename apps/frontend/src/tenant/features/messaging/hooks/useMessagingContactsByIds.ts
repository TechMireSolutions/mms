import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { MessagingResolveResponseDto, StandardMessagingRecipient } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { tsrClient } from '@/lib/api';

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
    queryFn: async () => {
      const recipients: StandardMessagingRecipient[] = [];
      for (let index = 0; index < normalized.length; index += RESOLVE_BATCH_SIZE) {
        const chunk = normalized.slice(index, index + RESOLVE_BATCH_SIZE);
        // @ts-expect-error - TS union discrimination limit with ts-rest
        const response = await tsrClient.messaging.resolveContacts.query({
          body: { ids: chunk },
        });
        recipients.push(...((response.body as MessagingResolveResponseDto).recipients ?? []));
      }
      return recipients;
    },
    enabled: isAuthenticated && normalized.length > 0,
    staleTime: 30_000,
  });
}


import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Contact } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { useAuth } from '@/lib/contexts/AuthContext';

export const MESSAGING_CONTACTS_RESOLVE_QUERY_KEY = ['messaging', 'contacts', 'resolve'] as const;
const RESOLVE_BATCH_SIZE = 100;

/**
 * Resolve contact labels for messaging under messaging.read (not contacts.read).
 */
export function useMessagingContactsByIds(ids: (string | number | null | undefined)[]) {
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
      const contacts: Contact[] = [];
      for (let index = 0; index < normalized.length; index += RESOLVE_BATCH_SIZE) {
        const chunk = normalized.slice(index, index + RESOLVE_BATCH_SIZE);
        const response = await apiJson<{ contacts: Contact[] }>('/api/messaging/contacts/resolve', {
          method: 'POST',
          body: JSON.stringify({ ids: chunk }),
        });
        contacts.push(...(response.contacts ?? []));
      }
      return contacts;
    },
    enabled: isAuthenticated && normalized.length > 0,
    staleTime: 30_000,
  });
}

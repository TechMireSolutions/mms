import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Contact } from '@mms/shared';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { saveCollection } from '@/lib/db';
import { useLiveCollection } from '@/hooks/useLiveCollection';

export const CONTACTS_QUERY_KEY = ['contacts', 'list'] as const;
export const CONTACT_COUNT_QUERY_KEY = ['contacts', 'count'] as const;

async function fetchContacts(): Promise<Contact[]> {
  const body = await apiJson<{ contacts: Contact[] }>('/api/contacts');
  saveCollection('contacts', body.contacts);
  return body.contacts;
}

export function useContacts() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: CONTACTS_QUERY_KEY,
    queryFn: fetchContacts,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useContactMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: CONTACT_COUNT_QUERY_KEY });
  };

  const upsertContact = useMutation({
    mutationFn: async (contact: Contact) =>
      apiJson<{ contact: Contact }>('/api/contacts', {
        method: 'POST',
        body: JSON.stringify(contact),
      }),
    onSuccess: invalidate,
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, contact }: { id: string; contact: Contact }) =>
      apiJson<{ contact: Contact }>(`/api/contacts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(contact),
      }),
    onSuccess: invalidate,
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => apiFetch(`/api/contacts/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  return { upsertContact, updateContact, deleteContact };
}

/** Query-first contacts; falls back to localStorage cache. */
export function useContactsCollection(): Contact[] {
  const { data: fromQuery = [] } = useContacts();
  const fromLocal = useLiveCollection<Contact>('contacts');
  if (fromQuery.length > 0) {
    return fromQuery;
  }
  return fromLocal;
}

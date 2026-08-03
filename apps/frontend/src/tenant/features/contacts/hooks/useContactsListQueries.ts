import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Contact, ContactsListPageResult } from "@mms/shared";
import { useAuth } from "@/lib/contexts/AuthContext";
import { apiJson } from "@/lib/apiClient";
import {
  CONTACTS_API,
  CONTACTS_QUERY_KEY,
  contactDetailQueryKey,
} from "@/tenant/features/contacts/hooks/contactsQueryKeys";
import {
  buildContactsPageUrl,
  contactsListQueryKeyParams,
  contactsPaginatedQueryKey,
  fetchContactById,
  sameContactsListFilters,
  type ContactsPaginatedParams,
} from "@/tenant/features/contacts/hooks/contactsListQueryBuilders";

export type { ContactsPaginatedParams } from "@/tenant/features/contacts/hooks/contactsListQueryBuilders";
export {
  contactsPaginatedQueryKey,
  fetchContactsPageForQuery,
  fetchContactById,
} from "@/tenant/features/contacts/hooks/contactsListQueryBuilders";

export function useContactsPaginated(params: ContactsPaginatedParams) {
  const { isAuthenticated } = useAuth();
  const enabled = params.enabled ?? true;
  const keyParams = contactsListQueryKeyParams(params);
  return useQuery({
    queryKey: contactsPaginatedQueryKey(params),
    queryFn: async ({ signal }) => apiJson<ContactsListPageResult>(buildContactsPageUrl(params), { signal }),
    enabled: isAuthenticated && enabled,
    staleTime: 15_000,
    placeholderData: (previousData, previousQuery) => {
      const previousParams = previousQuery?.queryKey.at(-1) as
        | ReturnType<typeof contactsListQueryKeyParams>
        | undefined;
      return sameContactsListFilters(previousParams, keyParams) ? previousData : undefined;
    },
  });
}

export function useContactById(contactId: string | undefined, enabled = true) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: contactDetailQueryKey(contactId ?? ""),
    queryFn: ({ signal }) => fetchContactById(contactId!, signal),
    enabled: isAuthenticated && enabled && Boolean(contactId),
    staleTime: 10_000,
  });
}

/** Batch-resolve contact labels by id (pickers & cross-module links). */
export function useContactsByIds(ids: (string | number | null | undefined)[]) {
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
  const signature = normalized.join(",");

  return useQuery({
    queryKey: [...CONTACTS_QUERY_KEY, "resolve", signature] as const,
    queryFn: async ({ signal }) => {
      const batchSize = 100;
      const contacts: Contact[] = [];
      for (let index = 0; index < normalized.length; index += batchSize) {
        const chunk = normalized.slice(index, index + batchSize);
        const contactsResponse = await apiJson<{ contacts: Contact[] }>(`${CONTACTS_API}/resolve`, {
          method: "POST",
          body: JSON.stringify({ ids: chunk }),
          signal,
        });
        contacts.push(...(contactsResponse.contacts ?? []));
      }
      return contacts;
    },
    enabled: isAuthenticated && normalized.length > 0,
    staleTime: 30_000,
  });
}

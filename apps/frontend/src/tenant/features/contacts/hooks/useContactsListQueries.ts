import { useQuery } from "@tanstack/react-query";
import type { Contact, ContactsListPageResult } from "@mms/shared";
import { useAuth } from "@/lib/contexts/AuthContext";
import { createModulePaginatedListQuery } from "@/lib/query/createModulePaginatedListQuery";
import { createPersonModuleResolveQueries } from "@/lib/query/createPersonModuleResolveQueries";
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
  fetchContactById,
} from "@/tenant/features/contacts/hooks/contactsListQueryBuilders";

const useContactsPaginatedList = createModulePaginatedListQuery<
  ContactsListPageResult,
  ContactsPaginatedParams,
  ReturnType<typeof contactsListQueryKeyParams>
>({
  queryKey: contactsPaginatedQueryKey,
  keyParams: contactsListQueryKeyParams,
  sameFilters: sameContactsListFilters,
  buildUrl: buildContactsPageUrl,
  staleTime: 15_000,
});

export function useContactsPaginated(params: ContactsPaginatedParams) {
  return useContactsPaginatedList(params);
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

const contactResolveQueries = createPersonModuleResolveQueries<Contact, Contact>({
  moduleQueryKey: CONTACTS_QUERY_KEY,
  apiBase: CONTACTS_API,
  responseKey: "contacts",
  toHydrated: (rows) => rows,
  chunkSize: 100,
});

/** Batch-resolve contact labels by id (pickers & cross-module links). */
export const useContactsByIds = contactResolveQueries.useByIds;

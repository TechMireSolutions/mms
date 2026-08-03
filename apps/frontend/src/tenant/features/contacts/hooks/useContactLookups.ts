import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CONTACTS_MODULE_MANIFEST,
  type ContactLookupKind,
  type ContactLookupCountryCode,
  type ContactLookupsMap,
} from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { useAuth } from '@/lib/contexts/AuthContext';
import { CONTACTS_API } from '@/tenant/features/contacts/hooks/contactsQueryKeys';
import { getContactConfigCollectionDefaults } from '@/lib/contacts/contactConfigSeeds';

export const CONTACTS_LOOKUPS_QUERY_KEY = [CONTACTS_MODULE_MANIFEST.collectionKey, 'lookups'] as const;

const defaults = (): ContactLookupsMap => {
  const seeded = getContactConfigCollectionDefaults();
  return {
    genders: seeded.genders,
    socialPlatforms: seeded.socialPlatforms,
    relationships: seeded.relationships,
    phoneLabels: seeded.phoneLabels,
    emailLabels: seeded.emailLabels,
    addressLabels: seeded.addressLabels,
    countryCodes: seeded.countryCodes,
  };
};

export async function fetchContactLookups(signal?: AbortSignal): Promise<ContactLookupsMap> {
  const response = await apiJson<{ lookups: ContactLookupsMap }>(`${CONTACTS_API}/lookups`, {
    signal,
  });
  return response.lookups ?? defaults();
}

export async function putContactLookupKind(
  kind: ContactLookupKind,
  items: string[] | ContactLookupCountryCode[],
): Promise<string[] | ContactLookupCountryCode[]> {
  const response = await apiJson<{ items: string[] | ContactLookupCountryCode[] }>(
    `${CONTACTS_API}/lookups/${kind}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    },
  );
  return response.items;
}

export function useContactLookupsQuery() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: CONTACTS_LOOKUPS_QUERY_KEY,
    queryFn: ({ signal }) => fetchContactLookups(signal),
    enabled: isAuthenticated,
    placeholderData: defaults(),
  });
}

export function useContactLookupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      kind,
      items,
    }: {
      kind: ContactLookupKind;
      items: string[] | ContactLookupCountryCode[];
    }) => putContactLookupKind(kind, items),
    onSuccess: (items, variables) => {
      queryClient.setQueryData<ContactLookupsMap>(CONTACTS_LOOKUPS_QUERY_KEY, (current) => {
        const base = current ?? defaults();
        return { ...base, [variables.kind]: items } as ContactLookupsMap;
      });
      void queryClient.invalidateQueries({ queryKey: CONTACTS_LOOKUPS_QUERY_KEY });
    },
  });
}

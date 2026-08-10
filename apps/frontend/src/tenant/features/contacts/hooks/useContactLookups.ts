import {
  CONTACTS_MODULE_MANIFEST,
  type ContactLookupKind,
  type ContactLookupCountryCode,
  type ContactLookupsMap,
} from "@mms/shared";
import { apiJson } from "@/lib/apiClient";
import { createModuleLookupsHooks } from "@/lib/query/createModuleLookupsHooks";
import { getContactConfigCollectionDefaults } from "@/lib/contacts/contactConfigSeeds";
import { CONTACTS_API } from "@/tenant/features/contacts/hooks/contactsQueryKeys";

export const CONTACTS_LOOKUPS_QUERY_KEY = [CONTACTS_MODULE_MANIFEST.collectionKey, "lookups"] as const;

type ContactLookupItems = string[] | ContactLookupCountryCode[];

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

async function putContactLookupKind(
  kind: ContactLookupKind,
  items: ContactLookupItems,
): Promise<ContactLookupItems> {
  const response = await apiJson<{ items: ContactLookupItems }>(`${CONTACTS_API}/lookups/${kind}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  return response.items;
}

const lookupsHooks = createModuleLookupsHooks<
  ContactLookupsMap,
  ContactLookupKind,
  ContactLookupItems
>({
  queryKey: CONTACTS_LOOKUPS_QUERY_KEY,
  fetchLookups: fetchContactLookups,
  putLookupKind: putContactLookupKind,
  defaults,
});

export const useContactLookupsQuery = lookupsHooks.useLookupsQuery;
export const useContactLookupMutation = lookupsHooks.useLookupMutation;

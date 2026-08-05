import { useCallback, useMemo, type Dispatch, type SetStateAction } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CONTACT_LOOKUP_FIELD_TARGETS,
  type ContactLookupStringKind,
  type FieldConfig,
} from "@mms/shared";
import { saveFieldConfigAsync } from "@/lib/contactFieldsStore";
import { syncOptionsInConfig } from "@/lib/contacts/preferencesStorage";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  CONTACTS_LOOKUPS_QUERY_KEY,
  useContactLookupMutation,
  useContactLookupsQuery,
} from "@/tenant/features/contacts/hooks/useContactLookups";

type CountryCodeEntry = { country: string; code: string };

/**
 * Contacts Setup option lists via `/api/contacts/lookups` (typed contact_lookups).
 * Keeps field-config option sync on string-list updates.
 */
export function useContactConfigCollections({
  setFieldConfigState,
}: {
  contactConfigDefaults?: unknown;
  setFieldConfigState: Dispatch<SetStateAction<FieldConfig>>;
}) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const lookupsQuery = useContactLookupsQuery();
  const lookupMutation = useContactLookupMutation();

  const genders = lookupsQuery.data?.genders ?? [];
  const socialPlatforms = lookupsQuery.data?.socialPlatforms ?? [];
  const relationships = lookupsQuery.data?.relationships ?? [];
  const phoneLabels = lookupsQuery.data?.phoneLabels ?? [];
  const emailLabels = lookupsQuery.data?.emailLabels ?? [];
  const addressLabels = lookupsQuery.data?.addressLabels ?? [];
  const countryCodes = (lookupsQuery.data?.countryCodes ?? []) as CountryCodeEntry[];

  // Prefer invalidate over query.refetch() — refetch() ignores `enabled: false` and
  // can storm /api/contacts/lookups + /api/auth/refresh on the login screen.
  const reloadCollections = useCallback(() => {
    if (!isAuthenticated) return;
    void queryClient.invalidateQueries({ queryKey: CONTACTS_LOOKUPS_QUERY_KEY });
  }, [isAuthenticated, queryClient]);

  const syncFieldOptions = useCallback(
    async (tabId: string, fieldId: string, options: string[]) => {
      let updatedConfig: FieldConfig | null = null;
      setFieldConfigState((currentConfig) => {
        updatedConfig = syncOptionsInConfig(currentConfig, tabId, fieldId, options);
        return updatedConfig;
      });
      if (updatedConfig) {
        await saveFieldConfigAsync(updatedConfig);
      }
    },
    [setFieldConfigState],
  );

  const persistStringKind = useCallback(
    async (kind: ContactLookupStringKind, options: string[]) => {
      const { tabId, fieldId } = CONTACT_LOOKUP_FIELD_TARGETS[kind];
      await lookupMutation.mutateAsync({ kind, items: options });
      await syncFieldOptions(tabId, fieldId, options);
    },
    [lookupMutation, syncFieldOptions],
  );

  const updateGenders = useCallback(
    (options: string[]) => persistStringKind("genders", options),
    [persistStringKind],
  );
  const updateSocialPlatforms = useCallback(
    (options: string[]) => persistStringKind("socialPlatforms", options),
    [persistStringKind],
  );
  const updateRelationships = useCallback(
    (options: string[]) => persistStringKind("relationships", options),
    [persistStringKind],
  );
  const updatePhoneLabels = useCallback(
    (options: string[]) => persistStringKind("phoneLabels", options),
    [persistStringKind],
  );
  const updateEmailLabels = useCallback(
    (options: string[]) => persistStringKind("emailLabels", options),
    [persistStringKind],
  );
  const updateAddressLabels = useCallback(
    (options: string[]) => persistStringKind("addressLabels", options),
    [persistStringKind],
  );
  const updateCountryCodes = useCallback(
    async (countryCodeOptions: CountryCodeEntry[]) => {
      await lookupMutation.mutateAsync({ kind: "countryCodes", items: countryCodeOptions });
    },
    [lookupMutation],
  );

  const countryCodesMap = useMemo(() => {
    const countryCodeByCountry: Record<string, string> = {};
    countryCodes.forEach(({ country, code }) => {
      countryCodeByCountry[country] = code;
    });
    return countryCodeByCountry;
  }, [countryCodes]);

  return {
    genders,
    socialPlatforms,
    relationships,
    phoneLabels,
    emailLabels,
    addressLabels,
    countryCodes,
    countryCodesMap,
    reloadCollections,
    updateGenders,
    updateSocialPlatforms,
    updateRelationships,
    updatePhoneLabels,
    updateEmailLabels,
    updateAddressLabels,
    updateCountryCodes,
    lookupsReady: lookupsQuery.isSuccess || lookupsQuery.isError,
  };
}

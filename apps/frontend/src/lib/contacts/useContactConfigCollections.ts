import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CONTACT_LOOKUP_FIELD_TARGETS,
  DEFAULT_ADDRESS_LABELS,
  DEFAULT_EDUCATION_DEGREE_LABELS,
  DEFAULT_EMAIL_LABELS,
  DEFAULT_EMPLOYMENT_TYPE_LABELS,
  DEFAULT_PHONE_LABELS,
  DEFAULT_SKILL_CATEGORY_LABELS,
  DEFAULT_SKILL_PROFICIENCY_LABELS,
  GENDERS,
  RELATIONSHIPS,
  SOCIAL_PLATFORMS,
  type ContactLookupStringKind,
  type FieldConfig,
} from "@mms/shared";
import { saveFieldConfigAsync } from "@/lib/contactFieldsStore";
import { syncOptionsInConfig } from "@/lib/contacts/preferencesStorage";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  CONTACTS_FIELD_CONFIG_QUERY_KEY,
  CONTACTS_LOOKUPS_QUERY_KEY,
  useContactLookupMutation,
  useContactLookupsQuery,
} from "@/tenant/hooks/collections/contacts";

type CountryCodeEntry = { country: string; code: string };

/**
 * Contacts Setup option lists via `/api/contacts/lookups` (typed contact_lookups).
 * Keeps field-config option sync on string-list updates.
 */
export function useContactConfigCollections({
  settings,
  updateSettings,
}: {
  settings: FieldConfig;
  updateSettings: (config: FieldConfig) => void;
}) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const lookupsQuery = useContactLookupsQuery();
  const lookupMutation = useContactLookupMutation();

  const genders = lookupsQuery.data?.genders ?? GENDERS;
  const socialPlatforms = lookupsQuery.data?.socialPlatforms ?? SOCIAL_PLATFORMS;
  const relationships = lookupsQuery.data?.relationships ?? RELATIONSHIPS;
  const phoneLabels = lookupsQuery.data?.phoneLabels ?? DEFAULT_PHONE_LABELS;
  const emailLabels = lookupsQuery.data?.emailLabels ?? DEFAULT_EMAIL_LABELS;
  const addressLabels = lookupsQuery.data?.addressLabels ?? DEFAULT_ADDRESS_LABELS;
  const countryCodes = (lookupsQuery.data?.countryCodes ?? []) as CountryCodeEntry[];
  const educationDegrees = lookupsQuery.data?.educationDegrees ?? DEFAULT_EDUCATION_DEGREE_LABELS;
  const employmentTypes = lookupsQuery.data?.employmentTypes ?? DEFAULT_EMPLOYMENT_TYPE_LABELS;
  const skillCategories = lookupsQuery.data?.skillCategories ?? DEFAULT_SKILL_CATEGORY_LABELS;
  const skillProficiencies = lookupsQuery.data?.skillProficiencies ?? DEFAULT_SKILL_PROFICIENCY_LABELS;

  // Prefer invalidate over query.refetch() — refetch() ignores `enabled: false` and
  // can storm /api/contacts/lookups + /api/auth/refresh on the login screen.
  const reloadCollections = useCallback(() => {
    if (!isAuthenticated) return;
    void queryClient.invalidateQueries({ queryKey: CONTACTS_LOOKUPS_QUERY_KEY });
  }, [isAuthenticated, queryClient]);

  const syncFieldOptions = useCallback(
    async (tabId: string, fieldId: string, options: string[]) => {
      const current =
        queryClient.getQueryData<FieldConfig>(CONTACTS_FIELD_CONFIG_QUERY_KEY) ?? settings;
      const updated = syncOptionsInConfig(current, tabId, fieldId, options);
      updateSettings(updated);
      await saveFieldConfigAsync(updated);
    },
    [queryClient, settings, updateSettings],
  );

  const persistStringKind = useCallback(
    async (kind: ContactLookupStringKind, options: string[]) => {
      const { tabId, fieldId } = CONTACT_LOOKUP_FIELD_TARGETS[kind];
      const saved = await lookupMutation.mutateAsync({ kind, items: options });
      const nextOptions = Array.isArray(saved)
        ? saved.filter((item): item is string => typeof item === "string")
        : options;
      await syncFieldOptions(tabId, fieldId, nextOptions);
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
  const updateEducationDegrees = useCallback(
    (options: string[]) => persistStringKind("educationDegrees", options),
    [persistStringKind],
  );
  const updateEmploymentTypes = useCallback(
    (options: string[]) => persistStringKind("employmentTypes", options),
    [persistStringKind],
  );
  const updateSkillCategories = useCallback(
    (options: string[]) => persistStringKind("skillCategories", options),
    [persistStringKind],
  );
  const updateSkillProficiencies = useCallback(
    (options: string[]) => persistStringKind("skillProficiencies", options),
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
    educationDegrees,
    employmentTypes,
    skillCategories,
    skillProficiencies,
    reloadCollections,
    updateGenders,
    updateSocialPlatforms,
    updateRelationships,
    updatePhoneLabels,
    updateEmailLabels,
    updateAddressLabels,
    updateEducationDegrees,
    updateEmploymentTypes,
    updateSkillCategories,
    updateSkillProficiencies,
    updateCountryCodes,
    lookupsReady: lookupsQuery.isSuccess || lookupsQuery.isError,
    lookupsLoading: lookupsQuery.isLoading,
    lookupsError: (lookupsQuery.error as Error | null) ?? null,
  };
}

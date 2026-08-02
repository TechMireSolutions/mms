import { useMemo } from "react";
import {
  deriveRelationshipOptionsFromPairs,
  mergeRelationshipOptionLabels,
  resolveRelationshipPairs,
  type ColumnRegistryEntry,
  type ContactPreferences,
  type FieldConfig,
  type FieldDefinition,
  type RelationshipPair,
} from "@mms/shared";
import type { ContactConfigContextType } from "@/lib/contacts/contactConfigContextTypes";
import { getFallbackCountryCode } from "@/lib/contacts/contactI18n";

export function useContactConfigProviderValue({
  fieldConfig,
  prefs,
  updateConfig,
  updateConfigAsync,
  updatePrefs,
  updatePrefsAsync,
  enabledTabIds,
  requiredTabIds,
  fields,
  isTabFieldEnabled,
  isTabFieldRequired,
  genders,
  socialPlatforms,
  relationships,
  phoneLabels,
  emailLabels,
  addressLabels,
  countryCodes,
  countryCodesMap,
  columnRegistry,
  availableColumns,
  visibleColumns,
  updateGenders,
  updateSocialPlatforms,
  updateRelationships,
  updateRelationshipPairs,
  updatePhoneLabels,
  updateEmailLabels,
  updateAddressLabels,
  updateCountryCodes,
  updateColumnRegistry,
  updateUserColumnLayout,
  getColumnWidth,
  setColumnWidth,
  systemSortOptions,
}: {
  fieldConfig: FieldConfig;
  prefs: ContactPreferences;
  updateConfig: (nextConfig: FieldConfig) => void;
  updateConfigAsync: (nextConfig: FieldConfig) => Promise<void>;
  updatePrefs: (newPrefs: Partial<ContactPreferences>) => void;
  updatePrefsAsync: (newPrefs: Partial<ContactPreferences>) => Promise<void>;
  enabledTabIds: Set<string>;
  requiredTabIds: Set<string>;
  fields: Record<string, FieldDefinition[]>;
  isTabFieldEnabled: (tabId: string, fieldId: string) => boolean;
  isTabFieldRequired: (tabId: string, fieldId: string) => boolean;
  genders: string[];
  socialPlatforms: string[];
  relationships: string[];
  phoneLabels: string[];
  emailLabels: string[];
  addressLabels: string[];
  countryCodes: Array<{ country: string; code: string }>;
  countryCodesMap: Record<string, string>;
  columnRegistry: ColumnRegistryEntry[];
  availableColumns: Array<{ id: string; label: string; sortField?: string; width?: number }>;
  visibleColumns: Array<{ id: string; label: string; sortField?: string; width?: number }>;
  updateGenders: (genderOptions: string[]) => void;
  updateSocialPlatforms: (socialPlatformOptions: string[]) => void;
  updateRelationships: (relationshipOptions: string[]) => void;
  updateRelationshipPairs: (pairs: RelationshipPair[]) => void;
  updatePhoneLabels: (phoneLabelOptions: string[]) => void;
  updateEmailLabels: (emailLabelOptions: string[]) => void;
  updateAddressLabels: (addressLabelOptions: string[]) => void;
  updateCountryCodes: (countryCodeOptions: Array<{ country: string; code: string }>) => void;
  updateColumnRegistry: (columnRegistry: ColumnRegistryEntry[]) => void;
  updateUserColumnLayout: (columnRegistry: ColumnRegistryEntry[]) => void;
  getColumnWidth: (key: string) => number | undefined;
  setColumnWidth: (key: string, width: number) => void;
  systemSortOptions: Array<{ field: string; label: string }>;
}): ContactConfigContextType {
  const defaultPhoneCountryCode = useMemo(
    () => getFallbackCountryCode(prefs, countryCodesMap, countryCodes),
    [countryCodes, countryCodesMap, prefs],
  );

  const resolvedRelationshipPairs = resolveRelationshipPairs(prefs.relationshipPairs);
  const resolvedRelationships = useMemo(
    () =>
      mergeRelationshipOptionLabels(
        deriveRelationshipOptionsFromPairs(resolvedRelationshipPairs),
        relationships,
      ),
    [relationships, resolvedRelationshipPairs],
  );

  return useMemo(
    () => ({
      fieldConfig,
      prefs,
      updateConfig,
      updateConfigAsync,
      updatePrefs,
      updatePrefsAsync,
      enabledTabIds,
      requiredTabIds,
      fields,
      isTabFieldEnabled,
      isTabFieldRequired,
      genders,
      socialPlatforms,
      relationships: resolvedRelationships,
      relationshipPairs: resolvedRelationshipPairs,
      phoneLabels,
      emailLabels,
      addressLabels,
      countryCodes,
      countryCodesMap,
      defaultPhoneCountryCode,
      columnRegistry,
      availableColumns,
      visibleColumns,
      updateGenders,
      updateSocialPlatforms,
      updateRelationships,
      updateRelationshipPairs,
      updatePhoneLabels,
      updateEmailLabels,
      updateAddressLabels,
      updateCountryCodes,
      updateColumnRegistry,
      updateUserColumnLayout,
      getColumnWidth,
      setColumnWidth,
      systemSortOptions,
    }),
    [
      fieldConfig,
      prefs,
      updateConfig,
      updateConfigAsync,
      updatePrefs,
      updatePrefsAsync,
      enabledTabIds,
      requiredTabIds,
      fields,
      isTabFieldEnabled,
      isTabFieldRequired,
      genders,
      socialPlatforms,
      resolvedRelationships,
      resolvedRelationshipPairs,
      phoneLabels,
      emailLabels,
      addressLabels,
      countryCodes,
      countryCodesMap,
      defaultPhoneCountryCode,
      columnRegistry,
      availableColumns,
      visibleColumns,
      updateGenders,
      updateSocialPlatforms,
      updateRelationships,
      updateRelationshipPairs,
      updatePhoneLabels,
      updateEmailLabels,
      updateAddressLabels,
      updateCountryCodes,
      updateColumnRegistry,
      updateUserColumnLayout,
      getColumnWidth,
      setColumnWidth,
      systemSortOptions,
    ],
  );
}

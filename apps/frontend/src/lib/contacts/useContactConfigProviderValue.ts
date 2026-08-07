import { useMemo } from "react";
import {
  applyRelationshipOptionOrder,
  deriveRelationshipOptionsFromPairs,
  resolveRelationshipPairs,
  type ColumnRegistryEntry,
  type ContactPreferences,
  type FieldConfig,
  type FieldDefinition,
} from "@mms/shared";
import type { ContactConfigContextType } from "@/lib/contacts/contactConfigContextTypes";
import { getFallbackCountryCode } from "@/lib/contacts/contactI18n";

/**
 * Builds ContactConfig context value.
 * Relationship-type options are derived from the fixed system pair catalog
 * (`resolveRelationshipPairs` → Parent/Child, Husband/Wife, Guardian/Dependent).
 * Lookups kind `relationships` remains a write mirror only.
 */
export function useContactConfigProviderValue({
  fieldConfig,
  formTabsReady,
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
  updatePhoneLabels,
  updateEmailLabels,
  updateAddressLabels,
  updateCountryCodes,
  updateColumnRegistry,
  updateUserColumnLayout,
  isColumnVisible,
  getColumnWidth,
  setColumnWidth,
  systemSortOptions,
}: {
  fieldConfig: FieldConfig;
  formTabsReady: boolean;
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
  updatePhoneLabels: (phoneLabelOptions: string[]) => void;
  updateEmailLabels: (emailLabelOptions: string[]) => void;
  updateAddressLabels: (addressLabelOptions: string[]) => void;
  updateCountryCodes: (countryCodeOptions: Array<{ country: string; code: string }>) => void;
  updateColumnRegistry: (columnRegistry: ColumnRegistryEntry[]) => void;
  updateUserColumnLayout: (columnRegistry: ColumnRegistryEntry[]) => void;
  isColumnVisible: (key: string) => boolean;
  getColumnWidth: (key: string) => number | undefined;
  setColumnWidth: (key: string, width: number) => void;
  systemSortOptions: Array<{ field: string; label: string }>;
}): ContactConfigContextType {
  const defaultPhoneCountryCode = useMemo(
    () => getFallbackCountryCode(prefs, countryCodesMap, countryCodes),
    [countryCodes, countryCodesMap, prefs],
  );

  /** Form Relationship-type dropdown — fixed system catalog (Parent/Child, …). */
  const resolvedRelationships = useMemo(() => {
    const derived = deriveRelationshipOptionsFromPairs(
      resolveRelationshipPairs(prefs.relationshipPairs),
    );
    return applyRelationshipOptionOrder(derived, prefs.relationshipOptionOrder);
  }, [prefs.relationshipPairs, prefs.relationshipOptionOrder]);

  return useMemo(
    () => ({
      fieldConfig,
      formTabsReady,
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
      updatePhoneLabels,
      updateEmailLabels,
      updateAddressLabels,
      updateCountryCodes,
      updateColumnRegistry,
      updateUserColumnLayout,
      isColumnVisible,
      getColumnWidth,
      setColumnWidth,
      systemSortOptions,
    }),
    [
      fieldConfig,
      formTabsReady,
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
      updatePhoneLabels,
      updateEmailLabels,
      updateAddressLabels,
      updateCountryCodes,
      updateColumnRegistry,
      updateUserColumnLayout,
      isColumnVisible,
      getColumnWidth,
      setColumnWidth,
      systemSortOptions,
    ],
  );
}

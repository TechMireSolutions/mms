import React from "react";
import {
  applyRelationshipOptionOrder,
  deriveRelationshipOptionsFromPairs,
  resolveRelationshipPairs,
  DEFAULT_COLUMN_REGISTRY,
  DEFAULT_FORM_TABS,
  normalizeContactPreferences,
  INITIAL_FIELD_SEED,
  syncContactColumnRegistryWithFields,
  resolveContactEnabledTabIds,
  CONTACTS_MODULE_MANIFEST,
  type ColumnRegistryEntry,
  type FieldDefinition,
} from "@mms/shared";
import type { ContactConfigContextType } from "@/lib/contacts/contactConfigContextTypes";
import type { ContactConfigExtras } from "@/lib/contacts/useContactConfigTypes";
import { getFallbackCountryCode } from "@/lib/contacts/contactI18n";
import { useUiPreference } from "@/lib/useUiStateStore";

type ContactConfigProviderInput = Partial<ContactConfigExtras> & {
  enabledTabs?: string[];
  requiredTabs?: string[];
};

/**
 * Builds ContactConfig context value.
 * Relationship-type options are derived from the fixed system pair catalog
 * (`resolveRelationshipPairs` → Parent/Child, Husband/Wife, Guardian/Dependent).
 * Lookups kind `relationships` remains a write mirror only.
 */
export function useContactConfigProviderValue(
  config: ContactConfigProviderInput,
): ContactConfigContextType {
  const {
    prefs: rawPrefs,
    updateConfig = () => {},
    updateConfigAsync = async () => {},
    updatePrefs = () => {},
    updatePrefsAsync = async () => {},
    genders = [],
    socialPlatforms = [],
    phoneLabels = [],
    emailLabels = [],
    addressLabels = [],
    countryCodes = [],
    countryCodesMap = {},
    educationDegrees = [],
    employmentTypes = [],
    skillCategories = [],
    skillProficiencies = [],
    tags = [],
    lookupsLoading = false,
    lookupsError = null,
    updateGenders = () => {},
    updateSocialPlatforms = () => {},
    updateRelationships = () => {},
    updatePhoneLabels = () => {},
    updateEmailLabels = () => {},
    updateAddressLabels = () => {},
    updateEducationDegrees = () => {},
    updateEmploymentTypes = () => {},
    updateSkillCategories = () => {},
    updateSkillProficiencies = () => {},
    updateTags = () => {},
    updateCountryCodes = () => {},
    systemSortOptions = [],
    fields = {},
    formTabs = [],
    enabledTabs = [],
    requiredTabs = ["basic"],
  } = config || {};

  const resolvedFields = (() => {
    if (!fields || Object.keys(fields).length === 0) {
      return INITIAL_FIELD_SEED;
    }
    return fields;
  })();

  const prefs = (() => normalizeContactPreferences(rawPrefs))();

  const prefKey = `${CONTACTS_MODULE_MANIFEST.moduleId}.table.columns`;
  const [userOverlayRaw, setUserOverlayRaw] = useUiPreference<ColumnRegistryEntry[] | null>(prefKey, null);

  const columnRegistry = (() => {
    if (userOverlayRaw && userOverlayRaw.length > 0) {
      return userOverlayRaw;
    }
    return config?.columnRegistry?.length ? config.columnRegistry : DEFAULT_COLUMN_REGISTRY;
  })();

  const syncedColumnRegistry = (() => {
    return syncContactColumnRegistryWithFields(
      columnRegistry,
      resolvedFields,
      enabledTabs.length > 0 ? enabledTabs : DEFAULT_FORM_TABS.filter(t => t.enabled).map(t => t.key)
    );
  })();

  const updateUserColumnLayout = React.useCallback((layout: ColumnRegistryEntry[]) => {
    setUserOverlayRaw(layout);
  }, [setUserOverlayRaw]);



  const getColumnWidth = React.useCallback((key: string) => {
    return syncedColumnRegistry.find((c) => c.key === key)?.width;
  }, [syncedColumnRegistry]);

  const setColumnWidth = React.useCallback((key: string, width: number) => {
    setUserOverlayRaw(
      columnRegistry.map((c: ColumnRegistryEntry) => (c.key === key ? { ...c, width } : c)),
    );
  }, [columnRegistry, setUserOverlayRaw]);

  const isColumnVisible = React.useCallback((key: string) => {
    return syncedColumnRegistry.find((c) => c.key === key)?.enabled ?? false;
  }, [syncedColumnRegistry]);

  const availableColumns = (() => {
    return syncedColumnRegistry.map((entry) => ({
      id: entry.key,
      label: entry.label,
      sortField: entry.sortField,
      width: entry.width,
    }));
  })();

  const visibleColumns = (() => {
    return syncedColumnRegistry
      .filter((entry) => entry.enabled)
      .map((entry) => ({
        id: entry.key,
        label: entry.label,
        sortField: entry.sortField,
        width: entry.width,
      }));
  })();

  const defaultPhoneCountryCode = (() => getFallbackCountryCode(prefs, countryCodesMap, countryCodes))();

  /** Form Relationship-type dropdown — fixed system catalog (Parent/Child, …). */
  const resolvedRelationships = (() => {
    const derived = deriveRelationshipOptionsFromPairs(
      resolveRelationshipPairs(prefs?.relationshipPairs),
    );
    return applyRelationshipOptionOrder(derived, prefs?.relationshipOptionOrder);
  })();

  return (() => ({
      formTabsReady: true,
      enabledTabIds: resolveContactEnabledTabIds({ formTabs, enabledTabs }, "admin"),
      requiredTabIds: new Set(requiredTabs),
      fields: resolvedFields,
      formTabs,
      isTabFieldEnabled: (tabId: string, fieldId: string) => {
        const tabFields = resolvedFields?.[tabId];
        if (!tabFields) return true;
        const field = tabFields.find((f: FieldDefinition) => f.key === fieldId);
        return field?.enabled ?? true;
      },
      isTabFieldRequired: (tabId: string, fieldId: string) => {
        const tabFields = resolvedFields?.[tabId];
        if (!tabFields) return false;
        const field = tabFields.find((f: FieldDefinition) => f.key === fieldId);
        return field?.required ?? false;
      },
      prefs,
      updateConfig,
      updateConfigAsync,
      updatePrefs,
      updatePrefsAsync,
      genders,
      socialPlatforms,
      relationships: resolvedRelationships,
      phoneLabels,
      emailLabels,
      addressLabels,
      countryCodes,
      countryCodesMap,
      educationDegrees,
      employmentTypes,
      skillCategories,
      skillProficiencies,
      tags,
      lookupsLoading,
      lookupsError,
      defaultPhoneCountryCode,
      columnRegistry: syncedColumnRegistry,
      availableColumns,
      visibleColumns,
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
      updateTags,
      updateCountryCodes,
      updateUserColumnLayout,
      isColumnVisible,
      getColumnWidth,
      setColumnWidth,
      systemSortOptions,
    }))();
}

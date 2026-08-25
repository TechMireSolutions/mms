import React from "react";
import {
  applyRelationshipOptionOrder,
  deriveRelationshipOptionsFromPairs,
  resolveRelationshipPairs,
  DEFAULT_COLUMN_REGISTRY,
  DEFAULT_FORM_TABS,
  normalizeContactPreferences,
  INITIAL_FIELD_SEED,
  type ColumnRegistryEntry,
} from "@mms/shared";
import type { ContactConfigContextType } from "@/lib/contacts/contactConfigContextTypes";
import { getFallbackCountryCode } from "@/lib/contacts/contactI18n";

/**
 * Builds ContactConfig context value.
 * Relationship-type options are derived from the fixed system pair catalog
 * (`resolveRelationshipPairs` → Parent/Child, Husband/Wife, Guardian/Dependent).
 * Lookups kind `relationships` remains a write mirror only.
 */
export function useContactConfigProviderValue(
  config: any,
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

  const resolvedFields = React.useMemo(() => {
    if (!fields || Object.keys(fields).length === 0) {
      return INITIAL_FIELD_SEED;
    }
    return fields;
  }, [fields]);

  const prefs = React.useMemo(() => normalizeContactPreferences(rawPrefs), [rawPrefs]);

  const [columnRegistry, setColumnRegistry] = React.useState<ColumnRegistryEntry[]>(
    config?.columnRegistry?.length ? config.columnRegistry : DEFAULT_COLUMN_REGISTRY
  );

  const updateUserColumnLayout = React.useCallback((layout: ColumnRegistryEntry[]) => {
    setColumnRegistry(layout);
  }, []);



  const getColumnWidth = React.useCallback((key: string) => {
    return columnRegistry.find((c) => c.key === key)?.width;
  }, [columnRegistry]);

  const setColumnWidth = React.useCallback((key: string, width: number) => {
    setColumnRegistry((prev) =>
      prev.map((c) => (c.key === key ? { ...c, width } : c)),
    );
  }, []);

  const isColumnVisible = React.useCallback((key: string) => {
    return columnRegistry.find((c) => c.key === key)?.enabled ?? false;
  }, [columnRegistry]);

  const availableColumns = React.useMemo(() => {
    return columnRegistry.map((entry) => ({
      id: entry.key,
      label: entry.label,
      sortField: entry.sortField,
      width: entry.width,
    }));
  }, [columnRegistry]);

  const visibleColumns = React.useMemo(() => {
    return columnRegistry
      .filter((entry) => entry.enabled)
      .map((entry) => ({
        id: entry.key,
        label: entry.label,
        sortField: entry.sortField,
        width: entry.width,
      }));
  }, [columnRegistry]);

  const defaultPhoneCountryCode = React.useMemo(
    () => getFallbackCountryCode(prefs, countryCodesMap, countryCodes),
    [countryCodes, countryCodesMap, prefs],
  );

  /** Form Relationship-type dropdown — fixed system catalog (Parent/Child, …). */
  const resolvedRelationships = React.useMemo(() => {
    const derived = deriveRelationshipOptionsFromPairs(
      resolveRelationshipPairs(prefs?.relationshipPairs),
    );
    return applyRelationshipOptionOrder(derived, prefs?.relationshipOptionOrder);
  }, [prefs?.relationshipPairs, prefs?.relationshipOptionOrder]);

  return React.useMemo(
    () => ({
      formTabsReady: true,
      enabledTabIds: enabledTabs.length > 0 
        ? new Set(enabledTabs) 
        : new Set(DEFAULT_FORM_TABS.filter((t) => t.enabled).map((t) => t.key)),
      requiredTabIds: new Set(requiredTabs),
      fields: resolvedFields,
      formTabs,
      isTabFieldEnabled: (tabId: string, fieldId: string) => {
        const tabFields = resolvedFields?.[tabId];
        if (!tabFields) return true;
        const field = tabFields.find((f: any) => f.key === fieldId);
        return field?.enabled ?? true;
      },
      isTabFieldRequired: (tabId: string, fieldId: string) => {
        const tabFields = resolvedFields?.[tabId];
        if (!tabFields) return false;
        const field = tabFields.find((f: any) => f.key === fieldId);
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
      columnRegistry,
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
    }),
    [
      prefs,
      resolvedFields,
      formTabs,
      enabledTabs,
      requiredTabs,
      updateConfig,
      updateConfigAsync,
      updatePrefs,
      updatePrefsAsync,
      genders,
      socialPlatforms,
      resolvedRelationships,
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
      columnRegistry,
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
    ],
  );
}

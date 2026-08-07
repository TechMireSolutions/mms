/**
 * ContactConfigContext
 * Broadcasts contact field configuration and preferences via TanStack Query + REST
 * (`/api/contacts/field-config`, preferences, lookups, column-prefs, custom-tabs).
 * Mount once under TenantScopedProviders — never nest on child pages.
 *
 * Usage:
 *   const { fieldConfig, prefs, updateConfig, updatePrefs } = useContactConfig();
 *   const columns = useContactColumns();         // dynamic table columns
 *   const schema  = useContactValidation();     // dynamic Zod-like validation
 */
import React, {
  useCallback,
  useContext,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getContactConfigCollectionDefaults } from "@/lib/contacts/contactConfigSeeds";
import {
  ContactConfigContext,
  type ContactConfigContextType,
} from "@/lib/contacts/contactConfigContextTypes";
import { useContactConfigCollections } from "@/lib/contacts/useContactConfigCollections";
import { useContactColumnLayout } from "@/lib/contacts/useContactColumnLayout";
import { useContactConfigCore } from "@/lib/contacts/useContactConfigCore";
import { useContactConfigProviderValue } from "@/lib/contacts/useContactConfigProviderValue";

/**
 * Context Provider that loads contact configuration from typed Contacts Setup REST
 * (Query-backed). Invalidation refreshes consumers — not a localStorage / live DB cache.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - Child elements.
 * @returns {React.JSX.Element}
 */
export function ContactConfigProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const contactConfigDefaults = useMemo(() => getContactConfigCollectionDefaults(), []);
  const viewerRole = user?.role ?? "";
  const reloadCollectionsRef = useRef<() => void>(() => undefined);

  const reloadCollectionsCallback = useCallback(() => {
    reloadCollectionsRef.current();
  }, []);

  const {
    fieldConfig,
    setFieldConfigState,
    formTabsReady,
    prefs,
    updateConfig,
    updateConfigAsync,
    updatePrefs,
    updatePrefsAsync,
    updateColumnRegistry,
    enabledTabIds,
    requiredTabIds,
    fields,
    isTabFieldEnabled,
    isTabFieldRequired,
  } = useContactConfigCore({
    userId: user?.id,
    userRole: viewerRole,
    reloadCollections: reloadCollectionsCallback,
  });

  const {
    genders,
    socialPlatforms,
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
  } = useContactConfigCollections({
    contactConfigDefaults,
    setFieldConfigState,
  });

  reloadCollectionsRef.current = reloadCollections;

  const {
    columnRegistry,
    availableColumns,
    visibleColumns,
    getColumnWidth,
    setColumnWidth,
    updateUserColumnLayout,
    isColumnVisible,
    systemSortOptions,
  } = useContactColumnLayout({
    fieldConfig,
    fields,
    enabledTabIds,
    isTabFieldEnabled,
    viewerRole,
  });

  const providerValue = useContactConfigProviderValue({
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
  });

  return (
    <ContactConfigContext.Provider value={providerValue}>
      {children}
    </ContactConfigContext.Provider>
  );
}

/**
 * Hook to consume the ContactConfigContext.
 *
 * @returns {ContactConfigContextType} The configuration context value.
 */
export function useContactConfig(): ContactConfigContextType {
  const contactConfig = useContext(ContactConfigContext);
  if (!contactConfig) throw new Error("useContactConfig must be used inside <ContactConfigProvider>");
  return contactConfig;
}

// ── Dynamic column builder hook ───────────────────────────────────────────────
/**
 * Returns the ordered list of table columns that should be visible,
 * derived entirely from the current fieldConfig.
 *
 * @returns {Array<{ id: string; label: string; sortField?: string }>} The array of active column descriptors.
 */
export function useContactColumns(): Array<{ id: string; label: string; sortField?: string; width?: number }> {
  return useContactConfig().visibleColumns;
}

/**
 * ContactConfigContext
 * Global React Context that broadcasts contact field configuration
 * and preferences to all consumers in real-time without page refresh.
 *
 * Usage:
 *   const { fieldConfig, prefs, updateConfig, updatePrefs } = useContactConfig();
 *   const columns = useContactColumns();         // dynamic table columns
 *   const schema  = useContactValidation();     // dynamic Zod-like validation
 */
import React, {
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
import { useContactColumnRegistry } from "@/lib/contacts/useContactColumnRegistry";
import { useContactConfigCore } from "@/lib/contacts/useContactConfigCore";
import { useContactConfigProviderValue } from "@/lib/contacts/useContactConfigProviderValue";

/**
 * Context Provider component that loads contact configuration arrays
 * from the tenant database cache, synchronizing state in real-time.
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

  const {
    fieldConfig,
    setFieldConfigState,
    prefs,
    rawUserColumnOverlay,
    updateConfig,
    updateConfigAsync,
    updatePrefs,
    updatePrefsAsync,
    updateColumnRegistry,
    updateUserColumnLayout,
    enabledTabIds,
    requiredTabIds,
    fields,
    isTabFieldEnabled,
    isTabFieldRequired,
  } = useContactConfigCore({
    userId: user?.id,
    userRole: viewerRole,
    reloadCollections: () => {
      reloadCollectionsRef.current();
    },
  });

  const {
    genders,
    socialPlatforms,
    relationships,
    relationshipPairs,
    phoneLabels,
    emailLabels,
    addressLabels,
    countryCodes,
    countryCodesMap,
    reloadCollections,
    updateGenders,
    updateSocialPlatforms,
    updateRelationships,
    updateRelationshipPairs,
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
    systemSortOptions,
  } = useContactColumnRegistry({
    fieldConfig,
    fields,
    enabledTabIds,
    isTabFieldEnabled,
    rawUserColumnOverlay,
    viewerRole,
    updateUserColumnLayout,
  });

  const providerValue = useContactConfigProviderValue({
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
    relationshipPairs,
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

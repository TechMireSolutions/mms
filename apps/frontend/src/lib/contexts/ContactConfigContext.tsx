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
  createContext,
  useContext,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import {
  FieldConfig,
  ContactPreferences,
  FieldDefinition,
  ColumnRegistryEntry,
  buildDynamicContactSchema,
  formatZodIssues,
  type ValidationError,
} from "@mms/shared";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { useAuth } from "@/lib/contexts/AuthContext";
import { usePermissions } from "@/tenant/hooks/usePermissions";
import { getFallbackCountryCode } from "@/lib/contacts/contactI18n";
import { getContactConfigCollectionDefaults } from "@/lib/contacts/contactConfigSeeds";
import { useContactConfigCollections } from "@/lib/contacts/useContactConfigCollections";
import { useContactColumnRegistry } from "@/lib/contacts/useContactColumnRegistry";
import { useContactConfigCore } from "@/lib/contacts/useContactConfigCore";

// ── Context Interface ─────────────────────────────────────────────────────────
export interface ContactConfigContextType {
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

  // Dynamic Collections
  genders: string[];
  socialPlatforms: string[];
  relationships: string[];
  phoneLabels: string[];
  emailLabels: string[];
  addressLabels: string[];
  countryCodes: Array<{ country: string; code: string }>;

  // Derived Lookups
  countryCodesMap: Record<string, string>;
  defaultPhoneCountryCode: string;

  // Dynamic Columns
  columnRegistry: ColumnRegistryEntry[];
  availableColumns: Array<{ id: string; label: string; sortField?: string; width?: number }>;
  visibleColumns: Array<{ id: string; label: string; sortField?: string; width?: number }>;

  // Mutators
  updateGenders: (genderOptions: string[]) => void;
  updateSocialPlatforms: (socialPlatformOptions: string[]) => void;
  updateRelationships: (relationshipOptions: string[]) => void;
  updatePhoneLabels: (phoneLabelOptions: string[]) => void;
  updateEmailLabels: (emailLabelOptions: string[]) => void;
  updateAddressLabels: (addressLabelOptions: string[]) => void;
  updateCountryCodes: (countryCodeOptions: Array<{ country: string; code: string }>) => void;
  updateColumnRegistry: (columnRegistry: ColumnRegistryEntry[]) => void;
  updateUserColumnLayout: (columnRegistry: ColumnRegistryEntry[]) => void;
  getColumnWidth: (key: string) => number | undefined;
  setColumnWidth: (key: string, width: number) => void;
  systemSortOptions: Array<{ field: string; label: string }>;
}

export const ContactConfigContext = createContext<ContactConfigContextType | null>(null);

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

  const defaultPhoneCountryCode = useMemo(
    () => getFallbackCountryCode(prefs, countryCodesMap, countryCodes),
    [countryCodes, countryCodesMap, prefs],
  );

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

  return (
    <ContactConfigContext.Provider
      value={{
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
        getColumnWidth,
        setColumnWidth,
        systemSortOptions,
      }}
    >
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

/**
 * Hook to perform dynamic contact validation against the active field configuration.
 */
export function useContactValidation() {
  const { fieldConfig, enabledTabIds, requiredTabIds, fields } = useContactConfig();
  const settings = useGlobalSettings();
  const { role } = usePermissions();
  const viewerRole = role ?? "";

  return useCallback(
    (contactDraft: unknown): ValidationError[] => {
      const schema = buildDynamicContactSchema(
        fieldConfig,
        enabledTabIds,
        requiredTabIds,
        fields,
        settings.language,
        viewerRole,
      );
      const result = schema.safeParse(contactDraft);
      if (result.success) {
        return [];
      }
      return formatZodIssues(result.error, contactDraft, fields);
    },
    [fieldConfig, enabledTabIds, requiredTabIds, fields, settings.language, viewerRole],
  );
}

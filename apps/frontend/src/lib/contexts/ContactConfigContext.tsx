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
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import { loadFieldConfig, saveFieldConfig, saveFieldConfigAsync } from "@/lib/contactFieldsStore";
import {
  FieldConfig,
  ContactPreferences,
  ContactColumnPreference,
  FieldDefinition,
  ColumnRegistryEntry,
  DEFAULT_ENABLED_TABS,
  INITIAL_FIELD_SEED,
  canViewContactTab,
  buildDynamicContactSchema,
  formatZodIssues,
  type ValidationError,
} from "@mms/shared";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { useAuth } from "@/lib/contexts/AuthContext";
import { usePermissions } from "@/tenant/hooks/usePermissions";
import {
  loadModuleColumnPreferences,
  saveModuleColumnPreferenceList,
  saveModuleColumnRegistry,
} from "@/lib/columnPreferences/moduleColumnPreferencesStorage";
import { useContactColumnPrefs, useContactColumnPrefsMutation } from "@/tenant/hooks/collections/contacts";
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  savePreferencesAsync,
} from "@/lib/contacts/preferencesStorage";
import { getFallbackCountryCode } from "@/lib/contacts/contactI18n";
import { getContactConfigCollectionDefaults } from "@/lib/contacts/contactConfigSeeds";
import { useContactConfigCollections } from "@/lib/contacts/useContactConfigCollections";
import { useContactColumnRegistry } from "@/lib/contacts/useContactColumnRegistry";

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
  const [queryEnabled, setQueryEnabled] = useState(false);
  useEffect(() => {
    setQueryEnabled(Boolean(user?.id));
  }, [user?.id]);

  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useContactColumnPrefs({
    enabled: queryEnabled,
  });
  const { mutate: saveColumnPrefs } = useContactColumnPrefsMutation();
  const migratedLocalColumnPrefs = useRef(false);
  const lastUserIdRef = useRef<string | number | undefined>(user?.id);
  const [fieldConfig, setFieldConfigState] = useState<FieldConfig>(() => loadFieldConfig());
  const [localUserColumnOverlay, setLocalUserColumnOverlay] = useState<ContactColumnPreference[] | null>(null);

  const rawUserColumnOverlay = useMemo(() => {
    if (localUserColumnOverlay) {
      return localUserColumnOverlay;
    }
    if (columnPrefsLoaded && serverColumnPrefs && serverColumnPrefs.length > 0) {
      return serverColumnPrefs;
    }
    const userId = user?.id ? String(user.id) : "";
    if (userId) {
      return loadModuleColumnPreferences("contacts", userId);
    }
    return null;
  }, [localUserColumnOverlay, columnPrefsLoaded, serverColumnPrefs, user?.id]);

  const [prefs, setPrefsState] = useState<ContactPreferences>(() => ({
    ...DEFAULT_PREFERENCES,
    ...loadPreferences(),
  }));
  const contactConfigDefaults = useMemo(() => getContactConfigCollectionDefaults(), []);

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

  const reloadContactConfigFromDatabaseCache = useCallback(() => {
    setFieldConfigState(loadFieldConfig());
    setPrefsState({
      ...DEFAULT_PREFERENCES,
      ...loadPreferences(),
    });
    reloadCollections();
  }, [reloadCollections]);

  useEffect(() => {
    if (lastUserIdRef.current !== user?.id) {
      lastUserIdRef.current = user?.id;
      setTimeout(reloadContactConfigFromDatabaseCache, 0);
    }
  }, [reloadContactConfigFromDatabaseCache, user?.id]);

  useEffect(() => {
    const handleLocalDatabaseUpdate = () => {
      setTimeout(reloadContactConfigFromDatabaseCache, 0);
    };
    window.addEventListener("local-database-update", handleLocalDatabaseUpdate);
    return () => window.removeEventListener("local-database-update", handleLocalDatabaseUpdate);
  }, [reloadContactConfigFromDatabaseCache]);

  useEffect(() => {
    if (!user?.id) {
      setTimeout(() => {
        setLocalUserColumnOverlay(null);
      }, 0);
      migratedLocalColumnPrefs.current = false;
      return;
    }
    if (!columnPrefsLoaded) return;

    const userId = String(user.id);
    if (serverColumnPrefs && serverColumnPrefs.length > 0) {
      saveModuleColumnPreferenceList("contacts", userId, serverColumnPrefs);
      return;
    }

    const local = loadModuleColumnPreferences("contacts", userId);
    if (local?.length && !migratedLocalColumnPrefs.current) {
      migratedLocalColumnPrefs.current = true;
      saveColumnPrefs(local);
    }
  }, [user?.id, columnPrefsLoaded, serverColumnPrefs, saveColumnPrefs]);

  // ── Mutators ──────────────────────────────────────────────────────────────
  const updateConfig = useCallback((nextConfig: FieldConfig) => {
    saveFieldConfig(nextConfig);
    setFieldConfigState(nextConfig);
  }, []);

  const updateConfigAsync = useCallback(async (nextConfig: FieldConfig): Promise<void> => {
    await saveFieldConfigAsync(nextConfig);
    setFieldConfigState(nextConfig);
  }, []);

  const updatePrefs = useCallback((newPrefs: Partial<ContactPreferences>) => {
    setPrefsState((currentPreferences) => {
      const merged = { ...currentPreferences, ...newPrefs };
      savePreferences(merged);
      return merged;
    });
  }, []);

  const updatePrefsAsync = useCallback(async (newPrefs: Partial<ContactPreferences>): Promise<void> => {
    const merged = { ...prefs, ...newPrefs };
    await savePreferencesAsync(merged);
    setPrefsState(merged);
  }, [prefs]);

  const updateColumnRegistry = useCallback((columnRegistry: ColumnRegistryEntry[]) => {
    updateConfig({ ...fieldConfig, columnRegistry });
  }, [fieldConfig, updateConfig]);

  const updateUserColumnLayout = useCallback((columnRegistry: ColumnRegistryEntry[]) => {
    const userId = user?.id ? String(user.id) : "";
    if (!userId) return;
    saveModuleColumnRegistry("contacts", userId, columnRegistry);
    const preferences: ContactColumnPreference[] = columnRegistry.map(({ key, enabled, order, width }) => {
      const preference: ContactColumnPreference = { key, enabled, order };
      if (typeof width === "number") preference.width = width;
      return preference;
    });
    setLocalUserColumnOverlay(preferences);
    saveColumnPrefs(preferences);
  }, [user?.id, saveColumnPrefs]);

  const viewerRole = user?.role ?? '';

  const enabledTabIds = useMemo(() => {
    if (fieldConfig.formTabs) {
      const activeFromTabs = fieldConfig.formTabs
        .filter((tab) => canViewContactTab(viewerRole, tab) && tab.enabled !== false)
        .map((tab) => tab.key);
      return new Set([...DEFAULT_ENABLED_TABS, ...activeFromTabs]);
    }
    return new Set([...DEFAULT_ENABLED_TABS, ...(fieldConfig.enabledTabs || [])]);
  }, [fieldConfig, viewerRole]);

  const requiredTabIds = useMemo(() => {
    return new Set(fieldConfig.requiredTabs || []);
  }, [fieldConfig]);

  const fields = useMemo(() => {
    return fieldConfig.fields || {};
  }, [fieldConfig]);

  const defaultPhoneCountryCode = useMemo(
    () => getFallbackCountryCode(prefs, countryCodesMap, countryCodes),
    [countryCodes, countryCodesMap, prefs],
  );

  /**
   * Returns true if a specific field inside a tab is enabled.
   *
   * @param {string} tabId - Tab identifier.
   * @param {string} fieldId - Field identifier.
   * @returns {boolean}
   */
  const isTabFieldEnabled = useCallback(
    (tabId: string, fieldId: string) => {
      const tabFieldsList = fields[tabId];
      if (!tabFieldsList || tabFieldsList.length === 0) {
        const seedField = (INITIAL_FIELD_SEED[tabId] || []).find((f: FieldDefinition) => f.key === fieldId);
        return seedField?.enabled ?? false;
      }
      const field = tabFieldsList.find((fieldDefinition) => fieldDefinition.key === fieldId);
      return field?.enabled ?? false;
    },
    [fields]
  );

  /**
   * Returns true if a specific field inside a tab is required.
   *
   * @param {string} tabId - Tab identifier.
   * @param {string} fieldId - Field identifier.
   * @returns {boolean}
   */
  const isTabFieldRequired = useCallback(
    (tabId: string, fieldId: string) => {
      const field = (fields[tabId] || []).find((fieldDefinition) => fieldDefinition.key === fieldId);
      return field?.required ?? false;
    },
    [fields]
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
  const viewerRole = role ?? '';

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

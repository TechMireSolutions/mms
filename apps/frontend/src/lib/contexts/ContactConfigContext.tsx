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
import { loadFieldConfig, saveFieldConfig } from "@/lib/contactFieldsStore";
import {
  FieldConfig,
  ContactPreferences,
  ContactColumnPreference,
  FieldDefinition,
  WhatsAppTemplate,
  translateApp,
  ColumnRegistryEntry,
  canViewContactColumn,
  canViewContactTab,
  buildDynamicContactSchema,
  formatZodIssues,
  applyModuleColumnOverlay,
  type ValidationError,
} from "@mms/shared";
import { getCollection, getWorkspaceLocalStoragePrefix, saveCollection, getObject, saveObject } from "@/lib/db";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { useAuth } from "@/lib/contexts/AuthContext";
import { usePermissions } from "@/tenant/hooks/usePermissions";
import {
  loadModuleColumnPreferences,
  saveModuleColumnPreferenceList,
  saveModuleColumnRegistry,
} from "@/lib/columnPreferences/moduleColumnPreferencesStorage";
import { useContactColumnPrefs, useContactColumnPrefsMutation } from "@/tenant/features/contacts/hooks/useContacts";
import {
  CONFIG_KEY,
  DEFAULT_PREFERENCES,
  loadPreferences,
  PREFERENCES_KEY,
  savePreferences,
  syncOptionsInConfig,
} from "@/lib/contacts/preferencesStorage";
import {
  CONTACT_CONFIG_COLLECTION_KEYS,
  CONTACT_CONFIG_OBJECT_KEYS,
  contactWhatsappTemplatesKey,
  getContactConfigCollectionDefaults,
  getDefaultSocialPlaceholders,
} from "@/lib/contacts/contactConfigSeeds";

export {
  calculateProfileCompleteness,
  buildCustomFieldSchema,
  buildDynamicContactSchema,
  formatZodIssues,
  type ValidationError,
} from "@mms/shared";

// ── Context Interface ─────────────────────────────────────────────────────────
export interface ContactConfigContextType {
  fieldConfig: FieldConfig;
  prefs: ContactPreferences;
  updateConfig: (nextConfig: FieldConfig) => void;
  updatePrefs: (newPrefs: Partial<ContactPreferences>) => void;

  enabledTabIds: Set<string>;
  requiredTabIds: Set<string>;
  fields: Record<string, FieldDefinition[]>;
  isTabFieldEnabled: (tabId: string, fieldId: string) => boolean;
  isTabFieldRequired: (tabId: string, fieldId: string) => boolean;

  // Dynamic Collections
  genders: string[];
  socialPlatforms: string[];
  relationships: string[];
  socialPlaceholders: Record<string, string>;
  whatsappTemplates: WhatsAppTemplate[];
  phoneLabels: string[];
  emailLabels: string[];
  addressLabels: string[];
  countryCodes: Array<{ country: string; code: string }>;

  // Derived Lookups
  countryCodesMap: Record<string, string>;
  defaultPhoneCountryCode: string;

  // Dynamic Columns
  columnRegistry: ColumnRegistryEntry[];
  availableColumns: Array<{ id: string; label: string; sortField?: string }>;
  visibleColumns: Array<{ id: string; label: string; sortField?: string }>;

  // Mutators
  updateGenders: (genderOptions: string[]) => void;
  updateSocialPlatforms: (socialPlatformOptions: string[]) => void;
  updateRelationships: (relationshipOptions: string[]) => void;
  updateSocialPlaceholders: (socialPlaceholders: Record<string, string>) => void;
  updateWhatsappTemplates: (whatsappTemplates: WhatsAppTemplate[]) => void;
  updatePhoneLabels: (phoneLabelOptions: string[]) => void;
  updateEmailLabels: (emailLabelOptions: string[]) => void;
  updateAddressLabels: (addressLabelOptions: string[]) => void;
  updateCountryCodes: (countryCodeOptions: Array<{ country: string; code: string }>) => void;
  updateColumnRegistry: (columnRegistry: ColumnRegistryEntry[]) => void;
  updateUserColumnLayout: (columnRegistry: ColumnRegistryEntry[]) => void;
  systemSortOptions: Array<{ field: string; label: string }>;
}

const ContactConfigContext = createContext<ContactConfigContextType | null>(null);

/**
 * Context Provider component that loads contact configuration arrays
 * from the tenant database cache, synchronizing state in real-time.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - Child elements.
 * @returns {React.JSX.Element}
 */
export function ContactConfigProvider({ children }: { children: ReactNode }) {
  const settings = useGlobalSettings();
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

  const userColumnOverlay = useMemo(() => {
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

  // ── Dynamic Option Lists ────────────────────────────────────────────────────
  const [genders, setGendersState] = useState<string[]>(() =>
    getCollection(CONTACT_CONFIG_COLLECTION_KEYS.genders, contactConfigDefaults.genders)
  );
  const [socialPlatforms, setSocialPlatformsState] = useState<string[]>(() =>
    getCollection(CONTACT_CONFIG_COLLECTION_KEYS.socialPlatforms, contactConfigDefaults.socialPlatforms)
  );
  const [relationships, setRelationshipsState] = useState<string[]>(() =>
    getCollection(CONTACT_CONFIG_COLLECTION_KEYS.relationships, contactConfigDefaults.relationships)
  );

  const [socialPlaceholders, setSocialPlaceholdersState] = useState<Record<string, string>>(() =>
    getObject(CONTACT_CONFIG_OBJECT_KEYS.socialPlaceholders, getDefaultSocialPlaceholders())
  );
  const [whatsappTemplates, setWhatsappTemplatesState] = useState<WhatsAppTemplate[]>(() => {
    return getCollection(contactWhatsappTemplatesKey(user?.id), contactConfigDefaults.whatsappTemplates);
  });
  const [phoneLabels, setPhoneLabelsState] = useState<string[]>(() =>
    getCollection(CONTACT_CONFIG_COLLECTION_KEYS.phoneLabels, contactConfigDefaults.phoneLabels)
  );
  const [emailLabels, setEmailLabelsState] = useState<string[]>(() =>
    getCollection(CONTACT_CONFIG_COLLECTION_KEYS.emailLabels, contactConfigDefaults.emailLabels)
  );
  const [addressLabels, setAddressLabelsState] = useState<string[]>(() =>
    getCollection(CONTACT_CONFIG_COLLECTION_KEYS.addressLabels, contactConfigDefaults.addressLabels)
  );
  const [countryCodes, setCountryCodesState] = useState<Array<{ country: string; code: string }>>(() =>
    getCollection(CONTACT_CONFIG_COLLECTION_KEYS.countryCodes, contactConfigDefaults.countryCodes)
  );

  const reloadContactConfigFromDatabaseCache = useCallback(() => {
    setFieldConfigState(loadFieldConfig());
    setPrefsState({
      ...DEFAULT_PREFERENCES,
      ...loadPreferences(),
    });
    setGendersState(getCollection(CONTACT_CONFIG_COLLECTION_KEYS.genders, contactConfigDefaults.genders));
    setSocialPlatformsState(
      getCollection(CONTACT_CONFIG_COLLECTION_KEYS.socialPlatforms, contactConfigDefaults.socialPlatforms),
    );
    setRelationshipsState(
      getCollection(CONTACT_CONFIG_COLLECTION_KEYS.relationships, contactConfigDefaults.relationships),
    );

    setSocialPlaceholdersState(
      getObject(CONTACT_CONFIG_OBJECT_KEYS.socialPlaceholders, getDefaultSocialPlaceholders()),
    );
    setWhatsappTemplatesState(
      getCollection(contactWhatsappTemplatesKey(user?.id), contactConfigDefaults.whatsappTemplates),
    );
    setPhoneLabelsState(getCollection(CONTACT_CONFIG_COLLECTION_KEYS.phoneLabels, contactConfigDefaults.phoneLabels));
    setEmailLabelsState(getCollection(CONTACT_CONFIG_COLLECTION_KEYS.emailLabels, contactConfigDefaults.emailLabels));
    setAddressLabelsState(
      getCollection(CONTACT_CONFIG_COLLECTION_KEYS.addressLabels, contactConfigDefaults.addressLabels),
    );
    setCountryCodesState(
      getCollection(CONTACT_CONFIG_COLLECTION_KEYS.countryCodes, contactConfigDefaults.countryCodes),
    );
  }, [contactConfigDefaults, user?.id]);


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

  // ── Cross-tab sync via storage events ────────────────────────────────────
  useEffect(() => {
    /**
     * Safely parse a storage event's newValue, logging on failure.
     *
     * @param {StorageEvent} storageEvent - The storage event.
     * @param {string} label - Human-readable label for error messages.
     * @returns {unknown|null}
     */
    const safeParseEvent = (storageEvent: StorageEvent, label: string): unknown | null => {
      if (storageEvent.newValue === null) return null;
      try {
        return JSON.parse(storageEvent.newValue);
      } catch (error) {
        console.warn(`[ContactConfigContext] Failed to parse storage event for "${label}":`, error);
        return null;
      }
    };

    const handler = (storageEvent: StorageEvent) => {
      if (storageEvent.key === CONFIG_KEY) {
        const parsed = safeParseEvent(storageEvent, "fieldConfig");
        if (parsed) setFieldConfigState(parsed as FieldConfig);
      } else if (storageEvent.key === PREFERENCES_KEY) {
        const parsed = safeParseEvent(storageEvent, "preferences");
        if (parsed) setPrefsState((currentPreferences) => ({ ...DEFAULT_PREFERENCES, ...currentPreferences, ...(parsed as Partial<ContactPreferences>) }));
      } else if (storageEvent.key && storageEvent.key.startsWith(getWorkspaceLocalStoragePrefix())) {
        const subKey = storageEvent.key.slice(getWorkspaceLocalStoragePrefix().length);
        const parsed = safeParseEvent(storageEvent, subKey);
        if (parsed) {
          const currentTemplatesKey = contactWhatsappTemplatesKey(user?.id);
          const COLLECTION_SETTERS: Record<string, (storedConfigValue: unknown) => void> = {
            [CONTACT_CONFIG_COLLECTION_KEYS.genders]: setGendersState as (storedConfigValue: unknown) => void,
            [CONTACT_CONFIG_COLLECTION_KEYS.socialPlatforms]: setSocialPlatformsState as (storedConfigValue: unknown) => void,
            [CONTACT_CONFIG_COLLECTION_KEYS.relationships]: setRelationshipsState as (storedConfigValue: unknown) => void,

            [CONTACT_CONFIG_OBJECT_KEYS.socialPlaceholders]: setSocialPlaceholdersState as (storedConfigValue: unknown) => void,
            [CONTACT_CONFIG_COLLECTION_KEYS.phoneLabels]: setPhoneLabelsState as (storedConfigValue: unknown) => void,
            [CONTACT_CONFIG_COLLECTION_KEYS.emailLabels]: setEmailLabelsState as (storedConfigValue: unknown) => void,
            [CONTACT_CONFIG_COLLECTION_KEYS.addressLabels]: setAddressLabelsState as (storedConfigValue: unknown) => void,
            [CONTACT_CONFIG_COLLECTION_KEYS.countryCodes]: setCountryCodesState as (storedConfigValue: unknown) => void,
            [currentTemplatesKey]: setWhatsappTemplatesState as (storedConfigValue: unknown) => void,
          };
          COLLECTION_SETTERS[subKey]?.(parsed);
        }
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [user?.id]);

  // ── Mutators ──────────────────────────────────────────────────────────────
  const updateConfig = useCallback((nextConfig: FieldConfig) => {
    saveFieldConfig(nextConfig);
    setFieldConfigState(nextConfig);
  }, []);

  const updatePrefs = useCallback((newPrefs: Partial<ContactPreferences>) => {
    setPrefsState((currentPreferences) => {
      const merged = { ...currentPreferences, ...newPrefs };
      savePreferences(merged);
      return merged;
    });
  }, []);

  const updateGenders = useCallback((genderOptions: string[]) => {
    saveCollection(CONTACT_CONFIG_COLLECTION_KEYS.genders, genderOptions);
    setGendersState(genderOptions);
    setFieldConfigState((currentConfig) => {
      const updatedConfig = syncOptionsInConfig(currentConfig, "basic", "gender", genderOptions);
      saveFieldConfig(updatedConfig);
      return updatedConfig;
    });
  }, []);
  const updateSocialPlatforms = useCallback((socialPlatformOptions: string[]) => {
    saveCollection(CONTACT_CONFIG_COLLECTION_KEYS.socialPlatforms, socialPlatformOptions);
    setSocialPlatformsState(socialPlatformOptions);
    setFieldConfigState((currentConfig) => {
      const updatedConfig = syncOptionsInConfig(currentConfig, "socials", "platform", socialPlatformOptions);
      saveFieldConfig(updatedConfig);
      return updatedConfig;
    });
  }, []);
  const updateRelationships = useCallback((relationshipOptions: string[]) => {
    saveCollection(CONTACT_CONFIG_COLLECTION_KEYS.relationships, relationshipOptions);
    setRelationshipsState(relationshipOptions);
    setFieldConfigState((currentConfig) => {
      const updatedConfig = syncOptionsInConfig(currentConfig, "emergency", "relationship", relationshipOptions);
      saveFieldConfig(updatedConfig);
      return updatedConfig;
    });
  }, []);

  const updateSocialPlaceholders = useCallback((socialPlaceholders: Record<string, string>) => {
    saveObject(CONTACT_CONFIG_OBJECT_KEYS.socialPlaceholders, socialPlaceholders);
    setSocialPlaceholdersState(socialPlaceholders);
  }, []);
  const updateWhatsappTemplates = useCallback((whatsappTemplates: WhatsAppTemplate[]) => {
    saveCollection(contactWhatsappTemplatesKey(user?.id), whatsappTemplates);
    setWhatsappTemplatesState(whatsappTemplates);
  }, [user?.id]);
  const updatePhoneLabels = useCallback((phoneLabelOptions: string[]) => {
    saveCollection(CONTACT_CONFIG_COLLECTION_KEYS.phoneLabels, phoneLabelOptions);
    setPhoneLabelsState(phoneLabelOptions);
    setFieldConfigState((currentConfig) => {
      const updatedConfig = syncOptionsInConfig(currentConfig, "phones", "label", phoneLabelOptions);
      saveFieldConfig(updatedConfig);
      return updatedConfig;
    });
  }, []);
  const updateEmailLabels = useCallback((emailLabelOptions: string[]) => {
    saveCollection(CONTACT_CONFIG_COLLECTION_KEYS.emailLabels, emailLabelOptions);
    setEmailLabelsState(emailLabelOptions);
    setFieldConfigState((currentConfig) => {
      const updatedConfig = syncOptionsInConfig(currentConfig, "emails", "label", emailLabelOptions);
      saveFieldConfig(updatedConfig);
      return updatedConfig;
    });
  }, []);
  const updateAddressLabels = useCallback((addressLabelOptions: string[]) => {
    saveCollection(CONTACT_CONFIG_COLLECTION_KEYS.addressLabels, addressLabelOptions);
    setAddressLabelsState(addressLabelOptions);
    setFieldConfigState((currentConfig) => {
      const updatedConfig = syncOptionsInConfig(currentConfig, "addresses", "label", addressLabelOptions);
      saveFieldConfig(updatedConfig);
      return updatedConfig;
    });
  }, []);
  const updateCountryCodes = useCallback((countryCodeOptions: Array<{ country: string; code: string }>) => {
    saveCollection(CONTACT_CONFIG_COLLECTION_KEYS.countryCodes, countryCodeOptions);
    setCountryCodesState(countryCodeOptions);
  }, []);

  const updateColumnRegistry = useCallback((columnRegistry: ColumnRegistryEntry[]) => {
    updateConfig({ ...fieldConfig, columnRegistry });
  }, [fieldConfig, updateConfig]);

  const updateUserColumnLayout = useCallback((columnRegistry: ColumnRegistryEntry[]) => {
    const userId = user?.id ? String(user.id) : "";
    if (!userId) return;
    saveModuleColumnRegistry("contacts", userId, columnRegistry);
    const preferences: ContactColumnPreference[] = columnRegistry.map(({ key, enabled, order }) => ({ key, enabled, order }));
    setLocalUserColumnOverlay(preferences);
    saveColumnPrefs(preferences);
  }, [user?.id, saveColumnPrefs]);

  const viewerRole = user?.role ?? '';

  const enabledTabIds = useMemo(() => {
    if (fieldConfig.formTabs) {
      return new Set(
        fieldConfig.formTabs
          .filter((tab) => canViewContactTab(viewerRole, tab))
          .map((tab) => tab.key),
      );
    }
    return new Set(fieldConfig.enabledTabs || ["phones", "emails", "addresses", "socials", "emergency"]);
  }, [fieldConfig, viewerRole]);

  const requiredTabIds = useMemo(() => {
    return new Set(fieldConfig.requiredTabs || []);
  }, [fieldConfig]);

  const fields = useMemo(() => {
    return fieldConfig.fields || {};
  }, [fieldConfig]);

  const countryCodesMap = useMemo(() => {
    const countryCodeByCountry: Record<string, string> = {};
    countryCodes.forEach(({ country, code }) => {
      countryCodeByCountry[country] = code;
    });
    return countryCodeByCountry;
  }, [countryCodes]);

  const defaultPhoneCountryCode = useMemo(() => {
    const configuredDefault = prefs.defaultCountry ? countryCodesMap[prefs.defaultCountry] : "";
    return configuredDefault || countryCodes[0]?.code || "";
  }, [countryCodes, countryCodesMap, prefs.defaultCountry]);

  /**
   * Returns true if a specific field inside a tab is enabled.
   *
   * @param {string} tabId - Tab identifier.
   * @param {string} fieldId - Field identifier.
   * @returns {boolean}
   */
  const isTabFieldEnabled = useCallback(
    (tabId: string, fieldId: string) => {
      const field = (fields[tabId] || []).find((fieldDefinition) => fieldDefinition.key === fieldId);
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

  const tenantColumnRegistry = useMemo(() => {
    const registry = [...(fieldConfig.columnRegistry || [])];
    
    // Find all active fields across all enabled tabs in the registry
    const activeFields: Array<{ tabId: string; field: FieldDefinition }> = [];
    Object.entries(fields).forEach(([tabId, tabFields]) => {
      const tabEnabled = tabId === "basic" || enabledTabIds.has(tabId);
      if (tabEnabled) {
        (tabFields || []).forEach((fieldDefinition) => {
          if (fieldDefinition.enabled) {
            activeFields.push({ tabId, field: fieldDefinition });
          }
        });
      }
    });

    // 1. Filter out columns from registry that don't match active tabs/fields
    const filteredRegistry = registry.filter((column) => {
      if (column.key === "name") {
        return isTabFieldEnabled("basic", "firstName");
      }
      if (column.key === "phone") {
        return enabledTabIds.has("phones") && isTabFieldEnabled("phones", "number");
      }
      if (column.key === "whatsapp") {
        return enabledTabIds.has("phones") && isTabFieldEnabled("phones", "whatsapp");
      }
      if (column.key === "email") {
        return enabledTabIds.has("emails") && isTabFieldEnabled("emails", "address");
      }
      if (column.key === "city") {
        return enabledTabIds.has("addresses") && isTabFieldEnabled("addresses", "city");
      }
      if (column.key === "state") {
        return enabledTabIds.has("addresses") && isTabFieldEnabled("addresses", "state");
      }
      if (column.key === "country") {
        return enabledTabIds.has("addresses") && isTabFieldEnabled("addresses", "country");
      }
      if (column.key === "line1") {
        return enabledTabIds.has("addresses") && isTabFieldEnabled("addresses", "line1");
      }
      if (column.key === "gender") {
        return isTabFieldEnabled("basic", "gender");
      }
      if (column.key === "dob") {
        return isTabFieldEnabled("basic", "dob");
      }

      if (column.key === "isSyed") {
        return isTabFieldEnabled("basic", "isSyed");
      }
      if (column.key === "socials_platform") {
        return enabledTabIds.has("socials") && isTabFieldEnabled("socials", "platform");
      }
      if (column.key === "socials_url") {
        return enabledTabIds.has("socials") && isTabFieldEnabled("socials", "url");
      }
      if (column.key === "emergency_contact") {
        return enabledTabIds.has("emergency") && isTabFieldEnabled("emergency", "contactId");
      }
      if (column.key === "emergency_relationship") {
        return enabledTabIds.has("emergency") && isTabFieldEnabled("emergency", "relationship");
      }

      // Check if the field is defined and enabled in active fields
      return activeFields.some((activeField) => activeField.field.key === column.key);
    });

    // 2. Add columns for any active fields that aren't in the registry yet
    const existingKeys = new Set(filteredRegistry.map((column) => column.key));
    const specialKeys = new Set([
      "firstName", "lastName", "avatar", "number", "address", "line1", "city",
      "state", "country", "label", "platform", "url", "contactId", "relationship"
    ]);

    activeFields.forEach((activeField) => {
      const fieldKey = activeField.field.key;
      if (!specialKeys.has(fieldKey) && !existingKeys.has(fieldKey)) {
        const maxOrder = filteredRegistry.reduce((max, column) => Math.max(max, column.order), -1);
        filteredRegistry.push({
          key: fieldKey,
          label: activeField.field.label,
          enabled: false,
          order: maxOrder + 1,
          sortable: true
        });
      }
    });

    const viewerRole = user?.role ?? '';
    const columnCtx = { fields, enabledTabIds, isTabFieldEnabled };
    return filteredRegistry.filter((column) => canViewContactColumn(viewerRole, column.key, columnCtx));
  }, [fieldConfig.columnRegistry, fields, enabledTabIds, isTabFieldEnabled, user?.role]);

  const columnRegistry = useMemo(
    () => applyModuleColumnOverlay(tenantColumnRegistry, userColumnOverlay) as ColumnRegistryEntry[],
    [tenantColumnRegistry, userColumnOverlay],
  );
  const availableColumns = useMemo(() => {
    return columnRegistry.map((column) => ({
      id: column.key,
      label: column.label,
      sortField: column.sortable !== false ? (column.sortField || column.key) : undefined
    }));
  }, [columnRegistry]);

  const visibleColumns = useMemo(() => {
    return columnRegistry
      .filter((column) => column.enabled)
      .sort((a, b) => a.order - b.order)
      .map((column) => ({
        id: column.key,
        label: column.label,
        sortField: column.sortable !== false ? (column.sortField || column.key) : undefined
      }));
  }, [columnRegistry]);

  const systemSortOptions = useMemo<Array<{ field: string; label: string }>>(() => [
    { field: "createdAt", label: translateApp("contacts.table.dateAdded", settings.language) },
    { field: "updatedAt", label: translateApp("contacts.table.lastUpdated", settings.language) },
  ], [settings.language]);





  return (
    <ContactConfigContext.Provider
      value={{
        fieldConfig,
        prefs,
        updateConfig,
        updatePrefs,

        enabledTabIds,
        requiredTabIds,
        fields,
        isTabFieldEnabled,
        isTabFieldRequired,

        // Dynamic Collections
        genders,
        socialPlatforms,
        relationships,
        socialPlaceholders,
        whatsappTemplates,
        phoneLabels,
        emailLabels,
        addressLabels,
        countryCodes,

        // Derived Lookups
        countryCodesMap,
        defaultPhoneCountryCode,

        // Dynamic Columns
        columnRegistry,
        availableColumns,
        visibleColumns,

        // Mutators
        updateGenders,
        updateSocialPlatforms,
        updateRelationships,
        updateSocialPlaceholders,
        updateWhatsappTemplates,
        updatePhoneLabels,
        updateEmailLabels,
        updateAddressLabels,
        updateCountryCodes,
        updateColumnRegistry,
        updateUserColumnLayout,
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
export function useContactColumns(): Array<{ id: string; label: string; sortField?: string }> {
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

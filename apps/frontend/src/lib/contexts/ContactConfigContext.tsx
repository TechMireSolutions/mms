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
import { loadFieldConfig, saveFieldConfig } from "../contactFieldsStore";
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
  type ValidationError,
} from "@mms/shared";
import { getCollection, getWorkspaceLocalStoragePrefix, saveCollection, getObject, saveObject } from "../db";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { useAuth } from "@/lib/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import {
  applyUserColumnOverlay,
  loadUserColumnPreferences,
  saveUserColumnPreferences,
  saveUserColumnPreferenceList,
} from "@/lib/contacts/columnPreferencesStorage";
import { useContactColumnPrefs, useContactColumnPrefsMutation } from "@/hooks/useContacts";
import {
  CONFIG_KEY,
  DEFAULT_PREFERENCES,
  loadPreferences,
  PREFERENCES_KEY,
  savePreferences,
  syncOptionsInConfig,
} from "../contactConfig/preferencesStorage";
import {
  CONTACT_CONFIG_COLLECTION_KEYS,
  CONTACT_CONFIG_OBJECT_KEYS,
  contactWhatsappTemplatesKey,
  getContactConfigCollectionDefaults,
  getDefaultSocialPlaceholders,
} from "../contactConfig/contactConfigSeeds";

export { calculateProfileCompleteness } from "../contactConfig/profileMetrics";
export {
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
  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useContactColumnPrefs();
  const { mutate: saveColumnPrefs } = useContactColumnPrefsMutation();
  const migratedLocalColumnPrefs = useRef(false);
  const [fieldConfig, setFieldConfigState] = useState<FieldConfig>(() => loadFieldConfig());
  const [userColumnOverlay, setUserColumnOverlay] = useState<ContactColumnPreference[] | null>(null);
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
    const templatesKey = contactWhatsappTemplatesKey(user?.id);
    const loaded = getCollection<WhatsAppTemplate>(templatesKey, contactConfigDefaults.whatsappTemplates);
    setWhatsappTemplatesState(loaded);
  }, [contactConfigDefaults.whatsappTemplates, user?.id]);

  useEffect(() => {
    reloadContactConfigFromDatabaseCache();
  }, [reloadContactConfigFromDatabaseCache]);

  useEffect(() => {
    const handleLocalDatabaseUpdate = () => {
      queueMicrotask(reloadContactConfigFromDatabaseCache);
    };
    window.addEventListener("local-database-update", handleLocalDatabaseUpdate);
    return () => window.removeEventListener("local-database-update", handleLocalDatabaseUpdate);
  }, [reloadContactConfigFromDatabaseCache]);

  useEffect(() => {
    if (!user?.id) {
      setUserColumnOverlay(null);
      migratedLocalColumnPrefs.current = false;
      return;
    }
    const userId = String(user.id);
    if (!columnPrefsLoaded) {
      setUserColumnOverlay(loadUserColumnPreferences(userId));
      return;
    }
    if (serverColumnPrefs && serverColumnPrefs.length > 0) {
      setUserColumnOverlay(serverColumnPrefs);
      saveUserColumnPreferenceList(userId, serverColumnPrefs);
      return;
    }
    const local = loadUserColumnPreferences(userId);
    if (local?.length) {
      setUserColumnOverlay(local);
      if (!migratedLocalColumnPrefs.current) {
        migratedLocalColumnPrefs.current = true;
        saveColumnPrefs(local);
      }
      return;
    }
    setUserColumnOverlay(null);
  }, [user?.id, columnPrefsLoaded, serverColumnPrefs, saveColumnPrefs]);

  // ── Cross-tab sync via storage events ────────────────────────────────────
  useEffect(() => {
    /**
     * Safely parse a storage event's newValue, logging on failure.
     *
     * @param {StorageEvent} e - The storage event.
     * @param {string} label - Human-readable label for error messages.
     * @returns {unknown|null}
     */
    const safeParseEvent = (e: StorageEvent, label: string): unknown | null => {
      if (e.newValue === null) return null;
      try {
        return JSON.parse(e.newValue);
      } catch (err) {
        console.warn(`[ContactConfigContext] Failed to parse storage event for "${label}":`, err);
        return null;
      }
    };

    const handler = (e: StorageEvent) => {
      if (e.key === CONFIG_KEY) {
        const parsed = safeParseEvent(e, "fieldConfig");
        if (parsed) setFieldConfigState(parsed as FieldConfig);
      } else if (e.key === PREFERENCES_KEY) {
        const parsed = safeParseEvent(e, "preferences");
        if (parsed) setPrefsState((currentPreferences) => ({ ...DEFAULT_PREFERENCES, ...currentPreferences, ...(parsed as Partial<ContactPreferences>) }));
      } else if (e.key && e.key.startsWith(getWorkspaceLocalStoragePrefix())) {
        const subKey = e.key.slice(getWorkspaceLocalStoragePrefix().length);
        const parsed = safeParseEvent(e, subKey);
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
    saveUserColumnPreferences(userId, columnRegistry);
    const preferences: ContactColumnPreference[] = columnRegistry.map(({ key, enabled, order }) => ({ key, enabled, order }));
    setUserColumnOverlay(preferences);
    saveColumnPrefs(preferences);
  }, [user?.id, saveColumnPrefs]);

  const viewerRole = user?.role ?? '';

  const enabledTabIds = useMemo(() => {
    if (fieldConfig.formTabs) {
      return new Set(
        fieldConfig.formTabs
          .filter((t) => canViewContactTab(viewerRole, t))
          .map((t) => t.key),
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
    const map: Record<string, string> = {};
    countryCodes.forEach(({ country, code }) => {
      map[country] = code;
    });
    return map;
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
      const field = (fields[tabId] || []).find((f) => f.key === fieldId);
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
      const field = (fields[tabId] || []).find((f) => f.key === fieldId);
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
        (tabFields || []).forEach((f) => {
          if (f.enabled) {
            activeFields.push({ tabId, field: f });
          }
        });
      }
    });

    // 1. Filter out columns from registry that don't match active tabs/fields
    const filteredRegistry = registry.filter((c) => {
      if (c.key === "name") {
        return isTabFieldEnabled("basic", "firstName");
      }
      if (c.key === "phone") {
        return enabledTabIds.has("phones") && isTabFieldEnabled("phones", "number");
      }
      if (c.key === "whatsapp") {
        return enabledTabIds.has("phones") && isTabFieldEnabled("phones", "whatsapp");
      }
      if (c.key === "email") {
        return enabledTabIds.has("emails") && isTabFieldEnabled("emails", "address");
      }
      if (c.key === "city") {
        return enabledTabIds.has("addresses") && isTabFieldEnabled("addresses", "city");
      }
      if (c.key === "state") {
        return enabledTabIds.has("addresses") && isTabFieldEnabled("addresses", "state");
      }
      if (c.key === "country") {
        return enabledTabIds.has("addresses") && isTabFieldEnabled("addresses", "country");
      }
      if (c.key === "line1") {
        return enabledTabIds.has("addresses") && isTabFieldEnabled("addresses", "line1");
      }
      if (c.key === "gender") {
        return isTabFieldEnabled("basic", "gender");
      }
      if (c.key === "dob") {
        return isTabFieldEnabled("basic", "dob");
      }

      if (c.key === "isSyed") {
        return isTabFieldEnabled("basic", "isSyed");
      }
      if (c.key === "socials_platform") {
        return enabledTabIds.has("socials") && isTabFieldEnabled("socials", "platform");
      }
      if (c.key === "socials_url") {
        return enabledTabIds.has("socials") && isTabFieldEnabled("socials", "url");
      }
      if (c.key === "emergency_contact") {
        return enabledTabIds.has("emergency") && isTabFieldEnabled("emergency", "contactId");
      }
      if (c.key === "emergency_relationship") {
        return enabledTabIds.has("emergency") && isTabFieldEnabled("emergency", "relationship");
      }

      // Check if the field is defined and enabled in active fields
      return activeFields.some((af) => af.field.key === c.key);
    });

    // 2. Add columns for any active fields that aren't in the registry yet
    const existingKeys = new Set(filteredRegistry.map((c) => c.key));
    const specialKeys = new Set([
      "firstName", "lastName", "avatar", "number", "address", "line1", "city",
      "state", "country", "label", "platform", "url", "contactId", "relationship"
    ]);

    activeFields.forEach((af) => {
      const fieldKey = af.field.key;
      if (!specialKeys.has(fieldKey) && !existingKeys.has(fieldKey)) {
        const maxOrder = filteredRegistry.reduce((max, c) => Math.max(max, c.order), -1);
        filteredRegistry.push({
          key: fieldKey,
          label: af.field.label,
          enabled: false,
          order: maxOrder + 1,
          sortable: true
        });
      }
    });

    const viewerRole = user?.role ?? '';
    const columnCtx = { fields, enabledTabIds, isTabFieldEnabled };
    return filteredRegistry.filter((c) => canViewContactColumn(viewerRole, c.key, columnCtx));
  }, [fieldConfig.columnRegistry, fields, enabledTabIds, isTabFieldEnabled, user?.role]);

  const columnRegistry = useMemo(
    () => applyUserColumnOverlay(tenantColumnRegistry, userColumnOverlay),
    [tenantColumnRegistry, userColumnOverlay],
  );

  const availableColumns = useMemo(() => {
    return columnRegistry.map(c => ({ id: c.key, label: c.label, sortField: c.sortField }));
  }, [columnRegistry]);

  const visibleColumns = useMemo(() => {
    return columnRegistry
      .filter(c => c.enabled)
      .sort((a, b) => a.order - b.order)
      .map(c => ({ id: c.key, label: c.label, sortField: c.sortField }));
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

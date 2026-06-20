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
  ReactNode,
} from "react";
import { loadFieldConfig, saveFieldConfig } from "../contactFieldsStore";
import {

  GENDERS,
  SOCIAL_PLATFORMS,
  RELATIONSHIPS,
  COUNTRY_CODES,
  LIFECYCLE_STAGES,
  FieldConfig,
  ContactPreferences,
  FieldDefinition,
  WhatsAppTemplate,
  DEFAULT_LIFECYCLE_COLORS,
  DEFAULT_WHATSAPP_TEMPLATES,
  getContactUiStrings,
  ColumnRegistryEntry,
} from "@mms/shared";
import { getCollection, saveCollection, getObject, saveObject } from "../db";
import useGlobalSettings from "@/hooks/useGlobalSettings";
import {
  CONFIG_KEY,
  DEFAULT_PREFS,
  loadPrefs,
  PREFS_KEY,
  syncOptionsInConfig,
  VISIBLE_COLUMNS_KEY,
} from "../contactConfig/prefsStorage";
import {
  buildDynamicContactSchema,
  formatZodIssues,
  type ValidationError,
} from "../contactConfig/validationSchema";

export { calculateProfileCompleteness } from "../contactConfig/profileMetrics";
export {
  buildCustomFieldSchema,
  buildDynamicContactSchema,
  formatZodIssues,
  type ValidationError,
} from "../contactConfig/validationSchema";

// ── Context Interface ─────────────────────────────────────────────────────────
export interface ContactConfigContextType {
  fieldConfig: FieldConfig;
  prefs: ContactPreferences;
  updateConfig: (cfg: FieldConfig) => void;
  updatePrefs: (newPrefs: Partial<ContactPreferences>) => void;

  enabledTabIds: Set<string>;
  requiredTabIds: Set<string>;
  fields: Record<string, FieldDefinition[]>;
  isTabFieldEnabled: (tabId: string, fieldId: string) => boolean;
  isTabFieldRequired: (tabId: string, fieldId: string) => boolean;
  defaultValueFor: (tabId: string, fieldId: string) => unknown;

  // Dynamic Collections
  genders: string[];
  socialPlatforms: string[];
  relationships: string[];
  lifecycleStages: string[];
  lifecycleColors: Record<string, { bg: string; text: string; border: string }>;
  whatsappTemplates: WhatsAppTemplate[];
  phoneLabels: string[];
  emailLabels: string[];
  addressLabels: string[];
  countryCodes: Array<{ country: string; code: string }>;

  // Derived Lookups
  countryCodesMap: Record<string, string>;

  // Dynamic Columns
  columnRegistry: ColumnRegistryEntry[];
  availableColumns: Array<{ id: string; label: string; sortField?: string }>;
  visibleColumns: Array<{ id: string; label: string; sortField?: string }>;

  // Mutators
  updateGenders: (val: string[]) => void;
  updateSocialPlatforms: (val: string[]) => void;
  updateRelationships: (val: string[]) => void;
  updateLifecycleStages: (val: string[]) => void;
  updateLifecycleColors: (val: Record<string, { bg: string; text: string; border: string }>) => void;
  updateWhatsappTemplates: (val: WhatsAppTemplate[]) => void;
  updatePhoneLabels: (val: string[]) => void;
  updateEmailLabels: (val: string[]) => void;
  updateAddressLabels: (val: string[]) => void;
  updateCountryCodes: (val: Array<{ country: string; code: string }>) => void;
  updateVisibleColumns: (cols: Array<{ id: string } | string>) => void;
  updateColumnRegistry: (cols: ColumnRegistryEntry[]) => void;
  updateUiStrings: (strings: Record<string, string>) => void;
  systemSortOptions: Array<{ field: string; label: string }>;
  defaultContactRating: number;
  uiStrings: Record<string, string>;
}

const ContactConfigContext = createContext<ContactConfigContextType | null>(null);

/**
 * Context Provider component that seeds and loads configuration arrays
 * from localStorage-backed database, synchronizing state in real-time.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - Child elements.
 * @returns {React.JSX.Element}
 */
export function ContactConfigProvider({ children }: { children: ReactNode }) {
  const settings = useGlobalSettings();
  const [fieldConfig, setFieldConfigState] = useState<FieldConfig>(() => loadFieldConfig());
  const [prefs, setPrefsState] = useState<ContactPreferences>(() => ({
    ...DEFAULT_PREFS,
    ...loadPrefs(),
  }));

  // ── Dynamic Option Lists ────────────────────────────────────────────────────
  const [genders, setGendersState] = useState<string[]>(() =>
    getCollection("genders", GENDERS)
  );
  const [socialPlatforms, setSocialPlatformsState] = useState<string[]>(() =>
    getCollection("socialPlatforms", SOCIAL_PLATFORMS)
  );
  const [relationships, setRelationshipsState] = useState<string[]>(() =>
    getCollection("relationships", RELATIONSHIPS)
  );
  const [lifecycleStages, setLifecycleStagesState] = useState<string[]>(() =>
    getCollection("lifecycleStages", LIFECYCLE_STAGES)
  );
  const [lifecycleColors, setLifecycleColorsState] = useState<Record<string, { bg: string; text: string; border: string }>>(() =>
    getObject("lifecycleColors", DEFAULT_LIFECYCLE_COLORS)
  );
  const [whatsappTemplates, setWhatsappTemplatesState] = useState<WhatsAppTemplate[]>(() =>
    getCollection("whatsappTemplates", DEFAULT_WHATSAPP_TEMPLATES)
  );
  const [phoneLabels, setPhoneLabelsState] = useState<string[]>(() =>
    getCollection("phoneLabels", ["Mobile", "Home", "Work", "Other"])
  );
  const [emailLabels, setEmailLabelsState] = useState<string[]>(() =>
    getCollection("emailLabels", ["Personal", "Work", "Other"])
  );
  const [addressLabels, setAddressLabelsState] = useState<string[]>(() =>
    getCollection("addressLabels", ["Home", "Work", "Other"])
  );
  const [countryCodes, setCountryCodesState] = useState<Array<{ country: string; code: string }>>(() =>
    getCollection("countryCodes", COUNTRY_CODES)
  );

  // ── Dynamic Columns ─────────────────────────────────────────────────────────
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(() => {
    try {
      let raw = localStorage.getItem(VISIBLE_COLUMNS_KEY);
      if (!raw) {
        const legacy = localStorage.getItem("madrasa_visible_columns_v1");
        if (legacy) {
          raw = legacy;
          localStorage.setItem(VISIBLE_COLUMNS_KEY, legacy);
          try {
            localStorage.removeItem("madrasa_visible_columns_v1");
          } catch (err) {
            console.warn("[ContactConfigContext] Failed to remove legacy visible columns key:", err);
          }
        }
      }
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

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
      } else if (e.key === PREFS_KEY) {
        const parsed = safeParseEvent(e, "prefs");
        if (parsed) setPrefsState((p) => ({ ...DEFAULT_PREFS, ...p, ...(parsed as Partial<ContactPreferences>) }));
      } else if (e.key && e.key.startsWith("mms_")) {
        const subKey = e.key.replace("mms_", "");
        const parsed = safeParseEvent(e, subKey);
        if (parsed) {
          const COLLECTION_SETTERS: Record<string, (val: unknown) => void> = {
            genders: setGendersState as (val: unknown) => void,
            socialPlatforms: setSocialPlatformsState as (val: unknown) => void,
            relationships: setRelationshipsState as (val: unknown) => void,
            lifecycleStages: setLifecycleStagesState as (val: unknown) => void,
            lifecycleColors: setLifecycleColorsState as (val: unknown) => void,
            whatsappTemplates: setWhatsappTemplatesState as (val: unknown) => void,
            phoneLabels: setPhoneLabelsState as (val: unknown) => void,
            emailLabels: setEmailLabelsState as (val: unknown) => void,
            addressLabels: setAddressLabelsState as (val: unknown) => void,
            countryCodes: setCountryCodesState as (val: unknown) => void,
          };
          COLLECTION_SETTERS[subKey]?.(parsed);
        }
      } else if (e.key === VISIBLE_COLUMNS_KEY) {
        const parsed = safeParseEvent(e, "visibleColumnIds");
        if (Array.isArray(parsed)) {
          setVisibleColumnIds(parsed as string[]);
        }
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // ── Mutators ──────────────────────────────────────────────────────────────
  const updateConfig = useCallback((cfg: FieldConfig) => {
    saveFieldConfig(cfg);
    setFieldConfigState(cfg);
  }, []);

  const updatePrefs = useCallback((newPrefs: Partial<ContactPreferences>) => {
    setPrefsState((prev) => {
      const merged = { ...prev, ...newPrefs };
      localStorage.setItem(PREFS_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  const updateGenders = useCallback((val: string[]) => {
    saveCollection("genders", val);
    setGendersState(val);
    setFieldConfigState((prev) => {
      const next = syncOptionsInConfig(prev, "basic", "gender", val);
      saveFieldConfig(next);
      return next;
    });
  }, []);
  const updateSocialPlatforms = useCallback((val: string[]) => {
    saveCollection("socialPlatforms", val);
    setSocialPlatformsState(val);
    setFieldConfigState((prev) => {
      const next = syncOptionsInConfig(prev, "socials", "platform", val);
      saveFieldConfig(next);
      return next;
    });
  }, []);
  const updateRelationships = useCallback((val: string[]) => {
    saveCollection("relationships", val);
    setRelationshipsState(val);
    setFieldConfigState((prev) => {
      const next = syncOptionsInConfig(prev, "emergency", "relationship", val);
      saveFieldConfig(next);
      return next;
    });
  }, []);
  const updateLifecycleStages = useCallback((val: string[]) => {
    saveCollection("lifecycleStages", val);
    setLifecycleStagesState(val);
    setFieldConfigState((prev) => {
      const next = syncOptionsInConfig(prev, "basic", "lifecycleStage", val);
      saveFieldConfig(next);
      return next;
    });
  }, []);
  const updateLifecycleColors = useCallback((val: Record<string, { bg: string; text: string; border: string }>) => {
    saveObject("lifecycleColors", val);
    setLifecycleColorsState(val);
  }, []);
  const updateWhatsappTemplates = useCallback((val: WhatsAppTemplate[]) => {
    saveCollection("whatsappTemplates", val);
    setWhatsappTemplatesState(val);
  }, []);
  const updatePhoneLabels = useCallback((val: string[]) => {
    saveCollection("phoneLabels", val);
    setPhoneLabelsState(val);
    setFieldConfigState((prev) => {
      const next = syncOptionsInConfig(prev, "phones", "label", val);
      saveFieldConfig(next);
      return next;
    });
  }, []);
  const updateEmailLabels = useCallback((val: string[]) => {
    saveCollection("emailLabels", val);
    setEmailLabelsState(val);
    setFieldConfigState((prev) => {
      const next = syncOptionsInConfig(prev, "emails", "label", val);
      saveFieldConfig(next);
      return next;
    });
  }, []);
  const updateAddressLabels = useCallback((val: string[]) => {
    saveCollection("addressLabels", val);
    setAddressLabelsState(val);
    setFieldConfigState((prev) => {
      const next = syncOptionsInConfig(prev, "addresses", "label", val);
      saveFieldConfig(next);
      return next;
    });
  }, []);
  const updateCountryCodes = useCallback((val: Array<{ country: string; code: string }>) => {
    saveCollection("countryCodes", val);
    setCountryCodesState(val);
  }, []);

  const updateVisibleColumns = useCallback((cols: Array<{ id: string } | string>) => {
    const ids = cols.map((c) => (typeof c === "string" ? c : c.id));
    setVisibleColumnIds(ids);
    try {
      localStorage.setItem(VISIBLE_COLUMNS_KEY, JSON.stringify(ids));
    } catch (err) {
      console.error("[ContactConfigContext] Failed to save visible columns to localStorage:", err);
    }
  }, []);

  const updateColumnRegistry = useCallback((cols: ColumnRegistryEntry[]) => {
    updateConfig({ ...fieldConfig, columnRegistry: cols });
  }, [fieldConfig, updateConfig]);

  const updateUiStrings = useCallback((strings: Record<string, string>) => {
    updateConfig({ ...fieldConfig, uiStrings: strings });
  }, [fieldConfig, updateConfig]);

  const enabledTabIds = useMemo(() => {
    if (fieldConfig.formTabs) {
      return new Set(fieldConfig.formTabs.filter(t => t.enabled).map(t => t.key));
    }
    return new Set(fieldConfig.enabledTabs || ["phones", "emails", "addresses", "socials", "emergency"]);
  }, [fieldConfig]);

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

  const uiStrings = useMemo(() => {
    return getContactUiStrings(settings.language, fieldConfig.uiStrings);
  }, [settings.language, fieldConfig.uiStrings]);

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

  const defaultValueFor = useCallback((tabId: string, fieldId: string) => {
    const field = (fields[tabId] || []).find((f) => f.key === fieldId);
    return field?.defaultValue;
  }, [fields]);

  const columnRegistry = useMemo(() => {
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
      if (c.key === "lifecycleStage") {
        return isTabFieldEnabled("basic", "lifecycleStage");
      }
      if (c.key === "rating") {
        return isTabFieldEnabled("basic", "rating");
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

    return filteredRegistry;
  }, [fieldConfig.columnRegistry, fields, enabledTabIds, isTabFieldEnabled]);

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
    { field: "createdAt", label: uiStrings.dateAdded || "Date Added" },
    { field: "updatedAt", label: uiStrings.lastUpdated || "Last Updated" },
  ], [uiStrings]);

  const defaultContactRating = fieldConfig.defaultRating ?? 3;



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
        defaultValueFor,

        // Dynamic Collections
        genders,
        socialPlatforms,
        relationships,
        lifecycleStages,
        lifecycleColors,
        whatsappTemplates,
        phoneLabels,
        emailLabels,
        addressLabels,
        countryCodes,

        // Derived Lookups
        countryCodesMap,

        // Dynamic Columns
        columnRegistry,
        availableColumns,
        visibleColumns,

        // Mutators
        updateGenders,
        updateSocialPlatforms,
        updateRelationships,
        updateLifecycleStages,
        updateLifecycleColors,
        updateWhatsappTemplates,
        updatePhoneLabels,
        updateEmailLabels,
        updateAddressLabels,
        updateCountryCodes,
        updateVisibleColumns,
        updateColumnRegistry,
        updateUiStrings,
        systemSortOptions,
        defaultContactRating,
        uiStrings,
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
  const ctx = useContext(ContactConfigContext);
  if (!ctx) throw new Error("useContactConfig must be used inside <ContactConfigProvider>");
  return ctx;
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

  return useCallback(
    (data: unknown): ValidationError[] => {
      const schema = buildDynamicContactSchema(fieldConfig, enabledTabIds, requiredTabIds, fields);
      const result = schema.safeParse(data);
      if (result.success) {
        return [];
      }
      return formatZodIssues(result.error, data, fields);
    },
    [fieldConfig, enabledTabIds, requiredTabIds, fields],
  );
}


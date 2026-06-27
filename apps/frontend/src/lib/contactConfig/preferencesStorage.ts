import {
  COLOR_PALETTES,
  CONTACTS_MODULE_CONTRACT,
  type ContactPreferences,
  type FieldConfig,
} from "@mms/shared";
import { readObjectLocal, saveObject } from "../db";

function syncOptionsInConfig(config: FieldConfig, tabId: string, fieldKey: string, options: string[]): FieldConfig {
  const nextConfig = { ...config };
  if (nextConfig.fields?.[tabId]) {
    nextConfig.fields = {
      ...nextConfig.fields,
      [tabId]: nextConfig.fields[tabId].map((field) =>
        field.key === fieldKey ? { ...field, options } : field
      ),
    };
  }
  return nextConfig;
}

const PREFERENCES_KEY = "mms_contact_preferences";
const CONFIG_KEY = "mms_contact_field_config";
const PREFERENCES_OBJECT_KEY = CONTACTS_MODULE_CONTRACT.preferencesObjectKey;
const LEGACY_PREFERENCES_OBJECT_KEY = "contact_prefs";

function parseLocalPreferences(): Partial<ContactPreferences> {
  try {
    let raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) {
      const legacy = localStorage.getItem("madrasa_contact_prefs");
      if (legacy) {
        raw = legacy;
        localStorage.setItem(PREFERENCES_KEY, legacy);
        try {
          localStorage.removeItem("madrasa_contact_prefs");
        } catch (error) {
          console.warn("[preferencesStorage] Failed to remove legacy contact preferences key:", error);
        }
      }
    }
    return raw ? (JSON.parse(raw) as Partial<ContactPreferences>) : {};
  } catch {
    return {};
  }
}

/** Loads contact preferences — tenant object authoritative, localStorage offline cache. */
function loadPreferences(): Partial<ContactPreferences> {
  const fromObject = readObjectLocal<Partial<ContactPreferences>>(PREFERENCES_OBJECT_KEY);
  const legacyObject = fromObject ? null : readObjectLocal<Partial<ContactPreferences>>(LEGACY_PREFERENCES_OBJECT_KEY);
  if (!fromObject && legacyObject) {
    saveObject(PREFERENCES_OBJECT_KEY, legacyObject);
  }
  const fromLocal = parseLocalPreferences();
  const storedPreferences = fromObject ?? legacyObject;
  if (storedPreferences && typeof storedPreferences === "object") {
    return { ...fromLocal, ...storedPreferences };
  }
  return fromLocal;
}

/** Persists contact preferences to tenant object + localStorage cache. */
function savePreferences(preferences: ContactPreferences): void {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  saveObject(PREFERENCES_OBJECT_KEY, preferences);
}

const DEFAULT_PREFERENCES: ContactPreferences = {
  defaultCountry: "",
  defaultProvince: "",
  defaultCity: "",
  defaultViewLayout: "list",
  duplicateDetectionThresholdHigh: 90,
  duplicateDetectionThresholdMedium: 75,
  duplicateDetectionColorHigh: COLOR_PALETTES.destructive.bg,
  duplicateDetectionColorMedium: COLOR_PALETTES.warning.bg,
  duplicateDetectionColorLow: COLOR_PALETTES.slate.bg,
  duplicateDetectionScorePhoneEmail: 99,
  duplicateDetectionScoreNamePhone: 95,
  duplicateDetectionScoreNameEmail: 95,
  duplicateDetectionScorePhone: 80,
  duplicateDetectionScoreEmail: 80,
  duplicateDetectionScoreName: 75,
  duplicateDetectionScoreDefault: 70,
  duplicateDetectionFields: ["name", "phone", "email"],
  duplicateDetectionColorWarning: COLOR_PALETTES.warning.bg,
  duplicateDetectionColorWarningText: COLOR_PALETTES.warning.text,
  duplicateDetectionColorSuccess: COLOR_PALETTES.success.bg,
  duplicateDetectionColorSuccessText: COLOR_PALETTES.success.text,
  duplicateDetectionColorHighlight: COLOR_PALETTES.info.bg,
};

export {
  syncOptionsInConfig,
  loadPreferences,
  savePreferences,
  DEFAULT_PREFERENCES,
  PREFERENCES_KEY,
  CONFIG_KEY,
};

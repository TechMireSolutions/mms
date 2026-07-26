import {
  CONTACTS_MODULE_CONTRACT,
  DEFAULT_CONTACT_PREFERENCES,
  type ContactPreferences,
  type FieldConfig,
} from "@mms/shared";
import { readObjectLocal, saveObject } from "@/lib/db";

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
    const raw = localStorage.getItem(PREFERENCES_KEY);
    return raw ? (JSON.parse(raw) as Partial<ContactPreferences>) : {};
  } catch {
    return {};
  }
}

/** Loads contact preferences — tenant object authoritative, localStorage offline cache. */
function loadPreferences(): Partial<ContactPreferences> {
  const fromObject = readObjectLocal<Partial<ContactPreferences>>(PREFERENCES_OBJECT_KEY)
    ?? readObjectLocal<Partial<ContactPreferences>>(LEGACY_PREFERENCES_OBJECT_KEY);
  const fromLocal = parseLocalPreferences();
  return {
    ...DEFAULT_CONTACT_PREFERENCES,
    ...fromLocal,
    ...(fromObject && typeof fromObject === "object" ? fromObject : {}),
  };
}

/** Persists contact preferences to tenant object + localStorage cache. */
function savePreferences(preferences: ContactPreferences): void {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  saveObject(PREFERENCES_OBJECT_KEY, preferences);
}

export {
  syncOptionsInConfig,
  loadPreferences,
  savePreferences,
  DEFAULT_CONTACT_PREFERENCES as DEFAULT_PREFERENCES,
  PREFERENCES_KEY,
  CONFIG_KEY,
};

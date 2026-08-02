import {
  CONTACTS_MODULE_MANIFEST,
  DEFAULT_CONTACT_PREFERENCES,
  normalizeContactPreferences,
  type ContactPreferences,
  type FieldConfig,
} from "@mms/shared";
import { readObjectLocal, saveObject, saveObjectAsync } from "@/lib/db";

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

const PREFERENCES_OBJECT_KEY = CONTACTS_MODULE_MANIFEST.preferencesObjectKey;
const LEGACY_LOCAL_PREFERENCES_KEY = "mms_contact_preferences";
const LEGACY_PREFERENCES_OBJECT_KEY = "contact_prefs";

function parseLegacyLocalPreferences(): Partial<ContactPreferences> {
  try {
    const raw = localStorage.getItem(LEGACY_LOCAL_PREFERENCES_KEY);
    return raw ? (JSON.parse(raw) as Partial<ContactPreferences>) : {};
  } catch {
    return {};
  }
}

/** Loads contact preferences — manifest object key authoritative; legacy keys one-shot merge. */
function loadPreferences(): ContactPreferences {
  const fromObject = readObjectLocal<Partial<ContactPreferences>>(PREFERENCES_OBJECT_KEY)
    ?? readObjectLocal<Partial<ContactPreferences>>(LEGACY_PREFERENCES_OBJECT_KEY);
  const fromLocal = parseLegacyLocalPreferences();
  return normalizeContactPreferences({
    ...fromLocal,
    ...(fromObject && typeof fromObject === "object" ? fromObject : {}),
  });
}

/** Persists contact preferences to the manifest object key only. */
function savePreferences(preferences: ContactPreferences): void {
  localStorage.removeItem(LEGACY_LOCAL_PREFERENCES_KEY);
  saveObject(PREFERENCES_OBJECT_KEY, preferences);
}

/** Persists contact preferences and waits for server synchronization. */
async function savePreferencesAsync(preferences: ContactPreferences): Promise<void> {
  localStorage.removeItem(LEGACY_LOCAL_PREFERENCES_KEY);
  const result = await saveObjectAsync(PREFERENCES_OBJECT_KEY, preferences);
  if (!result.ok) throw new Error("Failed to sync contact preferences");
}

export {
  syncOptionsInConfig,
  loadPreferences,
  savePreferences,
  savePreferencesAsync,
  DEFAULT_CONTACT_PREFERENCES as DEFAULT_PREFERENCES,
};

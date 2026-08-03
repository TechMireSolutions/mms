import {
  DEFAULT_CONTACT_PREFERENCES,
  normalizeContactPreferences,
  type ContactPreferences,
  type FieldConfig,
} from "@mms/shared";
import { apiJson } from "@/lib/apiClient";
import { CONTACTS_API } from "@/tenant/features/contacts/hooks/contactsQueryKeys";

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

const PREFERENCES_API = `${CONTACTS_API}/preferences`;
const LEGACY_LOCAL_PREFERENCES_KEY = "mms_contact_preferences";

let memoryPreferences: ContactPreferences | null = null;

function parseLegacyLocalPreferences(): Partial<ContactPreferences> {
  try {
    const raw = localStorage.getItem(LEGACY_LOCAL_PREFERENCES_KEY);
    return raw ? (JSON.parse(raw) as Partial<ContactPreferences>) : {};
  } catch {
    return {};
  }
}

/** Sync read — last hydrated server prefs or defaults (+ one-shot legacy local merge). */
function loadPreferences(): ContactPreferences {
  if (memoryPreferences) return memoryPreferences;
  const fromLocal = parseLegacyLocalPreferences();
  return normalizeContactPreferences(fromLocal);
}

function setPreferencesMemory(preferences: ContactPreferences): void {
  memoryPreferences = preferences;
  localStorage.removeItem(LEGACY_LOCAL_PREFERENCES_KEY);
}

async function fetchPreferences(signal?: AbortSignal): Promise<ContactPreferences> {
  const response = await apiJson<{ preferences: ContactPreferences }>(PREFERENCES_API, { signal });
  const normalized = normalizeContactPreferences(response.preferences ?? null);
  setPreferencesMemory(normalized);
  return normalized;
}

/** Optimistic local write — prefer savePreferencesAsync for server persistence. */
function savePreferences(preferences: ContactPreferences): void {
  setPreferencesMemory(preferences);
}

async function savePreferencesAsync(preferences: ContactPreferences): Promise<ContactPreferences> {
  const normalized = normalizeContactPreferences(preferences);
  const response = await apiJson<{ success: boolean; preferences: ContactPreferences }>(
    PREFERENCES_API,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalized),
    },
  );
  const saved = normalizeContactPreferences(response.preferences ?? normalized);
  setPreferencesMemory(saved);
  return saved;
}

export {
  syncOptionsInConfig,
  loadPreferences,
  savePreferences,
  savePreferencesAsync,
  fetchPreferences,
  setPreferencesMemory,
  DEFAULT_CONTACT_PREFERENCES as DEFAULT_PREFERENCES,
};

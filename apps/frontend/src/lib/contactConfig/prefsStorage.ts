import { COLOR_PALETTES, type ContactPreferences, type FieldConfig } from "@mms/shared";

function syncOptionsInConfig(cfg: FieldConfig, tabId: string, fieldKey: string, options: string[]): FieldConfig {
  const nextConfig = { ...cfg };
  if (nextConfig.fields?.[tabId]) {
    nextConfig.fields = {
      ...nextConfig.fields,
      [tabId]: nextConfig.fields[tabId].map((f) =>
        f.key === fieldKey ? { ...f, options } : f
      ),
    };
  }
  return nextConfig;
}

// ── Storage keys ─────────────────────────────────────────────────────────────
const PREFS_KEY = "mms_contact_prefs";
const CONFIG_KEY = "mms_contact_field_config";
const VISIBLE_COLUMNS_KEY = "mms_visible_columns_v1";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Loads the contact preferences from localStorage, falling back to empty object.
 *
 * @returns {Partial<ContactPreferences>} The parsed preferences.
 */
function loadPrefs(): Partial<ContactPreferences> {
  try {
    let raw = localStorage.getItem(PREFS_KEY);
    if (!raw) {
      const legacy = localStorage.getItem("madrasa_contact_prefs");
      if (legacy) {
        raw = legacy;
        localStorage.setItem(PREFS_KEY, legacy);
        try {
          localStorage.removeItem("madrasa_contact_prefs");
        } catch (err) {
          console.warn("[ContactConfigContext] Failed to remove legacy contact prefs key:", err);
        }
      }
    }
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const DEFAULT_PREFS: ContactPreferences = {
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
  loadPrefs,
  DEFAULT_PREFS,
  PREFS_KEY,
  CONFIG_KEY,
  VISIBLE_COLUMNS_KEY,
};

import {
  normalizeAppLanguage,
  type AppLanguageCode,
} from "./languageUtils.js";

interface StoredGlobalSettings {
  dateFormat: string;
  timezone: string;
  language: AppLanguageCode;
}

let settingsProvider: (() => StoredGlobalSettings) | null = null;

/**
 * Registers an external settings provider to override `getStoredGlobalSettings` calls.
 * Pass `null` to clear a previously registered provider.
 * This is primarily used in the frontend to inject reactive/preview settings.
 */
export function registerSettingsProvider(
  provider: (() => StoredGlobalSettings) | null,
): void {
  settingsProvider = provider;
}

/**
 * Retrieves the global settings from localStorage (safe for server rendering).
 */
export function getStoredGlobalSettings(): StoredGlobalSettings {
  if (settingsProvider) {
    try {
      return settingsProvider();
    } catch {
      // Fallback if the provider fails
    }
  }

  let dateFormat = "DD/MM/YYYY";
  let timezone = "UTC";
  let language: AppLanguageCode = "en";

  if (typeof window !== "undefined") {
    try {
      let saved: string | null = localStorage.getItem("mms_global_settings");
      if (!saved) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.endsWith(":global_settings")) {
            saved = localStorage.getItem(key);
            break;
          }
        }
      }
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings?.dateFormat) {
          dateFormat = settings.dateFormat;
        }
        if (settings?.timezone) {
          timezone = settings.timezone;
        }
        if (settings?.language) {
          language = normalizeAppLanguage(settings.language);
        }
      }
    } catch {
      // Ignored
    }
  }

  return { dateFormat, timezone, language };
}

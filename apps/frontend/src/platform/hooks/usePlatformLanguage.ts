import { useState, useEffect, useCallback } from 'react';
import { APP_LANGUAGES, normalizeAppLanguage, type AppLanguageCode } from '@mms/shared';

const PLATFORM_LANGUAGE_KEY = 'mms_platform_language';

function readStoredPlatformLanguage(): AppLanguageCode {
  try {
    const raw = localStorage.getItem(PLATFORM_LANGUAGE_KEY);
    return normalizeAppLanguage(raw);
  } catch {
    return 'en';
  }
}

function writeStoredPlatformLanguage(code: AppLanguageCode): void {
  try {
    localStorage.setItem(PLATFORM_LANGUAGE_KEY, code);
    // Notify TranslationContext and any other listeners
    window.dispatchEvent(new StorageEvent('storage', { key: PLATFORM_LANGUAGE_KEY, newValue: code }));
  } catch {
    // ignore
  }
}

/** Persisted platform-console UI language — independent of workspace tenant language. */
export function usePlatformLanguage(): {
  platformLanguage: AppLanguageCode;
  setPlatformLanguage: (code: AppLanguageCode) => void;
  languages: typeof APP_LANGUAGES;
} {
  const [platformLanguage, setPlatformLanguageState] = useState<AppLanguageCode>(
    readStoredPlatformLanguage,
  );

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === PLATFORM_LANGUAGE_KEY) {
        setPlatformLanguageState(normalizeAppLanguage(e.newValue));
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setPlatformLanguage = useCallback((code: AppLanguageCode) => {
    writeStoredPlatformLanguage(code);
    setPlatformLanguageState(code);
  }, []);

  return { platformLanguage, setPlatformLanguage, languages: APP_LANGUAGES };
}

/** Read-only: the current platform UI language (for use outside React). */
export { readStoredPlatformLanguage };

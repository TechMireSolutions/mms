import React, { createContext, useState, useEffect } from 'react';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { useLocation } from 'react-router-dom';
import { useTenant } from '@/lib/contexts/TenantContext';
import { isEntryPath } from '@/lib/config/routes';
import { translateAppParams, registerLanguagePack, type AppTranslationKey } from '@mms/shared';

interface TranslationContextType {
  language: string;
  t: (key: AppTranslationKey, params?: Record<string, string | number>) => string;
  isLoading: boolean;
}

export const TranslationContext = createContext<TranslationContextType | null>(null);

export function TranslationProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const settings = useGlobalSettings();
  const { pathname } = useLocation();
  const { isApex } = useTenant();

  const language = isEntryPath(pathname, { isApex }) ? "en" : settings.language;
  const [loadedLanguages, setLoadedLanguages] = useState<Record<string, boolean>>({ en: true });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (loadedLanguages[language]) return;

    setIsLoading(true);
    let promise: Promise<void>;

    if (language === 'ar') {
      promise = import('@mms/shared/translations/ar').then(m => {
        registerLanguagePack('ar', m.APP_TRANSLATIONS_AR);
      });
    } else if (language === 'ur') {
      promise = import('@mms/shared/translations/ur').then(m => {
        registerLanguagePack('ur', m.APP_TRANSLATIONS_UR);
      });
    } else if (language === 'fa') {
      promise = Promise.all([
        import('@mms/shared/translations/ar').then(m => m.APP_TRANSLATIONS_AR),
        import('@mms/shared/translations/fa').then(m => m.APP_TRANSLATIONS_FA)
      ]).then(([arDict, faDict]) => {
        registerLanguagePack('fa', { ...arDict, ...faDict });
      });
    } else {
      setIsLoading(false);
      return;
    }

    promise
      .then(() => {
        setLoadedLanguages((currentLoadedLanguages) => ({ ...currentLoadedLanguages, [language]: true }));
        setIsLoading(false);
      })
      .catch(err => {
        console.error(`Failed to load translation for ${language}:`, err);
        setIsLoading(false);
      });
  }, [language, loadedLanguages]);

  // Stable t() reference: re-created only when (a) the language changes or
  // (b) this language's pack transitions from unloaded → loaded. Using the
  // boolean value avoids a new function reference on every unrelated state tick.
  const packLoaded = loadedLanguages[language] ?? false;
  const t = React.useCallback(
    (key: AppTranslationKey, params?: Record<string, string | number>) => {
      return translateAppParams(key, language, params);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language, packLoaded], // stable: only changes on language switch or first pack load
  );

  return (
    <TranslationContext.Provider value={{ language, t, isLoading }}>
      {children}
    </TranslationContext.Provider>
  );
}

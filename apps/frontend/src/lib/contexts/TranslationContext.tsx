import React, { createContext, useState, useEffect } from 'react';
import { useGlobalSettings } from '@/tenant/hooks/useGlobalSettings';
import { useLocation } from 'react-router-dom';
import { useTenant } from '@/lib/contexts/TenantContext';
import { isEntryPath } from '@/lib/config/routes';
import {
  translateAppParams,
  registerLanguagePack,
  getLanguageDirection,
  isRtlLanguage,
  applyDocumentLanguage,
  type AppTranslationKey,
  type TranslationArgs,
  type AppLanguageCode,
} from '@mms/shared';
import { ensureLocaleFontsLoaded } from '@/lib/localeFonts';

export type TranslationFunction = <K extends AppTranslationKey>(
  key: K,
  ...args: TranslationArgs<K>
) => string;

interface TranslationContextType {
  language: string;
  t: TranslationFunction;
  isLoading: boolean;
  dir: 'ltr' | 'rtl';
  isRtl: boolean;
}

export const TranslationContext = createContext<TranslationContextType | null>(null);

export function TranslationProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const settings = useGlobalSettings();
  const { pathname } = useLocation();
  const { isApex } = useTenant();

  const language = isEntryPath(pathname, { isApex }) ? "en" : settings.language;
  const [loadedLanguages, setLoadedLanguages] = useState<Record<string, boolean>>({ en: true });
  const [activeLanguage, setActiveLanguage] = useState<AppLanguageCode>("en");
  const [isLoading, setIsLoading] = useState(false);

  const isLanguageLoaded = !!loadedLanguages[language];
  const hasLoadedAnyLanguage = Object.values(loadedLanguages).some(Boolean);

  useEffect(() => {
    if (isLanguageLoaded) {
      setActiveLanguage(language);
      return;
    }

    let active = true;
    setIsLoading(true);
    let promise: Promise<void>;

    if (language === 'ar') {
      promise = import('@mms/shared/translations/ar').then((translationModule) => {
        registerLanguagePack('ar', translationModule.APP_TRANSLATIONS_AR);
      });
    } else if (language === 'ur') {
      promise = import('@mms/shared/translations/ur').then((translationModule) => {
        registerLanguagePack('ur', translationModule.APP_TRANSLATIONS_UR);
      });
    } else if (language === 'fa') {
      // Farsi overrides are merged on top of Arabic translations
      promise = Promise.all([
        import('@mms/shared/translations/ar'),
        import('@mms/shared/translations/fa'),
      ]).then(([arModule, faModule]) => {
        registerLanguagePack('ar', arModule.APP_TRANSLATIONS_AR);
        registerLanguagePack('fa', {
          ...arModule.APP_TRANSLATIONS_AR,
          ...faModule.APP_TRANSLATIONS_FA,
        });
      });
    } else {
      setIsLoading(false);
      return;
    }

    promise
      .then(() => {
        if (!active) return;
        setLoadedLanguages((currentLoadedLanguages) => ({ ...currentLoadedLanguages, [language]: true }));
        setActiveLanguage(language);
        setIsLoading(false);
      })
      .catch((translationError) => {
        if (!active) return;
        console.error(`Failed to load translation for ${language}:`, translationError);
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [language, isLanguageLoaded]);

  useEffect(() => {
    // Sync document attributes (lang, dir, fonts) whenever activeLanguage changes
    applyDocumentLanguage(activeLanguage);
    ensureLocaleFontsLoaded(activeLanguage);
  }, [activeLanguage]);

  const t = React.useCallback(
    <K extends AppTranslationKey>(key: K, ...args: TranslationArgs<K>) => {
      return translateAppParams(key, activeLanguage, ...args);
    },
    [activeLanguage],
  );

  if (!isLanguageLoaded && !hasLoadedAnyLanguage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-muted/30" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Loading translations...
          </p>
        </div>
      </div>
    );
  }

  const dir = getLanguageDirection(activeLanguage);
  const isRtl = isRtlLanguage(activeLanguage);

  return (
    <TranslationContext.Provider value={{ language: activeLanguage, t, isLoading, dir, isRtl }}>
      {children}
    </TranslationContext.Provider>
  );
}


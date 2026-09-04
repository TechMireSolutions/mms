import React, { createContext, useState, useEffect } from 'react';
import { useGlobalSettings } from '@/tenant/hooks/useGlobalSettings';
import { useLocation } from 'react-router-dom';
import { useTenant } from '@/lib/contexts/TenantContext';
import { isEntryPath } from '@/lib/config/routes';
import { shouldForcePlatformEnglish } from '@/platform/lib/themeScope';
import { readStoredPlatformLanguage } from '@/platform/hooks/usePlatformLanguage';
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
import { reportClientError } from '@/lib/clientErrorReporting';

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

function resolveUiLanguage(options: {
  isApex: boolean;
  workspaceLoading: boolean;
  workspace: { enabled?: boolean } | null;
  workspaceLookupFailed: boolean;
  pathname: string;
  settingsLanguage: string;
  platformLanguage: string;
}): string {
  if (
    shouldForcePlatformEnglish({
      isApex: options.isApex,
      workspaceLoading: options.workspaceLoading,
      workspace: options.workspace,
      workspaceLookupFailed: options.workspaceLookupFailed,
    })
  ) {
    // Platform apex: respect the operator's chosen platform language
    return options.platformLanguage;
  }
  // Tenant auth entry (login / 2FA / forgot) stays English before workspace language applies.
  if (isEntryPath(options.pathname, { isApex: false })) {
    return 'en';
  }
  return options.settingsLanguage;
}

export function TranslationProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const settings = useGlobalSettings();
  const { pathname } = useLocation();
  const { isApex, workspace, workspaceLoading, workspaceLookupFailed } = useTenant();

  const [platformLanguage, setPlatformLanguage] = useState<string>(readStoredPlatformLanguage);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'mms_platform_language') {
        setPlatformLanguage(e.newValue ?? 'en');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const language = resolveUiLanguage({
    isApex,
    workspaceLoading,
    workspace,
    workspaceLookupFailed,
    pathname,
    settingsLanguage: settings.language,
    platformLanguage,
  });
  const [loadedLanguages, setLoadedLanguages] = useState<Record<string, boolean>>({ en: true });
  const [activeLanguage, setActiveLanguage] = useState<AppLanguageCode>('en');
  const [isLoading, setIsLoading] = useState(false);

  const isLanguageLoaded = !!loadedLanguages[language];
  const hasLoadedAnyLanguage = Object.values(loadedLanguages).some(Boolean);

  useEffect(() => {
    if (isLanguageLoaded) {
      setActiveLanguage(language as AppLanguageCode);
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
        setActiveLanguage(language as AppLanguageCode);
        setIsLoading(false);
      })
      .catch((translationError) => {
        if (!active) return;
        reportClientError(translationError, { context: 'i18n.loadLanguage', language });
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [language, isLanguageLoaded]);

  useEffect(() => {
    applyDocumentLanguage(activeLanguage);
    ensureLocaleFontsLoaded(activeLanguage);
  }, [activeLanguage]);

  const t = (<K extends AppTranslationKey>(key: K, ...args: TranslationArgs<K>) => {
      return translateAppParams(key, activeLanguage, ...args);
    });

  if (!isLanguageLoaded && !hasLoadedAnyLanguage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-muted/30" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            {translateAppParams('common.loading', 'en')}
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

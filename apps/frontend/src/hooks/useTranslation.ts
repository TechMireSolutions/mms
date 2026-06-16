import { useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { translateAppParams, type AppTranslationKey } from "@mms/shared";
import useGlobalSettings from "./useGlobalSettings";
import { useTenant } from "@/lib/contexts/TenantContext";
import { isEntryPath } from "@/lib/config/routes";

/**
 * Reactive app-wide UI translations from global language preference.
 * Entry routes (login, 2FA, onboarding, apex home) always resolve to English.
 */
export function useTranslation(): {
  language: string;
  t: (key: AppTranslationKey, params?: Record<string, string | number>) => string;
} {
  const settings = useGlobalSettings();
  const { pathname } = useLocation();
  const { isApex } = useTenant();

  const language = useMemo(
    () => (isEntryPath(pathname, { isApex }) ? "en" : settings.language),
    [pathname, isApex, settings.language]
  );

  const t = useCallback(
    (key: AppTranslationKey, params?: Record<string, string | number>) =>
      translateAppParams(key, language, params),
    [language]
  );

  return { language, t };
}

export default useTranslation;

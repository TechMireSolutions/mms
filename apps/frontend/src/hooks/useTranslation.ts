import { useContext } from "react";
import { type AppTranslationKey } from "@mms/shared";
import { TranslationContext } from "@/lib/contexts/TranslationContext";

/**
 * Reactive app-wide UI translations from global language preference.
 * Entry routes (login, 2FA, onboarding, apex home) always resolve to English.
 */
export function useTranslation(): {
  language: string;
  t: (key: AppTranslationKey, params?: Record<string, string | number>) => string;
} {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return {
    language: context.language,
    t: context.t,
  };
}


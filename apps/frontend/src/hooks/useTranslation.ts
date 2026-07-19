import { useContext } from "react";
import { TranslationContext, type TranslationFunction } from "@/lib/contexts/TranslationContext";

/**
 * Reactive app-wide UI translations from global language preference.
 * Entry routes (login, 2FA, onboarding, apex home) always resolve to English.
 */
export function useTranslation(): {
  language: string;
  t: TranslationFunction;
  isLoading: boolean;
  dir: 'ltr' | 'rtl';
  isRtl: boolean;
} {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return {
    language: context.language,
    t: context.t,
    isLoading: context.isLoading,
    dir: context.dir,
    isRtl: context.isRtl,
  };
}


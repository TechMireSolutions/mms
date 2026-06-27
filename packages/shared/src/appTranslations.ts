import { APP_TRANSLATIONS_EN } from "./appTranslationsEn.js";
import { normalizeAppLanguage, type AppLanguageCode } from "./languageUtils.js";
import { normalizeModuleTierTabId } from "./moduleTierTabs.js";

/** App-wide UI string keys (navigation, settings shell, auth, module tiers). */
export type AppTranslationKey = keyof typeof APP_TRANSLATIONS_EN;

// Global runtime cache for loaded translation packs.
// English is statically loaded by default.
const TRANSLATION_CACHE: Record<string, Record<string, string>> = {
  en: APP_TRANSLATIONS_EN,
};

/** Registers an asynchronously-loaded language translation dictionary pack. */
export function registerLanguagePack(lang: string, dict: Record<string, string>): void {
  TRANSLATION_CACHE[lang] = dict;
}

/** Resolves an app-wide UI string for the active language (falls back to English). */
export function translateApp(key: AppTranslationKey, language: string): string {
  const lang = normalizeAppLanguage(language);
  const dict = TRANSLATION_CACHE[lang] || TRANSLATION_CACHE.en;
  return dict[key] ?? TRANSLATION_CACHE.en[key] ?? key;
}

/** Like `translateApp` with `{param}` placeholder substitution. */
export function translateAppParams(
  key: AppTranslationKey,
  language: string,
  params?: Record<string, string | number>
): string {
  let text = translateApp(key, language);
  if (!params) return text;
  for (const [name, value] of Object.entries(params)) {
    text = text.replaceAll(`{${name}}`, String(value));
  }
  return text;
}

const MODULE_NAV_KEYS: Partial<Record<string, AppTranslationKey>> = {
  dashboard: "nav.dashboard",
  contacts: "nav.contacts",
  students: "nav.students",
  teachers: "nav.teachers",
  sessions: "nav.sessions",
  attendance: "nav.attendance",
  enrollment: "nav.enrollments",
  hasanat: "nav.hasanatCards",
  examination: "nav.examinations",
  questionBank: "nav.questionBank",
  finance: "nav.finance",
  accounting: "nav.accounting",
  users: "nav.users",
};

const MODULE_DESC_KEYS: Partial<Record<string, AppTranslationKey>> = {
  dashboard: "module.desc.dashboard",
  contacts: "module.desc.contacts",
  students: "module.desc.students",
  teachers: "module.desc.teachers",
  sessions: "module.desc.sessions",
  attendance: "module.desc.attendance",
  enrollment: "module.desc.enrollment",
  hasanat: "module.desc.hasanat",
  examination: "module.desc.examination",
  questionBank: "module.desc.questionBank",
  finance: "module.desc.finance",
  accounting: "module.desc.accounting",
  users: "module.desc.users",
};

/** Localized system-module label from module id. */
export function translateSystemModuleLabel(
  moduleId: string,
  language: string,
  fallback: string
): string {
  const key = MODULE_NAV_KEYS[moduleId];
  return key ? translateApp(key, language) : fallback;
}

/** Localized system-module description from module id. */
export function translateSystemModuleDescription(
  moduleId: string,
  language: string,
  fallback: string
): string {
  const key = MODULE_DESC_KEYS[moduleId];
  return key ? translateApp(key, language) : fallback;
}

const MODULE_TAB_KEYS: Record<string, AppTranslationKey> = {
  work: "module.work",
  reports: "module.reports",
  setup: "module.setup",
  fields: "module.fields",
  preferences: "module.preferences",
};

/** Maps standard module tab ids to localized labels. */
export function translateModuleTabLabel(
  tabId: string,
  fallback: string,
  language: string
): string {
  const key = MODULE_TAB_KEYS[normalizeModuleTierTabId(tabId)];
  return key ? translateApp(key, language) : fallback;
}

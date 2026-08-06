import { User, GraduationCap, SlidersHorizontal } from "lucide-react";
import {
  STUDENT_TAB_REGISTRY,
  type AppTranslationKey,
  type FieldDefinition,
  type TabDefinition,
} from "@mms/shared";

export type StudentFormTabItem = {
  key: string;
  labelKey?: AppTranslationKey;
  icon: typeof User;
  label: string;
};

const FORM_TAB_ICONS: Record<string, typeof User> = {
  basic: User,
  registration: GraduationCap,
};

const SYSTEM_TAB_KEYS = new Set(STUDENT_TAB_REGISTRY.map((tab) => tab.key));

/** Normalize legacy Setup tab ids to FormModal tab keys (preserve custom_*). */
export function normalizeStudentFormModalTab(tabId: string): string {
  if (tabId === "academic") return "registration";
  if (tabId === "guardian") return "basic";
  return tabId;
}

/**
 * Build FormModal tabs from persisted Setup `formTabs` (includes user-created tabs).
 * `basic` is always shown; other tabs follow `enabled !== false` and optional `enabledTabs` gate.
 */
export function resolveStudentFormModalTabs(
  formTabs?: TabDefinition[],
  enabledTabs?: ReadonlySet<string>,
  _fields?: Record<string, FieldDefinition[]>,
): StudentFormTabItem[] {
  const source =
    formTabs && formTabs.length > 0
      ? formTabs
      : STUDENT_TAB_REGISTRY;

  const sorted = source
    .slice()
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));

  return sorted
    .filter((tab) => {
      if (tab.key === "basic") return true;
      if (tab.enabled === false) return false;
      if (!enabledTabs || enabledTabs.size === 0) return true;
      // System registration uses enabledTabs; custom tabs use formTabs.enabled only.
      if (SYSTEM_TAB_KEYS.has(tab.key)) return enabledTabs.has(tab.key);
      return true;
    })
    .map((tab) => ({
      key: tab.key,
      labelKey: tab.labelKey as AppTranslationKey | undefined,
      label: tab.label,
      icon: FORM_TAB_ICONS[tab.key] ?? SlidersHorizontal,
    }));
}

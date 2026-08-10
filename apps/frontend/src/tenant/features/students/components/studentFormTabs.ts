import { User, GraduationCap, SlidersHorizontal } from "lucide-react";
import {
  STUDENT_TAB_REGISTRY,
  type TabDefinition,
} from "@mms/shared";
import { createFormModalTabs, type FormModalTabItem } from "@/lib/forms/createFormModalTabs";

export type StudentFormTabItem = FormModalTabItem;

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
export const resolveStudentFormModalTabs = createFormModalTabs({
  icons: FORM_TAB_ICONS,
  fallbackIcon: SlidersHorizontal,
  isTabEnabled: (tab, enabledTabs) => {
    if (tab.key === "basic") return true;
    if (tab.enabled === false) return false;
    if (!enabledTabs || enabledTabs.size === 0) return true;
    // System registration uses enabledTabs; custom tabs use formTabs.enabled only.
    if (SYSTEM_TAB_KEYS.has(tab.key)) return enabledTabs.has(tab.key);
    return true;
  },
  resolveSource: (formTabs: TabDefinition[] | undefined) =>
    formTabs && formTabs.length > 0 ? formTabs : STUDENT_TAB_REGISTRY,
});

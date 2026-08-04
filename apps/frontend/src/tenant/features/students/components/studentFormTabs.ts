import { User, GraduationCap } from "lucide-react";
import type { AppTranslationKey } from "@mms/shared";

export type StudentFormTabItem = {
  key: string;
  labelKey?: AppTranslationKey;
  icon: typeof User;
  label: string;
};

/** FormModal tabs keyed to Setup Fields registry (`basic` + `registration`). */
export const STUDENT_FORM_MODAL_TABS: StudentFormTabItem[] = [
  {
    key: "basic",
    labelKey: "students.form.tab.basic",
    icon: User,
    label: "Identity",
  },
  {
    key: "registration",
    labelKey: "students.form.tab.registration",
    icon: GraduationCap,
    label: "Registration",
  },
];

/** Normalize legacy / Setup tab ids to FormModal tab keys. */
export function normalizeStudentFormModalTab(tabId: string): string {
  if (tabId === "registration" || tabId === "academic") return "registration";
  if (tabId === "guardian") return "basic";
  return tabId === "basic" ? "basic" : "basic";
}

/** Identity always shown; Registration only when enabled in Setup (or locked defaults). */
export function resolveStudentFormModalTabs(enabledTabs?: ReadonlySet<string>): StudentFormTabItem[] {
  return STUDENT_FORM_MODAL_TABS.filter((tab) => {
    if (tab.key === "basic") return true;
    if (!enabledTabs || enabledTabs.size === 0) return true;
    return enabledTabs.has(tab.key);
  });
}

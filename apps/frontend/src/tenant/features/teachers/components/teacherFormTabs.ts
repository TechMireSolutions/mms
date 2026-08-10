import { User, Briefcase, SlidersHorizontal } from "lucide-react";
import {
  TEACHERS_TAB_REGISTRY,
  isTeacherLockedEnabledTab,
} from "@mms/shared";
import { createFormModalTabs, type FormModalTabItem } from "@/lib/forms/createFormModalTabs";

export type TeacherFormTabItem = FormModalTabItem;

const FORM_TAB_ICONS: Record<string, typeof User> = {
  basic: User,
  employment: Briefcase,
};

/**
 * Build FormModal tabs from persisted Setup `formTabs` (includes user-created tabs).
 * Locked `basic` is always shown; other tabs must appear in `enabledTabIds`
 * (from {@link resolveTeacherEnabledTabIds}).
 */
export const resolveTeacherFormModalTabs = createFormModalTabs({
  icons: FORM_TAB_ICONS,
  fallbackIcon: SlidersHorizontal,
  isTabEnabled: (tab, enabledTabIds) =>
    isTeacherLockedEnabledTab(tab.key) || Boolean(enabledTabIds?.has(tab.key)),
  resolveSource: (formTabs) =>
    formTabs && formTabs.length > 0 ? formTabs : TEACHERS_TAB_REGISTRY,
});
